/**
 * System Setup Page
 * Displays system health status and provides setup instructions
 */

import { SystemStatusPage } from "@/components/setup/SystemStatusPage";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return <SystemStatusPage />;
}
