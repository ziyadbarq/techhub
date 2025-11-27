/**
 * Intune Use Cases - Barrel Export
 */

// Sync
export { SyncDevicesFromIntuneUseCase } from "./sync-devices-from-intune.use-case";
export type {
  IntuneSyncResult,
  SyncDevicesOptions,
} from "./sync-devices-from-intune.use-case";

// Query
export { GetIntuneDeviceUseCase } from "./get-intune-device.use-case";
export type { GetIntuneDeviceInput } from "./get-intune-device.use-case";

export { ListIntuneDevicesUseCase } from "./list-intune-devices.use-case";
export type {
  ListIntuneDevicesInput,
  ListIntuneDevicesOutput,
} from "./list-intune-devices.use-case";

export { GetIntuneComplianceStatsUseCase } from "./get-intune-compliance-stats.use-case";
export type { IntuneStatsOutput } from "./get-intune-compliance-stats.use-case";

// Link to Asset
export { LinkIntuneDeviceToAssetUseCase } from "./link-intune-device-to-asset.use-case";
export type {
  LinkDeviceToAssetInput,
  LinkDeviceToAssetOutput,
} from "./link-intune-device-to-asset.use-case";

export { UnlinkIntuneDeviceFromAssetUseCase } from "./unlink-intune-device-from-asset.use-case";
export type {
  UnlinkDeviceFromAssetInput,
  UnlinkDeviceFromAssetOutput,
} from "./unlink-intune-device-from-asset.use-case";

// Link to Person
export { LinkIntuneDeviceToPersonUseCase } from "./link-intune-device-to-person.use-case";
export type {
  LinkDeviceToPersonInput,
  LinkDeviceToPersonOutput,
} from "./link-intune-device-to-person.use-case";

export { UnlinkIntuneDeviceFromPersonUseCase } from "./unlink-intune-device-from-person.use-case";
export type {
  UnlinkDeviceFromPersonInput,
  UnlinkDeviceFromPersonOutput,
} from "./unlink-intune-device-from-person.use-case";
