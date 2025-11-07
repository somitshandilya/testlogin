import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and API routes without authentication
  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Check for access token in cookies
  const accessToken = req.cookies.get("accessToken")?.value;

  // If no token and trying to access protected page, redirect to login
  if (!accessToken && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
