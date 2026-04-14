/**
 * Setup Page (Server Component)
 * Initial system setup wizard - only accessible when no users exist
 * Guards: proxy (auth redirect), server (DB check), client (re-check before submit)
 */

import { redirect } from "next/navigation";
import {
  checkSetupStatusAction,
  type SetupStatus,
} from "@/interface-adapters/controllers/setup.controller";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const result = await checkSetupStatusAction();

  if (!result.success) {
    // DB connection error - render wizard with defaults and surface the error
    return (
      <SetupWizard
        initialStatus={{
          needsSetup: true,
          hasAssignedAdmin: false,
          userCount: 0,
          recoveryMode: false,
          canSeed: true,
          canCreateAdmin: true,
          existingUserEmail: null,
          rolesSeeded: false,
          foundationSeeded: false,
          featureFlagsSeeded: false,
        }}
        initialError={
          result.error ||
          "Could not connect to the database. Please check your DATABASE_URL and ensure PostgreSQL is running."
        }
      />
    );
  }

  const status: SetupStatus = result.data;

  // Once an admin exists, setup is permanently locked.
  if (status.hasAssignedAdmin) {
    redirect("/login");
  }

  return <SetupWizard initialStatus={status} />;
}
