/**
 * CMDB Report Data Generators
 *
 * Each function queries Prisma and returns a ReportResult
 * for one specific CMDB report.
 */

import type { PrismaClient } from "@/generated/prisma/server";
import type {
  ReportResult,
  ReportFilterValues,
} from "@/core/domain/reports/report-types";

// ---------------------------------------------------------------------------
// 8. CI Inventory Summary
// ---------------------------------------------------------------------------

export async function generateCiInventorySummary(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.ciClassId) where.ciClassId = filters.ciClassId;
  if (filters.environment) where.environment = filters.environment;
  if (filters.criticality) where.criticality = filters.criticality;

  const cis = await prisma.configurationItem.findMany({
    where,
    include: {
      ciClass: { select: { name: true } },
      lifecycleState: { select: { name: true } },
    },
  });

  // Group by class + environment + criticality + lifecycle state
  const groups = new Map<
    string,
    { count: number; row: Record<string, unknown> }
  >();

  for (const ci of cis) {
    const key = `${ci.ciClass.name}|${ci.environment ?? "N/A"}|${ci.criticality ?? "N/A"}|${ci.lifecycleState?.name ?? "N/A"}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, {
        count: 1,
        row: {
          className: ci.ciClass.name,
          environment: ci.environment ?? "N/A",
          criticality: ci.criticality ?? "N/A",
          lifecycleState: ci.lifecycleState?.name ?? "N/A",
        },
      });
    }
  }

  const rows = Array.from(groups.values()).map((g) => ({
    ...g.row,
    ciCount: g.count,
  }));

  const envCounts = cis.reduce(
    (acc, ci) => {
      const env = ci.environment ?? "N/A";
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    reportId: "ci-inventory-summary",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total CIs", value: cis.length, columnKey: "ciCount" },
      {
        label: "CI Classes",
        value: new Set(cis.map((c) => c.ciClassId)).size,
        columnKey: "className",
      },
      {
        label: "Production CIs",
        value: envCounts["PROD"] ?? 0,
        columnKey: "environment",
      },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 9. CI Relationship Overview
// ---------------------------------------------------------------------------

export async function generateCiRelationshipOverview(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { isActive: true };
  if (filters.relationshipTypeId)
    where.relationshipTypeId = filters.relationshipTypeId;

  const relationships = await prisma.cIRelationship.findMany({
    where,
    include: {
      relationshipType: {
        select: { name: true, direction: true, isImpacting: true },
      },
    },
  });

  // Group by relationship type
  const groups = new Map<
    string,
    {
      count: number;
      fromCIs: Set<string>;
      toCIs: Set<string>;
      direction: string;
      isImpacting: boolean;
    }
  >();

  for (const rel of relationships) {
    const typeName = rel.relationshipType.name;
    const existing = groups.get(typeName);
    if (existing) {
      existing.count++;
      existing.fromCIs.add(rel.fromCiId);
      existing.toCIs.add(rel.toCiId);
    } else {
      groups.set(typeName, {
        count: 1,
        fromCIs: new Set([rel.fromCiId]),
        toCIs: new Set([rel.toCiId]),
        direction: rel.relationshipType.direction,
        isImpacting: rel.relationshipType.isImpacting,
      });
    }
  }

  const rows = Array.from(groups.entries()).map(([name, g]) => ({
    relationshipTypeName: name,
    direction: g.direction,
    isImpacting: g.isImpacting ? "Yes" : "No",
    relationshipCount: g.count,
    uniqueFromCIs: g.fromCIs.size,
    uniqueToCIs: g.toCIs.size,
  }));

  // Count orphaned CIs (no relationships)
  const allCiIds = new Set<string>();
  for (const rel of relationships) {
    allCiIds.add(rel.fromCiId);
    allCiIds.add(rel.toCiId);
  }
  const totalCis = await prisma.configurationItem.count({
    where: { deletedAt: null },
  });
  const orphanedCount = totalCis - allCiIds.size;

  return {
    reportId: "ci-relationship-overview",
    rows,
    totalRows: rows.length,
    summaryStats: [
      {
        label: "Total Relationships",
        value: relationships.length,
        columnKey: "relationshipCount",
      },
      {
        label: "Relationship Types",
        value: rows.length,
        columnKey: "relationshipTypeName",
      },
      { label: "Orphaned CIs", value: orphanedCount > 0 ? orphanedCount : 0 },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 10. CI-Asset Coverage
// ---------------------------------------------------------------------------

export async function generateCiAssetCoverage(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.ciClassId) where.ciClassId = filters.ciClassId;
  if (filters.coverageStatus === "linked") {
    where.linkedAssetId = { not: null };
  } else if (filters.coverageStatus === "unlinked") {
    where.linkedAssetId = null;
  }

  const cis = await prisma.configurationItem.findMany({
    where,
    include: {
      ciClass: { select: { name: true } },
      linkedAsset: { select: { assetTag: true } },
    },
  });

  const rows = cis.map((ci) => ({
    ciName: ci.name,
    className: ci.ciClass.name,
    environment: ci.environment ?? "N/A",
    linkedAssetTag: ci.linkedAsset?.assetTag ?? "—",
    coverageStatus: ci.linkedAssetId ? "Linked" : "Unlinked",
  }));

  const linked = rows.filter((r) => r.coverageStatus === "Linked").length;
  const total = rows.length;
  const coveragePercent = total > 0 ? Math.round((linked / total) * 100) : 0;

  return {
    reportId: "ci-asset-coverage",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total CIs", value: total },
      { label: "Linked to Asset", value: linked, columnKey: "linkedAssetTag" },
      {
        label: "Coverage",
        value: `${coveragePercent}%`,
        columnKey: "coverageStatus",
      },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAppliedFilters(
  filters: ReportFilterValues,
): Record<string, string> {
  const applied: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      applied[key] = Array.isArray(value) ? value.join(", ") : String(value);
    }
  }
  return applied;
}
