/**
 * Get OCI Sync Logs Use Case
 *
 * Retrieves sync operation history for the OCI Sync dashboard.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IOciSyncLogRepository,
  OciSyncLogRecord,
} from "@/core/repositories/oci-sync-log.repository.interface";
import { LogExecution } from "@/lib/decorators";

@injectable()
export class GetOciSyncLogsUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IOciSyncLogRepository)
    private readonly syncLogRepository: IOciSyncLogRepository,
  ) {}

  @LogExecution("oci.sync-logs.list")
  async execute(limit: number = 20): Promise<OciSyncLogRecord[]> {
    return this.syncLogRepository.findLatest(limit);
  }
}
