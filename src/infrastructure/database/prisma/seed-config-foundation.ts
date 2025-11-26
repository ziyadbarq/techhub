/**
 * Foundation Layer Seed Configuration - Vendors, Locations, OrgUnits, Persons, Lifecycle
 */

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
// Location Data (Barq Actual Locations)
// ==============================================

export const LOCATION_DATA = [
  {
    name: "Riyadh Headquarters",
    code: "RUH-HQ",
    city: "Riyadh",
    country: "Saudi Arabia",
    locationType: "BUILDING" as const,
  },
  {
    name: "India Office",
    code: "IND-OFF",
    city: "Various",
    country: "India",
    locationType: "BUILDING" as const,
  },
  {
    name: "Contact Center",
    code: "CC-INT",
    city: "Riyadh",
    country: "Saudi Arabia",
    locationType: "BUILDING" as const,
  },
  {
    name: "Remote - Saudi Arabia",
    code: "SA-REMOTE",
    city: "Various",
    country: "Saudi Arabia",
    locationType: "LOGICAL" as const,
  },
  {
    name: "Remote - General",
    code: "REMOTE",
    city: "Various",
    country: "Various",
    locationType: "LOGICAL" as const,
  },
] as const;

// ==============================================
// Vendor Contact Data
// ==============================================
// Vendor contacts are not seeded - add real contacts via UI or data import

export const VENDOR_CONTACT_DATA = [] as const;

// ==============================================
// Organization Unit Data (Barq Actual Structure)
// ==============================================

