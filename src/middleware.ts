import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "stockroom_session";
const PUBLIC = ["/login", "/api/health", "/api/auth", "/api/openapi", "/api/test/reset"];

function secretKey() {
  const secret =
    process.env.STOCKROOM_SESSION_SECRET?.trim() ||
    "stockroom-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic =
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname === "/api/auth";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let valid = false;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      valid = typeof payload.sub === "string";
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      valid = false;
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!valid && !isPublic && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (valid && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/products";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/products";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = valid ? "/products" : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
