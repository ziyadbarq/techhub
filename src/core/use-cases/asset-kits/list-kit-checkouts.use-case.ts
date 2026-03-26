import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import type { KitCheckoutStatus } from "@/core/domain/entities/asset-kit-checkout.entity";

export interface ListKitCheckoutsRequest {
  kitId?: string;
  assigneeId?: string;
  assigneeType?: "PERSON" | "ORG_UNIT" | "LOCATION";
  status?: KitCheckoutStatus;
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
    } else if (request.assigneeId && request.assigneeType) {
      checkouts = await this.kitCheckoutRepository.findByAssignee(
        request.assigneeType,
        request.assigneeId,
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
