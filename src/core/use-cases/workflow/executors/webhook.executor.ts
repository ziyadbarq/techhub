/**
 * Webhook Step Executor
 *
 * Issues an outbound HTTP request at activation time, optionally mapping
 * response JSON paths back into form fields. The step auto-completes on a
 * 2xx response (or AUTO_FAILs on a non-2xx when `failOnError` is true).
 */

import { injectable } from "inversify";

import { ConfigurationError, InvalidStateError } from "@/core/domain/workflow";
import type { StepConfig, WebhookStepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IStepExecutor,
} from "@/core/repositories/workflow";

const TEMPLATE_RE = /\{\{\s*field\.([^}\s]+)\s*\}\}/g;

function renderTemplateString(
  value: string,
  fields: Record<string, unknown>,
): string {
  return value.replace(TEMPLATE_RE, (_, key: string) => {
    const v = fields[key];
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  });
}

function renderTemplate(
  value: unknown,
  fields: Record<string, unknown>,
): unknown {
  if (typeof value === "string") return renderTemplateString(value, fields);
  if (Array.isArray(value)) return value.map((v) => renderTemplate(v, fields));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = renderTemplate(v, fields);
    }
    return out;
  }
  return value;
}

function readJsonPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export interface IHttpClient {
  request(input: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  }): Promise<{ status: number; bodyJson: unknown }>;
}

export const fetchHttpClient: IHttpClient = {
  async request(input) {
    const controller = new AbortController();
    const timer = input.timeoutMs
      ? setTimeout(() => controller.abort(), input.timeoutMs)
      : null;
    try {
      const response = await fetch(input.url, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        signal: controller.signal,
      });
      const text = await response.text();
      let bodyJson: unknown = null;
      try {
        bodyJson = text ? JSON.parse(text) : null;
      } catch {
        bodyJson = { raw: text };
      }
      return { status: response.status, bodyJson };
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};

@injectable()
export class WebhookStepExecutor implements IStepExecutor {
  readonly type = "WEBHOOK" as const;

  private readonly http: IHttpClient = fetchHttpClient;

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as WebhookStepConfig;
    if (!cfg.url) throw new ConfigurationError("Webhook step requires a url");

    const method = cfg.method ?? "POST";
    const headers = {
      "content-type": "application/json",
      ...(cfg.headers ?? {}),
    };
    const renderedBody = cfg.bodyTemplate
      ? renderTemplate(cfg.bodyTemplate, exec.fieldValues)
      : undefined;
    const body = renderedBody ? JSON.stringify(renderedBody) : undefined;

    const result = await this.http.request({
      url: renderTemplateString(cfg.url, exec.fieldValues),
      method,
      headers,
      body,
      timeoutMs: cfg.timeoutMs ?? 30_000,
    });

    const ok = result.status >= 200 && result.status < 300;
    const failOnError = cfg.failOnError !== false;

    // Stash response + status on the StepInstance for audit / debugging.
    const fieldUpdates: Record<string, unknown> = {};
    if (cfg.responseFieldMapping) {
      for (const [fieldKey, jsonPath] of Object.entries(
        cfg.responseFieldMapping,
      )) {
        fieldUpdates[fieldKey] =
          readJsonPath(result.bodyJson, jsonPath) ?? null;
      }
    }

    await exec.tx.stepInstance.update({
      where: { id: exec.stepInstanceId },
      data: {
        outcomeJson: {
          status: result.status,
          bodyJson: result.bodyJson as object | null,
          fieldUpdates,
        } as object,
      },
    });

    if (!ok && failOnError) {
      return {
        kind: "AUTO_FAIL",
        reason: `Webhook returned status ${result.status}`,
      };
    }
    return { kind: "AUTO_COMPLETE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError("Webhook steps do not accept user actions");
  }
}
