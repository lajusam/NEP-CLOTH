import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { detectImageMagicBytes, uploadProductImage } from "../lib/storage.js";

const adminRouter = Router();

// --- Rate Limiting for Admin Endpoints ---
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15 minutes
  message: { error: "Too many admin requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// All admin routes require rate limiting, authentication, and admin role
adminRouter.use(adminLimiter);
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Multer memory storage configuration (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// --- Helper Functions ---

/**
 * Generate a URL-friendly slug from product name.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug by appending a suffix if collision occurs.
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "product";
  let candidate = base;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

// --- Validation Schemas ---

const variantItemSchema = z.object({
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().min(1, "Description is required"),
  section: z.enum(["men", "women"], { message: "Section must be 'men' or 'women'" }),
  category: z.string().trim().min(1, "Category is required"),
  price: z.number().int("Price must be an integer in paisa").positive("Price must be greater than 0"),
  rating: z.number().min(0).max(5).optional().nullable(),
  images: z.array(z.string().min(1)).default([]),
  variants: z.array(variantItemSchema).min(1, "At least one variant is required"),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  section: z.enum(["men", "women"]).optional(),
  category: z.string().trim().min(1).optional(),
  price: z.number().int("Price must be an integer in paisa").positive("Price must be greater than 0").optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  images: z.array(z.string().min(1)).optional(),
  active: z.boolean().optional(),
});

const updateVariantSchema = z.object({
  size: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative").optional(),
});

// --- Routes ---

/**
 * GET /admin/products
 * Fetch all products including inactive, with variants, search, filters, pagination.
 */
adminRouter.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { section, category, active, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10) || 50));

    const where: Record<string, unknown> = {};

    if (section && typeof section === "string" && section !== "ALL") {
      where.section = section.toLowerCase();
    }

    if (category && typeof category === "string" && category !== "ALL") {
      where.category = {
        equals: category.toLowerCase(),
        mode: "insensitive",
      };
    }

    if (active !== undefined && active !== "" && active !== "ALL") {
      if (active === "true" || active === "ACTIVE") {
        where.active = true;
      } else if (active === "false" || active === "ARCHIVED") {
        where.active = false;
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/products/:id
 * Single product with all variants by ID (active or inactive).
 */
adminRouter.get("/products/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/products
 * Create a new product with unique slug and variants.
 */
adminRouter.post("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { name, description, section, category, price, rating, images, variants } = parsed.data;

    // Check for duplicate size+color in submitted variants
    const seenCombos = new Set<string>();
    for (const v of variants) {
      const key = `${v.size.toLowerCase()}_${v.color.toLowerCase()}`;
      if (seenCombos.has(key)) {
        res.status(400).json({
          error: `Duplicate variant: size "${v.size}" with color "${v.color}" is listed more than once`,
        });
        return;
      }
      seenCombos.add(key);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name);

    // Create product and variants in a single transaction
    const newProduct = await prisma.product.create({
      data: {
        slug,
        name,
        description,
        section,
        category: category.toLowerCase(),
        price,
        rating: rating ?? null,
        images,
        active: true,
        variants: {
          create: variants.map((v) => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    res.status(201).json({ data: newProduct });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /admin/products/:id
 * Edit product fields. Slug remains intact.
 */
adminRouter.patch("/products/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.section !== undefined) updateData.section = parsed.data.section;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category.toLowerCase();
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
    if (parsed.data.rating !== undefined) updateData.rating = parsed.data.rating;
    if (parsed.data.images !== undefined) updateData.images = parsed.data.images;
    if (parsed.data.active !== undefined) updateData.active = parsed.data.active;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { variants: true },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/products/:id/archive
 * Soft-delete / archive a product.
 */
adminRouter.post("/products/:id/archive", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: false },
      include: { variants: true },
    });

    res.json({ message: "Product archived successfully", data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/products/:id/restore
 * Restore an archived product.
 */
adminRouter.post("/products/:id/restore", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: true },
      include: { variants: true },
    });

    res.json({ message: "Product restored successfully", data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/products/:id
 * Alias to archive — never hard-delete products with OrderItem history.
 */
adminRouter.delete("/products/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: false },
      include: { variants: true },
    });

    res.json({ message: "Product archived successfully", data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/products/:id/variants
 * Add a new variant to an existing product. Prevents duplicate size+color.
 */
adminRouter.post("/products/:id/variants", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = variantItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { size, color, stock } = parsed.data;

    // Check duplicate size+color combination
    const existing = await prisma.variant.findFirst({
      where: {
        productId,
        size: { equals: size, mode: "insensitive" },
        color: { equals: color, mode: "insensitive" },
      },
    });

    if (existing) {
      res.status(400).json({
        error: `Variant with size "${size}" and color "${color}" already exists for this product`,
      });
      return;
    }

    const newVariant = await prisma.variant.create({
      data: {
        productId,
        size,
        color,
        stock,
      },
    });

    res.status(201).json({ data: newVariant });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /admin/variants/:id
 * Edit variant stock, size, or color. Stock must be an integer >= 0.
 * Prevents duplicate size+color combination for the same product.
 */
adminRouter.patch("/variants/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = updateVariantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    const targetSize = parsed.data.size ?? variant.size;
    const targetColor = parsed.data.color ?? variant.color;

    if (parsed.data.size !== undefined || parsed.data.color !== undefined) {
      const conflict = await prisma.variant.findFirst({
        where: {
          productId: variant.productId,
          size: { equals: targetSize, mode: "insensitive" },
          color: { equals: targetColor, mode: "insensitive" },
          id: { not: variant.id },
        },
      });

      if (conflict) {
        res.status(400).json({
          error: `Another variant with size "${targetSize}" and color "${targetColor}" already exists`,
        });
        return;
      }
    }

    const updateData: { size?: string; color?: string; stock?: number } = {};
    if (parsed.data.size !== undefined) updateData.size = parsed.data.size;
    if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
    if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;

    const updated = await prisma.variant.update({
      where: { id },
      data: updateData,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/variants/:id
 * Delete variant if not in OrderItem history.
 */
adminRouter.delete("/variants/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    const orderedCount = await prisma.orderItem.count({ where: { variantId: id } });
    if (orderedCount > 0) {
      res.status(400).json({
        error: "Cannot delete variant that exists in customer order history. Set its stock to 0 instead.",
      });
      return;
    }

    await prisma.variant.delete({ where: { id } });
    res.json({ message: "Variant deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/uploads/image
 * Accepts multipart/form-data image up to 5MB.
 * Checks real file type (magic bytes) for jpeg, png, webp.
 * Uploads to Supabase Storage "product-images" bucket and returns public URL.
 */
adminRouter.post(
  "/uploads/image",
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided in 'image' field" });
        return;
      }

      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({ error: "Image size exceeds 5MB limit" });
        return;
      }

      // Check real magic bytes
      const detected = detectImageMagicBytes(req.file.buffer);
      if (!detected) {
        res.status(400).json({
          error: "Invalid file format. Only JPEG, PNG, and WebP images are allowed.",
        });
        return;
      }

      // Upload to Supabase Storage with random filename
      const publicUrl = await uploadProductImage(req.file.buffer, detected.mime, detected.ext);

      res.json({
        url: publicUrl,
        format: detected.ext,
        size: req.file.size,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// PART A: Orders Management Endpoints
// ============================================================================

/**
 * GET /admin/orders
 * Returns all orders with customer info, item count, search & status filters, date range, pagination.
 */
adminRouter.get("/orders", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = (req.query.status as string)?.trim().toLowerCase();
    const search = (req.query.search as string)?.trim();
    const from = (req.query.from || req.query.dateFrom) as string;
    const to = (req.query.to || req.query.dateTo) as string;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address,
      city: o.city,
      total: o.total,
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
      user: o.user,
    }));

    res.json({
      orders: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/orders/:id
 * Full details with snapshot items, customer and shipping details, status history.
 */
adminRouter.get("/orders/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const history =
      Array.isArray(order.statusHistory) && (order.statusHistory as any[]).length > 0
        ? order.statusHistory
        : [
            {
              status: order.status,
              changedAt: order.createdAt.toISOString(),
              changedBy: "customer",
            },
          ];

    res.json({
      ...order,
      statusHistory: history,
    });
  } catch (err) {
    next(err);
  }
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const updateStatusSchema = z.object({
  status: z.enum(["confirmed", "shipped", "delivered", "cancelled"], {
    message: "Invalid status value. Must be confirmed, shipped, delivered, or cancelled",
  }),
  note: z.string().optional(),
});

/**
 * PATCH /admin/orders/:id/status
 * Updates status with transition rules and stock restoration on cancellation.
 */
adminRouter.patch("/orders/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid status request",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { status: nextStatus, note } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        include: { items: true },
      });

      if (!order) {
        const error: any = new Error("Order not found");
        error.status = 404;
        throw error;
      }

      const currentStatus = order.status.toLowerCase();

      if (currentStatus === "delivered" || currentStatus === "cancelled") {
        const error: any = new Error(
          `Cannot change status: order is already ${currentStatus} (terminal status).`
        );
        error.status = 400;
        throw error;
      }

      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        const error: any = new Error(
          `Cannot transition order from '${currentStatus}' to '${nextStatus}'. Allowed: ${
            allowedNext.join(", ") || "none"
          }.`
        );
        error.status = 400;
        throw error;
      }

      // If cancelling: restore stock for each variant
      if (nextStatus === "cancelled") {
        for (const item of order.items) {
          await tx.variant.updateMany({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }

      // Update audit trail
      const currentHistory =
        Array.isArray(order.statusHistory) && (order.statusHistory as any[]).length > 0
          ? (order.statusHistory as any[])
          : [
              {
                status: order.status,
                changedAt: order.createdAt.toISOString(),
                changedBy: "customer",
              },
            ];

      const newHistoryEntry = {
        status: nextStatus,
        changedAt: new Date().toISOString(),
        changedBy: req.user?.email || req.user?.id || "admin",
        ...(note ? { note } : {}),
      };

      const updatedHistory = [...currentHistory, newHistoryEntry];

      // Mark paymentStatus as "paid" upon delivery for Cash on Delivery
      const paymentStatus = nextStatus === "delivered" ? "paid" : order.paymentStatus;

      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          paymentStatus,
          statusHistory: updatedHistory,
        },
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    res.json({
      message: `Order status updated to ${nextStatus}`,
      order: result,
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// ============================================================================
// PART B: Dashboard Metrics Endpoint
// ============================================================================

/**
 * GET /admin/dashboard
 * Summary metrics: revenue, order counts, low stock alerts, recent orders, 7D and 30D sales trends.
 */
adminRouter.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      deliveredRevenueSum,
      totalOrders,
      pendingOrders,
      lowStockVariants,
      recentOrders,
      last30DaysOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "delivered" },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.variant.count({ where: { stock: { lte: 3 } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: "cancelled" },
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRevenue = deliveredRevenueSum._sum.total || 0;

    // Build 7D and 30D daily sales map
    const dailySalesMap = new Map<string, number>();
    for (const o of last30DaysOrders) {
      const dateKey = o.createdAt.toISOString().slice(0, 10);
      dailySalesMap.set(dateKey, (dailySalesMap.get(dateKey) || 0) + o.total);
    }

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    // 7D daily series
    const sales7d: Array<{ day: string; date: string; sales: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];
      sales7d.push({
        day: dayName,
        date: dateKey,
        sales: dailySalesMap.get(dateKey) || 0,
      });
    }

    // 30D daily series
    const sales30d: Array<{ day: string; date: string; sales: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      sales30d.push({
        day: label,
        date: dateKey,
        sales: dailySalesMap.get(dateKey) || 0,
      });
    }

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        lowStockVariants,
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      })),
      sales7d,
      sales30d,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PART C: Customers Endpoint
// ============================================================================

/**
 * GET /admin/customers
 * Returns customer profiles with order counts, total spent, phone, joined date, pagination, and search.
 */
adminRouter.get("/customers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, profiles] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              phone: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    const customers = profiles.map((p) => {
      const orderCount = p.orders.length;
      const totalSpent = p.orders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + o.total, 0);
      const phone = p.orders[0]?.phone || "—";
      const lastOrderDate = p.orders[0]?.createdAt ? p.orders[0].createdAt.toISOString() : null;

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone,
        role: p.role,
        orderCount,
        totalSpent,
        joinedAt: p.createdAt.toISOString(),
        lastOrderDate,
      };
    });

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
