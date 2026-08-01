import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/bookings", "/wallet", "/wishlist", "/profile"];
const ADMIN_PREFIXES = ["/admin"];
const THEATRE_PREFIXES = ["/theatre"];
const SUPER_PREFIXES = ["/super-admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("access_token")?.value;

  const needsAuth = [...PROTECTED_PREFIXES, ...ADMIN_PREFIXES, ...THEATRE_PREFIXES, ...SUPER_PREFIXES].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Soft gate: allow browsing dashboards in demo; APIs still enforce JWT.
  // Redirect only when FORCE_AUTH=true
  if (process.env.FORCE_AUTH === "true" && needsAuth && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-API-Version", "v1");
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bookings/:path*",
    "/wallet/:path*",
    "/wishlist/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/theatre/:path*",
    "/super-admin/:path*",
    "/api/:path*",
  ],
};
