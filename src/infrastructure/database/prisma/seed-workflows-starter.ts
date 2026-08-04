/**
 * TechHub Workflow Starter Seed
 *
 * Seeds ready-to-use forms + workflows tailored to TechHub's ITAM/CMDB
 * business domain. Fully idempotent — safe to re-run.
 *
 * Included forms & workflows:
 *  1. Asset Request        — Employee requests a new asset
 *  2. Access Request       — Request access to a system/service (RBAC)
 *  3. Vendor Onboarding    — Approve a new vendor
 *  4. CI Change Request    — ITIL-style change on a configuration item
 *
 * All workflows use REQUESTER_MANAGER or ROLE-based assignees so they work
 * out of the box without hard-coding user IDs. Roles referenced must be
 * seeded by seed-rbac (system-administrator, service-owner, security-officer,
 * inventory-manager, finance-manager, it-help-desk).
 */

import type { PrismaClient } from "@/generated/prisma/server";
import type { Prisma } from "@/generated/prisma/server";
import { prisma as prismaSingleton } from "./client";
import { logSection, logStep, logSuccess } from "./seed-utils";

const asJson = (v: unknown) => v as unknown as Prisma.InputJsonValue;

// Shape helpers (avoid tight coupling with domain types so this file
// stays self-contained if types move).
type AssigneeSpec =
  | { kind: "REQUESTER" }
  | { kind: "REQUESTER_MANAGER" }
  | { kind: "USER"; userId: string }
  | { kind: "ROLE"; roleId: string }
  | { kind: "FIELD_USER"; fieldKey: string };

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
}

interface StepDef {
  key: string;
  type: string;
  position: number;
  name?: string;
  next?: { default?: string; onAction?: Record<string, string> };
  config: Record<string, unknown>;
}

interface StarterDefinition {
  formName: string;
  formDescription: string;
  workflowName: string;
  workflowDescription: string;
  referenceNumberFormat: string;
  fields: FieldDef[];
  buildSteps: (roles: Record<string, string>) => {
    start: string;
    steps: StepDef[];
  };
}

// ============================================================
// Field builders (compact — most Flowbit configs are optional)
// ============================================================

function dropdown(
  key: string,
  label: string,
  options: string[],
  position: number,
  required = true,
): FieldDef {
  return {
    key,
    label,
    type: "DROPDOWN",
    required,
    position,
    // Form renderer expects a plain string[] for DROPDOWN/MULTI_SELECT options.
    config: { options },
  };
}

function shortText(
  key: string,
  label: string,
  position: number,
  required = true,
): FieldDef {
  return { key, label, type: "SHORT_TEXT", required, position };
}

function longText(
  key: string,
  label: string,
  position: number,
  required = true,
): FieldDef {
  return { key, label, type: "LONG_TEXT", required, position };
}

function numberField(
  key: string,
  label: string,
  position: number,
  required = true,
): FieldDef {
  return { key, label, type: "NUMBER", required, position };
}

function dateField(
  key: string,
  label: string,
  position: number,
  required = true,
): FieldDef {
  return { key, label, type: "DATE", required, position };
}

function dateTimeField(
  key: string,
  label: string,
  position: number,
  required = true,
): FieldDef {
  return { key, label, type: "DATETIME", required, position };
}

function checkbox(key: string, label: string, position: number): FieldDef {
  return { key, label, type: "CHECKBOX", position };
}

function fileField(
  key: string,
  label: string,
  position: number,
  required = false,
): FieldDef {
  return { key, label, type: "FILE", required, position };
}

// ============================================================
// Assignee helpers
// ============================================================

function managerApproval(assignees: AssigneeSpec[]): Record<string, unknown> {
  return {
    type: "APPROVAL",
    assignees,
    multiAssigneePolicy: "ANY",
    allowReject: true,
  };
}

function execution(assignees: AssigneeSpec[]): Record<string, unknown> {
  return { type: "EXECUTION", assignees };
}

function infoAck(
  assignees: AssigneeSpec[],
  message?: string,
): Record<string, unknown> {
  return { type: "INFO_ACK", assignees, message };
}

// ============================================================
// Definitions (4 forms + workflows)
// ============================================================

