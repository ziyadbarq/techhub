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

import { ORG_UNIT_DATA } from "@/infrastructure/database/prisma/seed-config-org-units";

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
  // BOARD / CEO / STRATEGY (new roots)
  // ============================================
  board: "BOAR",
  "board of directors": "BOAR",
  "board of director": "BOAR",
  chairman: "BOAR",
  "vice chairman": "BOAR",
  ceo: "CEO",
  "chief executive officer": "CEO",
  "chief of staff": "EXEC-COS",
  "chief of staff office": "EXEC-COS",
  "strategy & corporate governance": "SCG",
  "strategy and corporate governance": "SCG",
  "strategy director": "SCG",
  "strategic planning": "SCG",

  // ============================================
  // EXECUTIVE LEADERSHIP (EXEC)
  // ============================================
  "ceo office": "EXEC-CEO",
  "ceo office manager": "EXEC-CEO",
  "board of directors member": "EXEC",
  "chairman of risk and compliance committee": "EXEC",
  "member of risk and compliance committee": "EXEC",
  executive: "EXEC",
  "executive office": "EXEC",
  "executive leadership": "EXEC",
  "business head": "EXEC",
  strategy: "SCG",

  // C-levels go to their corresponding departments
  "chief business officer": "BIZ",
  "chief compliance officer": "RISK",
  "chief financial officer": "FIN",
  "chief information security officer": "SEC",
  "chief internal audit officer": "AUDIT",
  "chief marketing & customer experience": "MCX",
  "chief operations officer": "OPS",
  "chief partnerships officer": "BIZ",
  "chief risk officer": "RISK",
  "chief technology officer": "TECH",
  "cto advisor": "TECH",
  "deputy chief operation officer": "OPS",
  "deputy chief technology officer": "TECH",

  // ============================================
  // INTERNAL AUDIT & OVERSIGHT (AUDIT)
  // ============================================
  "internal audit": "AUDIT-INT",
  "internal audit ": "AUDIT-INT",
  audit: "AUDIT",
  "corporate audit": "AUDIT-CORP",
  "corporate audit director": "AUDIT-CORP",
  "it audit": "AUDIT-IT",
  "it audit general manager": "AUDIT-IT",
  "audit & oversight": "AUDIT",

  // ============================================
  // RISK & COMPLIANCE (RISK) - Reports to CRO
  // ============================================
  "risk & compliance": "RISK",
  "risk and compliance": "RISK",

  // Compliance
  compliance: "RISK-COMP",
  "compliance ": "RISK-COMP",
  "compliance officer": "RISK-COMP",
  complaince: "RISK-COMP",
  "compliance\t": "RISK-COMP",
  "regulatory compliance": "RISK-COMP",
  "regulatory compliance officer": "RISK-COMP",
  "regulatory compliance senior manager": "RISK-COMP",
  "compliance assurance": "RISK-COMP",
  "compliance management": "COMPL-COMP",
  "compliance operations": "COMPL-COMP",

  // AML & CTF
  "aml & ctf": "RISK-AML",
  "aml and ctf general manager": "RISK-AML",
  aml: "RISK-AML",
  "aml ": "RISK-AML",
  "aml investigation senior associate": "RISK-AML",
  "aml investigation senior officer": "RISK-AML",
  "aml officer": "RISK-AML",
  ctf: "RISK-AML",
  "anti-money laundering": "RISK-AML",
  "anti money laundering": "RISK-AML",
  "edd officer": "RISK-AML",
  "finscan engineer": "RISK-AML",

  // Anti-Fraud
  "anti fraud, bribery & corruption": "RISK-FRAUD",
  "anti-fraud, bribery and corruption director": "RISK-FRAUD",
  "anti-fraud monitoring": "RISK-FRAUD",
  "anti-fraud monitoring manager": "RISK-FRAUD",
  "anti-fraud": "RISK-FRAUD",
  "anti fraud": "RISK-FRAUD",
  "anti-fraud officer": "RISK-FRAUD",
  "anti-fraud senior officer": "RISK-FRAUD",
  "anit-fraud officer": "RISK-FRAUD",
  fraud: "RISK-FRAUD",
  "fraud ": "RISK-FRAUD",
  "bribery & corruption": "RISK-FRAUD",

  // Sanctions
  sanctions: "RISK-SANCT",
  "sanctions ": "RISK-SANCT",
  sanction: "RISK-SANCT",
  "sanction officer": "RISK-SANCT",
  "sanctions director": "RISK-SANCT",
  "sanctions manager": "RISK-SANCT",
  "sanctions senior associate": "RISK-SANCT",

  // Risk Management
  risk: "RISK-MGMT",
  "risk ": "RISK-MGMT",
  "risk associate": "RISK-MGMT",
  "risk manager": "RISK-MGMT",
  "risk management": "RISK-MGMT",
  "risk management ": "RISK-MGMT",
  "enterprise risk": "RISK-MGMT",
  "enterprise risk manager": "RISK-MGMT",
  "operational risk": "RISK-MGMT",
  "risk monitoring": "RMGT-RMR",
  "risk monitoring & reporting": "RMGT-RMR",
  "credit risk": "RMGT-CRED",
  "operational risk management": "RMGT-OPER",

  // SAMA Affairs
  "sama affairs & compliance assurance": "RISK-SAMA",
  "sama affairs and compliance assurance director": "RISK-SAMA",
  "sama affairs and compliance assurance offcer": "RISK-SAMA",
  "sama affairs": "RISK-SAMA",
  sama: "RISK-SAMA",
  pdpl: "RISK-SAMA",

  // Self-Supervisory Unit
  "self-supervisory unit": "RISK-SSU",
  "self supervisory unit": "RISK-SSU",
  "self supervisory unit manager": "RISK-SSU",
  "self- supervisory unit associate": "RISK-SSU",
  ssu: "RISK-SSU",

  // ============================================
  // FINANCE (FIN) - Reports to CFO
  // ============================================
  finance: "FIN",
  "finance ": "FIN",
  "finance associate": "FIN",
  "finance manager": "FIN",
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
  "bank reconciliation manager": "FIN-FCR",
  "card reconciliation director": "FIN-FCR",
  "card reconciliation officer": "FIN-FCR",
  "card reconciliation senior offcer": "FIN-FCR",
  "internal reconciliation associate": "FIN-FCR",
  "internal reconciliation director": "FIN-FCR",
  "internal reconciliation officer": "FIN-FCR",
  "international & corporate reconciliation director": "FIN-FCR",
  "international & corporate reconciliation manager": "FIN-FCR",
  "international & corporate reconciliation officer": "FIN-FCR",
  "international transfer & merchant reconciliation senior officer": "FIN-FCR",

  // Treasury
  treasury: "FIN-TREAS",
  "cash management": "FIN-TREAS",

  // Accounting
  accounting: "FIN-ACCT",
  "accounting ": "FIN-ACCT",
  accountant: "FIN-ACCT",
  "accountant senior associate": "FIN-ACCT",
  accounts: "FIN-ACCT",
  "accounts payable": "FIN-ACCT",
  "accounts receivable": "FIN-ACCT",

  // ============================================
  // HUMAN CAPITAL (HR) - Reports to CHRO
  // ============================================
  "people & culture": "HR",
  "people and culture": "HR",
  "human resources": "HR",
  "human resources officer": "HR",
  "human resources support": "HR",
  hr: "HR",
  "hr manager": "HR",
  "human capital": "HR",
  "human capital associate": "HR",
  "human capital director": "HR",
  trainee: "HR",

  // HR Operations
  "hr operations": "HR-OPS",
  "hc operations": "HR-OPS",
  "human capital operations": "HR-OPS",
  "employee relations": "HR-OPS",

  // Talent Acquisition
  "talent acquisition": "HR-TA",
  "talent acquisition ": "HR-TA",
  "talent acquisition associate": "HR-TA",
  ta: "HR-TA",
  recruitment: "HR-TA",
  recruiting: "HR-TA",

  // Organizational Development
  "organizational development": "HR-OD",
  "od assistant manager": "HR-OD",
  "engagement assistant manager": "HR-OD",
  "performance management": "HR-OD",
  "training & development": "HR-OD",
  "learning & development": "HR-OD",

  // Payroll
  "payroll & hc operations": "HR-PAY",
  "payroll and hc operation assistant manager": "HR-PAY",
  payroll: "HR-PAY",
  "hr systems": "HR-PAY",

  // ============================================
  // MARKETING & CUSTOMER EXPERIENCE (MCX)
  // ============================================
  "marketing & customer experience": "MCX",
  "marcom & engagement": "MCX-MKT",
  "marcom and engagement general manager": "MCX-MKT",
  marcom: "MCX-MKT",
  marketing: "MCX-MKT",
  "marketing ": "MCX-MKT",
  communications: "MCX-MKT",
  "communications manager": "MCX-MKT",
  "marketing & communications": "MCX-MKT",
  "brand management": "MCX-MKT",
  "brand manager": "MCX-MKT",
  "digital marketing": "MCX-MKT",
  "digital marketing senior associate": "MCX-MKT",
  "digital marketing senior manager": "MCX-MKT",
  "social media specialist": "MCX-MKT",

  // Customer Experience
  "customer experience": "MCX-CX",
  "customer experience ": "MCX-CX",
  "customer experience director": "MCX-CX",
  "customer experience officer": "MCX-CX",
  "customer experience team leader": "MCX-CX",
  "team leader customer experience": "MCX-CX",
  "senior associate customer protection": "MCX-CX",
  cx: "MCX-CX",
  "customer success": "MCX-CX",
  "journey mapping": "MCX-CX",

  // ============================================
  // BUSINESS & PARTNERSHIPS (BIZ) - Reports to CBO
  // ============================================
  business: "BIZ",
  "business ": "BIZ",
  "business planning senior associate": "BIZ",
  "micro lending manager": "BIZ",
  commercial: "BIZ",
  "business & partnerships": "BIZ",

  // Business Development (Regional)
  "business development": "BUSI-DEVP",
  "regional operations": "BUSI-DEVP",
  "central regional manager": "BUSI-DEVP",
  "central regional officer": "BUSI-DEVP",
  "eastern regional manager": "BUSI-DEVP",
  "south & north regional manager": "BUSI-DEVP",
  "south regional officer": "BUSI-DEVP",
  "western regional manager": "BUSI-DEVP",
  "western regional officer": "BUSI-DEVP",

  // Partnerships
  partnerships: "BIZ-PART",
  "partnerships general manager": "BIZ-PART",
  "corporate & partnerships": "BIZ-PART",
  "corporates & partnerships officer": "BIZ-PART",
  "merchant partnerships": "BIZ-PART",
  "corporate partnerships": "BIZ-PART",
  "acquiring director": "BIZ-PART",
  "acquiring payment manager": "BIZ-PART",
  "corporate assistant manager": "BIZ-PART",
  "corporate director": "BIZ-PART",

  // Remittance
  remittance: "BIZ-REMIT",
  "remittance ": "BIZ-REMIT",
  "remittance director": "BIZ-REMIT",
  "remittance sales representative": "BIZ-REMIT",
  "remittance specialist": "BIZ-REMIT",
  "remittance & international partnership": "BIZ-REMIT",
  "remittance and international partnership general manager": "BIZ-REMIT",
  "international partnership": "BIZ-REMIT",
  "international partnership director": "BIZ-REMIT",
  "country manager-south east asia corridors": "BIZ-REMIT",
  "corridor operations": "BIZ-REMIT",

  // Growth
  growth: "BIZ-GROWTH",
  "growth & subsidiaries senior manager": "BIZ-GROWTH",
  subsidiaries: "BIZ-GROWTH",

  // ============================================
  // OPERATIONS (OPS) - Reports to COO
  // ============================================
  operations: "OPS",
  "operations ": "OPS",
  ops: "OPS",
  "director of ops": "OPS",

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
  "payment scheme manager": "OPS-PAY",
  "payments control manager": "OPS-PAY",
  "payments general manager": "OPS-PAY",
  "card operation assistant manager": "OPS-PAY",
  "card senior manager": "OPS-PAY",
  "cards director": "OPS-PAY",
  "operation control officer": "OPS-PAY",
  "operation control specialist": "OPS-PAY",
  "operation control sr specialist": "OPS-PAY",

  // BCM (under Operations)
  "business continuity management": "OPS-BCM",
  bcm: "OPS-BCM",
  "bcm senior associate": "OPS-BCM",
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
  "head of contact center": "CC",

  // CC Operations
  "contact center operations": "CC-OPS",
  "contact center operations manager": "CC-OPS",
  "contact center operations team leader": "CC-OPS",
  "contact center operation agent": "CC-OPS",
  "contact center operation assistant manager": "CC-OPS",
  "contact center account manager": "CC-OPS",
  "contact center agent": "CC-OPS",
  "contact center outbound specialist": "CC-OPS",
  "contact center process and procedures specialist": "CC-OPS",
  "cc operations": "CC-OPS",

  // CC Quality
  "quality & control": "CC-QC",
  "quality assurance": "CC-QC",
  "contact center quality and control manager": "CC-QC",
  "contact center quality and control officer": "CC-QC",
  "contact center quality and control specialist": "CC-QC",

  // CC Workforce Management
  "workforce management": "CC-WFM",
  wfm: "CC-WFM",
  "contact center wfm analyst": "CC-WFM",
  "contact center wfm assistant manager": "CC-WFM",
  "contact center wfm junior analyst": "CC-WFM",
  "contact center wfm senior manager": "CC-WFM",

  // CC Learning & Development
  "contact center training": "CC-LD",
  "cc training": "CC-LD",
  "contact center learning and development manager": "CC-LD",
  "contact center learning and development specialist": "CC-LD",

  // ============================================
  // TECHNOLOGY (TECH) - Reports to CTO
  // ============================================
  technology: "TECH",
  "technology ": "TECH",
  "technology director": "TECH",
  technologe: "TECH",
  technololgy: "TECH",
  tech: "TECH",
  it: "TECH",
  "it manager": "TECH",

  // Software Engineering
  engineering: "TECH-SWE",
  engineer: "TECH-SWE",
  engineers: "TECH-SWE",
  "software engineering": "TECH-SWE",
  "platform engineering": "TECH-SWE",
  backend: "TECH-SWE",
  "backend development manager": "TECH-SWE",
  "backend engineer": "TECH-SWE",
  frontend: "TECH-SWE",
  "mobile development": "TECH-SWE",
  "mobile development manager": "TECH-SWE",
  "web development": "TECH-SWE",
  "web developer": "TECH-SWE",
  "web developer officer": "TECH-SWE",
  "director of engineering": "TECH-SWE",
  em: "TECH-SWE",
  "lead android developer": "TECH-SWE",
  "lead expert technology engineer": "TECH-SWE",
  "principal engineer": "TECH-SWE",
  "senior principal": "TECH-SWE",
  "qa automation engineer": "TECH-SWE",
  "test and automation engineer": "TECH-SWE",
  "software developer": "TECH-SWE",
  "software developer associate": "TECH-SWE",
  "uxui designer": "TECH-SWE",
  "vp of engineering & site lead.": "TECH-SWE",
  "sde 1": "TECH-SWE",
  "sde 2": "TECH-SWE",
  "sde 3": "TECH-SWE",
  sde1: "TECH-SWE",
  sde2: "TECH-SWE",
  sde3: "TECH-SWE",
  "sdet 1": "TECH-SWE",
  "sdet 3": "TECH-SWE",
  sdet2: "TECH-SWE",
  sdet3: "TECH-SWE",

  // DevOps & Cloud
  devops: "TECH-DEVOPS",
  "devops ": "TECH-DEVOPS",
  "dev ops": "TECH-DEVOPS",
  "devops engineer": "TECH-DEVOPS",
  "devops engineer 1": "TECH-DEVOPS",
  "devops engineer 2": "TECH-DEVOPS",
  "senior devops engineer": "TECH-DEVOPS",
  "senior lead - devops": "TECH-DEVOPS",
  "architect devsecops": "TECH-DEVOPS",
  "cloud engineer officer": "TECH-DEVOPS",
  "sde 1 devops": "TECH-DEVOPS",
  infrastructure: "TECH-DEVOPS",
  "devops & infrastructure": "TECH-DEVOPS",
  "devops & cloud": "TECH-DEVOPS",
  "cloud engineering": "TECH-DEVOPS",

  // Site Reliability Engineering
  sre: "TECH-SRE",
  "site reliability": "TECH-SRE",
  "site reliability engineering": "TECH-SRE",
  "site reliability engineer": "TECH-SRE",
  "site reliability engineering officer": "TECH-SRE",
  "senior site reliability engineering": "TECH-SRE",
  "reliability engineering": "TECH-SRE",

  // Data & Analytics
  data: "TECH-DATA",
  "data ": "TECH-DATA",
  "data & analytics": "TECH-DATA",
  "data and analytics": "TECH-DATA",
  "data governance": "DATA",
  "data science": "TECH-DATA",
  "data science analytics": "TECH-DATA",
  "data science analytics officer": "TECH-DATA",
  "senior data science associate": "TECH-DATA",
  analytics: "TECH-DATA",
  bi: "TECH-DATA",
  "business intelligence": "TECH-DATA",
  "data engineering": "TECH-DATA",
  "data engineer": "TECH-DATA",
  "associate data analyst": "TECH-DATA",
  "data analyst 2": "TECH-DATA",
  "head of data": "TECH-DATA",

  // Product Management
  product: "TECH-PROD",
  "product ": "TECH-PROD",
  "product factory": "TECH-PROD",
  "product factory general manager": "TECH-PROD",
  "product factory manager": "TECH-PROD",
  "product management": "TECH-PROD",
  "product manager": "TECH-PROD",
  "product manager 2": "TECH-PROD",
  "product operations lead": "TECH-PROD",
  "technical program manager": "TECH-PROD",
  "senior technical program manager": "TECH-PROD",
  tpm: "TECH-PROD",
  apm: "TECH-PROD",
  "associate product manager": "TECH-PROD",
  "director pm": "TECH-PROD",
  "pm 1": "TECH-PROD",
  "pm 2": "TECH-PROD",
  pm1: "TECH-PROD",
  pm2: "TECH-PROD",
  pm3: "TECH-PROD",
  "principal pm": "TECH-PROD",
  "tech pm 2": "TECH-PROD",
  "technology pm 3": "TECH-PROD",
  "project manager": "TECH-PROD",
  "projects coordinator": "TECH-PROD",
  "senior project management manager": "TECH-PROD",

  // IT Support
  "it support": "TECH-ITSUP",
  "it operations": "TECH-ITSUP",
  "it back office support": "TECH-ITSUP",
  helpdesk: "TECH-ITSUP",
  "service desk": "TECH-ITSUP",
  "service desk analyst": "TECH-ITSUP",
  "end user support": "TECH-ITSUP",
  "end user support officer": "TECH-ITSUP",
  "end user support senior associate": "TECH-ITSUP",
  "end user support specialist": "TECH-ITSUP",
  "device management": "TECH-ITSUP",
  jamf: "TECH-ITSUP",

  // ERP Systems
  erp: "TECH-ERP",
  "erp systems": "TECH-ERP",
  "erp engineering": "TECH-ERP",
  "erp engineer": "TECH-ERP",
  oracle: "TECH-ERP",

  // Tech BCM
  "technology bcm": "TECH-BCM",
  "tech bcm": "TECH-BCM",

  // ============================================
  // CYBERSECURITY (SEC) - Reports to CISO
  // IMPORTANT: Separate from Technology!
  // ============================================
  cybersecurity: "SEC",
  "cybersecurity ": "SEC",
  "cybersecurity officer": "SEC",
  "cyber security": "SEC",
  "cyber security associate": "SEC",
  "cyber ": "SEC",
  cyber: "SEC",
  "information security": "SEC",
  "information technology security senior associate": "SEC",
  infosec: "SEC",
  security: "SEC",
  ciso: "SEC",
  "cybersecurity management": "SEC-MGMT",

  // Security Operations Center
  soc: "SEC-SOC",
  "security operations": "SEC-SOC",
  "security operations center": "SEC-SOC",
  "cybersecurity operation associate": "SEC-SOC",
  "cybersecurity operation manager": "SEC-SOC",
  "threat intelligence": "SEC-SOC",

  // Cyber Defense Center
  "cyber defense": "SEC-CDC",
  "cyber defence center officer": "SEC-CDC",
  "penetration testing": "SEC-CDC",
  "red team": "SEC-CDC",
  "blue team": "SEC-CDC",

  // Security GRC
  "security governance": "SEC-CGRAC-SGRC",
  "security compliance": "SEC-CGRAC-SGRC",
  "security risk": "SEC-CGRAC-SGRC",
  "security audit": "SEC-CGRAC-SGRC",
  "cybersecurity governance, risk and compliance assistant manager":
    "SEC-CGRAC-SGRC",
  "security governance risk & compliance": "SEC-GRC",

  // Vulnerability Management
  "vulnerability management": "SEC-VM",
  "vulnerability assessment": "SEC-VM",
  "cyber vulnerability management senior associate": "SEC-VM",
  "patch management": "SEC-VM",

  // Data Privacy
  "data privacy": "SEC-PRIV",
  "data privacy associate": "SEC-PRIV",
  privacy: "SEC-PRIV",
  "data protection": "SEC-PRIV",

  // ============================================
  // PROCUREMENT & ADMINISTRATION (PROC)
  // ============================================
  "procurement & administration": "PROC",
  "procurement & administration director": "PROC",
  procurement: "PROC-BUY",
  "procurement ": "PROC-BUY",
  "vendor management": "PROC-BUY",
  "contract management": "PROC-BUY",
  "contracts manager": "PROC-BUY",
  administration: "PROC-ADMIN",
  "administration senior associate": "PROC-ADMIN",
  admin: "PROC-ADMIN",
  facilities: "PROC-ADMIN",
  "office management": "PROC-ADMIN",
  "travel desk": "PROC-TRAVEL",
  "travel desk manager": "PROC-TRAVEL",
  travel: "PROC-TRAVEL",

  // ============================================
  // LEGAL (LEGAL)
  // ============================================
  legal: "LEGAL",
  "legal officer": "LEGAL",
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
  "loyality and gaming director": "LG",
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
  // BOARD / CEO / STRATEGY
  // ============================================
  BOAR: "viewer",
  CEO: "viewer",
  SCG: "viewer",

  // ============================================
  // CYBERSECURITY (SEC) - Reports to CISO
  // ============================================
  SEC: "security-officer",
  "SEC-SOC": "security-officer",
  "SEC-CDC": "security-officer",
  "SEC-CGRAC-SGRC": "security-officer",
  "SEC-CGRAC-SGRC-AUD": "security-officer",
  "SEC-CGRAC-SGRC-POL": "security-officer",
  "SEC-CGRAC-AUD": "security-officer",
  "SEC-CGRAC-POL": "security-officer",
  "SEC-VM": "security-officer",
  "SEC-PRIV": "security-officer",
  "SEC-GRC": "security-officer",
  "SEC-OPS": "security-officer",
  "SEC-CGRAC": "security-officer",
  "SEC-CAD": "security-officer",
  "SEC-MGMT": "security-officer",

  // ============================================
  // RISK & COMPLIANCE (RISK) - Reports to CRO
  // ============================================
  RISK: "auditor",
  "RISK-COMP": "auditor",
  "RISK-AML": "auditor",
  "RISK-FRAUD": "auditor",
  "RISK-SANCT": "auditor",
  "RISK-MGMT": "auditor",
  "RISK-SAMA": "auditor",
  "RISK-SSU": "auditor",
  RMGT: "auditor",
  "RMGT-RMR": "auditor",
  "RMGT-OPER": "auditor",
  "RMGT-BCM": "auditor",
  "RMGT-CRED": "auditor",
  "RMGT-RDM": "auditor",
  "RMGT-ENTE": "auditor",

  // ============================================
  // INTERNAL AUDIT (AUDIT) - Reports to CRO/Board
  // ============================================
  AUDIT: "auditor",
  "AUDIT-INT": "auditor",
  "AUDIT-CORP": "auditor",
  "AUDIT-IT": "auditor",
  INTA: "auditor",
  "INTA-INTE": "auditor",

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
  DATA: "data-steward",

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
  "BUSI-DEVP": "viewer",
  "BIZ-PART": "viewer",
  "BIZ-REMIT": "viewer",
  "BIZ-GROWTH": "viewer",
  BUSI: "viewer",

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
  COMPL: "auditor",
  "COMPL-SANC": "auditor",
  "COMPL-REGU": "auditor",
  "COMPL-SACA": "auditor",
  "COMPL-AFBC": "auditor",
  "COMPL-AMLC": "auditor",
  "COMPL-COMP": "auditor",
  "COMPL-SSU": "auditor",
} as const;

