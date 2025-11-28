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
// Organization Unit Data (Barq 4-Level Structure)
// ==============================================
// Level 1: Company (BARQ)
// Level 2: Departments (15 + Vendor + Unassigned)
// Level 3: Sub-Departments (BUSINESS_UNIT)
// Level 4: Teams (TEAM)
// ==============================================

export const ORG_UNIT_DATA = [
  // ============================================
  // LEVEL 1: COMPANY
  // ============================================
  {
    name: "Barq",
    code: "BARQ",
    description: "Barq Financial Services",
    unitType: "COMPANY" as const,
  },

  // ============================================
  // LEVEL 2: DEPARTMENTS (15 + Vendor + Unassigned)
  // ============================================

  // 1. Executive Leadership (CEO)
  {
    name: "Executive Leadership",
    code: "EXEC",
    parentCode: "BARQ",
    description: "Executive Office and Corporate Leadership",
    unitType: "DEPARTMENT" as const,
  },

  // 2. Internal Audit & Oversight (CEO/Board)
  {
    name: "Internal Audit & Oversight",
    code: "AUDIT",
    parentCode: "BARQ",
    description: "Internal audit, governance oversight, and corporate audit",
    unitType: "DEPARTMENT" as const,
  },

  // 3. Risk & Compliance (CRO)
  {
    name: "Risk & Compliance",
    code: "RISK",
    parentCode: "BARQ",
    description: "Risk management and regulatory compliance",
    unitType: "DEPARTMENT" as const,
  },

  // 4. Finance (CFO)
  {
    name: "Finance",
    code: "FIN",
    parentCode: "BARQ",
    description: "Finance and accounting operations",
    unitType: "DEPARTMENT" as const,
  },

  // 5. Human Capital (CHRO)
  {
    name: "Human Capital",
    code: "HR",
    parentCode: "BARQ",
    description: "Human resources and talent management",
    unitType: "DEPARTMENT" as const,
  },

  // 6. Marketing & Customer Experience (CMCXO)
  {
    name: "Marketing & Customer Experience",
    code: "MCX",
    parentCode: "BARQ",
    description: "Marketing, communications, and customer experience",
    unitType: "DEPARTMENT" as const,
  },

  // 7. Business & Partnerships (CBO)
  {
    name: "Business & Partnerships",
    code: "BIZ",
    parentCode: "BARQ",
    description: "Business development and strategic partnerships",
    unitType: "DEPARTMENT" as const,
  },

  // 8. Operations (COO)
  {
    name: "Operations",
    code: "OPS",
    parentCode: "BARQ",
    description: "Core operations and payment processing",
    unitType: "DEPARTMENT" as const,
  },

  // 9. Contact Center (COO)
  {
    name: "Contact Center",
    code: "CC",
    parentCode: "BARQ",
    description: "Customer contact center operations",
    unitType: "DEPARTMENT" as const,
  },

  // 10. Technology (CTO)
  {
    name: "Technology",
    code: "TECH",
    parentCode: "BARQ",
    description: "Technology and IT operations",
    unitType: "DEPARTMENT" as const,
  },

  // 11. Cybersecurity (CISO) - SEPARATE FROM TECHNOLOGY
  {
    name: "Cybersecurity",
    code: "SEC",
    parentCode: "BARQ",
    description: "Information security and cybersecurity (reports to CISO)",
    unitType: "DEPARTMENT" as const,
  },

  // 12. Procurement & Administration
  {
    name: "Procurement & Administration",
    code: "PROC",
    parentCode: "BARQ",
    description: "Procurement, facilities, and administration",
    unitType: "DEPARTMENT" as const,
  },

  // 13. Legal (CEO)
  {
    name: "Legal",
    code: "LEGAL",
    parentCode: "BARQ",
    description: "Legal affairs and contracts",
    unitType: "DEPARTMENT" as const,
  },

  // 14. Corporate (CEO)
  {
    name: "Corporate",
    code: "CORP",
    parentCode: "BARQ",
    description: "Corporate affairs and governance",
    unitType: "DEPARTMENT" as const,
  },

  // 15. Loyalty & Gaming (CBO)
  {
    name: "Loyalty & Gaming",
    code: "LG",
    parentCode: "BARQ",
    description: "Loyalty programs and gaming services",
    unitType: "DEPARTMENT" as const,
  },

  // Special: Vendor
  {
    name: "Vendor",
    code: "VENDOR",
    parentCode: "BARQ",
    description: "External vendors and contractors",
    unitType: "DIVISION" as const,
  },

  // Special: Unassigned (for unmapped MS Graph departments)
  {
    name: "Unassigned",
    code: "UNASSIGNED",
    parentCode: "BARQ",
    description: "Users pending department assignment",
    unitType: "DEPARTMENT" as const,
  },

  // ============================================
  // LEVEL 3: SUB-DEPARTMENTS (BUSINESS_UNIT)
  // ============================================

  // --- 1. EXECUTIVE LEADERSHIP Sub-Departments ---
  {
    name: "CEO Office",
    code: "EXEC-CEO",
    parentCode: "EXEC",
    description: "Chief Executive Officer office",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Strategy",
    code: "EXEC-STRAT",
    parentCode: "EXEC",
    description: "Strategic planning and initiatives",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Chief of Staff",
    code: "EXEC-COS",
    parentCode: "EXEC",
    description: "Executive operations and strategic initiatives",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 2. INTERNAL AUDIT & OVERSIGHT Sub-Departments ---
  {
    name: "Internal Audit",
    code: "AUDIT-INT",
    parentCode: "AUDIT",
    description: "Internal audit function",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Corporate Audit",
    code: "AUDIT-CORP",
    parentCode: "AUDIT",
    description: "Corporate-level auditing",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "IT Audit",
    code: "AUDIT-IT",
    parentCode: "AUDIT",
    description: "Information technology audit",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 3. RISK & COMPLIANCE Sub-Departments ---
  {
    name: "Compliance",
    code: "RISK-COMP",
    parentCode: "RISK",
    description: "Regulatory compliance",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "AML & CTF",
    code: "RISK-AML",
    parentCode: "RISK",
    description: "Anti-money laundering and counter-terrorism financing",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Anti-Fraud, Bribery & Corruption",
    code: "RISK-FRAUD",
    parentCode: "RISK",
    description: "Fraud prevention, bribery, and corruption",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Risk Management",
    code: "RISK-ERM",
    parentCode: "RISK",
    description: "Enterprise and operational risk management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Sanctions",
    code: "RISK-SANCT",
    parentCode: "RISK",
    description: "Sanctions compliance",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "SAMA Affairs & Compliance Assurance",
    code: "RISK-SAMA",
    parentCode: "RISK",
    description: "SAMA regulatory affairs and compliance assurance",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Self-Supervisory Unit",
    code: "RISK-SSU",
    parentCode: "RISK",
    description: "Self-supervisory compliance unit",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 4. FINANCE Sub-Departments ---
  {
    name: "Financial Planning & Analysis",
    code: "FIN-FPA",
    parentCode: "FIN",
    description: "FP&A, budgeting, and forecasting",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Financial Control & Reconciliation",
    code: "FIN-FCR",
    parentCode: "FIN",
    description: "Financial control and reconciliation",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Treasury",
    code: "FIN-TREAS",
    parentCode: "FIN",
    description: "Treasury and cash management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Accounting",
    code: "FIN-ACCT",
    parentCode: "FIN",
    description: "General accounting and financial reporting",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 5. HUMAN CAPITAL Sub-Departments ---
  {
    name: "Human Capital Operations",
    code: "HR-OPS",
    parentCode: "HR",
    description: "HR operations and employee relations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Talent Acquisition",
    code: "HR-TA",
    parentCode: "HR",
    description: "Recruitment and talent acquisition",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Organizational Development",
    code: "HR-OD",
    parentCode: "HR",
    description: "Performance management and training",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Payroll & HC Operations",
    code: "HR-PAY",
    parentCode: "HR",
    description: "Payroll processing and HR systems",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 6. MARKETING & CUSTOMER EXPERIENCE Sub-Departments ---
  {
    name: "Marketing",
    code: "MCX-MKT",
    parentCode: "MCX",
    description: "Digital marketing, communications, and brand management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Customer Experience",
    code: "MCX-CX",
    parentCode: "MCX",
    description: "Customer experience and journey mapping",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 7. BUSINESS & PARTNERSHIPS Sub-Departments ---
  {
    name: "Business Development",
    code: "BIZ-BD",
    parentCode: "BIZ",
    description: "Business development and regional operations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Partnerships",
    code: "BIZ-PART",
    parentCode: "BIZ",
    description: "Corporate and merchant partnerships",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Remittance & International Partnerships",
    code: "BIZ-REMIT",
    parentCode: "BIZ",
    description: "Remittance and international partnerships",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Growth",
    code: "BIZ-GROWTH",
    parentCode: "BIZ",
    description: "Subsidiaries management and growth initiatives",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 8. OPERATIONS Sub-Departments ---
  {
    name: "Operations Core",
    code: "OPS-CORE",
    parentCode: "OPS",
    description: "Operations support and customer protection",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Payments & Operation Control",
    code: "OPS-PAY",
    parentCode: "OPS",
    description: "Payment operations and scheme management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Business Continuity Management",
    code: "OPS-BCM",
    parentCode: "OPS",
    description: "Business continuity planning and monitoring",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 9. CONTACT CENTER Sub-Departments ---
  {
    name: "Contact Center Operations",
    code: "CC-OPS",
    parentCode: "CC",
    description: "Contact center agents and operations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Quality & Control",
    code: "CC-QC",
    parentCode: "CC",
    description: "Quality assurance and process control",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Workforce Management",
    code: "CC-WFM",
    parentCode: "CC",
    description: "Workforce scheduling and management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Learning & Development",
    code: "CC-LD",
    parentCode: "CC",
    description: "Agent training and development",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 10. TECHNOLOGY Sub-Departments ---
  {
    name: "Software Engineering",
    code: "TECH-SWE",
    parentCode: "TECH",
    description: "Software and platform engineering",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "DevOps & Cloud",
    code: "TECH-DEVOPS",
    parentCode: "TECH",
    description: "DevOps, infrastructure, and cloud operations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Site Reliability Engineering",
    code: "TECH-SRE",
    parentCode: "TECH",
    description: "SRE and reliability operations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Data & Analytics",
    code: "TECH-DATA",
    parentCode: "TECH",
    description: "Data science, analytics, and BI",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Product Management",
    code: "TECH-PROD",
    parentCode: "TECH",
    description: "Product management and operations",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "IT Support / End User Support",
    code: "TECH-ITSUP",
    parentCode: "TECH",
    description: "Helpdesk and device management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "ERP Systems",
    code: "TECH-ERP",
    parentCode: "TECH",
    description: "ERP engineering and support",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Business Continuity Management",
    code: "TECH-BCM",
    parentCode: "TECH",
    description: "Technology BCM planning and monitoring",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 11. CYBERSECURITY Sub-Departments (CISO) ---
  {
    name: "Security Operations Center",
    code: "SEC-SOC",
    parentCode: "SEC",
    description: "SOC, threat intelligence, and incident response",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Cyber Defense Center",
    code: "SEC-CDC",
    parentCode: "SEC",
    description: "Penetration testing, red team, and blue team",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Security Governance, Risk & Compliance",
    code: "SEC-GRC",
    parentCode: "SEC",
    description: "Security policies, audits, and compliance",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Vulnerability Management",
    code: "SEC-VM",
    parentCode: "SEC",
    description: "Vulnerability assessment and patch management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Data Privacy",
    code: "SEC-PRIV",
    parentCode: "SEC",
    description: "Data classification and privacy operations",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 12. PROCUREMENT & ADMINISTRATION Sub-Departments ---
  {
    name: "Procurement",
    code: "PROC-BUY",
    parentCode: "PROC",
    description: "Contracts and vendor management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Administration",
    code: "PROC-ADMIN",
    parentCode: "PROC",
    description: "Office management and facilities",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Travel Desk",
    code: "PROC-TRAVEL",
    parentCode: "PROC",
    description: "Travel booking and coordination",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 13. LEGAL Sub-Departments ---
  {
    name: "Legal Affairs",
    code: "LEGAL-AFF",
    parentCode: "LEGAL",
    description: "Corporate legal and litigation support",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Contract Review & Compliance",
    code: "LEGAL-CONT",
    parentCode: "LEGAL",
    description: "Contract drafting and review",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 14. CORPORATE Sub-Departments ---
  {
    name: "Corporate Services",
    code: "CORP-SVC",
    parentCode: "CORP",
    description: "Corporate administration",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Corporate Governance",
    code: "CORP-GOV",
    parentCode: "CORP",
    description: "Board relations and governance",
    unitType: "BUSINESS_UNIT" as const,
  },

  // --- 15. LOYALTY & GAMING Sub-Departments ---
  {
    name: "Loyalty Programs",
    code: "LG-LOYALTY",
    parentCode: "LG",
    description: "Loyalty operations and rewards management",
    unitType: "BUSINESS_UNIT" as const,
  },
  {
    name: "Gaming Operations",
    code: "LG-GAMING",
    parentCode: "LG",
    description: "Gaming platform and user engagement",
    unitType: "BUSINESS_UNIT" as const,
  },

  // ============================================
  // LEVEL 4: TEAMS
  // ============================================

  // --- EXECUTIVE LEADERSHIP Teams ---
  {
    name: "CEO Office Manager",
    code: "EXEC-CEO-MGR",
    parentCode: "EXEC-CEO",
    description: "CEO office management",
    unitType: "TEAM" as const,
  },
  {
    name: "Business Planning & Analysis",
    code: "EXEC-CEO-BPA",
    parentCode: "EXEC-CEO",
    description: "Business planning and analysis",
    unitType: "TEAM" as const,
  },
  {
    name: "Executive Coordination",
    code: "EXEC-CEO-COORD",
    parentCode: "EXEC-CEO",
    description: "Executive coordination",
    unitType: "TEAM" as const,
  },
  {
    name: "Strategy Development",
    code: "EXEC-STRAT-DEV",
    parentCode: "EXEC-STRAT",
    description: "Strategy development",
    unitType: "TEAM" as const,
  },
  {
    name: "Corporate Planning",
    code: "EXEC-STRAT-PLAN",
    parentCode: "EXEC-STRAT",
    description: "Corporate planning",
    unitType: "TEAM" as const,
  },
  {
    name: "Executive Operations",
    code: "EXEC-COS-OPS",
    parentCode: "EXEC-COS",
    description: "Executive operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Strategic Initiatives",
    code: "EXEC-COS-INIT",
    parentCode: "EXEC-COS",
    description: "Strategic initiatives",
    unitType: "TEAM" as const,
  },

  // --- INTERNAL AUDIT Teams ---
  {
    name: "Audit Operations",
    code: "AUDIT-INT-OPS",
    parentCode: "AUDIT-INT",
    description: "Audit operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Audit Planning",
    code: "AUDIT-INT-PLAN",
    parentCode: "AUDIT-INT",
    description: "Audit planning",
    unitType: "TEAM" as const,
  },
  {
    name: "Corporate Audit Unit",
    code: "AUDIT-CORP-UNIT",
    parentCode: "AUDIT-CORP",
    description: "Corporate audit unit",
    unitType: "TEAM" as const,
  },
  {
    name: "IT Audit Unit",
    code: "AUDIT-IT-UNIT",
    parentCode: "AUDIT-IT",
    description: "IT audit unit",
    unitType: "TEAM" as const,
  },

  // --- RISK & COMPLIANCE Teams ---
  {
    name: "Regulatory Compliance",
    code: "RISK-COMP-REG",
    parentCode: "RISK-COMP",
    description: "Regulatory compliance",
    unitType: "TEAM" as const,
  },
  {
    name: "Compliance Assurance",
    code: "RISK-COMP-ASSUR",
    parentCode: "RISK-COMP",
    description: "Compliance assurance",
    unitType: "TEAM" as const,
  },
  {
    name: "EDD",
    code: "RISK-COMP-EDD",
    parentCode: "RISK-COMP",
    description: "Enhanced due diligence",
    unitType: "TEAM" as const,
  },
  {
    name: "Compliance Operations",
    code: "RISK-COMP-OPS",
    parentCode: "RISK-COMP",
    description: "Compliance operations",
    unitType: "TEAM" as const,
  },
  {
    name: "AML Investigations",
    code: "RISK-AML-INV",
    parentCode: "RISK-AML",
    description: "AML investigations",
    unitType: "TEAM" as const,
  },
  {
    name: "CTF Monitoring",
    code: "RISK-AML-CTF",
    parentCode: "RISK-AML",
    description: "CTF monitoring",
    unitType: "TEAM" as const,
  },
  {
    name: "AML Operations",
    code: "RISK-AML-OPS",
    parentCode: "RISK-AML",
    description: "AML operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Anti-Fraud Operations",
    code: "RISK-FRAUD-OPS",
    parentCode: "RISK-FRAUD",
    description: "Anti-fraud operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Anti-Fraud Monitoring",
    code: "RISK-FRAUD-MON",
    parentCode: "RISK-FRAUD",
    description: "Anti-fraud monitoring",
    unitType: "TEAM" as const,
  },
  {
    name: "Fraud Investigations",
    code: "RISK-FRAUD-INV",
    parentCode: "RISK-FRAUD",
    description: "Fraud investigations",
    unitType: "TEAM" as const,
  },
  {
    name: "Enterprise Risk",
    code: "RISK-ERM-ENT",
    parentCode: "RISK-ERM",
    description: "Enterprise risk",
    unitType: "TEAM" as const,
  },
  {
    name: "Operational Risk",
    code: "RISK-ERM-OPS",
    parentCode: "RISK-ERM",
    description: "Operational risk",
    unitType: "TEAM" as const,
  },
  {
    name: "Sanctions Screening",
    code: "RISK-SANCT-SCR",
    parentCode: "RISK-SANCT",
    description: "Sanctions screening",
    unitType: "TEAM" as const,
  },
  {
    name: "Sanctions Investigations",
    code: "RISK-SANCT-INV",
    parentCode: "RISK-SANCT",
    description: "Sanctions investigations",
    unitType: "TEAM" as const,
  },
  {
    name: "SAMA Reporting",
    code: "RISK-SAMA-RPT",
    parentCode: "RISK-SAMA",
    description: "SAMA reporting",
    unitType: "TEAM" as const,
  },
  {
    name: "PDPL Compliance",
    code: "RISK-SAMA-PDPL",
    parentCode: "RISK-SAMA",
    description: "PDPL compliance",
    unitType: "TEAM" as const,
  },
  {
    name: "External Regulatory Liaison",
    code: "RISK-SAMA-EXT",
    parentCode: "RISK-SAMA",
    description: "External regulatory liaison",
    unitType: "TEAM" as const,
  },
  {
    name: "Self-Supervisory Operations",
    code: "RISK-SSU-OPS",
    parentCode: "RISK-SSU",
    description: "Self-supervisory operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Internal Compliance Reviews",
    code: "RISK-SSU-REV",
    parentCode: "RISK-SSU",
    description: "Internal compliance reviews",
    unitType: "TEAM" as const,
  },

  // --- FINANCE Teams ---
  {
    name: "Financial Planning",
    code: "FIN-FPA-PLAN",
    parentCode: "FIN-FPA",
    description: "Financial planning",
    unitType: "TEAM" as const,
  },
  {
    name: "Budgeting & Forecasting",
    code: "FIN-FPA-BUD",
    parentCode: "FIN-FPA",
    description: "Budgeting and forecasting",
    unitType: "TEAM" as const,
  },
  {
    name: "Internal Reconciliation",
    code: "FIN-FCR-INT",
    parentCode: "FIN-FCR",
    description: "Internal reconciliation",
    unitType: "TEAM" as const,
  },
  {
    name: "Corporate Reconciliation",
    code: "FIN-FCR-CORP",
    parentCode: "FIN-FCR",
    description: "Corporate reconciliation",
    unitType: "TEAM" as const,
  },
  {
    name: "International Transfer & Merchant Reconciliation",
    code: "FIN-FCR-INTL",
    parentCode: "FIN-FCR",
    description: "International transfer and merchant reconciliation",
    unitType: "TEAM" as const,
  },
  {
    name: "Card Reconciliation",
    code: "FIN-FCR-CARD",
    parentCode: "FIN-FCR",
    description: "Card reconciliation",
    unitType: "TEAM" as const,
  },
  {
    name: "Banking Reconciliation",
    code: "FIN-FCR-BANK",
    parentCode: "FIN-FCR",
    description: "Banking reconciliation",
    unitType: "TEAM" as const,
  },
  {
    name: "Cash Management",
    code: "FIN-TREAS-CASH",
    parentCode: "FIN-TREAS",
    description: "Cash management",
    unitType: "TEAM" as const,
  },
  {
    name: "Liquidity Management",
    code: "FIN-TREAS-LIQ",
    parentCode: "FIN-TREAS",
    description: "Liquidity management",
    unitType: "TEAM" as const,
  },
  {
    name: "General Ledger",
    code: "FIN-ACCT-GL",
    parentCode: "FIN-ACCT",
    description: "General ledger",
    unitType: "TEAM" as const,
  },
  {
    name: "Accounts Payable",
    code: "FIN-ACCT-AP",
    parentCode: "FIN-ACCT",
    description: "Accounts payable",
    unitType: "TEAM" as const,
  },
  {
    name: "Accounts Receivable",
    code: "FIN-ACCT-AR",
    parentCode: "FIN-ACCT",
    description: "Accounts receivable",
    unitType: "TEAM" as const,
  },

  // --- HUMAN CAPITAL Teams ---
  {
    name: "HC Operations",
    code: "HR-OPS-CORE",
    parentCode: "HR-OPS",
    description: "HC operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Employee Relations",
    code: "HR-OPS-ER",
    parentCode: "HR-OPS",
    description: "Employee relations",
    unitType: "TEAM" as const,
  },
  {
    name: "Talent Sourcing",
    code: "HR-TA-SRC",
    parentCode: "HR-TA",
    description: "Talent sourcing",
    unitType: "TEAM" as const,
  },
  {
    name: "Hiring & Selection",
    code: "HR-TA-HIRE",
    parentCode: "HR-TA",
    description: "Hiring and selection",
    unitType: "TEAM" as const,
  },
  {
    name: "Performance Management",
    code: "HR-OD-PERF",
    parentCode: "HR-OD",
    description: "Performance management",
    unitType: "TEAM" as const,
  },
  {
    name: "Training & Development",
    code: "HR-OD-TRAIN",
    parentCode: "HR-OD",
    description: "Training and development",
    unitType: "TEAM" as const,
  },
  {
    name: "Payroll Processing",
    code: "HR-PAY-PROC",
    parentCode: "HR-PAY",
    description: "Payroll processing",
    unitType: "TEAM" as const,
  },
  {
    name: "HR Systems",
    code: "HR-PAY-SYS",
    parentCode: "HR-PAY",
    description: "HR systems",
    unitType: "TEAM" as const,
  },

  // --- MARKETING & CUSTOMER EXPERIENCE Teams ---
  {
    name: "Digital Marketing",
    code: "MCX-MKT-DIG",
    parentCode: "MCX-MKT",
    description: "Digital marketing",
    unitType: "TEAM" as const,
  },
  {
    name: "Communications",
    code: "MCX-MKT-COMM",
    parentCode: "MCX-MKT",
    description: "Communications",
    unitType: "TEAM" as const,
  },
  {
    name: "Brand Management",
    code: "MCX-MKT-BRAND",
    parentCode: "MCX-MKT",
    description: "Brand management",
    unitType: "TEAM" as const,
  },
  {
    name: "Engagement Programs",
    code: "MCX-MKT-ENG",
    parentCode: "MCX-MKT",
    description: "Engagement programs",
    unitType: "TEAM" as const,
  },
  {
    name: "Customer Experience Ops",
    code: "MCX-CX-OPS",
    parentCode: "MCX-CX",
    description: "Customer experience ops",
    unitType: "TEAM" as const,
  },
  {
    name: "Journey Mapping & UX Research",
    code: "MCX-CX-UX",
    parentCode: "MCX-CX",
    description: "Journey mapping and UX research",
    unitType: "TEAM" as const,
  },

  // --- BUSINESS & PARTNERSHIPS Teams ---
  {
    name: "Business Development",
    code: "BIZ-BD-DEV",
    parentCode: "BIZ-BD",
    description: "Business development",
    unitType: "TEAM" as const,
  },
  {
    name: "Regional Operations - Central",
    code: "BIZ-BD-CENTRAL",
    parentCode: "BIZ-BD",
    description: "Regional operations - Central",
    unitType: "TEAM" as const,
  },
  {
    name: "Regional Operations - West",
    code: "BIZ-BD-WEST",
    parentCode: "BIZ-BD",
    description: "Regional operations - West",
    unitType: "TEAM" as const,
  },
  {
    name: "Regional Operations - South",
    code: "BIZ-BD-SOUTH",
    parentCode: "BIZ-BD",
    description: "Regional operations - South",
    unitType: "TEAM" as const,
  },
  {
    name: "Regional Operations - North",
    code: "BIZ-BD-NORTH",
    parentCode: "BIZ-BD",
    description: "Regional operations - North",
    unitType: "TEAM" as const,
  },
  {
    name: "Corporate Partnerships",
    code: "BIZ-PART-CORP",
    parentCode: "BIZ-PART",
    description: "Corporate partnerships",
    unitType: "TEAM" as const,
  },
  {
    name: "Merchant Partnerships",
    code: "BIZ-PART-MERCH",
    parentCode: "BIZ-PART",
    description: "Merchant partnerships",
    unitType: "TEAM" as const,
  },
  {
    name: "Country Management",
    code: "BIZ-REMIT-CTRY",
    parentCode: "BIZ-REMIT",
    description: "Country management",
    unitType: "TEAM" as const,
  },
  {
    name: "Corridor Operations",
    code: "BIZ-REMIT-CORR",
    parentCode: "BIZ-REMIT",
    description: "Corridor operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Remittance Sales",
    code: "BIZ-REMIT-SALES",
    parentCode: "BIZ-REMIT",
    description: "Remittance sales",
    unitType: "TEAM" as const,
  },
  {
    name: "Subsidiaries Management",
    code: "BIZ-GROWTH-SUB",
    parentCode: "BIZ-GROWTH",
    description: "Subsidiaries management",
    unitType: "TEAM" as const,
  },
  {
    name: "Growth Initiatives",
    code: "BIZ-GROWTH-INIT",
    parentCode: "BIZ-GROWTH",
    description: "Growth initiatives",
    unitType: "TEAM" as const,
  },

  // --- OPERATIONS Teams ---
  {
    name: "Operations Support",
    code: "OPS-CORE-SUP",
    parentCode: "OPS-CORE",
    description: "Operations support",
    unitType: "TEAM" as const,
  },
  {
    name: "Customer Protection",
    code: "OPS-CORE-PROT",
    parentCode: "OPS-CORE",
    description: "Customer protection",
    unitType: "TEAM" as const,
  },
  {
    name: "Legal Support (Ops)",
    code: "OPS-CORE-LEGAL",
    parentCode: "OPS-CORE",
    description: "Legal support (ops-related)",
    unitType: "TEAM" as const,
  },
  {
    name: "Operation Control Officers",
    code: "OPS-PAY-OCO",
    parentCode: "OPS-PAY",
    description: "Operation control officers",
    unitType: "TEAM" as const,
  },
  {
    name: "Specialists & Senior Specialists",
    code: "OPS-PAY-SPEC",
    parentCode: "OPS-PAY",
    description: "Specialists and senior specialists",
    unitType: "TEAM" as const,
  },
  {
    name: "Acquiring Operations",
    code: "OPS-PAY-ACQ",
    parentCode: "OPS-PAY",
    description: "Acquiring operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Scheme Management",
    code: "OPS-PAY-SCHEME",
    parentCode: "OPS-PAY",
    description: "Scheme management",
    unitType: "TEAM" as const,
  },
  {
    name: "BCM Planning",
    code: "OPS-BCM-PLAN",
    parentCode: "OPS-BCM",
    description: "BCM planning",
    unitType: "TEAM" as const,
  },
  {
    name: "BCM Monitoring",
    code: "OPS-BCM-MON",
    parentCode: "OPS-BCM",
    description: "BCM monitoring",
    unitType: "TEAM" as const,
  },

  // --- CONTACT CENTER Teams ---
  {
    name: "Contact Center Agents",
    code: "CC-OPS-AGENTS",
    parentCode: "CC-OPS",
    description: "Contact center agents",
    unitType: "TEAM" as const,
  },
  {
    name: "Outbound Specialists",
    code: "CC-OPS-OUT",
    parentCode: "CC-OPS",
    description: "Outbound specialists",
    unitType: "TEAM" as const,
  },
  {
    name: "Team Leaders",
    code: "CC-OPS-TL",
    parentCode: "CC-OPS",
    description: "Team leaders",
    unitType: "TEAM" as const,
  },
  {
    name: "Operations Assistants",
    code: "CC-OPS-ASST",
    parentCode: "CC-OPS",
    description: "Operations assistants",
    unitType: "TEAM" as const,
  },
  {
    name: "Quality Assurance",
    code: "CC-QC-QA",
    parentCode: "CC-QC",
    description: "Quality assurance",
    unitType: "TEAM" as const,
  },
  {
    name: "Quality & Control Officers",
    code: "CC-QC-OFF",
    parentCode: "CC-QC",
    description: "Quality and control officers",
    unitType: "TEAM" as const,
  },
  {
    name: "Process & Procedure Specialists",
    code: "CC-QC-PROC",
    parentCode: "CC-QC",
    description: "Process and procedure specialists",
    unitType: "TEAM" as const,
  },
  {
    name: "WFM Analysts",
    code: "CC-WFM-ANLY",
    parentCode: "CC-WFM",
    description: "WFM analysts",
    unitType: "TEAM" as const,
  },
  {
    name: "WFM Managers",
    code: "CC-WFM-MGR",
    parentCode: "CC-WFM",
    description: "WFM managers",
    unitType: "TEAM" as const,
  },
  {
    name: "CC Trainers",
    code: "CC-LD-TRAIN",
    parentCode: "CC-LD",
    description: "CC trainers",
    unitType: "TEAM" as const,
  },
  {
    name: "L&D Specialists",
    code: "CC-LD-SPEC",
    parentCode: "CC-LD",
    description: "L&D specialists",
    unitType: "TEAM" as const,
  },

  // --- TECHNOLOGY Teams ---
  {
    name: "Backend Engineering",
    code: "TECH-SWE-BE",
    parentCode: "TECH-SWE",
    description: "Backend engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Frontend Engineering",
    code: "TECH-SWE-FE",
    parentCode: "TECH-SWE",
    description: "Frontend engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Mobile Development",
    code: "TECH-SWE-MOB",
    parentCode: "TECH-SWE",
    description: "Mobile development",
    unitType: "TEAM" as const,
  },
  {
    name: "Web Development",
    code: "TECH-SWE-WEB",
    parentCode: "TECH-SWE",
    description: "Web development",
    unitType: "TEAM" as const,
  },
  {
    name: "PMO for Engineering",
    code: "TECH-SWE-PMO",
    parentCode: "TECH-SWE",
    description: "PMO for engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Architecture",
    code: "TECH-SWE-ARCH",
    parentCode: "TECH-SWE",
    description: "DevSecOps and solution architecture",
    unitType: "TEAM" as const,
  },
  {
    name: "DevOps Engineering",
    code: "TECH-DEVOPS-ENG",
    parentCode: "TECH-DEVOPS",
    description: "DevOps engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Cloud Engineering",
    code: "TECH-DEVOPS-CLOUD",
    parentCode: "TECH-DEVOPS",
    description: "Cloud engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Systems Automation",
    code: "TECH-DEVOPS-AUTO",
    parentCode: "TECH-DEVOPS",
    description: "Systems automation",
    unitType: "TEAM" as const,
  },
  {
    name: "SRE",
    code: "TECH-SRE-CORE",
    parentCode: "TECH-SRE",
    description: "SRE",
    unitType: "TEAM" as const,
  },
  {
    name: "Senior SRE",
    code: "TECH-SRE-SR",
    parentCode: "TECH-SRE",
    description: "Senior SRE",
    unitType: "TEAM" as const,
  },
  {
    name: "Incident Response",
    code: "TECH-SRE-IR",
    parentCode: "TECH-SRE",
    description: "Incident response",
    unitType: "TEAM" as const,
  },
  {
    name: "Reliability Operations",
    code: "TECH-SRE-REL",
    parentCode: "TECH-SRE",
    description: "Reliability operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Data Engineering",
    code: "TECH-DATA-ENG",
    parentCode: "TECH-DATA",
    description: "Data engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "Data Science & Analytics",
    code: "TECH-DATA-SCI",
    parentCode: "TECH-DATA",
    description: "Data science and analytics",
    unitType: "TEAM" as const,
  },
  {
    name: "BI & Reporting",
    code: "TECH-DATA-BI",
    parentCode: "TECH-DATA",
    description: "BI and reporting",
    unitType: "TEAM" as const,
  },
  {
    name: "Product Managers",
    code: "TECH-PROD-PM",
    parentCode: "TECH-PROD",
    description: "Product managers",
    unitType: "TEAM" as const,
  },
  {
    name: "Technical Program Managers",
    code: "TECH-PROD-TPM",
    parentCode: "TECH-PROD",
    description: "Technical program managers",
    unitType: "TEAM" as const,
  },
  {
    name: "Product Operations",
    code: "TECH-PROD-OPS",
    parentCode: "TECH-PROD",
    description: "Product operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Helpdesk",
    code: "TECH-ITSUP-HD",
    parentCode: "TECH-ITSUP",
    description: "Helpdesk",
    unitType: "TEAM" as const,
  },
  {
    name: "Device Management",
    code: "TECH-ITSUP-MDM",
    parentCode: "TECH-ITSUP",
    description: "Device management (Jamf, MDM)",
    unitType: "TEAM" as const,
  },
  {
    name: "IT Back Office Support",
    code: "TECH-ITSUP-BO",
    parentCode: "TECH-ITSUP",
    description: "IT back office support",
    unitType: "TEAM" as const,
  },
  {
    name: "ERP Engineering",
    code: "TECH-ERP-ENG",
    parentCode: "TECH-ERP",
    description: "ERP engineering",
    unitType: "TEAM" as const,
  },
  {
    name: "ERP Support",
    code: "TECH-ERP-SUP",
    parentCode: "TECH-ERP",
    description: "ERP support",
    unitType: "TEAM" as const,
  },
  {
    name: "BCM Planning (Tech)",
    code: "TECH-BCM-PLAN",
    parentCode: "TECH-BCM",
    description: "Technology BCM planning",
    unitType: "TEAM" as const,
  },
  {
    name: "BCM Monitoring (Tech)",
    code: "TECH-BCM-MON",
    parentCode: "TECH-BCM",
    description: "Technology BCM monitoring",
    unitType: "TEAM" as const,
  },

  // --- CYBERSECURITY Teams (CISO) ---
  {
    name: "SOC Analysts",
    code: "SEC-SOC-ANLY",
    parentCode: "SEC-SOC",
    description: "SOC analysts",
    unitType: "TEAM" as const,
  },
  {
    name: "Threat Intelligence",
    code: "SEC-SOC-TI",
    parentCode: "SEC-SOC",
    description: "Threat intelligence",
    unitType: "TEAM" as const,
  },
  {
    name: "Incident Response (Sec)",
    code: "SEC-SOC-IR",
    parentCode: "SEC-SOC",
    description: "Security incident response",
    unitType: "TEAM" as const,
  },
  {
    name: "Penetration Testing",
    code: "SEC-CDC-PT",
    parentCode: "SEC-CDC",
    description: "Penetration testing",
    unitType: "TEAM" as const,
  },
  {
    name: "Red Team",
    code: "SEC-CDC-RED",
    parentCode: "SEC-CDC",
    description: "Red team",
    unitType: "TEAM" as const,
  },
  {
    name: "Blue Team",
    code: "SEC-CDC-BLUE",
    parentCode: "SEC-CDC",
    description: "Blue team",
    unitType: "TEAM" as const,
  },
  {
    name: "Security Policies",
    code: "SEC-GRC-POL",
    parentCode: "SEC-GRC",
    description: "Security policies",
    unitType: "TEAM" as const,
  },
  {
    name: "Security Audits",
    code: "SEC-GRC-AUD",
    parentCode: "SEC-GRC",
    description: "Security audits",
    unitType: "TEAM" as const,
  },
  {
    name: "Compliance Monitoring (Sec)",
    code: "SEC-GRC-COMP",
    parentCode: "SEC-GRC",
    description: "Security compliance monitoring",
    unitType: "TEAM" as const,
  },
  {
    name: "Vulnerability Assessment",
    code: "SEC-VM-VA",
    parentCode: "SEC-VM",
    description: "Vulnerability assessment",
    unitType: "TEAM" as const,
  },
  {
    name: "Patch Management",
    code: "SEC-VM-PATCH",
    parentCode: "SEC-VM",
    description: "Patch management",
    unitType: "TEAM" as const,
  },
  {
    name: "Data Classification",
    code: "SEC-PRIV-CLASS",
    parentCode: "SEC-PRIV",
    description: "Data classification",
    unitType: "TEAM" as const,
  },
  {
    name: "Privacy Operations",
    code: "SEC-PRIV-OPS",
    parentCode: "SEC-PRIV",
    description: "Privacy operations",
    unitType: "TEAM" as const,
  },

  // --- PROCUREMENT & ADMINISTRATION Teams ---
  {
    name: "Contracts & Vendor Management",
    code: "PROC-BUY-VM",
    parentCode: "PROC-BUY",
    description: "Contracts and vendor management",
    unitType: "TEAM" as const,
  },
  {
    name: "Office Management",
    code: "PROC-ADMIN-OFF",
    parentCode: "PROC-ADMIN",
    description: "Office management",
    unitType: "TEAM" as const,
  },
  {
    name: "Facilities",
    code: "PROC-ADMIN-FAC",
    parentCode: "PROC-ADMIN",
    description: "Facilities",
    unitType: "TEAM" as const,
  },
  {
    name: "Travel Booking",
    code: "PROC-TRAVEL-BOOK",
    parentCode: "PROC-TRAVEL",
    description: "Travel booking",
    unitType: "TEAM" as const,
  },
  {
    name: "Travel Coordination",
    code: "PROC-TRAVEL-COORD",
    parentCode: "PROC-TRAVEL",
    description: "Travel coordination",
    unitType: "TEAM" as const,
  },

  // --- LEGAL Teams ---
  {
    name: "Corporate Legal",
    code: "LEGAL-AFF-CORP",
    parentCode: "LEGAL-AFF",
    description: "Corporate legal",
    unitType: "TEAM" as const,
  },
  {
    name: "Litigation Support",
    code: "LEGAL-AFF-LIT",
    parentCode: "LEGAL-AFF",
    description: "Litigation support",
    unitType: "TEAM" as const,
  },
  {
    name: "Contract Drafting",
    code: "LEGAL-CONT-DRAFT",
    parentCode: "LEGAL-CONT",
    description: "Contract drafting",
    unitType: "TEAM" as const,
  },
  {
    name: "Contract Review",
    code: "LEGAL-CONT-REV",
    parentCode: "LEGAL-CONT",
    description: "Contract review",
    unitType: "TEAM" as const,
  },

  // --- CORPORATE Teams ---
  {
    name: "Corporate Administration",
    code: "CORP-SVC-ADMIN",
    parentCode: "CORP-SVC",
    description: "Corporate administration",
    unitType: "TEAM" as const,
  },
  {
    name: "Board Relations",
    code: "CORP-GOV-BOARD",
    parentCode: "CORP-GOV",
    description: "Board relations",
    unitType: "TEAM" as const,
  },
  {
    name: "Governance & Ethics",
    code: "CORP-GOV-ETH",
    parentCode: "CORP-GOV",
    description: "Governance and ethics",
    unitType: "TEAM" as const,
  },

  // --- LOYALTY & GAMING Teams ---
  {
    name: "Loyalty Operations",
    code: "LG-LOYALTY-OPS",
    parentCode: "LG-LOYALTY",
    description: "Loyalty operations",
    unitType: "TEAM" as const,
  },
  {
    name: "Rewards Management",
    code: "LG-LOYALTY-REW",
    parentCode: "LG-LOYALTY",
    description: "Rewards management",
    unitType: "TEAM" as const,
  },
  {
    name: "Gaming Platform",
    code: "LG-GAMING-PLAT",
    parentCode: "LG-GAMING",
    description: "Gaming platform",
    unitType: "TEAM" as const,
  },
  {
    name: "User Engagement Insights",
    code: "LG-GAMING-UEI",
    parentCode: "LG-GAMING",
    description: "User engagement insights",
    unitType: "TEAM" as const,
  },
] as const;

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
