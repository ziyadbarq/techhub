/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";

export interface UnlinkServiceFromAssetRequest {
  serviceAssetId: string;
}

@injectable()
export class UnlinkServiceFromAssetUseCase {
  async execute(request: UnlinkServiceFromAssetRequest): Promise<void> {
    // Check if link exists
    const link = await prisma.serviceAsset.findUnique({
      where: { id: request.serviceAssetId },
    });
    if (!link) {
      throw new Error(
        `Service-Asset link with ID ${request.serviceAssetId} not found`,
      );
    }

    // Delete link
    await prisma.serviceAsset.delete({
      where: { id: request.serviceAssetId },
    });
  }
}
