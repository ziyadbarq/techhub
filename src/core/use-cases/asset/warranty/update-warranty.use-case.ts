/**
 * UpdateWarranty Use Case
 * Business Logic: Update an existing warranty with validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";
import type { WarrantyCoverageType } from "@/generated/prisma";

export interface UpdateWarrantyProps {
  id: string;
  vendorId?: string | null;
  coverageType?: WarrantyCoverageType;
  coverageDetails?: string | null;
  policyReference?: string | null;
  slaDetails?: Record<string, unknown> | null;
  startDate?: Date;
  endDate?: Date;
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateWarrantyUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(props: UpdateWarrantyProps): Promise<Warranty> {
    // Business Rule: Warranty must exist
    const warranty = await this.warrantyRepository.findById(props.id);
    if (!warranty) {
      throw new Error(`Warranty with ID "${props.id}" not found.`);
    }

    // Business Rule: Policy reference must be unique if provided and changed
    if (
      props.policyReference !== undefined &&
      props.policyReference !== null &&
      props.policyReference !== warranty.policyReference
    ) {
      const existingByPolicy =
        await this.warrantyRepository.existsByPolicyReference(
          props.policyReference,
          props.id,
        );
      if (existingByPolicy) {
        throw new Error(
          `Policy reference "${props.policyReference}" already exists. Policy references must be unique.`,
        );
      }
    }

    // Business Rule: Check for conflicting warranties if dates are changing (optional)
    // Uncomment if you want to prevent overlapping warranties
    /*
    if (props.startDate !== undefined || props.endDate !== undefined) {
      const newStartDate = props.startDate ?? warranty.startDate;
      const newEndDate = props.endDate ?? warranty.endDate;

      const hasConflict = await this.warrantyRepository.hasConflictingWarranty(
        warranty.assetId,
        newStartDate,
        newEndDate,
        props.id,
      );
      if (hasConflict) {
        throw new Error(
          "A warranty with overlapping dates already exists for this asset.",
        );
      }
    }
    */

    // Update the entity (validation happens in entity method)
    warranty.update(props);

    // Persist changes
    return await this.warrantyRepository.update(warranty);
  }
}
