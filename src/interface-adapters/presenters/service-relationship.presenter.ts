import type { ServiceRelationship } from "@/core/domain/entities/service-relationship.entity";
import type {
  ServiceRelationshipDTO,
  ImpactedServiceDTO,
} from "../dtos/generated/service-relationship.dto";

export class ServiceRelationshipPresenter {
  static toDTO(
    relationship: ServiceRelationship,
    enrichment?: {
      fromServiceName?: string;
      toServiceName?: string;
    },
  ): ServiceRelationshipDTO {
    return {
      id: relationship.id,
      fromServiceId: relationship.fromServiceId,
      toServiceId: relationship.toServiceId,
      relationshipType: relationship.relationshipType,
      isCritical: relationship.isCritical,
      description: relationship.description,
      metadata: relationship.metadata,
      isActive: relationship.isActive,
      validFrom: relationship.validFrom.toISOString(),
      validTo: relationship.validTo?.toISOString() ?? null,
      createdAt: relationship.createdAt.toISOString(),
      updatedAt: relationship.updatedAt.toISOString(),
      fromServiceName: enrichment?.fromServiceName,
      toServiceName: enrichment?.toServiceName,
    };
  }

  static toDTOList(
    relationships: ServiceRelationship[],
  ): ServiceRelationshipDTO[] {
    return relationships.map((r) => this.toDTO(r));
  }

  static toImpactedServiceDTO(impacted: {
    serviceId: string;
    serviceName: string;
    depth: number;
  }): ImpactedServiceDTO {
    return {
      serviceId: impacted.serviceId,
      serviceName: impacted.serviceName,
      depth: impacted.depth,
    };
  }

  static toImpactedServiceDTOList(
    impacted: { serviceId: string; serviceName: string; depth: number }[],
  ): ImpactedServiceDTO[] {
    return impacted.map((i) => this.toImpactedServiceDTO(i));
  }
}
