/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { OwnershipType } from "@/generated/prisma";

export interface SetPrimaryOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
}

@injectable()
export class SetPrimaryOwnerUseCase {
  async execute(request: SetPrimaryOwnerRequest): Promise<void> {
    // Check if ownership exists
    const ownership = await prisma.serviceOwnership.findUnique({
      where: {
        serviceId_personId_ownershipType: {
          serviceId: request.serviceId,
          personId: request.personId,
          ownershipType: request.ownershipType,
        },
      },
    });

    if (!ownership) {
      throw new Error(
        `Ownership record not found for service ${request.serviceId}, person ${request.personId}, type ${request.ownershipType}`,
      );
    }

    // Unset other primary owners of the same type for this service
    await prisma.serviceOwnership.updateMany({
      where: {
        serviceId: request.serviceId,
        ownershipType: request.ownershipType,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set this ownership as primary
    await prisma.serviceOwnership.update({
      where: {
        id: ownership.id,
      },
      data: {
        isPrimary: true,
      },
    });
  }
}
