/**
 * Prisma UserRole Repository Implementation
 *
 * This file implements the IUserRoleRepository interface using Prisma ORM.
 * Handles user-role assignments with permission aggregation and expiration logic.
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { type UserRole as PrismaUserRole } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { isPermissionKey } from "@/core/domain/value-objects/permission-key";
import { createRepositoryLogger } from "./repository-logger";

/**
 * PrismaUserRoleRepository
 *
 * Prisma-based implementation of IUserRoleRepository.
 * Handles conversion between Prisma models and domain entities.
 */
@injectable()
export class PrismaUserRoleRepository implements IUserRoleRepository {
  private readonly logger = createRepositoryLogger("UserRoleRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Find user role assignment by ID
   */
  async findById(id: string): Promise<UserRole | null> {
    const timer = this.logger.startTimer();

    try {
      const userRole = await this.prisma.userRole.findUnique({
        where: { id },
      });

      this.logger.timed("findById", "UserRole found by ID", timer(), { id });

      return userRole ? this.toDomain(userRole) : null;
    } catch (error) {
      this.logger.error("findById", "Failed to find UserRole by ID", error, {
        id,
      });
      throw error;
    }
  }

  /**
   * Find all roles for a user
   */
  async findByUserId(userId: string): Promise<UserRole[]> {
    const timer = this.logger.startTimer();

    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      this.logger.timed("findByUserId", "UserRoles found by user ID", timer(), {
        userId,
        count: userRoles.length,
      });

      return userRoles.map((ur) => this.toDomain(ur));
    } catch (error) {
      this.logger.error(
        "findByUserId",
        "Failed to find UserRoles by user ID",
        error,
        { userId },
      );
      throw error;
    }
  }

