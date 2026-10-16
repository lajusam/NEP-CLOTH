// Entry point — env validation runs before importing the app.
import { env } from "./lib/env.js";
import app from "./app.js";
import prisma from "./lib/prisma.js";

// --- Start server ---
const PORT = Number(env.PORT);
void prisma.$connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(() => {
  console.warn("Initial database connection failed; starting HTTP server while Prisma retries on demand.");
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
