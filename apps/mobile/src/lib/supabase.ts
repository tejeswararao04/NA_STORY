import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Works even when keys are empty (local dev) — calls throw only when used.
export const supabase =
  url && anon ? createClient(url, anon) : (null as unknown as ReturnType<typeof createClient>);
