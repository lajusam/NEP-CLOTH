import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "./lib/env.js";
import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import reviewsRouter from "./routes/reviews.js";
import adminReviewsRouter from "./routes/adminReviews.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { invalidatePublicProductCache } from "./lib/publicProductCache.js";

const app = express();

// Vercel overwrites X-Forwarded-For at its edge, so trust only that proxy hop.
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.once("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) invalidatePublicProductCache();
    });
  }
  const startedAt = performance.now();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (this: typeof res, ...args: any[]) {
    const durationMs = Math.max(0, performance.now() - startedAt);
    if (!res.headersSent) res.setHeader("Server-Timing", `app;dur=${durationMs.toFixed(1)}`);
    return (originalWriteHead as (...headArgs: any[]) => typeof res).apply(this, args);
  } as typeof res.writeHead;
  res.once("finish", () => {
    const durationMs = Math.max(0, performance.now() - startedAt);
    const route = `${req.baseUrl}${req.route?.path ?? ""}` || "/";
    console.info(`[http] ${req.method} ${route} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });
  next();
});

app.use(helmet());
app.use(compression());
const allowedOrigins = env.FRONTEND_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Group API routes
const apiRouter = express.Router();
apiRouter.use("/health", healthRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/reviews", adminReviewsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/", reviewsRouter);

// Mount under both /api and root to guarantee compatibility with all proxy & rewrite rules
app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
