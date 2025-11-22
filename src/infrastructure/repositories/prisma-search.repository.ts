/**
 * Prisma Search Repository Implementation
 *
 * Aggregates search across multiple entity repositories and returns unified results.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  ISearchRepository,
  SearchOptions,
} from "@/core/repositories/search.repository.interface";
import { SearchResult } from "@/core/domain/entities/search/search-result.entity";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaSearchRepository implements ISearchRepository {
  private readonly logger = createRepositoryLogger("SearchRepository");

  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
    @inject(DI_TOKENS.IContractRepository)
    private readonly contractRepository: IContractRepository,
    @inject(DI_TOKENS.ILicenseProductRepository)
    private readonly licenseProductRepository: ILicenseProductRepository,
  ) {}

  async searchAll(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    const timer = this.logger.startTimer();

    try {
      const limit = options?.limit ?? 5;
      const results: SearchResult[] = [];

      // Search all entity types in parallel
      const [
        assets,
        persons,
        vendors,
        configurationItems,
        contracts,
        licenseProducts,
      ] = await Promise.all([
        // Assets
        this.assetRepository.search({ searchTerm: query, limit }),
        // Persons
        this.personRepository.search(query, { take: limit }),
        // Vendors
        this.vendorRepository.search(query, { take: limit }),
        // Configuration Items
        this.ciRepository.search(query, { take: limit }),
        // Contracts
        this.contractRepository.search(query, { take: limit }),
        // License Products
        this.licenseProductRepository.search(query, { take: limit }),
      ]);

      // Map Assets to SearchResults
      for (const asset of assets) {
        results.push(
          SearchResult.create({
            id: asset.id,
            entityType: "asset",
            title: asset.assetTag,
            subtitle: asset.serialNumber || "No serial number",
            metadata: {
              categoryId: asset.assetCategoryId,
              ...(asset.note && { note: asset.note.substring(0, 100) }),
            },
            url: `/assets/${asset.assetTag}`,
          }),
        );
      }

      // Map Persons to SearchResults
      for (const person of persons) {
        const fullName = `${person.firstName} ${person.lastName}`;
        results.push(
          SearchResult.create({
            id: person.id,
            entityType: "person",
            title: fullName,
            subtitle: person.email,
            metadata: {
              ...(person.employeeId && { employeeId: person.employeeId }),
              ...(person.title && { title: person.title }),
            },
            url: `/persons?highlight=${person.id}`,
          }),
        );
      }

      // Map Vendors to SearchResults
      for (const vendor of vendors) {
        results.push(
          SearchResult.create({
            id: vendor.id,
            entityType: "vendor",
            title: vendor.name,
            subtitle: vendor.email || vendor.website || "No contact info",
            metadata: {
              code: vendor.code,
              vendorType: vendor.vendorType,
            },
            url: `/vendors?highlight=${vendor.id}`,
          }),
        );
      }

      // Map Configuration Items to SearchResults
      for (const ci of configurationItems) {
        results.push(
          SearchResult.create({
            id: ci.id,
            entityType: "configuration-item",
            title: ci.name,
            subtitle: ci.ciKey,
            metadata: {
              ...(ci.description && {
                description: ci.description.substring(0, 100),
              }),
              ...(ci.criticality && { criticality: ci.criticality }),
            },
            url: `/configuration-items?highlight=${ci.id}`,
          }),
        );
      }

      // Map Contracts to SearchResults
      for (const contract of contracts) {
        results.push(
          SearchResult.create({
            id: contract.id,
            entityType: "contract",
            title: contract.name,
            subtitle: contract.contractNumber,
            metadata: {
              startDate: contract.startDate.toISOString().split("T")[0],
              ...(contract.endDate && {
                endDate: contract.endDate.toISOString().split("T")[0],
              }),
            },
            url: `/contracts?highlight=${contract.id}`,
          }),
        );
      }

      // Map License Products to SearchResults
      for (const licenseProduct of licenseProducts) {
        results.push(
          SearchResult.create({
            id: licenseProduct.id,
            entityType: "license-product",
            title: licenseProduct.name,
            subtitle: licenseProduct.code,
            metadata: {
              metricType: licenseProduct.metricType,
              ...(licenseProduct.description && {
                description: licenseProduct.description.substring(0, 100),
              }),
            },
            url: `/license-products?highlight=${licenseProduct.id}`,
          }),
        );
      }

      this.logger.timed("searchAll", "Global search completed", timer(), {
        query,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      this.logger.error("searchAll", "Failed to perform global search", error);
      throw error;
    }
  }
}
