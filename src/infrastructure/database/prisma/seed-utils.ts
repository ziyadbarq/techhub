/**
 * Shared Seed Utilities
 *
 * DRY utilities for all seed scripts:
 * - Date generation and calculations
 * - Code/identifier generation
 * - Prisma relation helpers
 * - Logging utilities
 * - Data cleanup helpers
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";

// ==============================================
// Date Utilities
// ==============================================

/**
 * Get a date relative to today
 * @param daysOffset Number of days to add (positive) or subtract (negative)
 */
export function getRelativeDate(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

/**
 * Get a date relative to today with month offset
 * @param monthsOffset Number of months to add (positive) or subtract (negative)
 */
export function getRelativeDateByMonths(monthsOffset: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsOffset);
  return date;
}

/**
 * Get a date relative to today with year offset
 * @param yearsOffset Number of years to add (positive) or subtract (negative)
 */
export function getRelativeDateByYears(yearsOffset: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + yearsOffset);
  return date;
}

/**
 * Calculate warranty end date from purchase date
 * @param purchaseDate Purchase date
 * @param warrantyMonths Warranty duration in months
 */
export function calculateWarrantyDates(
  purchaseDate: Date,
  warrantyMonths: number,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(purchaseDate);
  const endDate = new Date(purchaseDate);
  endDate.setMonth(endDate.getMonth() + warrantyMonths);
  return { startDate, endDate };
}

/**
 * Get random date within a range
 * @param startDate Start date
 * @param endDate End date
 */
export function getRandomDateBetween(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

// ==============================================
// Code/ID Generation
// ==============================================

/**
 * Generate a padded sequential code
 * @param prefix Code prefix (e.g., "WTY-LAPTOP")
 * @param sequence Sequence number
 * @param padding Number of digits to pad (default: 6)
 * @example generateSequentialCode("WTY-LAPTOP", 1, 6) => "WTY-LAPTOP-000001"
 */
export function generateSequentialCode(
  prefix: string,
  sequence: number,
  padding = 6,
): string {
  return `${prefix}-${String(sequence).padStart(padding, "0")}`;
}

/**
 * Generate asset tag
 * @param category Category code (e.g., "LAPTOP")
 * @param sequence Sequence number
 */
export function generateAssetTag(category: string, sequence: number): string {
  return `${category}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Generate serial number
 * @param vendor Vendor code (e.g., "DELL")
 * @param year Year
 * @param sequence Sequence number
 */
export function generateSerialNumber(
  vendor: string,
  year: number,
  sequence: number,
): string {
  return `${vendor.substring(0, 4).toUpperCase()}${year}${String(sequence).padStart(6, "0")}`;
}

// ==============================================
// Prisma Relation Helpers
// ==============================================

/**
 * Create optional Prisma relation connect object
 * @param id ID to connect (can be undefined/null)
 * @param fieldName Relation field name
 * @returns Object to spread in Prisma create/update
 * @example
 * await prisma.asset.create({
 *   data: {
 *     name: "Laptop",
 *     ...optionalConnect(vendorId, "vendor"),
 *   }
 * });
 */
export function optionalConnect<T extends string>(
  id: string | undefined | null,
  fieldName: T,
): Partial<Record<T, { connect: { id: string } }>> {
  return id
    ? ({ [fieldName]: { connect: { id } } } as Record<
        T,
        { connect: { id: string } }
      >)
    : {};
}

/**
 * Create required Prisma relation connect object
 * @param id ID to connect
 * @param fieldName Relation field name
 * @throws Error if id is undefined
 */
export function requireConnect<T extends string>(
  id: string | undefined,
  fieldName: T,
): { [K in T]: { connect: { id: string } } } {
  if (!id) {
    throw new Error(`${fieldName} is required but id is undefined`);
  }
  return { [fieldName]: { connect: { id } } } as {
    [K in T]: { connect: { id: string } };
  };
}

/**
 * Create Prisma connect object from entity
 * @param entity Entity with id property
 * @param fieldName Relation field name
 */
export function connectEntity<T extends { id: string }>(
  entity: T | undefined,
  fieldName: string,
): Record<string, unknown> {
  return entity ? { [fieldName]: { connect: { id: entity.id } } } : {};
}

// ==============================================
// Random Data Generation
// ==============================================

/**
 * Pick random item from array
 */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Pick multiple random items from array (no duplicates)
 */
export function pickRandomMultiple<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random boolean with probability
 * @param probability Probability of true (0-1, default: 0.5)
 */
export function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

// ==============================================
// Logging Utilities
// ==============================================

/**
 * Log seeder section start
 */
export function logSection(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌱 ${title}`);
  console.log(`${"=".repeat(60)}`);
}

