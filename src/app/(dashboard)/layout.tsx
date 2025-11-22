import type { ReactNode } from "react";
import { DashboardLayoutClient } from "./dashboard-layout-client";

// Force dynamic rendering for all dashboard pages to allow session access
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
