/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type {
  AssetKit,
  KitType,
} from "@/core/domain/entities/asset-kit.entity";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateAssetKitRequest {
  name: string;
  code?: string;
  description?: string;
  kitType?: KitType;
  isActive?: boolean;
}

@injectable()
export class CreateAssetKitUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateAssetKitRequest): Promise<AssetKit> {
    // Auto-generate code if not provided or empty
    const code =
      request.code ||
      (await this.codeGenerator.generateCode("ASSET_KIT", "KIT"));

    // Check if code already exists
    const codeExists = await this.assetKitRepository.codeExists(code);
    if (codeExists) {
      throw new Error(`Asset kit with code ${code} already exists`);
    }

    const kit = AssetKit.create(
      {
        name: request.name,
        code,
        description: request.description,
        kitType: request.kitType,
        isActive: request.isActive ?? true,
      },
      this.idGenerator,
    );

    return this.assetKitRepository.create(kit, this.idGenerator);
  }
}
