import type { Metadata } from "next";
import { MaintenancePageClient } from "./maintenance-page-client";

export const metadata: Metadata = {
  title: "System Maintenance",
  description:
    "The system is currently under maintenance. Please try again later.",
};

/**
 * Maintenance Mode page - shown when MAINTENANCE_MODE feature flag is enabled
 * Applies to all roles and redirects back when maintenance mode is disabled
 */
export default async function MaintenancePage() {
  return <MaintenancePageClient />;
}
