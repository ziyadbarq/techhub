# RBAC Phase 2 Corrections

## Status
Planned

## Priority
High

## Complexity
Medium

## Estimated Effort
8-12 hours

## Overview
Address gaps introduced in RBAC Phase 2 to ensure segregation of duties (SoD) and permission integrity:
- Fix bidirectional role conflict detection so one-sided config entries still block conflicts.
- Prevent bulk role assignment from bypassing conflict checks; surface per-user conflict/dependency results before applying changes.
- Enforce permission dependencies server-side to avoid saving inconsistent role permissions from any entry point.
- Correct UI logic bugs (role name vs. ID comparisons) and date-picker validation for same-day expirations.

## Technical Design
- **Conflict detection**
  - Make `detectRoleConflicts` symmetric (use `rolesConflict`-style bidirectional check).
  - Enforce conflicts in `AssignRoleToUserUseCase` (reject critical conflicts; allow warnings/errors with justification flag for future use) and return structured conflict info to callers.
  - Update bulk assignment controller to short-circuit critical conflicts and report per-user/per-role outcomes.
- **Bulk assignment UX**
  - Add pre-flight validation in `BulkRoleAssignmentModal` to run SoD checks per user/role combination.
  - Present summary (warnings/errors) with options: skip conflicted users, proceed with warnings, block on critical.
- **Permission dependencies**
  - Add server-side dependency enforcement in the role permission assignment path (use case/controller) to reject or auto-augment missing dependencies.
  - Keep UI helper but block save when dependencies are missing unless auto-add is applied.
- **UI fixes**
  - Fix role conflict rendering to compare role names (not IDs).
  - Update date-picker validation to allow same-day expirations (compare against start of today).
- **Audit & telemetry**
  - Log blocked assignments (conflicts/dependencies) with reason codes for audit trail.

## Implementation Checklist
- Phase 1: Backend
  - [ ] Update `role-conflicts` logic to enforce bidirectional detection and add unit coverage.
  - [ ] Add conflict validation to `AssignRoleToUserUseCase` and bulk assignment controller; return structured results.
  - [ ] Enforce permission dependencies in role permission assignment use case/controller with clear error payloads.
  - [ ] Extend audit logging for blocked/partial operations.
- Phase 2: Frontend
  - [ ] Fix role conflict display (use role names).
  - [ ] Add bulk assignment pre-flight conflict/dependency check with summary UI and controls (skip/block/override warnings).
  - [ ] Gate saves in PermissionsManager on dependency resolution; expose auto-add flow.
  - [ ] Allow same-day expiration in date pickers.
- Phase 3: QA/Validation
  - [ ] Unit tests: conflict detection, dependency enforcement, use cases.
  - [ ] Integration tests: single and bulk assignment paths (success, warning, critical conflict cases).
  - [ ] UI tests/manual: bulk assignment flows, permission save with/without deps, date picker edge cases.

## Testing Strategy
- Unit: role conflict helper, permission dependency helper, assign-role and assign-permissions use cases.
- Integration: server actions for single and bulk role assignment; ensure conflict/dependency errors propagate.
- UI: Playwright or manual checks covering bulk assignment summary, dependency blocking/auto-add, corrected conflict badges, and same-day expiration selection.

## Risk & Considerations
- Misconfigured conflict/dependency matrices can lead to false positives/blocks; keep configs reviewable and logged.
- More validation steps may increase latency for large bulk operations; consider batching and fast-fail on critical conflicts.
- Ensure backward compatibility for existing roles; document new enforcement in admin guides.
