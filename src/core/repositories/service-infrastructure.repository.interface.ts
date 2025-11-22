import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";

export interface IServiceInfrastructureRepository {
  /**
   * Create a new service infrastructure record
   */
  create(infrastructure: ServiceInfrastructure): Promise<ServiceInfrastructure>;

  /**
   * Find infrastructure by ID
   */
  findById(id: string): Promise<ServiceInfrastructure | null>;

  /**
   * Find all infrastructure records for a service
   */
  findByServiceId(serviceId: string): Promise<ServiceInfrastructure[]>;

  /**
   * Update an infrastructure record
   */
  update(infrastructure: ServiceInfrastructure): Promise<ServiceInfrastructure>;

  /**
   * Delete an infrastructure record
   */
  delete(id: string): Promise<void>;
}
