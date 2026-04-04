# Admin Job Scheduler — UI-Configurable Scheduled Jobs

## Overview

Move scheduled job configuration from hardcoded worker code to a database-backed system that admins can manage through the UI. Admins will be able to enable/disable individual jobs, change cron frequencies, adjust job parameters, and view execution history — all without code deployments.

## Current State

- **8 scheduled jobs** across 3 queues (tasks, email, maintenance) defined in `src/infrastructure/services/queue/scheduled-jobs.ts`
- Cron patterns, timeouts, and job data are **hardcoded** — changes require a code deployment
- No per-job enable/disable — only full queue pause/resume is available
- ✅ Worker dashboard (`/admin/workers`) — **read-only monitoring implemented** (March 2026):
  - Real-time queue metrics, worker health indicators
  - Pause/resume controls per queue
  - Scheduled jobs table with cron patterns, next run times, manual trigger
  - Recent failures table with expandable error details
  - Auto-refresh every 30 seconds
  - Server-side permission gating (`SETTINGS_MANAGE`)
- **Remaining**: Database-driven scheduling (Phases 1-5 below)

## Proposed Architecture

### Database Model

New Prisma model to store job schedule configuration:

```prisma
model ScheduledJobConfig {
  id              String    @id @default(cuid())
  jobName         String    @unique          // e.g. "intune-device-sync"
  displayName     String                      // e.g. "Intune Device Sync"
  description     String?                     // Human-readable purpose
  queueName       String                      // "tasks" | "email" | "maintenance"
  cronPattern     String                      // "0 3 * * *"
  timezone        String    @default("UTC")
  enabled         Boolean   @default(true)
  jobData         Json      @default("{}")    // Parameters passed to the job handler
  priority        Int       @default(5)       // 1 (highest) to 10 (lowest)
  maxAttempts     Int       @default(3)
  backoffDelay    Int       @default(1000)    // ms, exponential backoff base
  timeout         Int?                         // ms, job-level timeout (null = no limit)
  lastModifiedBy  String?                     // User ID of last admin who changed config
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([queueName])
  @@index([enabled])
}
```

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin UI      │────▶│  Server Actions   │────▶│   PostgreSQL    │
│  /admin/workers │     │  (Controller)     │     │  ScheduledJob   │
│                 │     │                   │     │  Config table   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌────────────────┐          │
                              │  Redis PubSub  │◀─────────┘
                              │  Channel:      │   publish on config change
                              │  job-config    │
                              └───────┬────────┘
                                      │
                              ┌───────▼────────┐
                              │  Worker Process │
                              │  Subscribes to  │
                              │  config changes  │
                              │  Re-registers    │
                              │  BullMQ repeats  │
                              └─────────────────┘
