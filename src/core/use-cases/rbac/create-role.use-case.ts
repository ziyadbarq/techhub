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
import { LogExecution } from "@/lib/decorators";

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
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
    // Check if role already exists
    const exists = await this.roleRepository.existsByName(request.name);
    if (exists) {
      throw new DuplicateRoleError(request.name);
    }

    // Create role entity
    const role = Role.create(
      {
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        isSystem: request.isSystem,
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
