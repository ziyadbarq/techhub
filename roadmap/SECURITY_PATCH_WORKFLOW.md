# Security Patch Workflow

**Status**: Planned
**Priority**: High
**Complexity**: Medium (20-25 files, extending existing Maintenance system)
**Estimated Effort**: 2-3 days

## Overview

Extend the existing Maintenance system to support monthly security patching workflow with owner approval. When servers/VMs are detected as overdue for patching (>30 days), technical owners are notified to approve patching. Security team then executes approved patches and confirms completion.

## Business Requirements

### Core Requirements

1. **Auto-Detection**: System detects when Assets (servers/VMs) haven't been patched in >30 days
2. **Owner Notification**: Technical owners see their services requiring patching on dashboard
3. **Approval Workflow**:
   - Owner approves patching → appears on security dashboard
   - Owner marks as "self-patched" → skips security team
   - Security can override and patch without approval if needed
4. **Security Execution**: Security team sees approved patches, executes, and confirms completion
5. **Audit Trail**: Full history of all patches for compliance
6. **Service-Asset Linkage**: Track which services run on which servers/VMs

### Workflow States

```
[DETECTED] Asset >30 days without patch
    ↓
[PENDING_OWNER_APPROVAL] Notify technical owner
    ↓
    ├─ Owner approves → [APPROVED] → Security dashboard
    ├─ Owner self-patches → [SELF_PATCHED] → Closed
    └─ Security overrides → [SECURITY_OVERRIDE] → [IN_PROGRESS]
    ↓
[IN_PROGRESS] Security team patching
    ↓
[COMPLETED] Security confirms completion
    ↓
[Asset.lastPatchDate updated] → Cycle repeats in 30 days
```

### Key Principles

- **Simple**: Extend existing Maintenance system, no new entities
- **Manual tracking**: 30-day rule checked by background job
- **No rejection**: Owners cannot reject, only approve or self-patch
- **Flexible notes**: Open text field for patch details (KB numbers, CVEs, etc.)
- **Compliance-ready**: Full audit trail of all patches

## Technical Design

### Database Schema Changes

#### 1. Extend MaintenanceRecord Model

**File**: `src/infrastructure/database/prisma/schema.prisma`

```prisma
model MaintenanceRecord {
  // ... existing fields
  id String @id @default(cuid())
  assetId String
  scheduleId String?
  maintenanceType String
  priority String @default("MEDIUM")
  status String
  scheduledDate DateTime?
  completedDate DateTime?
  performedBy String?
  assignedToId String?
  cost Decimal? @db.Decimal(12, 2)
  currency String?
  description String? @db.Text
  notes String? @db.Text
  downtime Int? // minutes
  metadata Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // NEW FIELDS FOR PATCH WORKFLOW
  serviceId String?  // Link to Service (optional, for patching context)
  service Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)

  // Approval workflow
  ownerApprovalRequired Boolean @default(false)
  ownerApprovedAt DateTime?
  ownerApprovedBy String?  // Person ID who approved
  ownerApprovalNotes String? @db.Text

  selfPatched Boolean @default(false)
  selfPatchedBy String?  // Person ID who self-patched
  selfPatchedAt DateTime?
  selfPatchNotes String? @db.Text

  securityOverride Boolean @default(false)
  securityOverrideBy String?
  securityOverrideReason String? @db.Text

  // Relations
  asset Asset @relation(...)
  schedule MaintenanceSchedule? @relation(...)
  assignedTo Person? @relation(...)

  // NEW INDEXES
  @@index([serviceId])
  @@index([ownerApprovalRequired])
  @@index([status, ownerApprovalRequired])
  @@index([selfPatched])
}
```

#### 2. Add lastPatchDate to Asset Model

```prisma
model Asset {
  // ... existing fields

  // NEW FIELD
  lastPatchDate DateTime?  // Last time this asset was patched

  @@index([lastPatchDate])  // For finding overdue assets
}
```

#### 3. Update MaintenanceType Enum

