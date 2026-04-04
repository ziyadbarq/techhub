# Dashboard Widgets — Connect Real Data

**Status**: Planned
**Priority**: High
**Complexity**: Small
**Estimated Effort**: 4-6 hours
**Last Updated**: 2026-03-27

## Overview

The main dashboard at `/` has 3 widget components that currently display **hardcoded placeholder data** with TODO comments. The UI is built — they just need to be wired to real server actions.

## Widgets to Complete

### 1. Metrics Cards

**Current state**: Hardcoded numbers (total assets, active users, etc.)
**What it needs**: Server action that aggregates counts from repositories

**Data to show**:
- Total assets (by status: active, in maintenance, retired)
- Total persons (active employees)
- Open tasks count
- Active reservations count
- Pending approvals count

**Approach**: Create `getDashboardMetricsAction()` in `my-dashboard.controller.ts` that queries counts from existing repositories.

### 2. Recent Activity

**Current state**: Hardcoded activity items
**What it needs**: Server action that reads recent audit log entries for the current user

**Data to show**:
- Last 10 actions by the current user
- Action type, target entity, timestamp
- Link to affected resource

**Approach**: Create `getRecentActivityAction()` that queries the audit log filtered by current user ID.

### 3. Task Queue

**Current state**: Hardcoded task list
**What it needs**: Server action that fetches the user's assigned tasks

**Data to show**:
- Tasks assigned to current user (status: pending, in progress)
- Task title, priority, due date
- Quick action: mark complete

**Approach**: Create `getMyTasksAction()` that queries tasks assigned to the current user.

## Files to Modify

| File | Action |
|------|--------|
| `src/interface-adapters/controllers/my-dashboard.controller.ts` | Add 3 new server actions |
| Dashboard widget components (exact paths TBD from code) | Replace hardcoded data with `useEffect` → server action calls |

## Verification

1. `npm run validate` passes
2. Dashboard shows real data after login
3. Metrics update when assets/tasks are created
4. Recent activity reflects actual user actions
