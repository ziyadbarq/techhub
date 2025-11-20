/**
 * Next.js Proxy (Next.js 16+)
 *
 * Global proxy that runs on every request before the route handler.
 * Used for routing, redirects, and request/response manipulation:
 * - Basic session authentication (cookie check + redirect)
 * - Request context initialization
 * - Request ID generation and propagation
 * - Request/response tracking headers
 * - Performance timing
 *
 * IMPORTANT: Next.js 16 renamed middleware.ts to proxy.ts to clarify intent.
 * While proxy is primarily for ROUTING concerns, basic session validation
 * is included here to redirect unauthenticated users before page render.
 * Full authorization/permission checks happen at the data layer (Server Actions).
 *
 * Architecture:
 * - Runs at the edge (fast, minimal overhead)
 * - Checks Better Auth session cookie for protected routes
 * - Initializes AsyncLocalStorage context for each request
 * - Adds tracking headers to responses
 * - Supports distributed tracing
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  extractContextFromHeaders,
  runWithContext,
  type RequestContext,
} from "@/infrastructure/middleware/request-context";
import { isPublicRoute } from "@/config/protected-routes";

/**
 * Proxy configuration
 *
 * Defines which routes the proxy should run on
 */
export const config = {
  /*
   * Match all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico (favicon)
   * - public files (images, etc.)
   */
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

/**
 * Global proxy function
 *
 * Runs on every matching request to:
 * 1. Extract/generate request ID and correlation ID
 * 2. Initialize request context in AsyncLocalStorage
 * 3. Add tracking headers to response
 * 4. Enable request-scoped logging throughout the app
 *
 * NOTE: This proxy does NOT handle authentication. Auth is handled
 * at the data layer (Server Actions, API Routes) per Next.js 16 best practices.
 *
 * @param request - Next.js request object
 * @returns Next.js response with tracking headers
 */
export function proxy(request: NextRequest) {
  // Extract context from headers (includes request ID generation)
  const contextData = extractContextFromHeaders(request.headers, request.url);

  // Add HTTP method to context
  const context: RequestContext = {
    ...contextData,
    requestId: contextData.requestId!,
    timestamp: contextData.timestamp!,
    method: request.method,
  };

  // Authentication check
  // Note: This is basic session validation at the proxy layer.
  // Full permission/authorization checks happen at the data layer (Server Actions)
  const pathname = request.nextUrl.pathname;

  if (!isPublicRoute(pathname)) {
    // Check for Better Auth session cookie
    const sessionCookie = request.cookies.get("better-auth.session_token");

    if (!sessionCookie) {
      // Redirect to login with callback URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Run the rest of the request within this context
  // This makes the context available to all downstream code via AsyncLocalStorage
  return runWithContext(context, () => {
    // Create response
    const response = NextResponse.next();

    // Add tracking headers to response
    // This allows clients and upstream services to correlate requests
    response.headers.set("x-request-id", context.requestId);

    if (context.correlationId) {
      response.headers.set("x-correlation-id", context.correlationId);
    }

    // Add timing header for performance monitoring
    const requestTime = Date.now() - new Date(context.timestamp).getTime();
    response.headers.set("x-request-time", `${requestTime}ms`);

    return response;
  });
}
