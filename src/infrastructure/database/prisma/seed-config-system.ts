/**
 * System Seed Configuration - Services, Business Processes, Attachments, Exchange Rates
 */

// ==============================================
// Attachment Types
// ==============================================

export const ATTACHMENT_TYPES = [
  {
    name: "Invoice",
    code: "ATT-INV",
    description: "Financial invoices and billing documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Certificate",
    code: "ATT-CERT",
    description: "Certificates of authenticity, compliance, and completion",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Photo",
    code: "ATT-PHOTO",
    description: "Asset photos and visual documentation",
    allowedExtensions: ["jpg", "jpeg", "png", "heic"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Document",
    code: "ATT-DOC",
    description: "General documents and text files",
    allowedExtensions: ["pdf", "doc", "docx"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "Spreadsheet",
    code: "ATT-SHEET",
    description: "Spreadsheets and data tables",
    allowedExtensions: ["xls", "xlsx", "csv"],
    maxFileSizeMB: 15,
    isActive: true,
  },
  {
    name: "Warranty Document",
    code: "ATT-WARR",
    description: "Warranty certificates and terms documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Disposal Certificate",
    code: "ATT-DISP",
    description: "Asset disposal and sanitization certificates",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Audit Report",
    code: "ATT-AUDIT",
    description: "Compliance and internal audit reports",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "License Agreement",
    code: "ATT-LIC",
    description: "Software license agreements and terms",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Network Diagram",
    code: "ATT-NET",
    description: "Network topology diagrams and architecture documents",
    allowedExtensions: ["pdf", "png", "svg"],
    maxFileSizeMB: 10,
    isActive: true,
  },
];

export const SERVICE_DATA = [
  // Core Banking Services
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-merchant",
    },
  },

  // Authentication & Security
  {
    name: "Active Directory",
    serviceType: "APPLICATION" as const,
    description:
      "Microsoft Active Directory for employee authentication and directory services",
    businessPurpose: "Central employee identity and access management",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "MSFT",
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.1.10",
      hostname: "ad-dc01.barq.local",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Keycloak",
    serviceType: "APPLICATION" as const,
    description:
      "Open-source identity and access management for customer authentication",
    businessPurpose:
      "Provides SSO and identity federation for customer-facing applications",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/keycloak",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "IDENTITY_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Auth Service",
    serviceType: "APPLICATION" as const,
    description:
      "Custom authentication service with OTP, biometric, and device fingerprinting",
    businessPurpose: "Multi-factor authentication for enhanced security",
    gitlabRepoUrl: "https://gitlab.barq.com/security/auth-service",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },

  // Channels - Mobile Apps
  {
    name: "Mobile iOS App",
    serviceType: "ENDPOINT" as const,
    description: "Barq customer mobile application for iOS platform",
    businessPurpose: "Primary customer channel for mobile banking services",
    gitlabRepoUrl: "https://gitlab.barq.com/mobile/ios-app",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Mobile Android App",
    serviceType: "ENDPOINT" as const,
    description: "Barq customer mobile application for Android platform",
    businessPurpose: "Primary customer channel for mobile banking services",
    gitlabRepoUrl: "https://gitlab.barq.com/mobile/android-app",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
  },
  {
    name: "Business Portal",
    serviceType: "APPLICATION" as const,
    description: "Web portal for business customers and merchants",
    businessPurpose:
      "Self-service portal for business account management and reporting",
    gitlabRepoUrl: "https://gitlab.barq.com/web/business-portal",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WEB_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-channels",
    },
  },
  {
    name: "Customer Portal",
    serviceType: "APPLICATION" as const,
    description: "Web portal for individual customers",
    businessPurpose: "Web-based access to banking services for customers",
    gitlabRepoUrl: "https://gitlab.barq.com/web/customer-portal",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WEB_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-channels",
    },
  },

  // Infrastructure - Workflow & Automation
  {
    name: "Airflow",
    serviceType: "MIDDLEWARE" as const,
    description:
      "Apache Airflow for workflow orchestration and data pipeline management",
    businessPurpose:
      "Automates ETL jobs, reporting, and batch processing workflows",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/airflow",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "WORKFLOW_AUTOMATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
    },
  },
  {
    name: "Redis Cluster",
    serviceType: "DATABASE" as const,
    description: "Redis cluster for caching and session management",
    businessPurpose:
      "High-performance caching to reduce database load and improve response times",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      ipAddress: "10.10.5.10",
    },
  },
  {
    name: "PostgreSQL Cluster",
    serviceType: "DATABASE" as const,
    description: "PostgreSQL database cluster for application data",
    businessPurpose:
      "Primary relational database for non-core banking applications",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Kafka Cluster",
    serviceType: "MIDDLEWARE" as const,
    description:
      "Apache Kafka for event streaming and real-time data pipelines",
    businessPurpose:
      "Enables real-time event processing and microservice communication",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/kafka",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "RabbitMQ",
    serviceType: "MIDDLEWARE" as const,
    description: "RabbitMQ message broker for async task processing",
    businessPurpose: "Handles background jobs and asynchronous processing",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/rabbitmq",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },

  // Third-party Integrations
  {
    name: "eMcREY Integration",
    serviceType: "API" as const,
    description: "Integration with eMcREY payment gateway for card processing",
    businessPurpose: "Enables credit/debit card payment acceptance",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "PAYMENT_INTEGRATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
  },
  {
    name: "HyperPay Integration",
    serviceType: "API" as const,
    description: "Integration with HyperPay for online payment processing",
    businessPurpose: "Alternative payment gateway for online transactions",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "PAYMENT_INTEGRATION",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Oracle CRM",
    serviceType: "APPLICATION" as const,
    description: "Oracle CRM system for customer relationship management",
    businessPurpose:
      "Manages customer interactions, support tickets, and sales pipeline",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "ORACLE",
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
    },
  },
  {
    name: "Odoo ERP",
    serviceType: "APPLICATION" as const,
    description: "Odoo ERP for business operations and financial management",
    businessPurpose:
      "Manages HR, procurement, inventory, and financial operations",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ERP_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },

  // Developer Tools
  {
    name: "Tyk API Gateway",
    serviceType: "MIDDLEWARE" as const,
    description: "API gateway for routing, rate limiting, and API management",
    businessPurpose: "Centralized API management and security enforcement",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/tyk",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-gateway",
    },
  },
  {
    name: "Unleash Feature Flags",
    serviceType: "APPLICATION" as const,
    description: "Feature flag management for gradual rollouts and A/B testing",
    businessPurpose: "Enables safe feature deployment and experimentation",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/unleash",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },
  {
    name: "Retool Internal Tools",
    serviceType: "APPLICATION" as const,
    description: "Low-code platform for building internal admin tools",
    businessPurpose: "Rapid development of internal dashboards and tools",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Faisal Al-Harbi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },
  {
    name: "Redash Analytics",
    serviceType: "APPLICATION" as const,
    description: "SQL-based analytics and visualization platform",
    businessPurpose: "Business intelligence and data exploration for analysts",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/redash",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-analytics",
    },
  },
  {
    name: "GitLab CI/CD",
    serviceType: "APPLICATION" as const,
    description: "GitLab for source control and CI/CD pipelines",
    businessPurpose: "Version control and automated deployment pipelines",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-devtools",
    },
  },

  // Databases
  {
    name: "Oracle Core DB",
    serviceType: "DATABASE" as const,
    description: "Oracle database for core banking system",
    businessPurpose:
      "Mission-critical database for all banking transactions and accounts",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "ORACLE",
    businessProcessCode: "CORE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Abdullah Al-Harthi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "oracle-db01.barq.local",
      backupEnabled: true,
      backupSchedule: "hourly",
    },
  },
  {
    name: "MongoDB Cluster",
    serviceType: "DATABASE" as const,
    description: "MongoDB for document storage and analytics data",
    businessPurpose:
      "NoSQL database for flexible schema and analytics workloads",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/mongodb",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Elasticsearch Cluster",
    serviceType: "DATABASE" as const,
    description: "Elasticsearch for log aggregation and full-text search",
    businessPurpose: "Centralized logging and search capabilities",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/elasticsearch",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },

  // Cloud Services
  {
    name: "OCI Object Storage",
    serviceType: "STORAGE" as const,
    description:
      "Oracle Cloud Infrastructure object storage for files and backups",
    businessPurpose:
      "Scalable cloud storage for documents, images, and backups",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Jeddah",
      compartment: "prod-storage",
    },
  },
  {
    name: "GCP Cloud Storage",
    serviceType: "STORAGE" as const,
    description:
      "Google Cloud Storage for disaster recovery and analytics data",
    businessPurpose: "Secondary cloud storage for DR and data lake",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "GCP_CLOUD" as const,
      cloudProvider: "GCP",
      region: "europe-west3",
      project: "barq-prod-dr",
    },
  },
  {
    name: "OCI Load Balancer",
    serviceType: "NETWORK" as const,
    description: "OCI load balancing service for traffic distribution",
    businessPurpose:
      "High availability and traffic distribution for web services",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-network",
    },
  },

  // APIs
  {
    name: "Customer API",
    serviceType: "API" as const,
    description: "RESTful API for customer mobile and web applications",
    businessPurpose: "Primary API for customer-facing channels",
    gitlabRepoUrl: "https://gitlab.barq.com/api/customer-api",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
      {
        type: "PRODUCT" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Partner API",
    serviceType: "API" as const,
    description: "API for third-party integrations and partner access",
    businessPurpose: "Enables partner integrations and open banking APIs",
    gitlabRepoUrl: "https://gitlab.barq.com/api/partner-api",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Maha Al-Otaibi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Internal API",
    serviceType: "API" as const,
    description: "Internal API for microservice communication",
    businessPurpose:
      "Service-to-service communication and internal integrations",
    gitlabRepoUrl: "https://gitlab.barq.com/api/internal-api",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },
  {
    name: "Webhook Service",
    serviceType: "API" as const,
    description: "Webhook delivery service for real-time event notifications",
    businessPurpose:
      "Sends event notifications to external systems and partners",
    gitlabRepoUrl: "https://gitlab.barq.com/api/webhook-service",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-api",
    },
  },

  // Middleware
  {
    name: "Message Broker",
    serviceType: "MIDDLEWARE" as const,
    description: "Central message broker for async communication",
    businessPurpose: "Decouples services and enables async processing",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/message-broker",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "Event Bus",
    serviceType: "MIDDLEWARE" as const,
    description: "Event-driven architecture bus for domain events",
    businessPurpose: "Enables event-driven microservices communication",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/event-bus",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MESSAGE_QUEUE",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-messaging",
    },
  },
  {
    name: "Service Mesh",
    serviceType: "NETWORK" as const,
    description: "Service mesh for microservice networking and observability",
    businessPurpose:
      "Provides service discovery, load balancing, and traffic management",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/service-mesh",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-network",
    },
  },

  // Monitoring & Observability
  {
    name: "Grafana",
    serviceType: "APPLICATION" as const,
    description: "Grafana for metrics visualization and dashboards",
    businessPurpose: "Real-time monitoring dashboards for system health",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/grafana",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Prometheus",
    serviceType: "APPLICATION" as const,
    description: "Prometheus for metrics collection and alerting",
    businessPurpose: "Collects and stores time-series metrics for monitoring",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/prometheus",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Jaeger Tracing",
    serviceType: "APPLICATION" as const,
    description: "Distributed tracing system for microservices",
    businessPurpose: "Traces requests across microservices for debugging",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/jaeger",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "Sentry Error Tracking",
    serviceType: "APPLICATION" as const,
    description: "Sentry for application error tracking and reporting",
    businessPurpose:
      "Captures and tracks application errors for faster resolution",
    gitlabRepoUrl: "https://gitlab.barq.com/infra/sentry",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MONITORING_OBSERVABILITY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-monitoring",
    },
  },
  {
    name: "PagerDuty",
    serviceType: "APPLICATION" as const,
    description: "PagerDuty for incident management and on-call scheduling",
    businessPurpose: "Manages incident alerts and on-call rotations",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "INCIDENT_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
  },

  // Backup & DR
  {
    name: "Veeam Backup",
    serviceType: "APPLICATION" as const,
    description: "Veeam backup solution for VM and database backups",
    businessPurpose: "Enterprise backup and disaster recovery",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "veeam-backup01.barq.local",
    },
  },

  // Security & Compliance
  {
    name: "Vault Secrets Management",
    serviceType: "APPLICATION" as const,
    description: "HashiCorp Vault for secrets and encryption key management",
    businessPurpose: "Centralized secrets management and encryption",
    gitlabRepoUrl: "https://gitlab.barq.com/security/vault",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-security",
    },
  },
  {
    name: "Splunk SIEM",
    serviceType: "APPLICATION" as const,
    description: "Splunk for security information and event management",
    businessPurpose: "Security monitoring and compliance reporting",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "COMPLIANCE_AUDIT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
    },
  },
  {
    name: "CyberArk PAM",
    serviceType: "APPLICATION" as const,
    description: "CyberArk Privileged Access Management",
    businessPurpose:
      "Manages and secures privileged access to critical systems",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "cyberark01.barq.local",
    },
  },

  // Testing & QA
  {
    name: "UAT Environment",
    serviceType: "SERVER" as const,
    description:
      "User Acceptance Testing environment for pre-production testing",
    businessPurpose:
      "Testing environment for validating changes before production",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "UAT" as const,
    businessProcessCode: "DEPLOYMENT_CICD",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Faisal Al-Harbi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "uat-environment",
    },
  },
  {
    name: "DR Environment",
    serviceType: "SERVER" as const,
    description: "Disaster Recovery environment for business continuity",
    businessPurpose: "Standby environment for disaster recovery scenarios",
    dataConfidentiality: "RESTRICTED" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "DR" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "GCP_CLOUD" as const,
      cloudProvider: "GCP",
      region: "europe-west3",
      project: "barq-dr",
    },
  },

  // Network Infrastructure
  {
    name: "Cisco Firewall",
    serviceType: "NETWORK" as const,
    description: "Cisco ASA firewall for network security",
    businessPurpose: "Network perimeter security and traffic filtering",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "CRITICAL" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "CISCO",
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.1",
      hostname: "fw01.barq.local",
    },
  },
  {
    name: "VPN Gateway",
    serviceType: "NETWORK" as const,
    description: "VPN gateway for secure remote access",
    businessPurpose: "Enables secure remote access for employees",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "ACCESS_CONTROL",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Saud Al-Ajmi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.0.5",
      hostname: "vpn01.barq.local",
    },
  },
  {
    name: "DNS Server",
    serviceType: "NETWORK" as const,
    description: "Internal DNS server for name resolution",
    businessPurpose: "DNS resolution for internal services",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "API_GATEWAY",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      ipAddress: "10.0.1.53",
      hostname: "dns01.barq.local",
    },
  },

  // Communication & Collaboration
  {
    name: "Email Server",
    serviceType: "APPLICATION" as const,
    description: "Microsoft Exchange for corporate email",
    businessPurpose: "Internal and external email communication",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    vendorCode: "MSFT",
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Mohammed Al-Qarni",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "ON_PREM" as const,
      region: "Riyadh",
      hostname: "exchange01.barq.local",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "Slack",
    serviceType: "APPLICATION" as const,
    description: "Slack for team communication and collaboration",
    businessPurpose: "Real-time team communication platform",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Sara Al-Mutairi",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Jira",
    serviceType: "APPLICATION" as const,
    description: "Atlassian Jira for project management and issue tracking",
    businessPurpose: "Agile project management and task tracking",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "INCIDENT_MGMT",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },
  {
    name: "Confluence",
    serviceType: "APPLICATION" as const,
    description: "Atlassian Confluence for documentation and knowledge base",
    businessPurpose: "Central documentation repository",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "LOW" as const,
    criticality: "LOW" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Sara Al-Mutairi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-apps",
    },
  },

  // Data & Analytics
  {
    name: "Data Warehouse",
    serviceType: "DATABASE" as const,
    description: "Enterprise data warehouse for analytics and reporting",
    businessPurpose: "Centralized analytics platform for business intelligence",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "REPORTING_ANALYTICS",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Hanan Al-Subai",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-analytics",
      backupEnabled: true,
      backupSchedule: "daily",
    },
  },
  {
    name: "ETL Pipeline",
    serviceType: "MIDDLEWARE" as const,
    description: "Extract, Transform, Load pipeline for data integration",
    businessPurpose: "Moves data from operational systems to data warehouse",
    gitlabRepoUrl: "https://gitlab.barq.com/data/etl-pipeline",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "DATA_PLATFORM",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Tariq Al-Shamrani",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-data",
    },
  },

  // Notification Services
  {
    name: "SMS Gateway",
    serviceType: "API" as const,
    description: "SMS gateway for sending OTP and notifications",
    businessPurpose: "Delivers SMS notifications to customers",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "HIGH" as const,
    criticality: "HIGH" as const,
    isEssentialService: true,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Fatima Al-Zahrani",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Email Gateway",
    serviceType: "API" as const,
    description: "Email delivery service for customer notifications",
    businessPurpose: "Sends transactional emails to customers",
    gitlabRepoUrl: "https://gitlab.barq.com/api/email-gateway",
    dataConfidentiality: "CONFIDENTIAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "CRM_SERVICES",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Layla Al-Dosari",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-notifications",
    },
  },
  {
    name: "Push Notification Service",
    serviceType: "API" as const,
    description: "Push notification service for mobile apps",
    businessPurpose: "Sends push notifications to mobile applications",
    gitlabRepoUrl: "https://gitlab.barq.com/api/push-notifications",
    dataConfidentiality: "INTERNAL" as const,
    businessImpactLevel: "MEDIUM" as const,
    criticality: "MEDIUM" as const,
    isEssentialService: false,
    currentStatus: "PRODUCTION" as const,
    businessProcessCode: "MOBILE_BANKING",
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Khalid Al-Ghamdi",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-notifications",
    },
  },

  // Fraud & Risk
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: false,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Noura Al-Rashid",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Aisha Al-Malki",
        isPrimary: false,
      },
    ],
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Omar Al-Shehri",
        isPrimary: true,
      },
    ],
  },
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
    owners: [
      {
        type: "TECHNICAL" as const,
        personName: "Aisha Al-Malki",
        isPrimary: true,
      },
      {
        type: "BUSINESS" as const,
        personName: "Ahmed Al-Mansour",
        isPrimary: true,
      },
    ],
    infrastructure: {
      location: "OCI_CLOUD" as const,
      cloudProvider: "OCI",
      region: "Riyadh",
      compartment: "prod-compliance",
    },
  },
] as const;

