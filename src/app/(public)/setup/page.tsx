/**
 * System Setup Page v2 - Debug Version
 * Minimal implementation to isolate issues
 */

import { redirect } from "next/navigation";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { MinimalWizard } from "@/components/setup/MinimalWizard";

export const dynamic = "force-dynamic";

export default async function Setup2Page() {
  const container = getContainer();
  let initialLoadError: string | null = null;
  let userCount = 0;
  let roleCount = 0;
  let permissionCount = 0;

  try {
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );
    const permissionRepository = container.get<IPermissionRepository>(
      DI_TOKENS.IPermissionRepository,
    );

    // Query counts in parallel
    const [u, roles, permissions] = await Promise.all([
      userRepository.count(),
      roleRepository.findAll(),
      permissionRepository.findAll(),
    ]);

    userCount = u;
    roleCount = roles.length;
    permissionCount = permissions.length;
  } catch (err) {
    initialLoadError =
      err instanceof Error ? err.message : "Unknown initialization error";
  }

  // Prevent access if any users already exist
  if (!initialLoadError && userCount > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <MinimalWizard
        initialLoadError={initialLoadError}
        rbacCounts={{ roles: roleCount, permissions: permissionCount }}
      />
    </div>
  );
}
