// Entry point — env validation runs before importing the app.
import { env } from "./lib/env.js";
import app from "./app.js";

// --- Start server ---
const PORT = Number(env.PORT);
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
