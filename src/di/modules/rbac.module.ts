/**
 * RBAC Module
 * Binds all RBAC-related dependencies (repositories and use cases)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repositories
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import { PrismaRoleRepository } from "@/infrastructure/repositories/prisma-role.repository";
import { PrismaPermissionRepository } from "@/infrastructure/repositories/prisma-permission.repository";
import { PrismaUserRoleRepository } from "@/infrastructure/repositories/prisma-user-role.repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/prisma-user.repository";
import { PrismaAuditLogRepository } from "@/infrastructure/repositories/prisma-audit-log.repository";

// Use Cases
import { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { CreateRoleUseCase } from "@/core/use-cases/rbac/create-role.use-case";
import { UpdateRoleUseCase } from "@/core/use-cases/rbac/update-role.use-case";
import { DeleteRoleUseCase } from "@/core/use-cases/rbac/delete-role.use-case";
import { GetRoleUseCase } from "@/core/use-cases/rbac/get-role.use-case";
import { ListRolesUseCase } from "@/core/use-cases/rbac/list-roles.use-case";
import { AssignPermissionsToRoleUseCase } from "@/core/use-cases/rbac/assign-permissions-to-role.use-case";
import { CreatePermissionUseCase } from "@/core/use-cases/rbac/create-permission.use-case";
import { UpdatePermissionUseCase } from "@/core/use-cases/rbac/update-permission.use-case";
import { DeletePermissionUseCase } from "@/core/use-cases/rbac/delete-permission.use-case";
import { GetPermissionUseCase } from "@/core/use-cases/rbac/get-permission.use-case";
import { ListPermissionsUseCase } from "@/core/use-cases/rbac/list-permissions.use-case";
import { AssignRoleToUserUseCase } from "@/core/use-cases/rbac/assign-role-to-user.use-case";
import { RevokeRoleFromUserUseCase } from "@/core/use-cases/rbac/revoke-role-from-user.use-case";
import { GetUserPermissionsUseCase } from "@/core/use-cases/rbac/get-user-permissions.use-case";
import { GetUserRolesUseCase } from "@/core/use-cases/rbac/get-user-roles.use-case";
import { GetRoleUsersUseCase } from "@/core/use-cases/rbac/get-role-users.use-case";
import { CheckFirstAdminUseCase } from "@/core/use-cases/rbac/check-first-admin.use-case";
import { AssignFirstAdminUseCase } from "@/core/use-cases/rbac/assign-first-admin.use-case";

// Analytics Use Cases
import {
  GetRoleUsageStatsUseCase,
  GetPermissionUsageStatsUseCase,
  GetUserRoleStatsUseCase,
} from "@/core/use-cases/rbac/analytics";

/**
 * Bind all RBAC dependencies to the container
 */
