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
  EXCHANGE_RATES: 14, // All supported currencies except SAR

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
  {
    name: "Oracle Corporation",
    code: "ORACLE",
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
// Service Management: Business Processes
// ==============================================

export const BUSINESS_PROCESS_DATA = [
  // Core Banking
  {
    code: "CORE_BANKING",
    name: "Core Banking Platform",
    description: "Central banking operations and account management",
    category: "Core Banking",
  },
  {
    code: "DIGITAL_PAYMENTS",
    name: "Digital Payments Processing",
    description: "Payment transaction processing and settlement",
    category: "Core Banking",
  },
  {
    code: "WALLET_SERVICES",
    name: "Digital Wallet Services",
    description: "Digital wallet creation and management",
    category: "Core Banking",
  },
  {
    code: "TRANSFER_SERVICES",
    name: "Transfer Services",
    description: "Money transfer and remittance operations",
    category: "Core Banking",
  },
  {
    code: "MERCHANT_SERVICES",
    name: "Merchant Services",
    description: "Merchant onboarding and payment acceptance",
    category: "Core Banking",
  },

  // Authentication & Security
  {
    code: "IDENTITY_MGMT",
    name: "Identity Management",
    description: "User authentication and identity services",
    category: "Security",
  },
  {
    code: "ACCESS_CONTROL",
    name: "Access Control",
    description: "Authorization and access management",
    category: "Security",
  },

  // Channels
  {
    code: "MOBILE_BANKING",
    name: "Mobile Banking",
    description: "Mobile application services for customers",
    category: "Channels",
  },
  {
    code: "WEB_BANKING",
    name: "Web Banking",
    description: "Web portal for customer and business banking",
    category: "Channels",
  },
  {
    code: "API_BANKING",
    name: "API Banking",
    description: "Open banking APIs for partners",
    category: "Channels",
  },

  // Infrastructure
  {
    code: "DATA_PLATFORM",
    name: "Data Platform",
    description: "Data storage, processing, and analytics",
    category: "Infrastructure",
  },
  {
    code: "MESSAGE_QUEUE",
    name: "Message Queue Services",
    description: "Asynchronous messaging and event streaming",
    category: "Infrastructure",
  },
  {
    code: "API_GATEWAY",
    name: "API Gateway",
    description: "API management and routing",
    category: "Infrastructure",
  },
  {
    code: "WORKFLOW_AUTOMATION",
    name: "Workflow Automation",
    description: "Business process automation and orchestration",
    category: "Infrastructure",
  },

  // Integration
  {
    code: "PAYMENT_INTEGRATION",
    name: "Payment Gateway Integration",
    description: "Integration with external payment providers",
    category: "Integration",
  },
  {
    code: "BANK_INTEGRATION",
    name: "Bank Integration",
    description: "Integration with banking partners",
    category: "Integration",
  },
  {
    code: "GOVT_INTEGRATION",
    name: "Government Services Integration",
    description: "Integration with government services and regulations",
    category: "Integration",
  },

  // Support Systems
  {
    code: "CRM_SERVICES",
    name: "Customer Relationship Management",
    description: "Customer support and relationship management",
    category: "Support",
  },
  {
    code: "ERP_SERVICES",
    name: "Enterprise Resource Planning",
    description: "Business operations and financial management",
    category: "Support",
  },
  {
    code: "REPORTING_ANALYTICS",
    name: "Reporting & Analytics",
    description: "Business intelligence and reporting",
    category: "Support",
  },

  // Monitoring & Operations
  {
    code: "MONITORING_OBSERVABILITY",
    name: "Monitoring & Observability",
    description: "System monitoring and observability",
    category: "Operations",
  },
  {
    code: "INCIDENT_MGMT",
    name: "Incident Management",
    description: "Incident response and problem management",
    category: "Operations",
  },
  {
    code: "DEPLOYMENT_CICD",
    name: "CI/CD Pipeline",
    description: "Continuous integration and deployment",
    category: "Operations",
  },

  // Compliance
  {
    code: "COMPLIANCE_AUDIT",
    name: "Compliance & Audit",
    description: "Regulatory compliance and audit logging",
    category: "Compliance",
  },
  {
    code: "DATA_PRIVACY",
    name: "Data Privacy & Protection",
    description: "Data privacy compliance and protection",
    category: "Compliance",
  },
] as const;

// ==============================================
// Service Management: Services
// ==============================================

export const SERVICE_DATA = [
  // Core Banking Services
  {
    name: "Core Wallet Service",
    serviceType: "APPLICATION" as const,
    description:
      "Central wallet management system handling digital wallet creation, balance management, and transaction processing",
    businessPurpose:
      "Enables digital wallet functionality for customers, core to Barq's payment services",
    gitlabRepoUrl: "https://gitlab.barq.com/core/wallet-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WALLET_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Jeddah",
      compartment: "prod-core-banking",
    },
  },
  {
    name: "Core Payments Service",
    serviceType: "APPLICATION" as const,
    description:
      "Payment processing engine for all transaction types (P2P, P2M, bill payments)",
    businessPurpose:
      "Processes all payment transactions with real-time validation and settlement",
    gitlabRepoUrl: "https://gitlab.barq.com/core/payments-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DIGITAL_PAYMENTS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-core-banking",
    },
  },
  {
    name: "Core Accounting Service",
    serviceType: "APPLICATION" as const,
    description:
      "Double-entry accounting system for all financial transactions and ledger management",
    businessPurpose:
      "Maintains accurate financial records and enables regulatory reporting",
    gitlabRepoUrl: "https://gitlab.barq.com/core/accounting-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "CORE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-core-banking",
    },
  },
  {
    name: "Merchant Service",
    serviceType: "APPLICATION" as const,
    description:
      "Merchant onboarding, KYB verification, and payment acceptance management",
    businessPurpose:
      "Enables merchants to accept digital payments from customers",
    gitlabRepoUrl: "https://gitlab.barq.com/core/merchant-service",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MERCHANT_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-merchant",
    },
  },

  // Authentication & Security
  {
    name: "Active Directory",
    serviceType: "APPLICATION" as const,
    description:
      "Microsoft Active Directory for employee authentication and directory services",
    businessPurpose: "Central employee identity and access management",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "MSFT",
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.1.10",
      hostname: "ad-dc01.barq.local",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Keycloak",
    serviceType: "APPLICATION" as const,
    description:
      "Open-source identity and access management for customer authentication",
    businessPurpose:
      "Provides SSO and identity federation for customer-facing applications",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/keycloak",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Auth Service",
    serviceType: "APPLICATION" as const,
    description:
      "Custom authentication service with OTP, biometric, and device fingerprinting",
    businessPurpose: "Multi-factor authentication for enhanced security",
    gitlabRepoUrl: "https://gitlab.barq.com/security/auth-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },

  // Channels - Mobile Apps
  {
    name: "Mobile iOS App",
    serviceType: "ENDPOINT" as const,
    description: "Barq customer mobile application for iOS platform",
    businessPurpose: "Primary customer channel for mobile banking services",
    gitlabRepoUrl: "https://gitlab.barq.com/mobile/ios-app",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Mobile Android App",
    serviceType: "ENDPOINT" as const,
    description: "Barq customer mobile application for Android platform",
    businessPurpose: "Primary customer channel for mobile banking services",
    gitlabRepoUrl: "https://gitlab.barq.com/mobile/android-app",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Business Portal",
    serviceType: "APPLICATION" as const,
    description: "Web portal for business customers and merchants",
    businessPurpose:
      "Self-service portal for business account management and reporting",
    gitlabRepoUrl: "https://gitlab.barq.com/web/business-portal",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WEB_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-channels",
    },
  },
  {
    name: "Customer Portal",
    serviceType: "APPLICATION" as const,
    description: "Web portal for individual customers",
    businessPurpose: "Web-based access to banking services for customers",
    gitlabRepoUrl: "https://gitlab.barq.com/web/customer-portal",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WEB_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-channels",
    },
  },

  // Infrastructure - Workflow & Automation
  {
    name: "Airflow",
    serviceType: "MIDDLEWARE" as const,
    description:
      "Apache Airflow for workflow orchestration and data pipeline management",
    businessPurpose:
      "Automates ETL jobs, reporting, and batch processing workflows",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/airflow",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WORKFLOW_AUTOMATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
    },
  },
  {
    name: "Redis Cluster",
    serviceType: "DATABASE" as const,
    description: "Redis cluster for caching and session management",
    businessPurpose:
      "High-performance caching to reduce database load and improve response times",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      ipAddress: "10.10.5.10",
    },
  },
  {
    name: "PostgreSQL Cluster",
    serviceType: "DATABASE" as const,
    description: "PostgreSQL database cluster for application data",
    businessPurpose:
      "Primary relational database for non-core banking applications",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Kafka Cluster",
    serviceType: "MIDDLEWARE" as const,
    description:
      "Apache Kafka for event streaming and real-time data pipelines",
    businessPurpose:
      "Enables real-time event processing and microservice communication",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/kafka",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "RabbitMQ",
    serviceType: "MIDDLEWARE" as const,
    description: "RabbitMQ message broker for async task processing",
    businessPurpose: "Handles background jobs and asynchronous processing",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/rabbitmq",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },

  // Third-party Integrations
  {
    name: "eMcREY Integration",
    serviceType: "API" as const,
    description: "Integration with eMcREY payment gateway for card processing",
    businessPurpose: "Enables credit/debit card payment acceptance",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "PAYMENT_INTEGRATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
  },
  {
    name: "HyperPay Integration",
    serviceType: "API" as const,
    description: "Integration with HyperPay for online payment processing",
    businessPurpose: "Alternative payment gateway for online transactions",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "PAYMENT_INTEGRATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Oracle CRM",
    serviceType: "APPLICATION" as const,
    description: "Oracle CRM system for customer relationship management",
    businessPurpose:
      "Manages customer interactions, support tickets, and sales pipeline",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "ORACLE",
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
    },
  },
  {
    name: "Odoo ERP",
    serviceType: "APPLICATION" as const,
    description: "Odoo ERP for business operations and financial management",
    businessPurpose:
      "Manages HR, procurement, inventory, and financial operations",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ERP_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },

  // Developer Tools
  {
    name: "Tyk API Gateway",
    serviceType: "MIDDLEWARE" as const,
    description: "API gateway for routing, rate limiting, and API management",
    businessPurpose: "Centralized API management and security enforcement",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/tyk",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-gateway",
    },
  },
  {
    name: "Unleash Feature Flags",
    serviceType: "APPLICATION" as const,
    description: "Feature flag management for gradual rollouts and A/B testing",
    businessPurpose: "Enables safe feature deployment and experimentation",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/unleash",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },
  {
    name: "Retool Internal Tools",
    serviceType: "APPLICATION" as const,
    description: "Low-code platform for building internal admin tools",
    businessPurpose: "Rapid development of internal dashboards and tools",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Faisal Al-Harbi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },
  {
    name: "Redash Analytics",
    serviceType: "APPLICATION" as const,
    description: "SQL-based analytics and visualization platform",
    businessPurpose: "Business intelligence and data exploration for analysts",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/redash",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-analytics",
    },
  },
  {
    name: "GitLab CI/CD",
    serviceType: "APPLICATION" as const,
    description: "GitLab for source control and CI/CD pipelines",
    businessPurpose: "Version control and automated deployment pipelines",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },

  // Databases
  {
    name: "Oracle Core DB",
    serviceType: "DATABASE" as const,
    description: "Oracle database for core banking system",
    businessPurpose:
      "Mission-critical database for all banking transactions and accounts",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "ORACLE",
    businessProcessCode: "CORE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "oracle-db01.barq.local",
      backupEnabled: true,
      backupSchedule: "hourly",
    },
  },
  {
    name: "MongoDB Cluster",
    serviceType: "DATABASE" as const,
    description: "MongoDB for document storage and analytics data",
    businessPurpose:
      "NoSQL database for flexible schema and analytics workloads",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/mongodb",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Elasticsearch Cluster",
    serviceType: "DATABASE" as const,
    description: "Elasticsearch for log aggregation and full-text search",
    businessPurpose: "Centralized logging and search capabilities",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/elasticsearch",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },

  // Cloud Services
  {
    name: "OCI Object Storage",
    serviceType: "STORAGE" as const,
    description:
      "Oracle Cloud Infrastructure object storage for files and backups",
    businessPurpose:
      "Scalable cloud storage for documents, images, and backups",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Jeddah",
      compartment: "prod-storage",
    },
  },
  {
    name: "GCP Cloud Storage",
    serviceType: "STORAGE" as const,
    description:
      "Google Cloud Storage for disaster recovery and analytics data",
    businessPurpose: "Secondary cloud storage for DR and data lake",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "GCP_CLOUD" as const,
      cloudProvider: "GCP",
      region: "europe-west3",
      project: "barq-prod-dr",
    },
  },
  {
    name: "OCI Load Balancer",
    serviceType: "NETWORK" as const,
    description: "OCI load balancing service for traffic distribution",
    businessPurpose:
      "High availability and traffic distribution for web services",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-network",
    },
  },

  // APIs
  {
    name: "Customer API",
    serviceType: "API" as const,
    description: "RESTful API for customer mobile and web applications",
    businessPurpose: "Primary API for customer-facing channels",
    gitlabRepoUrl: "https://gitlab.barq.com/api/customer-api",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Partner API",
    serviceType: "API" as const,
    description: "API for third-party integrations and partner access",
    businessPurpose: "Enables partner integrations and open banking APIs",
    gitlabRepoUrl: "https://gitlab.barq.com/api/partner-api",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Internal API",
    serviceType: "API" as const,
    description: "Internal API for microservice communication",
    businessPurpose:
      "Service-to-service communication and internal integrations",
    gitlabRepoUrl: "https://gitlab.barq.com/api/internal-api",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Webhook Service",
    serviceType: "API" as const,
    description: "Webhook delivery service for real-time event notifications",
    businessPurpose:
      "Sends event notifications to external systems and partners",
    gitlabRepoUrl: "https://gitlab.barq.com/api/webhook-service",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },

  // Middleware
  {
    name: "Message Broker",
    serviceType: "MIDDLEWARE" as const,
    description: "Central message broker for async communication",
    businessPurpose: "Decouples services and enables async processing",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/message-broker",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "Event Bus",
    serviceType: "MIDDLEWARE" as const,
    description: "Event-driven architecture bus for domain events",
    businessPurpose: "Enables event-driven microservices communication",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/event-bus",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "Service Mesh",
    serviceType: "NETWORK" as const,
    description: "Service mesh for microservice networking and observability",
    businessPurpose:
      "Provides service discovery, load balancing, and traffic management",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/service-mesh",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-network",
    },
  },

  // Monitoring & Observability
  {
    name: "Grafana",
    serviceType: "APPLICATION" as const,
    description: "Grafana for metrics visualization and dashboards",
    businessPurpose: "Real-time monitoring dashboards for system health",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/grafana",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Prometheus",
    serviceType: "APPLICATION" as const,
    description: "Prometheus for metrics collection and alerting",
    businessPurpose: "Collects and stores time-series metrics for monitoring",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/prometheus",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Jaeger Tracing",
    serviceType: "APPLICATION" as const,
    description: "Distributed tracing system for microservices",
    businessPurpose: "Traces requests across microservices for debugging",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/jaeger",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Sentry Error Tracking",
    serviceType: "APPLICATION" as const,
    description: "Sentry for application error tracking and reporting",
    businessPurpose:
      "Captures and tracks application errors for faster resolution",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/sentry",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "PagerDuty",
    serviceType: "APPLICATION" as const,
    description: "PagerDuty for incident management and on-call scheduling",
    businessPurpose: "Manages incident alerts and on-call rotations",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "INCIDENT_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
  },

  // Backup & DR
  {
    name: "Veeam Backup",
    serviceType: "APPLICATION" as const,
    description: "Veeam backup solution for VM and database backups",
    businessPurpose: "Enterprise backup and disaster recovery",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "veeam-backup01.barq.local",
    },
  },

  // Security & Compliance
  {
    name: "Vault Secrets Management",
    serviceType: "APPLICATION" as const,
    description: "HashiCorp Vault for secrets and encryption key management",
    businessPurpose: "Centralized secrets management and encryption",
    gitlabRepoUrl: "https://gitlab.barq.com/security/vault",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Splunk SIEM",
    serviceType: "APPLICATION" as const,
    description: "Splunk for security information and event management",
    businessPurpose: "Security monitoring and compliance reporting",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "COMPLIANCE_AUDIT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
    },
  },
  {
    name: "CyberArk PAM",
    serviceType: "APPLICATION" as const,
    description: "CyberArk Privileged Access Management",
    businessPurpose:
      "Manages and secures privileged access to critical systems",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "cyberark01.barq.local",
    },
  },

  // Testing & QA
  {
    name: "UAT Environment",
    serviceType: "SERVER" as const,
    description:
      "User Acceptance Testing environment for pre-production testing",
    businessPurpose:
      "Testing environment for validating changes before production",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "UAT" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Faisal Al-Harbi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "uat-environment",
    },
  },
  {
    name: "DR Environment",
    serviceType: "SERVER" as const,
    description: "Disaster Recovery environment for business continuity",
    businessPurpose: "Standby environment for disaster recovery scenarios",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "DR" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "GCP_CLOUD" as const,
      cloudProvider: "GCP",
      region: "europe-west3",
      project: "barq-dr",
    },
  },

  // Network Infrastructure
  {
    name: "Cisco Firewall",
    serviceType: "NETWORK" as const,
    description: "Cisco ASA firewall for network security",
    businessPurpose: "Network perimeter security and traffic filtering",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "CISCO",
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.1",
      hostname: "fw01.barq.local",
    },
  },
  {
    name: "VPN Gateway",
    serviceType: "NETWORK" as const,
    description: "VPN gateway for secure remote access",
    businessPurpose: "Enables secure remote access for employees",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.5",
      hostname: "vpn01.barq.local",
    },
  },
  {
    name: "DNS Server",
    serviceType: "NETWORK" as const,
    description: "Internal DNS server for name resolution",
    businessPurpose: "DNS resolution for internal services",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.1.53",
      hostname: "dns01.barq.local",
    },
  },

  // Communication & Collaboration
  {
    name: "Email Server",
    serviceType: "APPLICATION" as const,
    description: "Microsoft Exchange for corporate email",
    businessPurpose: "Internal and external email communication",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "MSFT",
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "exchange01.barq.local",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Slack",
    serviceType: "APPLICATION" as const,
    description: "Slack for team communication and collaboration",
    businessPurpose: "Real-time team communication platform",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Sara Al-Mutairi",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Jira",
    serviceType: "APPLICATION" as const,
    description: "Atlassian Jira for project management and issue tracking",
    businessPurpose: "Agile project management and task tracking",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "INCIDENT_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },
  {
    name: "Confluence",
    serviceType: "APPLICATION" as const,
    description: "Atlassian Confluence for documentation and knowledge base",
    businessPurpose: "Central documentation repository",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Sara Al-Mutairi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },

  // Data & Analytics
  {
    name: "Data Warehouse",
    serviceType: "DATABASE" as const,
    description: "Enterprise data warehouse for analytics and reporting",
    businessPurpose: "Centralized analytics platform for business intelligence",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-analytics",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "ETL Pipeline",
    serviceType: "MIDDLEWARE" as const,
    description: "Extract, Transform, Load pipeline for data integration",
    businessPurpose: "Moves data from operational systems to data warehouse",
    gitlabRepoUrl: "https://gitlab.barq.com/data/etl-pipeline",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
    },
  },

  // Notification Services
  {
    name: "SMS Gateway",
    serviceType: "API" as const,
    description: "SMS gateway for sending OTP and notifications",
    businessPurpose: "Delivers SMS notifications to customers",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Email Gateway",
    serviceType: "API" as const,
    description: "Email delivery service for customer notifications",
    businessPurpose: "Sends transactional emails to customers",
    gitlabRepoUrl: "https://gitlab.barq.com/api/email-gateway",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-notifications",
    },
  },
  {
    name: "Push Notification Service",
    serviceType: "API" as const,
    description: "Push notification service for mobile apps",
    businessPurpose: "Sends push notifications to mobile applications",
    gitlabRepoUrl: "https://gitlab.barq.com/api/push-notifications",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-notifications",
    },
  },

  // Fraud & Risk
  {
    name: "Fraud Detection Service",
    serviceType: "APPLICATION" as const,
    description: "Real-time fraud detection and risk scoring",
    businessPurpose: "Detects and prevents fraudulent transactions",
    gitlabRepoUrl: "https://gitlab.barq.com/security/fraud-detection",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DIGITAL_PAYMENTS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "AML Compliance Service",
    serviceType: "APPLICATION" as const,
    description: "Anti-Money Laundering monitoring and compliance",
    businessPurpose:
      "Monitors transactions for AML compliance and suspicious activity",
    gitlabRepoUrl: "https://gitlab.barq.com/compliance/aml-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "COMPLIANCE_AUDIT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-compliance",
    },
  },

  // KYC Services
  {
    name: "KYC Verification Service",
    serviceType: "APPLICATION" as const,
    description: "Know Your Customer verification and identity validation",
    businessPurpose: "Validates customer identity and performs KYC checks",
    gitlabRepoUrl: "https://gitlab.barq.com/compliance/kyc-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Aisha Al-Malki",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-compliance",
    },
  },
  {
    name: "ABSHER Integration",
    serviceType: "API" as const,
    description:
      "Integration with Saudi Arabia's ABSHER platform for identity verification",
    businessPurpose:
      "Validates Saudi national ID and verifies customer identity",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "GOVT_INTEGRATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
  },
  {
    name: "SAMA Reporting Service",
    serviceType: "APPLICATION" as const,
    description: "Regulatory reporting to Saudi Central Bank (SAMA)",
    businessPurpose:
      "Generates and submits mandatory regulatory reports to SAMA",
    gitlabRepoUrl: "https://gitlab.barq.com/compliance/sama-reporting",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "COMPLIANCE_AUDIT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-compliance",
    },
  },
