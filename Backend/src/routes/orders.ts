import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const ordersRouter = Router();

// Server-side shipping fee constant in paisa (NPR 0 for free shipping)
export const DEFAULT_SHIPPING_FEE = 0;

// Rate limiter for order placement to prevent spam/abuse
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 order requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many order attempts, please try again later." },
});

// Nepali mobile number regex: optional +977, starts with 96/97/98 followed by 8 digits
const NEPALI_PHONE_REGEX = /^(?:\+977[- ]?)?9[678]\d{8}$/;

// Zod schema for incoming order creation
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "variantId is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Quantity cannot exceed 10"),
      })
    )
    .min(1, "Order must contain at least 1 item")
    .max(20, "Order cannot contain more than 20 items"),
  shipping: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
    phone: z
      .string()
      .trim()
      .regex(NEPALI_PHONE_REGEX, "Phone number must be a valid 10-digit Nepali mobile number (e.g., 98XXXXXXXX)"),
    address: z.string().trim().min(3, "Address must be at least 3 characters").max(200, "Address is too long"),
    city: z.string().trim().min(2, "City/District must be at least 2 characters").max(100, "City is too long"),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
  }),
});

// Helper custom error for stock rejection
class OutOfStockError extends Error {
  item: {
    variantId: string;
    productName: string;
    size: string;
    color: string;
    availableStock: number;
    requestedQuantity: number;
  };

  constructor(item: OutOfStockError["item"]) {
    super(`Item "${item.productName}" (${item.size}/${item.color}) is out of stock. Only ${item.availableStock} available.`);
    this.name = "OutOfStockError";
    this.item = item;
  }
}

/**
 * Generates human-friendly order number e.g. "NEP-000123" safely
 */
async function generateOrderNumber(tx: any): Promise<string> {
  const count = await tx.order.count();
  const baseNum = count + 1;
  const candidate = `NEP-${String(baseNum).padStart(6, "0")}`;

  // Check if by any chance this exists (e.g. from previous tests)
  const existing = await tx.order.findUnique({ where: { orderNumber: candidate } });
  if (!existing) {
    return candidate;
  }

  // Fallback with random entropy
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NEP-${String(baseNum).padStart(4, "0")}-${randomSuffix}`;
}

// -----------------------------------------------------------------------------
// POST /orders — Place a new Cash on Delivery order
// -----------------------------------------------------------------------------
ordersRouter.post("/", requireAuth, createOrderLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid order data",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const { items: rawItems, shipping } = parsed.data;

    // Merge duplicate variantIds
    const mergedMap = new Map<string, number>();
    for (const item of rawItems) {
      const current = mergedMap.get(item.variantId) || 0;
      mergedMap.set(item.variantId, current + item.quantity);
    }

    // Verify merged quantity doesn't exceed 10
    const items: Array<{ variantId: string; quantity: number }> = [];
    for (const [variantId, quantity] of mergedMap.entries()) {
      if (quantity > 10) {
        res.status(400).json({
          error: `Item quantity for variant ${variantId} exceeds maximum allowed of 10 units.`,
        });
        return;
      }
      items.push({ variantId, quantity });
    }

    if (items.length > 20) {
      res.status(400).json({ error: "Order cannot contain more than 20 distinct items." });
      return;
    }

    // Execute everything in a single atomic database transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch all variants with their products
      const variantIds = items.map((i) => i.variantId);
      const variants = await tx.variant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      if (variants.length !== variantIds.length) {
        const foundIds = new Set(variants.map((v) => v.id));
        const missing = variantIds.filter((id) => !foundIds.has(id));
        throw new Error(`One or more variants could not be found: ${missing.join(", ")}`);
      }

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 2. Perform atomic conditional stock decrement for each item
      for (const item of items) {
        const variant = variantMap.get(item.variantId)!;

        // Atomic decrement: only succeeds if stock >= item.quantity
        const updateResult = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          // Stock was insufficient, fetch latest stock to report accurately
          const latest = await tx.variant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          throw new OutOfStockError({
            variantId: item.variantId,
            productName: variant.product.name,
            size: variant.size,
            color: variant.color,
            availableStock: latest?.stock ?? 0,
            requestedQuantity: item.quantity,
          });
        }
      }

      // 3. Compute subtotal, shippingFee, and total from database records ONLY
      let subtotal = 0;
      const orderItemsData = items.map((item) => {
        const variant = variantMap.get(item.variantId)!;
        const unitPrice = variant.product.price; // price in paisa
        subtotal += unitPrice * item.quantity;

        const mainImage = Array.isArray(variant.product.images) && variant.product.images.length > 0
          ? variant.product.images[0]
          : "";

        return {
          variantId: variant.id,
          productName: variant.product.name,
          size: variant.size,
          color: variant.color,
          unitPrice,
          quantity: item.quantity,
          image: mainImage,
        };
      });

      const shippingFee = DEFAULT_SHIPPING_FEE;
      const total = subtotal + shippingFee;

      // 4. Generate order number
      const orderNumber = await generateOrderNumber(tx);

      // 5. Create Order and OrderItems
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          status: "pending",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          subtotal,
          shippingFee,
          total,
          customerName: shipping.name,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          notes: shipping.notes || null,
          statusHistory: [
            {
              status: "pending",
              changedAt: new Date().toISOString(),
              changedBy: "customer",
            },
          ],
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (err: any) {
    if (err instanceof OutOfStockError) {
      res.status(409).json({
        error: "Item out of stock",
        message: err.message,
        outOfStockItem: err.item,
      });
      return;
    }

    if (err?.message?.includes("One or more variants could not be found")) {
      res.status(400).json({ error: err.message });
      return;
    }

    next(err);
  }
});

// -----------------------------------------------------------------------------
// GET /orders/me — Fetch all orders for the authenticated user
// -----------------------------------------------------------------------------
ordersRouter.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// GET /orders/:id — Fetch single order by id or orderNumber (strictly owned by user)
// -----------------------------------------------------------------------------
ordersRouter.get("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const param = req.params.id;
    const orderId = Array.isArray(param) ? param[0] : param;

    if (!orderId) {
      res.status(400).json({ error: "Order ID is required" });
      return;
    }

    // Look up by id or orderNumber, strictly scoped to current user
    const order = await prisma.order.findFirst({
      where: {
        userId: req.user!.id,
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
      },
    });

    // Return 404 if not found OR belongs to another user (never disclose existence)
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

export default ordersRouter;
