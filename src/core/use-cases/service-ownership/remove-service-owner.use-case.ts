import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { OwnershipType } from "@/generated/prisma";
import type { IServiceOwnershipRepository } from "@/core/repositories/service-ownership.repository.interface";

export interface RemoveServiceOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
}

@injectable()
export class RemoveServiceOwnerUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceOwnershipRepository)
    private readonly serviceOwnershipRepository: IServiceOwnershipRepository,
  ) {}

  async execute(request: RemoveServiceOwnerRequest): Promise<void> {
    const ownership = await this.serviceOwnershipRepository.find(
      request.serviceId,
      request.personId,
      request.ownershipType,
    );
    if (!ownership) {
      throw new ValidationError(
        `Ownership record not found for service ${request.serviceId}, person ${request.personId}, type ${request.ownershipType}`,
      );
    }

    await this.serviceOwnershipRepository.removeOwner(
      request.serviceId,
      request.personId,
      request.ownershipType,
    );
  }
}
