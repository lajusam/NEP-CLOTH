import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { cleanReviewText, findDeliveredOrderForProduct, reviewLinkPattern } from "../lib/reviews.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const adminReviewsRouter = Router();

adminReviewsRouter.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please try again later" },
}));
adminReviewsRouter.use(requireAuth, requireAdmin);

const plainText = (max: number) => z.string()
  .transform(cleanReviewText)
  .refine((value) => value.length > 0, "Text cannot be empty")
  .refine((value) => value.length <= max, `Text must be ${max} characters or fewer`)
  .refine((value) => !reviewLinkPattern.test(value), "Links are not allowed");

const hideSchema = z.object({ reason: plainText(200) }).strict();
const replySchema = z.object({ reply: plainText(600) }).strict();

function validationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Invalid review moderation data",
    details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

function getReviewId(req: Request) {
  const value = req.params.id;
  return Array.isArray(value) ? value[0] : value;
}

adminReviewsRouter.get("/summary", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [published, hidden, reported] = await Promise.all([
      prisma.review.count({ where: { status: "published" } }),
      prisma.review.count({ where: { status: "hidden" } }),
      prisma.review.count({ where: { reports: { some: {} } } }),
    ]);
    return res.json({ published, hidden, reported });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageParsed = z.coerce.number().int().min(1).safeParse(req.query.page ?? 1);
    const limitParsed = z.coerce.number().int().min(1).max(100).safeParse(req.query.limit ?? 20);
    const statusParsed = z.enum(["all", "published", "hidden", "reported"]).safeParse(req.query.status ?? "all");
    const ratingParsed = req.query.rating === undefined || req.query.rating === "all"
      ? { success: true as const, data: undefined }
      : z.coerce.number().int().min(1).max(5).safeParse(req.query.rating);
    const reportedParsed = req.query.reported === undefined
      ? { success: true as const, data: undefined }
      : z.enum(["true", "false"]).safeParse(req.query.reported);
    if (!pageParsed.success || !limitParsed.success || !statusParsed.success || !ratingParsed.success || !reportedParsed.success) {
      return res.status(400).json({ error: "Invalid review filters" });
    }
    const page = pageParsed.data;
    const limit = limitParsed.data;
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";
    const where: Record<string, unknown> = {};
    if (statusParsed.data === "published" || statusParsed.data === "hidden") where.status = statusParsed.data;
    if (statusParsed.data === "reported" || reportedParsed.data === "true") where.reports = { some: {} };
    if (reportedParsed.data === "false") where.reports = { none: {} };
    if (ratingParsed.data) where.rating = ratingParsed.data;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true, images: true } },
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { reports: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: review.status,
        hiddenReason: review.hiddenReason,
        createdAt: review.createdAt,
        editedAt: review.editedAt,
        product: { id: review.product.id, name: review.product.name, slug: review.product.slug, thumbnail: review.product.images[0] || null },
        customer: review.user,
        reportCount: review._count.reports,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getReviewId(req);
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true, images: true } },
        user: { select: { id: true, name: true, email: true } },
        reports: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!review) return res.status(404).json({ error: "Review not found" });
    const deliveredOrder = await findDeliveredOrderForProduct(review.userId, review.productId);
    return res.json({ data: {
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      hiddenReason: review.hiddenReason,
      adminReply: review.adminReply,
      adminReplyAt: review.adminReplyAt,
      createdAt: review.createdAt,
      editedAt: review.editedAt,
      product: { id: review.product.id, name: review.product.name, slug: review.product.slug, thumbnail: review.product.images[0] || null },
      customer: review.user,
      orderNumber: deliveredOrder?.order.orderNumber || null,
      reports: review.reports.map((report) => ({ reason: report.reason, note: report.note, createdAt: report.createdAt, customer: report.user })),
    } });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.patch("/:id/hide", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = hideSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const id = getReviewId(req);
    const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Review not found" });
    const review = await prisma.review.update({ where: { id }, data: { status: "hidden", hiddenReason: parsed.data.reason } });
    return res.json({ data: { id: review.id, status: review.status, hiddenReason: review.hiddenReason } });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.patch("/:id/unhide", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getReviewId(req);
    const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Review not found" });
    const review = await prisma.review.update({ where: { id }, data: { status: "published", hiddenReason: null } });
    return res.json({ data: { id: review.id, status: review.status, hiddenReason: null } });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.post("/:id/reply", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const id = getReviewId(req);
    const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Review not found" });
    const review = await prisma.review.update({ where: { id }, data: { adminReply: parsed.data.reply, adminReplyAt: new Date() } });
    return res.json({ data: { id: review.id, adminReply: review.adminReply, adminReplyAt: review.adminReplyAt } });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.delete("/:id/reply", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getReviewId(req);
    const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Review not found" });
    await prisma.review.update({ where: { id }, data: { adminReply: null, adminReplyAt: null } });
    return res.json({ message: "Store reply removed" });
  } catch (err) {
    next(err);
  }
});

adminReviewsRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getReviewId(req);
    const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Review not found" });
    await prisma.review.delete({ where: { id } });
    return res.json({ message: "Review permanently deleted" });
  } catch (err) {
    next(err);
  }
});

export default adminReviewsRouter;
