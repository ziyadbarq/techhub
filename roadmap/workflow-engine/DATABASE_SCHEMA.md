# Database Schema

Two Prisma schema files:
- `src/infrastructure/database/prisma/schema/workflow-engine.prisma`
- `src/infrastructure/database/prisma/schema/change-management.prisma`

Enums go into `shared-enums.prisma`.

---

## New Enums (add to shared-enums.prisma)

```prisma
enum WorkflowDefinitionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum WorkflowInstanceStatus {
  PENDING
  RUNNING
  COMPLETED
  REJECTED
  CANCELLED
  FAILED
  EXPIRED
}

enum WorkflowStepType {
  APPROVAL
  INPUT
  AUTOMATION
  NOTIFICATION
  DELAY
  BRANCH
  PARALLEL
  WEBHOOK
  ESCALATION
  REVIEW
  LOOP
  TERMINATION
}

enum WorkflowStepStatus {
  PENDING
  ACTIVE
  WAITING
  COMPLETED
  SKIPPED
  FAILED
  ESCALATED
  TIMED_OUT
  CANCELLED
}

enum WorkflowActionType {
  APPROVE
  REJECT
  REQUEST_INFO
  PROVIDE_INFO
  DELEGATE
  REASSIGN
  ESCALATE
  SKIP
  TERMINATE
  AUTO_APPROVE
  AUTO_REJECT
  WEBHOOK_CALLBACK
  SYSTEM_ACTION
  FORCE_ADVANCE
}

enum WorkflowSlaEventType {
  WARNING
  BREACH
  PAUSE
  RESUME
  RESET
}

enum ChangeType {
  STANDARD
  NORMAL
  EMERGENCY
}

enum ChangeStatus {
  DRAFT
  SUBMITTED
  IN_WORKFLOW
  APPROVED
  REJECTED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  FAILED
  ROLLED_BACK
  PIR_PENDING
  CLOSED
  CANCELLED
}

enum ChangePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ChangeRiskLevel {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
  CRITICAL
}

enum MaintenanceWindowRecurrence {
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum PIROutcome {
  SUCCESSFUL
  PARTIAL
  FAILED
  ROLLED_BACK
}
```

---

## workflow-engine.prisma

