import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";

const authRouter = Router();

// Rate limiter for /auth routes to protect against abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

authRouter.use(authLimiter);

// GET /auth/me — returns current user's profile { id, email, name, role }
authRouter.get("/me", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = req.profile;
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
    });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
