# Task Management Expansion — Enterprise Task & Project System

**Status**: Planned
**Priority**: Medium
**Complexity**: Large
**Estimated Effort**: 2-4 weeks
**Last Updated**: 2026-03-27

> This is a "can of worms" — a large, cross-cutting change requiring new entities,
> schema migrations, permissions, UI pages, and potentially new DI modules.
> Approach in phases, with each phase independently deployable.

## Current State

The task module is **basic CRUD**:
- 1 entity: `Task` (with status: PENDING, IN_PROGRESS, COMPLETED)
- 7 use cases: create, get, update, delete, list, complete, schedule-reminder
- 1 controller: `task.controller.ts`
- 6 UI pages: list, create, detail, active/completed/archived filters
- No assignment, no dependencies, no approval workflows, no project grouping

## Target State

Enterprise task management with:
- Task assignment to individuals or teams
- Task dependencies and blocking relationships
- Manager review/approval workflows
- Project grouping for related tasks
- Priority and deadline tracking with notifications
- Comment/audit trail per task

## Proposed Phases

### Phase 1: Task Assignment & Priority (Foundation)

**Schema changes**:
```
Task model additions:
  - assigneeId (Person)
  - assigneeType (PERSON | ORG_UNIT)
  - reportToId (Person — manager/reviewer)
  - priority (LOW | MEDIUM | HIGH | CRITICAL)
  - dueDate (DateTime)
  - startDate (DateTime?)
  - estimatedHours (Float?)
  - tags (String[])
```

**Use cases to add**:
- `assign-task.use-case.ts`
- `reassign-task.use-case.ts`
- `list-my-tasks.use-case.ts` (tasks assigned to current user)
- `list-team-tasks.use-case.ts` (tasks for user's org unit)

**UI changes**:
- Assignment picker on create/edit forms
- Priority selector with color coding
- Due date with overdue highlighting
- "My Tasks" dashboard widget (connects to DASHBOARD_WIDGETS.md)
- Filter by assignee, priority, due date

**Permissions to add**:
- `TASKS_ASSIGN` — assign tasks to others
- `TASKS_VIEW_ALL` — view all tasks (not just own)

### Phase 2: Comments & Activity Trail

**New entity**: `TaskComment`
```
TaskComment:
  - taskId (Task)
  - authorId (Person)
  - content (String)
  - isSystemGenerated (Boolean — for auto-comments like "status changed")
  - createdAt, updatedAt
```

**Use cases**:
- `add-task-comment.use-case.ts`
- `list-task-comments.use-case.ts`

**UI**:
- Comments tab on task detail page
- System-generated comments for status changes, reassignment, etc.
- Markdown support for rich text

### Phase 3: Task Dependencies

**New entity**: `TaskDependency`
```
TaskDependency:
  - taskId (dependent task)
  - dependsOnTaskId (blocking task)
  - type (BLOCKS | RELATED)
```

**Business rules**:
- Cannot start a task if blocking dependencies are not completed
- Circular dependency detection
- Auto-notification when blocking task is completed

**UI**:
- Dependencies section on task detail page
- Visual indicator of blocked tasks in list view

### Phase 4: Manager Review/Approval Workflow

**Schema changes**:
```
Task model additions:
  - requiresApproval (Boolean)
  - approvalStatus (PENDING | APPROVED | REJECTED | null)
  - approvedById (Person?)
  - approvedAt (DateTime?)
  - rejectionReason (String?)

New status values:
  - PENDING_REVIEW (added to TaskStatus enum)
```

**Workflow**:
1. Assignee marks task as "Submit for Review"
2. Task status → PENDING_REVIEW
3. Manager (reportToId) gets notification
4. Manager approves → COMPLETED, or rejects → IN_PROGRESS with reason
5. Email/notification at each step

**Use cases**:
- `submit-task-for-review.use-case.ts`
- `approve-task.use-case.ts`
- `reject-task.use-case.ts`
- `list-pending-approvals.use-case.ts`

### Phase 5: Project Grouping (Optional — evaluate need)

**New entity**: `Project`
```
Project:
  - name, description, code
  - status (ACTIVE | COMPLETED | ARCHIVED)
  - ownerId (Person)
  - startDate, endDate
  - tasks[] (relation)
```

**UI**:
- `/projects` list page
- Project detail with task board (kanban or list view)
- Progress tracking (% tasks completed)

## Dependencies

- Phase 1 is independent — can start immediately
- Phase 2 depends on Phase 1 (needs assignee for @mentions)
- Phase 3 depends on Phase 1 (needs task relationships)
- Phase 4 depends on Phase 1 (needs `reportToId`)
- Phase 5 is independent of 2-4

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema migration on existing tasks | Medium | Add columns as nullable, backfill later |
| Notification spam from auto-assignments | Low | User preference toggles for task notifications |
| Circular dependencies in Phase 3 | Medium | Validate dependency graph before save |
| Approval workflow complexity | High | Start simple (single approver), expand later |
| Scope creep into project management tool | High | Keep focused on IT operations tasks, not generic PM |

## Out of Scope

- Gantt charts / timeline views
- Time tracking / timesheet functionality
- Resource allocation / capacity planning
- External integrations (Jira, Linear, etc.)
- Recurring tasks (use maintenance schedules instead)

## Verification

Each phase:
1. `npm run validate` passes
2. New permissions seeded and working
3. UI pages accessible with correct permissions
4. Email notifications sent (if applicable)
5. Existing task data preserved after migration
