-- CreateEnum
CREATE TYPE "version_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ON_HOLD', 'IN_PROGRESS', 'PENDING_REVIEW', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "request_outcome" AS ENUM ('SUCCESSFUL', 'SUCCESSFUL_WITH_ISSUES', 'UNSUCCESSFUL', 'WITHDRAWN', 'REJECTED', 'SUPERSEDED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "step_instance_status" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "step_type" AS ENUM ('APPROVAL', 'EXECUTION', 'INFO_ACK', 'AUTOMATION', 'NOTIFICATION', 'CONDITIONAL_BRANCH', 'DELAY', 'SCHEDULE', 'WEBHOOK', 'SUB_WORKFLOW', 'WAIT_FOR_EVENT');

-- CreateEnum
CREATE TYPE "field_type" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'DATE', 'DATETIME', 'DROPDOWN', 'MULTI_SELECT', 'CHECKBOX', 'FILE', 'USER_PICKER', 'MULTI_USER_PICKER', 'REQUEST_LINK', 'SCORED_MATRIX', 'REPEATER', 'LOOKUP', 'SECTION_HEADER', 'COMPUTED');

-- CreateEnum
CREATE TYPE "rejection_restart_mode" AS ENUM ('FULL_RESTART', 'RESUME_FROM_REJECTION_STEP');

-- CreateEnum
CREATE TYPE "sla_event_type" AS ENUM ('START', 'PAUSE', 'RESUME', 'BREACH');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "email_action_token_status" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "blackout_behavior" AS ENUM ('BLOCK', 'WARN', 'IGNORE');

-- CreateEnum
CREATE TYPE "watcher_channel" AS ENUM ('IN_APP', 'EMAIL', 'BOTH', 'MUTED');

