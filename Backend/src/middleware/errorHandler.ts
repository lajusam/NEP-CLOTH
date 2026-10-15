import { Request, Response, NextFunction } from "express";

// Catches errors from any route and sends a clean JSON response
// Never leaks stack traces or secrets to the client
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", err.message);

  res.status(500).json({
    error: "Internal server error",
  });
}
