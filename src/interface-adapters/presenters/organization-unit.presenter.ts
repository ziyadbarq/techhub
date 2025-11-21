/**
 * Organization Unit Presenter
 * Transforms Organization Unit domain entities into DTOs for the UI layer
 */

import type { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

export interface OrganizationUnitDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  unitType: OrganizationUnitType;
  parentId: string | null;
  managerId: string | null;
  costCenter: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentOrganizationUnit(
  unit: OrganizationUnit,
): OrganizationUnitDTO {
  return {
    id: unit.id,
    name: unit.name,
    code: unit.code,
    description: unit.description,
    unitType: unit.unitType,
    parentId: unit.parentId,
    managerId: unit.managerId,
    costCenter: unit.costCenter,
    isActive: unit.isActive,
    metadata: unit.metadata,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString(),
  };
}

export function presentOrganizationUnits(
  units: OrganizationUnit[],
): OrganizationUnitDTO[] {
  return units.map(presentOrganizationUnit);
}
