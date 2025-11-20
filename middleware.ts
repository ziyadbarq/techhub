import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global Authentication Middleware (Edge Runtime Compatible)
 *
 * Purpose: First line of defense for route protection (Hybrid approach)
 * - Checks for Better Auth session cookie
 * - Redirects unauthenticated users to /login
 * - Works alongside component-level checks (requireAuth/getSession)
 *
 * Defense in Depth Strategy:
 * 1. This middleware: Fast redirect at edge (prevents unauthorized page loads)
 * 2. Template check: Server-side requireAuth() in dashboard template
 * 3. Component checks: Page-level permission verification
 *
 * Note: Runs in Edge Runtime (no Node.js modules like crypto)
 * - Uses lightweight cookie check instead of full session validation
 * - Server components provide full session validation
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/setup"];

// Public API routes that bypass auth
const PUBLIC_API_ROUTES = ["/api/auth"];

/**
 * Check if a pathname is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Check if it starts with any public API route
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user has a Better Auth session cookie
 * (Lightweight check for Edge Runtime - full validation happens in server components)
 */
function hasSessionCookie(request: NextRequest): boolean {
  // Better Auth uses "better-auth.session_token" cookie by default
  const sessionToken = request.cookies.get("better-auth.session_token");
  return !!sessionToken?.value;
}

/**
 * Middleware function - runs on every request
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
 * Configure which routes the middleware runs on
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
