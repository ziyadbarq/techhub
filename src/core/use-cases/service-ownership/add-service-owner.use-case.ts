import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { OwnershipType } from "@/generated/prisma";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IServiceOwnershipRepository } from "@/core/repositories/service-ownership.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface AddServiceOwnerRequest {
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
  isPrimary?: boolean;
}

@injectable()
export class AddServiceOwnerUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.IServiceOwnershipRepository)
    private readonly serviceOwnershipRepository: IServiceOwnershipRepository,
  ) {}

  async execute(request: AddServiceOwnerRequest): Promise<void> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new NotFoundError(`Service with ID ${request.serviceId} not found`);
    }

    const person = await this.personRepository.findById(request.personId);
    if (!person) {
      throw new NotFoundError(`Person with ID ${request.personId} not found`);
    }

    const existing = await this.serviceOwnershipRepository.find(
      request.serviceId,
      request.personId,
      request.ownershipType,
    );
    if (existing) {
      throw new Error(
        `Person is already a ${request.ownershipType} owner of this service`,
      );
    }

    if (request.isPrimary) {
      await this.serviceOwnershipRepository.setPrimaryOwner(
        request.serviceId,
        request.ownershipType,
        request.personId,
      );
      return;
    }

    await this.serviceOwnershipRepository.addOwner({
      serviceId: request.serviceId,
      personId: request.personId,
      ownershipType: request.ownershipType,
      isPrimary: false,
    });
  }
}
