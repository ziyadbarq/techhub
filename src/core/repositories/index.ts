/**
 * Repository Interfaces Barrel Export
 *
 * This file exports all repository interfaces from the core layer.
 * Repositories define contracts for data access implementations.
 */

// Prompt System Repositories (AI Infrastructure)
export type { IPromptBlockRepository } from "./prompt-block.repository.interface";
export type { IPromptCompositionRepository } from "./prompt-composition.repository.interface";

// Task Repository (Example CRUD)
export type { ITaskRepository } from "./task.repository.interface";

// RBAC Repositories
export type { IRoleRepository } from "./role-repository.interface";
export type { IPermissionRepository } from "./permission-repository.interface";
export type { IUserRoleRepository } from "./user-role-repository.interface";
export type { IAuditLogRepository } from "./audit-log-repository.interface";
export type { ISystemSetupRepository } from "./system-setup-repository.interface";
export type { IDatabaseBackupRepository } from "./database-backup.repository.interface";
