# Maintenance System

## Overview

The Maintenance System enables proactive asset management through recurring preventive maintenance schedules and comprehensive maintenance history tracking.

## Features

### 1. Maintenance Schedules (Preventive)

- **Recurring Schedules**: Define maintenance tasks that repeat automatically
- **Flexible Intervals**: Weekly, Monthly, Quarterly, Yearly, Custom
- **Task Assignment**: Assign maintenance to specific team members
- **Priority Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Instructions**: Detailed step-by-step maintenance procedures
- **Active/Inactive**: Enable or disable schedules without deletion

### 2. Maintenance Records (History)

- **Scheduled Maintenance**: Auto-created from schedules
- **Ad-hoc Maintenance**: Manual one-off maintenance tasks
- **Status Tracking**: SCHEDULED → IN_PROGRESS → COMPLETED
- **Cost Tracking**: Labor and parts costs
- **Parts Used**: Track replacement parts and materials
- **Overdue Detection**: Automatic status updates for missed maintenance

## Domain Model

### MaintenanceSchedule Entity

```typescript
interface MaintenanceScheduleProps {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  scheduleType: ScheduleType; // WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
  intervalValue: number; // e.g., 2 for "every 2 weeks"
  startDate: Date;
  nextDueDate: Date;
  isActive: boolean;
  assignedToId: string | null; // Person responsible
  estimatedDurationMinutes: number | null;
  priority: MaintenancePriority; // LOW, MEDIUM, HIGH, CRITICAL
  instructions: string | null; // Detailed maintenance steps
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- Title is required and must be 3-200 characters
- scheduleType and intervalValue determine next due date calculation
- nextDueDate is automatically calculated based on schedule
- Active schedules generate maintenance records automatically
- Cannot delete schedule with pending maintenance records

**Computed Methods**:

- `isOverdue()`: Check if nextDueDate is in the past
- `calculateNextDueDate()`: Compute next occurrence based on schedule type
- `generateMaintenanceRecord()`: Create a new maintenance record for this schedule

### MaintenanceRecord Entity

```typescript
interface MaintenanceRecordProps {
  id: string;
  assetId: string;
  maintenanceScheduleId: string | null; // null = ad-hoc maintenance
  title: string;
  description: string | null;
  scheduledDate: Date;
  completedDate: Date | null;
  performedById: string | null;
  status: MaintenanceStatus; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
  notes: string | null;
  cost: number | null;
  partsUsed: string[] | null; // Array of part descriptions
  nextMaintenanceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:

- Title is required and must be 3-200 characters
- scheduledDate is required
- completedDate can only be set when status is COMPLETED
- performedById is required when status is IN_PROGRESS or COMPLETED
- cost must be non-negative if provided
- Status transitions: SCHEDULED → IN_PROGRESS → COMPLETED/CANCELLED
- Status automatically becomes OVERDUE if scheduledDate passes and status is SCHEDULED

**Computed Methods**:

- `isOverdue()`: Check if scheduled but past due
- `getDurationInDays()`: Calculate time between scheduled and completed
- `isComplete()`: Check if status is COMPLETED

## Value Objects

### ScheduleType

```typescript
enum ScheduleType {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}
```

### MaintenancePriority

```typescript
enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
```

### MaintenanceStatus

```typescript
enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}
```

## Database Schema

### MaintenanceSchedule Table

```prisma
model MaintenanceSchedule {
  id                       String    @id @default(cuid())
  assetId                  String
  title                    String
  description              String?   @db.Text
  scheduleType             String    // ScheduleType enum
  intervalValue            Int       @default(1)
  startDate                DateTime  @default(now())
  nextDueDate              DateTime
  isActive                 Boolean   @default(true)
  assignedToId             String?
  estimatedDurationMinutes Int?
  priority                 String    @default("MEDIUM") // MaintenancePriority enum
  instructions             String?   @db.Text
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  // Relations
  asset              Asset                @relation(fields: [assetId], references: [id], onDelete: Cascade)
  assignedTo         Person?              @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  maintenanceRecords MaintenanceRecord[]

  @@index([assetId])
  @@index([assignedToId])
  @@index([nextDueDate])
  @@index([isActive])
  @@map("maintenance_schedules")
}
```

### MaintenanceRecord Table

```prisma
model MaintenanceRecord {
  id                    String    @id @default(cuid())
  assetId               String
  maintenanceScheduleId String?
  title                 String
  description           String?   @db.Text
  scheduledDate         DateTime
  completedDate         DateTime?
  performedById         String?
  status                String    @default("SCHEDULED") // MaintenanceStatus enum
  notes                 String?   @db.Text
  cost                  Decimal?  @db.Decimal(12, 2)
  partsUsed             Json?     // Array of strings
  nextMaintenanceDate   DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  asset               Asset                 @relation(fields: [assetId], references: [id], onDelete: Cascade)
  maintenanceSchedule MaintenanceSchedule?  @relation(fields: [maintenanceScheduleId], references: [id], onDelete: SetNull)
  performedBy         Person?               @relation(fields: [performedById], references: [id], onDelete: SetNull)

  @@index([assetId])
  @@index([maintenanceScheduleId])
  @@index([performedById])
  @@index([scheduledDate])
  @@index([status])
  @@map("maintenance_records")
}
```

## Use Cases

### MaintenanceSchedule Use Cases

1. **CreateMaintenanceSchedule**: Create a new recurring schedule
2. **UpdateMaintenanceSchedule**: Update schedule details
3. **DeleteMaintenanceSchedule**: Delete a schedule (with validation)
4. **GetMaintenanceSchedule**: Get schedule by ID
5. **ListMaintenanceSchedules**: List schedules with filters (assetId, isActive, assignedToId)
6. **ActivateSchedule**: Set isActive = true
7. **DeactivateSchedule**: Set isActive = false

### MaintenanceRecord Use Cases

1. **CreateMaintenanceRecord**: Create a new maintenance record (scheduled or ad-hoc)
2. **UpdateMaintenanceRecord**: Update record details
3. **DeleteMaintenanceRecord**: Delete a record
4. **GetMaintenanceRecord**: Get record by ID
5. **ListMaintenanceRecords**: List records with filters (assetId, scheduleId, status, dateRange)
6. **StartMaintenance**: Change status from SCHEDULED to IN_PROGRESS
7. **CompleteMaintenance**: Mark as COMPLETED with completion details
8. **CancelMaintenance**: Cancel a scheduled maintenance
9. **GetOverdueRecords**: Get all overdue maintenance records

## Permissions

### Maintenance Schedule Permissions

- `maintenance_schedules:view` - View maintenance schedules
- `maintenance_schedules:create` - Create new schedules
- `maintenance_schedules:update` - Update schedules
- `maintenance_schedules:delete` - Delete schedules

### Maintenance Record Permissions

- `maintenance_records:view` - View maintenance records
- `maintenance_records:create` - Create new records
- `maintenance_records:update` - Update records
- `maintenance_records:delete` - Delete records
- `maintenance_records:perform` - Start/complete maintenance work

## UI Components

### Pages

1. **/maintenance** - Dashboard with overview stats
2. **/maintenance/schedules** - List all maintenance schedules
3. **/maintenance/schedules/:id** - Schedule detail page
4. **/maintenance/records** - Maintenance history with filters
5. **/maintenance/records/:id** - Record detail page

### Components

1. **MaintenanceScheduleList** - Table of schedules with filters
2. **CreateScheduleDialog** - Form to create new schedule
3. **ScheduleDetailCard** - Display schedule information
4. **MaintenanceRecordList** - Table of maintenance history
5. **CreateRecordDialog** - Form to create ad-hoc maintenance
6. **StartMaintenanceDialog** - Quick form to start scheduled work
7. **CompleteMaintenanceDialog** - Form to complete and add notes/costs
8. **UpcomingMaintenanceWidget** - Dashboard widget showing due soon

## Implementation Notes

### Auto-generation of Maintenance Records

- Background job runs daily to check active schedules
- If `nextDueDate <= today`, create a new MaintenanceRecord with status SCHEDULED
- Update schedule's `nextDueDate` based on scheduleType and intervalValue

### Overdue Detection

- Background job runs daily to check SCHEDULED records where `scheduledDate < today`
- Update status to OVERDUE automatically

### Schedule Type Calculation

```typescript
function calculateNextDueDate(schedule: MaintenanceSchedule): Date {
  const base = schedule.nextDueDate;
  switch (schedule.scheduleType) {
    case "WEEKLY":
      return addWeeks(base, schedule.intervalValue);
    case "MONTHLY":
      return addMonths(base, schedule.intervalValue);
    case "QUARTERLY":
      return addMonths(base, schedule.intervalValue * 3);
    case "YEARLY":
      return addYears(base, schedule.intervalValue);
    case "CUSTOM":
      return addDays(base, schedule.intervalValue);
  }
}
```

## Future Enhancements

- Email/notification reminders for upcoming maintenance
- Mobile app for technicians to log maintenance on-the-go
- Integration with parts inventory system
- Maintenance cost analytics and reporting
- Predictive maintenance based on asset usage patterns
- Attach photos/documents to maintenance records
- Maintenance checklists with item-by-item completion tracking