const DEFINITIONS: StarterDefinition[] = [
  // ---- 1. Asset Request ----
  {
    formName: "Asset Request",
    formDescription:
      "Employee request for a new IT asset (laptop, monitor, phone, or peripheral). Routes to line manager and inventory team.",
    workflowName: "Asset Request Workflow",
    workflowDescription:
      "Manager approval → inventory review → procurement → handover.",
    referenceNumberFormat: "ASSET-{YYYY}-{seq:04}",
    fields: [
      dropdown(
        "asset_category",
        "Asset category",
        ["Laptop", "Desktop", "Monitor", "Mobile phone", "Peripheral", "Other"],
        1,
      ),
      shortText("preferred_model", "Preferred model / specification", 2, false),
      longText("business_justification", "Business justification", 3),
      dropdown("urgency", "Urgency", ["Low", "Medium", "High", "Critical"], 4),
      shortText("cost_center", "Cost center", 5),
      dateField("needed_by", "Needed by", 6),
    ],
    buildSteps: (roles) => ({
      start: "manager_approval",
      steps: [
        {
          key: "manager_approval",
          type: "APPROVAL",
          position: 1,
          name: "Line manager approval",
          next: {
            onAction: {
              APPROVE: "inventory_review",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([{ kind: "REQUESTER_MANAGER" }]),
        },
        {
          key: "inventory_review",
          type: "APPROVAL",
          position: 2,
          name: "Inventory review",
          next: {
            onAction: {
              APPROVE: "procurement",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["inventory-manager"] },
          ]),
        },
        {
          key: "procurement",
          type: "EXECUTION",
          position: 3,
          name: "Procurement",
          next: { default: "handover" },
          config: execution([
            { kind: "ROLE", roleId: roles["inventory-manager"] },
          ]),
        },
        {
          key: "handover",
          type: "EXECUTION",
          position: 4,
          name: "Asset handover",
          next: { default: "requester_notified" },
          config: execution([{ kind: "ROLE", roleId: roles["it-help-desk"] }]),
        },
        {
          key: "requester_notified",
          type: "INFO_ACK",
          position: 5,
          name: "Requester acknowledgement",
          config: infoAck(
            [{ kind: "REQUESTER" }],
            "Your asset request has been processed. Please acknowledge to close this request.",
          ),
        },
      ],
    }),
  },

  // ---- 2. Access Request ----
  {
    formName: "Access Request",
    formDescription:
      "Request access to a system or service — routes through line manager and security review before provisioning.",
    workflowName: "Access Request Workflow",
    workflowDescription:
      "Manager approval → security review → IT provisioning → requester acknowledgement.",
    referenceNumberFormat: "ACCESS-{YYYY}-{seq:04}",
    fields: [
      shortText("target_system", "Target system / service", 1),
      shortText("role_requested", "Role or permission requested", 2),
      dropdown(
        "access_duration",
        "Access duration",
        ["Permanent", "30 days", "90 days", "6 months", "12 months"],
        3,
      ),
      checkbox(
        "sensitive_data",
        "This access involves sensitive or personal data",
        4,
      ),
      longText("justification", "Business justification", 5),
      dateField("required_by", "Access required by", 6, false),
    ],
    buildSteps: (roles) => ({
      start: "manager_approval",
      steps: [
        {
          key: "manager_approval",
          type: "APPROVAL",
          position: 1,
          name: "Line manager approval",
          next: {
            onAction: {
              APPROVE: "security_review",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([{ kind: "REQUESTER_MANAGER" }]),
        },
        {
          key: "security_review",
          type: "APPROVAL",
          position: 2,
          name: "Security review",
          next: {
            onAction: {
              APPROVE: "provisioning",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["security-officer"] },
          ]),
        },
        {
          key: "provisioning",
          type: "EXECUTION",
          position: 3,
          name: "Access provisioning",
          next: { default: "requester_notified" },
          config: execution([{ kind: "ROLE", roleId: roles["it-help-desk"] }]),
        },
        {
          key: "requester_notified",
          type: "INFO_ACK",
          position: 4,
          name: "Requester acknowledgement",
          config: infoAck(
            [{ kind: "REQUESTER" }],
            "Your access request has been processed.",
          ),
        },
      ],
    }),
  },

  // ---- 3. Vendor Onboarding ----
  {
    formName: "Vendor Onboarding",
    formDescription:
      "Request to onboard a new vendor. Requires procurement, finance, and security sign-off before the vendor record is created.",
    workflowName: "Vendor Onboarding Workflow",
    workflowDescription:
      "Procurement review → finance review → security review → vendor record creation.",
    referenceNumberFormat: "VEND-{YYYY}-{seq:04}",
    fields: [
      shortText("vendor_name", "Vendor legal name", 1),
      dropdown(
        "vendor_category",
        "Vendor category",
        [
          "Software",
          "Hardware",
          "Consulting",
          "Managed Services",
          "Telecom",
          "Other",
        ],
        2,
      ),
      shortText("primary_contact", "Primary contact name", 3),
      shortText("primary_contact_email", "Primary contact email", 4),
      numberField("estimated_annual_spend", "Estimated annual spend (SAR)", 5),
      longText("business_justification", "Business justification", 6),
      fileField("commercial_registration", "Commercial registration (CR)", 7),
      fileField("compliance_docs", "Compliance / certification documents", 8),
    ],
    buildSteps: (roles) => ({
      start: "procurement_review",
      steps: [
        {
          key: "procurement_review",
          type: "APPROVAL",
          position: 1,
          name: "Procurement review",
          next: {
            onAction: {
              APPROVE: "finance_review",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["inventory-manager"] },
          ]),
        },
        {
          key: "finance_review",
          type: "APPROVAL",
          position: 2,
          name: "Finance review",
          next: {
            onAction: {
              APPROVE: "security_review",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["finance-manager"] },
          ]),
        },
        {
          key: "security_review",
          type: "APPROVAL",
          position: 3,
          name: "Security & compliance review",
          next: {
            onAction: {
              APPROVE: "create_vendor",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["security-officer"] },
          ]),
        },
        {
          key: "create_vendor",
          type: "EXECUTION",
          position: 4,
          name: "Create vendor record",
          next: { default: "requester_notified" },
          config: execution([
            { kind: "ROLE", roleId: roles["inventory-manager"] },
          ]),
        },
        {
          key: "requester_notified",
          type: "INFO_ACK",
          position: 5,
          name: "Requester acknowledgement",
          config: infoAck(
            [{ kind: "REQUESTER" }],
            "Vendor onboarding completed.",
          ),
        },
      ],
    }),
  },

  // ---- 4. CI Change Request ----
  {
    formName: "CI Change Request",
    formDescription:
      "ITIL-style change request against a Configuration Item. Peer review → CAB approval → implementation.",
    workflowName: "Change Management Workflow",
    workflowDescription:
      "Peer technical review → CAB approval → implementation → post-implementation review.",
    referenceNumberFormat: "CHG-{YYYY}-{seq:04}",
    fields: [
      shortText("ci_reference", "Configuration Item (CI ID or name)", 1),
      dropdown(
        "change_type",
        "Change type",
        ["Standard", "Normal", "Emergency"],
        2,
      ),
      longText("change_description", "Change description", 3),
      dropdown(
        "risk_level",
        "Risk level",
        ["Low", "Medium", "High", "Critical"],
        4,
      ),
      longText("impact_assessment", "Impact assessment", 5),
      dateTimeField("planned_start", "Planned start (UTC)", 6),
      dateTimeField("planned_end", "Planned end (UTC)", 7),
      longText("rollback_plan", "Rollback plan", 8),
    ],
    buildSteps: (roles) => ({
      start: "peer_review",
      steps: [
        {
          key: "peer_review",
          type: "APPROVAL",
          position: 1,
          name: "Peer technical review",
          next: {
            onAction: {
              APPROVE: "cab_approval",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["service-owner"] },
          ]),
        },
        {
          key: "cab_approval",
          type: "APPROVAL",
          position: 2,
          name: "CAB approval",
          next: {
            onAction: {
              APPROVE: "implementation",
              REJECT: "requester_notified",
            },
          },
          config: managerApproval([
            { kind: "ROLE", roleId: roles["system-administrator"] },
          ]),
        },
        {
          key: "implementation",
          type: "EXECUTION",
          position: 3,
          name: "Implementation",
          next: { default: "post_review" },
          config: execution([{ kind: "ROLE", roleId: roles["service-owner"] }]),
        },
        {
          key: "post_review",
          type: "INFO_ACK",
          position: 4,
          name: "Post-implementation review",
          config: infoAck(
            [{ kind: "REQUESTER" }],
            "Please confirm the change was implemented successfully.",
          ),
        },
        {
          key: "requester_notified",
          type: "INFO_ACK",
          position: 5,
          name: "Requester notified",
          config: infoAck(
            [{ kind: "REQUESTER" }],
            "Your change request has been closed.",
          ),
        },
      ],
    }),
  },
];

