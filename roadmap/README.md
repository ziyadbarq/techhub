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

- [RBAC Improvements](RBAC_IMPROVEMENTS.md) - **Status: Planned** - Enhanced validation and enforcement: Bidirectional conflict detection, SoD enforcement in bulk assignment, server-side permission dependency validation, UI improvements (role name comparison, same-day expiration), and audit logging for blocked operations

### Layer 2 (Asset Management)

- [Service Management System](SERVICE_MANAGEMENT.md) - **Status: Planned** - Comprehensive IT service catalog with ownership, infrastructure, and asset relationships
- [Security Patch Workflow](SECURITY_PATCH_WORKFLOW.md) - **Status: Planned** - Monthly security patching with owner approval workflow and compliance tracking

### Layer 3 (Advanced ITAM)

- None currently (8 modules fully implemented: Asset Disposals, Asset Kits, Asset Reservations, CMDB, Contract Management, License Management, Governance, Attachments)

### Layer 4 (Future)

- None currently

### Infrastructure & Development (Cross-cutting)

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
