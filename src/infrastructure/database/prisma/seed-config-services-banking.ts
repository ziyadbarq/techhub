/**
 * Core Banking Services Seed Configuration
 *
 * Defines core banking services for Barq's payment and wallet platform.
 * Includes wallet management, payments processing, accounting, and merchant services.
 *
 * NOTE: Service ownership is NOT defined here.
 * - Production: Use scripts/import-service-ownership.ts with service_owners.json
 * - Dev: seedServiceOwners() links services to DEMO_PERSONS (dev preset only)
 */

export const BANKING_SERVICES = [
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
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-merchant",
    },
  },
] as const;
