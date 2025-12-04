import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export type PermissionCacheScope = "user" | "all";

export interface IPermissionCacheService {
  get(userId: string): Promise<PermissionKey[] | null>;
  set(userId: string, permissions: PermissionKey[]): Promise<void>;
  invalidate(scope: PermissionCacheScope, userId?: string): Promise<void>;
}
