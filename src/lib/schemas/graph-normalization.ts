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
 *
 * NEW STRUCTURE (4 levels):
 * - Level 2: Departments (EXEC, TECH, SEC, RISK, FIN, HR, etc.)
 * - Level 3: Sub-Departments (TECH-SWE, SEC-SOC, RISK-AML, etc.)
 *
 * IMPORTANT: Cybersecurity (SEC) is SEPARATE from Technology (TECH) - reports to CISO!
 */
export const DEPARTMENT_NORMALIZATION_MAP: Record<string, string> = {
  // ============================================
  // EXECUTIVE LEADERSHIP (EXEC)
  // ============================================
  "ceo office": "EXEC-CEO",
  "board of directors": "EXEC",
  board: "EXEC",
  executive: "EXEC",
  "executive office": "EXEC",
  "executive leadership": "EXEC",
  "chief of staff": "EXEC-COS",
  strategy: "EXEC-STRAT",
  "strategy & growth": "EXEC-STRAT",
  "strategy and growth": "EXEC-STRAT",

  // ============================================
  // INTERNAL AUDIT & OVERSIGHT (AUDIT)
  // ============================================
  "internal audit": "AUDIT-INT",
  "internal audit ": "AUDIT-INT",
  audit: "AUDIT",
  "corporate audit": "AUDIT-CORP",
  "it audit": "AUDIT-IT",
  "audit & oversight": "AUDIT",

  // ============================================
  // RISK & COMPLIANCE (RISK) - Reports to CRO
  // ============================================
  "risk & compliance": "RISK",
  "risk and compliance": "RISK",

  // Compliance
  compliance: "RISK-COMP",
  "compliance ": "RISK-COMP",
  complaince: "RISK-COMP",
  "compliance\t": "RISK-COMP",
  "regulatory compliance": "RISK-COMP",
  "compliance assurance": "RISK-COMP",

  // AML & CTF
  "aml & ctf": "RISK-AML",
  aml: "RISK-AML",
  "aml ": "RISK-AML",
  ctf: "RISK-AML",
  "anti-money laundering": "RISK-AML",
  "anti money laundering": "RISK-AML",

  // Anti-Fraud
  "anti fraud, bribery & corruption": "RISK-FRAUD",
  "anti-fraud monitoring": "RISK-FRAUD",
  "anti-fraud": "RISK-FRAUD",
  "anti fraud": "RISK-FRAUD",
  fraud: "RISK-FRAUD",
  "fraud ": "RISK-FRAUD",
  "bribery & corruption": "RISK-FRAUD",

  // Sanctions
  sanctions: "RISK-SANCT",
  "sanctions ": "RISK-SANCT",
  sanction: "RISK-SANCT",

  // Risk Management
  risk: "RISK-ERM",
  "risk ": "RISK-ERM",
  "risk management": "RISK-ERM",
  "risk management ": "RISK-ERM",
  "enterprise risk": "RISK-ERM",
  "operational risk": "RISK-ERM",

  // SAMA Affairs
  "sama affairs & compliance assurance": "RISK-SAMA",
  "sama affairs": "RISK-SAMA",
  sama: "RISK-SAMA",
  pdpl: "RISK-SAMA",

  // Self-Supervisory Unit
  "self-supervisory unit": "RISK-SSU",
  "self supervisory unit": "RISK-SSU",
  ssu: "RISK-SSU",

  // ============================================
  // FINANCE (FIN) - Reports to CFO
  // ============================================
  finance: "FIN",
  "finance ": "FIN",
  financial: "FIN",

  // Financial Planning & Analysis
  "financial planning & analysis": "FIN-FPA",
  "fp&a": "FIN-FPA",
  fpa: "FIN-FPA",
  budgeting: "FIN-FPA",

  // Financial Control & Reconciliation
  "financial control & reconciliation": "FIN-FCR",
  "financial control": "FIN-FCR",
  fcr: "FIN-FCR",
  reconciliation: "FIN-FCR",

  // Treasury
  treasury: "FIN-TREAS",
  "cash management": "FIN-TREAS",

  // Accounting
  accounting: "FIN-ACCT",
  "accounting ": "FIN-ACCT",
  accounts: "FIN-ACCT",
  "accounts payable": "FIN-ACCT",
  "accounts receivable": "FIN-ACCT",

  // ============================================
  // HUMAN CAPITAL (HR) - Reports to CHRO
  // ============================================
  "people & culture": "HR",
  "people and culture": "HR",
  "human resources": "HR",
  hr: "HR",
  "human capital": "HR",

  // HR Operations
  "hr operations": "HR-OPS",
  "hc operations": "HR-OPS",
  "human capital operations": "HR-OPS",
  "employee relations": "HR-OPS",

  // Talent Acquisition
  "talent acquisition": "HR-TA",
  "talent acquisition ": "HR-TA",
  ta: "HR-TA",
  recruitment: "HR-TA",
  recruiting: "HR-TA",

  // Organizational Development
  "organizational development": "HR-OD",
  "performance management": "HR-OD",
  "training & development": "HR-OD",
  "learning & development": "HR-OD",

  // Payroll
  "payroll & hc operations": "HR-PAY",
  payroll: "HR-PAY",
  "hr systems": "HR-PAY",

  // ============================================
  // MARKETING & CUSTOMER EXPERIENCE (MCX)
  // ============================================
  "marketing & customer experience": "MCX",
  "marcom & engagement": "MCX-MKT",
  marcom: "MCX-MKT",
  marketing: "MCX-MKT",
  "marketing ": "MCX-MKT",
  communications: "MCX-MKT",
  "marketing & communications": "MCX-MKT",
  "brand management": "MCX-MKT",
  "digital marketing": "MCX-MKT",

  // Customer Experience
  "customer experience": "MCX-CX",
  "customer experience ": "MCX-CX",
  cx: "MCX-CX",
  "customer success": "MCX-CX",
  "journey mapping": "MCX-CX",

  // ============================================
  // BUSINESS & PARTNERSHIPS (BIZ) - Reports to CBO
  // ============================================
  business: "BIZ",
  "business ": "BIZ",
  commercial: "BIZ",
  "business & partnerships": "BIZ",

  // Business Development
  "business development": "BIZ-BD",
  "regional operations": "BIZ-BD",

  // Partnerships
  partnerships: "BIZ-PART",
  "corporate & partnerships": "BIZ-PART",
  "merchant partnerships": "BIZ-PART",
  "corporate partnerships": "BIZ-PART",

  // Remittance
  remittance: "BIZ-REMIT",
  "remittance ": "BIZ-REMIT",
  "remittance & international partnership": "BIZ-REMIT",
  "international partnership": "BIZ-REMIT",
  "corridor operations": "BIZ-REMIT",

  // Growth
  growth: "BIZ-GROWTH",
  subsidiaries: "BIZ-GROWTH",

  // ============================================
  // OPERATIONS (OPS) - Reports to COO
  // ============================================
  operations: "OPS",
  "operations ": "OPS",
  ops: "OPS",

  // Operations Core
  "operations support": "OPS-CORE",
  "customer protection": "OPS-CORE",

  // Payment Operations
  "payment operation control": "OPS-PAY",
  "payment operations": "OPS-PAY",
  "payment ops": "OPS-PAY",
  "pay-ops": "OPS-PAY",
  "acquiring operations": "OPS-PAY",
  "scheme management": "OPS-PAY",

  // BCM (under Operations)
  "business continuity management": "OPS-BCM",
  bcm: "OPS-BCM",
  "business continuity": "OPS-BCM",

  // ============================================
  // CONTACT CENTER (CC) - Reports to COO
  // ============================================
  "contact center": "CC",
  "contact center ": "CC",
  "contact center  ": "CC",
  "contact center   ": "CC",
  contactcenter: "CC",
  "call center": "CC",

  // CC Operations
  "contact center operations": "CC-OPS",
  "cc operations": "CC-OPS",

  // CC Quality
  "quality & control": "CC-QC",
  "quality assurance": "CC-QC",

  // CC Workforce Management
  "workforce management": "CC-WFM",
  wfm: "CC-WFM",

  // CC Learning & Development
  "contact center training": "CC-LD",
  "cc training": "CC-LD",

  // ============================================
  // TECHNOLOGY (TECH) - Reports to CTO
  // ============================================
  technology: "TECH",
  "technology ": "TECH",
  technologe: "TECH",
  technololgy: "TECH",
  tech: "TECH",
  it: "TECH",

  // Software Engineering
  engineering: "TECH-SWE",
  engineer: "TECH-SWE",
  engineers: "TECH-SWE",
  "software engineering": "TECH-SWE",
  "platform engineering": "TECH-SWE",
  backend: "TECH-SWE",
  frontend: "TECH-SWE",
  "mobile development": "TECH-SWE",
  "web development": "TECH-SWE",

  // DevOps & Cloud
  devops: "TECH-DEVOPS",
  "devops ": "TECH-DEVOPS",
  "dev ops": "TECH-DEVOPS",
  infrastructure: "TECH-DEVOPS",
  "devops & infrastructure": "TECH-DEVOPS",
  "devops & cloud": "TECH-DEVOPS",
  "cloud engineering": "TECH-DEVOPS",

  // Site Reliability Engineering
  sre: "TECH-SRE",
  "site reliability": "TECH-SRE",
  "site reliability engineering": "TECH-SRE",
  "reliability engineering": "TECH-SRE",

  // Data & Analytics
  data: "TECH-DATA",
  "data ": "TECH-DATA",
  "data & analytics": "TECH-DATA",
  "data and analytics": "TECH-DATA",
  "data science": "TECH-DATA",
  "data science analytics": "TECH-DATA",
  analytics: "TECH-DATA",
  bi: "TECH-DATA",
  "business intelligence": "TECH-DATA",
  "data engineering": "TECH-DATA",

  // Product Management
  product: "TECH-PROD",
  "product ": "TECH-PROD",
  "product factory": "TECH-PROD",
  "product management": "TECH-PROD",
  "product manager": "TECH-PROD",
  "technical program manager": "TECH-PROD",
  tpm: "TECH-PROD",

  // IT Support
  "it support": "TECH-ITSUP",
  "it operations": "TECH-ITSUP",
  helpdesk: "TECH-ITSUP",
  "service desk": "TECH-ITSUP",
  "end user support": "TECH-ITSUP",
  "device management": "TECH-ITSUP",

  // ERP Systems
  erp: "TECH-ERP",
  "erp systems": "TECH-ERP",
  "erp engineering": "TECH-ERP",

  // Tech BCM
  "technology bcm": "TECH-BCM",
  "tech bcm": "TECH-BCM",

  // ============================================
  // CYBERSECURITY (SEC) - Reports to CISO
  // IMPORTANT: Separate from Technology!
  // ============================================
  cybersecurity: "SEC",
  "cybersecurity ": "SEC",
  "cyber security": "SEC",
  "cyber ": "SEC",
  cyber: "SEC",
  "information security": "SEC",
  infosec: "SEC",
  security: "SEC",
  ciso: "SEC",

  // Security Operations Center
  soc: "SEC-SOC",
  "security operations": "SEC-SOC",
  "security operations center": "SEC-SOC",
  "threat intelligence": "SEC-SOC",

  // Cyber Defense Center
  "cyber defense": "SEC-CDC",
  "penetration testing": "SEC-CDC",
  "red team": "SEC-CDC",
  "blue team": "SEC-CDC",

  // Security GRC
  "security governance": "SEC-GRC",
  "security compliance": "SEC-GRC",
  "security risk": "SEC-GRC",
  "security audit": "SEC-GRC",

  // Vulnerability Management
  "vulnerability management": "SEC-VM",
  "vulnerability assessment": "SEC-VM",
  "patch management": "SEC-VM",

  // Data Privacy
  "data privacy": "SEC-PRIV",
  privacy: "SEC-PRIV",
  "data protection": "SEC-PRIV",

  // ============================================
  // PROCUREMENT & ADMINISTRATION (PROC)
  // ============================================
  "procurement & administration": "PROC",
  procurement: "PROC-BUY",
  "procurement ": "PROC-BUY",
  "vendor management": "PROC-BUY",
  "contract management": "PROC-BUY",
  administration: "PROC-ADMIN",
  admin: "PROC-ADMIN",
  facilities: "PROC-ADMIN",
  "office management": "PROC-ADMIN",
  "travel desk": "PROC-TRAVEL",
  travel: "PROC-TRAVEL",

  // ============================================
  // LEGAL (LEGAL)
  // ============================================
  legal: "LEGAL",
  "legal affairs": "LEGAL-AFF",
  "corporate legal": "LEGAL-AFF",
  litigation: "LEGAL-AFF",
  "contract review": "LEGAL-CONT",
  contracts: "LEGAL-CONT",

  // ============================================
  // CORPORATE (CORP)
  // ============================================
  corporate: "CORP",
  "corporate ": "CORP",
  "corporate services": "CORP-SVC",
  "corporate governance": "CORP-GOV",
  governance: "CORP-GOV",

  // ============================================
  // LOYALTY & GAMING (LG)
  // ============================================
  "loyalty & gaming": "LG",
  loyalty: "LG-LOYALTY",
  "loyalty ": "LG-LOYALTY",
  "loyalty programs": "LG-LOYALTY",
  gaming: "LG-GAMING",
  "gaming operations": "LG-GAMING",

  // ============================================
  // SPECIAL CASES
  // ============================================

  // Vendor (external contractors)
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
 *
 * NEW STRUCTURE (aligned with C-level domains):
 * - SEC (CISO) → security-officer
 * - RISK, AUDIT (CRO) → auditor
 * - TECH (CTO) → service-owner (TECH-DATA → data-steward override)
 * - FIN (CFO) → finance-manager
 * - HR (CHRO) → hr-manager
 * - Others → viewer
 */
export const DEPARTMENT_ROLE_MAP: Record<string, string> = {
  // ============================================
  // CYBERSECURITY (SEC) - Reports to CISO
  // ============================================
  SEC: "security-officer",
  "SEC-SOC": "security-officer",
  "SEC-CDC": "security-officer",
  "SEC-GRC": "security-officer",
  "SEC-VM": "security-officer",
  "SEC-PRIV": "security-officer",

  // ============================================
  // RISK & COMPLIANCE (RISK) - Reports to CRO
  // ============================================
  RISK: "auditor",
  "RISK-COMP": "auditor",
  "RISK-AML": "auditor",
  "RISK-FRAUD": "auditor",
  "RISK-SANCT": "auditor",
  "RISK-ERM": "auditor",
  "RISK-SAMA": "auditor",
  "RISK-SSU": "auditor",

  // ============================================
  // INTERNAL AUDIT (AUDIT) - Reports to CRO/Board
  // ============================================
  AUDIT: "auditor",
  "AUDIT-INT": "auditor",
  "AUDIT-CORP": "auditor",
  "AUDIT-IT": "auditor",

  // ============================================
  // TECHNOLOGY (TECH) - Reports to CTO
  // ============================================
  TECH: "service-owner",
  "TECH-SWE": "service-owner",
  "TECH-DEVOPS": "service-owner",
  "TECH-SRE": "service-owner",
  "TECH-PROD": "service-owner",
  "TECH-ITSUP": "service-owner",
  "TECH-ERP": "service-owner",
  "TECH-BCM": "service-owner",
  // Data & Analytics → data-steward (override)
  "TECH-DATA": "data-steward",

  // ============================================
  // FINANCE (FIN) - Reports to CFO
  // ============================================
  FIN: "finance-manager",
  "FIN-FPA": "finance-manager",
  "FIN-FCR": "finance-manager",
  "FIN-TREAS": "finance-manager",
  "FIN-ACCT": "finance-manager",

  // ============================================
  // PROCUREMENT (PROC) - Reports to CFO/COO
  // ============================================
  PROC: "finance-manager",
  "PROC-BUY": "finance-manager",
  "PROC-ADMIN": "viewer",
  "PROC-TRAVEL": "viewer",

  // ============================================
  // HUMAN CAPITAL (HR) - Reports to CHRO
  // ============================================
  HR: "hr-manager",
  "HR-OPS": "hr-manager",
  "HR-TA": "hr-manager",
  "HR-OD": "hr-manager",
  "HR-PAY": "hr-manager",

  // ============================================
  // OPERATIONS (OPS) - Reports to COO
  // ============================================
  OPS: "viewer",
  "OPS-CORE": "viewer",
  "OPS-PAY": "viewer",
  "OPS-BCM": "viewer",

  // ============================================
  // CONTACT CENTER (CC) - Reports to COO
  // ============================================
  CC: "viewer",
  "CC-OPS": "viewer",
  "CC-QC": "viewer",
  "CC-WFM": "viewer",
  "CC-LD": "viewer",

  // ============================================
  // MARKETING & CX (MCX) - Reports to CMCXO
  // ============================================
  MCX: "viewer",
  "MCX-MKT": "viewer",
  "MCX-CX": "viewer",

  // ============================================
  // BUSINESS & PARTNERSHIPS (BIZ) - Reports to CBO
  // ============================================
  BIZ: "viewer",
  "BIZ-BD": "viewer",
  "BIZ-PART": "viewer",
  "BIZ-REMIT": "viewer",
  "BIZ-GROWTH": "viewer",

  // ============================================
  // LOYALTY & GAMING (LG) - Reports to CBO
  // ============================================
  LG: "viewer",
  "LG-LOYALTY": "viewer",
  "LG-GAMING": "viewer",

  // ============================================
  // EXECUTIVE LEADERSHIP (EXEC) - Reports to CEO
  // ============================================
  EXEC: "viewer",
  "EXEC-CEO": "viewer",
  "EXEC-STRAT": "viewer",
  "EXEC-COS": "viewer",

  // ============================================
  // LEGAL (LEGAL) - Reports to CEO
  // ============================================
  LEGAL: "viewer",
  "LEGAL-AFF": "viewer",
  "LEGAL-CONT": "viewer",

  // ============================================
  // CORPORATE (CORP) - Reports to CEO
  // ============================================
  CORP: "viewer",
  "CORP-SVC": "viewer",
  "CORP-GOV": "viewer",

  // ============================================
  // SPECIAL
  // ============================================
  VENDOR: "viewer",
  UNASSIGNED: "viewer",
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
