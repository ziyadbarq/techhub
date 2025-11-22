import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";

export interface IBusinessProcessRepository {
  /**
   * Create a new business process
   */
  create(businessProcess: BusinessProcess): Promise<BusinessProcess>;

  /**
   * Find business process by ID
   */
  findById(id: string): Promise<BusinessProcess | null>;

  /**
   * Find business process by code
   */
  findByCode(code: string): Promise<BusinessProcess | null>;

  /**
   * Find all business processes with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "category" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<BusinessProcess[]>;

  /**
   * Update a business process
   */
  update(businessProcess: BusinessProcess): Promise<BusinessProcess>;

  /**
   * Delete a business process
   */
  delete(id: string): Promise<void>;

  /**
   * Check if code already exists (for validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;

  /**
   * Search business processes by name or code
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<BusinessProcess[]>;

  /**
   * Count total business processes
   */
  count(): Promise<number>;
}
