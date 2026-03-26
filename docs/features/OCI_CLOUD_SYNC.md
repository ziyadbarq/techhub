# OCI Cloud Sync Integration

**Feature Flag**: `OCI_SYNC`
**DI Module**: `oci-sync` (HEAVY tier, lazy loaded)
**Dependencies**: Foundation, CMDB

## Overview

The OCI Cloud Sync module automatically synchronizes Oracle Cloud Infrastructure resources into the CMDB as Configuration Items. It fetches data from an n8n webhook that aggregates OCI inventory across all compartments and regions, then upserts resources into the existing `ConfigurationItem` table with full compartment hierarchy and relationship tracking.

### Key Benefits

- **Automated Cloud Inventory**: Daily sync of all OCI resources into CMDB
- **8 Service Types**: Compute, Load Balancers (ALB + NLB), OKE clusters, Object Storage, PostgreSQL, MySQL, Oracle DB
- **Compartment Hierarchy**: Auto-creates compartment CIs with CONTAINS relationships to resources
- **Environment Inference**: Automatically detects PROD/DR/UAT/DEV/TEST from compartment naming conventions
- **Idempotent Upserts**: Resources identified by OCID when it fits CMDB limits, otherwise by a stable hashed key — safe to run repeatedly
- **Historical Retention**: OCI CIs missing from a later successful live payload are preserved and retired instead of being deleted
- **Dry Run Mode**: Preview sync results without writing to the database
- **Switchable Source**: Use the live webhook or replay `local/oci-data` snapshots with `OCI_SYNC_SOURCE`
- **Sync History**: Full audit trail with per-run statistics, dry runs, retirements, and error tracking

## Architecture

### Components

```
OCI Cloud Sync Module
├── Domain
│   ├── oci-resource.types.ts           # Zod schemas for webhook response validation
│   └── oci-service-mapping.ts          # Service→CI class mapping, attribute extraction
├── Infrastructure
│   ├── OciWebhookService               # n8n webhook client or local snapshot loader
│   ├── PrismaOciSyncLogRepository      # Sync history persistence
│   └── oci-resource-sync.handler.ts    # BullMQ job handler
├── Use Cases
│   ├── SyncOciResourcesUseCase         # Main sync orchestrator
│   └── GetOciSyncLogsUseCase           # Query sync history
├── Controllers
│   └── oci-sync.controller.ts          # Server actions (3 actions)
├── UI
│   ├── /oci-sync (page.tsx)            # Server component with auth checks
│   └── OciSyncDashboard                # Client dashboard component
└── Background Jobs
    └── handleOciResourceSync           # BullMQ scheduled job (daily 4 AM UTC)
```

### Data Flow

```
1. Scheduled job triggers (daily 4 AM UTC) or manual trigger from dashboard
   ↓
2. OciWebhookService fetches each service type from the configured source
   - Webhook: https://n8n.prod.barq.com/webhook/oci-invent?oci-service={key}
   - Local: {OCI_LOCAL_DATA_DIR}/oci-{key}.json
   ↓
3. SyncOciResourcesUseCase processes the response:
   a. Validates webhook response with Zod schemas
   b. Flattens nested structure: tenancy → services → compartments → regions → items
   c. Upserts compartment CIs (CLOUD_COMPARTMENT class, ciKey = compartment OCID)
   d. For each resource:
      - Maps service type to CI class code
      - Extracts OCI identity as ciKey (stable hashed key for buckets and any OCI ID that exceeds CMDB limits)
      - Extracts service-specific attributes
      - Infers environment from compartment name
      - Upserts CI by ciKey (creates or merges attributes)
      - Creates CONTAINS relationship (compartment → resource)
   e. Retires OCI-managed resource CIs that disappeared from successful live payloads while preserving them historically
   ↓
4. OciSyncLog updated with final statistics
   ↓
5. Dashboard displays sync results and history
```

### Webhook Response Structure

All 8 OCI services share the same nested wrapper from n8n:

```json
{
  "object Object": [{
    "generated_at": "2024-03-26T...",
    "tenancyId": "ocid1.tenancy.oc1...",
    "regions": ["me-jeddah-1", "me-riyadh-1"],
    "services": {
      "compute": [
        {
          "id": "ocid1.compartment...",
          "name": "cmp-prod-app",
          "total": 15,
          "regions": [
            {
              "region": "me-jeddah-1",
              "count": 10,
              "items": [{ "id": "ocid1.instance...", "display-name": "...", ... }]
            }
          ]
        }
      ]
    }
  }]
}
```

## Configuration

### Environment Variables

