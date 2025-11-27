/**
 * Microsoft Graph Service Interface
 *
 * Defines the contract for interacting with Microsoft Graph API
 * for user synchronization from Azure AD / Microsoft Entra ID.
 *
 * This service uses Client Credentials Flow (app-only authentication)
 * for background sync operations without user interaction.
 */

import type {
  FetchUsersOptions,
  GraphUser,
  GraphManagerResponse,
} from "@/lib/schemas/graph-user.schema";
import type {
  FetchDevicesOptions,
  GraphIntuneDevice,
} from "@/lib/schemas/graph-intune-device.schema";

/**
 * Service interface for Microsoft Graph API operations.
 *
 * This service is responsible for:
 * - Fetching users from Microsoft Graph API
 * - Retrieving manager relationships
 * - Fetching Intune managed devices
 * - Handling pagination for large data sets
 * - Authentication via Client Credentials Flow
 *
 * **Required Azure AD Permissions (Application type):**
 * - `User.Read.All` - Read all users' full profiles
 * - `Directory.Read.All` - Read directory data (optional, for manager)
 * - `DeviceManagementManagedDevices.Read.All` - Read Intune managed devices
 *
 * **Usage:**
 * ```typescript
 * const users = await graphService.fetchAllUsers();
 * for (const user of users) {
 *   console.log(user.displayName, user.mail);
 * }
 *
 * const devices = await graphService.fetchAllManagedDevices();
 * for (const device of devices) {
 *   console.log(device.deviceName, device.complianceState);
 * }
 * ```
 */
export interface IMicrosoftGraphService {
  /**
   * Fetches all users from Microsoft Graph API.
   *
   * Handles pagination automatically, collecting all pages of results.
   * By default, only returns enabled internal users.
   *
   * @param options - Options for filtering users
   * @returns Promise resolving to array of all users
   *
   * @example
   * ```typescript
   * // Get all active internal users (default)
   * const users = await graphService.fetchAllUsers();
   *
   * // Include disabled accounts for full sync
   * const allUsers = await graphService.fetchAllUsers({
   *   includeDisabled: true,
   * });
   *
   * // Include guest accounts
   * const withGuests = await graphService.fetchAllUsers({
   *   includeGuests: true,
   * });
   * ```
   */
  fetchAllUsers(options?: FetchUsersOptions): Promise<GraphUser[]>;

  /**
   * Fetches a specific user by Azure AD ID.
   *
   * @param userId - Azure AD Object ID (GUID)
   * @returns Promise resolving to user data or null if not found
   *
   * @example
   * ```typescript
   * const user = await graphService.fetchUser('e9836314-ae4d-4283-9a34-75df34ea64ae');
   * if (user) {
   *   console.log(user.displayName);
   * }
   * ```
   */
  fetchUser(userId: string): Promise<GraphUser | null>;

  /**
   * Fetches the manager for a specific user.
   *
   * @param userId - Azure AD Object ID of the user
   * @returns Promise resolving to manager data or null if no manager assigned
   *
   * @example
   * ```typescript
   * const manager = await graphService.fetchUserManager('e9836314-...');
   * if (manager) {
   *   console.log('Manager ID:', manager.id);
   * }
   * ```
   */
  fetchUserManager(userId: string): Promise<GraphManagerResponse | null>;

  /**
   * Fetches managers for multiple users in batches.
   *
   * Optimized for bulk operations, processes users in batches to avoid
   * API throttling. Returns a map of user Azure AD ID to manager Azure AD ID.
   *
   * @param userIds - Array of Azure AD Object IDs
   * @returns Promise resolving to Map<userId, managerId>
   *
   * @example
   * ```typescript
   * const userIds = ['id1', 'id2', 'id3'];
   * const managerMap = await graphService.fetchAllManagers(userIds);
   *
   * for (const [userId, managerId] of managerMap) {
   *   console.log(`User ${userId} reports to ${managerId}`);
   * }
   * ```
   */
  fetchAllManagers(userIds: string[]): Promise<Map<string, string>>;

  /**
   * Tests the connection to Microsoft Graph API.
   *
   * Verifies that credentials are valid and required permissions are granted.
   * Useful for health checks and configuration validation.
   *
   * @returns Promise resolving to true if connection is successful
   * @throws Error if connection fails with details about the failure
   *
   * @example
   * ```typescript
   * try {
   *   await graphService.testConnection();
   *   console.log('Graph API connection successful');
   * } catch (error) {
   *   console.error('Graph API connection failed:', error);
   * }
   * ```
   */
  testConnection(): Promise<boolean>;

  // ==========================================
  // Intune Device Management
  // ==========================================

  /**
   * Fetches all managed devices from Microsoft Intune via Graph API.
   *
   * Handles pagination automatically, collecting all pages of results.
   * Requires `DeviceManagementManagedDevices.Read.All` permission.
   *
   * @param options - Options for filtering devices
   * @returns Promise resolving to array of all managed devices
   *
   * @example
   * ```typescript
   * // Get all managed devices
   * const devices = await graphService.fetchAllManagedDevices();
   *
   * // Get only corporate devices
   * const corporateDevices = await graphService.fetchAllManagedDevices({
   *   ownershipType: 'corporate',
   * });
   *
   * // Get only compliant devices
   * const compliantDevices = await graphService.fetchAllManagedDevices({
   *   complianceState: 'compliant',
   * });
   * ```
   */
  fetchAllManagedDevices(
    options?: FetchDevicesOptions,
  ): Promise<GraphIntuneDevice[]>;

  /**
   * Fetches a specific managed device by Intune device ID.
   *
   * @param deviceId - Intune device ID (GUID)
   * @returns Promise resolving to device data or null if not found
   *
   * @example
   * ```typescript
   * const device = await graphService.fetchManagedDevice('device-guid-here');
   * if (device) {
   *   console.log(device.deviceName, device.complianceState);
   * }
   * ```
   */
  fetchManagedDevice(deviceId: string): Promise<GraphIntuneDevice | null>;

  /**
   * Tests the connection to Intune via Microsoft Graph API.
   *
   * Verifies that Intune-specific permissions are granted.
   *
   * @returns Promise resolving to true if Intune connection is successful
   * @throws Error if connection fails
   *
   * @example
   * ```typescript
   * try {
   *   await graphService.testIntuneConnection();
   *   console.log('Intune API connection successful');
   * } catch (error) {
   *   console.error('Intune API connection failed:', error);
   * }
   * ```
   */
  testIntuneConnection(): Promise<boolean>;
}

/**
 * Symbol for DI container binding
 */
export const IMicrosoftGraphService = Symbol.for("IMicrosoftGraphService");
