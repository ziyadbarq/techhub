/**
 * Create Role Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { Role } from "../../domain/entities/role.entity";
import { DuplicateRoleError } from "../../domain/errors/rbac-errors";
import { ValidationError } from "@/core/domain/errors";
import { SYSTEM_ADMIN_ROLE_NAME } from "../../domain/value-objects/system-role-policy";
import { LogExecution } from "@/lib/decorators";

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  /** Deprecated input: ordinary role creation cannot set system status. */
  isSystem?: boolean;
  createdBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class CreateRoleUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  @LogExecution("rbac.role.create")
  async execute(request: CreateRoleRequest): Promise<Role> {
    const normalizedName = request.name.toLowerCase().trim();

    // The sole protected role is created by bootstrap/seeding, never via a
    // user-controlled role creation request.
    if (normalizedName === SYSTEM_ADMIN_ROLE_NAME) {
      throw new ValidationError("The system administrator role is reserved and cannot be created manually");
    }

    const exists = await this.roleRepository.existsByName(normalizedName);
    if (exists) {
      throw new DuplicateRoleError(normalizedName);
    }

    // Create role entity
    const role = Role.create(
      {
        name: normalizedName,
        displayName: request.displayName,
        description: request.description,
        isSystem: false,
        createdBy: request.createdBy,
      },
      this.idGenerator,
    );

    // Persist role
    const createdRole = await this.roleRepository.create(role);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.createdBy,
      action: "role:create",
      entityType: "role",
      entityId: createdRole.id,
      changes: {
        after: createdRole.toObject(),
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    return createdRole;
  }
}
