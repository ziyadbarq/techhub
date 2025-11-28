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
- [Universal Data Importer](UNIVERSAL_DATA_IMPORTER.md) - **Status: Partially Complete** - Core complete (7-step wizard, validation engine, fuzzy matching), extensions pending (64 entity configurations, import history, bulk actions for remaining entities). Currently functional for Assets and Persons.
- [Custom Fields Completion](CUSTOM_FIELDS_COMPLETION.md) - **Status: ✅ Complete** - Dynamic field definitions attached to Asset Categories with full UI integration: category field management, dynamic form rendering (14 data types), asset detail display, and data import support.
- [Entity Type Select](ENTITY_TYPE_SELECT.md) - **Status: ✅ Complete** - Dynamic entity type selection in Field Definition forms using centralized Entity Registry with 20 business entities across 7 categories.
- [Person Profile Enhancement](PERSON_PROFILE_ENHANCEMENT.md) - **Status: Planned** - Enhance Person Details Page to fully rich 360-degree profile view with data tables for all 14 incomplete sections (assets, services, governance, activity tabs).

### Layer 2 (Asset Management)

- [Service Management System](SERVICE_MANAGEMENT.md) - **Status: Planned** - Comprehensive IT service catalog with ownership, infrastructure, and asset relationships
- [Security Patch Workflow](SECURITY_PATCH_WORKFLOW.md) - **Status: Planned** - Monthly security patching with owner approval workflow and compliance tracking

### Layer 3 (Advanced ITAM)

- None currently (8 modules fully implemented: Asset Disposals, Asset Kits, Asset Reservations, CMDB, Contract Management, License Management, Governance, Attachments)

### Layer 4 (Future)

- None currently

### Infrastructure & Development (Cross-cutting)

- [Profile Page Enhancement](PROFILE_PAGE_ENHANCEMENT.md) - **Status: Planned** - Unified profile page merging User (auth) and Person (employee) data with My Assets summary, roles/permissions display, and user preferences (notifications, display settings).

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