// Exchange Rates (Multi-Currency Support)
// ==============================================

/**
 * Exchange rates to SAR (Saudi Riyal) - Base currency
 * Real approximate rates as of 2024 Q4
 * 1 CURRENCY = X SAR
 */
export const EXCHANGE_RATE_DATA = [
  { currency: "USD", rateToSAR: 3.75, isActive: true }, // US Dollar
  { currency: "EUR", rateToSAR: 4.08, isActive: true }, // Euro
  { currency: "GBP", rateToSAR: 4.75, isActive: true }, // British Pound
  { currency: "JPY", rateToSAR: 0.025, isActive: true }, // Japanese Yen
  { currency: "AUD", rateToSAR: 2.45, isActive: true }, // Australian Dollar
  { currency: "CAD", rateToSAR: 2.7, isActive: true }, // Canadian Dollar
  { currency: "CHF", rateToSAR: 4.2, isActive: true }, // Swiss Franc
  { currency: "CNY", rateToSAR: 0.52, isActive: true }, // Chinese Yuan
  { currency: "INR", rateToSAR: 0.045, isActive: true }, // Indian Rupee
  { currency: "AED", rateToSAR: 1.02, isActive: true }, // UAE Dirham
  { currency: "KWD", rateToSAR: 12.2, isActive: true }, // Kuwaiti Dinar
  { currency: "BHD", rateToSAR: 9.95, isActive: true }, // Bahraini Dinar
  { currency: "OMR", rateToSAR: 9.75, isActive: true }, // Omani Rial
  { currency: "QAR", rateToSAR: 1.03, isActive: true }, // Qatari Riyal
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
  EXCHANGE_RATES: EXCHANGE_RATE_DATA,
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
  BUSINESS_PROCESSES: BUSINESS_PROCESS_DATA,
  SERVICES: SERVICE_DATA,
} as const;