```bash
# Source selector: "webhook" (default) or "local"
OCI_SYNC_SOURCE=webhook

# Required when OCI_SYNC_SOURCE=webhook: n8n webhook authentication token
OCI_WEBHOOK_TOKEN=your_n8n_webhook_token_here

# Optional: Skip TLS certificate verification (for self-signed certs)
OCI_WEBHOOK_INSECURE=false

# Optional: local snapshot directory used by the downloader, compare script, and local replay mode
OCI_LOCAL_DATA_DIR=local/oci-data

# Optional: archive directory for older downloaded snapshots
OCI_LOCAL_DATA_ARCHIVE_DIR=local/oci-data-archive

# Optional safety valve: local snapshots do not retire missing OCI CIs by default
OCI_LOCAL_SOURCE_RETIRE_MISSING=false

# Required: Feature flag must be enabled
# Enable via Admin → Feature Flags → OCI_SYNC
```

### Prerequisites

1. n8n instance at `https://n8n.prod.barq.com` with OCI inventory workflows configured
2. Webhook token shared between n8n and this application
3. CMDB CI classes seeded (run `npm run db:seed` or `npm run db:seed:dev`)
4. CONTAINS relationship type and scopes seeded

## Permissions

| Permission Key | Description |
|----------------|-------------|
| `oci-sync:view` | View OCI sync dashboard and latest sync status |
| `oci-sync:trigger` | Trigger manual sync (shows sync controls on dashboard) |
| `oci-sync-logs:view` | View sync history logs |

The `system-administrator` role has all three permissions by default.

### Permission Group

Permissions are organized under the **OCI Cloud Sync** group in the RBAC admin UI.

## Service Type Mapping

| OCI Service Key | CI Class Code | Discriminator | Notes |
|----------------|---------------|---------------|-------|
| `compute` | `VIRTUAL_MACHINE` | — | Shape, availability domain, launch/source config, metadata, tags |
| `lb` | `LOAD_BALANCER` | `LB_TYPE=APPLICATION` | IPs, listeners, hostnames, shape, subnet/NSG, routing metadata, tags |
| `nlb` | `LOAD_BALANCER` | `LB_TYPE=NETWORK` | IPs, listeners, subnet/NSG, source preservation flags, tags |
| `oke` | `CONTAINER_PLATFORM` | — | Kubernetes version, endpoints, VCN, options, upgrades, tags |
| `buckets` | `OBJECT_STORAGE` | — | No OCID — ciKey synthesized as `oci.bucket.{sha256(...)}` |
| `postgresql` | `DATABASE` | `DB_ENGINE=postgresql` | DB version, shape, instance count, config, tags |
| `mysql` | `DATABASE` | `DB_ENGINE=mysql` | Mode, recovery, endpoints, HA, version, placement, tags |
| `dbsystems` | `DATABASE` | `DB_ENGINE=oracle` | Edition, compute/storage sizing, network, version, license, tags |

OCI resources whose native IDs exceed the CMDB `ciKey` limit are also stored under a stable hashed key such as `oci.nlb.{sha256(...)}` so reruns remain idempotent.

### Environment Inference

Compartment names following Barq's `cmp-{env}-{service}` convention are automatically mapped:

| Compartment Pattern | CMDB Environment |
|--------------------|------------------|
| `-prod` | PROD |
| `-dr` | DR |
| `-uat`, `-stg` | UAT |
| `-dev` | DEV |
| `-test`, `-perf` | TEST |

### OCI Lifecycle State Mapping

| OCI State | CMDB Lifecycle State |
|-----------|---------------------|
| RUNNING, ACTIVE, AVAILABLE | Active |
| STOPPED, INACTIVE | Inactive |
| TERMINATED, DELETED | Retired |
| PROVISIONING, CREATING, STARTING, UPDATING | Build |
| STOPPING, TERMINATING, DELETING | Pending Retirement |
| FAILED | Failed |

## User Workflows

### Enabling OCI Sync

1. Set `OCI_SYNC_SOURCE=webhook` and `OCI_WEBHOOK_TOKEN` in `.env.local`
2. Navigate to **Admin → Feature Flags**
3. Enable `OCI_SYNC` (requires `FOUNDATION` and `CMDB` dependencies enabled)
4. Assign permissions to appropriate roles
5. Navigate to **OCI Cloud Sync** in the sidebar

### Manual Sync

1. Navigate to **OCI Cloud Sync** dashboard
2. Select service types to sync (all selected by default)
3. Optionally enable **Dry run** to preview without database changes
4. Click **Start Sync** (or **Preview Sync** in dry-run mode)
5. View toast notification with sync results
6. Sync history table updates automatically

### Local Snapshot Replay

