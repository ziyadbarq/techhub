/**
 * Update VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateVerificationItemRequest {
  id: string;
  verifierPersonId?: string | null;
  comment?: string | null;
}

@injectable()
export class UpdateVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(
    request: UpdateVerificationItemRequest,
  ): Promise<VerificationItem> {
    // Fetch existing verification item
    const verificationItem = await this.verificationItemRepository.findById(
      request.id,
    );

    if (!verificationItem) {
      throw new NotFoundError("Verification item not found");
    }

    // Update fields
    if (request.verifierPersonId !== undefined) {
      verificationItem.verifierPersonId = request.verifierPersonId;
    }

    if (request.comment !== undefined) {
      verificationItem.comment = request.comment;
    }

    return await this.verificationItemRepository.update(verificationItem);
  }
}
