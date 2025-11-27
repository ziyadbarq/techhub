import type { ReactNode } from "react";
import { DashboardLayoutClient } from "./dashboard-layout-client";

// Required: Dashboard uses auth hooks (useSession) which require cookies
// This prevents static generation errors during build
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
