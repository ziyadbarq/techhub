import type { $Enums, FeatureFlagAuditLog } from "@/generated/prisma";

export interface IFeatureFlagAuditService {
  log(params: {
    featureName: string;
    action: $Enums.FeatureFlagAction;
    userId: string;
    userEmail: string;
    reason?: string;
  }): Promise<void>;

  /**
   * Fetch recent audit entries for a feature
   */
  getRecentLogs(
    featureName: string,
    limit?: number,
  ): Promise<FeatureFlagAuditLog[]>;
}
