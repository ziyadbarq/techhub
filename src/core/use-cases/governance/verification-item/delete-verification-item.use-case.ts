/**
 * Delete VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteVerificationItemRequest {
  id: string;
}

@injectable()
export class DeleteVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(request: DeleteVerificationItemRequest): Promise<void> {
    // Check if verification item exists
    const verificationItem = await this.verificationItemRepository.findById(
      request.id,
    );

    if (!verificationItem) {
      throw new NotFoundError("Verification item not found");
    }

    await this.verificationItemRepository.delete(request.id);
  }
}
