/**
 * Session Context
 * Provides centralized session state to prevent duplicate useSession() calls
 * All components should use useSessionContext() instead of calling useSession() directly
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/lib/auth/client";
import type { Session } from "@/interface-adapters/auth/better-auth";

// Extract the inner types from Better Auth's Session type
type SessionData = Session["session"];
type UserData = Session["user"];

interface SessionContextValue {
  /** The current session object, null if not authenticated */
  session: SessionData | null;
  /** The current user object, null if not authenticated */
  user: UserData | null;
  /** True while the session is being fetched */
  isPending: boolean;
  /** Error from session fetch, if any */
  error: Error | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider - Centralizes session state management
 *
 * IMPORTANT: This provider should be placed at the root of the dashboard layout
 * to ensure all components share a single session subscription.
 *
 * Benefits:
 * - Single useSession() call instead of multiple across components
 * - Reduces API calls from N components to 1
 * - Consistent session state across all consumers
 * - Prevents rate limiting issues from excessive /api/auth/get-session calls
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const { data, isPending, error } = useSession();

  return (
    <SessionContext.Provider
      value={{
        session: data?.session ?? null,
        user: data?.user ?? null,
        isPending,
        error: error ?? null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to access shared session state
 *
 * Use this instead of calling useSession() directly in components.
 * Must be used within SessionProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isPending } = useSessionContext();
 *
 *   if (isPending) return <Skeleton />;
 *   if (!user) return <SignInPrompt />;
 *
 *   return <div>Hello, {user.name}!</div>;
 * }
 * ```
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return context;
}

/**
 * Convenience hook for checking if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, isPending } = useSessionContext();
  return !isPending && user !== null;
}
