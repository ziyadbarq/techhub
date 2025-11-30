/**
 * Compliance & Fraud Services Seed Configuration
 *
 * Defines compliance, fraud detection, KYC, and regulatory reporting services.
 * Critical for SAMA (Saudi Central Bank) compliance and financial regulations.
 *
 * NOTE: Service ownership is NOT defined here.
 * - Production: Use scripts/import-service-ownership.ts with service_owners.json
 * - Dev: seedServiceOwners() links services to DEMO_PERSONS (dev preset only)
 */

export const COMPLIANCE_SERVICES = [
  // Fraud Detection & Risk Management
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
  },

  // Regulatory Reporting
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
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-compliance",
    },
  },
] as const;