export const ORG_UNIT_DATA = [
  // Level 1: Company
  {
    name: "Barq",
    code: "BARQ",
    description: "Barq Financial Services",
    unitType: "COMPANY" as const,
  },

  // Level 2: Divisions
  {
    name: "Executive Office",
    code: "EXEC",
    parentCode: "BARQ",
    description: "CEO Office & Board of Directors",
    unitType: "DIVISION" as const,
  },
  {
    name: "Strategy & Growth",
    code: "STRAT",
    parentCode: "BARQ",
    description: "Strategic planning and business growth",
    unitType: "DIVISION" as const,
  },
  {
    name: "Technology",
    code: "TECH",
    parentCode: "BARQ",
    description: "Technology and IT operations",
    unitType: "DIVISION" as const,
  },
  {
    name: "Finance",
    code: "FIN",
    parentCode: "BARQ",
    description: "Finance and accounting operations",
    unitType: "DIVISION" as const,
  },
  {
    name: "Risk & Compliance",
    code: "RISK-COMP",
    parentCode: "BARQ",
    description: "Risk management and regulatory compliance",
    unitType: "DIVISION" as const,
  },
  {
    name: "Business",
    code: "BIZ",
    parentCode: "BARQ",
    description: "Business and commercial operations",
    unitType: "DIVISION" as const,
  },
  {
    name: "Operations",
    code: "OPS",
    parentCode: "BARQ",
    description: "Customer operations and support",
    unitType: "DIVISION" as const,
  },
  {
    name: "People & Culture",
    code: "HR",
    parentCode: "BARQ",
    description: "Human resources and talent management",
    unitType: "DIVISION" as const,
  },

  // Level 3: Technology Departments
  {
    name: "Engineering",
    code: "ENG",
    parentCode: "TECH",
    description: "Software and platform engineering",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "DevOps & Infrastructure",
    code: "DEVOPS",
    parentCode: "TECH",
    description: "DevOps, infrastructure, and cloud operations",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Cybersecurity",
    code: "CYBERSEC",
    parentCode: "TECH",
    description: "Information security and cybersecurity",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Data & Analytics",
    code: "DATA",
    parentCode: "TECH",
    description: "Data science and business intelligence",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Product",
    code: "PRODUCT",
    parentCode: "TECH",
    description: "Product management and product factory",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Business Continuity Management",
    code: "BCM",
    parentCode: "TECH",
    description: "Business continuity and disaster recovery",
    unitType: "DEPARTMENT" as const,
  },

  // Level 3: Finance Departments
  {
    name: "Financial Control & Reconciliation",
    code: "FCR",
    parentCode: "FIN",
    description: "Financial control and reconciliation",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Accounting",
    code: "ACCT",
    parentCode: "FIN",
    description: "General accounting and financial reporting",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Procurement & Administration",
    code: "PROC",
    parentCode: "FIN",
    description: "Procurement, payroll, and administration",
    unitType: "DEPARTMENT" as const,
  },

  // Level 3: Risk & Compliance Departments
  {
    name: "Compliance",
    code: "COMP",
    parentCode: "RISK-COMP",
    description: "Regulatory compliance",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "AML & CTF",
    code: "AML",
    parentCode: "RISK-COMP",
    description: "Anti-money laundering and counter-terrorism financing",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Anti-Fraud",
    code: "FRAUD",
    parentCode: "RISK-COMP",
    description: "Fraud prevention, bribery, and corruption",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Sanctions",
    code: "SANCT",
    parentCode: "RISK-COMP",
    description: "Sanctions compliance",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Risk Management",
    code: "RISK",
    parentCode: "RISK-COMP",
    description: "Enterprise risk management",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Internal Audit",
    code: "AUDIT",
    parentCode: "RISK-COMP",
    description: "Internal and corporate audit",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "SAMA Affairs",
    code: "SAMA",
    parentCode: "RISK-COMP",
    description: "SAMA affairs and compliance assurance",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Self-Supervisory Unit",
    code: "SSU",
    parentCode: "RISK-COMP",
    description: "Self-supervisory compliance unit",
    unitType: "DEPARTMENT" as const,
  },

  // Level 3: Business Departments
  {
    name: "Corporate & Partnerships",
    code: "CORP",
    parentCode: "BIZ",
    description: "Corporate clients and partnerships",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Acquiring",
    code: "ACQ",
    parentCode: "BIZ",
    description: "Merchant acquiring",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Cards",
    code: "CARDS",
    parentCode: "BIZ",
    description: "Card products and services",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Remittance & International",
    code: "REMIT",
    parentCode: "BIZ",
    description: "Remittance and international partnerships",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Loyalty & Gaming",
    code: "LOYALTY",
    parentCode: "BIZ",
    description: "Loyalty programs and gaming services",
    unitType: "DEPARTMENT" as const,
  },

  // Level 3: Operations Departments
  {
    name: "Contact Center",
    code: "CC",
    parentCode: "OPS",
    description: "Customer contact center",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Customer Experience",
    code: "CX",
    parentCode: "OPS",
    description: "Customer experience and success",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Payment Operations",
    code: "PAY-OPS",
    parentCode: "OPS",
    description: "Payment operation control",
    unitType: "DEPARTMENT" as const,
  },

  // Level 3: People & Culture Departments
  {
    name: "Human Capital",
    code: "HC",
    parentCode: "HR",
    description: "HR operations and organizational development",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Talent Acquisition",
    code: "TA",
    parentCode: "HR",
    description: "Recruitment and talent acquisition",
    unitType: "DEPARTMENT" as const,
  },
  {
    name: "Marketing & Communications",
    code: "MARCOM",
    parentCode: "HR",
    description: "Marketing, communications, and engagement",
    unitType: "DEPARTMENT" as const,
  },

  // Special: Vendor (for external contractors)
  {
    name: "Vendor",
    code: "VENDOR",
    parentCode: "BARQ",
    description: "External vendors and contractors",
    unitType: "DIVISION" as const,
  },
] as const;

// ==============================================
// Person Data
// ==============================================
// Persons are synced from Microsoft Graph - no seed data needed.
// The first admin user is created via /register UI and promoted
// to system-administrator via Prisma Studio/SQL.
// All other users are synced from Microsoft Entra ID (Azure AD).

export const PERSON_DATA = [] as const;

// ==============================================
// Person Role Assignments
// ==============================================
// Role assignments happen automatically during Graph sync
// based on department and job title mapping.
// See src/lib/schemas/graph-normalization.ts for mapping logic.

export const PERSON_ROLE_ASSIGNMENTS = [] as const;

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
