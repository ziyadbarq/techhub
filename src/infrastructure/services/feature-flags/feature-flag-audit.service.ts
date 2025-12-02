import { injectable } from "inversify";
import type { $Enums, FeatureFlagAuditLog } from "@/generated/prisma";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { IFeatureFlagAuditService } from "@/core/services/feature-flag-audit.service.interface";

@injectable()
export class FeatureFlagAuditService implements IFeatureFlagAuditService {
  async log(params: {
    featureName: string;
    action: $Enums.FeatureFlagAction;
    userId: string;
    userEmail: string;
    reason?: string;
  }): Promise<void> {
    await prisma.featureFlagAuditLog.create({
      data: {
        featureName: params.featureName.toUpperCase(),
        action: params.action,
        userId: params.userId,
        userEmail: params.userEmail,
        reason: params.reason,
      },
    });
  }

  async getRecentLogs(
    featureName: string,
    limit = 50,
  ): Promise<FeatureFlagAuditLog[]> {
    return prisma.featureFlagAuditLog.findMany({
      where: { featureName: featureName.toUpperCase() },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
