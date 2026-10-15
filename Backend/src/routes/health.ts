import { Router } from "express";

const healthRouter = Router();

// Simple health check — lets you confirm the server is running
healthRouter.get("/", (_req, res) => {
  res.json({ ok: true });
});

export default healthRouter;
