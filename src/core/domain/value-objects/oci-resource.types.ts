/**
 * OCI Resource Types & Zod Schemas
 *
 * Defines the structure of OCI data received from the n8n webhook.
 * All 8 service types share the same wrapper structure, with service-specific
 * resource schemas for the individual items.
 *
 * Webhook: https://n8n.prod.barq.com/webhook/oci-invent?oci-service={key}
 */

import { z } from "zod/v4";

// ========================================
// OCI Service Keys
// ========================================

export const OCI_SERVICE_KEYS = [
  "compute",
  "lb",
  "nlb",
  "oke",
  "buckets",
  "postgresql",
  "mysql",
  "dbsystems",
] as const;

export type OciServiceKey = (typeof OCI_SERVICE_KEYS)[number];

// ========================================
// Common Webhook Wrapper Schemas
// ========================================

/**
 * Individual resource item — loosely typed since each service has different fields.
 * Service-specific extraction is handled by the mapper.
 */
const OciRawResourceSchema = z.record(z.string(), z.unknown());

/** Per-region grouping of resources within a compartment */
const OciRegionDataSchema = z.object({
  region: z.string(),
  count: z.number(),
  items: z.array(OciRawResourceSchema),
});

/** Compartment grouping — resources organized by compartment then region */
const OciCompartmentGroupSchema = z.object({
  id: z.string(), // Compartment OCID
  name: z.string(), // Compartment display name
  total: z.number(),
  regions: z.array(OciRegionDataSchema),
});

/** Top-level tenancy wrapper containing service data */
const OciTenancySchema = z.object({
  generated_at: z.string(),
  tenancyId: z.string(),
  regions: z.array(z.string()),
  services: z.record(z.string(), z.array(OciCompartmentGroupSchema)),
});

/**
 * Full webhook response schema.
 * The n8n webhook wraps everything in `{ "object Object": [...] }` — an artifact
 * of n8n's serialization.
 */
export const OciWebhookResponseSchema = z.object({
  "object Object": z.array(OciTenancySchema),
});

// ========================================
// Extracted Types
// ========================================

export type OciWebhookResponse = z.infer<typeof OciWebhookResponseSchema>;
export type OciTenancy = z.infer<typeof OciTenancySchema>;
export type OciCompartmentGroup = z.infer<typeof OciCompartmentGroupSchema>;
export type OciRegionData = z.infer<typeof OciRegionDataSchema>;
export type OciRawResource = z.infer<typeof OciRawResourceSchema>;

// ========================================
// Flattened Resource (post-extraction)
// ========================================

/**
 * A single OCI resource after flattening the nested webhook structure.
 * Used as input to the resource mapper service.
 */
export interface OciFlattenedResource {
  /** The raw resource object from the webhook */
  raw: OciRawResource;
  /** Which service this came from (compute, lb, etc.) */
  serviceKey: OciServiceKey;
  /** Region where this resource lives */
  region: string;
  /** Compartment OCID */
  compartmentId: string;
  /** Compartment display name */
  compartmentName: string;
  /** Tenancy OCID */
  tenancyId: string;
  /** When the data was generated */
  generatedAt: string;
}

// ========================================
// Sync Options & Results
// ========================================

export interface SyncOciResourcesOptions {
  /** Which services to sync (default: all 8) */
  serviceKeys?: OciServiceKey[];
  /** Preview changes without writing to DB */
  dryRun?: boolean;
  /** User ID or "system" */
  triggeredBy?: string;
}

export interface OciSyncResult {
  syncLogId: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  summary: string;
  resourcesProcessed: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  resourcesRetired: number;
  resourcesUnchanged: number;
  compartmentsCreated: number;
  relationshipsCreated: number;
  errors: OciSyncError[];
  durationMs: number;
}

export interface OciSyncError {
  serviceKey: string;
  resourceId: string;
  resourceName: string;
  error: string;
}
