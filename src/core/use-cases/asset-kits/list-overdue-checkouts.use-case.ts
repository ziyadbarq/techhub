/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";

export interface ListOverdueCheckoutsResponse {
  checkouts: AssetKitCheckout[];
  total: number;
}

@injectable()
export class ListOverdueCheckoutsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(): Promise<ListOverdueCheckoutsResponse> {
    const checkouts = await this.kitCheckoutRepository.findOverdue();

    return {
      checkouts,
      total: checkouts.length,
    };
  }
}
