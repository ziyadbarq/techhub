/**
 * Financial & Procurement Roles
 *
 * Financial oversight and inventory management roles:
 * - finance-manager: Contracts, licenses, procurement, exchange rates
 * - inventory-manager: Stock control, receiving, shipping
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { RoleDefinition } from "./types";

export const FINANCIAL_ROLES: Record<string, RoleDefinition> = {
  /**
   * Finance Manager - Financial oversight
   * Contracts, licenses, procurement, exchange rates
   */
  "finance-manager": {
    name: "finance-manager",
    displayName: "Finance Manager",
    description:
      "Financial oversight - contracts, licenses, procurement, exchange rates",
    permissions: [
      // Contracts - Full access
      PERMISSIONS.CONTRACT_TYPES_VIEW,
      PERMISSIONS.CONTRACT_TYPES_CREATE,
      PERMISSIONS.CONTRACT_TYPES_UPDATE,
      PERMISSIONS.CONTRACT_TYPES_DELETE,
      PERMISSIONS.CONTRACT_TYPES_MANAGE,
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_CREATE,
      PERMISSIONS.CONTRACTS_UPDATE,
      PERMISSIONS.CONTRACTS_DELETE,
      PERMISSIONS.CONTRACTS_MANAGE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_UPDATE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_DELETE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_MANAGE,

      // Licenses - Full access
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_PRODUCTS_CREATE,
      PERMISSIONS.LICENSE_PRODUCTS_UPDATE,
      PERMISSIONS.LICENSE_PRODUCTS_DELETE,
      PERMISSIONS.LICENSE_PRODUCTS_MANAGE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_UPDATE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_DELETE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_MANAGE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_MANAGE,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_CREATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DELETE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DEALLOCATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_REACTIVATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_MANAGE,

      // Exchange Rates - Full access
      PERMISSIONS.FX_RATES_VIEW,
      PERMISSIONS.FX_RATES_CREATE,
      PERMISSIONS.FX_RATES_UPDATE,
      PERMISSIONS.FX_RATES_DELETE,
      PERMISSIONS.FX_RATES_MANAGE,
      PERMISSIONS.FX_RATES_CONVERT,

      // Vendors - Full access
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDORS_CREATE,
      PERMISSIONS.VENDORS_UPDATE,
      PERMISSIONS.VENDORS_DELETE,
      PERMISSIONS.VENDORS_MANAGE,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_CREATE,
      PERMISSIONS.VENDOR_CONTACTS_UPDATE,
      PERMISSIONS.VENDOR_CONTACTS_DELETE,

      // Asset Disposals - Financial approval
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_APPROVE,
      PERMISSIONS.ASSET_DISPOSALS_REJECT,

      // Assets - Read-only (for contract linking, cost tracking)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.WARRANTIES_VIEW,

      // Configuration Items - Read-only (for license allocation)
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,

      // Persons - Read-only (for license allocation)
      PERMISSIONS.PERSONS_VIEW,

      // Attachments - View + Create (invoices, POs)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Inventory Manager - Stock and warehouse management
   * Stock control, receiving, shipping
   */
  "inventory-manager": {
    name: "inventory-manager",
    displayName: "Inventory Manager",
    description:
      "Stock and warehouse management - inventory tracking, receiving, shipping",
    permissions: [
      // Stock Locations - Full access
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_LOCATIONS_CREATE,
      PERMISSIONS.STOCK_LOCATIONS_UPDATE,
      PERMISSIONS.STOCK_LOCATIONS_DELETE,
      PERMISSIONS.STOCK_LOCATIONS_MANAGE,

      // Stock Movements - Full access
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_CREATE,
      PERMISSIONS.STOCK_MOVEMENTS_DELETE,
      PERMISSIONS.STOCK_MOVEMENTS_MANAGE,

      // Assets - Create + Update (receiving stock, status changes)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Vendors - Read-only (receiving shipments)
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,

      // Locations
      PERMISSIONS.LOCATIONS_VIEW,

      // Warranties - Create (register warranties on receipt)
      PERMISSIONS.WARRANTIES_VIEW,
      PERMISSIONS.WARRANTIES_CREATE,

      // Attachments - Create (packing slips, receipts)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Asset Disposals - Read-only (coordinate logistics)
      PERMISSIONS.ASSET_DISPOSALS_VIEW,

      // Lifecycle - Read-only
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
} as const;