```

1. **Admin changes config** via UI → controller updates DB → publishes Redis event
2. **Worker receives event** → reads updated config from DB → removes old repeatable job → registers new one (or skips if disabled)
3. **Worker startup** → reads all enabled configs from DB → registers repeatable jobs (no hardcoded schedules)

### Migration Strategy

One-time seed migration:
- Read current hardcoded jobs from `scheduled-jobs.ts`
- Insert rows into `ScheduledJobConfig` for each
- Worker checks DB first; falls back to hardcoded only if table is empty (backward compat during rollout)
- Once stable, remove `setupScheduledJobs()` hardcoded function

## Implementation Plan

### Phase 1: Database & Domain Layer

**Files:**
- `prisma/schema/scheduled-job-config.prisma` — New model
- `src/core/domain/entities/scheduled-job-config.entity.ts` — Domain entity with validation (cron format, queue name enum)
- `src/core/repositories/scheduled-job-config.repository.interface.ts` — Repository interface
- `src/infrastructure/database/prisma/prisma-scheduled-job-config.repository.ts` — Prisma implementation

**Key validation rules:**
- `cronPattern` must be valid 5-field cron (use `cron-parser` to validate)
- `queueName` must be one of `QUEUE_NAMES` values
- `jobName` must match a registered job handler
- `priority` must be 1–10
- `maxAttempts` must be 1–10

### Phase 2: Use Cases & Controller

**Use Cases** (`src/core/use-cases/scheduled-job-config/`):
- `list-scheduled-job-configs.use-case.ts` — List all with optional queue filter
- `get-scheduled-job-config.use-case.ts` — Get single by ID
- `update-scheduled-job-config.use-case.ts` — Update cron, enabled, params, etc.
- `reset-scheduled-job-config.use-case.ts` — Reset to factory defaults

**Controller** (`src/interface-adapters/controllers/scheduled-job-config.controller.ts`):
- `listScheduledJobConfigsAction()` — `SETTINGS_MANAGE`
- `updateScheduledJobConfigAction(id, updates)` — `SETTINGS_MANAGE`
- `toggleJobEnabledAction(id, enabled)` — `SETTINGS_MANAGE`
- `resetJobToDefaultsAction(id)` — `SETTINGS_MANAGE`

**Note:** No create/delete actions — jobs are seeded from the known handler registry. Admins configure, not define.

### Phase 3: Worker Integration

**Files:**
- `src/infrastructure/services/queue/scheduled-jobs.ts` — Refactor to read from DB
- `src/infrastructure/services/queue/job-config-subscriber.ts` — New: Redis PubSub listener

**Behavior:**
1. On startup: query `ScheduledJobConfig` where `enabled = true`
2. For each: call `jobQueueService.scheduleJob()` with DB values
3. Subscribe to Redis channel `job-config-updated`
4. On config change event: remove old repeatable → re-register with new config (or skip if disabled)

**Fallback:** If DB query fails (e.g., table doesn't exist yet), fall back to current hardcoded setup. Log a warning.

### Phase 4: Admin UI Enhancement

Extend the existing worker dashboard (`/admin/workers`) with new capabilities:

**Scheduled Jobs Section — Enhanced:**
- **Enable/Disable toggle** per job (switch component, immediate effect)
- **Edit cron pattern** — inline edit with human-readable preview ("Every day at 3:00 AM UTC")
- **Edit parameters** — modal/drawer with JSON editor for `jobData`
- **Priority selector** — dropdown 1-10
- **Retry config** — max attempts and backoff delay inputs
- **Reset to defaults** button per job
- **Last modified by** — shows which admin last changed the config
- **Audit trail** — changes logged in existing audit log system

**New Section: Job Execution History**
- Table showing last N executions per job
- Columns: job name, started at, duration, status (completed/failed), error message
- Expandable row with full error stacktrace
- Filter by job name, status, date range

### Phase 5: Seed & Migration

**Seed file** (`prisma/seed-factories/seed-scheduled-job-configs.ts`):

Map current hardcoded jobs to seed data:

| jobName | displayName | queue | cron | Description |
|---------|-------------|-------|------|-------------|
| `cleanup-old-tasks` | Cleanup Old Tasks | tasks | `0 2 * * *` | Delete completed tasks older than 30 days |
| `activate-ready-reservations` | Activate Reservations | maintenance | `*/15 * * * *` | Transition confirmed reservations to active |
| `complete-expired-reservations` | Complete Reservations | maintenance | `0 * * * *` | Complete reservations past end date |
| `send-reservation-reminders` | Reservation Reminders | maintenance | `*/30 * * * *` | Notify upcoming reservations |
| `intune-device-sync` | Intune Device Sync | maintenance | `0 3 * * *` | Sync devices from Microsoft Intune |
| `oci-critical-sync` | OCI Critical Sync | maintenance | `*/30 * * * *` | Sync critical OCI resources |
| `oci-resource-sync` | OCI Full Sync | maintenance | `0 4 * * *` | Full OCI resource synchronization |
| `detect-stale-cis` | Detect Stale CIs | maintenance | `0 5 * * *` | Flag config items not updated in 90 days |

**Idempotent:** Use `upsert` by `jobName` — safe to run repeatedly.

## Permissions

Uses existing `SETTINGS_MANAGE` permission — same as worker dashboard access. No new permissions needed.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Invalid cron breaks job scheduling | Validate with `cron-parser` before saving; show next 5 run times in UI as preview |
| Worker doesn't pick up config changes | Redis PubSub + fallback polling every 60s; admin can restart worker from UI |
| DB unavailable at worker startup | Fall back to hardcoded schedules; log warning prominently |
| Admin disables critical job by mistake | Confirmation dialog for disable; "Reset to defaults" button; audit log trail |
| Race condition on config update | Use DB transaction + optimistic locking via `updatedAt` |

## Out of Scope

- Creating entirely new job types from UI (requires handler code)
- Deleting jobs from UI (can only disable)
- Multi-worker coordination (single worker process for now)
- Job dependency chains / DAG scheduling

## Files Modified/Created

| File | Action |
|------|--------|
| `prisma/schema/scheduled-job-config.prisma` | Create |
| `src/core/domain/entities/scheduled-job-config.entity.ts` | Create |
| `src/core/repositories/scheduled-job-config.repository.interface.ts` | Create |
| `src/infrastructure/database/prisma/prisma-scheduled-job-config.repository.ts` | Create |
| `src/core/use-cases/scheduled-job-config/*.use-case.ts` | Create (4 files) |
| `src/interface-adapters/controllers/scheduled-job-config.controller.ts` | Create |
| `src/infrastructure/services/queue/scheduled-jobs.ts` | Modify — read from DB |
| `src/infrastructure/services/queue/job-config-subscriber.ts` | Create |
| `src/components/admin/workers/worker-status-dashboard.tsx` | Modify — add config UI |
| `prisma/seed-factories/seed-scheduled-job-configs.ts` | Create |
| `src/di/modules/queue.module.ts` | Modify — register new services |
| `src/di/types.ts` | Modify — add DI tokens |

## Verification

1. `npm run validate` passes
2. `npm run db:seed` creates default job configs
3. Worker starts and reads config from DB (check logs)
4. Admin toggles job off → worker removes repeatable → job stops running
5. Admin changes cron → worker re-registers → next run time updates
6. Admin resets to defaults → original config restored
7. Worker restart picks up latest DB config
