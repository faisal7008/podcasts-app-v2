import { NextRequest, NextResponse } from "next/server";

/** Routes that require authentication */
const protectedPaths = ["/library", "/profile", "/settings"];

/** Routes that should redirect logged-in users away */
const authPaths = ["/auth/signin", "/auth/signup"];

/**
 * Middleware for route protection.
 *
 * - Protects /library, /profile, /settings → redirects to /auth/signin?callbackUrl={path}
 * - Redirects authenticated users away from /auth/signin, /auth/signup → /
 * - Checks the podcast_app.session_token cookie (matches cookiePrefix in auth.ts)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for better-auth session cookie
  // Cookie name follows the pattern: {cookiePrefix}.session_token
  const sessionCookie = request.cookies.get("podcast_app.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  // Protect routes that require authentication
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/library/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/auth/signin",
    "/auth/signup",
  ],
};