-- CreateEnum
CREATE TYPE "form_notification_recipient_kind" AS ENUM ('REQUESTER', 'STEP_ASSIGNEES', 'WATCHERS', 'ROLE');

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "request_status" NOT NULL DEFAULT 'DRAFT',
    "outcome" "request_outcome",
    "outcomeCodeId" TEXT,
    "outcomeNotes" TEXT,
    "holdReasonId" TEXT,
    "currentStepInstanceId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_field_values" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_instances" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "status" "step_instance_status" NOT NULL DEFAULT 'PENDING',
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcomeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_links" (
    "id" TEXT NOT NULL,
    "sourceRequestId" TEXT NOT NULL,
    "targetRequestId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "sourceFieldKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_comments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fieldKey" TEXT,
    "commentId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "storageRef" TEXT NOT NULL,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filterJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "stepInstanceId" TEXT,
    "actorUserId" TEXT,
    "actorSystem" TEXT,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "referencesAuditEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_history_entries" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "computedValueJson" JSONB,
    "auditEntryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignee_snapshots" (
    "id" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viaDelegationChainJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignee_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_events" (
    "id" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "eventType" "sla_event_type" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" JSONB,

    CONSTRAINT "sla_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_escalation_logs" (
    "id" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "thresholdMs" INTEGER NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" JSONB,

    CONSTRAINT "sla_escalation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "notification_channel" NOT NULL DEFAULT 'IN_APP',
    "requestId" TEXT,
    "stepInstanceId" TEXT,
    "templateKey" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payloadJson" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_action_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "email_action_token_status" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "workingHoursJson" JSONB NOT NULL,
    "holidaysJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_windows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recurrenceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackout_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "behavior" "blackout_behavior" NOT NULL DEFAULT 'BLOCK',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blackout_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hold_reasons" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hold_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcome_codes" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "genericOutcome" "request_outcome" NOT NULL,
    "formId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outcome_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchers" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watcher_subscriptions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watcher_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watcher_channel_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "channel" "watcher_channel" NOT NULL DEFAULT 'IN_APP',

    CONSTRAINT "watcher_channel_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "referenceNumberFormat" TEXT NOT NULL DEFAULT 'REQ-{YYYY}-{seq:04}',
    "workflowDefinitionId" TEXT NOT NULL,
    "publishedVersionId" TEXT,
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_notification_bindings" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "emailTemplateKey" TEXT NOT NULL,
    "recipientKind" "form_notification_recipient_kind" NOT NULL,
    "recipientRoleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_notification_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_versions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "version_status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "schemaJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "field_type" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "config" JSONB,
    "visibilityRules" JSONB,
    "computedFormula" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "publishedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL,
    "workflowDefinitionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "version_status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "graphJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "step_type" NOT NULL,
    "position" INTEGER NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rejection_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "restartMode" "rejection_restart_mode" NOT NULL DEFAULT 'FULL_RESTART',
    "fieldLockRulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rejection_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "variablesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requests_status_createdAt_idx" ON "requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "requests_requesterId_createdAt_idx" ON "requests"("requesterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "requests_formId_referenceNumber_key" ON "requests"("formId", "referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "request_field_values_requestId_fieldKey_key" ON "request_field_values"("requestId", "fieldKey");

-- CreateIndex
CREATE INDEX "step_instances_requestId_status_idx" ON "step_instances"("requestId", "status");

-- CreateIndex
CREATE INDEX "request_links_targetRequestId_idx" ON "request_links"("targetRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "request_links_sourceRequestId_targetRequestId_sourceFieldKe_key" ON "request_links"("sourceRequestId", "targetRequestId", "sourceFieldKey");

-- CreateIndex
CREATE INDEX "request_comments_requestId_createdAt_idx" ON "request_comments"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "request_attachments_requestId_createdAt_idx" ON "request_attachments"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "request_attachments_commentId_idx" ON "request_attachments"("commentId");

-- CreateIndex
CREATE INDEX "saved_filters_userId_idx" ON "saved_filters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_filters_userId_name_key" ON "saved_filters"("userId", "name");

-- CreateIndex
CREATE INDEX "audit_entries_createdAt_idx" ON "audit_entries"("createdAt");

-- CreateIndex
CREATE INDEX "audit_entries_requestId_createdAt_idx" ON "audit_entries"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "field_history_entries_requestId_formVersionId_fieldKey_idx" ON "field_history_entries"("requestId", "formVersionId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "assignee_snapshots_stepInstanceId_userId_key" ON "assignee_snapshots"("stepInstanceId", "userId");

-- CreateIndex
CREATE INDEX "sla_events_stepInstanceId_occurredAt_idx" ON "sla_events"("stepInstanceId", "occurredAt");

-- CreateIndex
CREATE INDEX "sla_escalation_logs_stepInstanceId_firedAt_idx" ON "sla_escalation_logs"("stepInstanceId", "firedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sla_escalation_logs_stepInstanceId_ruleKey_key" ON "sla_escalation_logs"("stepInstanceId", "ruleKey");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_action_tokens_token_key" ON "email_action_tokens"("token");

-- CreateIndex
CREATE INDEX "email_action_tokens_userId_idx" ON "email_action_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_action_tokens_stepInstanceId_idx" ON "email_action_tokens"("stepInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_name_key" ON "calendars"("name");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_windows_name_key" ON "maintenance_windows"("name");

-- CreateIndex
CREATE INDEX "blackout_periods_startsAt_endsAt_idx" ON "blackout_periods"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "hold_reasons_key_key" ON "hold_reasons"("key");

-- CreateIndex
CREATE INDEX "outcome_codes_formId_isActive_idx" ON "outcome_codes"("formId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "outcome_codes_key_key" ON "outcome_codes"("key");

-- CreateIndex
CREATE INDEX "delegations_fromUserId_isActive_idx" ON "delegations"("fromUserId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "watchers_requestId_userId_key" ON "watchers"("requestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "watcher_subscriptions_formId_roleId_key" ON "watcher_subscriptions"("formId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "watcher_channel_preferences_userId_formId_key" ON "watcher_channel_preferences"("userId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "forms_publishedVersionId_key" ON "forms"("publishedVersionId");

-- CreateIndex
CREATE INDEX "forms_isActive_idx" ON "forms"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "forms_name_key" ON "forms"("name");

-- CreateIndex
CREATE INDEX "form_notification_bindings_formId_event_idx" ON "form_notification_bindings"("formId", "event");

-- CreateIndex
CREATE UNIQUE INDEX "form_versions_formId_versionNumber_key" ON "form_versions"("formId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_formVersionId_key_key" ON "form_fields"("formVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_publishedVersionId_key" ON "workflow_definitions"("publishedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_name_key" ON "workflow_definitions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_workflowDefinitionId_versionNumber_key" ON "workflow_versions"("workflowDefinitionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_steps_workflowVersionId_key_key" ON "workflow_steps"("workflowVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "rejection_policies_name_key" ON "rejection_policies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "workflow_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_holdReasonId_fkey" FOREIGN KEY ("holdReasonId") REFERENCES "hold_reasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_outcomeCodeId_fkey" FOREIGN KEY ("outcomeCodeId") REFERENCES "outcome_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_field_values" ADD CONSTRAINT "request_field_values_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_field_values" ADD CONSTRAINT "request_field_values_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_instances" ADD CONSTRAINT "step_instances_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_instances" ADD CONSTRAINT "step_instances_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "workflow_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_links" ADD CONSTRAINT "request_links_sourceRequestId_fkey" FOREIGN KEY ("sourceRequestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_links" ADD CONSTRAINT "request_links_targetRequestId_fkey" FOREIGN KEY ("targetRequestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "request_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "request_attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_referencesAuditEntryId_fkey" FOREIGN KEY ("referencesAuditEntryId") REFERENCES "audit_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_history_entries" ADD CONSTRAINT "field_history_entries_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_history_entries" ADD CONSTRAINT "field_history_entries_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_history_entries" ADD CONSTRAINT "field_history_entries_auditEntryId_fkey" FOREIGN KEY ("auditEntryId") REFERENCES "audit_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignee_snapshots" ADD CONSTRAINT "assignee_snapshots_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignee_snapshots" ADD CONSTRAINT "assignee_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_events" ADD CONSTRAINT "sla_events_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_escalation_logs" ADD CONSTRAINT "sla_escalation_logs_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "step_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcome_codes" ADD CONSTRAINT "outcome_codes_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchers" ADD CONSTRAINT "watchers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchers" ADD CONSTRAINT "watchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watcher_subscriptions" ADD CONSTRAINT "watcher_subscriptions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watcher_subscriptions" ADD CONSTRAINT "watcher_subscriptions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watcher_channel_preferences" ADD CONSTRAINT "watcher_channel_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watcher_channel_preferences" ADD CONSTRAINT "watcher_channel_preferences_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "form_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_notification_bindings" ADD CONSTRAINT "form_notification_bindings_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_notification_bindings" ADD CONSTRAINT "form_notification_bindings_recipientRoleId_fkey" FOREIGN KEY ("recipientRoleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "workflow_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "workflow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
