/**
 * System Setup DTOs
 * Data Transfer Objects for system setup operations
 */

import { z } from "zod";

/**
 * Create First User DTO Schema
 */
export const createFirstUserDtoSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type CreateFirstUserDto = z.infer<typeof createFirstUserDtoSchema>;

/**
 * System Health Check Result
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

/**
 * Migration Status DTO
 */
export interface MigrationStatusDto {
  applied: string[];
  pending: string[];
  total: number;
}

/**
 * Seed Options DTO Schema
 */
export const seedOptionsDtoSchema = z.object({
  includeFoundation: z.boolean().default(false),
  includeAssets: z.boolean().default(false),
  includeLayer3: z.boolean().default(false),
});

export type SeedOptionsDto = z.infer<typeof seedOptionsDtoSchema>;

/**
 * System Info DTO
 */
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
