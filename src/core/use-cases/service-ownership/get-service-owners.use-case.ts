/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { ServiceOwnership } from "@/generated/prisma";

export interface GetServiceOwnersRequest {
  serviceId: string;
}

export interface ServiceOwnershipWithPerson extends ServiceOwnership {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    title: string | null;
  };
}

@injectable()
export class GetServiceOwnersUseCase {
  async execute(
    request: GetServiceOwnersRequest,
  ): Promise<ServiceOwnershipWithPerson[]> {
    // Check if service exists; return empty list instead of throwing to keep UI resilient
    const service = await prisma.service.findUnique({
      where: { id: request.serviceId },
    });
    if (!service) {
      return [];
    }

    // Get all owners for this service
    const owners = await prisma.serviceOwnership.findMany({
      where: {
        serviceId: request.serviceId,
      },
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

    return owners;
  }
}
