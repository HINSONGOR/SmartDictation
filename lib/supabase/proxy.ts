import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { USER_HEADER } from "@/lib/auth/user-header";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot-password"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/callback");
}

function copySession(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(headerName);
    if (value) {
      to.headers.set(headerName, value);
    }
  }

  return to;
}

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv();

  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (
    request.method === "GET" &&
    pathname === "/login" &&
    request.nextUrl.searchParams.has("password")
  ) {
    const url = request.nextUrl.clone();
    url.search = "";
    return copySession(supabaseResponse, NextResponse.redirect(url));
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return copySession(supabaseResponse, NextResponse.redirect(url));
  }

  if (user && PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return copySession(supabaseResponse, NextResponse.redirect(url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(USER_HEADER);
  if (user) {
    requestHeaders.set(USER_HEADER, user.id);
  }

  return copySession(supabaseResponse, NextResponse.next({ request: { headers: requestHeaders } }));
}
