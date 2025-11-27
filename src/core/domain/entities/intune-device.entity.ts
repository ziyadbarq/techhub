/**
 * IntuneDevice Entity
 *
 * Represents a device synced from Microsoft Intune.
 * Used for MDM integration, compliance tracking, and cross-referencing with ITAM Assets.
 */

export type IntuneDeviceOwnershipType = "CORPORATE" | "PERSONAL" | "UNKNOWN";

export type IntuneComplianceState =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "CONFLICT"
  | "ERROR"
  | "IN_GRACE_PERIOD"
  | "CONFIG_MANAGER"
  | "UNKNOWN";

export type IntuneManagementState =
  | "MANAGED"
  | "RETIRE_PENDING"
  | "RETIRE_ISSUED"
  | "WIPE_PENDING"
  | "WIPE_ISSUED"
  | "UNHEALTHY"
  | "DELETE_PENDING"
  | "DISCOVERED";

export type AssetLinkMethod = "auto_serial" | "manual";
export type PersonLinkMethod = "auto_azuread" | "manual";

export interface IntuneDeviceProps {
  id: string;

  // Intune Identity
  intuneDeviceId: string;
  azureAdDeviceId: string | null;

  // Device Info
  deviceName: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  operatingSystem: string | null;
  osVersion: string | null;
  imei: string | null;
  wiFiMacAddress: string | null;
  ethernetMacAddress: string | null;

  // User Assignment (from Intune)
  intuneUserId: string | null;
  userPrincipalName: string | null;
  userDisplayName: string | null;

  // Compliance & Management
  ownershipType: IntuneDeviceOwnershipType;
  complianceState: IntuneComplianceState;
  managementState: IntuneManagementState;
  isEncrypted: boolean;
  isSupervised: boolean;
  isJailBroken: boolean;

  // Timestamps from Intune
  enrolledDateTime: Date | null;
  lastSyncDateTime: Date | null;

  // ITAM Links
  linkedAssetId: string | null;
  linkedPersonId: string | null;

  // Link Metadata
  assetLinkMethod: AssetLinkMethod | null;
  assetLinkedAt: Date | null;
  personLinkMethod: PersonLinkMethod | null;
  personLinkedAt: Date | null;

  // Sync Tracking
  lastSyncedFromIntune: Date | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntuneDeviceProps {
  intuneDeviceId: string;
  azureAdDeviceId?: string | null;
  deviceName: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  operatingSystem?: string | null;
  osVersion?: string | null;
  imei?: string | null;
  wiFiMacAddress?: string | null;
  ethernetMacAddress?: string | null;
  intuneUserId?: string | null;
  userPrincipalName?: string | null;
  userDisplayName?: string | null;
  ownershipType?: IntuneDeviceOwnershipType;
  complianceState?: IntuneComplianceState;
  managementState?: IntuneManagementState;
  isEncrypted?: boolean;
  isSupervised?: boolean;
  isJailBroken?: boolean;
  enrolledDateTime?: Date | null;
  lastSyncDateTime?: Date | null;
}

export interface UpdateIntuneDeviceProps {
  // Allow updating intuneDeviceId for re-enrollment scenarios
  intuneDeviceId?: string;
  azureAdDeviceId?: string | null;
  deviceName?: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  operatingSystem?: string | null;
  osVersion?: string | null;
  imei?: string | null;
  wiFiMacAddress?: string | null;
  ethernetMacAddress?: string | null;
  intuneUserId?: string | null;
  userPrincipalName?: string | null;
  userDisplayName?: string | null;
  ownershipType?: IntuneDeviceOwnershipType;
  complianceState?: IntuneComplianceState;
  managementState?: IntuneManagementState;
  isEncrypted?: boolean;
  isSupervised?: boolean;
  isJailBroken?: boolean;
  enrolledDateTime?: Date | null;
  lastSyncDateTime?: Date | null;
  isActive?: boolean;
}

export class IntuneDevice {
  private constructor(private props: IntuneDeviceProps) {
    this.validate();
  }

