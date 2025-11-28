/**
 * Vendor Details Controller
 * Server actions for the Vendor detail page (360-degree view)
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { PrismaClient } from "@/generated/prisma/server";

/**
 * Counts of related entities for vendor detail tabs
 */
export interface VendorRelationCounts {
  contacts: number;
  assetModels: number;
  assets: number;
  warranties: number;
  activeWarranties: number;
  contracts: number;
  activeContracts: number;
  licenseProducts: number;
  services: number;
  disposals: number;
}

/**
 * Statistics for vendor quick stats cards
 */
export interface VendorStatistics {
  totalAssetValue: number;
  assetCount: number;
  activeContractsCount: number;
  activeWarrantiesCount: number;
  warrantiesExpiringSoon: number;
  productsCount: number;
}

/**
 * Helper to compute contract status based on dates
 */
function computeContractStatus(startDate: Date, endDate: Date | null): string {
  const now = new Date();
  if (startDate > now) {
    return "PENDING";
  }
  if (endDate && endDate < now) {
    return "EXPIRED";
  }
  return "ACTIVE";
}

/**
 * Get counts of all related entities for a vendor
 * Used for tab badges and quick stats
 */
export async function getVendorRelationCountsAction(
  vendorId: string,
): Promise<ActionResponse<VendorRelationCounts>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const now = new Date();

    // Fetch all counts in parallel using Prisma directly for efficiency
    const [
      contacts,
      assetModels,
      assets,
      warranties,
      activeWarranties,
      contracts,
      licenseProducts,
      services,
      disposals,
    ] = await Promise.all([
      prisma.vendorContact.count({ where: { vendorId } }),
      prisma.assetModel.count({ where: { vendorId } }),
      prisma.asset.count({ where: { vendorId } }),
      prisma.warranty.count({ where: { vendorId } }),
      prisma.warranty.count({
        where: {
          vendorId,
          endDate: { gte: now },
        },
      }),
      prisma.contract.count({ where: { vendorId } }),
      prisma.licenseProduct.count({ where: { vendorId } }),
      prisma.service.count({ where: { vendorId } }),
      prisma.assetDisposal.count({ where: { disposalVendorId: vendorId } }),
    ]);

    // Count active contracts (contracts where endDate is null or >= now and startDate <= now)
    const activeContracts = await prisma.contract.count({
      where: {
        vendorId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    return {
      success: true,
      data: {
        contacts,
        assetModels,
        assets,
        warranties,
        activeWarranties,
        contracts,
        activeContracts,
        licenseProducts,
        services,
        disposals,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getVendorRelationCountsAction" },
      "Failed to get vendor relation counts",
    );
  }
}

/**
 * Get statistics for vendor quick stats cards
 */
export async function getVendorStatisticsAction(
  vendorId: string,
): Promise<ActionResponse<VendorStatistics>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    // Fetch statistics in parallel
    const [
      assetAggregation,
      activeWarrantiesCount,
      warrantiesExpiringSoon,
      assetModelsCount,
      licenseProductsCount,
    ] = await Promise.all([
      prisma.asset.aggregate({
        where: { vendorId },
        _sum: { purchaseCostSar: true },
        _count: true,
      }),
      prisma.warranty.count({
        where: {
          vendorId,
          endDate: { gte: now },
        },
      }),
      prisma.warranty.count({
        where: {
          vendorId,
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      prisma.assetModel.count({ where: { vendorId } }),
      prisma.licenseProduct.count({ where: { vendorId } }),
    ]);

    // Count active contracts
    const activeContractsCount = await prisma.contract.count({
      where: {
        vendorId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    return {
      success: true,
      data: {
        totalAssetValue: assetAggregation._sum.purchaseCostSar?.toNumber() ?? 0,
        assetCount: assetAggregation._count,
        activeContractsCount,
        activeWarrantiesCount,
        warrantiesExpiringSoon,
        productsCount: assetModelsCount + licenseProductsCount,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getVendorStatisticsAction" },
      "Failed to get vendor statistics",
    );
  }
}

/**
 * Vendor Contact DTO for the detail page
 */
export interface VendorContactDTO {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  role: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

/**
 * Get contacts for a vendor
 */
export async function listVendorContactsAction(
  vendorId: string,
): Promise<ActionResponse<VendorContactDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const contacts = await prisma.vendorContact.findMany({
      where: { vendorId },
      orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }],
    });

    return {
      success: true,
      data: contacts.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`,
        title: c.title,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        role: c.role,
        isPrimary: c.isPrimary,
        isActive: c.isActive,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorContactsAction" },
      "Failed to get vendor contacts",
    );
  }
}

/**
 * Asset Model DTO for the vendor detail page
 */
export interface VendorAssetModelDTO {
  id: string;
  code: string;
  name: string;
  categoryName: string | null;
  defaultWarrantyMonths: number | null;
  assetCount: number;
}

/**
 * Get asset models for a vendor
 */
export async function listVendorAssetModelsAction(
  vendorId: string,
): Promise<ActionResponse<VendorAssetModelDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const models = await prisma.assetModel.findMany({
      where: { vendorId },
      include: {
        assetCategory: { select: { name: true } },
        _count: { select: { assets: true } },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: models.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        categoryName: m.assetCategory?.name ?? null,
        defaultWarrantyMonths: m.defaultWarrantyMonths,
        assetCount: m._count.assets,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorAssetModelsAction" },
      "Failed to get vendor asset models",
    );
  }
}

/**
 * Asset DTO for the vendor detail page
 */
export interface VendorAssetDTO {
  id: string;
  assetTag: string;
  serialNumber: string | null;
  modelName: string | null;
  categoryName: string | null;
  lifecycleState: string | null;
  stockLocationName: string | null;
  purchaseCostSar: number | null;
}

/**
 * Get assets for a vendor
 */
export async function listVendorAssetsAction(
  vendorId: string,
): Promise<ActionResponse<VendorAssetDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const assets = await prisma.asset.findMany({
      where: { vendorId },
      include: {
        assetModel: { select: { name: true } },
        assetCategory: { select: { name: true } },
        lifecycleState: { select: { name: true } },
        currentStockLocation: { select: { name: true } },
      },
      orderBy: { assetTag: "asc" },
      take: 100, // Limit for performance
    });

    return {
      success: true,
      data: assets.map((a) => ({
        id: a.id,
        assetTag: a.assetTag,
        serialNumber: a.serialNumber,
        modelName: a.assetModel?.name ?? null,
        categoryName: a.assetCategory?.name ?? null,
        lifecycleState: a.lifecycleState?.name ?? null,
        stockLocationName: a.currentStockLocation?.name ?? null,
        purchaseCostSar: a.purchaseCostSar?.toNumber() ?? null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorAssetsAction" },
      "Failed to get vendor assets",
    );
  }
}

/**
 * Warranty DTO for the vendor detail page
 */
export interface VendorWarrantyDTO {
  id: string;
  assetTag: string;
  coverageType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expiring_soon" | "expired";
}

/**
 * Get warranties for a vendor
 */
export async function listVendorWarrantiesAction(
  vendorId: string,
): Promise<ActionResponse<VendorWarrantyDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const warranties = await prisma.warranty.findMany({
      where: { vendorId },
      include: {
        asset: { select: { assetTag: true } },
      },
      orderBy: { endDate: "asc" },
    });

    return {
      success: true,
      data: warranties.map((w) => {
        let status: "active" | "expiring_soon" | "expired" = "expired";
        if (w.endDate >= now) {
          status = w.endDate <= thirtyDaysFromNow ? "expiring_soon" : "active";
        }

        return {
          id: w.id,
          assetTag: w.asset.assetTag,
          coverageType: w.coverageType,
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
          status,
        };
      }),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorWarrantiesAction" },
      "Failed to get vendor warranties",
    );
  }
}

/**
 * Contract DTO for the vendor detail page
 */
export interface VendorContractDTO {
  id: string;
  name: string;
  contractNumber: string | null;
  contractTypeName: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  totalValueSar: number | null;
  autoRenew: boolean;
}

/**
 * Get contracts for a vendor
 */
export async function listVendorContractsAction(
  vendorId: string,
): Promise<ActionResponse<VendorContractDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const contracts = await prisma.contract.findMany({
      where: { vendorId },
      include: {
        contractType: { select: { name: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return {
      success: true,
      data: contracts.map((c) => ({
        id: c.id,
        name: c.name,
        contractNumber: c.contractNumber,
        contractTypeName: c.contractType?.name ?? null,
        status: computeContractStatus(c.startDate, c.endDate),
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString() ?? null,
        totalValueSar: c.totalValueSar?.toNumber() ?? null,
        autoRenew: c.autoRenew,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorContractsAction" },
      "Failed to get vendor contracts",
    );
  }
}

/**
 * License Product DTO for the vendor detail page
 */
export interface VendorLicenseProductDTO {
  id: string;
  code: string;
  name: string;
  metricType: string;
  entitlementCount: number;
}

/**
 * Get license products for a vendor
 */
export async function listVendorLicenseProductsAction(
  vendorId: string,
): Promise<ActionResponse<VendorLicenseProductDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const products = await prisma.licenseProduct.findMany({
      where: { vendorId },
      include: {
        _count: { select: { licenseEntitlements: true } },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: products.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        metricType: p.metricType,
        entitlementCount: p._count.licenseEntitlements,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorLicenseProductsAction" },
      "Failed to get vendor license products",
    );
  }
}

/**
 * Service DTO for the vendor detail page
 */
export interface VendorServiceDTO {
  id: string;
  name: string;
  serviceType: string;
  status: string;
  criticality: string;
}

/**
 * Get services for a vendor
 */
export async function listVendorServicesAction(
  vendorId: string,
): Promise<ActionResponse<VendorServiceDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const services = await prisma.service.findMany({
      where: { vendorId },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: services.map((s) => ({
        id: s.id,
        name: s.name,
        serviceType: s.serviceType,
        status: s.currentStatus,
        criticality: s.criticality,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorServicesAction" },
      "Failed to get vendor services",
    );
  }
}

/**
 * Asset Disposal DTO for the vendor detail page
 */
export interface VendorDisposalDTO {
  id: string;
  assetTag: string;
  disposalType: string;
  status: string;
  disposalDate: string | null;
  disposalValue: number | null;
}

/**
 * Get disposals handled by a vendor
 */
export async function listVendorDisposalsAction(
  vendorId: string,
): Promise<ActionResponse<VendorDisposalDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    if (!vendorId) {
      return {
        success: false,
        error: "Vendor ID is required",
      };
    }

    const container = getContainer();
    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const disposals = await prisma.assetDisposal.findMany({
      where: { disposalVendorId: vendorId },
      include: {
        asset: { select: { assetTag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: disposals.map((d) => ({
        id: d.id,
        assetTag: d.asset.assetTag,
        disposalType: d.disposalType,
        status: d.status,
        disposalDate: d.disposalDate?.toISOString() ?? null,
        disposalValue: d.actualProceeds?.toNumber() ?? null,
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorDisposalsAction" },
      "Failed to get vendor disposals",
    );
  }
}