export function bindRBACDependencies(container: Container): void {
  // ==========================================
  // RBAC Repositories
  // ==========================================

  container
    .bind<IRoleRepository>(DI_TOKENS.IRoleRepository)
    .to(PrismaRoleRepository)
    .inSingletonScope();

  container
    .bind<IPermissionRepository>(DI_TOKENS.IPermissionRepository)
    .to(PrismaPermissionRepository)
    .inSingletonScope();

  container
    .bind<IUserRoleRepository>(DI_TOKENS.IUserRoleRepository)
    .to(PrismaUserRoleRepository)
    .inSingletonScope();

  container
    .bind<IUserRepository>(DI_TOKENS.IUserRepository)
    .to(PrismaUserRepository)
    .inSingletonScope();

  container
    .bind<IAuditLogRepository>(DI_TOKENS.IAuditLogRepository)
    .to(PrismaAuditLogRepository)
    .inSingletonScope();

  // ==========================================
  // RBAC Use Cases
  // ==========================================

  // Permission Checking
  container
    .bind<CheckPermissionUseCase>(DI_TOKENS.CheckPermissionUseCase)
    .to(CheckPermissionUseCase)
    .inTransientScope();

  // Role Management
  container
    .bind<CreateRoleUseCase>(DI_TOKENS.CreateRoleUseCase)
    .to(CreateRoleUseCase)
    .inTransientScope();

  container
    .bind<UpdateRoleUseCase>(DI_TOKENS.UpdateRoleUseCase)
    .to(UpdateRoleUseCase)
    .inTransientScope();

  container
    .bind<DeleteRoleUseCase>(DI_TOKENS.DeleteRoleUseCase)
    .to(DeleteRoleUseCase)
    .inTransientScope();

  container
    .bind<GetRoleUseCase>(DI_TOKENS.GetRoleUseCase)
    .to(GetRoleUseCase)
    .inTransientScope();

  container
    .bind<ListRolesUseCase>(DI_TOKENS.ListRolesUseCase)
    .to(ListRolesUseCase)
    .inTransientScope();

  container
    .bind<AssignPermissionsToRoleUseCase>(
      DI_TOKENS.AssignPermissionsToRoleUseCase,
    )
    .to(AssignPermissionsToRoleUseCase)
    .inTransientScope();

  // Permission Management
  container
    .bind<CreatePermissionUseCase>(DI_TOKENS.CreatePermissionUseCase)
    .to(CreatePermissionUseCase)
    .inTransientScope();

  container
    .bind<UpdatePermissionUseCase>(DI_TOKENS.UpdatePermissionUseCase)
    .to(UpdatePermissionUseCase)
    .inTransientScope();

  container
    .bind<DeletePermissionUseCase>(DI_TOKENS.DeletePermissionUseCase)
    .to(DeletePermissionUseCase)
    .inTransientScope();

  container
    .bind<GetPermissionUseCase>(DI_TOKENS.GetPermissionUseCase)
    .to(GetPermissionUseCase)
    .inTransientScope();

  container
    .bind<ListPermissionsUseCase>(DI_TOKENS.ListPermissionsUseCase)
    .to(ListPermissionsUseCase)
    .inTransientScope();

  // User-Role Assignment
  container
    .bind<AssignRoleToUserUseCase>(DI_TOKENS.AssignRoleToUserUseCase)
    .to(AssignRoleToUserUseCase)
    .inTransientScope();

  container
    .bind<RevokeRoleFromUserUseCase>(DI_TOKENS.RevokeRoleFromUserUseCase)
    .to(RevokeRoleFromUserUseCase)
    .inTransientScope();

  container
    .bind<GetUserPermissionsUseCase>(DI_TOKENS.GetUserPermissionsUseCase)
    .to(GetUserPermissionsUseCase)
    .inTransientScope();

  container
    .bind<GetUserRolesUseCase>(DI_TOKENS.GetUserRolesUseCase)
    .to(GetUserRolesUseCase)
    .inTransientScope();

  container
    .bind<GetRoleUsersUseCase>(DI_TOKENS.GetRoleUsersUseCase)
    .to(GetRoleUsersUseCase)
    .inTransientScope();

  container
    .bind<CheckFirstAdminUseCase>(DI_TOKENS.CheckFirstAdminUseCase)
    .to(CheckFirstAdminUseCase)
    .inTransientScope();

  container
    .bind<AssignFirstAdminUseCase>(DI_TOKENS.AssignFirstAdminUseCase)
    .to(AssignFirstAdminUseCase)
    .inTransientScope();

  // Analytics
  container
    .bind<GetRoleUsageStatsUseCase>(DI_TOKENS.GetRoleUsageStatsUseCase)
    .to(GetRoleUsageStatsUseCase)
    .inTransientScope();

  container
    .bind<GetPermissionUsageStatsUseCase>(
      DI_TOKENS.GetPermissionUsageStatsUseCase,
    )
    .to(GetPermissionUsageStatsUseCase)
    .inTransientScope();

  container
    .bind<GetUserRoleStatsUseCase>(DI_TOKENS.GetUserRoleStatsUseCase)
    .to(GetUserRoleStatsUseCase)
    .inTransientScope();
}
