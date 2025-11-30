
# Database Backup & Restore System - Production-Ready Implementation Plan

## Executive Summary

This plan details a production-ready database backup and restore system for a Next.js 16 enterprise CMDB application. The implementation prioritizes **user experience, operational visibility, and production safety** over simplicity.

**Key Design Decisions:**

- PostgreSQL native `pg_dump` with SQL format (full schema + data)
- Server filesystem storage in `local/backups/` directory
- Streaming downloads for large files
- Background job processing with progress tracking
- Comprehensive audit logging for compliance
- Rich metadata tracking (size, duration, status, error details)
- User-friendly error messages with actionable guidance
- Production-safe operations with environment checks

---

## 1. UI/UX Design

### 1.1 Location in Dashboard

**Route:** `/admin/system-setup` (existing)
**Tab Structure:** Add 4th tab to existing 3-tab layout:

- Health
- Info
- Database Ops (existing)
- **Backups** (NEW)

**Why this location?**

- Natural fit with system administration operations
- Already permission-protected (`USERS_MANAGE` currently, will add new permissions)
- Consistent with existing database operations (reset, seed)
- Familiar navigation for system admins

### 1.2 Backups Tab Layout

**Three-section vertical layout:**

#### Section 1: Quick Actions Card

```
┌─────────────────────────────────────────────────┐
│ Database Backups                                │
│ Create and manage PostgreSQL database backups   │
│                                                  │
│ [Create New Backup]  [Refresh List]             │
│                                                  │
│ ⚠️ Production Notice: Backups may impact        │
│    performance on large databases (>10GB)       │
└─────────────────────────────────────────────────┘
```

**Features:**

- Primary "Create New Backup" button (blue, prominent)
- Secondary "Refresh List" button (ghost variant)
- Environment-aware notices (production vs development)
- Dynamic status indicator showing if backup is in progress

#### Section 2: Backups Table (TanStack Table)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Filename              Size    Duration  Created         Status  Actions│
├────────────────────────────────────────────────────────────────────────┤
│ backup_20231130_...  450 MB  3m 24s    Nov 30, 2:45 PM ✓       ⋯      │
│ backup_20231129_...  448 MB  3m 18s    Nov 29, 8:12 AM ✓       ⋯      │
│ backup_20231128_...  445 MB  3m 22s    Nov 28, 9:30 AM ✓       ⋯      │
│ backup_20231127_...  442 MB  -         Nov 27, 1:15 PM ⚠ Failed ⋯      │
│ backup_20231126_...  440 MB  3m 15s    Nov 26, 3:22 PM ✓       ⋯      │
└────────────────────────────────────────────────────────────────────────┘

Showing 5 of 5 backups | Total storage: 2.2 GB
```

**Columns:**

1. **Filename** - Auto-generated: `backup_YYYYMMDD_HHmmss.sql`
2. **Size** - Human-readable (MB/GB), sortable
3. **Duration** - Time taken to create backup (or "-" if failed)
4. **Created** - Formatted timestamp with relative time tooltip
5. **Status** - Badge component:
   - ✓ Success (green)
   - ⏳ In Progress (blue, animated pulse)
   - ⚠ Failed (red)
6. **Actions** - Dropdown menu (⋯)

**Actions Dropdown Menu:**

- Download (cloud-download icon)
- View Details (info icon)
- Restore Database (rotate-ccw icon, red text)
- Delete Backup (trash icon, red text)

**Table Features:**

- Sorting by all columns
- Pagination (10 per page default)
- Loading states with skeleton rows
- Empty state: "No backups found. Create your first backup to get started."
- Auto-refresh every 5 seconds when backup is in progress
- Total count and storage usage in footer

#### Section 3: Restore Confirmation Dialog

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Restore Database from Backup                 │
│                                                  │
│ You are about to PERMANENTLY DELETE all current │
│ data and restore from this backup:              │
│                                                  │
│ 📁 backup_20231130_144523.sql                   │
│ 📊 Size: 450 MB                                  │
│ 📅 Created: Nov 30, 2023, 2:45 PM               │
│                                                  │
│ ⚠️ WARNING: This action cannot be undone!       │
│                                                  │
│ Current database will be:                       │
│ 1. Completely wiped (all tables dropped)        │
│ 2. Restored from backup file                    │
│ 3. All users will be logged out                 │
│                                                  │
│ To confirm, type: RESTORE DATABASE              │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Type confirmation here]                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [Cancel]              [Restore Database] ❌      │
└─────────────────────────────────────────────────┘
```

**Restore Flow:**

1. User clicks "Restore Database" from actions menu
2. Dialog opens with file details and warnings
3. User must type exact confirmation text: "RESTORE DATABASE"
4. Restore button enabled only when text matches
5. Shows progress indicator during restore
6. Redirects to login page on success (session cleared)

### 1.3 Backup Details Dialog

```
┌─────────────────────────────────────────────────┐
│ Backup Details                            [×]   │
├─────────────────────────────────────────────────┤
│                                                  │
│ 📁 Filename                                      │
│    backup_20231130_144523.sql                   │
│                                                  │
│ 📊 File Size                                     │
│    450.2 MB (472,186,432 bytes)                 │
│                                                  │
│ 📅 Created                                       │
│    November 30, 2023 at 2:45:23 PM              │
│    (2 hours ago)                                │
│                                                  │
│ ⏱️ Duration                                      │
│    3 minutes 24 seconds                         │
│                                                  │
│ 💾 Storage Path                                 │
│    /local/backups/backup_20231130_144523.sql    │
│                                                  │
│ ✅ Status                                        │
│    Success                                       │
│                                                  │
│ 👤 Created By                                    │
│    John Doe (john.doe@barq.com)                 │
│                                                  │
│ 🔧 PostgreSQL Version                           │
│    17.0                                          │
│                                                  │
│ 📝 Notes                                         │
│    Manual backup before major upgrade           │
│                                                  │
│ [Download Backup]  [Restore from This Backup]   │
└─────────────────────────────────────────────────┘
```

