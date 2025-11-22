/**
 * Create Location Use Case
 *
 * Business logic for creating a new location.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { Location } from "@/core/domain/entities/location.entity";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { LocationType } from "@/core/domain/value-objects/foundation-enums";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateLocationProps {
  code?: string;
  name: string;
  description?: string;
  locationType: LocationType;
  parentId?: string | null;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateLocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  /**
   * Execute create location use case
   *
   * @param props - Location creation properties
   * @returns Created location
   * @throws Error if code already exists
   */
  async execute(props: CreateLocationProps): Promise<Location> {
    // Auto-generate code if not provided
    const code =
      props.code ?? (await this.codeGenerator.generateCode("LOCATION", "LOC"));

    // Check for duplicate code
    const existsByCode = await this.locationRepository.existsByCode(code);
    if (existsByCode) {
      throw new Error(`Location with code "${code}" already exists`);
    }

    const location = Location.create({ ...props, code });
    const created = await this.locationRepository.create(location);
    return created;
  }
}
