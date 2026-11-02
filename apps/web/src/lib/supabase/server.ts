import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot always write cookies. */ }
      },
    },
  });
}

export function createServerFallbackClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
