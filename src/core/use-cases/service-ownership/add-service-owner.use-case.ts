/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { OwnershipType } from "@/generated/prisma";

export interface AddServiceOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
  isPrimary?: boolean;
}

@injectable()
export class AddServiceOwnerUseCase {
  async execute(request: AddServiceOwnerRequest): Promise<void> {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: request.serviceId },
    });
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    // Check if person exists
    const person = await prisma.person.findUnique({
      where: { id: request.personId },
    });
    if (!person) {
      throw new Error(`Person with ID ${request.personId} not found`);
    }

    // Check if ownership already exists
    const existing = await prisma.serviceOwnership.findUnique({
      where: {
        serviceId_personId_ownershipType: {
          serviceId: request.serviceId,
          personId: request.personId,
          ownershipType: request.ownershipType,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Person is already a ${request.ownershipType} owner of this service`,
      );
    }

    // If setting as primary, unset other primary owners of the same type
    if (request.isPrimary) {
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
    }

    // Create ownership
    await prisma.serviceOwnership.create({
      data: {
        serviceId: request.serviceId,
        personId: request.personId,
        ownershipType: request.ownershipType,
        isPrimary: request.isPrimary ?? false,
      },
    });
  }
}
