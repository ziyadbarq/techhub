/**
 * System Setup Repository Interface
 * Repository interface for system setup and health check operations
 */

export interface ISystemSetupRepository {
  /**
   * Check if database connection is healthy
   */
  checkDatabaseConnection(): Promise<boolean>;

  /**
   * Check if Redis connection is healthy
   */
  checkRedisConnection(): Promise<boolean>;

  /**
   * Get count of pending migrations
   */
  getPendingMigrationsCount(): Promise<number>;

  /**
   * Check if all migrations have been applied
   */
  areMigrationsApplied(): Promise<boolean>;

  /**
   * Get list of applied migrations
   */
  getAppliedMigrations(): Promise<string[]>;

  /**
   * Get list of pending migrations
   */
  getPendingMigrations(): Promise<string[]>;

  /**
   * Get total count of users
   */
  getUserCount(): Promise<number>;

  /**
   * Get total count of roles
   */
  getRoleCount(): Promise<number>;

  /**
   * Get total count of permissions
   */
  getPermissionCount(): Promise<number>;

  /**
   * Get database size in bytes
   */
  getDatabaseSize(): Promise<number | null>;

  /**
   * Get count of database tables
   */
  getTableCount(): Promise<number>;

  /**
   * Get last applied migration info
   */
  getLastMigration(): Promise<{
    name: string;
    appliedAt: Date;
  } | null>;
}
