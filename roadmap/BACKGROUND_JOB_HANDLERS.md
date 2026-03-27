# Background Job Handlers — Complete Missing Implementations

**Status**: Planned
**Priority**: High
**Complexity**: Small
**Estimated Effort**: 4-6 hours
**Last Updated**: 2026-03-27

## Overview

4 scheduled background jobs have registered handlers in the worker but their implementations are TODO stubs. The BullMQ infrastructure, queue definitions, and scheduling are all in place — only the handler logic is missing.

## Missing Handlers

### 1. `handleSendWelcomeEmail` (EMAIL queue)

**Job name**: `EMAIL_JOBS.SEND_WELCOME_EMAIL`
**File**: `src/infrastructure/services/queue/worker.ts` (TODO stub ~line 116)

**What it should do**:
- Receive `{ userId, email, name }` from job data
- Use `MicrosoftGraphEmailService` (already implemented and tested) to send welcome email
- Template: Welcome to Barq ITAM with first-login instructions
- Log success/failure via DI logger

**Dependencies**: `MicrosoftGraphEmailService` (ready), email templates (need to create)

### 2. `handleSendTaskNotification` (EMAIL queue)

**Job name**: `EMAIL_JOBS.SEND_TASK_NOTIFICATION`
**File**: `src/infrastructure/services/queue/worker.ts` (TODO stub ~line 116)

**What it should do**:
- Receive `{ taskId, assigneeEmail, taskTitle, dueDate }` from job data
- Use `MicrosoftGraphEmailService` to send task notification
- Include task details and link to task page
- Log success/failure

**Dependencies**: `MicrosoftGraphEmailService` (ready), email templates (need to create)

### 3. `handleDatabaseCleanup` (MAINTENANCE queue)

**Job name**: `MAINTENANCE_JOBS.DATABASE_CLEANUP`
**File**: `src/infrastructure/services/queue/worker.ts` (TODO stub ~line 202)

**What it should do**:
- Clean up expired sessions (Better Auth sessions table)
- Purge old audit log entries beyond retention period
- Clean up orphaned file uploads not linked to any attachment
- Report cleanup counts via structured logging

**Dependencies**: Prisma client, retention policy configuration

### 4. `handleDataExport` (MAINTENANCE queue)

**Job name**: `MAINTENANCE_JOBS.DATA_EXPORT`
**File**: `src/infrastructure/services/queue/worker.ts` (TODO stub ~line 202)

**What it should do**:
- Receive `{ entityType, filters, format, requestedById }` from job data
- Export requested data to CSV/XLSX file
- Store in `private/exports/` directory
- Notify requester when complete (via task or email)
- Clean up old exports after configurable retention period

**Dependencies**: Existing entity repositories, CSV/XLSX generation utilities

## Implementation Notes

- All 4 handlers follow the same pattern as existing implemented handlers in `worker.ts`
- Each handler should use `@LogExecution` or equivalent structured logging
- Error handling: let BullMQ retry mechanism handle transient failures
- Email handlers depend on Microsoft Graph credentials being configured

## Files to Modify

| File | Action |
|------|--------|
| `src/infrastructure/services/queue/worker.ts` | Replace TODO stubs with implementations |
| `src/infrastructure/services/email/templates/` | Create email templates (new directory) |

## Verification

1. `npm run validate` passes
2. Trigger each job manually from `/admin/workers` dashboard
3. Verify email delivery (use `scripts/dev/test-email.ts` pattern)
4. Check structured logs for success entries
