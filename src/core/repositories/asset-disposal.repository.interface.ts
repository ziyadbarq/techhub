import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import type {
  DisposalStatus,
  DisposalType,
} from "@/core/domain/entities/asset-disposal.entity";

export interface IAssetDisposalRepository {
  /**
   * Create a new asset disposal
   */
  create(disposal: AssetDisposal): Promise<AssetDisposal>;

  /**
   * Find disposal by ID
   */
  findById(id: string): Promise<AssetDisposal | null>;

  /**
   * Find all disposals with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "createdAt" | "updatedAt" | "disposalDate";
    order?: "asc" | "desc";
  }): Promise<AssetDisposal[]>;

  /**
   * Find disposals by asset ID
   */
  findByAssetId(assetId: string): Promise<AssetDisposal[]>;

  /**
   * Find disposals by status
   */
  findByStatus(
    status: DisposalStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find disposals by type
   */
  findByType(
    type: DisposalType,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find disposals initiated by a person
   */
  findByInitiator(
    initiatedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find disposals approved by a person
   */
  findByApprover(
    approvedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find pending approval disposals
   */
  findPendingApproval(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]>;

  /**
   * Find completed disposals within date range
   */
  findCompletedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find disposals by disposal vendor
   */
  findByVendor(
    vendorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]>;

  /**
   * Find disposals that have certificates
   */
  findWithCertificates(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]>;

  /**
   * Find disposals with estimated value range
   */
  findByValueRange(
    minValue: number,
    maxValue: number,
    currency?: string,
  ): Promise<AssetDisposal[]>;

  /**
   * Update an existing disposal
   */
  update(disposal: AssetDisposal): Promise<AssetDisposal>;

  /**
   * Delete a disposal
   */
  delete(id: string): Promise<void>;

  /**
   * Count disposals by status
   */
  countByStatus(status: DisposalStatus): Promise<number>;

  /**
   * Count total disposals
   */
  count(): Promise<number>;
}
