import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { IReportDataService } from "@/core/services/report-data.service.interface";
import type {
  FilterOptionsSource,
  ReportFilterOption,
  ReportFilterValues,
  ReportResult,
} from "@/core/domain/reports/report-types";
import {
  generateAssetAssignmentHistory,
  generateAssetFinancialSummary,
  generateAssetInventorySummary,
  generateAssetsNearingEol,
  generateStockMovementSummary,
  generateUnassignedAssets,
  generateWarrantyExpiration,
} from "./data-generators/asset-report-generators";
import {
  generateCiAssetCoverage,
  generateCiInventorySummary,
  generateCiRelationshipOverview,
} from "./data-generators/cmdb-report-generators";

const REPORT_GENERATORS: Record<
  string,
  (
    filters: ReportFilterValues,
    prismaClient: typeof prisma,
  ) => Promise<ReportResult>
> = {
  "asset-inventory-summary": generateAssetInventorySummary,
  "asset-financial-summary": generateAssetFinancialSummary,
  "assets-nearing-eol": generateAssetsNearingEol,
  "unassigned-assets": generateUnassignedAssets,
  "warranty-expiration": generateWarrantyExpiration,
  "asset-assignment-history": generateAssetAssignmentHistory,
  "stock-movement-summary": generateStockMovementSummary,
  "ci-inventory-summary": generateCiInventorySummary,
  "ci-relationship-overview": generateCiRelationshipOverview,
  "ci-asset-coverage": generateCiAssetCoverage,
};

@injectable()
export class PrismaReportDataService implements IReportDataService {
  async generateReport(
    reportId: string,
    filters: ReportFilterValues,
  ): Promise<ReportResult> {
    const generator = REPORT_GENERATORS[reportId];
    if (!generator) {
      throw new Error(`No data generator for report: ${reportId}`);
    }

    return generator(filters, prisma);
  }

  async getFilterOptions(
    source: FilterOptionsSource,
  ): Promise<ReportFilterOption[]> {
    switch (source) {
      case "assetCategories": {
        const rows = await prisma.assetCategory.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "lifecycleStates": {
        const rows = await prisma.lifecycleState.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "departments": {
        const rows = await prisma.organizationUnit.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "stockLocations": {
        const rows = await prisma.stockLocation.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "vendors": {
        const rows = await prisma.vendor.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "ciClasses": {
        const rows = await prisma.cIClass.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }

      case "relationshipTypes": {
        const rows = await prisma.relationshipType.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return rows.map((row) => ({ value: row.id, label: row.name }));
      }
    }
  }
}
