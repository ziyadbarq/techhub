/**
 * Microsoft Graph Data Normalization
 *
 * Maps messy, inconsistent Microsoft Graph data (department, office, etc.)
 * to standardized codes used in the Barq system. This handles:
 * - Typos and misspellings from AD data
 * - Trailing spaces and whitespace
 * - Variations in naming conventions
 * - Automatic role assignment based on department/title
 *
 * Email Domain Filtering:
 * - Only syncs users with @barq.com or @barraq.com.sa domains
 */

// ==============================================
// Valid Email Domains for Sync
// ==============================================

/**
 * Only users with these email domains will be synced
 */
export const VALID_EMAIL_DOMAINS = ["barq.com", "barraq.com.sa"] as const;

/**
 * Check if an email should be synced based on domain
 */
export function isValidEmailDomain(email: string | null): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return VALID_EMAIL_DOMAINS.some((validDomain) => domain === validDomain);
}

// ==============================================
// Department Normalization Map
// ==============================================

/**
 * Maps messy Graph department values to standardized OrgUnit codes.
 * Keys are lowercase for case-insensitive matching.
 * Handles typos, trailing spaces, and variations.
 */
export const DEPARTMENT_NORMALIZATION_MAP: Record<string, string> = {
  // Executive Office
  "ceo office": "EXEC",
  "board of directors": "EXEC",
  board: "EXEC",
  executive: "EXEC",
  "executive office": "EXEC",
  "strategy & growth": "STRAT",
  "strategy and growth": "STRAT",
  strategy: "STRAT",
  growth: "STRAT",

  // Technology Division
  technology: "TECH",
  "technology ": "TECH",
  technologe: "TECH",
  technololgy: "TECH",
  tech: "TECH",
  it: "TECH",

  // Engineering
  engineering: "ENG",
  engineer: "ENG",
  engineers: "ENG",
  "software engineering": "ENG",

  // DevOps
  devops: "DEVOPS",
  "devops ": "DEVOPS",
  "dev ops": "DEVOPS",
  infrastructure: "DEVOPS",
  "devops & infrastructure": "DEVOPS",

  // Cybersecurity
  cybersecurity: "CYBERSEC",
  "cybersecurity ": "CYBERSEC",
  "cyber security": "CYBERSEC",
  "cyber ": "CYBERSEC",
  cyber: "CYBERSEC",
  "information security": "CYBERSEC",
  infosec: "CYBERSEC",

  // Data & Analytics
  data: "DATA",
  "data ": "DATA",
  "data & analytics": "DATA",
  "data and analytics": "DATA",
  "data science": "DATA",
  "data science analytics": "DATA",
  analytics: "DATA",
  bi: "DATA",
  "business intelligence": "DATA",

  // Product
  product: "PRODUCT",
  "product ": "PRODUCT",
  "product factory": "PRODUCT",
  "product management": "PRODUCT",

  // Business Continuity Management (under Tech)
  "business continuity management": "BCM",
  bcm: "BCM",
  "business continuity": "BCM",

  // Finance Division
  finance: "FIN",
  "finance ": "FIN",
  financial: "FIN",

  // Financial Control & Reconciliation
  "financial control & reconciliation": "FCR",
  "financial control": "FCR",
  fcr: "FCR",
  reconciliation: "FCR",

  // Accounting
  accounting: "ACCT",
  "accounting ": "ACCT",
  accounts: "ACCT",

  // Procurement & Administration
  "procurement & administration": "PROC",
  procurement: "PROC",
  "procurement ": "PROC",
  administration: "PROC",
  admin: "PROC",
  "payroll & hc operations": "PROC",
  payroll: "PROC",

  // Risk & Compliance Division
  "risk & compliance": "RISK-COMP",
  "risk and compliance": "RISK-COMP",

  // Compliance
  compliance: "COMP",
  "compliance ": "COMP",
  complaince: "COMP",
  "compliance\t": "COMP",
  "regulatory compliance": "COMP",
  "compliance assurance": "COMP",

  // AML & CTF
  "aml & ctf": "AML",
  aml: "AML",
  "aml ": "AML",
  ctf: "AML",
  "anti-money laundering": "AML",
  "anti money laundering": "AML",

  // Anti-Fraud
  "anti fraud, bribery & corruption": "FRAUD",
  "anti-fraud monitoring": "FRAUD",
  "anti-fraud": "FRAUD",
  "anti fraud": "FRAUD",
  fraud: "FRAUD",
  "fraud ": "FRAUD",
  "bribery & corruption": "FRAUD",

  // Sanctions
  sanctions: "SANCT",
  "sanctions ": "SANCT",
  sanction: "SANCT",

  // Risk Management
  risk: "RISK",
  "risk ": "RISK",
  "risk management": "RISK",
  "risk management ": "RISK",
  "enterprise risk": "RISK",

  // Internal Audit
  "internal audit": "AUDIT",
  "internal audit ": "AUDIT",
  audit: "AUDIT",
  "corporate audit": "AUDIT",

  // SAMA Affairs
  "sama affairs & compliance assurance": "SAMA",
  "sama affairs": "SAMA",
  sama: "SAMA",

  // Self-Supervisory Unit
  "self-supervisory unit": "SSU",
  "self supervisory unit": "SSU",
  ssu: "SSU",

  // Business Division
  business: "BIZ",
  "business ": "BIZ",
  commercial: "BIZ",

  // Corporate & Partnerships
  "corporate & partnerships": "CORP",
  corporate: "CORP",
  "corporate ": "CORP",
  partnerships: "CORP",

  // Acquiring
  acquiring: "ACQ",
  "acquiring ": "ACQ",
  "merchant acquiring": "ACQ",

  // Cards
  cards: "CARDS",
  "cards ": "CARDS",
  card: "CARDS",
  "card services": "CARDS",

  // Remittance
  remittance: "REMIT",
  "remittance ": "REMIT",
  "remittance & international partnership": "REMIT",
  "international partnership": "REMIT",

  // Loyalty & Gaming
  "loyalty & gaming": "LOYALTY",
  loyalty: "LOYALTY",
  "loyalty ": "LOYALTY",
  gaming: "LOYALTY",

  // Operations Division
  operations: "OPS",
  "operations ": "OPS",
  ops: "OPS",

  // Contact Center
  "contact center": "CC",
  "contact center ": "CC",
  "contact center  ": "CC",
  "contact center   ": "CC",
  contactcenter: "CC",
  "call center": "CC",

  // Customer Experience
  "customer experience": "CX",
  "customer experience ": "CX",
  cx: "CX",
  "customer success": "CX",

  // Payment Operations
  "payment operation control": "PAY-OPS",
  "payment operations": "PAY-OPS",
  "payment ops": "PAY-OPS",
  "pay-ops": "PAY-OPS",

  // People & Culture Division
  "people & culture": "HR",
  "people and culture": "HR",
  "human resources": "HR",
  hr: "HR",

  // Human Capital
  "human capital": "HC",
  "human capital ": "HC",
  hc: "HC",
  "organizational development": "HC",

  // Talent Acquisition
  "talent acquisition": "TA",
  "talent acquisition ": "TA",
  ta: "TA",
  recruitment: "TA",
  recruiting: "TA",

  // Marketing & Communications
  "marcom & engagement": "MARCOM",
  marcom: "MARCOM",
  marketing: "MARCOM",
  "marketing ": "MARCOM",
  communications: "MARCOM",
  "marketing & communications": "MARCOM",

  // Vendor (special case for external contractors)
  vendor: "VENDOR",
  "vendor ": "VENDOR",
  virtuos: "VENDOR",
  sas: "VENDOR",
  contractor: "VENDOR",
  external: "VENDOR",
} as const;

