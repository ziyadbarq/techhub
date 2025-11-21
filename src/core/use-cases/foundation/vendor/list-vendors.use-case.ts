/**
 * List Vendors Use Case
 *
 * Business logic for listing vendors with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Vendor } from "@/core/domain/entities/vendor.entity";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";

export interface ListVendorsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "createdAt";
  order?: "asc" | "desc";
  isPreferred?: boolean;
  isActive?: boolean;
  country?: string;
  tag?: string;
}

@injectable()
export class ListVendorsUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
  ) {}

  /**
   * Execute list vendors use case
   *
   * @param options - Optional filter options
   * @returns Array of vendors
   */
  async execute(options?: ListVendorsOptions): Promise<Vendor[]> {
    // TODO: Implement findPreferred, findActive, findByCountry, findByTag methods in repository
    // if (options?.isPreferred !== undefined) {
    //   return await this.vendorRepository.findPreferred();
    // }

    // if (options?.isActive !== undefined) {
    //   return await this.vendorRepository.findActive(options.isActive);
    // }

    // if (options?.country) {
    //   return await this.vendorRepository.findByCountry(options.country);
    // }

    // if (options?.tag) {
    //   return await this.vendorRepository.findByTag(options.tag);
    // }

    return await this.vendorRepository.findAll(options);
  }
}
