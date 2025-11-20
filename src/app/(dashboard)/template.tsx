import { requireAuth } from "@/lib/auth/session";

// Force dynamic rendering for all dashboard pages
export const dynamic = "force-dynamic";

/**
 * Dashboard Template - Second Layer of Auth Protection
 *
 * Hybrid Defense Strategy:
 * 1. Middleware (middleware.ts): Fast redirect at edge
 * 2. This Template: Server-side session access + verification
 * 3. Individual pages: Can access session data via requireAuth() if needed
 */
export default async function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication - throws if user not authenticated
  // This provides session access and secondary verification
  await requireAuth();

  return <>{children}</>;
}
