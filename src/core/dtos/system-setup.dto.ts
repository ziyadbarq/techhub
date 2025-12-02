/**
 * Core DTOs for system setup and health checks.
 * Shared between use cases and interface adapters.
 */

export interface SystemHealthCheckDto {
  database: {
    connected: boolean;
    error?: string;
    message?: string;
  };
  redis: {
    connected: boolean;
    error?: string;
    message?: string;
  };
  environment: {
    valid: boolean;
    missing: string[];
  };
  migrations: {
    applied: boolean;
    pending: number;
    error?: string;
    message?: string;
  };
  rbac: {
    roles: number;
    permissions: number;
  };
  worker: {
    active: boolean;
    queue: string;
    error?: string;
    message?: string;
  };
  overall: boolean;
}

export interface MigrationStatusDto {
  applied: string[];
  pending: string[];
  total: number;
}

export interface SystemInfoDto {
  nodeVersion: string;
  platform: string;
  environment: string;
  database: {
    size?: string;
    tableCount?: number;
  };
  lastMigration?: {
    name: string;
    appliedAt: Date;
  };
  userCount: number;
  roleCount: number;
  permissionCount: number;
}
