"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Do NOT create the client if env vars are missing at build time (e.g. during prerender)
export const supabaseClient: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