1. Download a fresh snapshot with `npm run download:oci`
2. Optionally point `OCI_LOCAL_DATA_DIR` to an archived snapshot directory
3. Set `OCI_SYNC_SOURCE=local`
4. Run a dry run or live sync from the dashboard
5. Keep `OCI_LOCAL_SOURCE_RETIRE_MISSING=false` unless you intentionally want missing snapshot records to retire OCI CIs

### Viewing Sync History

The dashboard displays a history table with:
- Status (COMPLETED / PARTIAL / FAILED / IN_PROGRESS)
- Timestamp, services synced, resource counts (created/updated/retired/unchanged)
- Error count, duration, trigger source (Scheduled vs. manual user), and dry-run badge

### Viewing Synced Resources

Synced OCI resources appear as standard Configuration Items in the CMDB:
- Navigate to **CMDB → Configuration Items**
- Filter by CI class (e.g., VIRTUAL_MACHINE, DATABASE, LOAD_BALANCER)
- View resource attributes in the detail page (OCI-specific fields stored in attributes JSON)
- View compartment hierarchy via CONTAINS relationships

## Data Model

### OciSyncLog Table

Tracks every sync operation, including dry runs:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | CUID2 primary key |
| `status` | Enum | IN_PROGRESS, COMPLETED, FAILED, PARTIAL |
| `serviceTypes` | String[] | OCI service keys included in this sync |
| `tenancyId` | String? | OCI tenancy OCID |
| `regions` | String[] | Regions covered |
| `resourcesProcessed` | Int | Total resources examined |
| `resourcesCreated` | Int | New CIs created |
| `resourcesUpdated` | Int | Existing CIs updated (attributes merged) |
| `resourcesRetired` | Int | Historical OCI CIs retired because they disappeared from a successful live payload |
| `resourcesUnchanged` | Int | CIs with no changes detected |
| `compartmentsCreated` | Int | New compartment CIs created |
| `relationshipsCreated` | Int | New CONTAINS relationships created |
| `errorsCount` | Int | Number of per-resource errors |
| `errors` | Json? | Array of error details (serviceKey, resourceId, message) |
| `startedAt` | DateTime | Sync start time |
| `completedAt` | DateTime? | Sync completion time |
| `durationMs` | Int? | Total duration in milliseconds |
| `triggeredBy` | String? | User email or "system" for scheduled runs |
| `isDryRun` | Boolean | Whether this was a preview-only run |

### ConfigurationItem (CMDB Target)

OCI resources are stored in the existing `ConfigurationItem` table:

- **ciKey**: OCID for most services, synthesized `oci.bucket.{sha256(compartmentId:namespace:name)}` for buckets
- **name**: Display name from OCI (`display-name` or `name` field)
- **ciClassId**: Resolved from service mapping (VIRTUAL_MACHINE, DATABASE, etc.)
- **environment**: Inferred from compartment name
- **attributes**: JSON blob with service-specific fields plus OCI sync state markers such as `OCI_SOURCE_STATUS`, `OCI_MISSING_FROM_SOURCE_AT`, and `OCI_RETIRE_REASON`

### Compartment CIs

OCI compartments are also stored as CIs:

- **CI Class**: `CLOUD_COMPARTMENT`
- **ciKey**: Compartment OCID
- **Relationships**: CONTAINS → resource CIs within the compartment

## Background Jobs

### Scheduled Sync

- **Job Name**: `oci-resource-sync`
- **Queue**: `maintenance`
- **Schedule**: Daily at 4:00 AM UTC (1 hour after Intune sync at 3 AM)
- **Worker Concurrency**: 1 (maintenance queue runs sequentially)
- **Lock Duration**: 60 seconds
- **Feature Flag Enforcement**: Scheduled runs no-op while `OCI_SYNC` is disabled

### Job Data

```typescript
interface OciSyncJobData {
  serviceKeys?: OciServiceKey[];  // Defaults to all 8 services
  dryRun?: boolean;               // Defaults to false
  triggeredBy?: string;           // "system" for scheduled
  createdAt: number;              // Timestamp
}
```

## File Reference

### New Files

