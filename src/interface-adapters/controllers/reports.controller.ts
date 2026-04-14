"use server";

import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { getContainer } from "@/di";
import { loadHeavyModule, isModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { GetLicenseComplianceReportUseCase } from "@/core/use-cases/reports/get-license-compliance-report.use-case";
import type { GetContractExpirationReportUseCase } from "@/core/use-cases/reports/get-contract-expiration-report.use-case";
import type { GetOciResourceInventoryReportUseCase } from "@/core/use-cases/reports/get-oci-resource-inventory-report.use-case";
import type { ActionResponse } from "@/interface-adapters/controllers/types";
import { handleControllerError } from "@/interface-adapters/controllers/error-handler";

export async function getLicenseComplianceReportAction(): Promise<
  ActionResponse<{
    items: Array<{
      productId: string;
      productName: string;
      productCode: string;
      entitlementId: string;
      purchasedQuantity: number;
      allocatedQuantity: number;
      utilizationPercent: number;
      status: string;
      effectiveStart: string;
      effectiveEnd: string | null;
      daysUntilExpiry: number | null;
      unitCost: number | null;
      currency: string | null;
      totalCost: number | null;
    }>;
    totalEntitlements: number;
    compliantCount: number;
    overAllocatedCount: number;
    underUtilizedCount: number;
    expiringCount: number;
    expiredCount: number;
  }>
> {
  try {
    await requireFeature(FEATURE_FLAGS.LICENSES);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
    if (!isModuleLoaded("licenses")) {
      await loadHeavyModule("licenses");
    }
    const container = getContainer();
    const useCase = container.get<GetLicenseComplianceReportUseCase>(
      DI_TOKENS.GetLicenseComplianceReportUseCase,
    );

    const result = await useCase.execute();

    return {
      success: true,
      data: {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          effectiveStart: item.effectiveStart.toISOString(),
          effectiveEnd: item.effectiveEnd?.toISOString() ?? null,
        })),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLicenseComplianceReportAction" },
      "Failed to load license compliance report",
    );
  }
}

export async function getContractExpirationReportAction(): Promise<
  ActionResponse<{
    items: Array<{
      contractId: string;
      contractName: string;
      contractNumber: string | null;
      startDate: string;
      endDate: string | null;
      daysUntilExpiry: number | null;
      autoRenew: boolean;
      totalValueSar: number | null;
      status: string;
    }>;
    totalContracts: number;
    activeCount: number;
    expiring30Count: number;
    expiring60Count: number;
    expiring90Count: number;
    expiredCount: number;
    totalValueAtRiskSar: number;
  }>
> {
  try {
    await requireFeature(FEATURE_FLAGS.CONTRACTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
    const container = getContainer();
    const useCase = container.get<GetContractExpirationReportUseCase>(
      DI_TOKENS.GetContractExpirationReportUseCase,
    );

    const result = await useCase.execute();

    return {
      success: true,
      data: {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          startDate: item.startDate.toISOString(),
          endDate: item.endDate?.toISOString() ?? null,
        })),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getContractExpirationReportAction" },
      "Failed to load contract expiration report",
    );
  }
}

export async function getOciResourceInventoryReportAction(): Promise<
  ActionResponse<{
    items: Array<{
      ciId: string;
      ciName: string;
      ciClassName: string;
      environment: string;
      criticality: string;
      lifecycleState: string;
      region: string | null;
      compartment: string | null;
      lastSyncedAt: string | null;
    }>;
    totalResources: number;
    byType: Array<{ type: string; count: number }>;
    byRegion: Array<{ region: string; count: number }>;
    byLifecycleState: Array<{ state: string; count: number }>;
  }>
> {
  try {
    await requireFeature(FEATURE_FLAGS.OCI_SYNC);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
    const container = getContainer();
    const useCase = container.get<GetOciResourceInventoryReportUseCase>(
      DI_TOKENS.GetOciResourceInventoryReportUseCase,
    );

    const result = await useCase.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getOciResourceInventoryReportAction" },
      "Failed to load OCI resource inventory report",
    );
  }
}
