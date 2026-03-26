/**
 * OCI Service-to-CI-Class Mapping
 *
 * Maps OCI service types to CMDB CI class codes, and provides
 * utility functions for environment inference and lifecycle state mapping.
 */

import { createHash } from "node:crypto";
import type { OciServiceKey, OciRawResource } from "./oci-resource.types";
import type { OciSyncAttributeSource } from "./oci-sync-source";

// ========================================
// Service → CI Class Mapping
// ========================================

export interface OciServiceMapping {
  ciClassCode: string;
  /** Extra attribute key to distinguish services sharing a CI class */
  discriminator?: { key: string; value: string };
}

const OCI_HASHED_CI_KEY_HASH_LENGTH = 40;
const SAFE_CI_KEY_PATTERN = /^[a-zA-Z0-9._-]+$/;

function createHashedCiKey(prefix: string, source: string): string {
  const hash = createHash("sha256")
    .update(source)
    .digest("hex")
    .slice(0, OCI_HASHED_CI_KEY_HASH_LENGTH);

  return `${prefix}${hash}`;
}

function isSafeCiKey(candidate: string): boolean {
  return (
    candidate.length >= 2 &&
    candidate.length <= 100 &&
    SAFE_CI_KEY_PATTERN.test(candidate)
  );
}

function toBoundedCiKey(serviceKey: OciServiceKey, rawId: string): string {
  if (isSafeCiKey(rawId)) {
    return rawId;
  }

  return createHashedCiKey(`oci.${serviceKey}.`, rawId);
}

/**
 * Maps each OCI service key to its target CMDB CI class code.
 * Some services share a CI class and are differentiated via a discriminator attribute.
 */
export const OCI_SERVICE_CLASS_MAP: Record<OciServiceKey, OciServiceMapping> = {
  compute: { ciClassCode: "VIRTUAL_MACHINE" },
  lb: {
    ciClassCode: "LOAD_BALANCER",
    discriminator: { key: "LB_TYPE", value: "APPLICATION" },
  },
  nlb: {
    ciClassCode: "LOAD_BALANCER",
    discriminator: { key: "LB_TYPE", value: "NETWORK" },
  },
  oke: { ciClassCode: "CONTAINER_PLATFORM" },
  buckets: { ciClassCode: "OBJECT_STORAGE" },
  postgresql: {
    ciClassCode: "DATABASE",
    discriminator: { key: "DB_ENGINE", value: "postgresql" },
  },
  mysql: {
    ciClassCode: "DATABASE",
    discriminator: { key: "DB_ENGINE", value: "mysql" },
  },
  dbsystems: {
    ciClassCode: "DATABASE",
    discriminator: { key: "DB_ENGINE", value: "oracle" },
  },
};

// ========================================
// Resource Identity Extraction
// ========================================

/**
 * Extracts the unique resource identifier for a raw resource.
 * Buckets don't have an `id` field, and some OCI services return OCIDs that
 * exceed the CMDB ciKey limit, so we hash any unsafe identifier into a stable,
 * bounded key that still fits CI key validation.
 */
export function extractResourceId(
  serviceKey: OciServiceKey,
  raw: OciRawResource,
  compartmentId: string,
): string {
  if (serviceKey === "buckets") {
    const namespace = String(raw["namespace"] ?? "");
    const name = String(raw["name"] ?? "");
    return createHashedCiKey(
      "oci.bucket.",
      `${compartmentId}:${namespace}:${name}`,
    );
  }

  const rawId = String(raw["id"] ?? "");
  if (!rawId) {
    return rawId;
  }

  return toBoundedCiKey(serviceKey, rawId);
}

/**
 * Extracts the display name from a raw resource.
 * OCI services use either `display-name` or `name`.
 */
export function extractResourceName(raw: OciRawResource): string {
  const name = String(
    raw["display-name"] ?? raw["name"] ?? raw["id"] ?? "unknown",
  );
  return name.trim() || "unknown";
}

// ========================================
// Environment Inference
// ========================================

type EnvironmentEnumValue = "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER";

/**
 * Infers the CMDB environment from an OCI compartment name.
 * Compartments at Barq follow the naming convention `cmp-{env}-{service}`.
 */
export function inferEnvironment(
  compartmentName: string,
): EnvironmentEnumValue | null {
  const lower = compartmentName.toLowerCase();

  // Check for specific environment keywords in compartment name
  if (lower.includes("-prod") || lower === "cmp-prod") return "PROD";
  if (lower.includes("-dr")) return "DR";
  if (lower.includes("-uat") || lower.includes("-stg")) return "UAT";
  if (lower.includes("-dev")) return "DEV";
  if (lower.includes("-test") || lower.includes("-perf")) return "TEST";

  return null;
}

