/**
 * Validates a workflow graph draft before it can be published.
 * Returns an array of human-readable error strings; empty means valid.
 */

import type { WorkflowGraph, AssigneeSpec } from "@/core/domain/workflow";

export interface LinkedFormField {
  key: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface PublishWorkflowValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Recursively collect all AssigneeSpecs from a step */
function collectSpecs(spec: AssigneeSpec): AssigneeSpec[] {
  if (spec.kind === "FALLBACK") {
    return [spec, ...collectSpecs(spec.primary)];
  }
  return [spec];
}

function getAccessServiceFields(fields: LinkedFormField[]): Set<string> {
  return new Set(
    fields
      .filter(
        (f) =>
          f.type === "LOOKUP" &&
          (f.config as { dataSource?: string } | undefined)?.dataSource ===
            "ACCESS_SERVICES",
      )
      .map((f) => f.key),
  );
}

function getUserPickerFields(fields: LinkedFormField[]): Set<string> {
  return new Set(
    fields.filter((f) => f.type === "USER_PICKER").map((f) => f.key),
  );
}

export function validateWorkflowForPublish(
  graph: WorkflowGraph,
  linkedFormFields: LinkedFormField[], // fields from all linked published/draft form schemas
): PublishWorkflowValidationResult {
  const errors: string[] = [];
  const stepKeys = new Set(graph.steps.map((s) => s.key));
  const accessServiceFields = getAccessServiceFields(linkedFormFields);
  const userPickerFields = getUserPickerFields(linkedFormFields);

  // start key must exist
  if (!stepKeys.has(graph.start)) {
    errors.push(`Start step "${graph.start}" is not defined in the workflow.`);
  }

  for (const step of graph.steps) {
    // next targets must exist
    if (step.next) {
      if ("default" in step.next) {
        if (!stepKeys.has(step.next.default)) {
          errors.push(
            `Step "${step.key}" next.default "${step.next.default}" is not a defined step.`,
          );
        }
      } else if ("onAction" in step.next) {
        for (const [action, target] of Object.entries(step.next.onAction)) {
          if (!stepKeys.has(target)) {
            errors.push(
              `Step "${step.key}" next.onAction["${action}"] "${target}" is not a defined step.`,
            );
          }
        }
      }
    }

    // Validate assignees in approval / execution / info_ack steps
    const config = step.config as {
      assignees?: AssigneeSpec[];
      branches?: Array<{ when: unknown; goTo: string }>;
      default?: string;
    };

    if (config?.assignees) {
      for (const spec of config.assignees) {
        for (const s of collectSpecs(spec)) {
          if (s.kind === "ACCESS_SERVICE_ROLE") {
            if (accessServiceFields.size === 0) {
              errors.push(
                `Step "${step.key}" uses ACCESS_SERVICE_ROLE but no linked form has a LOOKUP[ACCESS_SERVICES] field.`,
              );
            } else if (!accessServiceFields.has(s.serviceSnapshotKey)) {
              errors.push(
                `Step "${step.key}" ACCESS_SERVICE_ROLE references field "${s.serviceSnapshotKey}" ` +
                  `which is not an ACCESS_SERVICES lookup field in the linked form.`,
              );
            }
          }

          if (s.kind === "FALLBACK") {
            if (!userPickerFields.has(s.fallbackFieldKey)) {
              errors.push(
                `Step "${step.key}" FALLBACK references fallbackFieldKey "${s.fallbackFieldKey}" ` +
                  `which is not a USER_PICKER field in the linked form.`,
              );
            }
          }
        }
      }
    }

    // Validate CONDITIONAL_BRANCH branch targets
    if (step.type === "CONDITIONAL_BRANCH" && config?.branches) {
      for (const branch of config.branches) {
        if (!stepKeys.has(branch.goTo)) {
          errors.push(
            `CONDITIONAL_BRANCH "${step.key}" branch targets "${branch.goTo}" which is not a defined step.`,
          );
        }
      }
      if (config.default && !stepKeys.has(config.default)) {
        errors.push(
          `CONDITIONAL_BRANCH "${step.key}" default target "${config.default}" is not a defined step.`,
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}
