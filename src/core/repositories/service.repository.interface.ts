import type { Service } from "@/core/domain/entities/service.entity";
import type {
  ServiceType,
  ServiceStatus,
  CriticalityLevel,
} from "@/generated/prisma";

export interface IServiceRepository {
  /**
   * Create a new service
   */
  create(service: Service): Promise<Service>;

  /**
   * Find service by ID
   */
  findById(id: string): Promise<Service | null>;

  /**
   * Find all services with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "serviceType" | "currentStatus" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Service[]>;

  /**
   * Update a service
   */
  update(service: Service): Promise<Service>;

  /**
   * Delete a service
   */
  delete(id: string): Promise<void>;

  /**
   * Find services by type
   */
  findByType(
    type: ServiceType,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find services by status
   */
  findByStatus(
    status: ServiceStatus,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find services by criticality level
   */
  findByCriticality(
    criticality: CriticalityLevel,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find essential services
   */
  findEssentialServices(options?: {
    skip?: number;
    take?: number;
  }): Promise<Service[]>;

  /**
   * Find services by owner (person ID)
   */
  findByOwner(
    personId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find services by vendor
   */
  findByVendor(
    vendorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find services by business process
   */
  findByBusinessProcess(
    businessProcessId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Find services retiring soon (within daysThreshold)
   */
  findRetiringSoon(
    daysThreshold: number,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]>;

  /**
   * Search services by name or description
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Service[]>;

  /**
   * Count total services
   */
  count(): Promise<number>;

  /**
   * Count services by type
   */
  countByType(type: ServiceType): Promise<number>;

  /**
   * Count services by status
   */
  countByStatus(status: ServiceStatus): Promise<number>;

  /**
   * Count essential services
   */
  countEssential(): Promise<number>;

  /**
   * Check if service name already exists (for validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}
