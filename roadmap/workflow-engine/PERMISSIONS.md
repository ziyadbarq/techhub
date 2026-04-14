# Permissions

Two permission groups: one for the Workflow Engine admin surface, one for Change Management operations.

---

## Workflow Engine Permissions

Group name: `Workflow Engine`
Feature flag dependency: none (engine is always available)

| Key | Code | Description |
|---|---|---|
| `WORKFLOW_DEFINITIONS_VIEW` | `workflow-definitions:view` | View published workflow definitions and their step graphs |
| `WORKFLOW_DEFINITIONS_MANAGE` | `workflow-definitions:manage` | Create, edit, publish, archive, and clone workflow definitions |
| `WORKFLOW_INSTANCES_VIEW` | `workflow-instances:view` | View any running or completed workflow instance and its audit trail |
| `WORKFLOW_INSTANCES_MANAGE` | `workflow-instances:manage` | Admin: force-advance steps, re-assign tasks, cancel stuck instances |

**Total: 4 permissions**

---

## Change Management Permissions

Group name: `Change Management`
Feature flag dependency: `CHANGE_MANAGEMENT`

| Key | Code | Description |
|---|---|---|
| `CHANGES_VIEW` | `changes:view` | View change requests (list, detail, timeline) |
| `CHANGES_CREATE` | `changes:create` | Create new change requests |
| `CHANGES_UPDATE` | `changes:update` | Edit a change request in DRAFT or SUBMITTED status |
| `CHANGES_DELETE` | `changes:delete` | Delete a change request in DRAFT status only |
| `CHANGES_SUBMIT` | `changes:submit` | Submit a change request to start the workflow |
| `CHANGES_ASSESS_RISK` | `changes:assess-risk` | Fill in or update the risk assessment fields |
| `CHANGES_APPROVE` | `changes:approve` | Approve, reject, or request more info on a workflow step |
| `CHANGES_SCHEDULE` | `changes:schedule` | Set scheduled start/end and assign a maintenance window |
| `CHANGES_IMPLEMENT` | `changes:implement` | Mark implementation as started, completed, failed, or rolled back |
| `CHANGES_CLOSE` | `changes:close` | Close a change in COMPLETED, ROLLED_BACK, or PIR_PENDING state |
| `CHANGES_CANCEL` | `changes:cancel` | Cancel a change in any non-terminal state |
| `CHANGES_PIR_CREATE` | `changes:pir-create` | Submit a post-implementation review |
| `CHANGES_PIR_VIEW` | `changes:pir-view` | View post-implementation review records |
| `CHANGES_MANAGE` | `changes:manage` | Admin: re-assign workflow steps, override decisions, force state transitions |
| `CHANGES_DASHBOARD` | `changes:dashboard` | Access the executive change management dashboard |
| `MAINTENANCE_WINDOWS_VIEW` | `maintenance-windows:view` | View maintenance windows and blackout periods |
| `MAINTENANCE_WINDOWS_MANAGE` | `maintenance-windows:manage` | Create, edit, and delete maintenance windows and blackouts |

**Total: 17 permissions**

**Combined total: 21 permissions across 2 groups**

---

## Role Assignments (Seed)

These are the suggested default role assignments. Adjust per Barq's actual org structure.

| Role | Permissions |
|---|---|
| `system-administrator` | All 21 permissions |
| `change-manager` | All CHANGES_* + MAINTENANCE_WINDOWS_MANAGE + WORKFLOW_INSTANCES_VIEW |
| `cab-member` | CHANGES_VIEW + CHANGES_APPROVE + CHANGES_DASHBOARD |
| `it-staff` | CHANGES_VIEW + CHANGES_CREATE + CHANGES_SUBMIT + CHANGES_IMPLEMENT + CHANGES_PIR_CREATE + CHANGES_PIR_VIEW + CHANGES_CANCEL + MAINTENANCE_WINDOWS_VIEW |
| `viewer` | CHANGES_VIEW + CHANGES_PIR_VIEW + MAINTENANCE_WINDOWS_VIEW |

---

## Feature Flag

```typescript
{
  key: "CHANGE_MANAGEMENT",
  name: "Change Management",
  description: "ITIL-aligned change request lifecycle with native workflow engine",
  layer: "LAYER_3",
  dependencies: ["CMDB", "SERVICES", "FOUNDATION"],
  defaultEnabled: false,
}
```
