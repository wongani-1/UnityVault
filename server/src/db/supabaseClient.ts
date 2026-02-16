import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabaseUrl = env.supabase.url;
const supabaseKey = env.supabase.serviceRoleKey;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabase;
};
