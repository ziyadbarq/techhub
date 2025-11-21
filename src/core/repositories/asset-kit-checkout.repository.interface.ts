import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import type {
  KitCheckoutStatus,
  AssigneeType,
} from "@/core/domain/entities/asset-kit-checkout.entity";

export interface IAssetKitCheckoutRepository {
  /**
   * Create a new kit checkout
   */
  create(checkout: AssetKitCheckout): Promise<AssetKitCheckout>;

  /**
   * Find checkout by ID
   */
  findById(id: string): Promise<AssetKitCheckout | null>;

  /**
   * Find all checkouts with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "checkoutDate" | "expectedReturnDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts by kit ID
   */
  findByKitId(
    kitId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts by assignee
   */
  findByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts by status
   */
  findByStatus(
    status: KitCheckoutStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Find active checkouts (checked out or partially returned)
   */
  findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckout[]>;

  /**
   * Find overdue checkouts
   */
  findOverdue(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts by person who checked them out
   */
  findByCheckedOutBy(
    checkedOutById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts due within date range
   */
  findDueInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Find checkouts checked out within date range
   */
  findCheckedOutInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]>;

  /**
   * Check if assignee has active checkout for a kit
   */
  hasActiveCheckout(
    kitId: string,
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<boolean>;

  /**
   * Update a checkout
   */
  update(checkout: AssetKitCheckout): Promise<AssetKitCheckout>;

  /**
   * Delete a checkout
   */
  delete(id: string): Promise<void>;

  /**
   * Count checkouts by status
   */
  countByStatus(status: KitCheckoutStatus): Promise<number>;

  /**
   * Count overdue checkouts
   */
  countOverdue(): Promise<number>;

  /**
   * Count active checkouts
   */
  countActive(): Promise<number>;

  /**
   * Count total checkouts
   */
  count(): Promise<number>;
}
