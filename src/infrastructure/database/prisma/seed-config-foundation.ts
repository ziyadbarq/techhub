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
