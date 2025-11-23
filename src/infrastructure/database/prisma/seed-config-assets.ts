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
      name: "Dell Latitude 7490",
      code: "LAT7490",
      description: "14-inch business laptop",
    },
    {
      vendor: "HP",
      name: "HP EliteBook 840 G8",
      code: "EB840G8",
      description: "14-inch premium laptop",
    },
    {
      vendor: "LENOVO",
      name: "Lenovo ThinkPad X1 Carbon",
      code: "X1CG9",
      description: "Ultralight business laptop",
    },
    {
      vendor: "APPLE",
      name: "MacBook Pro 14-inch M2",
      code: "MBP14M2",
      description: "Apple Silicon laptop",
    },
  ],
  DESKTOP: [
    {
      vendor: "DELL",
      name: "Dell OptiPlex 7090",
      code: "OP7090",
      description: "Business desktop workstation",
    },
    {
      vendor: "HP",
      name: "HP EliteDesk 800 G8",
      code: "ED800G8",
      description: "Tower workstation",
    },
  ],
  MONITOR: [
    {
      vendor: "DELL",
      name: "Dell UltraSharp U2720Q",
      code: "U2720Q",
      description: "27-inch 4K monitor",
    },
    {
      vendor: "HP",
      name: "HP E24 G5",
      code: "E24G5",
      description: "24-inch FHD monitor",
    },
  ],
  SERVER: [
    {
      vendor: "DELL",
      name: "Dell PowerEdge R750",
      code: "R750",
      description: "2U rack server",
    },
    {
      vendor: "HP",
      name: "HP ProLiant DL380 Gen10",
      code: "DL380G10",
      description: "2U rack server",
    },
  ],
  NETWORK: [
    {
      vendor: "CISCO",
      name: "Cisco Catalyst 9300",
      code: "C9300-48P",
      description: "48-port PoE switch",
    },
    {
      vendor: "CISCO",
      name: "Cisco ASR 1001-X",
      code: "ASR1001X",
      description: "Aggregation router",
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
      name: "iPhone 14 Pro",
      code: "IP14PRO",
      description: "Corporate smartphone",
    },
    {
      vendor: "SAMSUNG",
      name: "Samsung Galaxy S23",
      code: "SGS23",
      description: "Android corporate phone",
    },
  ],
  TABLET: [
    {
      vendor: "APPLE",
      name: "iPad Pro 11-inch",
      code: "IPADPRO11",
      description: "Professional tablet",
    },
    {
      vendor: "SAMSUNG",
      name: "Samsung Galaxy Tab S8",
      code: "SGTABS8",
      description: "Android tablet",
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