### 1.4 User Flow: Create Backup

```
User clicks "Create New Backup"
  ↓
Optional: Show dialog with notes field
  ↓
API call starts backup job
  ↓
Toast: "Backup started. This may take several minutes."
  ↓
Table shows new row: "In Progress" with pulse animation
  ↓
Auto-refresh polls every 3 seconds
  ↓
On completion:
  - Status badge changes to "Success" or "Failed"
  - Toast notification
  - Audit log entry created
  - If failed: Show error details in dialog
```

### 1.5 User Flow: Download Backup

```
User clicks "Download" from actions menu
  ↓
Browser download dialog appears
  ↓
File streams directly from server
  ↓
Progress shown in browser's download manager
  ↓
On completion: Audit log entry created
```

### 1.6 User Flow: Restore Database

```
User clicks "Restore Database" from actions menu
  ↓
Confirmation dialog opens (see Section 3 above)
  ↓
User types "RESTORE DATABASE"
  ↓
User clicks "Restore Database" button
  ↓
Toast: "Database restore started. This may take several minutes."
  ↓
Progress indicator in dialog
  ↓
On completion:
  - Toast: "Database restored successfully. Please log in again."
  - Session cleared
  - Redirect to /login
  - Audit log entry created
```

---

## 2. Progress Tracking for Long Operations

### 2.1 Architecture: Server-Sent Events (SSE)

**Why SSE over polling?**

- Real-time progress updates
- Lower server load (single connection)
- Automatic reconnection
- Browser-native support
- Better UX with instant feedback

**Implementation:**

```typescript
// API Route: /api/backups/[id]/progress
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
    
      // Subscribe to Redis pub/sub channel
      const redis = new Redis(process.env.REDIS_URL!);
      const subscriber = redis.duplicate();
    
      await subscriber.subscribe(`backup:progress:${params.id}`);
    
      subscriber.on('message', (channel, message) => {
        const data = JSON.parse(message);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      
        if (data.status === 'completed' || data.status === 'failed') {
          controller.close();
          subscriber.quit();
        }
      });
    
      // Send heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);
    
      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        subscriber.quit();
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Client-side hook:**

```typescript
// hooks/use-backup-progress.ts
export function useBackupProgress(backupId: string | null) {
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  
  useEffect(() => {
    if (!backupId) return;
  
    const eventSource = new EventSource(`/api/backups/${backupId}/progress`);
  
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    
      if (data.status === 'completed' || data.status === 'failed') {
        eventSource.close();
      }
    };
  
    eventSource.onerror = () => {
      eventSource.close();
    };
  
    return () => eventSource.close();
  }, [backupId]);
  
  return progress;
}
```

### 2.2 Progress Data Structure

```typescript
interface BackupProgress {
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stage: 'initializing' | 'dumping' | 'compressing' | 'finalizing';
  percentage: number; // 0-100
  currentStep: string; // Human-readable: "Backing up table: assets"
  estimatedTimeRemaining?: number; // seconds
  bytesProcessed?: number;
  totalBytes?: number;
  startedAt: string;
  completedAt?: string;
  error?: {
    message: string;
    code: string;
    details?: string;
  };
}
```

### 2.3 Progress UI Components

**Progress Bar Component:**

```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>{progress.currentStep}</span>
    <span>{progress.percentage}%</span>
  </div>
  <Progress value={progress.percentage} className="h-2" />
  {progress.estimatedTimeRemaining && (
    <p className="text-xs text-muted-foreground">
      Estimated time remaining: {formatDuration(progress.estimatedTimeRemaining)}
    </p>
  )}
</div>
```

**Status Badge with Animation:**

```tsx
{status === 'running' && (
  <Badge variant="secondary" className="animate-pulse">
    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
    In Progress
  </Badge>
)}
```

### 2.4 Background Job Processing

**Use existing BullMQ infrastructure:**

```typescript
// Queue definition
interface BackupJobData {
  backupId: string;
  userId: string;
  notes?: string;
}

interface RestoreJobData {
  backupId: string;
  userId: string;
  backupFilePath: string;
}

// Job processor
class BackupJobProcessor {
  async process(job: Job<BackupJobData>): Promise<void> {
    const { backupId, userId } = job.data;
  
    try {
      // Update status: running
      await this.updateProgress(backupId, {
        status: 'running',
        stage: 'initializing',
        percentage: 0,
        currentStep: 'Preparing database backup...',
      });
    
      // Stage 1: Initialize (5%)
      await job.updateProgress(5);
      await this.updateProgress(backupId, {
        percentage: 5,
        stage: 'dumping',
        currentStep: 'Creating database dump...',
      });
    
      // Stage 2: Run pg_dump (5-90%)
      const dumpResult = await this.runPgDump(backupId, (progress) => {
        job.updateProgress(5 + Math.floor(progress * 0.85));
        this.updateProgress(backupId, {
          percentage: 5 + Math.floor(progress * 85),
          currentStep: `Backing up data... ${Math.floor(progress)}%`,
        });
      });
    
      // Stage 3: Finalize (90-100%)
      await job.updateProgress(95);
      await this.updateProgress(backupId, {
        percentage: 95,
        stage: 'finalizing',
        currentStep: 'Finalizing backup file...',
      });
    
      // Complete
      await job.updateProgress(100);
      await this.updateProgress(backupId, {
        status: 'completed',
        percentage: 100,
        currentStep: 'Backup completed successfully',
      });
    
    } catch (error) {
      await this.updateProgress(backupId, {
        status: 'failed',
        error: {
          message: this.getUserFriendlyError(error),
          code: error.code,
          details: error.message,
        },
      });
      throw error;
    }
  }
  