```prisma
model WorkflowDefinition {
  id          String                  @id @default(cuid())
  name        String
  slug        String                  @unique
  description String?
  version     Int                     @default(1)
  status      WorkflowDefinitionStatus @default(DRAFT)

  // Which entity type this definition applies to (e.g. "ChangeRequest")
  entityType  String

  // JSON: conditions that trigger auto-selection of this definition
  // e.g. {"field": "changeType", "op": "==", "value": "EMERGENCY"}
  triggerConditions Json?

  // JSON: the full step graph — see ENGINE_CORE.md for DSL reference
  steps             Json

  // JSON: global SLA config {duration, calendar, warnAt, escalateAt}
  slaConfig         Json?

  // JSON: default notification templates per lifecycle event
  notificationConfig Json?

  metadata    Json?
  publishedAt DateTime?
  publishedById String?
  publishedBy   Person?  @relation("DefinitionPublishedBy", fields: [publishedById], references: [id])

  createdById String
  createdBy   Person   @relation("DefinitionCreatedBy", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  instances   WorkflowInstance[]
}

model WorkflowInstance {
  id               String                 @id @default(cuid())
  definitionId     String
  definition       WorkflowDefinition     @relation(fields: [definitionId], references: [id])
  definitionVersion Int                   // pinned at start — survives definition updates

  entityType       String                 // e.g. "ChangeRequest"
  entityId         String                 // FK to the entity (not a real FK — entity-agnostic)

  status           WorkflowInstanceStatus @default(PENDING)

  // IDs of currently active steps (array supports parallel branches)
  currentStepIds   String[]               @default([])

  // Runtime data: resolved assignees, evaluated conditions, snapshots
  context          Json                   @default("{}")

  outcome          String?                // e.g. "APPROVED", "REJECTED", custom string
  startedAt        DateTime               @default(now())
  completedAt      DateTime?

  slaDeadline      DateTime?
  slaBreachedAt    DateTime?

  startedById      String
  startedBy        Person                 @relation("InstanceStartedBy", fields: [startedById], references: [id])
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt

  stepInstances    WorkflowStepInstance[]
  actions          WorkflowAction[]
  slaEvents        WorkflowSlaEvent[]

  @@index([entityType, entityId])
  @@index([status])
}

model WorkflowStepInstance {
  id          String             @id @default(cuid())
  instanceId  String
  instance    WorkflowInstance   @relation(fields: [instanceId], references: [id])

  // Matches the "id" field in the step definition JSON
  stepId      String
  stepType    WorkflowStepType
  stepName    String

  status      WorkflowStepStatus @default(PENDING)

  // Resolved at activation time
  assigneeStrategy    String?
  resolvedAssigneeIds String[]   @default([])

  activatedAt  DateTime?
  completedAt  DateTime?
  outcome      String?           // e.g. "APPROVED", "REJECTED", "TIMED_OUT"

  slaDeadline  DateTime?
  slaBreachedAt DateTime?
  slaPausedAt  DateTime?         // set when clock is paused (REQUEST_INFO)

  // Collected data for INPUT steps
  input        Json?

  // Result data for AUTOMATION/WEBHOOK steps
  output       Json?

  // Parallel branch parent step (if this is inside a PARALLEL branch)
  parentStepId String?

  metadata     Json?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  actions      WorkflowAction[]
  slaEvents    WorkflowSlaEvent[]

  @@index([instanceId, status])
  @@index([instanceId, stepId])
}

model WorkflowAction {
  id             String              @id @default(cuid())
  instanceId     String
  instance       WorkflowInstance    @relation(fields: [instanceId], references: [id])
  stepInstanceId String
  stepInstance   WorkflowStepInstance @relation(fields: [stepInstanceId], references: [id])

  actorId        String?             // null for SYSTEM actions
  actor          Person?             @relation("WorkflowActionActor", fields: [actorId], references: [id])

  actionType     WorkflowActionType
  comment        String?             @db.Text
  inputData      Json?               // form data submitted with action
  metadata       Json?               // IP, user agent, source

  createdAt      DateTime            @default(now())
  // Intentionally no updatedAt — this is an immutable audit record

  @@index([instanceId])
  @@index([actorId])
}

model WorkflowSlaEvent {
  id             String              @id @default(cuid())
  instanceId     String
  instance       WorkflowInstance    @relation(fields: [instanceId], references: [id])
  stepInstanceId String?
  stepInstance   WorkflowStepInstance? @relation(fields: [stepInstanceId], references: [id])

  eventType      WorkflowSlaEventType
  triggeredAt    DateTime            @default(now())
  notifiedUserIds String[]           @default([])
  metadata       Json?
}
```

---

## change-management.prisma

