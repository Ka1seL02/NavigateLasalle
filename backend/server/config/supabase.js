import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const BUCKET_NAME = process.env.BUCKET_NAME || "virtual-tour";
