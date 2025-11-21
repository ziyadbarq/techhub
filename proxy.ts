import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicRoute } from "@/config/protected-routes";

/**
 * Global Authentication Proxy (Next.js 16 Proxy Convention)
 *
 * Purpose: First line of defense for route protection (Hybrid approach)
 * - Checks for Better Auth session cookie
 * - Redirects unauthenticated users to /login
 * - Works alongside component-level checks (requireAuth/getSession)
 *
 * Defense in Depth Strategy:
 * 1. This proxy: Fast redirect at network boundary (prevents unauthorized page loads)
 * 2. Template check: Server-side requireAuth() in dashboard template
 * 3. Component checks: Page-level permission verification
 *
 * Note: Runs on Node.js runtime (Next.js 16 default)
 * - Uses lightweight cookie check for initial routing decisions
 * - Server components provide full session validation and authorization
 */

/**
 * Check if user has a Better Auth session cookie
 * (Lightweight check for proxy routing - full validation happens in server components)
 */
function hasSessionCookie(request: NextRequest): boolean {
  // Better Auth uses "better-auth.session_token" cookie by default
  const sessionToken = request.cookies.get("better-auth.session_token");

  // Debug logging (can be removed after testing)
  console.log("[Proxy Debug]", {
    pathname: request.nextUrl.pathname,
    hasSessionToken: !!sessionToken?.value,
    allCookies: Array.from(request.cookies.getAll().map((c) => c.name)),
  });

  return !!sessionToken?.value;
}

/**
 * Proxy function - runs on every request matching the config
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users from landing page to dashboard
  if (pathname === "/" && hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users from auth pages to dashboard
  if (
    (pathname === "/login" || pathname === "/register") &&
    hasSessionCookie(request)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public routes to pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie (lightweight check)
  if (!hasSessionCookie(request)) {
    // User not authenticated - redirect to login with return URL
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // User has session cookie - allow request to proceed
  // Note: Full session validation happens in server components (template.tsx)
  return NextResponse.next();
}

/**
 * Configure which routes the proxy runs on
 *
 * Matcher excludes:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon and other static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