```typescript
// In domain layer or shared constants
export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  EMERGENCY = "EMERGENCY",
  INSPECTION = "INSPECTION",
  SECURITY_PATCH = "SECURITY_PATCH", // NEW
}
```

#### 4. Update MaintenanceStatus Enum

```typescript
export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  PENDING_OWNER_APPROVAL = "PENDING_OWNER_APPROVAL", // NEW
  APPROVED = "APPROVED", // NEW
  SELF_PATCHED = "SELF_PATCHED", // NEW
  SECURITY_OVERRIDE = "SECURITY_OVERRIDE", // NEW
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}
```

### Architecture Layers

#### 1. Domain Layer Updates

**Extend MaintenanceRecord Entity**: `src/core/domain/entities/maintenance-record.entity.ts`

Add business rules:

```typescript
export class MaintenanceRecord {
  // ... existing methods

  /**
   * Check if patch is overdue for owner approval
   */
  isOverdueForApproval(): boolean {
    if (!this.props.ownerApprovalRequired) return false;
    if (this.props.status !== "PENDING_OWNER_APPROVAL") return false;

    const daysSinceCreated = Math.floor(
      (Date.now() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceCreated > 7; // Overdue after 7 days
  }

  /**
   * Owner approves patching
   */
  approveByOwner(ownerId: string, notes?: string): void {
    if (!this.props.ownerApprovalRequired) {
      throw new Error(
        "This maintenance record does not require owner approval",
      );
    }
    if (this.props.status !== "PENDING_OWNER_APPROVAL") {
      throw new Error("Cannot approve - maintenance is not pending approval");
    }

    this.props.status = "APPROVED";
    this.props.ownerApprovedAt = new Date();
    this.props.ownerApprovedBy = ownerId;
    this.props.ownerApprovalNotes = notes || null;
    this.props.updatedAt = new Date();
  }

  /**
   * Owner marks as self-patched
   */
  markAsSelfPatched(ownerId: string, notes?: string): void {
    if (!this.props.ownerApprovalRequired) {
      throw new Error(
        "This maintenance record does not require owner approval",
      );
    }
    if (this.props.status !== "PENDING_OWNER_APPROVAL") {
      throw new Error(
        "Cannot self-patch - maintenance is not pending approval",
      );
    }

    this.props.status = "SELF_PATCHED";
    this.props.selfPatched = true;
    this.props.selfPatchedBy = ownerId;
    this.props.selfPatchedAt = new Date();
    this.props.selfPatchNotes = notes || null;
    this.props.completedDate = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Security team overrides approval requirement
   */
  applySecurityOverride(securityPersonId: string, reason: string): void {
    if (this.props.status !== "PENDING_OWNER_APPROVAL") {
      throw new Error("Can only override when pending approval");
    }

    this.props.status = "SECURITY_OVERRIDE";
    this.props.securityOverride = true;
    this.props.securityOverrideBy = securityPersonId;
    this.props.securityOverrideReason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if asset needs patching (>30 days)
   */
  static isAssetOverdueForPatch(lastPatchDate: Date | null): boolean {
    if (!lastPatchDate) return true; // Never patched

    const daysSinceLastPatch = Math.floor(
      (Date.now() - lastPatchDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLastPatch > 30;
  }
}
```

**Update Asset Entity**: Add lastPatchDate field and update method

```typescript
export class Asset {
  // ... existing methods

  /**
   * Update last patch date after successful patching
   */
  updateLastPatchDate(date: Date = new Date()): void {
    this.props.lastPatchDate = date;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if asset is overdue for patching
   */
  isOverdueForPatch(): boolean {
    if (!this.props.lastPatchDate) return true;

    const daysSinceLastPatch = Math.floor(
      (Date.now() - this.props.lastPatchDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLastPatch > 30;
  }
}
```

#### 2. Use Cases Layer

**Location**: `src/core/use-cases/asset/maintenance/patch/`

Create new use cases specific to patch workflow:

