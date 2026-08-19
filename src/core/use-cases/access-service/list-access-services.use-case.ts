import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
} from "@/core/repositories/workflow/access-service.repository.interface";

export interface ListAccessServicesRequest {
  activeOnly?: boolean;
}

@injectable()
export class ListAccessServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
  ) {}

  async execute(
    request: ListAccessServicesRequest = {},
  ): Promise<AccessServiceData[]> {
    return this.repo.findAll({ activeOnly: request.activeOnly });
  }
}
