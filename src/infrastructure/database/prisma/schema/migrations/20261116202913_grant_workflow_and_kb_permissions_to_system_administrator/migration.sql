-- Give the System Administrator every Workflow Engine and Knowledge Base
-- permission in environments that already exist.
--
-- Why a migration: the production seed only runs on an empty database, and
-- seed-config-only registers workflow permission definitions without any
-- role grants. So databases created before these modules have the
-- permissions missing or unassigned, and the System Administrator ("all
-- permissions") cannot open them.
--
-- Additive and idempotent: missing permissions are created (same
-- definitions as seed-rbac-permissions.ts); existing ones are left as they
-- are; only the system-administrator role receives grants. No other role
-- changes. Effective within the 5-minute permission cache TTL.

INSERT INTO "permissions" ("id", "name", "displayName", "description", "resource", "action", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  ('perm_workflows_forms_view', 'workflows-forms:view', 'View Forms', 'View workflow form definitions', 'workflows-forms', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_forms_create', 'workflows-forms:create', 'Create Forms', 'Create new workflow form definitions', 'workflows-forms', 'create', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_forms_update', 'workflows-forms:update', 'Update Forms', 'Edit workflow form definitions (draft versions)', 'workflows-forms', 'update', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_forms_delete', 'workflows-forms:delete', 'Delete Forms', 'Archive workflow form definitions', 'workflows-forms', 'delete', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_forms_publish', 'workflows-forms:publish', 'Publish Forms', 'Publish a draft form version (becomes immutable)', 'workflows-forms', 'publish', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_forms_manage_notifications', 'workflows-forms:manage-notifications', 'Manage Form Notifications', 'Configure per-form email notification bindings', 'workflows-forms', 'manage-notifications', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_definitions_view', 'workflows-definitions:view', 'View Workflow Definitions', 'View workflow definitions', 'workflows-definitions', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_definitions_create', 'workflows-definitions:create', 'Create Workflow Definitions', 'Create new workflow definitions', 'workflows-definitions', 'create', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_definitions_update', 'workflows-definitions:update', 'Update Workflow Definitions', 'Edit workflow definitions (draft versions)', 'workflows-definitions', 'update', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_definitions_delete', 'workflows-definitions:delete', 'Delete Workflow Definitions', 'Archive workflow definitions', 'workflows-definitions', 'delete', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_definitions_publish', 'workflows-definitions:publish', 'Publish Workflow Definitions', 'Publish a draft workflow version (becomes immutable)', 'workflows-definitions', 'publish', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_view', 'workflows-requests:view', 'View All Requests', 'View all workflow requests across all forms', 'workflows-requests', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_view_own', 'workflows-requests:view:own', 'View Own Requests', 'View requests the user submitted or is involved with', 'workflows-requests', 'view:own', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_submit', 'workflows-requests:submit', 'Submit Requests', 'Submit a new workflow request', 'workflows-requests', 'submit', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_act', 'workflows-requests:act', 'Act on Requests', 'Take action (approve/reject/complete/etc.) on assigned steps', 'workflows-requests', 'act', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_comment', 'workflows-requests:comment', 'Comment on Requests', 'Add comments to a request thread', 'workflows-requests', 'comment', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_attach', 'workflows-requests:attach', 'Attach Files to Requests', 'Upload file attachments to a request', 'workflows-requests', 'attach', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_cancel', 'workflows-requests:cancel', 'Cancel Any Request', 'Cancel any request', 'workflows-requests', 'cancel', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_cancel_own', 'workflows-requests:cancel:own', 'Cancel Own Request', 'Cancel a request the user submitted', 'workflows-requests', 'cancel:own', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_hold', 'workflows-requests:hold', 'Hold / Resume Requests', 'Place requests on hold or resume them', 'workflows-requests', 'hold', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_override', 'workflows-requests:override', 'Override Request Outcomes', 'Force-set a terminal outcome on a request (admin)', 'workflows-requests', 'override', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_requests_reassign', 'workflows-requests:reassign', 'Reassign Step Instances', 'Reassign a step to a different user (admin)', 'workflows-requests', 'reassign', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_inbox_view', 'workflows-inbox:view', 'View Workflow Inbox', 'View grouped inbox of pending actions and watched requests', 'workflows-inbox', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_notifications_view', 'workflows-notifications:view', 'View Workflow Notifications', 'View in-app workflow notifications', 'workflows-notifications', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_analytics_view', 'workflows-analytics:view', 'View Workflow Analytics', 'View dashboards for workflow throughput, SLA, and outcomes', 'workflows-analytics', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_audit_export', 'workflows-audit:export', 'Export Workflow Audit', 'Export workflow audit trail to CSV', 'workflows-audit', 'export', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_calendars_view', 'workflows-calendars:view', 'View Calendars', 'View business calendars used by workflow SLA', 'workflows-calendars', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_calendars_manage', 'workflows-calendars:manage', 'Manage Calendars', 'Create and edit business calendars', 'workflows-calendars', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_hold_reasons_manage', 'workflows-hold-reasons:manage', 'Manage Hold Reasons', 'Create and edit the hold reason catalog', 'workflows-hold-reasons', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_outcome_codes_manage', 'workflows-outcome-codes:manage', 'Manage Outcome Codes', 'Create and edit module-specific outcome codes', 'workflows-outcome-codes', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_rejection_policies_manage', 'workflows-rejection-policies:manage', 'Manage Rejection Policies', 'Create and edit rejection policies', 'workflows-rejection-policies', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_email_templates_manage', 'workflows-email-templates:manage', 'Manage Email Templates', 'Create and edit workflow email templates', 'workflows-email-templates', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_delegations_manage', 'workflows-delegations:manage', 'Manage Delegations', 'Create and revoke user-to-user delegations', 'workflows-delegations', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_blackout_periods_manage', 'workflows-blackout-periods:manage', 'Manage Blackout Periods', 'Create and edit change-freeze periods', 'workflows-blackout-periods', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_maintenance_windows_manage', 'workflows-maintenance-windows:manage', 'Manage Maintenance Windows', 'Create and edit named maintenance windows', 'workflows-maintenance-windows', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_watchers_manage', 'workflows-watchers:manage', 'Manage Watcher Subscriptions', 'Configure role-based watcher subscriptions per form', 'workflows-watchers', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_access_services_view', 'workflows-access-services:view', 'View Access Services', 'View the access service catalog', 'workflows-access-services', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_access_services_create', 'workflows-access-services:create', 'Create Access Services', 'Add new access services to the catalog', 'workflows-access-services', 'create', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_access_services_update', 'workflows-access-services:update', 'Update Access Services', 'Edit existing access service details and assignees', 'workflows-access-services', 'update', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_workflows_access_services_manage', 'workflows-access-services:manage', 'Manage Access Services', 'Activate/deactivate services and perform bulk import/export', 'workflows-access-services', 'manage', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_view', 'knowledge-base:view', 'View Knowledge base', 'View knowledge base', 'knowledge-base', 'view', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_create', 'knowledge-base:create', 'Create Knowledge base', 'Create knowledge base', 'knowledge-base', 'create', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_update', 'knowledge-base:update', 'Update Knowledge base', 'Update knowledge base', 'knowledge-base', 'update', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_publish', 'knowledge-base:publish', 'Publish Knowledge base', 'Publish knowledge base', 'knowledge-base', 'publish', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_archive', 'knowledge-base:archive', 'Archive Knowledge base', 'Archive knowledge base', 'knowledge-base', 'archive', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_knowledge_base_view_restricted', 'knowledge-base:view:restricted', 'View restricted Knowledge base', 'View restricted knowledge base', 'knowledge-base', 'view:restricted', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || md5(r."id" || ':' || p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."name" IN (
  'workflows-forms:view',
  'workflows-forms:create',
  'workflows-forms:update',
  'workflows-forms:delete',
  'workflows-forms:publish',
  'workflows-forms:manage-notifications',
  'workflows-definitions:view',
  'workflows-definitions:create',
  'workflows-definitions:update',
  'workflows-definitions:delete',
  'workflows-definitions:publish',
  'workflows-requests:view',
  'workflows-requests:view:own',
  'workflows-requests:submit',
  'workflows-requests:act',
  'workflows-requests:comment',
  'workflows-requests:attach',
  'workflows-requests:cancel',
  'workflows-requests:cancel:own',
  'workflows-requests:hold',
  'workflows-requests:override',
  'workflows-requests:reassign',
  'workflows-inbox:view',
  'workflows-notifications:view',
  'workflows-analytics:view',
  'workflows-audit:export',
  'workflows-calendars:view',
  'workflows-calendars:manage',
  'workflows-hold-reasons:manage',
  'workflows-outcome-codes:manage',
  'workflows-rejection-policies:manage',
  'workflows-email-templates:manage',
  'workflows-delegations:manage',
  'workflows-blackout-periods:manage',
  'workflows-maintenance-windows:manage',
  'workflows-watchers:manage',
  'workflows-access-services:view',
  'workflows-access-services:create',
  'workflows-access-services:update',
  'workflows-access-services:manage',
  'knowledge-base:view',
  'knowledge-base:create',
  'knowledge-base:update',
  'knowledge-base:publish',
  'knowledge-base:archive',
  'knowledge-base:view:restricted'
)
WHERE r."name" = 'system-administrator'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