// ==============================================
// Office Location Normalization Map
// ==============================================

/**
 * Maps messy Graph officeLocation values to standardized Location codes.
 * Keys are lowercase for case-insensitive matching.
 */
export const OFFICE_NORMALIZATION_MAP: Record<string, string> = {
  // Riyadh Headquarters
  riyadh: "RUH-HQ",
  "riyadh ": "RUH-HQ",
  ruh: "RUH-HQ",
  headquarters: "RUH-HQ",
  hq: "RUH-HQ",
  "head office": "RUH-HQ",

  // India Office
  india: "IND-OFF",
  "india ": "IND-OFF",
  "india office": "IND-OFF",
  ind: "IND-OFF",

  // Contact Center (internal)
  "contact center": "CC-INT",
  "contact center ": "CC-INT",
  cc: "CC-INT",

  // Remote - Saudi Arabia
  sa: "SA-REMOTE",
  "sa ": "SA-REMOTE",
  remote: "SA-REMOTE",
  "remote ": "SA-REMOTE",
  wfh: "SA-REMOTE",
  "work from home": "SA-REMOTE",

  // Vendor locations (mapped to Remote)
  virtuos: "REMOTE",
  sas: "REMOTE",
  vendor: "REMOTE",

  // Empty/blank → Remote
  "": "REMOTE",
} as const;

// ==============================================
// Role Mapping
// ==============================================

/**
 * Maps normalized department codes to role names.
 * Used for automatic role assignment during sync.
 */
export const DEPARTMENT_ROLE_MAP: Record<string, string> = {
  // Risk & Compliance Division → auditor
  COMP: "auditor",
  AML: "auditor",
  FRAUD: "auditor",
  SANCT: "auditor",
  RISK: "auditor",
  AUDIT: "auditor",
  SAMA: "auditor",
  SSU: "auditor",
  "RISK-COMP": "auditor",

  // Technology Division
  TECH: "service-owner",
  CYBERSEC: "security-officer",
  DATA: "data-steward",
  ENG: "service-owner",
  DEVOPS: "service-owner",
  PRODUCT: "service-owner",
  BCM: "service-owner",

  // Finance Division
  FIN: "finance-manager",
  FCR: "finance-manager",
  ACCT: "finance-manager",
  PROC: "finance-manager",

  // Operations Division → viewer
  OPS: "viewer",
  CC: "viewer",
  CX: "viewer",
  "PAY-OPS": "viewer",

  // HR/People Division → hr-manager
  HR: "hr-manager",
  HC: "hr-manager",
  TA: "hr-manager",
  MARCOM: "hr-manager",

  // Business Division → viewer
  BIZ: "viewer",
  CORP: "viewer",
  ACQ: "viewer",
  CARDS: "viewer",
  REMIT: "viewer",
  LOYALTY: "viewer",

  // Executive → viewer (no special system permissions)
  EXEC: "viewer",
  STRAT: "viewer",

  // Vendor → viewer
  VENDOR: "viewer",
} as const;