1. **detect-overdue-patches.use-case.ts** - Find assets needing patches

```typescript
@injectable()
export class DetectOverduePatchesUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
  ) {}

  async execute(): Promise<Asset[]> {
    // Find all assets that haven't been patched in >30 days
    const allAssets = await this.assetRepository.findAll();

    const overdueAssets = allAssets.filter((asset) => {
      // Only check servers/VMs
      if (!this.isPatchableAsset(asset)) return false;

      // Check if already has pending patch record
      if (asset.hasPendingPatchRecord) return false;

      return asset.isOverdueForPatch();
    });

    return overdueAssets;
  }

  private isPatchableAsset(asset: Asset): boolean {
    const patchableCategories = ["SERVER", "VM", "NETWORK_DEVICE"];
    return patchableCategories.includes(asset.category.toUpperCase());
  }
}
```

2. **create-patch-request.use-case.ts** - Create patch maintenance record

```typescript
@injectable()
export class CreatePatchRequestUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(assetId: string): Promise<MaintenanceRecord> {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    // Find service(s) running on this asset
    const services = await this.serviceRepository.findByAsset(assetId);
    const primaryService = services[0] || null; // Use first service

    const record = MaintenanceRecord.create({
      assetId: asset.id,
      serviceId: primaryService?.id,
      maintenanceType: "SECURITY_PATCH",
      status: "PENDING_OWNER_APPROVAL",
      priority: "HIGH",
      description: `Security patch required - asset overdue for patching (>30 days)`,
      ownerApprovalRequired: true,
      scheduledDate: new Date(),
    });

    return await this.maintenanceRepository.create(record);
  }
}
```

3. **approve-patch.use-case.ts** - Owner approves patch

```typescript
@injectable()
export class ApprovePatchUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
  ) {}

  async execute(
    recordId: string,
    ownerId: string,
    notes?: string,
  ): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepository.findById(recordId);
    if (!record) {
      throw new Error("Maintenance record not found");
    }

    // Business rule: Validate owner has permission (implemented in controller)
    record.approveByOwner(ownerId, notes);

    return await this.maintenanceRepository.update(record);
  }
}
```

4. **self-patch.use-case.ts** - Owner marks as self-patched

```typescript
@injectable()
export class SelfPatchUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(
    recordId: string,
    ownerId: string,
    notes?: string,
  ): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepository.findById(recordId);
    if (!record) {
      throw new Error("Maintenance record not found");
    }

    record.markAsSelfPatched(ownerId, notes);

    // Update asset lastPatchDate
    const asset = await this.assetRepository.findById(record.assetId);
    if (asset) {
      asset.updateLastPatchDate();
      await this.assetRepository.update(asset);
    }

    return await this.maintenanceRepository.update(record);
  }
}
```

5. **complete-patch.use-case.ts** - Security confirms completion

```typescript
@injectable()
export class CompletePatchUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(
    recordId: string,
    performedBy: string,
    notes?: string,
  ): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepository.findById(recordId);
    if (!record) {
      throw new Error("Maintenance record not found");
    }

    // Complete the maintenance
    record.complete(performedBy, notes);

    // Update asset lastPatchDate
    const asset = await this.assetRepository.findById(record.assetId);
    if (asset) {
      asset.updateLastPatchDate();
      await this.assetRepository.update(asset);
    }

    return await this.maintenanceRepository.update(record);
  }
}
```

6. **get-pending-patches-for-owner.use-case.ts** - Owner dashboard query

```typescript
@injectable()
export class GetPendingPatchesForOwnerUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(ownerId: string): Promise<MaintenanceRecord[]> {
    // Find services owned by this person (technical ownership)
    const services = await this.serviceRepository.findByOwner(
      ownerId,
      "TECHNICAL",
    );
    const serviceIds = services.map((s) => s.id);

    // Find pending patch records for those services
    return await this.maintenanceRepository.findPendingPatchesByServices(
      serviceIds,
    );
  }
}
```

