/**
 * Flag Exception VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";

export interface FlagExceptionVerificationItemRequest {
  id: string;
  comment: string;
}

@injectable()
export class FlagExceptionVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,
  ) {}

  async execute(
    request: FlagExceptionVerificationItemRequest,
  ): Promise<VerificationItem> {
    // Fetch existing verification item
    const verificationItem = await this.verificationItemRepository.findById(
      request.id,
    );

    if (!verificationItem) {
      throw new Error("Verification item not found");
    }

    // Flag as exception (business logic in entity)
    verificationItem.flagException(request.comment);

    return await this.verificationItemRepository.update(verificationItem);
  }
}
