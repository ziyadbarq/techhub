/**
 * Warranty Presenter
 * Transforms Warranty domain entities to DTOs for presentation layer
 */

import type { Warranty } from "@/core/domain/entities/warranty.entity";
import type { WarrantyCoverageType } from "@/generated/prisma/enums";

export interface WarrantyDTO {
  id: string;
  assetId: string;
  vendorId: string | null;
  coverageType: WarrantyCoverageType;
  coverageDetails: string | null;
  policyReference: string | null;
  slaDetails: Record<string, unknown> | null;
  startDate: string;
  endDate: string;
  cost: number | null;
  currency: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean; // Within 30 days
  daysRemaining: number;
  durationDays: number;
  // Display fields (enriched from relations)
  assetTag?: string | null;
  vendorName?: string | null;
}

/**
 * Transform a single Warranty to DTO
 */
export function presentWarranty(
  warranty: Warranty,
  enrichment?: {
    assetTag?: string | null;
    vendorName?: string | null;
  },
): WarrantyDTO {
  return {
    id: warranty.id,
    assetId: warranty.assetId,
    vendorId: warranty.vendorId,
    coverageType: warranty.coverageType,
    coverageDetails: warranty.coverageDetails,
    policyReference: warranty.policyReference,
    slaDetails: warranty.slaDetails,
    startDate: warranty.startDate.toISOString(),
    endDate: warranty.endDate.toISOString(),
    cost: warranty.cost,
    currency: warranty.currency,
    note: warranty.note,
    metadata: warranty.metadata,
    createdAt: warranty.createdAt.toISOString(),
    updatedAt: warranty.updatedAt.toISOString(),
    // Computed fields
    isActive: warranty.isActive(),
    isExpired: warranty.isExpired(),
    isExpiringSoon: warranty.isExpiringSoon(30),
    daysRemaining: warranty.getDaysRemaining(),
    durationDays: warranty.getDurationDays(),
    // Display fields
    assetTag: enrichment?.assetTag,
    vendorName: enrichment?.vendorName,
  };
}

/**
 * Transform an array of Warranties to DTOs
 */
export function presentWarranties(warranties: Warranty[]): WarrantyDTO[] {
  return warranties.map((warranty) => presentWarranty(warranty));
}
