/**
 * Get Setting Use Case
 * Returns a single setting's resolved value via the config service.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface GetSettingResponse {
  key: string;
  value: string | undefined;
}

@injectable()
export class GetSettingUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigService)
    private readonly configService: IConfigService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("settings.get")
  async execute(key: string): Promise<GetSettingResponse> {
    const value = await this.configService.get(key);
    return { key, value };
  }
}
