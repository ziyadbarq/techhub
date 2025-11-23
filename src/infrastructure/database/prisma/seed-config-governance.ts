/**
 * Governance Seed Configuration - Data Domains, Ownerships, Verification Campaigns
 */

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
];
