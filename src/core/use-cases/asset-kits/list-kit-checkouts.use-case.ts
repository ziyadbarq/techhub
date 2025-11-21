/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";

export interface ListKitCheckoutsRequest {
  kitId?: string;
  assignedToPersonId?: string;
  assignedToOrgUnitId?: string;
  status?: "CHECKED_OUT" | "PARTIALLY_RETURNED" | "RETURNED";
  overdueOnly?: boolean;
}

export interface ListKitCheckoutsResponse {
  checkouts: AssetKitCheckout[];
  total: number;
}

@injectable()
export class ListKitCheckoutsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(
    request: ListKitCheckoutsRequest,
  ): Promise<ListKitCheckoutsResponse> {
    let checkouts: AssetKitCheckout[];

    if (request.overdueOnly) {
      checkouts = await this.kitCheckoutRepository.findOverdue();
    } else if (request.kitId) {
      checkouts = await this.kitCheckoutRepository.findByKitId(request.kitId);
    } else if (request.assignedToPersonId) {
      checkouts = await this.kitCheckoutRepository.findByAssignee(
        request.assignedToPersonId,
        "person",
      );
    } else if (request.assignedToOrgUnitId) {
      checkouts = await this.kitCheckoutRepository.findByAssignee(
        request.assignedToOrgUnitId,
        "orgunit",
      );
    } else {
      checkouts = await this.kitCheckoutRepository.findAll();
    }

    // Filter by status if specified
    if (request.status) {
      checkouts = checkouts.filter(
        (checkout) => checkout.status === request.status,
      );
    }

    return {
      checkouts,
      total: checkouts.length,
    };
  }
}