7. **get-approved-patches.use-case.ts** - Security dashboard query

```typescript
@injectable()
export class GetApprovedPatchesUseCase {
  constructor(
    @inject(DI_TOKENS.IMaintenanceRecordRepository)
    private readonly maintenanceRepository: IMaintenanceRecordRepository,
  ) {}

  async execute(): Promise<MaintenanceRecord[]> {
    return await this.maintenanceRepository.findByStatus("APPROVED");
  }
}
```

**CRITICAL**: Update `src/core/use-cases/asset/maintenance/index.ts` barrel export

#### 3. Infrastructure Layer

**Update Repository**: `src/infrastructure/repositories/prisma-maintenance-record.repository.ts`

Add new query methods:

```typescript
async findPendingPatchesByServices(
  serviceIds: string[]
): Promise<MaintenanceRecord[]> {
  const records = await this.prisma.maintenanceRecord.findMany({
    where: {
      serviceId: { in: serviceIds },
      maintenanceType: "SECURITY_PATCH",
      status: "PENDING_OWNER_APPROVAL",
    },
    include: {
      asset: true,
      service: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return records.map(r => this.toDomain(r));
}

async findByStatus(status: string): Promise<MaintenanceRecord[]> {
  const records = await this.prisma.maintenanceRecord.findMany({
    where: { status },
    include: {
      asset: true,
      service: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  return records.map(r => this.toDomain(r));
}

async findOverdueForApproval(): Promise<MaintenanceRecord[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const records = await this.prisma.maintenanceRecord.findMany({
    where: {
      ownerApprovalRequired: true,
      status: "PENDING_OWNER_APPROVAL",
      createdAt: { lt: sevenDaysAgo },
    },
    include: {
      asset: true,
      service: true,
    },
  });

  return records.map(r => this.toDomain(r));
}
```

**Update Asset Repository**: Add lastPatchDate to queries

#### 4. Background Job

**Create**: `src/infrastructure/jobs/patch-detection.job.ts`

```typescript
import { CronJob } from "cron";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { logger } from "@/lib/logger";
import type {
  DetectOverduePatchesUseCase,
  CreatePatchRequestUseCase,
} from "@/core/use-cases/asset/maintenance/patch";

/**
 * Daily job to detect assets overdue for patching
 * Runs at 2 AM daily
 */
export const patchDetectionJob = new CronJob(
  "0 2 * * *", // 2 AM daily
  async () => {
    const jobLogger = logger.scope("PatchDetectionJob");
    jobLogger.info("run", "Starting patch detection job...");

    try {
      const container = getContainer();

      // Detect overdue assets
      const detectUseCase = container.get<DetectOverduePatchesUseCase>(
        DI_TOKENS.DetectOverduePatchesUseCase,
      );
      const overdueAssets = await detectUseCase.execute();

      jobLogger.info(
        "detected",
        `Found ${overdueAssets.length} assets needing patches`,
      );

      // Create patch requests for each
      const createUseCase = container.get<CreatePatchRequestUseCase>(
        DI_TOKENS.CreatePatchRequestUseCase,
      );

      let created = 0;
      for (const asset of overdueAssets) {
        try {
          await createUseCase.execute(asset.id);
          created++;
        } catch (error) {
          jobLogger.error(
            "createPatch",
            `Failed to create patch for asset ${asset.id}`,
            error,
          );
        }
      }

      jobLogger.info("complete", `Created ${created} patch requests`);
    } catch (error) {
      jobLogger.error("run", "Patch detection job failed", error);
    }
  },
  null,
  true,
  "Asia/Riyadh", // Saudi Arabia timezone
);

// Optional: Notification job for overdue approvals
export const overdueApprovalNotificationJob = new CronJob(
  "0 9 * * *", // 9 AM daily
  async () => {
    const jobLogger = logger.scope("OverdueApprovalJob");
    jobLogger.info("run", "Checking for overdue approvals...");

    try {
      const container = getContainer();
      const repository = container.get(DI_TOKENS.IMaintenanceRecordRepository);

      const overdueRecords = await repository.findOverdueForApproval();

      if (overdueRecords.length > 0) {
        jobLogger.warn(
          "overdue",
          `${overdueRecords.length} patch approvals are overdue (>7 days)`,
        );
        // TODO: Send notifications to owners and escalate to security
      }
    } catch (error) {
      jobLogger.error("run", "Overdue approval check failed", error);
    }
  },
  null,
  true,
  "Asia/Riyadh",
);
```