  private async updateProgress(backupId: string, progress: Partial<BackupProgress>) {
    // Update database
    await this.repository.updateBackupProgress(backupId, progress);
  
    // Publish to Redis for SSE
    await this.redis.publish(
      `backup:progress:${backupId}`,
      JSON.stringify(progress)
    );
  }
}
```

---

## 3. Backup Browsing Interface

### 3.1 Metadata Tracking

**Database Schema:**

```prisma
model DatabaseBackup {
  id              String   @id @default(cuid())
  filename        String   @unique
  filePath        String   // Relative: backups/backup_20231130_144523.sql
  fileSize        BigInt   // Bytes
  status          BackupStatus
  
  // Progress tracking
  stage           BackupStage?
  percentage      Int      @default(0)
  currentStep     String?
  
  // Metadata
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  notes           String?
  
  // Database info
  databaseName    String
  postgresVersion String
  tableCount      Int?
  recordCount     BigInt?
  
  // Timing
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  durationSeconds Int?
  
  // Error tracking
  errorMessage    String?
  errorCode       String?
  errorDetails    String? // Full stack trace for debugging
  
  // Lifecycle
  deletedAt       DateTime?
  deletedById     String?
  deletedBy       User?    @relation("BackupDeleter", fields: [deletedById], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("database_backups")
}

enum BackupStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  
  @@map("backup_status")
}

enum BackupStage {
  INITIALIZING
  DUMPING
  COMPRESSING
  FINALIZING
  
  @@map("backup_stage")
}
```

### 3.2 Table Implementation (TanStack Table)

```tsx
"use no memo"; // React Compiler incompatibility

