/**
 * System Setup Page
 * Comprehensive first-time setup wizard for system initialization
 *
 * Handles:
 * - System health checks
 * - Database initialization
 * - First admin user creation
 * - Minimal RBAC data seeding
 */

import { redirect } from "next/navigation";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import { SystemSetupWizard } from "@/components/setup/SystemSetupWizard";

export const dynamic = "force-dynamic";

export default async function SystemSetupPage() {
  // Check if any users exist
  const container = getContainer();
  const userRepository = container.get<IUserRepository>(
    DI_TOKENS.IUserRepository,
  );

  const userCount = await userRepository.count();

  // If users exist, redirect to login
  // (This setup page is only for initial system setup when NO users exist)
  if (userCount > 0) {
    redirect("/login");
  }

  // Show comprehensive setup wizard
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <SystemSetupWizard />
    </div>
  );
}
