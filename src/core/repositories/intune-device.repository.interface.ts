import type {
  IntuneDevice,
  IntuneComplianceState,
  IntuneManagementState,
  IntuneDeviceOwnershipType,
} from "../domain/entities/intune-device.entity";
import type { IntuneComplianceHistory } from "../domain/entities/intune-compliance-history.entity";

/**
 * Compliance statistics for dashboard
 */
export interface ComplianceStats {
  total: number;
  compliant: number;
  nonCompliant: number;
  inGracePeriod: number;
  conflict: number;
  error: number;
  configManager: number;
  unknown: number;
}

/**
 * Ownership breakdown stats
 */
export interface OwnershipStats {
  total: number;
  corporate: number;
  personal: number;
  unknown: number;
}

/**
 * Link status stats
 */
export interface LinkStats {
  total: number;
  linkedToAsset: number;
  unlinkedFromAsset: number;
  linkedToPerson: number;
  unlinkedFromPerson: number;
}

/**
 * Filter options for listing devices
 */
export interface IntuneDeviceFilters {
  complianceState?: IntuneComplianceState;
  managementState?: IntuneManagementState;
  ownershipType?: IntuneDeviceOwnershipType;
  operatingSystem?: string;
  isActive?: boolean;
  isLinkedToAsset?: boolean;
  isLinkedToPerson?: boolean;
  searchQuery?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  skip?: number;
  take?: number;
}

/**
 * Intune Device Repository Interface
 *
 * Defines the contract for persisting and retrieving Intune devices.
 */
export interface IIntuneDeviceRepository {
  // ==========================================
  // CRUD Operations
  // ==========================================

  /**
   * Create a new Intune device
   */
  create(device: IntuneDevice): Promise<IntuneDevice>;

  /**
   * Find a device by ID
   */
  findById(id: string): Promise<IntuneDevice | null>;

  /**
   * Find a device by Intune Device ID (unique identifier from Intune)
   */
  findByIntuneDeviceId(intuneDeviceId: string): Promise<IntuneDevice | null>;

  /**
   * Find a device by Azure AD Device ID
   */
  findByAzureAdDeviceId(azureAdDeviceId: string): Promise<IntuneDevice | null>;

  /**
   * Find a device by serial number
   */
  findBySerialNumber(serialNumber: string): Promise<IntuneDevice | null>;

  /**
   * Find all devices with optional filters and pagination
   */
  findAll(
    filters?: IntuneDeviceFilters,
    pagination?: PaginationOptions,
  ): Promise<IntuneDevice[]>;

  /**
   * Count devices with optional filters
   */
  count(filters?: IntuneDeviceFilters): Promise<number>;

  /**
   * Update an existing device
   */
  update(device: IntuneDevice): Promise<IntuneDevice>;

  /**
   * Delete a device
   */
  delete(id: string): Promise<void>;

  /**
   * Bulk upsert devices (for sync operations)
   * Returns array of upserted devices
   */
  bulkUpsert(devices: IntuneDevice[]): Promise<IntuneDevice[]>;

  // ==========================================
  // Query Operations
  // ==========================================

  /**
   * Find devices by linked Asset ID
   */
  findByLinkedAsset(assetId: string): Promise<IntuneDevice | null>;

  /**
   * Find devices by linked Person ID
   */
  findByLinkedPerson(personId: string): Promise<IntuneDevice[]>;

  /**
   * Find devices by Intune User ID
   */
  findByIntuneUserId(intuneUserId: string): Promise<IntuneDevice[]>;

  /**
   * Find devices by compliance state
   */
  findByComplianceState(state: IntuneComplianceState): Promise<IntuneDevice[]>;

  /**
   * Find devices by operating system
   */
  findByOperatingSystem(os: string): Promise<IntuneDevice[]>;

  // ==========================================
  // Reconciliation Operations
  // ==========================================

  /**
   * Find devices without Asset link (for reconciliation)
   */
  findUnlinkedFromAssets(): Promise<IntuneDevice[]>;

  /**
   * Find devices without Person link (for reconciliation)
   */
  findUnlinkedFromPersons(): Promise<IntuneDevice[]>;

  /**
   * Find non-compliant devices
   */
  findNonCompliant(): Promise<IntuneDevice[]>;

  /**
   * Find devices that haven't synced in a given number of days
   */
  findStaleDevices(days: number): Promise<IntuneDevice[]>;

  /**
   * Deactivate devices not in the provided list of Intune Device IDs
   * Used during sync to mark removed devices
   * Returns count of deactivated devices
   */
  deactivateNotIn(intuneDeviceIds: string[]): Promise<number>;

  // ==========================================
  // Statistics Operations
  // ==========================================

  /**
   * Get compliance statistics
   */
  getComplianceStats(): Promise<ComplianceStats>;

  /**
   * Get ownership breakdown statistics
   */
  getOwnershipStats(): Promise<OwnershipStats>;

  /**
   * Get link status statistics
   */
  getLinkStats(): Promise<LinkStats>;

  /**
   * Get count by operating system
   */
  countByOperatingSystem(): Promise<Record<string, number>>;

  // ==========================================
  // Existence Checks
  // ==========================================

  /**
   * Check if a device exists by Intune Device ID
   */
  existsByIntuneDeviceId(intuneDeviceId: string): Promise<boolean>;

  /**
   * Check if a device exists by serial number
   */
  existsBySerialNumber(serialNumber: string): Promise<boolean>;
}

/**
 * Intune Compliance History Repository Interface
 *
 * Defines the contract for persisting and retrieving compliance history.
 */
export interface IIntuneComplianceHistoryRepository {
  /**
   * Create a new compliance history entry
   */
  create(history: IntuneComplianceHistory): Promise<IntuneComplianceHistory>;

  /**
   * Find history entries by device ID
   */
  findByDeviceId(
    intuneDeviceId: string,
    pagination?: PaginationOptions,
  ): Promise<IntuneComplianceHistory[]>;

  /**
   * Find history entries by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions,
  ): Promise<IntuneComplianceHistory[]>;

  /**
   * Find recent transitions to non-compliant state
   */
  findRecentNonCompliantTransitions(
    since: Date,
  ): Promise<IntuneComplianceHistory[]>;

  /**
   * Count compliance state changes for a device
   */
  countByDeviceId(intuneDeviceId: string): Promise<number>;

  /**
   * Delete history entries older than a date (for data retention)
   */
  deleteOlderThan(date: Date): Promise<number>;
}
