import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side Supabase client using secret key (bypasses RLS, used only on backend)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
