// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- legacy compatibility shim; see docs/architecture/IMPORT_RULES.md
import type { Session, User } from "@/interface-adapters/auth/better-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

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
      // Better Auth v1.3.34+ can auto-detect session from request context
      // We need to ensure cookies are available in the request context
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("better-auth.session_token");

      if (!sessionToken) {
        return {
          session: null,
          user: null,
        };
      }

      const cookieHeader = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");

      const baseUrl =
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

      const response = await fetch(`${baseUrl}/api/auth/get-session`, {
        headers: {
          cookie: cookieHeader,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Failed to fetch session from Better Auth:", {
          status: response.status,
          statusText: response.statusText,
        });
        return {
          session: null,
          user: null,
        };
      }

      const result = (await response.json()) as {
        session: Session | null;
        user: User | null;
      } | null;

      if (!result?.session || !result?.user) {
        return {
          session: null,
          user: null,
        };
      }

      return {
        session: result.session,
        user: result.user,
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