// ==============================================
// Validation Helpers (detect drift vs ORG_UNIT_DATA)
// ==============================================

const VALID_ORG_UNIT_CODES: Set<string> = new Set(
  ORG_UNIT_DATA.map((unit) => unit.code),
);

function validateCodes(label: string, codes: Iterable<string>) {
  const missing = new Set<string>();
  for (const code of codes) {
    if (!VALID_ORG_UNIT_CODES.has(code)) {
      missing.add(code);
    }
  }
  if (missing.size > 0) {
    console.warn(
      `[graph-normalization] ${label} references unknown org codes: ${[
        ...missing,
      ].join(", ")}`,
    );
  }
}

validateCodes(
  "DEPARTMENT_NORMALIZATION_MAP",
  Object.values(DEPARTMENT_NORMALIZATION_MAP),
);
validateCodes("DEPARTMENT_ROLE_MAP", Object.keys(DEPARTMENT_ROLE_MAP));

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

  // Try direct name match from org unit data (keeps map aligned with seeds)
  const normalizedNameKey = normalized.replace(/&/g, "and");
  const fromNames = ORG_UNIT_DATA.find(
    (unit) =>
      unit.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/&/g, "and") === normalizedNameKey,
  );
  if (fromNames) {
    return fromNames.code;
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
