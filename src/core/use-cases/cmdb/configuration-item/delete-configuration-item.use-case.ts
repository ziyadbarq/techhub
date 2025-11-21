import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigurationItemRepository } from "../../../repositories/configuration-item.repository.interface";

export interface DeleteConfigurationItemRequest {
  id: string;
}

@injectable()
export class DeleteConfigurationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
  ) {}

  async execute(request: DeleteConfigurationItemRequest): Promise<void> {
    const ci = await this.ciRepository.findById(request.id);

    if (!ci) {
      throw new Error(`Configuration Item not found: ${request.id}`);
    }

    await this.ciRepository.delete(request.id);
  }
}
