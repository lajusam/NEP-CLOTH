import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { cleanReviewText, reviewDisplayName, reviewLinkPattern } from "../lib/reviews.js";
import { reviewReportLimiter, reviewWriteLimiter } from "../lib/reviewRateLimits.js";
import { requireAuth } from "../middleware/auth.js";

const reviewsRouter = Router();

const reviewText = (max: number) => z.string()
  .transform(cleanReviewText)
  .refine((value) => value.length > 0, "Text cannot be empty")
  .refine((value) => value.length <= max, `Text must be ${max} characters or fewer`)
  .refine((value) => !reviewLinkPattern.test(value), "Links are not allowed");

const editReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: reviewText(80).nullable().optional(),
  body: reviewText(1000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

const reportSchema = z.object({
  reason: z.enum(["spam", "abusive", "personal_info", "not_a_review", "other"]),
  note: reviewText(200).nullable().optional(),
}).strict();

function validationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Invalid review data",
    details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

reviewsRouter.get("/me/reviews", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.profile!.id },
      include: { product: { select: { name: true, slug: true, images: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ data: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      createdAt: review.createdAt,
      editedAt: review.editedAt,
      product: { name: review.product.name, slug: review.product.slug, thumbnail: review.product.images[0] || null },
    })) });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.patch("/reviews/:id", requireAuth, reviewWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = editReviewSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const current = await prisma.review.findFirst({ where: { id, userId: req.profile!.id } });
    if (!current) return res.status(404).json({ error: "Review not found" });
    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...parsed.data,
        editedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    });
    return res.json({ data: {
      id: updated.id,
      rating: updated.rating,
      title: updated.title,
      body: updated.body,
      displayName: reviewDisplayName(updated.user.name),
      verified: true,
      createdAt: updated.createdAt,
      editedAt: updated.editedAt,
      adminReply: updated.adminReply,
      adminReplyAt: updated.adminReplyAt,
    } });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.delete("/reviews/:id", requireAuth, reviewWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const review = await prisma.review.findFirst({ where: { id, userId: req.profile!.id }, select: { id: true } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    await prisma.review.delete({ where: { id } });
    return res.json({ message: "Review deleted" });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post("/reviews/:id/report", requireAuth, reviewReportLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const review = await prisma.review.findFirst({ where: { id, status: "published" }, select: { id: true, userId: true } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.userId === req.profile!.id) return res.status(403).json({ error: "You cannot report your own review" });
    const existing = await prisma.reviewReport.findUnique({ where: { reviewId_userId: { reviewId: id, userId: req.profile!.id } } });
    if (existing) return res.status(409).json({ error: "You have already reported this review" });
    const report = await prisma.reviewReport.create({
      data: { reviewId: id, userId: req.profile!.id, reason: parsed.data.reason, note: parsed.data.note || null },
    });
    return res.status(201).json({ data: { id: report.id, message: "Report received" } });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return res.status(409).json({ error: "You have already reported this review" });
    }
    next(err);
  }
});

export default reviewsRouter;
