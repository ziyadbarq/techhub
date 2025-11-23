/**
 * RBAC Analytics Use Cases
 *
 * Barrel export for analytics-related use cases.
 */

export { GetRoleUsageStatsUseCase } from "./get-role-usage-stats.use-case";
export type { RoleUsageStats } from "./get-role-usage-stats.use-case";

export { GetPermissionUsageStatsUseCase } from "./get-permission-usage-stats.use-case";
export type { PermissionUsageStats } from "./get-permission-usage-stats.use-case";

export { GetUserRoleStatsUseCase } from "./get-user-role-stats.use-case";
export type { UserRoleStatsResult } from "./get-user-role-stats.use-case";
