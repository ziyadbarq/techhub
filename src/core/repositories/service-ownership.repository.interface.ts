import type { ServiceOwnership } from "@/generated/prisma";

export interface ServiceOwnershipWithPerson extends ServiceOwnership {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    title: string | null;
  };
}

export interface IServiceOwnershipRepository {
  listByService(serviceId: string): Promise<ServiceOwnership[]>;
  listWithPersonByService(
    serviceId: string,
  ): Promise<ServiceOwnershipWithPerson[]>;
  find(
    serviceId: string,
    personId: string,
    ownershipType: ServiceOwnership["ownershipType"],
  ): Promise<ServiceOwnership | null>;
  addOwner(params: {
    serviceId: string;
    personId: string;
    ownershipType: ServiceOwnership["ownershipType"];
    isPrimary?: boolean;
  }): Promise<ServiceOwnership>;
  removeOwner(
    serviceId: string,
    personId: string,
    ownershipType: ServiceOwnership["ownershipType"],
  ): Promise<void>;
  setPrimaryOwner(
    serviceId: string,
    ownershipType: ServiceOwnership["ownershipType"],
    personId: string,
  ): Promise<void>;
}
