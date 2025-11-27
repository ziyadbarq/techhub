/**
 * Prisma Permission Repository Implementation
 *
 * This file implements the IPermissionRepository interface using Prisma ORM.
 * Follows Clean Architecture patterns with:
 * - Dependency injection via InversifyJS
 * - Structured logging for all operations
 * - Entity-to-model mapping
 * - Comprehensive error handling
 *
 * Part of RBAC (Role-Based Access Control) infrastructure.
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { Permission as PrismaPermission } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Permission } from "@/core/domain/entities/permission.entity";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { logger } from "@/lib/logger";

/**
 * Scoped logger for repository operations
 */
const repoLogger = logger.scope("PrismaPermissionRepository");

/**
 * PrismaPermissionRepository
 *
 * Prisma-based implementation of IPermissionRepository.
 * Handles conversion between Prisma models and domain entities.
 * Provides comprehensive logging for all database operations.
 */
@injectable()
export class PrismaPermissionRepository implements IPermissionRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {
    repoLogger.info("constructor", "Permission repository initialized");
  }

  /**
   * Find permission by ID
   */
  async findById(id: string): Promise<Permission | null> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("findById", "Finding permission by ID", { id });

      const permission = await this.prisma.permission.findUnique({
        where: { id },
      });

      const duration = timer();
      repoLogger.timed("findById", "Permission lookup completed", duration, {
        id,
        found: !!permission,
      });

      return permission ? this.toDomain(permission) : null;
    } catch (error) {
      const duration = timer();
      repoLogger.error("findById", "Failed to find permission by ID", error, {
        id,
        duration,
      });
      throw error;
    }
  }

  /**
   * Find permission by name (resource:action)
   */
  async findByName(name: string): Promise<Permission | null> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("findByName", "Finding permission by name", { name });

      const permission = await this.prisma.permission.findUnique({
        where: { name },
      });

      const duration = timer();
      repoLogger.timed("findByName", "Permission lookup completed", duration, {
        name,
        found: !!permission,
      });

      return permission ? this.toDomain(permission) : null;
    } catch (error) {
      const duration = timer();
      repoLogger.error(
        "findByName",
        "Failed to find permission by name",
        error,
        { name, duration },
      );
      throw error;
    }
  }

  /**
   * Find all permissions
   */
  async findAll(params?: { includeInactive?: boolean }): Promise<Permission[]> {
    const timer = repoLogger.startTimer();

    try {
      const includeInactive = params?.includeInactive ?? false;

      repoLogger.debug("findAll", "Finding all permissions", {
        includeInactive,
      });

      const permissions = await this.prisma.permission.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      const duration = timer();
      repoLogger.timed("findAll", "Permissions retrieved", duration, {
        count: permissions.length,
        includeInactive,
      });

      return permissions.map((p: PrismaPermission) => this.toDomain(p));
    } catch (error) {
      const duration = timer();
      repoLogger.error("findAll", "Failed to retrieve all permissions", error, {
        duration,
      });
      throw error;
    }
  }

  /**
   * Find permissions by IDs
   */
  async findByIds(ids: string[]): Promise<Permission[]> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("findByIds", "Finding permissions by IDs", {
        count: ids.length,
      });

      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: ids } },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      const duration = timer();
      repoLogger.timed("findByIds", "Permissions retrieved", duration, {
        requestedCount: ids.length,
        foundCount: permissions.length,
      });

      return permissions.map((p: PrismaPermission) => this.toDomain(p));
    } catch (error) {
      const duration = timer();
      repoLogger.error(
        "findByIds",
        "Failed to find permissions by IDs",
        error,
        { idsCount: ids.length, duration },
      );
      throw error;
    }
  }

  /**
   * Find permissions by resource
   */
  async findByResource(resource: string): Promise<Permission[]> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("findByResource", "Finding permissions by resource", {
        resource,
      });

      const permissions = await this.prisma.permission.findMany({
        where: {
          resource,
          isActive: true,
        },
        orderBy: { action: "asc" },
      });

      const duration = timer();
      repoLogger.timed(
        "findByResource",
        "Permissions retrieved by resource",
        duration,
        {
          resource,
          count: permissions.length,
        },
      );

      return permissions.map((p: PrismaPermission) => this.toDomain(p));
    } catch (error) {
      const duration = timer();
      repoLogger.error(
        "findByResource",
        "Failed to find permissions by resource",
        error,
        { resource, duration },
      );
      throw error;
    }
  }

  /**
   * Find permissions by names
   */
  async findByNames(names: string[]): Promise<Permission[]> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("findByNames", "Finding permissions by names", {
        count: names.length,
      });

      const permissions = await this.prisma.permission.findMany({
        where: { name: { in: names } },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      const duration = timer();
      repoLogger.timed(
        "findByNames",
        "Permissions retrieved by names",
        duration,
        {
          requestedCount: names.length,
          foundCount: permissions.length,
        },
      );

      return permissions.map((p: PrismaPermission) => this.toDomain(p));
    } catch (error) {
      const duration = timer();
      repoLogger.error(
        "findByNames",
        "Failed to find permissions by names",
        error,
        { namesCount: names.length, duration },
      );
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async create(permission: Permission): Promise<Permission> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.info("create", "Creating new permission", {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      });

      const created = await this.prisma.permission.create({
        data: {
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          isSystem: permission.isSystem,
          isActive: permission.isActive,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        },
      });

      const duration = timer();
      repoLogger.timed("create", "Permission created successfully", duration, {
        id: created.id,
        name: created.name,
      });

      return this.toDomain(created);
    } catch (error) {
      const duration = timer();
      repoLogger.error("create", "Failed to create permission", error, {
        name: permission.name,
        duration,
      });
      throw error;
    }
  }

  /**
   * Update an existing permission
   */
  async update(permission: Permission): Promise<Permission> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.info("update", "Updating permission", {
        id: permission.id,
        name: permission.name,
      });

      const updated = await this.prisma.permission.update({
        where: { id: permission.id },
        data: {
          displayName: permission.displayName,
          description: permission.description,
          isActive: permission.isActive,
          updatedAt: permission.updatedAt,
        },
      });

      const duration = timer();
      repoLogger.timed("update", "Permission updated successfully", duration, {
        id: updated.id,
        name: updated.name,
      });

      return this.toDomain(updated);
    } catch (error) {
      const duration = timer();
      repoLogger.error("update", "Failed to update permission", error, {
        id: permission.id,
        name: permission.name,
        duration,
      });
      throw error;
    }
  }

  /**
   * Delete a permission
   */
  async delete(id: string): Promise<void> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.info("delete", "Deleting permission", { id });

      await this.prisma.permission.delete({
        where: { id },
      });

      const duration = timer();
      repoLogger.timed("delete", "Permission deleted successfully", duration, {
        id,
      });
    } catch (error) {
      const duration = timer();
      repoLogger.error("delete", "Failed to delete permission", error, {
        id,
        duration,
      });
      throw error;
    }
  }

  /**
   * Check if permission exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const timer = repoLogger.startTimer();

    try {
      repoLogger.debug("existsByName", "Checking permission existence", {
        name,
      });

      const count = await this.prisma.permission.count({
        where: { name },
      });

      const exists = count > 0;
      const duration = timer();
      repoLogger.timed(
        "existsByName",
        "Permission existence check completed",
        duration,
        {
          name,
          exists,
        },
      );

      return exists;
    } catch (error) {
      const duration = timer();
      repoLogger.error(
        "existsByName",
        "Failed to check permission existence",
        error,
        { name, duration },
      );
      throw error;
    }
  }

  /**
   * Convert Prisma model to domain entity
   *
   * @param prismaPermission - Prisma Permission model
   * @returns Domain Permission entity
   */
  private toDomain(prismaPermission: PrismaPermission): Permission {
    return Permission.fromPersistence({
      id: prismaPermission.id,
      name: prismaPermission.name,
      displayName: prismaPermission.displayName,
      description: prismaPermission.description ?? undefined,
      resource: prismaPermission.resource,
      action: prismaPermission.action,
      isSystem: prismaPermission.isSystem,
      isActive: prismaPermission.isActive,
      createdAt: prismaPermission.createdAt,
      updatedAt: prismaPermission.updatedAt,
    });
  }
}
