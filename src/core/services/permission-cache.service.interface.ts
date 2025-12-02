import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export type PermissionCacheScope = "user" | "all";

export interface IPermissionCacheService {
  get(userId: string): PermissionKey[] | null;
  set(userId: string, permissions: PermissionKey[]): void;
  invalidate(scope: PermissionCacheScope, userId?: string): void;
}
