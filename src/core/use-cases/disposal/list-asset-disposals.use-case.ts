/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type {
  AssetDisposal,
  DisposalStatus,
} from "@/core/domain/entities/asset-disposal.entity";

export interface ListAssetDisposalsRequest {
  status?: DisposalStatus;
  assetId?: string;
  skip?: number;
  take?: number;
  orderBy?: "createdAt" | "updatedAt" | "disposalDate";
  order?: "asc" | "desc";
}

@injectable()
export class ListAssetDisposalsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  async execute(request: ListAssetDisposalsRequest): Promise<AssetDisposal[]> {
    // If filtering by status
    if (request.status) {
      return this.assetDisposalRepository.findByStatus(request.status, {
        skip: request.skip,
        take: request.take,
      });
    }

    // If filtering by asset
    if (request.assetId) {
      return this.assetDisposalRepository.findByAssetId(request.assetId);
    }

    // Otherwise return all with pagination/sorting
    return this.assetDisposalRepository.findAll({
      skip: request.skip,
      take: request.take,
      orderBy: request.orderBy,
      order: request.order,
    });
  }
}
