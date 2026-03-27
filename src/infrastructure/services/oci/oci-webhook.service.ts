/**
 * OCI Webhook Service Implementation
 *
 * Fetches OCI inventory data from the n8n webhook endpoint.
 * Ported from scripts/imports/download-oci-data.ts into clean architecture.
 */

import { injectable, inject } from "inversify";
import { Agent } from "undici";
import { OciWebhookError } from "@/core/domain/errors/oci-webhook.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type {
  IOciWebhookService,
  OciDataSourceDescriptor,
  OciWebhookBatchResult,
} from "@/core/services/oci-webhook.service.interface";
import {
  OCI_SERVICE_KEYS,
  OciWebhookResponseSchema,
  type OciServiceKey,
  type OciWebhookResponse,
} from "@/core/domain/value-objects/oci-resource.types";
import {
  getOciSyncAttributeSource,
  parseOciSyncSourceMode,
} from "@/core/domain/value-objects/oci-sync-source";
import {
  loadValidatedLocalOciServicePayload,
  resolveOciLocalDataDir,
} from "./oci-local-data";

const WEBHOOK_URL = "https://n8n.prod.barq.com/webhook/oci-invent";
const OCI_WEBHOOK_HOSTNAME = "n8n.prod.barq.com";
const NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

@injectable()
export class OciWebhookService implements IOciWebhookService {
  private readonly token: string | undefined;
  private readonly insecureDispatcher: Agent | undefined;
  private readonly source: OciDataSourceDescriptor;
  private readonly localDataDir: string | undefined;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {
    this.insecureDispatcher = undefined;
    this.localDataDir = undefined;

    let sourceMode: ReturnType<typeof parseOciSyncSourceMode>;
    try {
      sourceMode = parseOciSyncSourceMode(process.env.OCI_SYNC_SOURCE);
    } catch (error) {
      throw new OciWebhookError(
        {
          kind: "config",
          userMessage:
            error instanceof Error
              ? error.message
              : "Invalid OCI sync source configuration.",
        },
        { cause: error instanceof Error ? error : new Error(String(error)) },
      );
    }

    this.source = {
      mode: sourceMode,
      attributeValue: getOciSyncAttributeSource(sourceMode),
      description:
        sourceMode === "local"
          ? "local OCI snapshot files"
          : "OCI webhook endpoint",
    };

    if (sourceMode === "local") {
      this.localDataDir = resolveOciLocalDataDir();
      this.source.location = this.localDataDir;
      this.logger.info("OCI sync source configured", {
        sourceMode,
        localDataDir: this.localDataDir,
      });
      this.token = undefined;
      return;
    }

    const token = process.env.OCI_WEBHOOK_TOKEN;
    if (!token) {
      throw new OciWebhookError({
        kind: "config",
        userMessage:
          "OCI sync is not configured. Set OCI_WEBHOOK_TOKEN and try again.",
      });
    }
    this.token = token;

    if (process.env.OCI_WEBHOOK_INSECURE === "true") {
      this.insecureDispatcher = new Agent({
        connect: { rejectUnauthorized: false },
      });
    }
  }

