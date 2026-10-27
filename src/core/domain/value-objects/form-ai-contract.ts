/**
 * Contract for AI-drafted request forms.
 *
 * Same arrangement as the workflow contract: `buildFormPrompt` describes the
 * shape to the assistant and `GeneratedFormSchema` enforces it on the way
 * back, and they sit together so neither can drift unnoticed.
 *
 * A pasted reply is untrusted input held to the contract a hand-built form
 * satisfies.
 */

import { z } from "zod";

import { AI_ALLOWED_FIELD_TYPES } from "./workflow-ai-contract";

export { AI_ALLOWED_FIELD_TYPES };

/** Where a field appears, mirroring the builder's own selector. */
export const AI_FIELD_VISIBILITY = [
  "VISIBLE",
  "HIDDEN",
  "ADMINISTRATIVE",
] as const;

/** Values SYSTEM_FIELD can be bound to. */
export const AI_SYSTEM_FIELDS = [
  "REQUESTER_NAME",
  "REQUESTER_EMAIL",
  "REQUESTER_MANAGER_NAME",
] as const;

/** Data sources a LOOKUP field can draw from. */
export const AI_LOOKUP_SOURCES = ["static", "ACCESS_SERVICES"] as const;

const keyRegex = /^[a-z0-9_]+$/i;

const generatedFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(keyRegex, "Field key may only contain letters, digits and _"),
  label: z.string().min(1).max(200),
  type: z.enum(AI_ALLOWED_FIELD_TYPES),
  required: z.boolean().optional(),
  position: z.number().int().nonnegative(),
  visibility: z.enum(AI_FIELD_VISIBILITY).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const GeneratedFormSchema = z.object({
  summary: z.string().min(1).max(500),
  fields: z.array(generatedFieldSchema).min(1).max(40),
});

export type GeneratedFormDTO = z.infer<typeof GeneratedFormSchema>;

/**
 * Per-type checks Zod cannot express — a field can satisfy the schema and
 * still be unusable, e.g. a DROPDOWN with nothing to choose from.
 *
 * @returns Human-readable problems; empty when the form is sound.
 */
export function findFormProblems(draft: GeneratedFormDTO): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();

  for (const field of draft.fields) {
    if (keys.has(field.key)) {
      problems.push(`Two fields share the key "${field.key}".`);
    }
    keys.add(field.key);

    const config = (field.config ?? {}) as Record<string, unknown>;

    // A chooser with no choices renders an empty control.
    const needsOptions =
      field.type === "DROPDOWN" ||
      field.type === "MULTI_SELECT" ||
      (field.type === "LOOKUP" && (config.dataSource ?? "static") === "static");

    if (needsOptions) {
      const options = config.options;
      if (!Array.isArray(options) || options.length === 0) {
        problems.push(`"${field.label}" needs at least one option.`);
      }
    }

    if (field.type === "LOOKUP") {
      const source = (config.dataSource ?? "static") as string;
      if (!AI_LOOKUP_SOURCES.includes(source as "static")) {
        problems.push(
          `"${field.label}" uses an unknown lookup source "${source}".`,
        );
      }
    }

    if (field.type === "SYSTEM_FIELD") {
      const bound = config.systemField as string | undefined;
      if (!bound || !AI_SYSTEM_FIELDS.includes(bound as "REQUESTER_NAME")) {
        problems.push(
          `"${field.label}" must bind systemField to one of: ${AI_SYSTEM_FIELDS.join(", ")}.`,
        );
      }
    }

    if (field.type === "REPEATER") {
      const sub = config.subFields;
      if (!Array.isArray(sub) || sub.length === 0) {
        problems.push(`"${field.label}" is a repeater with no sub-fields.`);
      }
    }
  }

  return problems;
}

export interface FormPromptContext {
  /** The form's name, so the assistant drafts for the right thing. */
  formName?: string;
  /** Field keys already on the canvas, offered for reuse. */
  existingFieldKeys?: string[];
  /** Access services in the catalog, for LOOKUP[ACCESS_SERVICES] fields. */
  accessServiceNames?: string[];
}

/**
 * Build the prompt a user copies into their own AI assistant.
 *
 * Self-contained: the assistant has no access to this system, so every field
 * type, its config shape, and the catalog it can point at are inlined.
 */
export function buildFormPrompt(context: FormPromptContext = {}): string {
  const serviceSection = context.accessServiceNames?.length
    ? `
  A LOOKUP with "dataSource": "ACCESS_SERVICES" lets the requester pick from
  the IT service catalog, and lets the workflow route approvals to whoever
  owns the chosen service. Services currently in the catalog:
${context.accessServiceNames.map((n) => `    ${n}`).join("\n")}
`
    : "";

  const reuse = context.existingFieldKeys?.length
    ? `\nReuse these field keys where they still apply: ${context.existingFieldKeys.join(", ")}.`
    : "";

  const about = context.formName ? `Form name: ${context.formName}\n\n` : "";

  return `You are designing a request form for an enterprise IT service
management system (TechHub). Reply with ONE JSON object and nothing else —
no markdown fences, no commentary.

SHAPE:
{
  "summary": string,          // one or two sentences
  "fields": [                 // 1 to 40 fields
    {
      "key": string,          // snake_case, unique, descriptive
                              // (business_justification, not field_1)
      "label": string,        // what the requester reads
      "type": <field type>,
      "required": boolean,    // optional, default false
      "position": integer,    // 0-based order
      "visibility": "${AI_FIELD_VISIBILITY.join('" | "')}",  // optional, default VISIBLE
      "config": object        // per type, see below
    }
  ]
}

FIELD TYPES and their config:

  SHORT_TEXT / LONG_TEXT / NUMBER / DATE / DATETIME / CHECKBOX / FILE
    config: {}  — nothing to set.

  DROPDOWN / MULTI_SELECT
    config: { "options": ["Option A", "Option B"] }
    At least one option is required.

  USER_PICKER
    config: {}  — the requester picks a person from the directory.

  LOOKUP
    config: { "dataSource": "${AI_LOOKUP_SOURCES.join('" | "')}" }
    With "static", also give "options". With "ACCESS_SERVICES", omit options.
${serviceSection}
  SECTION_HEADER
    config: {}  — a heading only; never required, carries no value.

  SYSTEM_FIELD
    config: { "systemField": "${AI_SYSTEM_FIELDS.join('" | "')}" }
    Read-only, filled in by the system. Never mark it required.

  REPEATER
    config: { "minRows": integer, "maxRows": integer, "subFields": [...] }
    Only when the requester genuinely adds several of the same thing.

  REQUEST_LINK / SCORED_MATRIX / COMPUTED
    config: {}  — leave empty; these are wired up by a person afterwards.

VISIBILITY:
- VISIBLE        the requester sees and fills it in
- HIDDEN         not shown on submission; a later step may reveal it
- ADMINISTRATIVE only staff see it, never the requester

RULES:
- Ask only for what a decision genuinely needs. Every extra field is friction
  for the requester.
- Mark a field required only when a request is meaningless without it.
- Labels are what a person reads — write them in plain language, and in the
  same language as the description.
- Use SECTION_HEADER to group a long form, not to decorate a short one.
- Do not invent dropdown options for things you cannot know (system names,
  departments, cost centres). Use SHORT_TEXT, or leave options for a person
  to fill in.${reuse}

${about}Now describe the request this form is for, in your own words, and reply
with the JSON object only.`;
}
