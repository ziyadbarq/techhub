/**
 * Seed Configuration Constants
 *
 * Centralized configuration for all seed scripts:
 * - Sample data arrays
 * - Seeder quantity configuration
 * - Test data templates
 * - Enterprise-realistic data
 */

import { WarrantyCoverageType } from "@/generated/prisma/enums";

// ==============================================
// Seeder Quantities Configuration
// ==============================================

export const SEED_QUANTITIES = {
  // Foundation Layer
  VENDORS: 8,
  LOCATIONS: 10,
  ORGANIZATION_UNITS: 5,
  PERSONS: 15,
  LIFECYCLE_STATUSES: 6,
  FIELD_DEFINITIONS: 8,

  // Asset Layer
  ASSET_CATEGORIES: 8,
  ASSET_MODELS: 15,
  ASSETS_PER_CATEGORY: {
    LAPTOP: 15,
    DESKTOP: 8,
    MONITOR: 10,
    SERVER: 5,
    NETWORK: 6,
    PRINTER: 4,
    PHONE: 10,
    TABLET: 6,
  },
  STOCK_LOCATIONS: 5,
  STOCK_MOVEMENTS_PER_LOCATION: 3,
  ASSET_ASSIGNMENTS_PERCENTAGE: 0.7, // 70% of assets assigned
  WARRANTIES_PERCENTAGE: 0.8, // 80% of assets have warranties
  MAINTENANCE_SCHEDULES_PERCENTAGE: 0.6, // 60% of assets have schedules
  MAINTENANCE_RECORDS_PER_ASSET: 3,

  // Layer 3 ITAM
  ASSET_DISPOSALS: 8,
  DISPOSAL_APPROVALS_PER_DISPOSAL: 2,
  ASSET_KITS: 5,
  KIT_ITEMS_PER_KIT: 4,
  KIT_CHECKOUTS: 6,
  ASSET_RESERVATIONS: 10,
  RESERVATION_CONFLICTS: 3,
  CONFIGURATION_ITEMS: 20,
  RELATIONSHIP_TYPES: 8,
  CI_RELATIONSHIPS: 15,
} as const;

// ==============================================
// Vendor Data
// ==============================================

export const VENDOR_DATA = [
  { name: "Dell Technologies", code: "DELL", type: "MANUFACTURER" as const },
  { name: "HP Inc.", code: "HP", type: "MANUFACTURER" as const },
  { name: "Lenovo", code: "LENOVO", type: "MANUFACTURER" as const },
  { name: "Apple Inc.", code: "APPLE", type: "MANUFACTURER" as const },
  { name: "Cisco Systems", code: "CISCO", type: "MANUFACTURER" as const },
  {
    name: "Microsoft Corporation",
    code: "MSFT",
    type: "MANUFACTURER" as const,
  },
  {
    name: "Samsung Electronics",
    code: "SAMSUNG",
    type: "MANUFACTURER" as const,
  },
  { name: "CDW LLC", code: "CDW", type: "RESELLER" as const },
] as const;

// ==============================================
// Location Data
// ==============================================

export const LOCATION_DATA = [
  {
    name: "Riyadh Headquarters",
    code: "RUH-HQ",
    city: "Riyadh",
    country: "Saudi Arabia",
  },
  {
    name: "Jeddah Branch Office",
    code: "JED-BR",
    city: "Jeddah",
    country: "Saudi Arabia",
  },
  {
    name: "Dammam Operations Center",
    code: "DMM-OPS",
    city: "Dammam",
    country: "Saudi Arabia",
  },
  {
    name: "Riyadh Data Center",
    code: "RUH-DC",
    city: "Riyadh",
    country: "Saudi Arabia",
  },
  {
    name: "Khobar Regional Office",
    code: "KHB-RO",
    city: "Khobar",
    country: "Saudi Arabia",
  },
  {
    name: "Mecca Branch",
    code: "MEC-BR",
    city: "Mecca",
    country: "Saudi Arabia",
  },
  {
    name: "Medina Branch",
    code: "MED-BR",
    city: "Medina",
    country: "Saudi Arabia",
  },
  {
    name: "Riyadh Warehouse",
    code: "RUH-WH",
    city: "Riyadh",
    country: "Saudi Arabia",
  },
  {
    name: "Remote - Home Office",
    code: "REMOTE",
    city: "Various",
    country: "Saudi Arabia",
  },
  {
    name: "Storage - Archived",
    code: "STORAGE",
    city: "Riyadh",
    country: "Saudi Arabia",
  },
] as const;