  /**
   * Find all users with a role
   */
  async findByRoleId(roleId: string): Promise<UserRole[]> {
    const timer = this.logger.startTimer();

    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { roleId },
        orderBy: { createdAt: "desc" },
      });

      this.logger.timed("findByRoleId", "UserRoles found by role ID", timer(), {
        roleId,
        count: userRoles.length,
      });

      return userRoles.map((ur) => this.toDomain(ur));
    } catch (error) {
      this.logger.error(
        "findByRoleId",
        "Failed to find UserRoles by role ID",
        error,
        { roleId },
      );
      throw error;
    }
  }

  /**
   * Find specific user-role assignment
   */
  async findByUserIdAndRoleId(
    userId: string,
    roleId: string,
  ): Promise<UserRole | null> {
    const timer = this.logger.startTimer();

    try {
      const userRole = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: { userId, roleId },
        },
      });

      this.logger.timed(
        "findByUserIdAndRoleId",
        "UserRole found by user and role ID",
        timer(),
        { userId, roleId },
      );

      return userRole ? this.toDomain(userRole) : null;
    } catch (error) {
      this.logger.error(
        "findByUserIdAndRoleId",
        "Failed to find UserRole by user and role ID",
        error,
        { userId, roleId },
      );
      throw error;
    }
  }

  /**
   * Get all permissions for a user (aggregated from all active, non-expired roles)
   */
  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    const timer = this.logger.startTimer();

    try {
      const now = new Date();

      // Query user roles that are active (non-expired or no expiration)
      // Join through RolePermission to get all permissions
      const result = await this.prisma.userRole.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }, // Not expired
          ],
          role: {
            isActive: true,
          },
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
                where: {
                  permission: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      });

      // Extract unique permission keys
      const permissionSet = new Set<string>();

      for (const userRole of result) {
        if (userRole.role) {
          for (const rolePermission of userRole.role.permissions) {
            if (rolePermission.permission) {
              permissionSet.add(rolePermission.permission.name);
            }
          }
        }
      }

      // Filter to only valid permission keys
      const permissions = Array.from(permissionSet).filter(
        isPermissionKey,
      ) as PermissionKey[];

      this.logger.timed(
        "getUserPermissions",
        "User permissions retrieved",
        timer(),
        {
          userId,
          permissionCount: permissions.length,
          roleCount: result.length,
        },
      );

      return permissions;
    } catch (error) {
      this.logger.error(
        "getUserPermissions",
        "Failed to get user permissions",
        error,
        { userId },
      );
      throw error;
    }
  }

  /**
   * Check if user has a specific role (active and non-expired)
   */
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const timer = this.logger.startTimer();

    try {
      const now = new Date();

      const count = await this.prisma.userRole.count({
        where: {
          userId,
          roleId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }, // Not expired
          ],
          role: {
            isActive: true,
          },
        },
      });

      const hasRole = count > 0;

      this.logger.timed("hasRole", "Role check completed", timer(), {
        userId,
        roleId,
        hasRole,
      });

      return hasRole;
    } catch (error) {
      this.logger.error("hasRole", "Failed to check if user has role", error, {
        userId,
        roleId,
      });
      throw error;
    }
  }

  /**
   * Check if user has a specific permission (from any active, non-expired role)
   */
  async hasPermission(
    userId: string,
    permission: PermissionKey,
  ): Promise<boolean> {
    const timer = this.logger.startTimer();

    try {
      const now = new Date();

      const count = await this.prisma.userRole.count({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }, // Not expired
          ],
          role: {
            isActive: true,
            permissions: {
              some: {
                permission: {
                  name: permission,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      const hasPermission = count > 0;

      this.logger.timed(
        "hasPermission",
        "Permission check completed",
        timer(),
        {
          userId,
          permission,
          hasPermission,
        },
      );

      return hasPermission;
    } catch (error) {
      this.logger.error(
        "hasPermission",
        "Failed to check if user has permission",
        error,
        { userId, permission },
      );
      throw error;
    }
  }

  /**
   * Create a new user-role assignment
   */
  async create(userRole: UserRole): Promise<UserRole> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.userRole.create({
        data: {
          id: userRole.id,
          userId: userRole.userId,
          roleId: userRole.roleId,
          expiresAt: userRole.expiresAt,
          createdAt: userRole.createdAt,
          createdBy: userRole.createdBy,
        },
      });

      this.logger.timed("create", "UserRole created successfully", timer(), {
        id: created.id,
        userId: created.userId,
        roleId: created.roleId,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create UserRole", error, {
        userId: userRole.userId,
        roleId: userRole.roleId,
      });
      throw error;
    }
  }

  /**
   * Delete a user-role assignment
   */
  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.userRole.delete({
        where: { id },
      });

      this.logger.timed("delete", "UserRole deleted successfully", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error("delete", "Failed to delete UserRole", error, { id });
      throw error;
    }
  }

  /**
   * Delete by user ID and role ID
   */
  async deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.userRole.delete({
        where: {
          userId_roleId: { userId, roleId },
        },
      });

      this.logger.timed(
        "deleteByUserIdAndRoleId",
        "UserRole deleted by user and role ID",
        timer(),
        { userId, roleId },
      );
    } catch (error) {
      this.logger.error(
        "deleteByUserIdAndRoleId",
        "Failed to delete UserRole by user and role ID",
        error,
        { userId, roleId },
      );
      throw error;
    }
  }

  /**
   * Delete all role assignments for a user
   */
  async deleteByUserId(userId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      const result = await this.prisma.userRole.deleteMany({
        where: { userId },
      });

      this.logger.timed(
        "deleteByUserId",
        "UserRoles deleted by user ID",
        timer(),
        {
          userId,
          deletedCount: result.count,
        },
      );
    } catch (error) {
      this.logger.error(
        "deleteByUserId",
        "Failed to delete UserRoles by user ID",
        error,
        { userId },
      );
      throw error;
    }
  }

  /**
   * Update expiration for a user-role assignment
   */
  async updateExpiration(id: string, expiresAt?: Date): Promise<UserRole> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.userRole.update({
        where: { id },
        data: { expiresAt },
      });

      this.logger.timed(
        "updateExpiration",
        "UserRole expiration updated",
        timer(),
        {
          id,
          expiresAt,
        },
      );

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "updateExpiration",
        "Failed to update UserRole expiration",
        error,
        { id, expiresAt },
      );
      throw error;
    }
  }

  /**
   * Convert Prisma model to domain entity
   *
   * @param prismaUserRole - Prisma UserRole model
   * @returns Domain UserRole entity
   */
  private toDomain(prismaUserRole: PrismaUserRole): UserRole {
    return UserRole.fromPersistence({
      id: prismaUserRole.id,
      userId: prismaUserRole.userId,
      roleId: prismaUserRole.roleId,
      expiresAt: prismaUserRole.expiresAt ?? undefined,
      createdAt: prismaUserRole.createdAt,
      createdBy: prismaUserRole.createdBy ?? undefined,
    });
  }
}
