import { injectable } from "inversify";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type {
  IPermissionCacheService,
  PermissionCacheScope,
} from "@/core/services/permission-cache.service.interface";
import {
  invalidatePermissionCache,
  permissionCache,
} from "@/lib/permissions/cache";

@injectable()
export class PermissionCacheService implements IPermissionCacheService {
  get(userId: string): PermissionKey[] | null {
    return permissionCache.get(userId);
  }

  set(userId: string, permissions: PermissionKey[]): void {
    permissionCache.set(userId, permissions);
  }

  invalidate(scope: PermissionCacheScope, userId?: string): void {
    invalidatePermissionCache(scope, userId);
  }
}
