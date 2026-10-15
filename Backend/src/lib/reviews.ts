import prisma from "./prisma.js";

export const reviewLinkPattern = /(?:https?:\/\/|www\.)\S+|(?:^|\s)[\w-]+(?:\.[\w-]+)+(?:\/\S*)?/i;

export function cleanReviewText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function reviewDisplayName(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  if (!parts.length) return "Verified customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts.at(-1)![0].toUpperCase()}.`;
}

export async function getPublishedReviewStats(productIds: string[]) {
  const result = new Map<string, { ratingAverage: number | null; reviewCount: number }>();
  for (const id of productIds) result.set(id, { ratingAverage: null, reviewCount: 0 });
  if (!productIds.length) return result;

  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: "published" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const group of groups) {
    const reviewCount = group._count._all;
    result.set(group.productId, {
      ratingAverage: reviewCount ? Math.round((group._avg.rating || 0) * 10) / 10 : null,
      reviewCount,
    });
  }
  return result;
}

export async function findDeliveredOrderForProduct(userId: string, productId: string) {
  const variants = await prisma.variant.findMany({ where: { productId }, select: { id: true } });
  if (!variants.length) return null;
  return prisma.orderItem.findFirst({
    where: {
      variantId: { in: variants.map((variant) => variant.id) },
      order: { userId, status: "delivered" },
    },
    select: { orderId: true, order: { select: { orderNumber: true } } },
  });
}

export function toPublicReview(review: {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: Date;
  editedAt: Date | null;
  adminReply: string | null;
  adminReplyAt: Date | null;
  user: { name: string | null };
}) {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    displayName: reviewDisplayName(review.user.name),
    verified: true as const,
    createdAt: review.createdAt,
    editedAt: review.editedAt,
    adminReply: review.adminReply,
    adminReplyAt: review.adminReplyAt,
  };
}