/**
 * Log seeder step
 */
export function logStep(emoji: string, message: string): void {
  console.log(`   ${emoji} ${message}`);
}

/**
 * Log success
 */
export function logSuccess(message: string): void {
  console.log(`   ✓ ${message}`);
}

/**
 * Log warning
 */
export function logWarning(message: string): void {
  console.log(`   ⚠️  ${message}`);
}

/**
 * Log progress
 */
export function logProgress(
  current: number,
  total: number,
  item: string,
): void {
  console.log(`   [${current}/${total}] ${item}`);
}

// ==============================================
// Data Cleanup Helpers
// ==============================================

/**
 * Cleanup order for safe database reset
 * Dependencies are deleted before their parent entities
 */
export const CLEANUP_ORDER = {
  // Layer 3 - Advanced ITAM (delete first - most dependent)
  layer3: [
    "assetKitCheckoutItem",
    "assetKitCheckout",
    "assetKitItem",
    "assetKit",
    "assetReservationConflict",
    "assetReservation",
    "disposalDocument",
    "disposalApproval",
    "assetDisposal",
    "ciRelationship",
    "configurationItem",
    "relationshipType",
  ],
  // Layer 2 - Assets & Maintenance
  layer2: [
    "maintenanceRecord",
    "maintenanceSchedule",
    "warranty",
    "assetAssignment",
    "stockMovement",
    "asset",
    "assetModel",
    "assetCategory",
    "stockLocation",
  ],
  // Layer 1 - Foundation
  layer1: [
    "person",
    "location",
    "organizationUnit",
    "vendor",
    "lifecycleStatus",
    "fieldDefinition",
    "customField",
  ],
  // RBAC
  rbac: ["rolePermission", "userRole", "role", "permission", "user"],
} as const;

/**
 * Delete all data in safe order
 * @param prisma Prisma client
 * @param layers Which layers to clean (default: all)
 */
export async function cleanupDatabase(
  prisma: PrismaClient,
  layers: ("layer3" | "layer2" | "layer1" | "rbac")[] = [
    "layer3",
    "layer2",
    "layer1",
    "rbac",
  ],
): Promise<void> {
  for (const layer of layers) {
    const tables = CLEANUP_ORDER[layer];
    for (const table of tables) {
      try {
        // @ts-expect-error - Dynamic table access
        await prisma[table].deleteMany({});
        logSuccess(`Cleaned ${table}`);
      } catch (error) {
        // Table might not exist or already be empty
        logWarning(`Could not clean ${table}: ${error}`);
      }
    }
  }
}

// ==============================================
// Validation Helpers
// ==============================================

/**
 * Ensure entities exist before proceeding
 * @param entities Array of entity arrays to check
 * @param entityName Name of entity type for error message
 * @throws Error if no entities found
 */
export function requireEntities<T>(
  entities: T[],
  entityName: string,
): asserts entities is NonEmptyArray<T> {
  if (entities.length === 0) {
    throw new Error(`No ${entityName} found. Run prerequisite seeders first.`);
  }
}

type NonEmptyArray<T> = [T, ...T[]];

/**
 * Get entity by index with fallback
 * @param entities Array of entities
 * @param index Desired index
 * @param fallbackIndex Fallback index if desired index doesn't exist
 */
export function getEntityByIndex<T>(
  entities: T[],
  index: number,
  fallbackIndex = 0,
): T | undefined {
  return entities[index] ?? entities[fallbackIndex];
}

// ==============================================
// Batch Processing
// ==============================================

/**
 * Process items in batches to avoid memory issues
 * @param items Items to process
 * @param batchSize Size of each batch
 * @param processor Async function to process each batch
 */
export async function processBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchNumber: number) => Promise<void>,
): Promise<void> {
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    logProgress(batchNumber, totalBatches, `Processing batch ${batchNumber}`);
    await processor(batch, batchNumber);
  }
}

/**
 * Process items sequentially with delay
 * @param items Items to process
 * @param processor Async function to process each item
 * @param delayMs Delay between items in milliseconds
 */
export async function processSequentially<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  delayMs = 0,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await processor(items[i], i);
    if (delayMs > 0 && i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// ==============================================
// Type Guards
// ==============================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Filter array to only defined values
 */
export function filterDefined<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isDefined);
}