export const BUSINESS_PROCESS_DATA = [
  // Core Banking
  {
    code: "CORE_BANKING",
    name: "Core Banking Platform",
    description: "Central banking operations and account management",
    category: "Core Banking",
  },
  {
    code: "DIGITAL_PAYMENTS",
    name: "Digital Payments Processing",
    description: "Payment transaction processing and settlement",
    category: "Core Banking",
  },
  {
    code: "WALLET_SERVICES",
    name: "Digital Wallet Services",
    description: "Digital wallet creation and management",
    category: "Core Banking",
  },
  {
    code: "TRANSFER_SERVICES",
    name: "Transfer Services",
    description: "Money transfer and remittance operations",
    category: "Core Banking",
  },
  {
    code: "MERCHANT_SERVICES",
    name: "Merchant Services",
    description: "Merchant onboarding and payment acceptance",
    category: "Core Banking",
  },

  // Authentication & Security
  {
    code: "IDENTITY_MGMT",
    name: "Identity Management",
    description: "User authentication and identity services",
    category: "Security",
  },
  {
    code: "ACCESS_CONTROL",
    name: "Access Control",
    description: "Authorization and access management",
    category: "Security",
  },

  // Channels
  {
    code: "MOBILE_BANKING",
    name: "Mobile Banking",
    description: "Mobile application services for customers",
    category: "Channels",
  },
  {
    code: "WEB_BANKING",
    name: "Web Banking",
    description: "Web portal for customer and business banking",
    category: "Channels",
  },
  {
    code: "API_BANKING",
    name: "API Banking",
    description: "Open banking APIs for partners",
    category: "Channels",
  },

  // Infrastructure
  {
    code: "DATA_PLATFORM",
    name: "Data Platform",
    description: "Data storage, processing, and analytics",
    category: "Infrastructure",
  },
  {
    code: "MESSAGE_QUEUE",
    name: "Message Queue Services",
    description: "Asynchronous messaging and event streaming",
    category: "Infrastructure",
  },
  {
    code: "API_GATEWAY",
    name: "API Gateway",
    description: "API management and routing",
    category: "Infrastructure",
  },
  {
    code: "WORKFLOW_AUTOMATION",
    name: "Workflow Automation",
    description: "Business process automation and orchestration",
    category: "Infrastructure",
  },

  // Integration
  {
    code: "PAYMENT_INTEGRATION",
    name: "Payment Gateway Integration",
    description: "Integration with external payment providers",
    category: "Integration",
  },
  {
    code: "BANK_INTEGRATION",
    name: "Bank Integration",
    description: "Integration with banking partners",
    category: "Integration",
  },
  {
    code: "GOVT_INTEGRATION",
    name: "Government Services Integration",
    description: "Integration with government services and regulations",
    category: "Integration",
  },

  // Support Systems
  {
    code: "CRM_SERVICES",
    name: "Customer Relationship Management",
    description: "Customer support and relationship management",
    category: "Support",
  },
  {
    code: "ERP_SERVICES",
    name: "Enterprise Resource Planning",
    description: "Business operations and financial management",
    category: "Support",
  },
  {
    code: "REPORTING_ANALYTICS",
    name: "Reporting & Analytics",
    description: "Business intelligence and reporting",
    category: "Support",
  },

  // Monitoring & Operations
  {
    code: "MONITORING_OBSERVABILITY",
    name: "Monitoring & Observability",
    description: "System monitoring and observability",
    category: "Operations",
  },
  {
    code: "INCIDENT_MGMT",
    name: "Incident Management",
    description: "Incident response and problem management",
    category: "Operations",
  },
  {
    code: "DEPLOYMENT_CICD",
    name: "CI/CD Pipeline",
    description: "Continuous integration and deployment",
    category: "Operations",
  },

  // Compliance
  {
    code: "COMPLIANCE_AUDIT",
    name: "Compliance & Audit",
    description: "Regulatory compliance and audit logging",
    category: "Compliance",
  },
  {
    code: "DATA_PRIVACY",
    name: "Data Privacy & Protection",
    description: "Data privacy compliance and protection",
    category: "Compliance",
  },
] as const;