| File | Purpose |
|------|---------|
| `src/core/domain/value-objects/oci-resource.types.ts` | Zod schemas, TypeScript types, constants |
| `src/core/domain/value-objects/oci-service-mapping.ts` | Service→CI mapping, attribute extraction |
| `src/core/services/oci-webhook.service.interface.ts` | Webhook service interface |
| `src/core/repositories/oci-sync-log.repository.interface.ts` | Sync log repository interface |
| `src/infrastructure/services/oci/oci-webhook.service.ts` | n8n webhook HTTP client implementation |
| `src/infrastructure/repositories/prisma-oci-sync-log.repository.ts` | Prisma sync log implementation |
| `src/core/use-cases/oci-sync/sync-oci-resources.use-case.ts` | Main sync orchestrator |
| `src/core/use-cases/oci-sync/get-oci-sync-logs.use-case.ts` | Query sync history |
| `src/core/use-cases/oci-sync/index.ts` | Barrel export |
| `src/di/modules/oci-sync.module.ts` | DI bindings (HEAVY tier) |
| `src/interface-adapters/dtos/generated/oci-sync.dto.ts` | Input/output DTOs |
| `src/interface-adapters/presenters/oci-sync.presenter.ts` | Domain→DTO presenters |
| `src/interface-adapters/controllers/oci-sync.controller.ts` | Server actions |
| `src/infrastructure/services/queue/handlers/oci-resource-sync.handler.ts` | BullMQ job handler |
| `src/app/(dashboard)/oci-sync/page.tsx` | Dashboard page (server component) |
| `src/components/oci-sync/oci-sync-dashboard.tsx` | Dashboard UI (client component) |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema/cmdb.prisma` | Added `OciSyncLog` model + `OciSyncStatus` enum |
| `src/lib/features/feature-flag-keys.ts` | Added `OCI_SYNC` flag |
| `src/core/domain/value-objects/permission-key.ts` | Added 3 OCI permissions |
| `src/lib/rbac/permission-groups.ts` | Added OCI Cloud Sync permission group |
| `src/di/types.ts` | Added 4 DI tokens |
| `src/di/module-definitions.ts` | Added `OCI_SYNC_MODULE` (HEAVY tier) |
| `src/config/protected-routes.ts` | Added `/oci-sync` route protection |
| `src/config/routes-manifest.ts` | Added sidebar nav entry |
| `src/core/domain/jobs/job-names.ts` | Added `OCI_RESOURCE_SYNC` job name |
| `src/core/domain/jobs/job-data.types.ts` | Added `OciSyncJobData` interface |
| `src/infrastructure/services/queue/handlers/index.ts` | Exported handler |
| `src/infrastructure/services/queue/worker.ts` | Registered handler |
| `src/infrastructure/services/queue/scheduled-jobs.ts` | Added 4 AM UTC daily cron |
| `src/infrastructure/database/prisma/seed-rbac-permissions.ts` | Added 3 permissions |
| `src/infrastructure/database/prisma/seed-features.ts` | Added OCI_SYNC feature flag |
| `src/infrastructure/database/prisma/seed-config-layer3.ts` | Added CLOUD_COMPARTMENT→LOAD_BALANCER scope |

## Troubleshooting

### Common Issues

**"Feature not available"**
- Ensure `OCI_SYNC` feature flag is enabled in Admin → Feature Flags
- Ensure `FOUNDATION` and `CMDB` dependency flags are also enabled

**"CI class not found" errors in sync log**
- Run `npm run db:seed:dev` to seed CI classes (VIRTUAL_MACHINE, DATABASE, etc.)
- Check CMDB → CI Classes for the expected class codes

**"CONTAINS relationship type not found" warning**
- Run `npm run db:seed:dev` to seed relationship types and scopes
- The CONTAINS relationship type must exist with appropriate scope entries

**Webhook connection failures**
- Verify `OCI_WEBHOOK_TOKEN` is set in `.env.local`
- If using self-signed certificates, set `OCI_WEBHOOK_INSECURE=true`
- Ensure n8n instance is reachable from the application server

**Local snapshot source not loading**
- Verify `OCI_SYNC_SOURCE=local`
- Verify `OCI_LOCAL_DATA_DIR` points to a directory containing all `oci-*.json` files
- Refresh snapshots with `npm run download:oci`

**Duplicate binding errors**
- The module has a built-in `isBound` guard to prevent duplicate DI registrations
- If this still occurs, restart the dev server to clear the DI container

**Buckets missing or duplicated**
- Buckets don't have OCIDs; their ciKey is synthesized as `oci.bucket.{sha256(compartmentId:namespace:name)}`
- If namespace or name changes, a new CI is created (the old one remains)

**Old resources expected from `local/oci-data`**
- Live OCI sync reconciles the current webhook payload when `OCI_SYNC_SOURCE=webhook`
- Historical OCI records that were already synced are preserved and retired when they disappear from live OCI
- You can replay archived or current local snapshots by setting `OCI_SYNC_SOURCE=local`
- Local snapshot mode does not retire missing OCI CIs unless `OCI_LOCAL_SOURCE_RETIRE_MISSING=true`

### Verifying Sync Results

1. Check sync log in the dashboard for error details
2. Navigate to CMDB → Configuration Items and filter by class
3. Open a CI detail page to inspect attributes JSON
4. Check compartment relationships in the CI's relationships tab
