# Roadmap

This folder contains detailed specifications for planned features that are not yet implemented.

## Purpose

- Document future feature ideas with complete technical designs
- Maintain implementation plans for deferred work
- Provide quick reference when prioritizing development
- Enable consistent implementation when features are approved

## Status Definitions

- **Planned**: Fully specified, ready for implementation when prioritized
- **Draft**: Initial idea, needs more design work
- **Blocked**: Waiting on dependencies or decisions
- **Approved**: Greenlit for next sprint/phase

## Planned Features

### Layer 1 (Foundation) / RBAC & Admin

- [RBAC Enhancement - Phase 2 (Partially Complete)](RBAC_ENHANCEMENT_PHASE_2.md) - **Status: Partially Complete** - ✅ Permission dependencies, role conflict detection, bulk permission mode | Remaining: Enhanced audit log UI, bulk user role assignment, advanced user management, role analytics, time-based expiration background jobs, role hierarchy (40-60 hours total, ~15 hours completed)
- [RBAC Phase 2 Corrections](RBAC_PHASE2_CORRECTIONS.md) - **Status: Planned** - Fix bidirectional conflict detection, enforce SoD in bulk assignment, enforce permission dependencies server-side, UI fixes (role name comparison, same-day expiration), and audit/logging for blocked operations (8-12 hours)

### Layer 2 (Asset Management)

- [Service Management System](SERVICE_MANAGEMENT.md) - **Status: Planned** - Comprehensive IT service catalog with ownership, infrastructure, and asset relationships (~80 services)
- [Security Patch Workflow](SECURITY_PATCH_WORKFLOW.md) - **Status: Planned** - Monthly security patching with owner approval workflow and compliance tracking
- [Multi-Currency Support](MULTI_CURRENCY_SUPPORT.md) - **Status: Partially Completed (2025-11-22)** - ✅ Phases 1-4, 6-7 complete: FX rates CRUD UI (/fx-rates), currency utilities (15 currencies), database seeding, permissions. ⏳ Phase 5 pending: Update Asset/Warranty/Maintenance components with dual currency display

### Layer 3 (Advanced ITAM)

- [Schema-API Alignment: Phases 5-8](SCHEMA_API_ALIGNMENT_COMPLETION.md) - **Status: Planned** - Complete governance features (4 entities), attachments system (3 entities), testing & docs

### Layer 4 (Future)

- None currently

### UI/UX Enhancements (Cross-cutting)

- [Inline-Editable Code Fields](INLINE_EDITABLE_CODE_FIELDS.md) - **Status: Planned** - Move code/tag fields from form body to inline-editable fields in dialog titles (11 forms, 4-6 hours)

## Adding New Features

When adding a new roadmap item:

1. Create a new markdown file with descriptive name (e.g., `FEATURE_NAME.md`)
2. Include these sections:
   - **Status** (Planned/Draft/Blocked/Approved)
   - **Priority** (Low/Medium/High/Critical)
   - **Complexity** (Small/Medium/Medium-Large/Large)
   - **Estimated Effort**
   - **Overview** - Business requirements
   - **Technical Design** - Architecture, schema changes, component updates
   - **Implementation Checklist** - Broken down by phase
   - **Testing Strategy**
   - **Risk & Considerations**
3. Update this README with a link in the appropriate section

## Implementation Process

When a feature is approved for implementation:

1. Review and update the specification if needed
2. Create GitHub issue/ticket referencing the roadmap doc
3. Break down into implementable tasks
4. Move through development phases
5. After completion, move doc to `docs/` as user guide
6. Update `CLAUDE.md` with new patterns/entities

---

**Maintained By**: Development Team
**Last Updated**: 2025-11-22
