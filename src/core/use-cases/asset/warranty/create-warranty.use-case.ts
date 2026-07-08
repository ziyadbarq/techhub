/**
 * CreateWarranty Use Case
 * Business Logic: Create a new warranty with validation
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  Warranty,
  type CreateWarrantyProps,
} from "@/core/domain/entities/warranty.entity";

@injectable()
export class CreateWarrantyUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(props: CreateWarrantyProps): Promise<Warranty> {
    // Business Rule: Policy reference must be unique if provided
    if (props.policyReference) {
      const existingByPolicy =
        await this.warrantyRepository.existsByPolicyReference(
          props.policyReference,
        );
      if (existingByPolicy) {
        throw new ConflictError(
          `Policy reference "${props.policyReference}" already exists. Policy references must be unique.`,
        );
      }
    }

    // Business Rule: Check for conflicting warranties (optional - can be disabled)
    // Uncomment if you want to prevent overlapping warranties
    /*
    const hasConflict = await this.warrantyRepository.hasConflictingWarranty(
      props.assetId,
      props.startDate,
      props.endDate,
    );
    if (hasConflict) {
      throw new ConflictError("A warranty with overlapping dates already exists for this asset.");
    }
    */

    // Create the entity (validation happens in entity factory)
    const warranty = Warranty.create(props);

    // Persist to database
    return await this.warrantyRepository.create(warranty);
  }
}
