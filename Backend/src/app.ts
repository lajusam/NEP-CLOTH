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
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/health", healthRouter);
app.use("/products", productsRouter);
app.use("/auth", authRouter);
app.use("/", reviewsRouter);
app.use("/admin/reviews", adminReviewsRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
