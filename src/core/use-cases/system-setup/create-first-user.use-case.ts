/**
 * Create First User Use Case
 * Creates the very first user in the system and assigns SYSTEM_ADMIN role
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import type { CreateFirstUserDto } from "@/interface-adapters/dtos/system-setup.dto";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import { hash } from "@node-rs/argon2";

export interface CreateFirstUserResult {
  success: boolean;
  message: string;
  userId?: string;
}

@injectable()
export class CreateFirstUserUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(request: CreateFirstUserDto): Promise<CreateFirstUserResult> {
    const { email, password, name } = request;

    this.logger.info("Creating first user", { email, name });

    try {
      // Check if any users exist
      const existingUsers = await this.userRepository.listAll();
      if (existingUsers.length > 0) {
        return {
          success: false,
          message: "Users already exist in the system",
        };
      }

      // Check if admin role exists
      const adminRole = await this.roleRepository.findByName("admin");
      if (!adminRole) {
        return {
          success: false,
          message:
            "Admin role not found. Please run minimal seeding first to create RBAC roles.",
        };
      }

      // Hash password
      const passwordHash = await hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      // Create user using Better Auth's schema
      // We need to create the user directly in the database
      // Better Auth will handle the rest during login
      const user = await this.userRepository.createDirectly({
        email,
        name,
        passwordHash,
        emailVerified: true, // First user is auto-verified
      });

      // Assign admin role
      const userRole = UserRole.create({
        userId: user.id,
        roleId: adminRole.id,
        createdBy: "system", // First user is created by system
      });

      await this.userRoleRepository.create(userRole);

      // Get all permissions to assign
      const allPermissions = await this.permissionRepository.listAll();

      // Assign all permissions to admin role (if not already assigned)
      // This is done in the seeding process, but we ensure it here as well
      for (const permission of allPermissions) {
        try {
          await this.roleRepository.assignPermission(
            adminRole.id,
            permission.id,
          );
        } catch {
          // Permission already assigned, ignore
        }
      }

      // Create audit log
      await this.auditLogRepository.create({
        userId: undefined, // System action
        action: "user:create",
        entityType: "user",
        entityId: user.id,
        changes: {
          after: {
            email: user.email,
            name: user.name,
            role: "admin",
          },
        },
        metadata: {
          reason: "First user setup",
          isFirstUser: true,
          permissionsCount: allPermissions.length,
        },
      });

      this.logger.info("First user created successfully", {
        userId: user.id,
        email: user.email,
        roleId: adminRole.id,
      });

      return {
        success: true,
        message: "First user created successfully",
        userId: user.id,
      };
    } catch (error) {
      this.logger.error("Failed to create first user", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create first user",
      };
    }
  }
}
