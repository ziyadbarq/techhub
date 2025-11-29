/**
 * Layer 3 ITAM Seed Configuration - Kits, CIs, Disposals, Reservations
 */

// ==============================================
// Asset Kit Templates
// ==============================================

export const ASSET_KIT_TEMPLATES = [
  {
    name: "New Hire - Developer Kit",
    code: "KIT-DEV-001",
    description: "Complete setup for new software developers",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "New Hire - Standard Office Kit",
    code: "KIT-OFF-001",
    description: "Standard setup for office employees",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
    ],
  },
  {
    name: "Remote Worker Kit",
    code: "KIT-REM-001",
    description: "Complete home office setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "Conference Room Kit",
    code: "KIT-CONF-001",
    description: "Conference room equipment bundle",
    items: [
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
  {
    name: "Executive Kit",
    code: "KIT-EXEC-001",
    description: "Premium executive setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
] as const;

// ==============================================
// Configuration Item Classes
// ==============================================

/**
 * Enterprise CMDB CI Classes
 * Comprehensive classification for large-scale IT infrastructure
 * Aligned with ITIL practices, supports multi-cloud (OCI, AWS, Azure, GCP)
 */
export const CI_CLASS_DATA = [
  // ============================================
  // COMPUTE INFRASTRUCTURE
  // ============================================
  "Server",
  "Virtual Machine",
  "Hypervisor",
  "Cluster",
  "Container",
  "Container Platform",
  "Container Image",
  "Container Registry",
  "Scheduled Job",

  // ============================================
  // NETWORK INFRASTRUCTURE
  // ============================================
  "Network Device",
  "Load Balancer",
  "Firewall",
  "API Gateway",
  "DNS Server",
  "DNS Zone",
  "CDN",
  "NAT Gateway",
  "VPN Gateway",
  "Subnet",
  "Route Table",
  "Network Interface",
  "IP Address",
  "IPSec Connection",

  // ============================================
  // STORAGE INFRASTRUCTURE
  // ============================================
  "Storage System",
  "SAN",
  "NAS",
  "Block Storage",
  "Object Storage",
  "File Storage",
  "Backup System",

  // ============================================
  // DATA SERVICES
  // ============================================
  "Database",
  "Data Warehouse",
  "Cache",
  "Message Broker",
  "Stream",
  "Data Pipeline",

  // ============================================
  // APPLICATION LAYER
  // ============================================
  "Application",
  "Service",
  "Middleware",
  "Connector",

  // ============================================
  // CLOUD & PLATFORM
  // ============================================
  "Cloud Resource",
  "Cloud Account",
  "Cloud Compartment",
  "Kubernetes Namespace",

  // ============================================
  // SECURITY & IDENTITY
  // ============================================
  "Certificate",
  "Encryption Key",
  "Secrets Vault",
  "Vault",
  "IAM User",
  "IAM Group",
  "IAM Policy",

  // ============================================
  // OPERATIONS & OBSERVABILITY
  // ============================================
  "Monitoring System",
  "Log Aggregator",
  "Log Group",
] as const;

// ==============================================
// CMDB Relationship Types
// ==============================================

export const RELATIONSHIP_TYPE_DATA = [
  {
    name: "Depends On",
    code: "DEPENDS_ON",
    description: "Source depends on target for operation",
    reverseCode: "REQUIRED_BY",
    reverseName: "Required By",
    isImpacting: true,
  },
  {
    name: "Runs On",
    code: "RUNS_ON",
    description: "Source runs on target infrastructure",
    reverseCode: "HOSTS",
    reverseName: "Hosts",
    isImpacting: true,
  },
  {
    name: "Connects To",
    code: "CONNECTS_TO",
    description: "Source connects to target",
    reverseCode: "CONNECTED_BY",
    reverseName: "Connected By",
    isImpacting: false,
  },
  {
    name: "Uses",
    code: "USES",
    description: "Source uses target service/resource",
    reverseCode: "USED_BY",
    reverseName: "Used By",
    isImpacting: true,
  },
  {
    name: "Contains",
    code: "CONTAINS",
    description: "Source contains target component",
    reverseCode: "PART_OF",
    reverseName: "Part Of",
    isImpacting: true,
  },
  {
    name: "Monitors",
    code: "MONITORS",
    description: "Source monitors target",
    reverseCode: "MONITORED_BY",
    reverseName: "Monitored By",
    isImpacting: false,
  },
  {
    name: "Backs Up",
    code: "BACKS_UP",
    description: "Source backs up target",
    reverseCode: "BACKED_UP_BY",
    reverseName: "Backed Up By",
    isImpacting: false,
  },
  {
    name: "Provides Service To",
    code: "PROVIDES_TO",
    description: "Source provides service to target",
    reverseCode: "RECEIVES_FROM",
    reverseName: "Receives Service From",
    isImpacting: true,
  },
] as const;

// ==============================================
// Disposal Types and Statuses
// ==============================================

export const DISPOSAL_TYPES = {
  DONATION: "DONATION",
  SALE: "SALE",
  RECYCLE: "RECYCLE",
  SCRAP: "SCRAP",
  TRANSFER: "TRANSFER",
  DESTRUCTION: "DESTRUCTION",
} as const;

export const DISPOSAL_STATUSES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const DISPOSAL_REASONS = [
  "End of useful life - hardware failure",
  "Obsolete technology - no longer supported",
  "Upgrade to newer model",
  "Excessive repair costs",
  "Security compliance requirement",
  "Lease return",
  "Damaged beyond repair",
  "No longer needed - organizational change",
] as const;

// ==============================================
// Asset Kit Types
// ==============================================

export const KIT_TYPES = {
  NEW_HIRE: "NEW_HIRE",
  CONTRACTOR: "CONTRACTOR",
  EXECUTIVE: "EXECUTIVE",
  PROJECT: "PROJECT",
  TEMPORARY: "TEMPORARY",
  OTHER: "OTHER",
} as const;

// ==============================================
// Reservation Purposes
// ==============================================

export const RESERVATION_PURPOSES = [
  "Business travel - conference attendance",
  "Temporary project assignment",
  "Equipment testing and evaluation",
  "Training session",
  "Backup equipment during maintenance",
  "Short-term contractor use",
  "Department demo and presentation",
  "Capacity planning - load testing",
] as const;

// ==============================================
// Contract Types
// ==============================================

export const CONTRACT_TYPE_DATA = [
  {
    name: "Software License Agreement",
    code: "CT-SLA",
    description: "Agreement for software licensing and usage rights",
  },
  {
    name: "Hardware Support Agreement",
    code: "CT-HSA",
    description: "Agreement for hardware maintenance and support services",
  },
  {
    name: "Service Level Agreement",
    code: "CT-SVLA",
    description: "Agreement defining service quality and availability metrics",
  },
  {
    name: "Maintenance Contract",
    code: "CT-MAINT",
    description: "Agreement for ongoing equipment maintenance services",
  },
  {
    name: "Lease Agreement",
    code: "CT-LEASE",
    description: "Agreement for equipment or asset leasing",
  },
  {
    name: "Subscription Agreement",
    code: "CT-SUB",
    description: "Agreement for recurring subscription-based services",
  },
  {
    name: "Professional Services Agreement",
    code: "CT-PSA",
    description: "Agreement for consulting and professional services",
  },
  {
    name: "Master Service Agreement",
    code: "CT-MSA",
    description: "Umbrella agreement governing multiple service engagements",
  },
] as const;

// ==============================================
// Relationship Type Scopes (CMDB Constraints)
// ==============================================

/**
 * Defines valid source-target CI class combinations for each relationship type
 * Uses codes that match CI_CLASS_DATA and RELATIONSHIP_TYPE_DATA
 */
export const RELATIONSHIP_TYPE_SCOPE_DATA = [
  // ============================================
  // RUNS_ON - Compute/hosting relationships
  // ============================================
  // Applications run on compute infrastructure
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "CONTAINER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "CLOUD_RESOURCE",
  },

  // VMs/Containers run on hosts
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "VIRTUAL_MACHINE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "VIRTUAL_MACHINE",
    toClassCode: "HYPERVISOR",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "CONTAINER",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "CONTAINER",
    toClassCode: "CONTAINER_PLATFORM",
  },

  // Databases run on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATABASE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATABASE",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATABASE",
    toClassCode: "CLOUD_RESOURCE",
  },

  // Services run on infrastructure
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "CONTAINER_PLATFORM",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "CLOUD_RESOURCE",
  },

  // Data services run on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "CACHE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "CACHE",
    toClassCode: "CLOUD_RESOURCE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "MESSAGE_BROKER",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "MESSAGE_BROKER",
    toClassCode: "CLUSTER",
  },

  // ============================================
  // DEPENDS_ON - Service/application dependencies
  // ============================================
  // Application dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "CACHE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "MESSAGE_BROKER",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "API_GATEWAY",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "SECRETS_VAULT",
  },

  // Service dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "CACHE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "MESSAGE_BROKER",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "DNS_SERVER",
  },

  // API Gateway dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "API_GATEWAY",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "API_GATEWAY",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "API_GATEWAY",
    toClassCode: "CERTIFICATE",
  },

  // ============================================
  // CONNECTS_TO - Network connectivity
  // ============================================
  // Server connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SERVER",
    toClassCode: "NETWORK_DEVICE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SERVER",
    toClassCode: "SAN",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SERVER",
    toClassCode: "NAS",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SERVER",
    toClassCode: "LOAD_BALANCER",
  },

  // Network device connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "NETWORK_DEVICE",
    toClassCode: "NETWORK_DEVICE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "NETWORK_DEVICE",
    toClassCode: "FIREWALL",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "LOAD_BALANCER",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "FIREWALL",
    toClassCode: "NETWORK_DEVICE",
  },

  // VM/Container connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "VIRTUAL_MACHINE",
    toClassCode: "NETWORK_DEVICE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "CONTAINER_PLATFORM",
    toClassCode: "NETWORK_DEVICE",
  },

  // ============================================
  // USES - Resource consumption
  // ============================================
  // Storage usage
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "STORAGE_SYSTEM",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "DATABASE",
    toClassCode: "STORAGE_SYSTEM",
  },
  { relationshipCode: "USES", fromClassCode: "DATABASE", toClassCode: "SAN" },
  {
    relationshipCode: "USES",
    fromClassCode: "SERVER",
    toClassCode: "STORAGE_SYSTEM",
  },
  { relationshipCode: "USES", fromClassCode: "SERVER", toClassCode: "NAS" },
  {
    relationshipCode: "USES",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "STORAGE_SYSTEM",
  },

  // CDN usage
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "CDN",
  },
  { relationshipCode: "USES", fromClassCode: "SERVICE", toClassCode: "CDN" },

  // Certificate usage
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "CERTIFICATE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "SERVICE",
    toClassCode: "CERTIFICATE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "LOAD_BALANCER",
    toClassCode: "CERTIFICATE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "API_GATEWAY",
    toClassCode: "CERTIFICATE",
  },

  // ============================================
  // CONTAINS - Component hierarchy
  // ============================================
  // Cluster containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLUSTER",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLUSTER",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLUSTER",
    toClassCode: "DATABASE",
  },

  // Hypervisor/Server containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "HYPERVISOR",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "SERVER",
    toClassCode: "VIRTUAL_MACHINE",
  },

  // Container platform containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CONTAINER_PLATFORM",
    toClassCode: "CONTAINER",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CONTAINER_PLATFORM",
    toClassCode: "KUBERNETES_NAMESPACE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "KUBERNETES_NAMESPACE",
    toClassCode: "CONTAINER",
  },

  // Cloud containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_ACCOUNT",
    toClassCode: "CLOUD_RESOURCE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_RESOURCE",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_RESOURCE",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_RESOURCE",
    toClassCode: "CONTAINER_PLATFORM",
  },

  // ============================================
  // MONITORS - Monitoring relationships
  // ============================================
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "CONTAINER_PLATFORM",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "CLUSTER",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "NETWORK_DEVICE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "CONTAINER_PLATFORM",
  },

  // ============================================
  // BACKS_UP - Backup relationships
  // ============================================
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "STORAGE_SYSTEM",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "DATA_WAREHOUSE",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "BLOCK_STORAGE",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "OBJECT_STORAGE",
  },
  {
    relationshipCode: "BACKS_UP",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "FILE_STORAGE",
  },

  // ============================================
  // PROVIDES_TO - Service provisioning
  // ============================================
  // DNS provides to applications/services
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "DNS_SERVER",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "DNS_SERVER",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "DNS_ZONE",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "DNS_ZONE",
    toClassCode: "SERVICE",
  },

  // Gateway provisioning
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "NAT_GATEWAY",
    toClassCode: "SUBNET",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "NAT_GATEWAY",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "VPN_GATEWAY",
    toClassCode: "SUBNET",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "VPN_GATEWAY",
    toClassCode: "VIRTUAL_MACHINE",
  },

  // Vault provides secrets
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "VAULT",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "VAULT",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "SECRETS_VAULT",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "PROVIDES_TO",
    fromClassCode: "SECRETS_VAULT",
    toClassCode: "SERVICE",
  },

  // ============================================
  // ADDITIONAL RUNS_ON - New compute relationships
  // ============================================
  // Scheduled jobs run on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "CONTAINER_PLATFORM",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "CLOUD_RESOURCE",
  },

  // Data pipeline runs on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "CLOUD_RESOURCE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "CONTAINER_PLATFORM",
  },

  // Stream runs on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "STREAM",
    toClassCode: "CLUSTER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "STREAM",
    toClassCode: "CLOUD_RESOURCE",
  },

  // Middleware runs on compute
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "MIDDLEWARE",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "MIDDLEWARE",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "RUNS_ON",
    fromClassCode: "MIDDLEWARE",
    toClassCode: "CONTAINER_PLATFORM",
  },

  // ============================================
  // ADDITIONAL DEPENDS_ON - New dependencies
  // ============================================
  // Scheduled job dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SCHEDULED_JOB",
    toClassCode: "SERVICE",
  },

  // Data pipeline dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "DATA_WAREHOUSE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "STREAM",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "OBJECT_STORAGE",
  },

  // Stream dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "STREAM",
    toClassCode: "MESSAGE_BROKER",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "STREAM",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "SERVICE",
    toClassCode: "STREAM",
  },

  // Connector dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "CONNECTOR",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "CONNECTOR",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "CONNECTOR",
    toClassCode: "SERVICE",
  },

  // Security dependencies
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "APPLICATION",
    toClassCode: "VAULT",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "DATABASE",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "OBJECT_STORAGE",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "DEPENDS_ON",
    fromClassCode: "BLOCK_STORAGE",
    toClassCode: "ENCRYPTION_KEY",
  },

  // ============================================
  // ADDITIONAL CONNECTS_TO - Network connectivity
  // ============================================
  // Gateway connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "NAT_GATEWAY",
    toClassCode: "SUBNET",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "VPN_GATEWAY",
    toClassCode: "NETWORK_DEVICE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "VPN_GATEWAY",
    toClassCode: "VPN_GATEWAY",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "IPSEC_CONNECTION",
    toClassCode: "VPN_GATEWAY",
  },

  // Subnet connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SUBNET",
    toClassCode: "ROUTE_TABLE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "SUBNET",
    toClassCode: "NAT_GATEWAY",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "ROUTE_TABLE",
    toClassCode: "NAT_GATEWAY",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "ROUTE_TABLE",
    toClassCode: "VPN_GATEWAY",
  },

  // Network interface connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "NETWORK_INTERFACE",
    toClassCode: "SUBNET",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "NETWORK_INTERFACE",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "VIRTUAL_MACHINE",
    toClassCode: "NETWORK_INTERFACE",
  },

  // Connector connectivity
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "CONNECTOR",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "CONNECTS_TO",
    fromClassCode: "CONNECTOR",
    toClassCode: "DATABASE",
  },

  // ============================================
  // ADDITIONAL USES - Resource consumption
  // ============================================
  // Cloud storage usage
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "OBJECT_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "BLOCK_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "FILE_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "DATABASE",
    toClassCode: "BLOCK_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "VIRTUAL_MACHINE",
    toClassCode: "BLOCK_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "CONTAINER_PLATFORM",
    toClassCode: "FILE_STORAGE",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "BACKUP_SYSTEM",
    toClassCode: "OBJECT_STORAGE",
  },

  // Network interface uses IP
  {
    relationshipCode: "USES",
    fromClassCode: "NETWORK_INTERFACE",
    toClassCode: "IP_ADDRESS",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "LOAD_BALANCER",
    toClassCode: "IP_ADDRESS",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "NAT_GATEWAY",
    toClassCode: "IP_ADDRESS",
  },

  // Encryption key usage
  {
    relationshipCode: "USES",
    fromClassCode: "DATABASE",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "STORAGE_SYSTEM",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "SECRETS_VAULT",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "OBJECT_STORAGE",
    toClassCode: "ENCRYPTION_KEY",
  },

  // Data services usage
  {
    relationshipCode: "USES",
    fromClassCode: "DATA_PIPELINE",
    toClassCode: "STREAM",
  },
  {
    relationshipCode: "USES",
    fromClassCode: "APPLICATION",
    toClassCode: "DATA_PIPELINE",
  },

  // ============================================
  // ADDITIONAL CONTAINS - Component hierarchy
  // ============================================
  // Cloud compartment containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_ACCOUNT",
    toClassCode: "CLOUD_COMPARTMENT",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "CLOUD_RESOURCE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "CONTAINER_PLATFORM",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "OBJECT_STORAGE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_COMPARTMENT",
    toClassCode: "BLOCK_STORAGE",
  },

  // Container registry containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CONTAINER_REGISTRY",
    toClassCode: "CONTAINER_IMAGE",
  },

  // Subnet containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "SUBNET",
    toClassCode: "NETWORK_INTERFACE",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "SUBNET",
    toClassCode: "IP_ADDRESS",
  },

  // Vault containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "VAULT",
    toClassCode: "ENCRYPTION_KEY",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "SECRETS_VAULT",
    toClassCode: "ENCRYPTION_KEY",
  },

  // IAM containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "IAM_GROUP",
    toClassCode: "IAM_USER",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_ACCOUNT",
    toClassCode: "IAM_USER",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_ACCOUNT",
    toClassCode: "IAM_GROUP",
  },
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "CLOUD_ACCOUNT",
    toClassCode: "IAM_POLICY",
  },

  // Log group containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "LOG_GROUP",
  },

  // DNS zone containment
  {
    relationshipCode: "CONTAINS",
    fromClassCode: "DNS_SERVER",
    toClassCode: "DNS_ZONE",
  },

  // ============================================
  // ADDITIONAL MONITORS - Observability
  // ============================================
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "VIRTUAL_MACHINE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "LOAD_BALANCER",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "API_GATEWAY",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "NAT_GATEWAY",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "MONITORING_SYSTEM",
    toClassCode: "VPN_GATEWAY",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "DATABASE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_AGGREGATOR",
    toClassCode: "SERVER",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_GROUP",
    toClassCode: "APPLICATION",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_GROUP",
    toClassCode: "SERVICE",
  },
  {
    relationshipCode: "MONITORS",
    fromClassCode: "LOG_GROUP",
    toClassCode: "CONTAINER",
  },
] as const;
