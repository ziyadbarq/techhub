import { injectable } from "inversify";

import type { Tx } from "@/core/repositories/workflow";

/**
 * Mustache-style {{variable}} substitution for email templates and inline
 * notification copy. Supports dot-paths (e.g. {{request.referenceNumber}}).
 * Unknown variables are replaced with the empty string.
 */
export function renderTemplate(
  input: string,
  vars: Record<string, unknown>,
): string {
  return input.replace(/{{\s*([\w.]+)\s*}}/g, (_, path: string) => {
    const segments = path.split(".");
    let value: unknown = vars;
    for (const seg of segments) {
      if (
        value &&
        typeof value === "object" &&
        seg in (value as Record<string, unknown>)
      ) {
        value = (value as Record<string, unknown>)[seg];
      } else {
        return "";
      }
    }
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Build the canonical variable bag for a request. The shape exposed to
 * templates is intentionally simple and stable so admin-authored templates
 * don't need to know engine internals.
 *
 * Available paths:
 *   {{request_id}}, {{request.id}}, {{request.referenceNumber}},
 *   {{request.status}}, {{request.outcome}}, {{request.url}},
 *   {{requester_name}}, {{requester_email}}, {{form_name}},
 *   {{step_name}}, {{step_assignees}}, plus every form field via
 *   {{field.<key>}}.
 */
export async function buildRequestVars(
  tx: Tx,
  requestId: string,
  options?: { stepInstanceId?: string | null; appBaseUrl?: string },
): Promise<Record<string, unknown>> {
  const request = await tx.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      outcome: true,
      requesterId: true,
      formId: true,
      requester: { select: { name: true, email: true } },
      form: { select: { name: true } },
      fieldValues: {
        select: { fieldKey: true, valueJson: true },
      },
    },
  });
  if (!request) return {};

  const fieldBag: Record<string, unknown> = {};
  for (const fv of request.fieldValues) {
    fieldBag[fv.fieldKey] = fv.valueJson;
  }

  let stepName = "";
  let stepAssignees = "";
  if (options?.stepInstanceId) {
    const step = await tx.stepInstance.findUnique({
      where: { id: options.stepInstanceId },
      select: {
        stepKey: true,
        snapshots: {
          select: { user: { select: { name: true, email: true } } },
        },
      },
    });
    if (step) {
      stepName = step.stepKey;
      stepAssignees = step.snapshots
        .map((a) => a.user.name ?? a.user.email)
        .join(", ");
    }
  }

  const baseUrl =
    options?.appBaseUrl ??
    process.env.PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "";
  const requestUrl = baseUrl
    ? `${baseUrl}/dashboard/workflow/requests/${request.id}`
    : `/dashboard/workflow/requests/${request.id}`;

  return {
    request_id: request.id,
    requester_name: request.requester?.name ?? "",
    requester_email: request.requester?.email ?? "",
    form_name: request.form?.name ?? "",
    step_name: stepName,
    step_assignees: stepAssignees,
    request: {
      id: request.id,
      referenceNumber: request.referenceNumber ?? "",
      status: request.status,
      outcome: request.outcome ?? "",
      url: requestUrl,
    },
    field: fieldBag,
  };
}

/**
 * Template renderer service interface.
 *
 * Mustache-style {{variable}} substitution and request-context variable bag
 * builder for workflow email templates and inline notifications.
 */
export interface ITemplateRenderer {
  render(input: string, vars: Record<string, unknown>): string;
  buildRequestVars(
    tx: Tx,
    requestId: string,
    options?: { stepInstanceId?: string | null; appBaseUrl?: string },
  ): Promise<Record<string, unknown>>;
}

@injectable()
export class TemplateRendererService implements ITemplateRenderer {
  render(input: string, vars: Record<string, unknown>): string {
    return renderTemplate(input, vars);
  }

  buildRequestVars(
    tx: Tx,
    requestId: string,
    options?: { stepInstanceId?: string | null; appBaseUrl?: string },
  ): Promise<Record<string, unknown>> {
    return buildRequestVars(tx, requestId, options);
  }
}
