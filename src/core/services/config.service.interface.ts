/**
 * IConfigService Interface
 * Resolves setting values with priority: DB → env var → default value
 */

export interface IConfigService {
  get(key: string): Promise<string | undefined>;
  getString(key: string): Promise<string | undefined>;
  getNumber(key: string): Promise<number | undefined>;
  getBoolean(key: string): Promise<boolean | undefined>;
  getOrThrow(key: string): Promise<string>;
  invalidateCache(key?: string): void;
}
