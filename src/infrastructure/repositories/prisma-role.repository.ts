/**
 * Prisma Role Repository Implementation
 *
 * Implements IRoleRepository interface using Prisma ORM.
 * Handles role CRUD operations and permission assignments.
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { type Role as PrismaRole } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Role } from "@/core/domain/entities/role.entity";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { createRepositoryLogger } from "./repository-logger";

/**
 * PrismaRoleRepository
 *
 * Prisma-based implementation of IRoleRepository.
 * Handles conversion between Prisma models and domain entities.
 */
@injectable()
export class PrismaRoleRepository implements IRoleRepository {
  private readonly logger = createRepositoryLogger("PrismaRoleRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Find role by ID
   */
  async findById(id: string): Promise<Role | null> {
    const timer = this.logger.startTimer();
    this.logger.debug("findById", "Finding role by ID", { id });

    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });

      const result = role ? this.toDomain(role) : null;
      this.logger.timed(
        "findById",
        result ? "Role found" : "Role not found",
        timer(),
        { id, found: !!result },
      );

      return result;
    } catch (error) {
      this.logger.error("findById", "Failed to find role by ID", error, { id });
      throw error;
    }
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    const timer = this.logger.startTimer();
    this.logger.debug("findByName", "Finding role by name", { name });

    try {
      const role = await this.prisma.role.findUnique({
        where: { name },
      });

      const result = role ? this.toDomain(role) : null;
      this.logger.timed(
        "findByName",
        result ? "Role found" : "Role not found",
        timer(),
        { name, found: !!result },
      );

      return result;
    } catch (error) {
      this.logger.error("findByName", "Failed to find role by name", error, {
        name,
      });
      throw error;
    }
  }

  /**
   * Find all roles
   */
  async findAll(params?: { includeInactive?: boolean }): Promise<Role[]> {
    const timer = this.logger.startTimer();
    const includeInactive = params?.includeInactive ?? false;

    this.logger.debug("findAll", "Finding all roles", { includeInactive });

    try {
      const roles = await this.prisma.role.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      });

      const result = roles.map(this.toDomain);
      this.logger.timed("findAll", "Roles fetched successfully", timer(), {
        count: result.length,
        includeInactive,
      });

      return result;
    } catch (error) {
      this.logger.error("findAll", "Failed to find all roles", error, {
        includeInactive,
      });
      throw error;
    }
  }

  /**
   * Find roles by IDs
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    const timer = this.logger.startTimer();
    this.logger.debug("findByIds", "Finding roles by IDs", {
      ids,
      count: ids.length,
    });

    try {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: ids } },
      });

      const result = roles.map(this.toDomain);
      this.logger.timed("findByIds", "Roles fetched successfully", timer(), {
        requestedCount: ids.length,
        foundCount: result.length,
      });

      return result;
    } catch (error) {
      this.logger.error("findByIds", "Failed to find roles by IDs", error, {
        ids,
      });
      throw error;
    }
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<PermissionKey[]> {
    const timer = this.logger.startTimer();
    this.logger.debug("getRolePermissions", "Getting role permissions", {
      roleId,
    });

    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      });

      const result = rolePermissions.map(
        (rp: { permission: { name: string } }) =>
          rp.permission.name as PermissionKey,
      );

      this.logger.timed(
        "getRolePermissions",
        "Permissions fetched successfully",
        timer(),
        {
          roleId,
          permissionCount: result.length,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        "getRolePermissions",
        "Failed to get role permissions",
        error,
        { roleId },
      );
      throw error;
    }
  }

  /**
   * Get all roles with their permissions in a single query (optimized)
   * Avoids N+1 query pattern by using a single join
   */
  async findAllWithPermissions(params?: {
    includeInactive?: boolean;
  }): Promise<Array<[Role, PermissionKey[]]>> {
    const timer = this.logger.startTimer();
    const includeInactive = params?.includeInactive ?? false;

    this.logger.debug(
      "findAllWithPermissions",
      "Finding all roles with permissions",
      {
        includeInactive,
      },
    );

    try {
      const rolesWithPermissions = await this.prisma.role.findMany({
        where: includeInactive ? undefined : { isActive: true },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      const result = rolesWithPermissions.map(
        (roleData): [Role, PermissionKey[]] => {
          const role = this.toDomain(roleData);
          const permissions = roleData.permissions.map(
            (rp: { permission: { name: string } }) =>
              rp.permission.name as PermissionKey,
          );
          return [role, permissions];
        },
      );

      this.logger.timed(
        "findAllWithPermissions",
        "Roles with permissions fetched successfully",
        timer(),
        {
          roleCount: result.length,
          includeInactive,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        "findAllWithPermissions",
        "Failed to find roles with permissions",
        error,
        { includeInactive },
      );
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async create(role: Role): Promise<Role> {
    const timer = this.logger.startTimer();
    this.logger.debug("create", "Creating role", {
      name: role.name,
      displayName: role.displayName,
    });

    try {
      const created = await this.prisma.role.create({
        data: {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          isSystem: role.isSystem,
          isActive: role.isActive,
          createdBy: role.createdBy,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      });

      const result = this.toDomain(created);
      this.logger.timed("create", "Role created successfully", timer(), {
        id: result.id,
        name: result.name,
      });

      return result;
    } catch (error) {
      this.logger.error("create", "Failed to create role", error, {
        name: role.name,
      });
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async update(role: Role): Promise<Role> {
    const timer = this.logger.startTimer();
    this.logger.debug("update", "Updating role", {
      id: role.id,
      name: role.name,
    });

    try {
      const updated = await this.prisma.role.update({
        where: { id: role.id },
        data: {
          displayName: role.displayName,
          description: role.description,
          isActive: role.isActive,
          updatedAt: role.updatedAt,
        },
      });

      const result = this.toDomain(updated);
      this.logger.timed("update", "Role updated successfully", timer(), {
        id: result.id,
        name: result.name,
      });

      return result;
    } catch (error) {
      this.logger.error("update", "Failed to update role", error, {
        id: role.id,
      });
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();
    this.logger.debug("delete", "Deleting role", { id });

    try {
      await this.prisma.role.delete({
        where: { id },
      });

      this.logger.timed("delete", "Role deleted successfully", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete role", error, { id });
      throw error;
    }
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const timer = this.logger.startTimer();
    this.logger.debug("assignPermissions", "Assigning permissions to role", {
      roleId,
      permissionIds,
      count: permissionIds.length,
    });

    try {
      // Use createMany with skipDuplicates to avoid errors on existing permissions
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      });

      this.logger.timed(
        "assignPermissions",
        "Permissions assigned successfully",
        timer(),
        {
          roleId,
          permissionCount: permissionIds.length,
        },
      );
    } catch (error) {
      this.logger.error(
        "assignPermissions",
        "Failed to assign permissions",
        error,
        {
          roleId,
          permissionIds,
        },
      );
      throw error;
    }
  }

  /**
   * Remove permissions from a role
   */
  async removePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const timer = this.logger.startTimer();
    this.logger.debug("removePermissions", "Removing permissions from role", {
      roleId,
      permissionIds,
      count: permissionIds.length,
    });

    try {
      await this.prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: { in: permissionIds },
        },
      });

      this.logger.timed(
        "removePermissions",
        "Permissions removed successfully",
        timer(),
        {
          roleId,
          permissionCount: permissionIds.length,
        },
      );
    } catch (error) {
      this.logger.error(
        "removePermissions",
        "Failed to remove permissions",
        error,
        {
          roleId,
          permissionIds,
        },
      );
      throw error;
    }
  }

  /**
   * Remove all permissions from a role
   */
  async removeAllPermissions(roleId: string): Promise<void> {
    const timer = this.logger.startTimer();
    this.logger.debug(
      "removeAllPermissions",
      "Removing all permissions from role",
      {
        roleId,
      },
    );

    try {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      this.logger.timed(
        "removeAllPermissions",
        "All permissions removed successfully",
        timer(),
        {
          roleId,
        },
      );
    } catch (error) {
      this.logger.error(
        "removeAllPermissions",
        "Failed to remove all permissions",
        error,
        {
          roleId,
        },
      );
      throw error;
    }
  }

  /**
   * Check if role exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const timer = this.logger.startTimer();
    this.logger.debug("existsByName", "Checking if role exists by name", {
      name,
    });

    try {
      const count = await this.prisma.role.count({
        where: { name },
      });

      const result = count > 0;
      this.logger.timed(
        "existsByName",
        result ? "Role exists" : "Role does not exist",
        timer(),
        {
          name,
          exists: result,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        "existsByName",
        "Failed to check if role exists by name",
        error,
        {
          name,
        },
      );
      throw error;
    }
  }

  /**
   * Convert Prisma model to domain entity
   *
   * @param prismaRole - Prisma Role model
   * @returns Domain Role entity
   */
  private toDomain(prismaRole: PrismaRole): Role {
    return Role.fromPersistence({
      id: prismaRole.id,
      name: prismaRole.name,
      displayName: prismaRole.displayName,
      description: prismaRole.description ?? undefined,
      isSystem: prismaRole.isSystem,
      isActive: prismaRole.isActive,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      createdBy: prismaRole.createdBy ?? undefined,
    });
  }
}
