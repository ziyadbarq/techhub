/**
 * Business Processes Seed Configuration
 *
 * Defines business processes for the Service Management module.
 * Links IT services to business capabilities and operations.
 */

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
