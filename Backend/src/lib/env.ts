import { z } from "zod";
import dotenv from "dotenv";

// Load .env file before anything else
dotenv.config();

// Schema: validates all required environment variables
const envSchema = z
  .object({
    SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
    SUPABASE_SECRET_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    FRONTEND_ORIGIN: z.string().min(1, "FRONTEND_ORIGIN is required"),
    PORT: z.string().optional().default("4000"),
  })
  .refine(
    (data) => Boolean(data.SUPABASE_SECRET_KEY || data.SUPABASE_SERVICE_ROLE_KEY),
    {
      message: "SUPABASE_SECRET_KEY is required",
      path: ["SUPABASE_SECRET_KEY"],
    }
  );

// Validate — if anything is missing, stop and print exactly which one
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Missing or invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`   → ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

// Export validated config with standardized SUPABASE_SECRET_KEY
export const env = {
  ...parsed.data,
  SUPABASE_SECRET_KEY: (parsed.data.SUPABASE_SECRET_KEY || parsed.data.SUPABASE_SERVICE_ROLE_KEY) as string,
};
