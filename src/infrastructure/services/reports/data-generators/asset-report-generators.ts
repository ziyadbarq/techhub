/**
 * Asset Report Data Generators
 *
 * Each function queries Prisma and returns a ReportResult
 * for one specific asset report.
 */

import type { PrismaClient } from "@/generated/prisma/server";
import type {
  ReportResult,
  ReportFilterValues,
} from "@/core/domain/reports/report-types";

// ---------------------------------------------------------------------------
// 1. Asset Inventory Summary
// ---------------------------------------------------------------------------

export async function generateAssetInventorySummary(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.categoryId) where.assetCategoryId = filters.categoryId;
  if (filters.lifecycleStateId)
    where.lifecycleStateId = filters.lifecycleStateId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assetCategory: { select: { name: true } },
      assetModel: { select: { name: true } },
      vendor: { select: { name: true } },
      lifecycleState: { select: { name: true } },
    },
  });

  // Group by category + model + vendor + lifecycle state + condition
  const groups = new Map<
    string,
    { count: number; totalValue: number; row: Record<string, unknown> }
  >();

  for (const asset of assets) {
    const vendorName = asset.vendor?.name ?? "N/A";
    const key = `${asset.assetCategory.name}|${asset.assetModel?.name ?? "N/A"}|${vendorName}|${asset.lifecycleState?.name ?? "N/A"}|${asset.condition ?? "N/A"}`;
    const existing = groups.get(key);
    const value = asset.purchaseCostSar ? Number(asset.purchaseCostSar) : 0;

    if (existing) {
      existing.count++;
      existing.totalValue += value;
    } else {
      groups.set(key, {
        count: 1,
        totalValue: value,
        row: {
          categoryName: asset.assetCategory.name,
          modelName: asset.assetModel?.name ?? "N/A",
          vendorName,
          lifecycleState: asset.lifecycleState?.name ?? "N/A",
          condition: asset.condition ?? "N/A",
        },
      });
    }
  }

  const rows = Array.from(groups.values()).map((g) => ({
    ...g.row,
    assetCount: g.count,
    totalValue: g.totalValue,
  }));

  const totalAssets = assets.length;
  const totalValue = assets.reduce(
    (sum, a) => sum + (a.purchaseCostSar ? Number(a.purchaseCostSar) : 0),
    0,
  );

  return {
    reportId: "asset-inventory-summary",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total Assets", value: totalAssets, columnKey: "assetCount" },
      {
        label: "Total Value (SAR)",
        value: totalValue.toFixed(2),
        columnKey: "totalValue",
      },
      {
        label: "Categories",
        value: new Set(assets.map((a) => a.assetCategoryId)).size,
        columnKey: "categoryName",
      },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 2. Asset Financial Summary
// ---------------------------------------------------------------------------

export async function generateAssetFinancialSummary(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.categoryId) where.assetCategoryId = filters.categoryId;
  if (filters.dateFrom || filters.dateTo) {
    where.purchaseDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assetCategory: { select: { name: true } },
      assetAssignments: {
        where: { endDate: null },
        select: { assigneeType: true, assigneeId: true },
        take: 1,
      },
    },
  });

  // Resolve department names for assigned assets
  const orgUnitIds = new Set<string>();
  for (const asset of assets) {
    const assignment = asset.assetAssignments[0];
    if (assignment?.assigneeType === "ORG_UNIT") {
      orgUnitIds.add(assignment.assigneeId);
    }
  }

  const orgUnits =
    orgUnitIds.size > 0
      ? await prisma.organizationUnit.findMany({
          where: { id: { in: Array.from(orgUnitIds) } },
          select: { id: true, name: true },
        })
      : [];
  const orgUnitMap = new Map(orgUnits.map((ou) => [ou.id, ou.name]));

  // Group by department + category
  const groups = new Map<
    string,
    {
      count: number;
      purchaseCost: number;
      currentValue: number;
      depreciation: number;
    }
  >();

  for (const asset of assets) {
    const assignment = asset.assetAssignments[0];
    const deptName =
      assignment?.assigneeType === "ORG_UNIT"
        ? (orgUnitMap.get(assignment.assigneeId) ?? "Unknown")
        : "Unassigned";
    const key = `${deptName}|${asset.assetCategory.name}`;

    const purchaseCost = asset.purchaseCostSar
      ? Number(asset.purchaseCostSar)
      : 0;
    // Simple current value estimate: if depreciation end is past, value = 0
    const now = new Date();
    const depEnd = asset.depreciationEnd;
    const currentValue = depEnd && depEnd < now ? 0 : purchaseCost;
    const depreciation = purchaseCost - currentValue;

    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      existing.purchaseCost += purchaseCost;
      existing.currentValue += currentValue;
      existing.depreciation += depreciation;
    } else {
      groups.set(key, {
        count: 1,
        purchaseCost,
        currentValue,
        depreciation,
      });
    }
  }

  const rows = Array.from(groups.entries()).map(([key, g]) => {
    const [departmentName, categoryName] = key.split("|");
    return {
      departmentName,
      categoryName,
      assetCount: g.count,
      totalPurchaseCost: g.purchaseCost,
      totalCurrentValue: g.currentValue,
      depreciationTotal: g.depreciation,
    };
  });

  const totalPurchase = rows.reduce(
    (s, r) => s + (r.totalPurchaseCost as number),
    0,
  );
  const totalCurrent = rows.reduce(
    (s, r) => s + (r.totalCurrentValue as number),
    0,
  );

  return {
    reportId: "asset-financial-summary",
    rows,
    totalRows: rows.length,
    summaryStats: [
      {
        label: "Total Purchase Cost (SAR)",
        value: totalPurchase.toFixed(2),
        columnKey: "totalPurchaseCost",
      },
      {
        label: "Estimated Current Value (SAR)",
        value: totalCurrent.toFixed(2),
        columnKey: "totalCurrentValue",
      },
      {
        label: "Total Depreciation (SAR)",
        value: (totalPurchase - totalCurrent).toFixed(2),
        columnKey: "depreciationTotal",
      },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 3. Assets Nearing End of Life
// ---------------------------------------------------------------------------

export async function generateAssetsNearingEol(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const withinDays = Number(filters.withinDays) || 365;
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    deletedAt: null,
    depreciationEnd: { lte: cutoff },
  };
  if (filters.categoryId) where.assetCategoryId = filters.categoryId;

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assetCategory: { select: { name: true } },
    },
    orderBy: { depreciationEnd: "asc" },
  });

  const rows = assets.map((asset) => {
    const depEnd = asset.depreciationEnd!;
    const daysUntilEOL = Math.ceil(
      (depEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    let status: string;
    if (daysUntilEOL < 0) status = "expired";
    else if (daysUntilEOL <= 90) status = "critical";
    else status = "warning";

    return {
      assetTag: asset.assetTag,
      categoryName: asset.assetCategory.name,
      purchaseDate: asset.purchaseDate?.toISOString() ?? null,
      depreciationEnd: depEnd.toISOString(),
      daysUntilEOL,
      status,
    };
  });

  const expired = rows.filter((r) => r.status === "expired").length;
  const critical = rows.filter((r) => r.status === "critical").length;

  return {
    reportId: "assets-nearing-eol",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total", value: rows.length },
      { label: "Expired", value: expired, trend: "down", columnKey: "status" },
      {
        label: "Critical (≤90 days)",
        value: critical,
        trend: "down",
        columnKey: "status",
      },
    ],
    appliedFilters: {
      "Within Days": String(withinDays),
      ...buildAppliedFilters(filters),
    },
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 4. Unassigned Assets
// ---------------------------------------------------------------------------

export async function generateUnassignedAssets(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = {
    deletedAt: null,
    assetAssignments: { none: { endDate: null } },
  };
  if (filters.categoryId) where.assetCategoryId = filters.categoryId;
  if (filters.stockLocationId)
    where.currentStockLocationId = filters.stockLocationId;
  if (filters.condition) where.condition = filters.condition;

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assetCategory: { select: { name: true } },
      assetModel: { select: { name: true } },
      currentStockLocation: { select: { name: true } },
    },
  });

  const rows = assets.map((a) => ({
    assetTag: a.assetTag,
    categoryName: a.assetCategory.name,
    modelName: a.assetModel?.name ?? "N/A",
    condition: a.condition ?? "N/A",
    stockLocation: a.currentStockLocation?.name ?? "N/A",
    purchaseCostSar: a.purchaseCostSar ? Number(a.purchaseCostSar) : 0,
  }));

  const totalValue = rows.reduce(
    (s, r) => s + (r.purchaseCostSar as number),
    0,
  );

  return {
    reportId: "unassigned-assets",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Unassigned Assets", value: rows.length },
      {
        label: "Total Value (SAR)",
        value: totalValue.toFixed(2),
        columnKey: "purchaseCostSar",
      },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 5. Warranty Expiration
// ---------------------------------------------------------------------------

export async function generateWarrantyExpiration(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const withinDays = Number(filters.withinDays) || 90;
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    deletedAt: null,
    endDate: { gte: now, lte: cutoff },
  };
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.coverageType) where.coverageType = filters.coverageType;

  const warranties = await prisma.warranty.findMany({
    where,
    include: {
      asset: { select: { assetTag: true } },
      vendor: { select: { name: true } },
    },
    orderBy: { endDate: "asc" },
  });

  const rows = warranties.map((w) => {
    const daysUntilExpiry = Math.ceil(
      (w.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      assetTag: w.asset.assetTag,
      vendorName: w.vendor?.name ?? "N/A",
      coverageType: w.coverageType,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate.toISOString(),
      daysUntilExpiry,
    };
  });

  return {
    reportId: "warranty-expiration",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Expiring Warranties", value: rows.length },
      { label: "Within Days", value: withinDays },
    ],
    appliedFilters: {
      "Expiring Within": `${withinDays} days`,
      ...buildAppliedFilters(filters),
    },
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 6. Asset Assignment History
// ---------------------------------------------------------------------------

export async function generateAssetAssignmentHistory(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = {};
  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  if (filters.categoryId) {
    where.asset = { assetCategoryId: filters.categoryId, deletedAt: null };
  }

  const assignments = await prisma.assetAssignment.findMany({
    where,
    include: {
      asset: {
        select: { assetTag: true, assetCategoryId: true },
      },
    },
    orderBy: { startDate: "desc" },
    take: 5000,
  });

  // Resolve assignee names
  const personIds = new Set<string>();
  const orgUnitIds = new Set<string>();
  for (const a of assignments) {
    if (a.assigneeType === "PERSON") personIds.add(a.assigneeId);
    if (a.assigneeType === "ORG_UNIT") orgUnitIds.add(a.assigneeId);
  }

  const [persons, orgUnits] = await Promise.all([
    personIds.size > 0
      ? prisma.person.findMany({
          where: { id: { in: Array.from(personIds) } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [],
    orgUnitIds.size > 0
      ? prisma.organizationUnit.findMany({
          where: { id: { in: Array.from(orgUnitIds) } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const nameMap = new Map<string, string>();
  for (const p of persons) nameMap.set(p.id, `${p.firstName} ${p.lastName}`);
  for (const ou of orgUnits) nameMap.set(ou.id, ou.name);

  const now = new Date();
  const rows = assignments.map((a) => {
    const end = a.endDate ?? now;
    const durationDays = Math.ceil(
      (end.getTime() - a.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      assetTag: a.asset.assetTag,
      assigneeName: nameMap.get(a.assigneeId) ?? a.assigneeId,
      assigneeType: a.assigneeType,
      startDate: a.startDate.toISOString(),
      endDate: a.endDate?.toISOString() ?? "Active",
      durationDays,
    };
  });

  return {
    reportId: "asset-assignment-history",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total Assignments", value: rows.length },
      { label: "Active", value: assignments.filter((a) => !a.endDate).length },
    ],
    appliedFilters: buildAppliedFilters(filters),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// 7. Stock Movement Summary
// ---------------------------------------------------------------------------

export async function generateStockMovementSummary(
  filters: ReportFilterValues,
  prisma: PrismaClient,
): Promise<ReportResult> {
  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (filters.movementType) where.movementType = filters.movementType;
  if (filters.stockLocationId) {
    where.OR = [
      { stockLocationFromId: filters.stockLocationId },
      { stockLocationToId: filters.stockLocationId },
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    where.occurredAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      asset: { select: { assetTag: true } },
      stockLocationFrom: { select: { name: true } },
      stockLocationTo: { select: { name: true } },
      performedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 5000,
  });

  const rows = movements.map((m) => ({
    movementType: m.movementType,
    assetTag: m.asset?.assetTag ?? "N/A",
    fromLocation: m.stockLocationFrom?.name ?? "N/A",
    toLocation: m.stockLocationTo?.name ?? "N/A",
    reason: m.reason ?? "",
    movedAt: m.occurredAt.toISOString(),
    movedBy: `${m.performedBy.firstName} ${m.performedBy.lastName}`,
  }));

  // Type counts
  const typeCounts = movements.reduce(
    (acc, m) => {
      acc[m.movementType] = (acc[m.movementType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    reportId: "stock-movement-summary",
    rows,
    totalRows: rows.length,
    summaryStats: [
      { label: "Total Movements", value: rows.length },
      { label: "In", value: typeCounts["IN"] ?? 0, columnKey: "movementType" },
      {
        label: "Out",
        value: typeCounts["OUT"] ?? 0,
        columnKey: "movementType",
      },
      {
        label: "Transfers",
        value: typeCounts["TRANSFER"] ?? 0,
        columnKey: "movementType",
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