// ========================================
// OCI Lifecycle State Mapping
// ========================================

/**
 * Maps OCI lifecycle states to CMDB lifecycle state names.
 * The CMDB seed creates lifecycle states with these names.
 */
export function mapOciLifecycleState(ociState: string | undefined): string {
  if (!ociState) return "Unknown";

  const upper = ociState.toUpperCase();

  switch (upper) {
    case "RUNNING":
    case "ACTIVE":
    case "AVAILABLE":
      return "Active";
    case "STOPPED":
    case "INACTIVE":
      return "Inactive";
    case "TERMINATED":
    case "DELETED":
      return "Retired";
    case "PROVISIONING":
    case "CREATING":
    case "STARTING":
    case "UPDATING":
      return "Build";
    case "STOPPING":
    case "TERMINATING":
    case "DELETING":
      return "Pending Retirement";
    case "FAILED":
      return "Failed";
    default:
      return "Unknown";
  }
}

function countRecordEntries(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return 0;
  }

  return Object.keys(value as Record<string, unknown>).length;
}

function buildBaseAttributes(
  serviceKey: OciServiceKey,
  raw: OciRawResource,
  region: string,
  compartmentName: string,
  syncSource: OciSyncAttributeSource,
): Record<string, unknown> {
  return {
    OCI_ID: raw["id"] ?? null,
    OCI_SERVICE_TYPE: serviceKey,
    OCI_SOURCE_STATUS: "present",
    OCI_SYNC_SOURCE: syncSource,
    REGION: region,
    COMPARTMENT_ID: raw["compartment-id"] ?? null,
    COMPARTMENT_NAME: compartmentName,
    LIFECYCLE_STATE: raw["lifecycle-state"] ?? null,
    OCI_NORMALIZED_STATE: mapOciLifecycleState(
      typeof raw["lifecycle-state"] === "string"
        ? raw["lifecycle-state"]
        : undefined,
    ),
    LIFECYCLE_DETAILS: raw["lifecycle-details"] ?? null,
    TIME_CREATED: raw["time-created"] ?? null,
    TIME_UPDATED: raw["time-updated"] ?? null,
    OCI_DEFINED_TAGS: raw["defined-tags"] ?? null,
    OCI_FREEFORM_TAGS: raw["freeform-tags"] ?? null,
    OCI_SYSTEM_TAGS: raw["system-tags"] ?? null,
    OCI_SECURITY_ATTRIBUTES: raw["security-attributes"] ?? null,
  };
}

// ========================================
// Attribute Extraction per Service
// ========================================

/**
 * Extracts service-specific attributes from a raw OCI resource.
 * These are stored in the ConfigurationItem.attributes JSON field.
 */