```prisma
model ChangeRequest {
  id           String        @id @default(cuid())
  changeNumber String        @unique  // e.g. CR-20260414-00042

  requestTypeCode String     // CR, AR, IR, CFR, ACCESS, FIREWALL, OTHER

  // CR hierarchy: AR/IR/CFR link back to their parent CR
  parentChangeRequestId String?
  parentChangeRequest   ChangeRequest?  @relation("ChangeHierarchy", fields: [parentChangeRequestId], references: [id])
  childRequests         ChangeRequest[] @relation("ChangeHierarchy")

  title        String
  description  String        @db.Text

  changeType   ChangeType
  priority     ChangePriority @default(MEDIUM)
  status       ChangeStatus   @default(DRAFT)

  // People
  requestedById  String
  requestedBy    Person   @relation("ChangeRequestedBy", fields: [requestedById], references: [id])
  assignedToId   String?
  assignedTo     Person?  @relation("ChangeAssignedTo", fields: [assignedToId], references: [id])

  // Workflow link
  workflowInstanceId String?          @unique
  workflowInstance   WorkflowInstance? @relation(fields: [workflowInstanceId], references: [id])

  // Planning fields
  justification      String?  @db.Text
  testPlan           String?  @db.Text
  rollbackPlan       String?  @db.Text
  implementationPlan String?  @db.Text

  // Risk
  riskLikelihood  Int?         // 1-5
  riskImpact      Int?         // 1-5
  riskScore       Int?         // computed: likelihood * impact
  riskLevel       ChangeRiskLevel?
  riskNotes       String?      @db.Text
  riskAssessedById String?
  riskAssessedBy   Person?     @relation("ChangeRiskAssessor", fields: [riskAssessedById], references: [id])
  riskAssessedAt   DateTime?

  // Scheduling
  scheduledStartAt     DateTime?
  scheduledEndAt       DateTime?
  maintenanceWindowId  String?
  maintenanceWindow    MaintenanceWindow? @relation(fields: [maintenanceWindowId], references: [id])

  // Implementation
  actualStartAt        DateTime?
  actualEndAt          DateTime?
  implementationNotes  String?  @db.Text
  failureReason        String?  @db.Text
  rollbackExecutedAt   DateTime?
  rollbackNotes        String?  @db.Text

  // Closure
  closedAt    DateTime?
  closedById  String?
  closedBy    Person?   @relation("ChangeClosedBy", fields: [closedById], references: [id])
  closureNotes String?  @db.Text

  // Flexible attributes for type-specific fields
  attributes  Json?

  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  affectedCIs      ChangeAffectedCI[]
  affectedServices ChangeAffectedService[]
  pir              PostImplementationReview?

  @@index([status])
  @@index([requestedById])
  @@index([changeType, status])
  @@index([parentChangeRequestId])
}

model ChangeAffectedCI {
  id                    String  @id @default(cuid())
  changeRequestId       String
  changeRequest         ChangeRequest         @relation(fields: [changeRequestId], references: [id])
  configurationItemId   String
  configurationItem     ConfigurationItem     @relation(fields: [configurationItemId], references: [id])
  impactDescription     String?

  @@unique([changeRequestId, configurationItemId])
}

model ChangeAffectedService {
  id              String  @id @default(cuid())
  changeRequestId String
  changeRequest   ChangeRequest @relation(fields: [changeRequestId], references: [id])
  serviceId       String
  service         Service       @relation(fields: [serviceId], references: [id])
  impactDescription String?

  @@unique([changeRequestId, serviceId])
}

model MaintenanceWindow {
  id          String  @id @default(cuid())
  name        String
  description String?

  recurrence  MaintenanceWindowRecurrence
  dayOfWeek   Int?    // 0 = Sunday ... 6 = Saturday
  dayOfMonth  Int?    // 1-31
  startTime   String  // HH:MM (24h)
  endTime     String  // HH:MM (24h)
  timezone    String  @default("Asia/Riyadh")
  durationMinutes Int
  customCron  String? // for CUSTOM recurrence

  isActive      Boolean  @default(true)
  effectiveFrom DateTime
  effectiveTo   DateTime?

  metadata   Json?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  changeRequests ChangeRequest[]
}

model MaintenanceBlackout {
  id          String   @id @default(cuid())
  name        String
  reason      String?  @db.Text
  startAt     DateTime
  endAt       DateTime
  isActive    Boolean  @default(true)

  createdById String
  createdBy   Person   @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([startAt, endAt])
}

model PostImplementationReview {
  id              String     @id @default(cuid())
  changeRequestId String     @unique
  changeRequest   ChangeRequest @relation(fields: [changeRequestId], references: [id])

  reviewedById    String
  reviewedBy      Person     @relation(fields: [reviewedById], references: [id])

  outcome         PIROutcome

  actualImpactDescription  String?  @db.Text
  plannedVsActualNotes     String?  @db.Text
  lessonsLearned           String?  @db.Text
  followUpActions          String?  @db.Text

  customerImpact            Boolean @default(false)
  customerImpactDescription String?  @db.Text

  reviewedAt  DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## TargetObjectType additions (to shared-enums.prisma)

Add to the existing `TargetObjectTypeEnum`:
```prisma
  CHANGE_REQUEST
  WORKFLOW_INSTANCE
  WORKFLOW_STEP_INSTANCE
  POST_IMPLEMENTATION_REVIEW
  MAINTENANCE_WINDOW
```

---

## Index Strategy

Critical queries and their supporting indexes:

| Query | Index |
|---|---|
| Active instances by entity | `(entityType, entityId)` on WorkflowInstance |
| Pending step instances | `(instanceId, status)` on WorkflowStepInstance |
| Actions per instance | `(instanceId)` on WorkflowAction |
| Changes by status | `(status)` on ChangeRequest |
| Changes by type+status | `(changeType, status)` on ChangeRequest |
| Child requests | `(parentChangeRequestId)` on ChangeRequest |
| Blackouts by date range | `(startAt, endAt)` on MaintenanceBlackout |
