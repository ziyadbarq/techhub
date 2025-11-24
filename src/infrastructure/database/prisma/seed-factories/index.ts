/**
 * Seed Factories - Consolidated Exports
 *
 * Type-safe factories for generating realistic test data.
 * Split from a single 784-line file into 8 focused factories for better maintainability.
 */

// Individual factories
export { AssetFactory } from "./seed-factory-asset";
export type { AssetFactoryOptions } from "./seed-factory-asset";

export { WarrantyFactory } from "./seed-factory-warranty";
export type { WarrantyFactoryOptions } from "./seed-factory-warranty";

export { MaintenanceScheduleFactory } from "./seed-factory-maintenance-schedule";
export type { MaintenanceScheduleFactoryOptions } from "./seed-factory-maintenance-schedule";

export { MaintenanceRecordFactory } from "./seed-factory-maintenance-record";
export type { MaintenanceRecordFactoryOptions } from "./seed-factory-maintenance-record";

export { AssetDisposalFactory } from "./seed-factory-asset-disposal";
export type { AssetDisposalFactoryOptions } from "./seed-factory-asset-disposal";

export { AssetKitFactory } from "./seed-factory-asset-kit";
export type { AssetKitFactoryOptions } from "./seed-factory-asset-kit";

export { AssetReservationFactory } from "./seed-factory-asset-reservation";
export type { AssetReservationFactoryOptions } from "./seed-factory-asset-reservation";

export { ConfigurationItemFactory } from "./seed-factory-configuration-item";
export type { ConfigurationItemFactoryOptions } from "./seed-factory-configuration-item";

// Import for combining (legacy compatibility)
import { AssetFactory } from "./seed-factory-asset";
import { WarrantyFactory } from "./seed-factory-warranty";
import { MaintenanceScheduleFactory } from "./seed-factory-maintenance-schedule";
import { MaintenanceRecordFactory } from "./seed-factory-maintenance-record";
import { AssetDisposalFactory } from "./seed-factory-asset-disposal";
import { AssetKitFactory } from "./seed-factory-asset-kit";
import { AssetReservationFactory } from "./seed-factory-asset-reservation";
import { ConfigurationItemFactory } from "./seed-factory-configuration-item";

/**
 * Aggregate factories object
 * Maintains backward compatibility with existing seed scripts
 */
export const factories = {
  Asset: AssetFactory,
  Warranty: WarrantyFactory,
  MaintenanceSchedule: MaintenanceScheduleFactory,
  MaintenanceRecord: MaintenanceRecordFactory,
  AssetDisposal: AssetDisposalFactory,
  AssetKit: AssetKitFactory,
  AssetReservation: AssetReservationFactory,
  ConfigurationItem: ConfigurationItemFactory,
};
