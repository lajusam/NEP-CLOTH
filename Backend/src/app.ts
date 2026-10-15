import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./lib/env.js";
import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import reviewsRouter from "./routes/reviews.js";
import adminReviewsRouter from "./routes/adminReviews.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
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
