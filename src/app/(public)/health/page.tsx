/**
 * System Health Page
 * Public page displaying real-time system health status
 */

import { SystemHealthPage } from "@/components/health/SystemHealthPage";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  return <SystemHealthPage />;
}
