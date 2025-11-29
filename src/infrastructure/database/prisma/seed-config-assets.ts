/**
 * Asset Layer Seed Configuration - Categories, Models, Warranties, Maintenance Templates
 */

import { WarrantyCoverageType } from "@/generated/prisma/enums";

// ==============================================
// Asset Category Data
// ==============================================

export const ASSET_CATEGORY_DATA = [
  {
    name: "Laptop Computers",
    code: "LAPTOP",
    description: "Portable laptop computers",
  },
  {
    name: "Desktop Computers",
    code: "DESKTOP",
    description: "Desktop workstations",
  },
  { name: "Monitors", code: "MONITOR", description: "Display monitors" },
  {
    name: "Servers",
    code: "SERVER",
    description: "Physical and virtual servers",
  },
  {
    name: "Network Equipment",
    code: "NETWORK",
    description: "Switches, routers, firewalls",
  },
  {
    name: "Printers",
    code: "PRINTER",
    description: "Printers and multifunction devices",
  },
  {
    name: "Mobile Phones",
    code: "PHONE",
    description: "Corporate mobile phones",
  },
  { name: "Tablets", code: "TABLET", description: "Tablet devices" },
] as const;

// ==============================================
// Asset Model Data
// ==============================================

export const ASSET_MODEL_DATA = {
  LAPTOP: [
    {
      vendor: "DELL",
      name: "Dell Latitude 5540",
      code: "LAT5540",
      description: "15-inch business laptop",
    },
    {
      vendor: "HP",
      name: "HP EliteBook 860 G10",
      code: "EB860G10",
      description: "16-inch premium laptop",
    },
    {
      vendor: "LENOVO",
      name: "Lenovo ThinkPad T14s Gen 4",
      code: "T14SG4",
      description: "14-inch ultrabook",
    },
    {
      vendor: "APPLE",
      name: "MacBook Air 15-inch M3",
      code: "MBA15M3",
      description: "Lightweight Apple Silicon laptop",
    },
  ],
  DESKTOP: [
    {
      vendor: "DELL",
      name: "Dell OptiPlex 7010",
      code: "OP7010",
      description: "Business desktop workstation",
    },
    {
      vendor: "HP",
      name: "HP EliteDesk 800 G9",
      code: "ED800G9",
      description: "Tower workstation",
    },
    {
      vendor: "APPLE",
      name: "Mac Mini M2",
      code: "MACMINI-M2",
      description: "Compact Apple Silicon desktop",
    },
    {
      vendor: "LENOVO",
      name: "Lenovo ThinkCentre M90q Gen 4",
      code: "M90QG4",
      description: "Tiny form factor desktop",
    },
  ],
  MONITOR: [
    {
      vendor: "DELL",
      name: "Dell UltraSharp U2723QE",
      code: "U2723QE",
      description: "27-inch 4K USB-C monitor",
    },
    {
      vendor: "HP",
      name: "HP E27 G5",
      code: "E27G5",
      description: "27-inch FHD monitor",
    },
    {
      vendor: "SAMSUNG",
      name: "Samsung ViewFinity S8 32-inch",
      code: "SAM-S832",
      description: "32-inch 4K UHD monitor",
    },
  ],
  SERVER: [
    {
      vendor: "DELL",
      name: "Dell PowerEdge R760",
      code: "R760",
      description: "2U rack server (16th Gen)",
    },
    {
      vendor: "HP",
      name: "HP ProLiant DL380 Gen11",
      code: "DL380G11",
      description: "2U rack server (Gen11)",
    },
  ],
  NETWORK: [
    {
      vendor: "CISCO",
      name: "Cisco Catalyst 9300-48P",
      code: "C9300-48P",
      description: "48-port PoE+ access switch",
    },
    {
      vendor: "CISCO",
      name: "Cisco Catalyst 9200-24P",
      code: "C9200-24P",
      description: "24-port PoE+ access switch",
    },
    {
      vendor: "CISCO",
      name: "Cisco ASR 1001-X",
      code: "ASR1001X",
      description: "Aggregation services router",
    },
    {
      vendor: "CISCO",
      name: "Cisco Meraki MS250-48",
      code: "MS250-48",
      description: "48-port cloud-managed switch",
    },
  ],
  PRINTER: [
    {
      vendor: "HP",
      name: "HP LaserJet Pro M404dn",
      code: "M404DN",
      description: "Monochrome laser printer",
    },
    {
      vendor: "HP",
      name: "HP Color LaserJet Pro MFP M479fdw",
      code: "M479FDW",
      description: "Color multifunction printer",
    },
  ],
  PHONE: [
    {
      vendor: "APPLE",
      name: "iPhone 15 Pro",
      code: "IP15PRO",
      description: "Corporate smartphone",
    },
    {
      vendor: "SAMSUNG",
      name: "Samsung Galaxy S24",
      code: "SGS24",
      description: "Android corporate phone",
    },
  ],
  TABLET: [
    {
      vendor: "APPLE",
      name: "iPad Pro 11-inch M4",
      code: "IPADPRO11M4",
      description: "Professional tablet",
    },
    {
      vendor: "APPLE",
      name: "iPad Air 11-inch M2",
      code: "IPADAIR11",
      description: "Mid-tier business tablet",
    },
    {
      vendor: "SAMSUNG",
      name: "Samsung Galaxy Tab S9",
      code: "SGTABS9",
      description: "Android business tablet",
    },
  ],
} as const;

