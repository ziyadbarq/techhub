/**
 * Count Audit Logs Use Case
 *
 * Business logic for counting audit logs with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAuditLogRepository,
  FindAuditLogsParams,
} from "@/core/repositories/audit-log-repository.interface";

@injectable()
export class CountAuditLogsUseCase {
  constructor(
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  /**
   * Execute count audit logs use case
   *
   * @param params - Optional filter parameters
   * @returns Total count of matching audit logs
   */
  async execute(params?: FindAuditLogsParams): Promise<number> {
    return await this.auditLogRepository.count(params);
  }
}
