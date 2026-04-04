import { inject, injectable } from "inversify";
import { differenceInDays } from "date-fns";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import { DI_TOKENS } from "@/di/types";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export type LicenseComplianceStatus =
  | "compliant"
  | "over_allocated"
  | "under_utilized"
  | "expiring"
  | "expired";

export interface LicenseComplianceReportItem {
  productId: string;
  productName: string;
  productCode: string;
  entitlementId: string;
  purchasedQuantity: number;
  allocatedQuantity: number;
  utilizationPercent: number;
  status: LicenseComplianceStatus;
  effectiveStart: Date;
  effectiveEnd: Date | null;
  daysUntilExpiry: number | null;
  unitCost: number | null;
  currency: string | null;
  totalCost: number | null;
}

export interface LicenseComplianceReportSummary {
  items: LicenseComplianceReportItem[];
  totalEntitlements: number;
  compliantCount: number;
  overAllocatedCount: number;
  underUtilizedCount: number;
  expiringCount: number;
  expiredCount: number;
}

@injectable()
export class GetLicenseComplianceReportUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private readonly entitlementRepo: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private readonly allocationRepo: ILicenseAllocationRepository,
    @inject(DI_TOKENS.ILicenseProductRepository)
    private readonly productRepo: ILicenseProductRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("reports.licenseCompliance")
  async execute(): Promise<LicenseComplianceReportSummary> {
    const now = new Date();
    const expiringThresholdDays = 90;

    const [entitlements, products] = await Promise.all([
      this.entitlementRepo.findAll(),
      this.productRepo.findAll(),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items: LicenseComplianceReportItem[] = [];

    for (const entitlement of entitlements) {
      const product = productMap.get(entitlement.licenseProductId);
      if (!product) continue;

      const allocatedQuantity =
        await this.allocationRepo.sumActiveAllocatedQuantityByEntitlement(
          entitlement.id,
        );

      const utilizationPercent =
        entitlement.purchasedQuantity > 0
          ? Math.round(
              (allocatedQuantity / entitlement.purchasedQuantity) * 100,
            )
          : 0;

      const daysUntilExpiry = entitlement.effectiveEnd
        ? differenceInDays(entitlement.effectiveEnd, now)
        : null;

      let status: LicenseComplianceStatus = "compliant";
      if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
        status = "expired";
      } else if (
        daysUntilExpiry !== null &&
        daysUntilExpiry <= expiringThresholdDays
      ) {
        status = "expiring";
      } else if (allocatedQuantity > entitlement.purchasedQuantity) {
        status = "over_allocated";
      } else if (utilizationPercent < 50 && allocatedQuantity > 0) {
        status = "under_utilized";
      }

      const totalCost =
        entitlement.unitCost !== null
          ? entitlement.unitCost * entitlement.purchasedQuantity
          : null;

      items.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        entitlementId: entitlement.id,
        purchasedQuantity: entitlement.purchasedQuantity,
        allocatedQuantity,
        utilizationPercent,
        status,
        effectiveStart: entitlement.effectiveStart,
        effectiveEnd: entitlement.effectiveEnd,
        daysUntilExpiry,
        unitCost: entitlement.unitCost,
        currency: entitlement.currency,
        totalCost,
      });
    }

    // Sort: over_allocated first, then expiring, then expired, then under_utilized, then compliant
    const statusOrder: Record<LicenseComplianceStatus, number> = {
      over_allocated: 0,
      expiring: 1,
      expired: 2,
      under_utilized: 3,
      compliant: 4,
    };
    items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return {
      items,
      totalEntitlements: items.length,
      compliantCount: items.filter((i) => i.status === "compliant").length,
      overAllocatedCount: items.filter((i) => i.status === "over_allocated")
        .length,
      underUtilizedCount: items.filter((i) => i.status === "under_utilized")
        .length,
      expiringCount: items.filter((i) => i.status === "expiring").length,
      expiredCount: items.filter((i) => i.status === "expired").length,
    };
  }
}
