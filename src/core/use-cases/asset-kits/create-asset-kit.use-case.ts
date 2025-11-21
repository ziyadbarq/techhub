/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";

export interface CreateAssetKitRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

@injectable()
export class CreateAssetKitUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
  ) {}

  async execute(request: CreateAssetKitRequest): Promise<AssetKit> {
    // Check if code already exists
    const codeExists = await this.assetKitRepository.codeExists(request.code);
    if (codeExists) {
      throw new Error(`Asset kit with code ${request.code} already exists`);
    }

    const kit = AssetKit.create({
      name: request.name,
      code: request.code,
      description: request.description,
      isActive: request.isActive ?? true,
    });

    return this.assetKitRepository.create(kit);
  }
}
