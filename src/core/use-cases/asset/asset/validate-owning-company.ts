/**
 * Owning company validation shared by asset create/update.
 *
 * An asset belongs to a legal entity (Barq, Aoun, ...), which this codebase
 * models as a COMPANY-level OrganizationUnit. Nothing in the schema stops a
 * caller from pointing owningOrgUnitId at a department, so the rule is
 * enforced here, above the repository.
 */

import { ValidationError } from "@/core/domain/errors/validation.error";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { OWNING_COMPANY_UNIT_TYPE } from "@/core/domain/value-objects/foundation-enums";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

/**
 * Throws unless the given org unit exists and is a company.
 *
 * @param organizationUnitRepository - Repository used to resolve the unit
 * @param owningOrgUnitId - Org unit id to validate; null/undefined is a no-op
 */
export async function assertOwningCompany(
  organizationUnitRepository: IOrganizationUnitRepository,
  owningOrgUnitId: string | null | undefined,
): Promise<void> {
  if (!owningOrgUnitId) {
    return;
  }

  const orgUnit = await organizationUnitRepository.findById(owningOrgUnitId);
  if (!orgUnit) {
    throw new NotFoundError("Owning company not found");
  }

  if (orgUnit.unitType !== OWNING_COMPANY_UNIT_TYPE) {
    throw new ValidationError(
      `"${orgUnit.name}" is a ${orgUnit.unitType.toLowerCase()}, not a company. An asset can only be owned by a company.`,
    );
  }
}
