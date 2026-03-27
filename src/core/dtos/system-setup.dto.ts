/**
 * Core DTOs for system setup and health checks.
 * Shared between use cases and interface adapters.
 */

export interface SystemHealthCheckDto {
  database: {
    connected: boolean;
    error?: string;
    message?: string;
    responseTimeMs?: number;
  };
  redis: {
    connected: boolean;
    error?: string;
    message?: string;
    responseTimeMs?: number;
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
  seeding: {
    initialized: boolean;
    organizationUnits: number;
    locations: number;
    vendors: number;
    featureFlags: number;
    services: number;
  };
  worker: {
    active: boolean;
    queue: string;
    error?: string;
    message?: string;
  };
  msGraphSSO: {
    configured: boolean;
    connected: boolean;
    error?: string;
    message?: string;
    responseTimeMs?: number;
  };
  intune: {
    configured: boolean;
    connected: boolean;
    error?: string;
    message?: string;
    responseTimeMs?: number;
  };
  email: {
    configured: boolean;
    connected: boolean;
    error?: string;
    message?: string;
    responseTimeMs?: number;
  };
  buildInfo: {
    version: string;
    gitCommit: string;
    gitCommitFull: string;
    gitRef: string;
    buildDate: string;
    imageTag: string;
    pipelineId: string;
    pipelineUrl?: string;
    projectUrl?: string;
  };
  overall: boolean; // ALL services including worker (for monitoring/alerts)
  coreServicesHealthy: boolean; // Core services only: DB + Redis + Env + Migrations (for deployment gates)
  integrationsHealthy: boolean; // Optional integrations only: Graph, Intune, Email
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