// ==============================================
// Organization Unit Data
// ==============================================

export const ORG_UNIT_DATA = [
  {
    name: "Technology Department",
    code: "TECH",
    description: "Technology and IT operations",
  },
  {
    name: "Engineering Team",
    code: "ENG",
    parentCode: "TECH",
    description: "Software and infrastructure engineering",
  },
  {
    name: "Operations Team",
    code: "OPS",
    parentCode: "TECH",
    description: "IT operations and support",
  },
  {
    name: "Security Team",
    code: "SEC",
    parentCode: "TECH",
    description: "Information security and compliance",
  },
  {
    name: "Finance Department",
    code: "FIN",
    description: "Finance and accounting operations",
  },
] as const;

// ==============================================
// Person Data (Realistic Saudi Names)
// ==============================================

export const PERSON_DATA = [
  {
    firstName: "Ahmed",
    lastName: "Al-Mansour",
    email: "[email protected]",
    title: "IT Manager",
    orgUnitCode: "TECH",
  },
  {
    firstName: "Fatima",
    lastName: "Al-Zahrani",
    email: "[email protected]",
    title: "Senior Systems Engineer",
    orgUnitCode: "ENG",
  },
  {
    firstName: "Mohammed",
    lastName: "Al-Qarni",
    email: "[email protected]",
    title: "Network Administrator",
    orgUnitCode: "OPS",
  },
  {
    firstName: "Noura",
    lastName: "Al-Rashid",
    email: "[email protected]",
    title: "Security Analyst",
    orgUnitCode: "SEC",
  },
  {
    firstName: "Khalid",
    lastName: "Al-Ghamdi",
    email: "[email protected]",
    title: "DevOps Engineer",
    orgUnitCode: "ENG",
  },
  {
    firstName: "Sara",
    lastName: "Al-Mutairi",
    email: "[email protected]",
    title: "IT Support Specialist",
    orgUnitCode: "OPS",
  },
  {
    firstName: "Abdullah",
    lastName: "Al-Harthi",
    email: "[email protected]",
    title: "Database Administrator",
    orgUnitCode: "ENG",
  },
  {
    firstName: "Layla",
    lastName: "Al-Dosari",
    email: "[email protected]",
    title: "Systems Administrator",
    orgUnitCode: "OPS",
  },
  {
    firstName: "Omar",
    lastName: "Al-Shehri",
    email: "[email protected]",
    title: "Security Engineer",
    orgUnitCode: "SEC",
  },
  {
    firstName: "Maha",
    lastName: "Al-Otaibi",
    email: "[email protected]",
    title: "Software Engineer",
    orgUnitCode: "ENG",
  },
  {
    firstName: "Faisal",
    lastName: "Al-Harbi",
    email: "[email protected]",
    title: "IT Analyst",
    orgUnitCode: "OPS",
  },
  {
    firstName: "Hanan",
    lastName: "Al-Subai",
    email: "[email protected]",
    title: "System Architect",
    orgUnitCode: "ENG",
  },
  {
    firstName: "Saud",
    lastName: "Al-Ajmi",
    email: "[email protected]",
    title: "Network Engineer",
    orgUnitCode: "OPS",
  },
  {
    firstName: "Aisha",
    lastName: "Al-Malki",
    email: "[email protected]",
    title: "Compliance Officer",
    orgUnitCode: "SEC",
  },
  {
    firstName: "Tariq",
    lastName: "Al-Shamrani",
    email: "[email protected]",
    title: "Infrastructure Engineer",
    orgUnitCode: "ENG",
  },
] as const;

// ==============================================
// Lifecycle Status Data
// ==============================================