export function extractResourceAttributes(
  serviceKey: OciServiceKey,
  raw: OciRawResource,
  region: string,
  compartmentName: string,
  options?: {
    syncSource?: OciSyncAttributeSource;
  },
): Record<string, unknown> {
  const base = buildBaseAttributes(
    serviceKey,
    raw,
    region,
    compartmentName,
    options?.syncSource ?? "oci_webhook",
  );

  // Add discriminator if this service type has one
  const mapping = OCI_SERVICE_CLASS_MAP[serviceKey];
  if (mapping.discriminator) {
    base[mapping.discriminator.key] = mapping.discriminator.value;
  }

  switch (serviceKey) {
    case "compute":
      return {
        ...base,
        SHAPE: raw["shape"] ?? null,
        SHAPE_CONFIG: raw["shape-config"] ?? null,
        AVAILABILITY_DOMAIN: raw["availability-domain"] ?? null,
        FAULT_DOMAIN: raw["fault-domain"] ?? null,
        IMAGE_ID: raw["image-id"] ?? null,
        LAUNCH_MODE: raw["launch-mode"] ?? null,
        AGENT_CONFIG: raw["agent-config"] ?? null,
        AVAILABILITY_CONFIG: raw["availability-config"] ?? null,
        INSTANCE_CONFIGURATION_ID: raw["instance-configuration-id"] ?? null,
        INSTANCE_OPTIONS: raw["instance-options"] ?? null,
        LAUNCH_OPTIONS: raw["launch-options"] ?? null,
        SOURCE_DETAILS: raw["source-details"] ?? null,
        PLATFORM_CONFIG: raw["platform-config"] ?? null,
        METADATA: raw["metadata"] ?? null,
        EXTENDED_METADATA: raw["extended-metadata"] ?? null,
        LICENSING_CONFIGS: raw["licensing-configs"] ?? null,
        CAPACITY_RESERVATION_ID: raw["capacity-reservation-id"] ?? null,
        CLUSTER_PLACEMENT_GROUP_ID: raw["cluster-placement-group-id"] ?? null,
        DEDICATED_VM_HOST_ID: raw["dedicated-vm-host-id"] ?? null,
        PREEMPTIBLE_INSTANCE_CONFIG: raw["preemptible-instance-config"] ?? null,
        PLACEMENT_CONSTRAINT_DETAILS:
          raw["placement-constraint-details"] ?? null,
        MAINTENANCE_REBOOT_DUE: raw["time-maintenance-reboot-due"] ?? null,
      };

    case "lb":
      return {
        ...base,
        IP_ADDRESSES: raw["ip-addresses"] ?? null,
        BACKEND_SET_COUNT: countRecordEntries(raw["backend-sets"]),
        BACKEND_SETS: raw["backend-sets"] ?? null,
        LISTENER_COUNT: countRecordEntries(raw["listeners"]),
        LISTENERS: raw["listeners"] ?? null,
        HOSTNAME_COUNT: countRecordEntries(raw["hostnames"]),
        HOSTNAMES: raw["hostnames"] ?? null,
        CERTIFICATE_COUNT: countRecordEntries(raw["certificates"]),
        CERTIFICATES: raw["certificates"] ?? null,
        SUBNET_IDS: raw["subnet-ids"] ?? null,
        NETWORK_SECURITY_GROUP_IDS: raw["network-security-group-ids"] ?? null,
        SHAPE_NAME: raw["shape-name"] ?? null,
        SHAPE_DETAILS: raw["shape-details"] ?? null,
        IS_PRIVATE: raw["is-private"] ?? null,
        IP_MODE: raw["ip-mode"] ?? null,
        ROUTING_POLICY_COUNT: countRecordEntries(raw["routing-policies"]),
        ROUTING_POLICIES: raw["routing-policies"] ?? null,
        RULE_SET_COUNT: countRecordEntries(raw["rule-sets"]),
        RULE_SETS: raw["rule-sets"] ?? null,
        PATH_ROUTE_SET_COUNT: countRecordEntries(raw["path-route-sets"]),
        PATH_ROUTE_SETS: raw["path-route-sets"] ?? null,
        SSL_CIPHER_SUITES: raw["ssl-cipher-suites"] ?? null,
        REQUEST_ID_HEADER: raw["request-id-header"] ?? null,
      };

    case "nlb":
      return {
        ...base,
        IP_ADDRESSES: raw["ip-addresses"] ?? null,
        BACKEND_SET_COUNT: countRecordEntries(raw["backend-sets"]),
        BACKEND_SETS: raw["backend-sets"] ?? null,
        LISTENER_COUNT: countRecordEntries(raw["listeners"]),
        LISTENERS: raw["listeners"] ?? null,
        NETWORK_SECURITY_GROUP_IDS: raw["network-security-group-ids"] ?? null,
        SUBNET_ID: raw["subnet-id"] ?? null,
        NLB_IP_VERSION: raw["nlb-ip-version"] ?? null,
        IS_PRIVATE: raw["is-private"] ?? null,
        IS_PRESERVE_SOURCE_DESTINATION:
          raw["is-preserve-source-destination"] ?? null,
        IS_SYMMETRIC_HASH_ENABLED: raw["is-symmetric-hash-enabled"] ?? null,
      };

    case "oke":
      return {
        ...base,
        KUBERNETES_VERSION: raw["kubernetes-version"] ?? null,
        ENDPOINTS: raw["endpoints"] ?? null,
        CNI_TYPE:
          (
            raw["cluster-pod-network-options"] as
              | Array<{ "cni-type": string }>
              | undefined
          )?.[0]?.["cni-type"] ?? null,
        IS_PUBLIC_API:
          (raw["endpoint-config"] as { "is-public-ip-enabled"?: boolean })?.[
            "is-public-ip-enabled"
          ] ?? null,
        ENDPOINT_CONFIG: raw["endpoint-config"] ?? null,
        AVAILABLE_KUBERNETES_UPGRADES:
          raw["available-kubernetes-upgrades"] ?? null,
        IMAGE_POLICY_CONFIG: raw["image-policy-config"] ?? null,
        OPTIONS: raw["options"] ?? null,
        CLUSTER_TYPE: raw["type"] ?? null,
        VCN_ID: raw["vcn-id"] ?? null,
        CLUSTER_METADATA: raw["metadata"] ?? null,
      };

    case "buckets":
      return {
        ...base,
        // Buckets don't have "id" — override OCI_ID with synthesized key
        OCI_ID: null,
        NAMESPACE: raw["namespace"] ?? null,
        BUCKET_NAME: raw["name"] ?? null,
        CREATED_BY: raw["created-by"] ?? null,
        ETAG: raw["etag"] ?? null,
      };

    case "postgresql":
      return {
        ...base,
        DB_VERSION: raw["db-version"] ?? null,
        SHAPE: raw["shape"] ?? null,
        INSTANCE_COUNT: raw["instance-count"] ?? null,
        INSTANCE_OCPU_COUNT: raw["instance-ocpu-count"] ?? null,
        INSTANCE_MEMORY_SIZE_GB: raw["instance-memory-size-in-gbs"] ?? null,
        SYSTEM_TYPE: raw["system-type"] ?? null,
        CONFIG_ID: raw["config-id"] ?? null,
      };

    case "mysql":
      return {
        ...base,
        AVAILABILITY_DOMAIN: raw["availability-domain"] ?? null,
        DATABASE_MODE: raw["database-mode"] ?? null,
        ACCESS_MODE: raw["access-mode"] ?? null,
        CRASH_RECOVERY: raw["crash-recovery"] ?? null,
        BACKUP_ENABLED:
          (raw["backup-policy"] as { "is-enabled"?: boolean })?.[
            "is-enabled"
          ] ?? null,
        BACKUP_POLICY: raw["backup-policy"] ?? null,
        CURRENT_PLACEMENT: raw["current-placement"] ?? null,
        DATABASE_MANAGEMENT: raw["database-management"] ?? null,
        DELETION_POLICY: raw["deletion-policy"] ?? null,
        DESCRIPTION: raw["description"] ?? null,
        ENDPOINTS: raw["endpoints"] ?? null,
        HEAT_WAVE_CLUSTER: raw["heat-wave-cluster"] ?? null,
        IS_HEAT_WAVE_CLUSTER_ATTACHED:
          raw["is-heat-wave-cluster-attached"] ?? null,
        IS_HIGHLY_AVAILABLE: raw["is-highly-available"] ?? null,
        MYSQL_VERSION: raw["mysql-version"] ?? null,
        READ_ENDPOINT: raw["read-endpoint"] ?? null,
        SHAPE_NAME: raw["shape-name"] ?? null,
      };

    case "dbsystems":
      return {
        ...base,
        DATABASE_EDITION: raw["database-edition"] ?? null,
        SHAPE: raw["shape"] ?? null,
        CPU_CORE_COUNT: raw["cpu-core-count"] ?? null,
        DATA_STORAGE_SIZE_GB: raw["data-storage-size-in-gbs"] ?? null,
        DISK_REDUNDANCY: raw["disk-redundancy"] ?? null,
        STORAGE_MANAGEMENT:
          (raw["db-system-options"] as { "storage-management"?: string })?.[
            "storage-management"
          ] ?? null,
        HOSTNAME: raw["hostname"] ?? null,
        DOMAIN: raw["domain"] ?? null,
        AVAILABILITY_DOMAIN: raw["availability-domain"] ?? null,
        CLUSTER_NAME: raw["cluster-name"] ?? null,
        COMPUTE_COUNT: raw["compute-count"] ?? null,
        COMPUTE_MODEL: raw["compute-model"] ?? null,
        DATA_COLLECTION_OPTIONS: raw["data-collection-options"] ?? null,
        DATA_STORAGE_PERCENTAGE: raw["data-storage-percentage"] ?? null,
        LICENSE_MODEL: raw["license-model"] ?? null,
        LISTENER_PORT: raw["listener-port"] ?? null,
        MAINTENANCE_WINDOW: raw["maintenance-window"] ?? null,
        MEMORY_SIZE_GB: raw["memory-size-in-gbs"] ?? null,
        NODE_COUNT: raw["node-count"] ?? null,
        NSG_IDS: raw["nsg-ids"] ?? null,
        OS_VERSION: raw["os-version"] ?? null,
        RECO_STORAGE_SIZE_GB: raw["reco-storage-size-in-gb"] ?? null,
        SCAN_DNS_NAME: raw["scan-dns-name"] ?? null,
        SUBNET_ID: raw["subnet-id"] ?? null,
        TIME_ZONE: raw["time-zone"] ?? null,
        VERSION: raw["version"] ?? null,
        BACKUP_SUBNET_ID: raw["backup-subnet-id"] ?? null,
        BACKUP_NETWORK_NSG_IDS: raw["backup-network-nsg-ids"] ?? null,
        FAULT_DOMAINS: raw["fault-domains"] ?? null,
        VIP_IDS: raw["vip-ids"] ?? null,
        SOURCE_DB_SYSTEM_ID: raw["source-db-system-id"] ?? null,
      };

    default:
      return base;
  }
}
