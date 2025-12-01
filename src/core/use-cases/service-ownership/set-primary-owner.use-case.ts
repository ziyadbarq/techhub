import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { OwnershipType } from "@/generated/prisma";
import type { IServiceOwnershipRepository } from "@/core/repositories/service-ownership.repository.interface";

export interface SetPrimaryOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
}

@injectable()
export class SetPrimaryOwnerUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceOwnershipRepository)
    private readonly serviceOwnershipRepository: IServiceOwnershipRepository,
  ) {}

  async execute(request: SetPrimaryOwnerRequest): Promise<void> {
    const ownership = await this.serviceOwnershipRepository.find(
      request.serviceId,
      request.personId,
      request.ownershipType,
    );
    if (!ownership) {
      throw new Error(
        `Ownership record not found for service ${request.serviceId}, person ${request.personId}, type ${request.ownershipType}`,
      );
    }

    await this.serviceOwnershipRepository.setPrimaryOwner(
      request.serviceId,
      request.ownershipType,
      request.personId,
    );
  }
}
