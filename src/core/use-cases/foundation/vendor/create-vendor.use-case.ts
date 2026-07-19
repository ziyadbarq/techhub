/**
 * Create Vendor Use Case
 *
 * Business logic for creating a new vendor.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { Vendor } from "@/core/domain/entities/vendor.entity";
import type { VendorType } from "@/core/domain/value-objects/foundation-enums";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateVendorProps {
  name: string;
  code?: string;
  legalName?: string | null;
  description?: string | null;
  vendorType: VendorType;
  taxId?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  isPreferred?: boolean;
  tags?: string[];
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class CreateVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Execute create vendor use case
   *
   * @param props - Vendor creation properties
   * @returns Created vendor
   * @throws Error if name already exists
   */
  async execute(props: CreateVendorProps): Promise<Vendor> {
    // Check for duplicate name
    const existingVendor = await this.vendorRepository.findByName(props.name);
    if (existingVendor) {
      throw new ConflictError(
        `Vendor with name "${props.name}" already exists`,
      );
    }

    // Auto-generate code if not provided or empty
    const code =
      props.code || (await this.codeGenerator.generateCode("VENDOR", "VENDOR"));

    const vendor = Vendor.create({ ...props, code });
    const created = await this.vendorRepository.create(vendor);
    return created;
  }
}
