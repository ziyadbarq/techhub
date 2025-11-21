/**
 * Prisma AuditLog Repository Implementation
 *
 * This file implements the IAuditLogRepository interface using Prisma ORM.
 * Provides comprehensive audit logging capabilities with:
 * - Flexible filtering (user, action, entity, date range)
 * - Pagination support
 * - Structured logging
 * - Type-safe JSON field handling
 * - Cleanup operations for old logs
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { AuditLog as PrismaAuditLog } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import type {
  IAuditLogRepository,
  AuditLogEntry,
  CreateAuditLogParams,
  FindAuditLogsParams,
} from "@/core/repositories/audit-log-repository.interface";
import {
  createRepositoryLogger,
  logRepositoryOperation,
} from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

/**
 * PrismaAuditLogRepository
 *
 * Prisma-based implementation of IAuditLogRepository.
 * Handles audit log operations with comprehensive filtering and pagination.
 */
@injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  private readonly logger = createRepositoryLogger("AuditLogRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Create a new audit log entry
   */
  async create(params: CreateAuditLogParams): Promise<AuditLogEntry> {
    return logRepositoryOperation(
      this.logger,
      "create",
      async () => {
        const created = await this.prisma.auditLog.create({
          data: {
            userId: params.userId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            changes: params.changes ? toJsonValue(params.changes) : undefined,
            metadata: params.metadata
              ? toJsonValue(params.metadata)
              : undefined,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
          },
        });

        return this.toDomain(created);
      },
      {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    );
  }

  /**
   * Find audit logs with flexible filters
   */
  async find(params: FindAuditLogsParams): Promise<AuditLogEntry[]> {
    return logRepositoryOperation(
      this.logger,
      "find",
      async () => {
        const where = this.buildWhereClause(params);

        const logs = await this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: params.limit,
          skip: params.offset,
        });

        return logs.map((log: PrismaAuditLog) => this.toDomain(log));
      },
      {
        filters: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          hasDateRange: !!(params.startDate || params.endDate),
        },
        pagination: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );
  }

  /**
   * Find audit logs for a specific user
   */
  async findByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<AuditLogEntry[]> {
    return logRepositoryOperation(
      this.logger,
      "findByUserId",
      async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        });

        return logs.map((log: PrismaAuditLog) => this.toDomain(log));
      },
      { userId, limit, offset },
    );
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntry[]> {
    return logRepositoryOperation(
      this.logger,
      "findByEntity",
      async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: {
            entityType,
            entityId,
          },
          orderBy: { createdAt: "desc" },
        });

        return logs.map((log: PrismaAuditLog) => this.toDomain(log));
      },
      { entityType, entityId },
    );
  }

  /**
   * Find audit logs by action
   */
  async findByAction(
    action: string,
    limit?: number,
    offset?: number,
  ): Promise<AuditLogEntry[]> {
    return logRepositoryOperation(
      this.logger,
      "findByAction",
      async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: { action },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        });

        return logs.map((log: PrismaAuditLog) => this.toDomain(log));
      },
      { action, limit, offset },
    );
  }

  /**
   * Count total audit logs with optional filters
   */
  async count(params?: FindAuditLogsParams): Promise<number> {
    return logRepositoryOperation(
      this.logger,
      "count",
      async () => {
        const where = params ? this.buildWhereClause(params) : undefined;

        return await this.prisma.auditLog.count({ where });
      },
      {
        hasFilters: !!params,
        filters: params
          ? {
              userId: params.userId,
              action: params.action,
              entityType: params.entityType,
              entityId: params.entityId,
            }
          : undefined,
      },
    );
  }

  /**
   * Delete old audit logs (for cleanup/retention policies)
   * Returns number of deleted records
   */
  async deleteOlderThan(date: Date): Promise<number> {
    return logRepositoryOperation(
      this.logger,
      "deleteOlderThan",
      async () => {
        const result = await this.prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: date,
            },
          },
        });

        return result.count;
      },
      { beforeDate: date.toISOString() },
    );
  }

  /**
   * Build Prisma where clause from filter parameters
   *
   * @param params - Filter parameters
   * @returns Prisma where clause
   */
  private buildWhereClause(params: FindAuditLogsParams) {
    const where: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    // Filter by user
    if (params.userId) {
      where.userId = params.userId;
    }

    // Filter by action
    if (params.action) {
      where.action = params.action;
    }

    // Filter by entity type
    if (params.entityType) {
      where.entityType = params.entityType;
    }

    // Filter by entity ID
    if (params.entityId) {
      where.entityId = params.entityId;
    }

    // Filter by date range
    if (params.startDate || params.endDate) {
      where.createdAt = {};

      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }

      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    return where;
  }

  /**
   * Convert Prisma model to domain interface
   *
   * @param prismaLog - Prisma AuditLog model
   * @returns Domain AuditLogEntry
   */
  private toDomain(prismaLog: PrismaAuditLog): AuditLogEntry {
    return {
      id: prismaLog.id,
      userId: prismaLog.userId ?? undefined,
      action: prismaLog.action,
      entityType: prismaLog.entityType,
      entityId: prismaLog.entityId ?? undefined,
      changes:
        fromJsonValue<Record<string, unknown>>(prismaLog.changes) ?? undefined,
      metadata:
        fromJsonValue<Record<string, unknown>>(prismaLog.metadata) ?? undefined,
      ipAddress: prismaLog.ipAddress ?? undefined,
      userAgent: prismaLog.userAgent ?? undefined,
      createdAt: prismaLog.createdAt,
    };
  }
}
