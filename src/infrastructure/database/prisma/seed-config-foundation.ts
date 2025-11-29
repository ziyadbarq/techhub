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
  // ==============================================
  // Physical Locations
  // ==============================================
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

  // ==============================================
  // Remote/Logical Locations
  // ==============================================
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

  // ==============================================
  // Cloud Data Centers (OCI Regions)
  // ==============================================
  {
    name: "Oracle Cloud - Jeddah",
    code: "OCI-JEDDAH",
    city: "Jeddah",
    country: "Saudi Arabia",
    locationType: "DATA_CENTER" as const,
  },
  {
    name: "Oracle Cloud - Riyadh",
    code: "OCI-RIYADH",
    city: "Riyadh",
    country: "Saudi Arabia",
    locationType: "DATA_CENTER" as const,
  },
] as const;

// ==============================================
// Vendor Contact Data
// ==============================================
// Vendor contacts are not seeded - add real contacts via UI or data import

export const VENDOR_CONTACT_DATA = [] as const;

// ==============================================
// Organization Unit Data
// ==============================================
export { ORG_UNIT_DATA } from "./seed-config-org-units.js";

// ==============================================
// Person Data (Demo)
// ==============================================
// In production, persons are synced from Microsoft Graph.
// This demo data enables full seed without Graph sync.
// The first admin user is created via /register UI and promoted
// to system-administrator via Prisma Studio/SQL.

export const PERSON_DATA = [
  // ===========================================
  // Service Owners (matches seed-config-services-*.ts)
  // ===========================================

  // Technology Leadership
  {
    firstName: "Ahmed",
    lastName: "Al-Mansour",
    email: "ahmed.mansour@barq.sa",
    jobTitle: "Chief Technology Officer",
    orgUnitCode: "TECH",
    isActive: true,
  },
  // Software Engineering
  {
    firstName: "Khalid",
    lastName: "Al-Ghamdi",
    email: "khalid.ghamdi@barq.sa",
    jobTitle: "Senior Software Engineer",
    orgUnitCode: "TECH-SWE",
    isActive: true,
  },
  {
    firstName: "Hanan",
    lastName: "Al-Subai",
    email: "hanan.subai@barq.sa",
    jobTitle: "Software Engineer",
    orgUnitCode: "TECH-SWE",
    isActive: true,
  },
  {
    firstName: "Maha",
    lastName: "Al-Otaibi",
    email: "maha.otaibi@barq.sa",
    jobTitle: "Mobile Developer",
    orgUnitCode: "TECH-SWE",
    isActive: true,
  },
  // DevOps & Cloud
  {
    firstName: "Tariq",
    lastName: "Al-Shamrani",
    email: "tariq.shamrani@barq.sa",
    jobTitle: "DevOps Engineer",
    orgUnitCode: "TECH-DEVOPS",
    isActive: true,
  },
  {
    firstName: "Saud",
    lastName: "Al-Ajmi",
    email: "saud.ajmi@barq.sa",
    jobTitle: "Cloud Engineer",
    orgUnitCode: "TECH-DEVOPS",
    isActive: true,
  },
  // IT Support
  {
    firstName: "Fatima",
    lastName: "Al-Zahrani",
    email: "fatima.zahrani@barq.sa",
    jobTitle: "IT Support Specialist",
    orgUnitCode: "TECH-ITSUP",
    isActive: true,
  },
  // SRE & Infrastructure
  {
    firstName: "Mohammed",
    lastName: "Al-Qarni",
    email: "mohammed.qarni@barq.sa",
    jobTitle: "SRE Engineer",
    orgUnitCode: "TECH-SRE",
    isActive: true,
  },
  // Data & Analytics
  {
    firstName: "Abdullah",
    lastName: "Al-Harthi",
    email: "abdullah.harthi@barq.sa",
    jobTitle: "Data Engineer",
    orgUnitCode: "TECH-DATA",
    isActive: true,
  },
  // Product Management
  {
    firstName: "Layla",
    lastName: "Al-Dosari",
    email: "layla.dosari@barq.sa",
    jobTitle: "Product Manager",
    orgUnitCode: "TECH-PROD",
    isActive: true,
  },
  {
    firstName: "Faisal",
    lastName: "Al-Harbi",
    email: "faisal.harbi@barq.sa",
    jobTitle: "Technical Program Manager",
    orgUnitCode: "TECH-PROD",
    isActive: true,
  },

  // ===========================================
  // Cybersecurity Department
  // ===========================================
  {
    firstName: "Noura",
    lastName: "Al-Rashid",
    email: "noura.rashid@barq.sa",
    jobTitle: "Chief Information Security Officer",
    orgUnitCode: "SEC",
    isActive: true,
  },
  {
    firstName: "Omar",
    lastName: "Al-Shehri",
    email: "omar.shehri@barq.sa",
    jobTitle: "Security Architect",
    orgUnitCode: "SEC-SOC",
    isActive: true,
  },
  {
    firstName: "Aisha",
    lastName: "Al-Malki",
    email: "aisha.malki@barq.sa",
    jobTitle: "Security Analyst",
    orgUnitCode: "SEC-SOC",
    isActive: true,
  },

  // ===========================================
  // Other Departments
  // ===========================================
  // Marketing
  {
    firstName: "Sara",
    lastName: "Al-Mutairi",
    email: "sara.mutairi@barq.sa",
    jobTitle: "Marketing Manager",
    orgUnitCode: "MCX-MKT",
    isActive: true,
  },
  // HR
  {
    firstName: "Maryam",
    lastName: "Al-Otaibi",
    email: "maryam.otaibi@barq.sa",
    jobTitle: "HR Manager",
    orgUnitCode: "HR",
    isActive: true,
  },
  // Risk & Compliance
  {
    firstName: "Rania",
    lastName: "Al-Ghamdi",
    email: "rania.ghamdi@barq.sa",
    jobTitle: "Compliance Officer",
    orgUnitCode: "RISK",
    isActive: true,
  },
  // Operations
  {
    firstName: "Yusuf",
    lastName: "Al-Harbi",
    email: "yusuf.harbi@barq.sa",
    jobTitle: "Operations Manager",
    orgUnitCode: "OPS",
    isActive: true,
  },
  // Procurement
  {
    firstName: "Abdullah",
    lastName: "Al-Shammari",
    email: "abdullah.shammari@barq.sa",
    jobTitle: "Procurement Specialist",
    orgUnitCode: "PROC",
    isActive: true,
  },
  // Contact Center
  {
    firstName: "Hassan",
    lastName: "Al-Tamimi",
    email: "hassan.tamimi@barq.sa",
    jobTitle: "Contact Center Supervisor",
    orgUnitCode: "CC",
    isActive: true,
  },
  // Business & Partnerships
  {
    firstName: "Aisha",
    lastName: "Al-Sulaiman",
    email: "aisha.sulaiman@barq.sa",
    jobTitle: "Business Development Manager",
    orgUnitCode: "BIZ",
    isActive: true,
  },
] as const;

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