// ==============================================
// Warranty Configuration
// ==============================================

export const WARRANTY_CONFIG = {
  STANDARD_LAPTOP: {
    months: 36,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
  STANDARD_DESKTOP: {
    months: 36,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
  STANDARD_MONITOR: {
    months: 36,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
  EXTENDED_SERVER: {
    months: 60,
    type: WarrantyCoverageType.EXTENDED,
    provider: "ProSupport Plus",
  },
  SUPPORT_NETWORK: {
    months: 36,
    type: WarrantyCoverageType.ONSITE,
    provider: "Cisco SmartNet",
  },
  STANDARD_PRINTER: {
    months: 12,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
  STANDARD_PHONE: {
    months: 24,
    type: WarrantyCoverageType.STANDARD,
    provider: "AppleCare+",
  },
  STANDARD_TABLET: {
    months: 24,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
} as const;

// ==============================================
// Maintenance Schedule Templates
// ==============================================

export const MAINTENANCE_TEMPLATES = {
  SERVER_MONTHLY: {
    type: "PREVENTIVE" as const,
    frequency: "MONTHLY" as const,
    duration: 120,
    description:
      "Monthly server maintenance: system updates, disk cleanup, performance monitoring",
  },
  NETWORK_QUARTERLY: {
    type: "INSPECTION" as const,
    frequency: "QUARTERLY" as const,
    duration: 60,
    description:
      "Quarterly inspection: firmware updates, port testing, cable inspection",
  },
  PRINTER_BIANNUAL: {
    type: "CLEANING" as const,
    frequency: "CUSTOM" as const,
    frequencyInterval: 6,
    duration: 90,
    description:
      "Deep cleaning, roller replacement, calibration, and firmware updates",
  },
  LAPTOP_ANNUAL: {
    type: "UPGRADE" as const,
    frequency: "ANNUALLY" as const,
    duration: 180,
    description:
      "Annual maintenance: OS reinstall, hardware upgrade assessment, SSD health check",
  },
} as const;

// ==============================================
// Asset Category Field Mappings
// Maps field definitions to asset categories
// ==============================================

export const ASSET_CATEGORY_FIELD_MAPPINGS: Record<string, string[]> = {
  // Computing devices get hardware specs
  LAPTOP: ["CPU_MODEL", "RAM_GB", "STORAGE_GB", "OS_VERSION", "MAC_ADDR"],
  DESKTOP: ["CPU_MODEL", "RAM_GB", "STORAGE_GB", "OS_VERSION", "MAC_ADDR"],
  SERVER: [
    "CPU_MODEL",
    "RAM_GB",
    "STORAGE_GB",
    "OS_VERSION",
    "MAC_ADDR",
    "IP_ADDR",
  ],

  // Mobile devices get storage and OS
  PHONE: ["STORAGE_GB", "OS_VERSION"],
  TABLET: ["STORAGE_GB", "RAM_GB", "OS_VERSION"],

  // Network equipment gets network-specific fields
  NETWORK: ["MAC_ADDR", "IP_ADDR"],

  // Simple devices with minimal fields
  MONITOR: [],
  PRINTER: ["IP_ADDR"],
};