**Register Job**: `src/infrastructure/jobs/index.ts`

```typescript
import {
  patchDetectionJob,
  overdueApprovalNotificationJob,
} from "./patch-detection.job";

export function startBackgroundJobs(): void {
  patchDetectionJob.start();
  overdueApprovalNotificationJob.start();
  console.log("✓ Background jobs started");
}
```

#### 5. Interface Adapters

**Update DTOs**: `src/interface-adapters/dtos/generated/maintenance-record.dto.ts`

```typescript
export const ApprovePatchSchema = z.object({
  recordId: z.string(),
  notes: z.string().max(2000).optional(),
});

export const SelfPatchSchema = z.object({
  recordId: z.string(),
  notes: z.string().max(2000).optional(),
});

export const SecurityOverrideSchema = z.object({
  recordId: z.string(),
  reason: z.string().min(10).max(500),
});

export type ApprovePatchDTO = z.infer<typeof ApprovePatchSchema>;
export type SelfPatchDTO = z.infer<typeof SelfPatchSchema>;
export type SecurityOverrideDTO = z.infer<typeof SecurityOverrideSchema>;
```

**Update Presenter**: Add patch-specific fields

**Update Controller**: `src/interface-adapters/controllers/maintenance-record.controller.ts`

```typescript
export async function approvePatchAction(
  data: ApprovePatchDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE); // Owner permission

    const validated = ApprovePatchSchema.parse(data);

    // Get current user
    const session = await auth();
    const ownerId = session?.user?.id;

    if (!ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const useCase = container.get<ApprovePatchUseCase>(
      DI_TOKENS.ApprovePatchUseCase,
    );

    const record = await useCase.execute(
      validated.recordId,
      ownerId,
      validated.notes,
    );

    revalidatePath("/dashboard");
    revalidatePath("/maintenance");

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to approve patch");
  }
}

export async function selfPatchAction(
  data: SelfPatchDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    const validated = SelfPatchSchema.parse(data);

    const session = await auth();
    const ownerId = session?.user?.id;

    if (!ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const useCase = container.get<SelfPatchUseCase>(DI_TOKENS.SelfPatchUseCase);

    const record = await useCase.execute(
      validated.recordId,
      ownerId,
      validated.notes,
    );

    revalidatePath("/dashboard");

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to mark as self-patched");
  }
}

export async function getPendingPatchesAction(): Promise<
  ActionResponse<MaintenanceRecordDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const session = await auth();
    const ownerId = session?.user?.id;

    if (!ownerId) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const useCase = container.get<GetPendingPatchesForOwnerUseCase>(
      DI_TOKENS.GetPendingPatchesForOwnerUseCase,
    );

    const records = await useCase.execute(ownerId);

    return {
      success: true,
      data: records.map((r) => presentMaintenanceRecord(r)),
    };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to get pending patches");
  }
}

export async function getApprovedPatchesAction(): Promise<
  ActionResponse<MaintenanceRecordDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.MAINTENANCE_MANAGE); // Security team

    const container = getContainer();
    const useCase = container.get<GetApprovedPatchesUseCase>(
      DI_TOKENS.GetApprovedPatchesUseCase,
    );

    const records = await useCase.execute();

    return {
      success: true,
      data: records.map((r) => presentMaintenanceRecord(r)),
    };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to get approved patches");
  }
}
```

#### 6. Presentation Layer

**Components**: `src/components/maintenance/patch/`

