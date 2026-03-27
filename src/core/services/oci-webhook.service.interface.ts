/**
 * OCI Webhook Service Interface
 *
 * Defines the contract for fetching OCI inventory data from the n8n webhook.
 * The webhook acts as a proxy to OCI APIs, returning resource data grouped
 * by tenancy → service → compartment → region → items.
 */

import type {
  OciServiceKey,
  OciWebhookResponse,
} from "@/core/domain/value-objects/oci-resource.types";
import type { OciWebhookErrorKind } from "@/core/domain/errors/oci-webhook.error";
import type {
  OciSyncAttributeSource,
  OciSyncSourceMode,
} from "@/core/domain/value-objects/oci-sync-source";

export interface OciDataSourceDescriptor {
  mode: OciSyncSourceMode;
  attributeValue: OciSyncAttributeSource;
  description: string;
  location?: string;
}

export interface OciWebhookFetchFailure {
  serviceKeys: OciServiceKey[];
  kind: OciWebhookErrorKind;
  message: string;
  code?: string;
  hostname?: string;
}

export interface OciWebhookBatchResult {
  source: OciDataSourceDescriptor;
  responses: Map<OciServiceKey, OciWebhookResponse>;
  failures: OciWebhookFetchFailure[];
}

export interface IOciWebhookService {
  /**
   * Fetch data for a single OCI service type.
   * @param serviceKey - One of the 8 service types (compute, lb, etc.)
   * @returns Parsed webhook response
   * @throws Error if the webhook is unreachable or returns invalid data
   */
  fetchServiceData(serviceKey: OciServiceKey): Promise<OciWebhookResponse>;

  /**
   * Fetch data for multiple (or all) OCI service types.
   * @param serviceKeys - Services to fetch; defaults to all 8
   * @returns Map of service key → parsed webhook response
   */
  fetchAllServices(
    serviceKeys?: OciServiceKey[],
  ): Promise<OciWebhookBatchResult>;

  /**
   * Test connectivity to the n8n webhook endpoint.
   * @returns true if the endpoint is reachable and authenticated
   */
  testConnection(): Promise<boolean>;
}
