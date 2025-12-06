/**
 * Assign First System Administrator Use Case
 * Assigns system administrator role to the first user (one-time setup)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { UserRole } from "@/core/domain/entities/user-role.entity";

export interface AssignFirstAdminRequest {
  userId: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

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
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: AssignFirstAdminRequest,
  ): Promise<AssignFirstAdminResult> {
    const { userId, metadata } = request;

    this.logger.info("Assigning first system administrator", { userId });

    // Check if system admin role exists
    const adminRole = await this.roleRepository.findByName(
      SYSTEM_ADMIN_ROLE_NAME,
    );
    if (!adminRole) {
      this.logger.error(
        "System Administrator role not found - run seed data first",
      );
      return {
        success: false,
        message:
          "System Administrator role not found. Please run database seed first.",
      };
    }

    // Check if system admin already exists
    const existingAdmins = await this.userRoleRepository.findByRoleId(
      adminRole.id,
    );
    if (existingAdmins.length > 0) {
      this.logger.warn("System Administrator already exists", {
        existingAdminCount: existingAdmins.length,
      });
      return {
        success: false,
        message: "System Administrator already exists.",
      };
    }

    // Check if user already has system-administrator role
    const userRoles = await this.userRoleRepository.findByUserId(userId);
    const hasAdminRole = userRoles.some((ur) => ur.roleId === adminRole.id);

    if (hasAdminRole) {
      return {
        success: false,
        message: "User already has System Administrator role.",
      };
    }

    // Create user role assignment
    const userRole = UserRole.create(
      {
        userId,
        roleId: adminRole.id,
        createdBy: "system", // First admin is assigned by system
      },
      this.idGenerator,
    );

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
          roleName: SYSTEM_ADMIN_ROLE_NAME,
        },
      },
      metadata: {
        ...metadata,
        reason: "First system administrator setup",
        isFirstAdmin: true,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    this.logger.info("First System Administrator assigned successfully", {
      userId,
      roleId: adminRole.id,
    });

    return {
      success: true,
      message: "System Administrator role assigned successfully.",
    };
  }
}
