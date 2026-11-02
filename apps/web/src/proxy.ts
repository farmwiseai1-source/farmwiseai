import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const protectedPrefixes = ["/dashboard", "/onboarding", "/farms", "/crop-recommendation", "/pest-detection", "/irrigation", "/fertilizer", "/advisor", "/history", "/settings"];

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();
  const response = NextResponse.next({ request });
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => items.forEach(({ name, value, options }) => { response.cookies.set(name, value, options); }) },
  });
  const { data: { user } } = await client.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (user && ["/login", "/signup"].includes(pathname)) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"] };