1. **PatchRequestsWidget.tsx** - Dashboard widget for owners

```typescript
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { getPendingPatchesAction } from "@/interface-adapters/controllers/maintenance-record.controller";
import { PatchApprovalDialog } from "./patch-approval-dialog";

export function PatchRequestsWidget() {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatches();
  }, []);

  async function loadPatches() {
    const result = await getPendingPatchesAction();
    if (result.success) {
      setPatches(result.data);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  if (patches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Security Patches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All your services are up to date. No patches pending approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Security Patches Pending Approval
          <Badge variant="destructive">{patches.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {patches.map((patch) => (
          <div key={patch.id} className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="font-medium">{patch.asset?.name || "Unknown Asset"}</p>
              <p className="text-sm text-muted-foreground">
                {patch.service?.name || "No service linked"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Created {new Date(patch.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <PatchApprovalDialog
                patchRecord={patch}
                onSuccess={loadPatches}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

2. **PatchApprovalDialog.tsx** - Approve or self-patch dialog

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  approvePatchAction,
  selfPatchAction,
} from "@/interface-adapters/controllers/maintenance-record.controller";

export function PatchApprovalDialog({ patchRecord, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approvePatchAction({
      recordId: patchRecord.id,
      notes,
    });

    if (result.success) {
      toast.success("Patch approved. Security team will be notified.");
      setOpen(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleSelfPatch() {
    setLoading(true);
    const result = await selfPatchAction({
      recordId: patchRecord.id,
      notes,
    });

    if (result.success) {
      toast.success("Marked as self-patched.");
      setOpen(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Review Patch</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Security Patch Approval</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium">{patchRecord.asset?.name}</p>
            <p className="text-sm text-muted-foreground">
              Service: {patchRecord.service?.name || "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">
              {patchRecord.description}
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the patch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve (Security Team Patches)
            </Button>
            <Button
              onClick={handleSelfPatch}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Already Patched by Me
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

3. **SecurityPatchQueue.tsx** - Security team dashboard

```typescript
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { getApprovedPatchesAction } from "@/interface-adapters/controllers/maintenance-record.controller";
import { CompletePatchDialog } from "./complete-patch-dialog";

