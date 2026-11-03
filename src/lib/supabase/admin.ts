import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Service-role client for trusted server code only (checkout, payment
 * confirmation, order tracking). Bypasses row level security — never import
 * this from a client component.
 */
export function getAdminSupabase(): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("getAdminSupabase is server-only");
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
