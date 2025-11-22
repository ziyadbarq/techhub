/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { OwnershipType } from "@/generated/prisma";

export interface RemoveServiceOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
}

@injectable()
export class RemoveServiceOwnerUseCase {
  async execute(request: RemoveServiceOwnerRequest): Promise<void> {
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

    // Delete ownership
    await prisma.serviceOwnership.delete({
      where: {
        id: ownership.id,
      },
    });
  }
}
