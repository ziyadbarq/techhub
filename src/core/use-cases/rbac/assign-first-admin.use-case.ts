/**
 * Assign First Admin Use Case
 * Assigns admin role to the first user (one-time setup)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import { UserRole } from "@/core/domain/entities/user-role.entity";

export interface AssignFirstAdminRequest {
  userId: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface AssignFirstAdminResult {
  success: boolean;
  message: string;
}

@injectable()
export class AssignFirstAdminUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: AssignFirstAdminRequest,
  ): Promise<AssignFirstAdminResult> {
    const { userId, metadata } = request;

    this.logger.info("Assigning first admin", { userId });

    // Check if admin role exists
    const adminRole = await this.roleRepository.findByName("admin");
    if (!adminRole) {
      this.logger.error("Admin role not found - run seed data first");
      return {
        success: false,
        message: "Admin role not found. Please run database seed first.",
      };
    }

    // Check if admin already exists
    const existingAdmins = await this.userRoleRepository.findByRoleId(
      adminRole.id,
    );
    if (existingAdmins.length > 0) {
      this.logger.warn("Admin already exists", {
        existingAdminCount: existingAdmins.length,
      });
      return {
        success: false,
        message: "Admin user already exists.",
      };
    }

    // Check if user already has admin role
    const userRoles = await this.userRoleRepository.findByUserId(userId);
    const hasAdminRole = userRoles.some((ur) => ur.roleId === adminRole.id);

    if (hasAdminRole) {
      return {
        success: false,
        message: "User already has admin role.",
      };
    }

    // Create user role assignment
    const userRole = UserRole.create({
      userId,
      roleId: adminRole.id,
      createdBy: "system", // First admin is assigned by system
    });

    await this.userRoleRepository.create(userRole);

    // Create audit log
    await this.auditLogRepository.create({
      userId: undefined, // System action
      action: "role:assign",
      entityType: "user-role",
      entityId: userRole.id,
      changes: {
        after: {
          userId,
          roleId: adminRole.id,
          roleName: "admin",
        },
      },
      metadata: {
        ...metadata,
        reason: "First admin setup",
        isFirstAdmin: true,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    this.logger.info("First admin assigned successfully", {
      userId,
      roleId: adminRole.id,
    });

    return {
      success: true,
      message: "Admin role assigned successfully.",
    };
  }
}
