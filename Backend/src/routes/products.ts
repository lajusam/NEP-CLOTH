import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { cleanReviewText, findDeliveredOrderForProduct, getPublishedReviewStats, reviewLinkPattern, toPublicReview } from "../lib/reviews.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { publicReviewReadLimiter, reviewWriteLimiter } from "../lib/reviewRateLimits.js";
import { loadPublicProductCache } from "../lib/publicProductCache.js";

const productsRouter = Router();

const reviewText = (max: number) => z.string()
  .transform(cleanReviewText)
  .refine((value) => value.length > 0, "Text cannot be empty")
  .refine((value) => value.length <= max, `Text must be ${max} characters or fewer`)
  .refine((value) => !reviewLinkPattern.test(value), "Links are not allowed in reviews");

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: reviewText(80).nullable().optional(),
  body: reviewText(1000).nullable().optional(),
}).strict();

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: reviewText(80).nullable().optional(),
  body: reviewText(1000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

const reviewSortSchema = z.enum(["newest", "highest", "lowest"]).default("newest");

function validationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Invalid review data",
    details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

// --- Validation schemas ---

// Query parameters for GET /products
const listQuerySchema = z.object({
  section: z.enum(["men", "women"]).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /products — list products with filters, pagination, newest first, including variants
productsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { section, category, page, limit } = parsed.data;
    const cacheKey = `list:${section || "*"}:${category || "*"}:${page}:${limit}`;
    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    const payload = await loadPublicProductCache(cacheKey, async () => {
      const where: Record<string, unknown> = { active: true };
      if (section) where.section = section;
      if (category) where.category = category;

      const total = await prisma.product.count({ where });
      const products = await prisma.product.findMany({
        where,
        include: { variants: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
      const reviewStats = await getPublishedReviewStats(products.map((product) => product.id));
      return {
        data: products.map((product) => ({ ...product, ...reviewStats.get(product.id) })),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Public reviews include only published content and never expose account or order identifiers.
productsRouter.get("/:slug/reviews", publicReviewReadLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const product = await prisma.product.findFirst({ where: { slug, active: true }, select: { id: true } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const pageParsed = z.coerce.number().int().min(1).safeParse(req.query.page ?? 1);
    const limitParsed = z.coerce.number().int().min(1).max(20).safeParse(req.query.limit ?? 10);
    const sortParsed = reviewSortSchema.safeParse(req.query.sort ?? "newest");
    if (!pageParsed.success || !limitParsed.success || !sortParsed.success) {
      return res.status(400).json({ error: "Invalid review query parameters" });
    }
    const { page, limit, sort } = { page: pageParsed.data, limit: limitParsed.data, sort: sortParsed.data };
    const groups = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, status: "published" },
      _count: { _all: true },
    });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let count = 0;
    let ratingTotal = 0;
    for (const group of groups) {
      distribution[group.rating as 1 | 2 | 3 | 4 | 5] = group._count._all;
      count += group._count._all;
      ratingTotal += group.rating * group._count._all;
    }
    const totalPages = Math.max(1, Math.ceil(count / limit));
    const items = await prisma.review.findMany({
      where: { productId: product.id, status: "published" },
      include: { user: { select: { name: true } } },
      orderBy: sort === "highest" ? [{ rating: "desc" }, { createdAt: "desc" }] : sort === "lowest" ? [{ rating: "asc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });
    return res.json({
      summary: { average: count ? Math.round((ratingTotal / count) * 10) / 10 : null, count, distribution },
      items: items.map(toPublicReview),
      page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:slug/reviews/eligibility", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const product = await prisma.product.findFirst({ where: { slug, active: true }, select: { id: true } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!req.profile) return res.json({ canReview: false, reason: "login_required", myReview: null });

    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: req.profile.id } } });
    if (existing) {
      return res.json({
        canReview: false,
        reason: "already_reviewed",
        myReview: { id: existing.id, rating: existing.rating, title: existing.title, body: existing.body, createdAt: existing.createdAt, editedAt: existing.editedAt },
      });
    }
    const deliveredOrder = await findDeliveredOrderForProduct(req.profile.id, product.id);
    if (!deliveredOrder) return res.json({ canReview: false, reason: "not_purchased", myReview: null });
    return res.json({ canReview: true, reason: null, myReview: null });
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/:slug/reviews", requireAuth, reviewWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const product = await prisma.product.findFirst({ where: { slug, active: true }, select: { id: true } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    const userId = req.profile!.id;
    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId } } });
    if (existing) return res.status(409).json({ error: "You have already reviewed this product", reason: "already_reviewed" });
    if (!await findDeliveredOrderForProduct(userId, product.id)) {
      return res.status(403).json({ error: "Only customers who received this product can review it", reason: "not_purchased" });
    }
    const review = await prisma.review.create({
      data: { productId: product.id, userId, rating: parsed.data.rating, title: parsed.data.title || null, body: parsed.data.body || null },
      include: { user: { select: { name: true } } },
    });
    return res.status(201).json({ data: toPublicReview(review) });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return res.status(409).json({ error: "You have already reviewed this product", reason: "already_reviewed" });
    }
    next(err);
  }
});

// GET /products/:slug — single product with variants by slug (active only)
productsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    if (!slug) {
      res.status(400).json({ error: "Slug parameter is required" });
      return;
    }

    const cacheKey = `detail:${slug}`;
    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    const payload = await loadPublicProductCache(cacheKey, async () => {
      const product = await prisma.product.findFirst({
        where: { slug, active: true },
        include: { variants: true },
      });
      if (!product) return null;
      const stats = (await getPublishedReviewStats([product.id])).get(product.id)!;
      return { data: { ...product, ...stats } };
    });
    if (!payload) {
      res.status(404).json({ error: `Product with slug "${slug}" not found` });
      return;
    }
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default productsRouter;
