/**
 * Create First User Use Case
 * Creates the very first user in the system and assigns SYSTEM_ADMIN role
 * Creates user directly but follows Better Auth's conventions for compatibility
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { CreateFirstUserDto } from "@/interface-adapters/dtos/system-setup.dto";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import { hash } from "bcryptjs";

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
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
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

      // Check if system-administrator role exists
      const adminRole = await this.roleRepository.findByName(
        "system-administrator",
      );
      if (!adminRole) {
        return {
          success: false,
          message:
            "System Administrator role not found. Please run minimal seeding first to create RBAC roles.",
        };
      }

      // Ensure default org unit exists (Better Auth hooks will need it for Person creation)
      const orgUnits = await this.organizationUnitRepository.findAll();
      if (!orgUnits || orgUnits.length === 0) {
        this.logger.info(
          "No organization units found, creating default for Better Auth hooks",
        );
        const { OrganizationUnit } = await import(
          "@/core/domain/entities/organization-unit.entity"
        );
        const { OrganizationUnitType } = await import(
          "@/core/domain/value-objects/foundation-enums"
        );
        const defaultOrgUnit = OrganizationUnit.create({
          name: "Default Organization",
          code: "ORG-DEFAULT",
          unitType: OrganizationUnitType.DEPARTMENT,
          parentId: null,
          level: 1,
          description: "Default organization unit created during system setup",
        });
        await this.organizationUnitRepository.create(defaultOrgUnit);
        this.logger.info("Default organization unit created");
      }

      // Hash password using same method as Better Auth
      const passwordHash = await hash(password, 12);

      // Create user directly using repository (follows Better Auth's schema conventions)
      // Better Auth's after hooks will automatically create Person entity
      const user = await this.userRepository.createDirectly({
        email,
        name,
        passwordHash,
        emailVerified: true, // First user is auto-verified
      });

      this.logger.info("User created", { userId: user.id, email });

      // Assign system-administrator role (setup-specific logic)
      const userRole = UserRole.create({
        userId: user.id,
        roleId: adminRole.id,
        createdBy: "system",
      });
      await this.userRoleRepository.create(userRole);

      this.logger.info("System administrator role assigned", {
        userId: user.id,
        roleId: adminRole.id,
      });

      // Get all permissions to assign to admin role (ensure complete access)
      const allPermissions = await this.permissionRepository.findAll({
        includeInactive: true,
      });

      await this.roleRepository.assignPermissions(
        adminRole.id,
        allPermissions.map((permission) => permission.id),
      );

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
            role: "system-administrator",
            isFirstUser: true,
          },
        },
        metadata: {
          reason: "First user setup",
          permissionsCount: allPermissions.length,
          note: "Better Auth hooks handle Person creation automatically",
        },
      });

      this.logger.info("First user setup completed successfully", {
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
      this.logger.error(
        "Failed to create first user",
        error instanceof Error ? error : undefined,
        {
          email,
          name,
        },
      );

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
