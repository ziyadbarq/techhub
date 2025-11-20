/**
 * List Audit Logs Use Case
 *
 * Business logic for listing audit logs with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAuditLogRepository,
  AuditLogEntry,
  FindAuditLogsParams,
} from "@/core/repositories/audit-log-repository.interface";

@injectable()
export class ListAuditLogsUseCase {
  constructor(
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  /**
   * Execute list audit logs use case
   *
   * @param params - Filter and pagination parameters
   * @returns Array of audit log entries
   */
  async execute(params?: FindAuditLogsParams): Promise<AuditLogEntry[]> {
    return await this.auditLogRepository.find(params ?? {});
  }
}