// ============================================================
// Seeder
// ============================================================

const REQUIRED_ROLES = [
  "system-administrator",
  "service-owner",
  "security-officer",
  "inventory-manager",
  "finance-manager",
  "it-help-desk",
];

export async function seedWorkflowsStarter(
  prisma: PrismaClient = prismaSingleton,
): Promise<void> {
  logSection("Workflow Starter (TechHub domain)");

  // Resolve required roles up front — any missing role aborts with a clear
  // message so we don't create broken workflow steps.
  const roleRows = await prisma.role.findMany({
    where: { name: { in: REQUIRED_ROLES } },
    select: { id: true, name: true },
  });
  const roles: Record<string, string> = {};
  for (const r of roleRows) roles[r.name] = r.id;
  const missing = REQUIRED_ROLES.filter((n) => !roles[n]);
  if (missing.length) {
    console.log(
      `  ⚠️  Skipping workflow starter — missing RBAC roles: ${missing.join(", ")}`,
    );
    console.log("  Ensure seed-rbac has run before seed-workflows-starter.");
    return;
  }

  for (const def of DEFINITIONS) {
    logStep("🧩", `Seeding "${def.formName}"...`);

    // Idempotency: if a form with this name already exists, skip everything
    // (the form owns the workflow via workflowDefinitionId).
    const existingForm = await prisma.form.findUnique({
      where: { name: def.formName },
      select: { id: true, publishedVersionId: true },
    });
    if (existingForm?.publishedVersionId) {
      console.log(`     ↺ already seeded — skipping`);
      continue;
    }

    const { start, steps } = def.buildSteps(roles);
    const graphJson = { start, steps };
    const schemaJson = { fields: def.fields };

    // Transaction so partial failure never leaves an unpublished shell.
    await prisma.$transaction(async (tx) => {
      // 1. WorkflowDefinition
      const workflowDef = await tx.workflowDefinition.upsert({
        where: { name: def.workflowName },
        update: { description: def.workflowDescription },
        create: {
          name: def.workflowName,
          description: def.workflowDescription,
        },
      });

      // 2. WorkflowVersion (published)
      const wfVersion = await tx.workflowVersion.create({
        data: {
          workflowDefinitionId: workflowDef.id,
          versionNumber: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          graphJson: asJson(graphJson),
        },
      });
      await tx.workflowDefinition.update({
        where: { id: workflowDef.id },
        data: { publishedVersionId: wfVersion.id },
      });

      // 3. Materialize WorkflowStep rows
      for (const s of steps) {
        await tx.workflowStep.create({
          data: {
            workflowVersionId: wfVersion.id,
            key: s.key,
            type: s.type as never,
            position: s.position,
            config: asJson(s.config),
          },
        });
      }

      // 4. Form
      const form = existingForm
        ? await tx.form.update({
            where: { id: existingForm.id },
            data: {
              description: def.formDescription,
              workflowDefinitionId: workflowDef.id,
              referenceNumberFormat: def.referenceNumberFormat,
            },
          })
        : await tx.form.create({
            data: {
              name: def.formName,
              description: def.formDescription,
              workflowDefinitionId: workflowDef.id,
              referenceNumberFormat: def.referenceNumberFormat,
            },
          });

      // 5. FormVersion (published)
      const formVersion = await tx.formVersion.create({
        data: {
          formId: form.id,
          versionNumber: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          schemaJson: asJson(schemaJson),
        },
      });
      await tx.form.update({
        where: { id: form.id },
        data: { publishedVersionId: formVersion.id },
      });

      // 6. Materialize FormField rows
      for (const f of def.fields) {
        await tx.formField.create({
          data: {
            formVersionId: formVersion.id,
            key: f.key,
            label: f.label,
            type: f.type as never,
            required: f.required ?? false,
            position: f.position,
            config: asJson(f.config ?? {}),
          },
        });
      }
    });

    logSuccess(`Seeded "${def.formName}"`);
  }
}
