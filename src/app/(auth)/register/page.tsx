/**
 * Registration Page (Server Component)
 * Guards against registration when initial setup or setup recovery is required.
 * If no administrator exists, redirects to /setup to prevent stranding the instance
 * without an admin account or seeded data.
 */

import { redirect } from "next/navigation";
import { checkSetupStatusAction } from "@/interface-adapters/controllers/setup.controller";
import RegisterPageClient from "./RegisterPageClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const result = await checkSetupStatusAction();

  // If DB is unreachable, allow registration to render. The client will surface
  // a clear error before attempting auth actions.
  if (result.success && result.data.needsSetup) {
    redirect("/setup");
  }

  return <RegisterPageClient />;
}