  async fetchServiceData(
    serviceKey: OciServiceKey,
  ): Promise<OciWebhookResponse> {
    if (this.source.mode === "local") {
      return this.fetchLocalServiceData(serviceKey);
    }

    const url = `${WEBHOOK_URL}?oci-service=${serviceKey}`;

    this.logger.info("Fetching OCI service data", { serviceKey, url });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          token: this.token!,
          Accept: "application/json",
        },
        ...(this.insecureDispatcher
          ? { dispatcher: this.insecureDispatcher }
          : {}),
      });
    } catch (error) {
      throw this.toWebhookError(serviceKey, error);
    }

    if (!response.ok) {
      await response.text().catch(() => "<unreadable>");
      throw new OciWebhookError({
        kind: "http",
        serviceKey,
        statusCode: response.status,
        userMessage:
          response.status === 401 || response.status === 403
            ? "OCI inventory endpoint rejected the request. Verify OCI webhook credentials and try again."
            : `OCI inventory endpoint returned HTTP ${response.status} while fetching ${serviceKey}.`,
      });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      throw new OciWebhookError(
        {
          kind: "invalid_response",
          serviceKey,
          userMessage:
            "OCI inventory endpoint returned invalid JSON. Check the n8n webhook response and try again.",
        },
        { cause: error instanceof Error ? error : new Error(String(error)) },
      );
    }

    // Validate response structure
    const parseResult = OciWebhookResponseSchema.safeParse(json);
    if (!parseResult.success) {
      this.logger.warn("OCI webhook response validation failed", {
        serviceKey,
        errors: parseResult.error.issues.slice(0, 5),
      });
      throw new OciWebhookError({
        kind: "invalid_response",
        serviceKey,
        userMessage:
          `OCI inventory endpoint returned an unexpected response for ${serviceKey}. ` +
          `${parseResult.error.issues[0]?.message ?? "Check the webhook output and try again."}`,
      });
    }

    this.logger.info("OCI service data fetched successfully", {
      serviceKey,
      tenancyId: parseResult.data["object Object"]?.[0]?.tenancyId,
    });

    return parseResult.data;
  }

  async fetchAllServices(
    serviceKeys?: OciServiceKey[],
  ): Promise<OciWebhookBatchResult> {
    const keys = serviceKeys ?? [...OCI_SERVICE_KEYS];
    const responses = new Map<OciServiceKey, OciWebhookResponse>();
    const failures: OciWebhookBatchResult["failures"] = [];

    this.logger.info("Fetching all OCI services", {
      sourceMode: this.source.mode,
      sourceLocation: this.source.location,
      serviceCount: keys.length,
      services: keys,
    });

    // Fetch sequentially to avoid overwhelming the webhook
    for (const [index, key] of keys.entries()) {
      try {
        const data = await this.fetchServiceData(key);
        responses.set(key, data);
      } catch (error) {
        const normalized = this.toWebhookError(key, error);
        if (this.isEndpointWideFailure(normalized)) {
          const affectedServices = keys.slice(index);
          failures.push({
            serviceKeys: affectedServices,
            kind: normalized.kind,
            message: normalized.userMessage,
            code: normalized.code,
            hostname: normalized.hostname,
          });
          this.logger.warn(
            "OCI inventory endpoint unavailable — skipping remaining services",
            {
              kind: normalized.kind,
              statusCode: normalized.statusCode,
              code: normalized.code,
              hostname: normalized.hostname,
              failedServices: affectedServices,
              failedCount: affectedServices.length,
              message: normalized.userMessage,
            },
          );
          break;
        }

        failures.push({
          serviceKeys: [key],
          kind: normalized.kind,
          message: normalized.userMessage,
          code: normalized.code,
          hostname: normalized.hostname,
        });
        this.logger.warn("OCI service fetch failed", normalized.toLogContext());
      }
    }

    this.logger.info("OCI service fetch complete", {
      requested: keys.length,
      succeeded: responses.size,
      failed: failures.length,
    });

    return {
      source: this.source,
      responses,
      failures,
    };
  }

  async testConnection(): Promise<boolean> {
    if (this.source.mode === "local") {
      try {
        for (const key of OCI_SERVICE_KEYS) {
          await this.fetchLocalServiceData(key);
        }
        return true;
      } catch {
        return false;
      }
    }

    try {
      // Try fetching the smallest service (buckets tends to be small)
      const url = `${WEBHOOK_URL}?oci-service=buckets`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          token: this.token!,
          Accept: "application/json",
        },
        ...(this.insecureDispatcher
          ? { dispatcher: this.insecureDispatcher }
          : {}),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchLocalServiceData(
    serviceKey: OciServiceKey,
  ): Promise<OciWebhookResponse> {
    const dataDir = this.localDataDir ?? resolveOciLocalDataDir();

    this.logger.info("Loading OCI service data from local snapshot", {
      serviceKey,
      dataDir,
    });

    try {
      const payload = loadValidatedLocalOciServicePayload(serviceKey, dataDir);
      this.logger.info("OCI local snapshot loaded successfully", {
        serviceKey,
        dataDir,
        tenancyId: payload["object Object"]?.[0]?.tenancyId,
      });
      return payload;
    } catch (error) {
      throw new OciWebhookError(
        {
          kind: "config",
          serviceKey,
          userMessage:
            `Unable to load the local OCI snapshot for ${serviceKey}. ` +
            `Check OCI_LOCAL_DATA_DIR and refresh the snapshot files in ${dataDir}.`,
        },
        { cause: error instanceof Error ? error : new Error(String(error)) },
      );
    }
  }

  private toWebhookError(
    serviceKey: OciServiceKey,
    error: unknown,
  ): OciWebhookError {
    if (error instanceof OciWebhookError) {
      return error;
    }

    const errorObject =
      error instanceof Error ? error : new Error(String(error));
    const cause =
      typeof errorObject === "object" &&
      errorObject !== null &&
      "cause" in errorObject
        ? (errorObject.cause as
            | {
                code?: string;
                hostname?: string;
              }
            | undefined)
        : undefined;

    if (cause?.code && NETWORK_ERROR_CODES.has(cause.code)) {
      return new OciWebhookError(
        {
          kind: "network",
          serviceKey,
          code: cause.code,
          hostname: cause.hostname ?? OCI_WEBHOOK_HOSTNAME,
          userMessage:
            "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
        },
        { cause: errorObject },
      );
    }

    return new OciWebhookError(
      {
        kind: "unknown",
        serviceKey,
        userMessage: `Failed to fetch OCI inventory for ${serviceKey}. Please try again.`,
      },
      { cause: errorObject },
    );
  }

  private isEndpointWideFailure(error: OciWebhookError): boolean {
    if (error.kind === "network" || error.kind === "config") {
      return true;
    }

    return (
      error.kind === "http" &&
      (error.statusCode === 401 || error.statusCode === 403)
    );
  }
}
