/**
 * Verify VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";

export interface VerifyVerificationItemRequest {
  id: string;
  comment?: string;
}

@injectable()
export class VerifyVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(
    request: VerifyVerificationItemRequest,
  ): Promise<VerificationItem> {
    // Fetch existing verification item
    const verificationItem = await this.verificationItemRepository.findById(
      request.id,
    );

    if (!verificationItem) {
      throw new Error("Verification item not found");
    }

    // Verify the item (business logic in entity)
    verificationItem.verify(request.comment);

    return await this.verificationItemRepository.update(verificationItem);
  }
}
