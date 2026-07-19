import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  IServiceOwnershipRepository,
  ServiceOwnershipWithPerson,
} from "@/core/repositories/service-ownership.repository.interface";
import type { ServiceOwnership } from "@/generated/prisma";

@injectable()
export class PrismaServiceOwnershipRepository implements IServiceOwnershipRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async listByService(serviceId: string): Promise<ServiceOwnership[]> {
    return this.prisma.serviceOwnership.findMany({
      where: { serviceId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  async listWithPersonByService(
    serviceId: string,
  ): Promise<ServiceOwnershipWithPerson[]> {
    return this.prisma.serviceOwnership.findMany({
      where: { serviceId },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
          },
        },
      },
      orderBy: [
        { ownershipType: "asc" },
        { isPrimary: "desc" },
        { person: { lastName: "asc" } },
      ],
    });
  }

  async find(
    serviceId: string,
    personId: string,
    ownershipType: ServiceOwnership["ownershipType"],
  ): Promise<ServiceOwnership | null> {
    return this.prisma.serviceOwnership.findUnique({
      where: {
        serviceId_personId_ownershipType: {
          serviceId,
          personId,
          ownershipType,
        },
      },
    });
  }

  async addOwner(params: {
    serviceId: string;
    personId: string;
    ownershipType: ServiceOwnership["ownershipType"];
    isPrimary?: boolean;
  }): Promise<ServiceOwnership> {
    return this.prisma.serviceOwnership.create({
      data: {
        serviceId: params.serviceId,
        personId: params.personId,
        ownershipType: params.ownershipType,
        isPrimary: params.isPrimary ?? false,
      },
    });
  }

  async removeOwner(
    serviceId: string,
    personId: string,
    ownershipType: ServiceOwnership["ownershipType"],
  ): Promise<void> {
    await this.prisma.serviceOwnership.delete({
      where: {
        serviceId_personId_ownershipType: {
          serviceId,
          personId,
          ownershipType,
        },
      },
    });
  }

  async setPrimaryOwner(
    serviceId: string,
    ownershipType: ServiceOwnership["ownershipType"],
    personId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.serviceOwnership.updateMany({
        where: { serviceId },
        data: { isPrimary: false },
      }),
      this.prisma.serviceOwnership.updateMany({
        where: {
          serviceId,
          personId,
          ownershipType,
        },
        data: { isPrimary: true },
      }),
    ]);
  }
}
