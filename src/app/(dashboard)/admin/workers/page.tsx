import { WorkerStatusDashboard } from "@/components/admin/workers/worker-status-dashboard";

// Force dynamic rendering - admin pages require authentication
export const dynamic = "force-dynamic";

export default function WorkerStatusPage() {
  return <WorkerStatusDashboard />;
}