export const LIFECYCLE_STATUS_DATA = [
  {
    name: "In Stock",
    code: "IN_STOCK",
    stage: "PROCUREMENT" as const,
    description: "New asset in inventory",
  },
  {
    name: "Deployed",
    code: "DEPLOYED",
    stage: "DEPLOYMENT" as const,
    description: "Asset deployed to user",
  },
  {
    name: "In Use",
    code: "IN_USE",
    stage: "PRODUCTION" as const,
    description: "Asset actively in use",
  },
  {
    name: "In Maintenance",
    code: "IN_MAINT",
    stage: "MAINTENANCE" as const,
    description: "Under maintenance or repair",
  },
  {
    name: "End of Life",
    code: "EOL",
    stage: "RETIREMENT" as const,
    description: "Asset reached end of life",
  },
  {
    name: "Disposed",
    code: "DISPOSED",
    stage: "DISPOSAL" as const,
    description: "Asset disposed or recycled",
  },
] as const;

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

// ==============================================
// Asset Kit Templates
// ==============================================

export const ASSET_KIT_TEMPLATES = [
  {
    name: "New Hire - Developer Kit",
    code: "KIT-DEV-001",
    description: "Complete setup for new software developers",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "New Hire - Standard Office Kit",
    code: "KIT-OFF-001",
    description: "Standard setup for office employees",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
    ],
  },
  {
    name: "Remote Worker Kit",
    code: "KIT-REM-001",
    description: "Complete home office setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "Conference Room Kit",
    code: "KIT-CONF-001",
    description: "Conference room equipment bundle",
    items: [
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
  {
    name: "Executive Kit",
    code: "KIT-EXEC-001",
    description: "Premium executive setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
] as const;

// ==============================================
// Configuration Item Classes
// ==============================================

export const CI_CLASS_DATA = [
  "Server",
  "Network Device",
  "Storage System",
  "Database",
  "Application",
  "Service",
  "Virtual Machine",
  "Cloud Resource",
] as const;

// ==============================================
// CMDB Relationship Types
// ==============================================

export const RELATIONSHIP_TYPE_DATA = [
  {
    name: "Depends On",
    code: "DEPENDS_ON",
    description: "Source depends on target for operation",
    reverseCode: "REQUIRED_BY",
    reverseName: "Required By",
    isImpacting: true,
  },
  {
    name: "Runs On",
    code: "RUNS_ON",
    description: "Source runs on target infrastructure",
    reverseCode: "HOSTS",
    reverseName: "Hosts",
    isImpacting: true,
  },
  {
    name: "Connects To",
    code: "CONNECTS_TO",
    description: "Source connects to target",
    reverseCode: "CONNECTED_BY",
    reverseName: "Connected By",
    isImpacting: false,
  },
  {
    name: "Uses",
    code: "USES",
    description: "Source uses target service/resource",
    reverseCode: "USED_BY",
    reverseName: "Used By",
    isImpacting: true,
  },
  {
    name: "Contains",
    code: "CONTAINS",
    description: "Source contains target component",
    reverseCode: "PART_OF",
    reverseName: "Part Of",
    isImpacting: true,
  },
  {
    name: "Monitors",
    code: "MONITORS",
    description: "Source monitors target",
    reverseCode: "MONITORED_BY",
    reverseName: "Monitored By",
    isImpacting: false,
  },
  {
    name: "Backs Up",
    code: "BACKS_UP",
    description: "Source backs up target",
    reverseCode: "BACKED_UP_BY",
    reverseName: "Backed Up By",
    isImpacting: false,
  },
  {
    name: "Provides Service To",
    code: "PROVIDES_TO",
    description: "Source provides service to target",
    reverseCode: "RECEIVES_FROM",
    reverseName: "Receives Service From",
    isImpacting: true,
  },
] as const;

// ==============================================
// Disposal Reasons
// ==============================================

// ==============================================
// Disposal Types and Statuses
// ==============================================

export const DISPOSAL_TYPES = {
  DONATION: "DONATION",
  SALE: "SALE",
  RECYCLING: "RECYCLING",
  DESTRUCTION: "DESTRUCTION",
  OTHER: "OTHER",
} as const;

export const DISPOSAL_STATUSES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const DISPOSAL_REASONS = [
  "End of useful life - hardware failure",
  "Obsolete technology - no longer supported",
  "Upgrade to newer model",
  "Excessive repair costs",
  "Security compliance requirement",
  "Lease return",
  "Damaged beyond repair",
  "No longer needed - organizational change",
] as const;

// ==============================================
// Asset Kit Types
// ==============================================

export const KIT_TYPES = {
  NEW_HIRE: "NEW_HIRE",
  CONTRACTOR: "CONTRACTOR",
  EXECUTIVE: "EXECUTIVE",
  PROJECT: "PROJECT",
  TEMPORARY: "TEMPORARY",
  OTHER: "OTHER",
} as const;

// ==============================================
// Reservation Purposes
// ==============================================

export const RESERVATION_PURPOSES = [
  "Business travel - conference attendance",
  "Temporary project assignment",
  "Equipment testing and evaluation",
  "Training session",
  "Backup equipment during maintenance",
  "Short-term contractor use",
  "Department demo and presentation",
  "Capacity planning - load testing",
] as const;

// ==============================================
// Attachment Types
// ==============================================

export const ATTACHMENT_TYPES = [
  {
    name: "Invoice",
    code: "ATT-INV",
    description: "Financial invoices and billing documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Certificate",
    code: "ATT-CERT",
    description: "Certificates of authenticity, compliance, and completion",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Photo",
    code: "ATT-PHOTO",
    description: "Asset photos and visual documentation",
    allowedExtensions: ["jpg", "jpeg", "png", "heic"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Document",
    code: "ATT-DOC",
    description: "General documents and text files",
    allowedExtensions: ["pdf", "doc", "docx"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "Spreadsheet",
    code: "ATT-SHEET",
    description: "Spreadsheets and data tables",
    allowedExtensions: ["xls", "xlsx", "csv"],
    maxFileSizeMB: 15,
    isActive: true,
  },
  {
    name: "Warranty Document",
    code: "ATT-WARR",
    description: "Warranty certificates and terms documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Disposal Certificate",
    code: "ATT-DISP",
    description: "Asset disposal and sanitization certificates",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Audit Report",
    code: "ATT-AUDIT",
    description: "Compliance and internal audit reports",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "License Agreement",
    code: "ATT-LIC",
    description: "Software license agreements and terms",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Network Diagram",
    code: "ATT-NET",
    description: "Network topology diagrams and architecture documents",
    allowedExtensions: ["pdf", "png", "svg"],
    maxFileSizeMB: 10,
    isActive: true,
  },
] as const;

// ==============================================
// Governance: Data Domains
// ==============================================

export const DATA_DOMAINS = [
  {
    name: "Customer PII",
    code: "DD-CPII",
    description:
      "Personal Identifiable Information of customers including names, contact details, IDs, and financial data. Critical for SAMA compliance.",
    isActive: true,
  },
  {
    name: "Financial Transactions",
    code: "DD-FIN",
    description:
      "Payment processing, transfers, account balances, transaction history. Subject to SAMA audit requirements.",
    isActive: true,
  },
  {
    name: "Payment Card Data",
    code: "DD-PCI",
    description:
      "Credit/debit card numbers, CVV, and cardholder data. Must comply with PCI-DSS standards.",
    isActive: true,
  },
  {
    name: "Employee Data",
    code: "DD-EMP",
    description:
      "Employee personal information, HR records, payroll data. Protected under labor regulations.",
    isActive: true,
  },
  {
    name: "System Logs",
    code: "DD-LOGS",
    description:
      "Application logs, access logs, audit trails. Required for regulatory compliance and security monitoring.",
    isActive: true,
  },
] as const;

// ==============================================
// Governance: Data Ownerships
// ==============================================

export const DATA_OWNERSHIPS = [
  {
    dataDomainCode: "DD-CPII",
    targetType: "CI_CLASS" as const,
    ciClassName: "Server",
    ownerType: "PERSON" as const,
    ownerEmail: "[email protected]", // Security Analyst
    note: "Security team owns customer PII stored on servers",
  },
  {
    dataDomainCode: "DD-FIN",
    targetType: "CI_CLASS" as const,
    ciClassName: "Database",
    ownerType: "ORG_UNIT" as const,
    ownerOrgUnitCode: "FIN",
    note: "Finance department owns financial transaction databases",
  },
  {
    dataDomainCode: "DD-PCI",
    targetType: "CI_CLASS" as const,
    ciClassName: "Application",
    ownerType: "PERSON" as const,
    ownerEmail: "[email protected]", // Security Engineer
    note: "Security engineer responsible for payment gateway applications",
  },
  {
    dataDomainCode: "DD-EMP",
    targetType: "ASSET_CATEGORY" as const,
    assetCategoryCode: "SERVER",
    ownerType: "ORG_UNIT" as const,
    ownerOrgUnitCode: "OPS",
    note: "Operations team manages HR system servers",
  },
  {
    dataDomainCode: "DD-LOGS",
    targetType: "CI_CLASS" as const,
    ciClassName: "Service",
    ownerType: "PERSON" as const,
    ownerEmail: "[email protected]", // Systems Administrator
    note: "Operations team maintains logging and monitoring services",
  },
  {
    dataDomainCode: "DD-CPII",
    targetType: "ASSET_CATEGORY" as const,
    assetCategoryCode: "LAPTOP",
    ownerType: "PERSON" as const,
    ownerEmail: "[email protected]", // IT Manager
    note: "IT Manager oversees laptop encryption for customer data protection",
  },
] as const;

// ==============================================
// Governance: Verification Campaigns
// ==============================================

export const VERIFICATION_CAMPAIGNS = [
  {
    name: "Q1 2025 Server Infrastructure Verification",
    description:
      "Quarterly verification campaign to ensure all production servers comply with SAMA security requirements. Verify configuration, patching status, and data ownership.",
    targetType: "CI" as const,
    scheduledStartDaysFromNow: -14, // Started 2 weeks ago
    scheduledEndDaysFromNow: 14, // Ends 2 weeks from now
    creatorEmail: "[email protected]", // IT Manager
  },
  {
    name: "Annual Asset Compliance Audit 2025",
    description:
      "Annual comprehensive audit of all IT assets for regulatory compliance. Verify asset ownership, location accuracy, and data classification.",
    targetType: "ASSET" as const,
    scheduledStartDaysFromNow: -7, // Started last week
    scheduledEndDaysFromNow: 21, // Ends in 3 weeks
    creatorEmail: "[email protected]", // Compliance Officer
  },
  {
    name: "PCI-DSS Quarterly Review Q1 2025",
    description:
      "Quarterly PCI-DSS compliance review for payment systems. Verify encryption, access controls, and logging requirements.",
    targetType: "CI" as const,
    scheduledStartDaysFromNow: 7, // Starts next week
    scheduledEndDaysFromNow: 28, // Ends in 4 weeks
    creatorEmail: "[email protected]", // Security Engineer
  },
] as const;

// ==============================================
// Export Everything
// ==============================================

export const SEED_CONFIG = {
  QUANTITIES: SEED_QUANTITIES,
  VENDORS: VENDOR_DATA,
  LOCATIONS: LOCATION_DATA,
  ORG_UNITS: ORG_UNIT_DATA,
  PERSONS: PERSON_DATA,
  LIFECYCLE_STATUSES: LIFECYCLE_STATUS_DATA,
  ASSET_CATEGORIES: ASSET_CATEGORY_DATA,
  ASSET_MODELS: ASSET_MODEL_DATA,
  WARRANTY_CONFIG,
  MAINTENANCE_TEMPLATES,
  ASSET_KIT_TEMPLATES,
  CI_CLASSES: CI_CLASS_DATA,
  RELATIONSHIP_TYPES: RELATIONSHIP_TYPE_DATA,
  DISPOSAL_TYPES,
  DISPOSAL_STATUSES,
  DISPOSAL_REASONS,
  KIT_TYPES,
  RESERVATION_PURPOSES,
  ATTACHMENT_TYPES,
  DATA_DOMAINS,
  DATA_OWNERSHIPS,
  VERIFICATION_CAMPAIGNS,
} as const;
