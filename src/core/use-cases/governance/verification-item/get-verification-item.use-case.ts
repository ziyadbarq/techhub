/**
 * Get VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";

export interface GetVerificationItemRequest {
  id: string;
}

@injectable()
export class GetVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(request: GetVerificationItemRequest): Promise<VerificationItem> {
    const verificationItem = await this.verificationItemRepository.findById(
      request.id,
    );

    if (!verificationItem) {
      throw new Error("Verification item not found");
    }

    return verificationItem;
  }
}
