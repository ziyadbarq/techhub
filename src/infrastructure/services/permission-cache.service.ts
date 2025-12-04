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
  async get(userId: string): Promise<PermissionKey[] | null> {
    return await permissionCache.get(userId);
  }

  async set(userId: string, permissions: PermissionKey[]): Promise<void> {
    await permissionCache.set(userId, permissions);
  }

  async invalidate(
    scope: PermissionCacheScope,
    userId?: string,
  ): Promise<void> {
    await invalidatePermissionCache(scope, userId);
  }
}
