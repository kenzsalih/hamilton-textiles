import { getAdminSupabase } from "@/lib/supabase/admin";
import { devRepo } from "./dev-store";
import { createSupabaseRepo } from "./supabase-repo";
import type { Repo } from "./types";

export * from "./types";

let supabaseRepo: Repo | undefined;

/**
 * The single entry point for reading and writing shop data on the server.
 * Uses Supabase when configured; otherwise the local development store.
 */
export function getRepo(): Repo {
  const db = getAdminSupabase();
  if (db) return (supabaseRepo ??= createSupabaseRepo(db));
  return devRepo;
}

export function isDevStore(): boolean {
  return getRepo().mode === "dev";
}
