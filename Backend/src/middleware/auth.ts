import { Request, Response, NextFunction } from "express";
import { User } from "@supabase/supabase-js";
import { Profile } from "@prisma/client";
import { supabase } from "../lib/supabase.js";
import prisma from "../lib/prisma.js";
import { env } from "../lib/env.js";

const profileCache = new Map<string, { profile: Profile; expiresAt: number }>();
const PROFILE_CACHE_TTL_MS = 60_000;

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
 * Middleware: Verifies the signed bearer token locally and ensures Profile exists.
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
    const { data, error } = await supabase.auth.getClaims(token);
    const claims = data?.claims;
    const expectedIssuer = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
    const audience = Array.isArray(claims?.aud) ? claims.aud : [claims?.aud];
    if (
      error ||
      !claims?.sub ||
      claims.iss !== expectedIssuer ||
      !audience.includes("authenticated") ||
      typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      res.status(401).json({ error: "Invalid or expired session token" });
      return;
    }
    const user = {
      id: claims.sub,
      email: claims.email || null,
      user_metadata: claims.user_metadata || {},
    } as User;

    const displayName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User";

    let profile = profileCache.get(user.id);
    let resolvedProfile: Profile;
    if (profile && profile.expiresAt > Date.now()) {
      resolvedProfile = profile.profile;
    } else {
      profileCache.delete(user.id);
      resolvedProfile = await prisma.profile.findUnique({ where: { id: user.id } }) as Profile;
      if (!resolvedProfile) {
        try {
          resolvedProfile = await prisma.profile.create({
            data: { id: user.id, email: user.email || "", name: displayName, role: "customer" },
          });
        } catch (createError) {
          if (typeof createError !== "object" || createError === null || !("code" in createError) || createError.code !== "P2002") throw createError;
          const existingProfile = await prisma.profile.findUnique({ where: { id: user.id } });
          if (!existingProfile) throw createError;
          resolvedProfile = existingProfile;
        }
      }
      profileCache.set(user.id, { profile: resolvedProfile, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS });
    }

    req.user = user;
    req.profile = resolvedProfile;
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

  try {
    const profile = await prisma.profile.findUnique({ where: { id: req.profile.id } });
    if (!profile || profile.role !== "admin") {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    req.profile = profile;
  } catch (err) {
    next(err);
    return;
  }

  next();
}