  /**
   * Factory method to create a new Intune Device
   */
  static create(props: CreateIntuneDeviceProps): IntuneDevice {
    // Validation
    this.validateIntuneDeviceId(props.intuneDeviceId);
    this.validateDeviceName(props.deviceName);

    const now = new Date();

    return new IntuneDevice({
      id: crypto.randomUUID(),
      intuneDeviceId: props.intuneDeviceId.trim(),
      azureAdDeviceId: props.azureAdDeviceId?.trim() || null,
      deviceName: props.deviceName.trim(),
      serialNumber: props.serialNumber?.trim() || null,
      manufacturer: props.manufacturer?.trim() || null,
      model: props.model?.trim() || null,
      operatingSystem: props.operatingSystem?.trim() || null,
      osVersion: props.osVersion?.trim() || null,
      imei: props.imei?.trim() || null,
      wiFiMacAddress: props.wiFiMacAddress?.trim() || null,
      ethernetMacAddress: props.ethernetMacAddress?.trim() || null,
      intuneUserId: props.intuneUserId?.trim() || null,
      userPrincipalName: props.userPrincipalName?.trim() || null,
      userDisplayName: props.userDisplayName?.trim() || null,
      ownershipType: props.ownershipType ?? "UNKNOWN",
      complianceState: props.complianceState ?? "UNKNOWN",
      managementState: props.managementState ?? "MANAGED",
      isEncrypted: props.isEncrypted ?? false,
      isSupervised: props.isSupervised ?? false,
      isJailBroken: props.isJailBroken ?? false,
      enrolledDateTime: props.enrolledDateTime ?? null,
      lastSyncDateTime: props.lastSyncDateTime ?? null,
      linkedAssetId: null,
      linkedPersonId: null,
      assetLinkMethod: null,
      assetLinkedAt: null,
      personLinkMethod: null,
      personLinkedAt: null,
      lastSyncedFromIntune: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing Intune Device from persistence
   */
  static reconstitute(props: IntuneDeviceProps): IntuneDevice {
    return new IntuneDevice(props);
  }

  /**
   * Update device properties (typically from sync)
   */
  update(props: UpdateIntuneDeviceProps): void {
    // Handle intuneDeviceId update (re-enrollment scenario)
    if (props.intuneDeviceId !== undefined) {
      IntuneDevice.validateIntuneDeviceId(props.intuneDeviceId);
      this.props.intuneDeviceId = props.intuneDeviceId.trim();
    }

    if (props.deviceName !== undefined) {
      IntuneDevice.validateDeviceName(props.deviceName);
      this.props.deviceName = props.deviceName.trim();
    }

    if (props.azureAdDeviceId !== undefined) {
      this.props.azureAdDeviceId = props.azureAdDeviceId?.trim() || null;
    }

    if (props.serialNumber !== undefined) {
      this.props.serialNumber = props.serialNumber?.trim() || null;
    }

    if (props.manufacturer !== undefined) {
      this.props.manufacturer = props.manufacturer?.trim() || null;
    }

    if (props.model !== undefined) {
      this.props.model = props.model?.trim() || null;
    }

    if (props.operatingSystem !== undefined) {
      this.props.operatingSystem = props.operatingSystem?.trim() || null;
    }

    if (props.osVersion !== undefined) {
      this.props.osVersion = props.osVersion?.trim() || null;
    }

    if (props.imei !== undefined) {
      this.props.imei = props.imei?.trim() || null;
    }

    if (props.wiFiMacAddress !== undefined) {
      this.props.wiFiMacAddress = props.wiFiMacAddress?.trim() || null;
    }

    if (props.ethernetMacAddress !== undefined) {
      this.props.ethernetMacAddress = props.ethernetMacAddress?.trim() || null;
    }

    if (props.intuneUserId !== undefined) {
      this.props.intuneUserId = props.intuneUserId?.trim() || null;
    }

    if (props.userPrincipalName !== undefined) {
      this.props.userPrincipalName = props.userPrincipalName?.trim() || null;
    }

    if (props.userDisplayName !== undefined) {
      this.props.userDisplayName = props.userDisplayName?.trim() || null;
    }

    if (props.ownershipType !== undefined) {
      this.props.ownershipType = props.ownershipType;
    }

    if (props.complianceState !== undefined) {
      this.props.complianceState = props.complianceState;
    }

    if (props.managementState !== undefined) {
      this.props.managementState = props.managementState;
    }

    if (props.isEncrypted !== undefined) {
      this.props.isEncrypted = props.isEncrypted;
    }

    if (props.isSupervised !== undefined) {
      this.props.isSupervised = props.isSupervised;
    }

    if (props.isJailBroken !== undefined) {
      this.props.isJailBroken = props.isJailBroken;
    }

    if (props.enrolledDateTime !== undefined) {
      this.props.enrolledDateTime = props.enrolledDateTime;
    }

    if (props.lastSyncDateTime !== undefined) {
      this.props.lastSyncDateTime = props.lastSyncDateTime;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    this.props.lastSyncedFromIntune = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Link this device to an ITAM Asset
   */
  linkToAsset(assetId: string, method: AssetLinkMethod): void {
    if (!assetId?.trim()) {
      throw new Error("Asset ID is required");
    }
    this.props.linkedAssetId = assetId;
    this.props.assetLinkMethod = method;
    this.props.assetLinkedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Unlink this device from its ITAM Asset
   */
  unlinkFromAsset(): void {
    this.props.linkedAssetId = null;
    this.props.assetLinkMethod = null;
    this.props.assetLinkedAt = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Link this device to a Person
   */
  linkToPerson(personId: string, method: PersonLinkMethod): void {
    if (!personId?.trim()) {
      throw new Error("Person ID is required");
    }
    this.props.linkedPersonId = personId;
    this.props.personLinkMethod = method;
    this.props.personLinkedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Unlink this device from Person
   */
  unlinkFromPerson(): void {
    this.props.linkedPersonId = null;
    this.props.personLinkMethod = null;
    this.props.personLinkedAt = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark device as inactive (removed from Intune)
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark device as active
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if device is compliant
   */
  isCompliant(): boolean {
    return this.props.complianceState === "COMPLIANT";
  }

  /**
   * Check if device is linked to an Asset
   */
  isLinkedToAsset(): boolean {
    return !!this.props.linkedAssetId;
  }

  /**
   * Check if device is linked to a Person
   */
  isLinkedToPerson(): boolean {
    return !!this.props.linkedPersonId;
  }

  /**
   * Check if compliance state has changed
   */
  hasComplianceChanged(newState: IntuneComplianceState): boolean {
    return this.props.complianceState !== newState;
  }

  /**
   * Validate Intune Device ID
   */
  static validateIntuneDeviceId(id: string): void {
    if (!id?.trim()) {
      throw new Error("Intune Device ID is required");
    }
  }

  /**
   * Validate device name
   */
  static validateDeviceName(name: string): void {
    if (!name?.trim()) {
      throw new Error("Device name is required");
    }
    if (name.trim().length > 255) {
      throw new Error("Device name must not exceed 255 characters");
    }
  }

  /**
   * Validate entity properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("ID is required");
    }
    IntuneDevice.validateIntuneDeviceId(this.props.intuneDeviceId);
    IntuneDevice.validateDeviceName(this.props.deviceName);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get intuneDeviceId(): string {
    return this.props.intuneDeviceId;
  }

  get azureAdDeviceId(): string | null {
    return this.props.azureAdDeviceId;
  }

  get deviceName(): string {
    return this.props.deviceName;
  }

  get serialNumber(): string | null {
    return this.props.serialNumber;
  }

  get manufacturer(): string | null {
    return this.props.manufacturer;
  }

  get model(): string | null {
    return this.props.model;
  }

  get operatingSystem(): string | null {
    return this.props.operatingSystem;
  }

  get osVersion(): string | null {
    return this.props.osVersion;
  }

  get imei(): string | null {
    return this.props.imei;
  }

  get wiFiMacAddress(): string | null {
    return this.props.wiFiMacAddress;
  }

  get ethernetMacAddress(): string | null {
    return this.props.ethernetMacAddress;
  }

  get intuneUserId(): string | null {
    return this.props.intuneUserId;
  }

  get userPrincipalName(): string | null {
    return this.props.userPrincipalName;
  }

  get userDisplayName(): string | null {
    return this.props.userDisplayName;
  }

  get ownershipType(): IntuneDeviceOwnershipType {
    return this.props.ownershipType;
  }

  get complianceState(): IntuneComplianceState {
    return this.props.complianceState;
  }

  get managementState(): IntuneManagementState {
    return this.props.managementState;
  }

  get isEncrypted(): boolean {
    return this.props.isEncrypted;
  }

  get isSupervised(): boolean {
    return this.props.isSupervised;
  }

  get isJailBroken(): boolean {
    return this.props.isJailBroken;
  }

  get enrolledDateTime(): Date | null {
    return this.props.enrolledDateTime;
  }

  get lastSyncDateTime(): Date | null {
    return this.props.lastSyncDateTime;
  }

  get linkedAssetId(): string | null {
    return this.props.linkedAssetId;
  }

  get linkedPersonId(): string | null {
    return this.props.linkedPersonId;
  }

  get assetLinkMethod(): AssetLinkMethod | null {
    return this.props.assetLinkMethod;
  }

  get assetLinkedAt(): Date | null {
    return this.props.assetLinkedAt;
  }

  get personLinkMethod(): PersonLinkMethod | null {
    return this.props.personLinkMethod;
  }

  get personLinkedAt(): Date | null {
    return this.props.personLinkedAt;
  }

  get lastSyncedFromIntune(): Date | null {
    return this.props.lastSyncedFromIntune;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Convert entity to plain object for persistence
   */
  toObject(): IntuneDeviceProps {
    return { ...this.props };
  }
}
