// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- legacy compatibility shim; see docs/architecture/IMPORT_RULES.md
import { getAuth } from "@/interface-adapters/auth/better-auth";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- legacy compatibility shim; see docs/architecture/IMPORT_RULES.md
import type { Session, User } from "@/interface-adapters/auth/better-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE_NAMES } from "@/lib/auth/cookie-names";

/**
 * Get session on server components (memoized per request)
 *
 * Uses React's cache() to memoize the session fetch for the lifetime of a single request.
 * This prevents redundant HTTP calls when multiple permission checks or server actions
 * need the session data within the same request.
 *
 * Note: Better Auth v1.3.34 with Next.js 16 requires using cookies()
 * instead of headers() to avoid compatibility issues with async request APIs
 */
const getSessionInternal = cache(
  async (): Promise<{
    session: Session | null;
    user: User | null;
  }> => {
    try {
      // Fast path: skip auth API call if no session cookie present
      // Cookie name depends on the deployment scheme (see cookie-names.ts)
      const cookieStore = await cookies();
      const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
        cookieStore.get(name),
      );

      if (!hasSessionCookie) {
        return {
          session: null,
          user: null,
        };
      }

      // Direct in-process call — no HTTP loopback needed.
      // Using fetch to localhost fails inside Docker containers (AggregateError).
      const requestHeaders = await headers();
      const result = await getAuth().api.getSession({
        headers: requestHeaders,
      });

      if (!result?.session || !result?.user) {
        return {
          session: null,
          user: null,
        };
      }

      return {
        session: result.session as unknown as Session,
        user: result.user as User,
      };
    } catch (error) {
      console.error("Error getting session:", error);
      return {
        session: null,
        user: null,
      };
    }
  },
);

/**
 * Public wrapper for getSession that delegates to the memoized implementation
 */
export async function getSession(): Promise<{
  session: Session | null;
  user: User | null;
}> {
  return getSessionInternal();
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<{
  session: Session;
  user: User;
}> {
  const { session, user } = await getSession();

  if (!session || !user) {
    redirect("/login");
  }

  return { session, user };
}

/**
 * Get user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.id || null;
}