/**
 * Title-based role overrides (higher priority than department).
 * Checked first before department mapping.
 */
export const TITLE_ROLE_OVERRIDES: ReadonlyArray<{
  pattern: RegExp;
  role: string;
}> = [
  // C-level executives
  { pattern: /\b(ciso|chief.*security.*officer)\b/i, role: "security-officer" },
  {
    pattern: /\b(cto|chief.*technology.*officer)\b/i,
    role: "system-administrator",
  },
  { pattern: /\b(cfo|chief.*financial.*officer)\b/i, role: "finance-manager" },
  { pattern: /\b(cro|chief.*risk.*officer)\b/i, role: "auditor" },
  { pattern: /\b(cco|chief.*compliance.*officer)\b/i, role: "auditor" },

  // Head/Director level
  { pattern: /\b(head.*audit|director.*audit)\b/i, role: "auditor" },
  { pattern: /\b(head.*compliance|director.*compliance)\b/i, role: "auditor" },
  {
    pattern: /\b(head.*security|director.*security)\b/i,
    role: "security-officer",
  },
  { pattern: /\b(head.*data|director.*data)\b/i, role: "data-steward" },

  // Specialist roles
  { pattern: /\b(data.*steward|data.*governance)\b/i, role: "data-steward" },
  { pattern: /\b(asset.*manager|asset.*coord)/i, role: "asset-coordinator" },
  { pattern: /\b(inventory.*manager)\b/i, role: "inventory-manager" },
  {
    pattern: /\b(maintenance.*tech|repair.*tech)\b/i,
    role: "maintenance-technician",
  },
  { pattern: /\b(service.*manager|service.*owner)\b/i, role: "service-owner" },
] as const;

// ==============================================
// Normalization Functions
// ==============================================

/**
 * Normalize a department value from Microsoft Graph to OrgUnit code.
 *
 * @param dept - Raw department string from Graph API
 * @returns Normalized department code, or null if no match found
 */
export function normalizeDepartment(dept: string | null): string | null {
  if (!dept) return null;

  // Normalize: lowercase, trim, collapse whitespace
  const normalized = dept.toLowerCase().trim().replace(/\s+/g, " ");

  // Direct match first
  if (DEPARTMENT_NORMALIZATION_MAP[normalized]) {
    return DEPARTMENT_NORMALIZATION_MAP[normalized];
  }

  // Try without trailing spaces (common AD issue)
  const trimmed = normalized.trimEnd();
  if (DEPARTMENT_NORMALIZATION_MAP[trimmed]) {
    return DEPARTMENT_NORMALIZATION_MAP[trimmed];
  }

  // No match found - return null (will use default)
  return null;
}

/**
 * Normalize an office location value from Microsoft Graph to Location code.
 *
 * @param office - Raw officeLocation string from Graph API
 * @returns Normalized location code, or null if no match found
 */
export function normalizeOffice(office: string | null): string | null {
  if (office === null || office === undefined) {
    // Null/undefined → REMOTE
    return "REMOTE";
  }

  // Normalize: lowercase, trim
  const normalized = office.toLowerCase().trim();

  // Empty string → REMOTE
  if (normalized === "") {
    return "REMOTE";
  }

  // Direct match
  if (OFFICE_NORMALIZATION_MAP[normalized]) {
    return OFFICE_NORMALIZATION_MAP[normalized];
  }

  // No match found - default to RUH-HQ (most employees are in Riyadh)
  return "RUH-HQ";
}

/**
 * Determine the appropriate role based on normalized department and job title.
 * Title takes precedence over department.
 *
 * @param normalizedDeptCode - Normalized department code (from normalizeDepartment)
 * @param title - Raw job title from Graph API
 * @returns Role name to assign
 */
export function determineRoleFromDeptTitle(
  normalizedDeptCode: string | null,
  title: string | null,
): string {
  // First check title overrides (higher priority)
  if (title) {
    for (const override of TITLE_ROLE_OVERRIDES) {
      if (override.pattern.test(title)) {
        return override.role;
      }
    }
  }

  // Then check department mapping
  if (normalizedDeptCode && DEPARTMENT_ROLE_MAP[normalizedDeptCode]) {
    return DEPARTMENT_ROLE_MAP[normalizedDeptCode];
  }

  // Default to viewer
  return "viewer";
}
