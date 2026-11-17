/**
 * Creates and publishes request forms with their approval paths.
 *
 * How to run:
 *   1. Open TechHub in the browser, signed in as an admin.
 *   2. Open DevTools (F12) → Console.
 *   3. Paste this whole file and press Enter.
 *
 * It uses the same admin APIs as "New request type", so the same
 * permissions and checks apply. A published form whose name already
 * exists is skipped, so running it twice creates nothing new.
 */
(async () => {
  const DAY = 24 * 60;

  /** Reminder to whoever holds the step after 3, 6 and 9 days. */
  const REMINDERS = {
    durationMinutes: 3 * DAY,
    escalations: [3, 6, 9].map((days) => ({
      key: `reminder_${days}d`,
      thresholdMinutes: days * DAY,
      action: { kind: "REMINDER" },
    })),
  };

  // ---------------------------------------------------------------------
  // Access Management (cybersecurity), from the intranet form 23
  // ---------------------------------------------------------------------
  const MANAGER_UNAVAILABLE = ["On leave", "Not assigned", "Incorrect manager"];
  const managerUnavailable = {
    in: {
      value: { field: "manager_unavailable" },
      list: MANAGER_UNAVAILABLE.map((option) => ({ const: option })),
    },
  };

  const accessManagement = {
    name: "Access Management",
    description:
      "Request new access, a new permission, or removal of access to a system or service.",
    referenceNumberFormat: "AM-{YYYY}-{seq:04}",
    fields: [
      {
        key: "requester_name",
        label: "Requester name",
        type: "SYSTEM_FIELD",
        position: 1,
        config: { systemField: "REQUESTER_NAME" },
      },
      {
        key: "requester_email",
        label: "Requester email",
        type: "SYSTEM_FIELD",
        position: 2,
        config: { systemField: "REQUESTER_EMAIL" },
      },
      {
        key: "access_type",
        label: "Access type",
        type: "RADIO",
        required: true,
        position: 3,
        config: { options: ["New access", "New permission", "Revoke access"] },
      },
      { key: "expiry_date", label: "Expiry date", type: "DATE", position: 4 },
      {
        key: "justification",
        label: "Reason / justification",
        type: "LONG_TEXT",
        required: true,
        position: 5,
      },
      {
        key: "service",
        label: "Service",
        type: "LOOKUP",
        required: true,
        position: 6,
        config: { dataSource: "ACCESS_SERVICES" },
      },
      {
        key: "line_manager",
        label: "Requester line manager",
        type: "SYSTEM_FIELD",
        position: 7,
        config: { systemField: "REQUESTER_MANAGER_NAME" },
      },
      {
        key: "manager_unavailable",
        label: "Manager can't approve?",
        type: "RADIO",
        position: 8,
        config: { options: MANAGER_UNAVAILABLE },
      },
      {
        key: "acting_manager",
        label: "Acting or alternate manager",
        type: "USER_PICKER",
        required: true,
        position: 9,
        visibilityRules: managerUnavailable,
      },
      { key: "notes", label: "Notes", type: "LONG_TEXT", position: 10 },
    ],
    steps: [
      {
        key: "manager_approval",
        type: "APPROVAL",
        name: "Line manager approval",
        config: {
          type: "APPROVAL",
          // The line manager, or the acting manager the requester picked
          // when the manager can't approve (or none is on file).
          assignees: [
            {
              kind: "FALLBACK",
              primary: { kind: "REQUESTER_MANAGER" },
              fallbackFieldKey: "acting_manager",
              forceFallbackWhen: managerUnavailable,
            },
          ],
          multiAssigneePolicy: "ANY",
          allowReject: true,
          // Only for services whose catalog entry asks for it.
          onlyWhenServiceRequiresManagerApproval: "service",
          sla: REMINDERS,
        },
      },
      {
        key: "owner_approval",
        type: "APPROVAL",
        name: "Service owner approval",
        config: {
          type: "APPROVAL",
          assignees: [
            {
              kind: "ACCESS_SERVICE_ROLE",
              serviceSnapshotKey: "service",
              role: "OWNER",
            },
          ],
          multiAssigneePolicy: "ANY",
          allowReject: true,
          sla: REMINDERS,
        },
      },
      {
        key: "cybersecurity_approval",
        type: "APPROVAL",
        name: "Cybersecurity approval",
        config: {
          type: "APPROVAL",
          assignees: [
            {
              kind: "ACCESS_SERVICE_ROLE",
              serviceSnapshotKey: "service",
              role: "CYBERSECURITY",
            },
          ],
          multiAssigneePolicy: "ANY",
          allowReject: true,
          sla: REMINDERS,
        },
      },
      {
        key: "implementation",
        type: "EXECUTION",
        name: "Implementer",
        config: {
          type: "EXECUTION",
          assignees: [
            {
              kind: "ACCESS_SERVICE_ROLE",
              serviceSnapshotKey: "service",
              role: "IMPLEMENTER",
            },
          ],
          sla: REMINDERS,
        },
      },
    ],
    // Approvers read the request. As on the intranet, the manager may add
    // notes, the owner and cybersecurity may change the expiry date, and
    // the implementer both.
    editableAt: {
      manager_approval: ["notes"],
      owner_approval: ["expiry_date"],
      cybersecurity_approval: ["expiry_date"],
      implementation: ["expiry_date", "notes"],
    },
  };

  const FORMS = [accessManagement];

  // ---------------------------------------------------------------------

  async function api(method, url, body) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        data.message ||
        (data.issues ? JSON.stringify(data.issues) : "") ||
        data.error ||
        response.statusText;
      throw new Error(`${method} ${url} → ${response.status}: ${detail}`);
    }
    return data;
  }

  /** Steps in order: approvals continue on APPROVE, the rest by default. */
  function buildGraph(steps) {
    return {
      start: steps[0].key,
      steps: steps.map((step, index) => {
        const following = steps[index + 1];
        const next = following
          ? step.type === "APPROVAL"
            ? { onAction: { APPROVE: following.key } }
            : { default: following.key }
          : undefined;
        return { ...step, position: index + 1, next };
      }),
    };
  }

  function buildFieldState(form) {
    const state = {};
    for (const step of form.steps) {
      const editable = new Set(form.editableAt[step.key] ?? []);
      state[step.key] = Object.fromEntries(
        form.fields
          .filter((field) => field.type !== "SYSTEM_FIELD")
          .map((field) => [
            field.key,
            editable.has(field.key) ? "EDITABLE" : "READ_ONLY",
          ]),
      );
    }
    return state;
  }

  async function createForm(form, existingForms, existingWorkflows) {
    // A form that exists but was never published was left by an
    // interrupted run: finish it instead of skipping it.
    const existing = existingForms.find((f) => f.name === form.name);
    if (existing?.publishedVersion) {
      return { name: form.name, status: "skipped (already exists)" };
    }

    // The approval path. Reuse the one already linked or left behind.
    const workflowName = `${form.name} approval`;
    let workflowId =
      existing?.workflowDefinition?.id ??
      existingWorkflows.find((w) => w.name === workflowName)?.id;
    if (!workflowId) {
      const created = await api("POST", "/api/workflow/admin/workflows", {
        name: workflowName,
        description: `Approval path for “${form.name}”.`,
      });
      workflowId = created.definition.id;
    }
    const workflowUrl = `/api/workflow/admin/workflows/${workflowId}`;
    await api("GET", `${workflowUrl}/draft`); // makes a draft if none is open
    await api("PUT", `${workflowUrl}/draft`, buildGraph(form.steps));
    await api("POST", `${workflowUrl}/publish`);

    // The form.
    let formId = existing?.id;
    if (!formId) {
      const created = await api("POST", "/api/workflow/admin/forms", {
        name: form.name,
        description: form.description,
        workflowDefinitionId: workflowId,
        referenceNumberFormat: form.referenceNumberFormat,
      });
      formId = created.form.id;
    }
    const formUrl = `/api/workflow/admin/forms/${formId}`;
    await api("GET", `${formUrl}/draft`);
    await api("PUT", `${formUrl}/draft`, {
      fields: form.fields,
      perStepFieldState: buildFieldState(form),
    });
    await api("POST", `${formUrl}/publish`);

    return {
      name: form.name,
      status: existing ? "finished and published" : "created and published",
      link: `${location.origin}/workflows/admin/forms/${formId}`,
    };
  }

  const [{ forms }, { definitions }] = await Promise.all([
    api("GET", "/api/workflow/admin/forms"),
    api("GET", "/api/workflow/admin/workflows"),
  ]);

  const results = [];
  for (const form of FORMS) {
    try {
      results.push(await createForm(form, forms, definitions));
    } catch (error) {
      results.push({ name: form.name, status: `FAILED: ${error.message}` });
    }
  }
  console.table(results);
})();
