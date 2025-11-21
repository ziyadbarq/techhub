/**
 * LicenseAllocation Presenter
 */

import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";
import type { LicenseAllocationDTO } from "../dtos/generated/license-allocation.dto";

export class LicenseAllocationPresenter {
  static toDTO(allocation: LicenseAllocation): LicenseAllocationDTO {
    return {
      id: allocation.id,
      licenseEntitlementId: allocation.licenseEntitlementId,
      targetType: allocation.targetType,
      targetId: allocation.targetId,
      allocatedQuantity: allocation.allocatedQuantity,
      allocatedAt: allocation.allocatedAt,
      deallocatedAt: allocation.deallocatedAt,
      note: allocation.note,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
      isActive: allocation.isActive(),
    };
  }

  static toDTOList(allocations: LicenseAllocation[]): LicenseAllocationDTO[] {
    return allocations.map((allocation) => this.toDTO(allocation));
  }
}
