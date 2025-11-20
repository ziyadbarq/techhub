/**
 * First-Time Setup Page
 * Shown when no admin users exist
 * Allows first user to claim admin role
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SetupWizard } from "@/components/auth/SetupWizard";
import { checkFirstAdminAction } from "@/interface-adapters/controllers/setup.controller";

export default async function SetupPage() {
  // Check if user is authenticated
  const { user } = await getSession();

  if (!user) {
    redirect("/login?callbackUrl=/setup");
  }

  // Check if admin already exists
  const result = await checkFirstAdminAction();

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-destructive text-2xl font-bold">Setup Error</h1>
          <p className="text-muted-foreground">
            {result.error || "Failed to check admin status."}
          </p>
          <p className="text-muted-foreground text-sm">
            Please ensure the database is seeded with RBAC data.
          </p>
        </div>
      </div>
    );
  }

  // If admin already exists, redirect to home
  if (result.data.hasAdmin) {
    redirect("/");
  }

  // Show setup wizard
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SetupWizard user={user} />
    </div>
  );
}