export const EXCHANGE_RATE_DATA = [
  { currency: "USD", rateToSAR: 3.75, isActive: true }, // US Dollar
  { currency: "EUR", rateToSAR: 4.08, isActive: true }, // Euro
  { currency: "GBP", rateToSAR: 4.75, isActive: true }, // British Pound
  { currency: "JPY", rateToSAR: 0.025, isActive: true }, // Japanese Yen
  { currency: "AUD", rateToSAR: 2.45, isActive: true }, // Australian Dollar
  { currency: "CAD", rateToSAR: 2.7, isActive: true }, // Canadian Dollar
  { currency: "CHF", rateToSAR: 4.2, isActive: true }, // Swiss Franc
  { currency: "CNY", rateToSAR: 0.52, isActive: true }, // Chinese Yuan
  { currency: "INR", rateToSAR: 0.045, isActive: true }, // Indian Rupee
  { currency: "AED", rateToSAR: 1.02, isActive: true }, // UAE Dirham
  { currency: "KWD", rateToSAR: 12.2, isActive: true }, // Kuwaiti Dinar
  { currency: "BHD", rateToSAR: 9.95, isActive: true }, // Bahraini Dinar
  { currency: "OMR", rateToSAR: 9.75, isActive: true }, // Omani Rial
  { currency: "QAR", rateToSAR: 1.03, isActive: true }, // Qatari Riyal
] as const;
