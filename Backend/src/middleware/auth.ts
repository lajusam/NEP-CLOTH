import { Request, Response, NextFunction } from "express";
import { User } from "@supabase/supabase-js";
import { Profile } from "@prisma/client";
import { supabase } from "../lib/supabase.js";
import prisma from "../lib/prisma.js";

// Extend Express Request type with authenticated user & profile
declare global {
  namespace Express {
    interface Request {
      user?: User;
      profile?: Profile;
    }
  }
}

/**
 * Middleware: Verifies Bearer token with Supabase and ensures Profile exists.
 * Returns 401 if token is missing, invalid, or expired.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    res.status(401).json({ error: "Bearer token missing" });
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      res.status(401).json({ error: "Invalid or expired session token" });
      return;
    }

    const user = data.user;

    // Auto-create or fetch Profile on first sign-in (always role: customer)
    const displayName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User";

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email || "",
      },
      create: {
        id: user.id,
        email: user.email || "",
        name: displayName,
        role: "customer",
      },
    });

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

// Lets the public eligibility endpoint distinguish anonymous visitors without
// granting them access to any review or account data.
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.headers.authorization) {
    next();
    return;
  }
  void requireAuth(req, res, next);
}

/**
 * Middleware: Checks if user has admin role.
 * Returns 403 unless role is "admin".
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.profile) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.profile.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }

  next();
}
