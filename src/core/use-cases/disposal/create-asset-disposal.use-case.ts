/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import {
  AssetDisposal,
  type DisposalType,
} from "@/core/domain/entities/asset-disposal.entity";

export interface CreateAssetDisposalRequest {
  assetId: string;
  disposalType: DisposalType;
  reason?: string | null;
  initiatedById: string;
  estimatedValue?: number | null;
  currency?: string | null;
  disposalVendorId?: string | null;
  recipientInfo?: string | null;
  note?: string | null;
}

@injectable()
export class CreateAssetDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  async execute(request: CreateAssetDisposalRequest): Promise<AssetDisposal> {
    // Create disposal entity
    const disposal = AssetDisposal.create({
      assetId: request.assetId,
      disposalType: request.disposalType,
      reason: request.reason,
      initiatedById: request.initiatedById,
      estimatedValue: request.estimatedValue,
      currency: request.currency,
      disposalVendorId: request.disposalVendorId,
      recipientInfo: request.recipientInfo,
      note: request.note,
    });

    // Persist to database
    return this.assetDisposalRepository.create(disposal);
  }
}