export function SecurityPatchQueue() {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatches();
  }, []);

  async function loadPatches() {
    const result = await getApprovedPatchesAction();
    if (result.success) {
      setPatches(result.data);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          Approved Patches Ready for Execution
          <Badge>{patches.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved patches in queue.
          </p>
        ) : (
          <div className="space-y-3">
            {patches.map((patch) => (
              <div
                key={patch.id}
                className="flex items-center justify-between border p-3 rounded"
              >
                <div>
                  <p className="font-medium">{patch.asset?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patch.service?.name || "No service"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Approved: {new Date(patch.ownerApprovedAt).toLocaleDateString()}
                  </p>
                </div>
                <CompletePatchDialog patchRecord={patch} onSuccess={loadPatches} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Dashboard Integration**:

1. **Owner Dashboard**: Add PatchRequestsWidget to `app/(dashboard)/dashboard/page.tsx`
2. **Security Dashboard**: Create `app/(dashboard)/security-patches/page.tsx` with SecurityPatchQueue

## Implementation Checklist

### Phase 1: Database Schema (0.5 days)

- [ ] Add patch-related fields to MaintenanceRecord model
- [ ] Add lastPatchDate to Asset model
- [ ] Add serviceId foreign key to MaintenanceRecord
- [ ] Update MaintenanceType enum (add SECURITY_PATCH)
- [ ] Update MaintenanceStatus enum (add approval states)
- [ ] Generate and run migration: `npx prisma migrate dev --name add-patch-workflow`

### Phase 2: Domain Layer (0.5 days)

- [ ] Extend MaintenanceRecord entity with patch methods
- [ ] Add Asset.updateLastPatchDate() method
- [ ] Add Asset.isOverdueForPatch() method
- [ ] Update validation rules

### Phase 3: Use Cases (1 day)

- [ ] Create detect-overdue-patches.use-case.ts
- [ ] Create create-patch-request.use-case.ts
- [ ] Create approve-patch.use-case.ts
- [ ] Create self-patch.use-case.ts
- [ ] Create complete-patch.use-case.ts
- [ ] Create get-pending-patches-for-owner.use-case.ts
- [ ] Create get-approved-patches.use-case.ts
- [ ] Update maintenance index.ts barrel export

### Phase 4: Infrastructure (0.5 days)

- [ ] Update PrismaMaintenanceRecordRepository with new queries
- [ ] Update PrismaAssetRepository to handle lastPatchDate
- [ ] Add DI tokens for new use cases
- [ ] Register use cases in DI container

### Phase 5: Background Jobs (0.5 days)

- [ ] Create patch-detection.job.ts
- [ ] Create overdue-approval notification job
- [ ] Register jobs in infrastructure/jobs/index.ts
- [ ] Test job execution

### Phase 6: Controllers (0.5 days)

- [ ] Create approvePatchAction
- [ ] Create selfPatchAction
- [ ] Create getPendingPatchesAction
- [ ] Create getApprovedPatchesAction
- [ ] Update DTOs with patch schemas

### Phase 7: UI Components (1 day)

- [ ] Create PatchRequestsWidget for owner dashboard
- [ ] Create PatchApprovalDialog
- [ ] Create SecurityPatchQueue for security dashboard
- [ ] Create CompletePatchDialog
- [ ] Add patch status badges and indicators

### Phase 8: Integration & Testing (0.5 days)

- [ ] Add PatchRequestsWidget to dashboard
- [ ] Create /security-patches page
- [ ] Test approval workflow end-to-end
- [ ] Test self-patch workflow
- [ ] Test background job execution
- [ ] Verify permissions

## Testing Strategy

### Manual Testing Checklist

- [ ] Create asset without lastPatchDate (never patched)
- [ ] Run background job → verify patch request created
- [ ] Owner approves patch → appears on security dashboard
- [ ] Security completes patch → asset.lastPatchDate updated
- [ ] Owner marks as self-patched → status updated, lastPatchDate set
- [ ] Wait 7 days → verify overdue notification
- [ ] Test with multiple services per owner
- [ ] Test security override functionality
- [ ] Verify permissions (owners, security team)

## Documentation

After implementation:

- [ ] Update `docs/MAINTENANCE_SYSTEM.md` with patch workflow
- [ ] Add MDX page: `src/content/docs/security-patching.mdx`
- [ ] Update `CLAUDE.md` with patch workflow patterns
- [ ] Document background job schedule

## Key Design Decisions

| Decision                  | Rationale                                         |
| ------------------------- | ------------------------------------------------- |
| Extend Maintenance system | Reuse existing infrastructure, avoid duplication  |
| Service-Asset linkage     | Track which services run on which servers         |
| 30-day rule               | Industry standard for security patching           |
| Background job detection  | Automated detection, no manual tracking           |
| No rejection allowed      | Compliance requirement - must patch or self-patch |
| Security override         | Handle emergency patches without waiting          |
| Simple text notes         | Flexible for KB numbers, CVEs, custom notes       |
| Full audit trail          | Compliance and accountability                     |

## Future Enhancements

- Patch scheduling (maintenance windows)
- Integration with vulnerability scanners (Qualys, Nessus)
- Automated patching via Ansible/Puppet
- Patch rollback tracking
- CVE/KB number structured fields
- SLA tracking (% patched within 30 days)
- Escalation workflows (auto-assign to security after 7 days)
- Patch impact analysis (services affected)
- Reporting dashboard (compliance metrics)

---

**Last Updated**: 2025-01-21
**Author**: Planning Session with Claude
**Related Docs**: `docs/MAINTENANCE_SYSTEM.md`, `docs/SERVICE_MANAGEMENT.md`