const columns: ColumnDef<BackupDTO>[] = [
  {
    accessorKey: "filename",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Filename" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("filename")}</div>
    ),
  },
  {
    accessorKey: "fileSize",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => formatBytes(row.getValue("fileSize")),
    sortingFn: "basic",
  },
  {
    accessorKey: "durationSeconds",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      const duration = row.getValue("durationSeconds") as number | null;
      return duration ? formatDuration(duration) : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div>
          <div>{formatDate(date, "PPp")}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <BackupStatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    cell: ({ row }) => <BackupActionsMenu backup={row.original} />,
  },
];
```

### 3.3 Retention Policy Enforcement

**Automatic cleanup (runs after each successful backup):**

```typescript
async function enforceRetentionPolicy(): Promise<void> {
  const MAX_BACKUPS = 5;
  
  // Get all successful backups, oldest first
  const backups = await repository.findMany({
    where: { status: 'COMPLETED', deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  
  if (backups.length <= MAX_BACKUPS) return;
  
  // Delete oldest backups
  const toDelete = backups.slice(0, backups.length - MAX_BACKUPS);
  
  for (const backup of toDelete) {
    // Soft delete in database
    await repository.update(backup.id, {
      deletedAt: new Date(),
      deletedById: 'system', // Automatic deletion
    });
  
    // Delete physical file
    await fs.unlink(path.join(BACKUP_DIR, backup.filename));
  
    // Audit log
    await auditLog.create({
      action: 'backup:auto_deleted',
      entityType: 'DatabaseBackup',
      entityId: backup.id,
      userId: 'system',
      metadata: { reason: 'retention_policy', maxBackups: MAX_BACKUPS },
    });
  }
  
  logger.info('Retention policy enforced', {
    deleted: toDelete.length,
    remaining: MAX_BACKUPS,
  });
}
```

---

## 4. Error Handling with User-Friendly Messages

### 4.1 Error Categorization

```typescript
enum BackupErrorCode {
  // Permission errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  FILE_SYSTEM_PERMISSION_DENIED = 'FILE_SYSTEM_PERMISSION_DENIED',
  
  // Storage errors
  DISK_FULL = 'DISK_FULL',
  BACKUP_DIRECTORY_NOT_WRITABLE = 'BACKUP_DIRECTORY_NOT_WRITABLE',
  
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  PG_DUMP_NOT_FOUND = 'PG_DUMP_NOT_FOUND',
  PG_DUMP_FAILED = 'PG_DUMP_FAILED',
  BACKUP_FILE_CORRUPT = 'BACKUP_FILE_CORRUPT',
  
  // Process errors
  TIMEOUT = 'TIMEOUT',
  PROCESS_KILLED = 'PROCESS_KILLED',
  
  // Restore errors
  DATABASE_NOT_EMPTY = 'DATABASE_NOT_EMPTY',
  RESTORE_FAILED = 'RESTORE_FAILED',
  INCOMPATIBLE_VERSION = 'INCOMPATIBLE_VERSION',
}
```

### 4.2 User-Friendly Error Messages

```typescript
class BackupErrorHandler {
  getUserFriendlyMessage(error: Error): UserFriendlyError {
    const code = this.detectErrorCode(error);
  
    switch (code) {
      case BackupErrorCode.DISK_FULL:
        return {
          title: 'Storage Full',
          message: 'Not enough disk space to create backup.',
          actions: [
            'Free up disk space by deleting old backups',
            'Contact your system administrator',
          ],
          severity: 'error',
        };
      
      case BackupErrorCode.PG_DUMP_NOT_FOUND:
        return {
          title: 'PostgreSQL Tools Missing',
          message: 'The pg_dump utility is not installed or not found in PATH.',
          actions: [
            'Install PostgreSQL client tools',
            'Verify PATH environment variable includes PostgreSQL bin directory',
            'Contact your system administrator',
          ],
          severity: 'error',
        };
      
      case BackupErrorCode.DATABASE_CONNECTION_FAILED:
        return {
          title: 'Database Connection Failed',
          message: 'Unable to connect to the PostgreSQL database.',
          actions: [
            'Check if PostgreSQL service is running',
            'Verify DATABASE_URL environment variable',
            'Check database connection credentials',
          ],
          severity: 'error',
        };
      
      case BackupErrorCode.TIMEOUT:
        return {
          title: 'Backup Timeout',
          message: 'Backup operation exceeded the maximum allowed time (30 minutes).',
          actions: [
            'Try again during off-peak hours',
            'Consider archiving old data to reduce database size',
            'Contact support if problem persists',
          ],
          severity: 'warning',
        };
      
      case BackupErrorCode.INCOMPATIBLE_VERSION:
        return {
          title: 'PostgreSQL Version Mismatch',
          message: 'This backup was created with a different PostgreSQL version.',
          actions: [
            'Verify PostgreSQL versions match (backup: X.X, current: Y.Y)',
            'Upgrade PostgreSQL to match backup version',
            'Contact support for migration assistance',
          ],
          severity: 'error',
        };
      
      default:
        return {
          title: 'Backup Failed',
          message: 'An unexpected error occurred during backup operation.',
          actions: [
            'Try again in a few minutes',
            'Check audit logs for details',
            'Contact support if problem persists',
          ],
          severity: 'error',
          technicalDetails: error.message,
        };
    }
  }
  
  private detectErrorCode(error: Error): BackupErrorCode {
    const message = error.message.toLowerCase();
  
    if (message.includes('enospc') || message.includes('no space left')) {
      return BackupErrorCode.DISK_FULL;
    }
    if (message.includes('eacces') || message.includes('permission denied')) {
      return BackupErrorCode.FILE_SYSTEM_PERMISSION_DENIED;
    }
    if (message.includes('pg_dump') && message.includes('not found')) {
      return BackupErrorCode.PG_DUMP_NOT_FOUND;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return BackupErrorCode.TIMEOUT;
    }
    if (message.includes('connection') && message.includes('refused')) {
      return BackupErrorCode.DATABASE_CONNECTION_FAILED;
    }
  
    return BackupErrorCode.PG_DUMP_FAILED;
  }
}
```

### 4.3 Error Display Component

```tsx
function BackupErrorDisplay({ error }: { error: UserFriendlyError }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error.message}</p>
      
        <div>
          <p className="font-semibold">What you can do:</p>
          <ul className="mt-2 space-y-1">
            {error.actions.map((action, i) => (
              <li key={i} className="text-sm">• {action}</li>
            ))}
          </ul>
        </div>
      
        {error.technicalDetails && (
          <Collapsible>
            <CollapsibleTrigger className="text-sm underline">
              Show technical details
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 rounded bg-muted p-2 text-xs">
                {error.technicalDetails}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 5. Performance Considerations

### 5.1 Large Database Handling

**Strategies:**

1. **Streaming File Downloads**
   - Use `ReadableStream` API
   - Chunk size: 64KB
   - No memory buffering
   - Works with files >1GB

```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const backup = await repository.findById(params.id);
  if (!backup) return new Response('Not found', { status: 404 });
  
  const filePath = path.join(BACKUP_DIR, backup.filename);
  const stat = await fs.stat(filePath);
  
  const stream = createReadStream(filePath, {
    highWaterMark: 64 * 1024, // 64KB chunks
  });
  
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${backup.filename}"`,
      'Content-Length': stat.size.toString(),
    },
  });
}
```

2. **pg_dump Optimization**
   - Use `--format=plain` (SQL format, most compatible)
   - Add `--verbose` for progress tracking
   - Use `--jobs=N` for parallel dumps (PostgreSQL 17+)
   - Exclude unnecessary data: `--exclude-table-data=audit_logs`

```typescript
const pgDumpArgs = [
  '--host=localhost',
  '--port=5432',
  `--username=${DB_USER}`,
  `--dbname=${DB_NAME}`,
  '--format=plain', // SQL format
  '--verbose', // Progress output
  '--no-owner', // Skip ownership commands
  '--no-acl', // Skip access privileges
  `--file=${outputPath}`,
];

// For large databases (optional optimization)
if (estimatedSize > 1_000_000_000) { // 1GB
  pgDumpArgs.push('--jobs=4'); // Parallel dump
}
```

3. **Timeout Configuration**
   - Default: 30 minutes
   - Configurable via environment variable
   - Show warning if backup takes >10 minutes

```typescript
const BACKUP_TIMEOUT = parseInt(
  process.env.BACKUP_TIMEOUT_MINUTES || '30',
  10
) * 60 * 1000;
```

4. **Resource Monitoring**
   - Track CPU and memory usage during backup
   - Show warning if system resources are strained
   - Throttle parallel operations if needed

### 5.2 Network Interruption Handling

**Download Resumption:**

- Use `Accept-Ranges: bytes` header
- Support HTTP Range requests
- Browser handles resume automatically

```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const backup = await repository.findById(params.id);
  const filePath = path.join(BACKUP_DIR, backup.filename);
  const stat = await fs.stat(filePath);
  
  const range = req.headers.get('range');
  
  if (range) {
    // Parse range header: "bytes=0-1023"
    const [start, end] = range
      .replace(/bytes=/, '')
      .split('-')
      .map(Number);
    
    const chunkSize = (end || stat.size - 1) - start + 1;
  
    const stream = createReadStream(filePath, { start, end: end || stat.size - 1 });
  
    return new Response(stream as any, {
      status: 206, // Partial Content
      headers: {
        'Content-Range': `bytes ${start}-${end || stat.size - 1}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'application/sql',
      },
    });
  }
  
  // Standard response (full file)
  const stream = createReadStream(filePath);
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${backup.filename}"`,
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
    },
  });
}
```

### 5.3 Long-Running Operation Best Practices

1. **Job Queue Isolation**

   - Separate queue: `database-backups`
   - Concurrency: 1 (only one backup at a time)
   - Priority: Low (don't block other jobs)
2. **Process Spawning**

   - Use `child_process.spawn()` (not `exec`)
   - Stream stdout/stderr for progress
   - Handle process signals (SIGTERM, SIGKILL)
3. **Cleanup on Failure**

   - Delete partial backup files
   - Release database locks
   - Clear progress indicators
4. **Health Checks**

   - Monitor job queue depth
   - Alert if backup fails 3 times consecutively
   - Show system status in dashboard

---

## 6. Audit Logging Integration

### 6.1 Audit Events

**All backup operations must be logged:**

```typescript
enum BackupAuditAction {
  BACKUP_CREATED = 'backup:created',
  BACKUP_STARTED = 'backup:started',
  BACKUP_COMPLETED = 'backup:completed',
  BACKUP_FAILED = 'backup:failed',
  BACKUP_DOWNLOADED = 'backup:downloaded',
  BACKUP_DELETED = 'backup:deleted',
  BACKUP_AUTO_DELETED = 'backup:auto_deleted',
  
  RESTORE_STARTED = 'restore:started',
  RESTORE_COMPLETED = 'restore:completed',
  RESTORE_FAILED = 'restore:failed',
}
```

### 6.2 Audit Log Metadata

**Comprehensive context for compliance:**

```typescript
interface BackupAuditMetadata {
  backupId: string;
  filename: string;
  fileSize?: number;
  durationSeconds?: number;
  
  // Database context
  databaseName: string;
  postgresVersion: string;
  tableCount?: number;
  recordCount?: number;
  
  // User context
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  
  // Timing
  timestamp: string;
  
  // Error context (if failed)
  errorCode?: string;
  errorMessage?: string;
  
  // Restore context
  restoredFromBackupId?: string;
  restoredFromFilename?: string;
}
```

### 6.3 Implementation

```typescript
class BackupAuditLogger {
  async logBackupCreated(backup: DatabaseBackup, userId: string) {
    await this.auditLogRepository.create({
      action: BackupAuditAction.BACKUP_CREATED,
      entityType: 'DatabaseBackup',
      entityId: backup.id,
      userId,
      metadata: {
        backupId: backup.id,
        filename: backup.filename,
        databaseName: backup.databaseName,
        postgresVersion: backup.postgresVersion,
        notes: backup.notes,
      },
    });
  }
  
  async logBackupCompleted(backup: DatabaseBackup) {
    await this.auditLogRepository.create({
      action: BackupAuditAction.BACKUP_COMPLETED,
      entityType: 'DatabaseBackup',
      entityId: backup.id,
      userId: backup.createdById,
      metadata: {
        backupId: backup.id,
        filename: backup.filename,
        fileSize: Number(backup.fileSize),
        durationSeconds: backup.durationSeconds,
        tableCount: backup.tableCount,
        recordCount: Number(backup.recordCount),
      },
    });
  }
  
  async logBackupDownloaded(backup: DatabaseBackup, userId: string, req: Request) {
    await this.auditLogRepository.create({
      action: BackupAuditAction.BACKUP_DOWNLOADED,
      entityType: 'DatabaseBackup',
      entityId: backup.id,
      userId,
      metadata: {
        backupId: backup.id,
        filename: backup.filename,
        fileSize: Number(backup.fileSize),
        ipAddress: this.getIpAddress(req),
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });
  }
  
  async logRestoreStarted(
    backup: DatabaseBackup,
    userId: string,
    req: Request
  ) {
    await this.auditLogRepository.create({
      action: BackupAuditAction.RESTORE_STARTED,
      entityType: 'DatabaseBackup',
      entityId: backup.id,
      userId,
      metadata: {
        restoredFromBackupId: backup.id,
        restoredFromFilename: backup.filename,
        fileSize: Number(backup.fileSize),
        ipAddress: this.getIpAddress(req),
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
      severity: 'critical', // High-impact operation
    });
  }
}
```

### 6.4 Audit Log Viewer Integration

**Add filter option in existing Audit Logs page:**

```tsx
// In audit-log-filters.tsx
<Select
  value={filters.entityType}
  onValueChange={(value) => handleFilterChange({ entityType: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="All entity types" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All entity types</SelectItem>
    <SelectItem value="DatabaseBackup">Database Backups</SelectItem>
    {/* ... other entity types ... */}
  </SelectContent>
</Select>
```

**Add action filter:**

```tsx
<Select
  value={filters.action}
  onValueChange={(value) => handleFilterChange({ action: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="All actions" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All actions</SelectItem>
    <SelectItem value="backup:created">Backup Created</SelectItem>
    <SelectItem value="backup:completed">Backup Completed</SelectItem>
    <SelectItem value="backup:downloaded">Backup Downloaded</SelectItem>
    <SelectItem value="restore:started">Restore Started</SelectItem>
    {/* ... other actions ... */}
  </SelectContent>
</Select>
```

---

## 7. Production Deployment Considerations

### 7.1 Environment Variables

**Required:**

```env
# Database (existing)
DATABASE_URL="postgresql://user:pass@localhost:5432/barq_assets"

# Backup storage
BACKUP_STORAGE_PATH="/Users/abdullahalzuwayed/dev/barq/barq-assets/local/backups"

# pg_dump binary path (optional, auto-detected if in PATH)
PG_DUMP_PATH="/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump"
PSQL_PATH="/Applications/Postgres.app/Contents/Versions/17/bin/psql"

# Limits
BACKUP_TIMEOUT_MINUTES="30"
MAX_BACKUP_COUNT="5"
MAX_BACKUP_SIZE_GB="10"

# Features
ENABLE_BACKUP_COMPRESSION="false" # Future enhancement
ENABLE_REMOTE_BACKUP="false" # Future enhancement
```

### 7.2 File Paths and Permissions

**Directory Structure:**

```
/Users/abdullahalzuwayed/dev/barq/barq-assets/
├── local/
│   ├── backups/              # NEW: Backup storage
│   │   ├── backup_20231130_144523.sql
│   │   ├── backup_20231129_081245.sql
│   │   └── .gitkeep
│   └── barq-data/            # Existing
```

**Setup Script:**

```bash
#!/bin/bash
# scripts/setup-backup-storage.sh

BACKUP_DIR="./local/backups"

# Create directory
mkdir -p "$BACKUP_DIR"

# Set permissions (read/write for owner only)
chmod 700 "$BACKUP_DIR"

# Create .gitkeep
touch "$BACKUP_DIR/.gitkeep"

# Add to .gitignore
echo "local/backups/*.sql" >> .gitignore

echo "✅ Backup storage directory created: $BACKUP_DIR"
echo "⚠️  Ensure this directory has sufficient disk space"
```

**Permissions Check:**

```typescript
async function validateBackupDirectory(): Promise<void> {
  const backupDir = process.env.BACKUP_STORAGE_PATH || './local/backups';
  
  try {
    // Check if directory exists
    await fs.access(backupDir, fs.constants.F_OK);
  
    // Check if writable
    await fs.access(backupDir, fs.constants.W_OK);
  
    // Check if readable
    await fs.access(backupDir, fs.constants.R_OK);
  
    // Check available space
    const stats = await fs.statfs(backupDir);
    const availableGB = (stats.bavail * stats.bsize) / 1024 / 1024 / 1024;
  
    if (availableGB < 5) {
      logger.warn('Low disk space for backups', { availableGB });
    }
  
  } catch (error) {
    throw new Error(
      `Backup directory validation failed: ${backupDir}. ` +
      `Ensure directory exists and has read/write permissions.`
    );
  }
}
```

### 7.3 Production vs Development Behavior

**Environment Detection:**

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Development: More verbose logging, shorter timeouts, smaller limits
const BACKUP_CONFIG = isDevelopment
  ? {
      timeout: 10 * 60 * 1000, // 10 minutes
      maxBackups: 3,
      enableDebugLogging: true,
      autoDeleteOnFail: true,
    }
  : {
      timeout: 30 * 60 * 1000, // 30 minutes
      maxBackups: 5,
      enableDebugLogging: false,
      autoDeleteOnFail: false, // Keep failed backups for debugging
    };
```

**Production Safety Checks:**

```typescript
async function createBackup(userId: string): Promise<DatabaseBackup> {
  // Check if another backup is running
  const runningBackup = await repository.findOne({
    where: { status: 'RUNNING' },
  });
  
  if (runningBackup) {
    throw new Error(
      'Another backup is already in progress. ' +
      'Please wait for it to complete before starting a new backup.'
    );
  }
  
  // Check disk space (require at least 2x current DB size)
  const dbSize = await systemSetupRepo.getDatabaseSize();
  const availableSpace = await this.getAvailableDiskSpace();
  
  if (dbSize && availableSpace < dbSize * 2) {
    throw new Error(
      `Insufficient disk space. Available: ${formatBytes(availableSpace)}, ` +
      `Required: ${formatBytes(dbSize * 2)} (2x database size)`
    );
  }
  
  // Check if we're in production and during business hours
  if (isProduction && this.isBusinessHours()) {
    logger.warn('Backup started during business hours', {
      userId,
      timestamp: new Date(),
    });
  }
  
  // Proceed with backup...
}
```

### 7.4 Monitoring and Alerting

**Health Check Endpoint:**

```typescript
// /api/health/backups
export async function GET() {
  const health = {
    status: 'healthy',
    lastBackup: null as string | null,
    lastBackupStatus: null as string | null,
    oldestBackupAge: null as number | null,
    consecutiveFailures: 0,
    availableDiskSpace: null as number | null,
    warnings: [] as string[],
  };
  
  // Get last backup
  const lastBackup = await repository.findOne({
    orderBy: { createdAt: 'desc' },
  });
  
  if (lastBackup) {
    health.lastBackup = lastBackup.createdAt.toISOString();
    health.lastBackupStatus = lastBackup.status;
    health.oldestBackupAge = differenceInDays(new Date(), lastBackup.createdAt);
  }
  
  // Check for consecutive failures
  const recentBackups = await repository.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  health.consecutiveFailures = recentBackups
    .filter(b => b.status === 'FAILED')
    .length;
  
  // Check disk space
  health.availableDiskSpace = await this.getAvailableDiskSpace();
  
  // Warnings
  if (!lastBackup || health.oldestBackupAge > 7) {
    health.warnings.push('No backup in last 7 days');
  }
  
  if (health.consecutiveFailures >= 3) {
    health.warnings.push('Multiple consecutive backup failures');
    health.status = 'degraded';
  }
  
  if (health.availableDiskSpace && health.availableDiskSpace < 5 * 1024 * 1024 * 1024) {
    health.warnings.push('Low disk space (<5GB)');
    health.status = 'degraded';
  }
  
  return Response.json(health);
}
```

**Integration with System Health Panel:**

```tsx
// In SystemHealthPanel.tsx
const backupHealth = await fetch('/api/health/backups').then(r => r.json());

<Card>
  <CardHeader>
    <CardTitle>Backup System</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Status</span>
        <Badge variant={backupHealth.status === 'healthy' ? 'default' : 'destructive'}>
          {backupHealth.status}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Last Backup</span>
        <span>{backupHealth.lastBackup ? formatDistanceToNow(new Date(backupHealth.lastBackup)) : 'Never'}</span>
      </div>
      {backupHealth.warnings.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {backupHealth.warnings.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  </CardContent>
</Card>
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Days 1-2)

- [ ] Database schema (Prisma migration)
- [ ] Repository interface and implementation
- [ ] Use cases (create, list, delete, get)
- [ ] DI container bindings
- [ ] Basic controller actions
- [ ] New permissions added to RBAC seed

### Phase 2: Core Backup Functionality (Days 3-4)

- [ ] pg_dump wrapper service
- [ ] File system operations (create, delete, validate)
- [ ] Background job processor (BullMQ)
- [ ] Progress tracking (Redis pub/sub)
- [ ] Retention policy enforcement
- [ ] Audit logging integration

### Phase 3: UI Components (Days 5-6)

- [ ] Backups tab in System Setup Dashboard
- [ ] TanStack Table with columns
- [ ] Status badges and icons
- [ ] Actions dropdown menu
- [ ] Create backup dialog
- [ ] Backup details dialog
- [ ] Progress indicators and SSE hook

### Phase 4: Restore Functionality (Days 7-8)

- [ ] Restore use case and service
- [ ] Destructive restore logic (drop all tables)
- [ ] Restore job processor
- [ ] Confirmation dialog with safeguards
- [ ] Session clearing on restore
- [ ] Restore audit logging

### Phase 5: Downloads & Streaming (Day 9)

- [ ] Download API route with streaming
- [ ] Range request support (resumable downloads)
- [ ] Download audit logging
- [ ] Browser download UX

### Phase 6: Error Handling & UX Polish (Day 10)

- [ ] Error categorization and user-friendly messages
- [ ] Error display components
- [ ] Loading states and skeletons
- [ ] Empty states
- [ ] Toast notifications
- [ ] Environment-specific warnings

### Phase 7: Production Hardening (Days 11-12)

- [ ] Environment variable validation
- [ ] Disk space checks
- [ ] Timeout configuration
- [ ] Health check endpoint
- [ ] Setup script for backup directory
- [ ] Documentation updates
- [ ] Production testing

### Phase 8: Testing & Deployment (Days 13-14)

- [ ] Unit tests for use cases
- [ ] Integration tests for backup/restore flow
- [ ] E2E tests for UI flows
- [ ] Performance testing with large databases
- [ ] Security audit
- [ ] Final documentation
- [ ] Deployment to production

---

## 9. Critical Files for Implementation

### Domain Layer

1. **src/core/domain/entities/database-backup.entity.ts**

   - Entity definition with business logic
   - Status validation
   - Progress calculation
   - Retention policy rules
2. **src/core/repositories/database-backup.repository.interface.ts**

   - Repository interface
   - Query methods: findMany, findById, findRunning
   - Mutation methods: create, update, delete
   - Progress tracking: updateProgress

### Use Cases Layer

3. **src/core/use-cases/database-backup/create-backup.use-case.ts**

   - Orchestrates backup creation
   - Validates preconditions
   - Enqueues job
   - Creates audit log
4. **src/core/use-cases/database-backup/restore-from-backup.use-case.ts**

   - Validates backup file
   - Checks permissions
   - Enqueues restore job
   - Creates critical audit log
5. **src/core/use-cases/database-backup/list-backups.use-case.ts**

   - List with filters
   - Pagination support
   - Sorting logic

### Infrastructure Layer

6. **src/infrastructure/repositories/prisma-database-backup.repository.ts**

   - Prisma ORM implementation
   - Raw SQL for progress updates
   - Soft delete support
7. **src/infrastructure/services/database-backup.service.ts**

   - pg_dump wrapper
   - File system operations
   - Progress callbacks
   - Error handling
8. **src/infrastructure/services/queue/backup-job-processor.ts**

   - BullMQ job processor
   - Backup job logic
   - Restore job logic
   - Progress updates via Redis

### Interface Adapters Layer

9. **src/interface-adapters/controllers/database-backup.controller.ts**

   - Server actions
   - Permission checks
   - Input validation (Zod)
   - Error transformation
10. **src/interface-adapters/dtos/database-backup.dto.ts**

    - Input DTOs with Zod schemas
    - Output DTOs
11. **src/interface-adapters/presenters/database-backup.presenter.ts**

    - Entity → DTO transformation
    - Computed fields (formatted size, relative time)

### Presentation Layer

12. **src/components/admin/system-setup/panels/DatabaseBackupsPanel.tsx**

    - Main panel component
    - Quick actions card
    - Table container
    - Auto-refresh logic
13. **src/components/database-backups/database-backups-table.tsx**

    - TanStack Table implementation
    - Column definitions
    - Sorting and pagination
    - "use no memo" directive
14. **src/components/database-backups/backup-status-badge.tsx**

    - Status badge with colors
    - Icons for each status
    - Animation for "in progress"
15. **src/components/database-backups/backup-actions-menu.tsx**

    - Dropdown menu component
    - Download, restore, delete actions
    - Permission checks
    - Confirmation dialogs

### API Routes

16. **src/app/api/backups/[id]/download/route.ts**

    - Streaming file download
    - Range request support
    - Audit logging
17. **src/app/api/backups/[id]/progress/route.ts**

    - Server-Sent Events endpoint
    - Redis pub/sub subscription
    - Heartbeat mechanism

### Database Schema

18. **src/infrastructure/database/prisma/schema/backups.prisma**
    - DatabaseBackup model
    - Enums: BackupStatus, BackupStage
    - Indexes for performance

### DI Configuration

19. **src/di/modules/database-backup.module.ts**

    - Repository bindings
    - Use case bindings
    - Service bindings
20. **src/di/types.ts**

    - DI token additions:
      - IDatabaseBackupRepository
      - CreateBackupUseCase
      - RestoreFromBackupUseCase
      - ListBackupsUseCase
      - DeleteBackupUseCase
      - DatabaseBackupService

### Permissions

21. **src/core/domain/value-objects/permission-key.ts**

    - Add: DATABASE_BACKUP
    - Add: DATABASE_RESTORE
22. **src/lib/rbac/permission-groups.ts**

    - Add to "System & Administration" group

### Scripts

23. **scripts/setup-backup-storage.sh**
    - Create backup directory
    - Set permissions
    - Update .gitignore

---

## 10. Risk Mitigation

### Risk 1: Large File Memory Issues

**Mitigation:**

- Use streaming for all file operations
- No in-memory buffering
- Test with 1GB+ databases

### Risk 2: Concurrent Backup Requests

**Mitigation:**

- Check for running backups before starting
- Queue depth limit: 1
- Clear error message if backup in progress

### Risk 3: Corrupted Backup Files

**Mitigation:**

- Validate backup immediately after creation
- Run `psql --set ON_ERROR_STOP=on --dry-run`
- Store validation status in metadata

### Risk 4: Accidental Restore in Production

**Mitigation:**

- Confirmation dialog with exact text match
- Show environment warning
- Require typed confirmation: "RESTORE DATABASE"
- Critical audit log before restore

### Risk 5: Disk Space Exhaustion

**Mitigation:**

- Check available space before backup
- Automatic retention policy (keep last 5)
- Alert if space < 5GB
- Manual cleanup option

---

## 11. Success Criteria

### User Experience

- [ ] System admin can create backup in <3 clicks
- [ ] Progress visible in real-time
- [ ] Download works for files >1GB
- [ ] Error messages are actionable
- [ ] Restore flow has clear safeguards

### Performance

- [ ] Backup completes in <5 minutes for 500MB database
- [ ] Download starts immediately (no buffering)
- [ ] UI remains responsive during backup
- [ ] Progress updates within 2 seconds

### Reliability

- [ ] Backups survive server restart
- [ ] Failed backups clean up partial files
- [ ] Retention policy runs automatically
- [ ] All operations logged to audit trail

### Security

- [ ] Only DATABASE_BACKUP permission can create
- [ ] Only DATABASE_RESTORE permission can restore
- [ ] Files stored outside public directory
- [ ] Download requires authentication

### Monitoring

- [ ] Health check shows backup system status
- [ ] Alert on 3 consecutive failures
- [ ] Dashboard shows last backup age
- [ ] Disk space warnings visible

---

## Conclusion

This plan prioritizes **production readiness** over simplicity. Key strengths:

1. **Rich UX** - Progress tracking, detailed metadata, user-friendly errors
2. **Operational Visibility** - Audit logs, health checks, monitoring
3. **Performance** - Streaming, background jobs, efficient queries
4. **Safety** - Confirmation dialogs, environment checks, retention policies
5. **Compliance** - Comprehensive audit trail for regulatory requirements

The implementation follows the existing Clean Architecture patterns and integrates seamlessly with the current system setup dashboard.

**Estimated Timeline:** 14 days (2 weeks sprint)
**Complexity:** High (production-grade feature)
**Priority:** Critical (data safety and business continuity)
