import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

function perUserKey(req: Request) {
  return req.profile?.id ? `user:${req.profile.id}` : `ip:${ipKeyGenerator(req.ip || "127.0.0.1")}`;
}

export const publicReviewReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many review requests. Please try again in a minute." },
});

export const reviewWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: perUserKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You have reached the review limit. Please try again later." },
});

export const reviewReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: perUserKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You have reached the report limit. Please try again later." },
});
