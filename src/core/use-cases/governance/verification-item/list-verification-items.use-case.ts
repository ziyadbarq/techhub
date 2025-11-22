/**
 * List VerificationItems Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import type {
  VerificationItem,
  VerificationStatusEnum,
} from "@/core/domain/entities/verification-item.entity";

export interface ListVerificationItemsRequest {
  campaignId?: string;
  status?: VerificationStatusEnum;
}

@injectable()
export class ListVerificationItemsUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(
    request: ListVerificationItemsRequest = {},
  ): Promise<VerificationItem[]> {
    // Filter by campaign if provided
    if (request.campaignId) {
      return await this.verificationItemRepository.findByCampaign(
        request.campaignId,
      );
    }

    // Filter by status if provided
    if (request.status) {
      return await this.verificationItemRepository.findByStatus(request.status);
    }

    // Return all if no filters
    return await this.verificationItemRepository.findAll();
  }
}
