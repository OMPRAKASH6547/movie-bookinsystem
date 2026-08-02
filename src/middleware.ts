import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CUSTOMER_PROTECTED = ["/dashboard", "/bookings", "/wallet", "/wishlist", "/profile"];
const STAFF_PROTECTED = ["/admin", "/theatre", "/super-admin"];

function isUnder(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("access_token")?.value;

  const needsAuth =
    isUnder(pathname, CUSTOMER_PROTECTED) || isUnder(pathname, STAFF_PROTECTED);

  // Always require login for dashboards (admin / theatre / customer account areas)
  if (needsAuth && !token) {
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
    "/dashboard",
    "/dashboard/:path*",
    "/bookings",
    "/bookings/:path*",
    "/wallet",
    "/wallet/:path*",
    "/wishlist",
    "/wishlist/:path*",
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
    "/theatre",
    "/theatre/:path*",
    "/super-admin",
    "/super-admin/:path*",
  ],
};
