import type { OciServiceKey } from "@/core/domain/value-objects/oci-resource.types";

export type OciWebhookErrorKind =
  | "network"
  | "http"
  | "invalid_response"
  | "config"
  | "unknown";

export interface OciWebhookErrorDetails {
  kind: OciWebhookErrorKind;
  serviceKey?: OciServiceKey;
  statusCode?: number;
  code?: string;
  hostname?: string;
  userMessage: string;
}

export class OciWebhookError extends Error {
  readonly kind: OciWebhookErrorKind;
  readonly serviceKey?: OciServiceKey;
  readonly statusCode?: number;
  readonly code?: string;
  readonly hostname?: string;
  readonly userMessage: string;

  constructor(details: OciWebhookErrorDetails, options?: ErrorOptions) {
    super(details.userMessage, options);
    this.name = "OciWebhookError";
    this.kind = details.kind;
    this.serviceKey = details.serviceKey;
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.hostname = details.hostname;
    this.userMessage = details.userMessage;
  }

  toLogContext(): Record<string, unknown> {
    return {
      kind: this.kind,
      serviceKey: this.serviceKey,
      statusCode: this.statusCode,
      code: this.code,
      hostname: this.hostname,
      message: this.userMessage,
    };
  }
}
