/**
 * ISystemSettingRepository Interface
 * Data access contract for database-backed system settings
 */

import type { SystemSetting } from "../domain/entities/system-setting.entity";

export interface ISystemSettingRepository {
  findByKey(key: string): Promise<SystemSetting | null>;
  findAll(): Promise<SystemSetting[]>;
  findByKeys(keys: string[]): Promise<SystemSetting[]>;
  upsert(setting: SystemSetting): Promise<SystemSetting>;
  upsertMany(settings: SystemSetting[]): Promise<SystemSetting[]>;
}
