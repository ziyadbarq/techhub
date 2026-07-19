# Roadmap

This folder contains detailed specifications for planned features that are not yet implemented.

## Purpose

- Document future feature ideas with complete technical designs
- Maintain implementation plans for deferred work
- Provide quick reference when prioritizing development
- Enable consistent implementation when features are approved

## Status Definitions

- **Planned**: Fully specified, ready for implementation when prioritized
- **Partially Complete**: Work started, remaining items documented
- **Draft**: Initial idea, needs more design work
- **Blocked**: Waiting on dependencies or decisions

## Quick Wins (< 1 day each)

- [Background Job Handlers](BACKGROUND_JOB_HANDLERS.md) - **Status: Planned** - Implement 4 missing job handler stubs (email, cleanup, export). Infrastructure ready, just needs handler logic.
- [Dashboard Widgets](DASHBOARD_WIDGETS.md) - **Status: Complete** - Metrics, recent-activity, and task-queue widgets wired to real server actions and rendered on the dashboard.
- [LicenseProduct Custom Fields UI](LICENSE_PRODUCT_CUSTOM_FIELDS_UI.md) - **Status: Planned** - Add form + display components for LicenseProduct custom fields. Full backend infrastructure already in place.
- [Redis Rate Limiting](REDIS_RATE_LIMITING.md) - **Status: Planned** - Move Better Auth rate limiting from in-memory to Redis for persistence across restarts.

## Medium Features (1-5 days)

- [Universal Data Importer](UNIVERSAL_DATA_IMPORTER.md) - **Status: Partially Complete (47%)** - Core wizard + 31/66 entities configured. Remaining: 35 entity configs, import history, user guide.
- [Profile Page Enhancement](PROFILE_PAGE_ENHANCEMENT.md) - **Status: Partially Complete** - UserPreferences entity + use cases done. Remaining: 2FA (TOTP), photo upload, roles display.
- [Reporting UI](REPORTING_UI.md) - **Status: Planned** - Dedicated report pages for 3 existing backend reports (license compliance, contract expiration, OCI inventory).
- [Admin Job Scheduler](ADMIN_JOB_SCHEDULER.md) - **Status: Partially Complete** - Read-only worker dashboard done. Remaining: database-driven scheduling with admin UI configuration.
- [Security Patch Workflow](SECURITY_PATCH_WORKFLOW_V2.md) - **Status: Planned** - Monthly security patching with owner approval workflow and SAMA compliance tracking.
- [Private File Storage](PRIVATE_FILE_STORAGE.md) - **Status: Planned** - Move uploads from `public/` to `private/` with authenticated download endpoint.

## Large / Cross-Cutting ("Can of Worms")

- [Testing Strategy](TESTING_STRATEGY.md) - **Status: Planned** - Comprehensive test coverage plan. Extracted from architecture-hardening Phases 5-6. Approach incrementally.
- [Task Management Expansion](TASK_MANAGEMENT_EXPANSION.md) - **Status: Planned** - Expand basic CRUD tasks into enterprise system with assignment, dependencies, approval workflows, and project grouping.
- [Multi-Tenancy Isolation](MULTI_TENANCY_ISOLATION.md) - **Status: Partially Implemented** - OrgUnit-based data isolation. 5 repositories done, remaining entities pending. Low risk currently (single org deployment).

## Suggested Implementation Order

| Phase | Features | Scope |
|-------|----------|-------|
| **1** | Background Job Handlers, Dashboard Widgets, LicenseProduct Custom Fields UI | Small |
| **2** | Reporting UI, Profile Page 2FA | Medium |
| **3** | Universal Data Importer completion | Medium |
| **4** | Admin Job Scheduler (database-driven) | Medium |
| **5** | Testing Strategy (start with high-value targets) | Ongoing |
| **6** | Task Management Phase 1 (assignment + priority) | Medium-Large |
| **7** | Security Patch Workflow | Medium-Large |

## Archived (Completed)

The following roadmap items have been completed and moved to `docs/archive/`:
- Custom Fields Completion (all 5 phases)
- Entity Type Select (entity registry + hooks)
- Architecture Hardening Phases 1-4 (boundaries, routes manifest, DI modularization, observability)
- Consolidated Roadmap (superseded by this README)

## Adding New Features

When adding a new roadmap item:

1. Create a new markdown file with descriptive name (e.g., `FEATURE_NAME.md`)
2. Include these sections:
   - **Status** (Planned/Partially Complete/Draft/Blocked)
   - **Priority** (Low/Medium/High/Critical)
   - **Complexity** (Small/Medium/Medium-Large/Large)
   - **Estimated Effort**
   - **Overview** - Business requirements
   - **Technical Design** - Architecture, schema changes, component updates
   - **Implementation Checklist** - Broken down by phase
   - **Verification** - How to test the changes
3. Update this README with a link in the appropriate section

## Implementation Process

When a feature is approved for implementation:

1. Review and update the specification if needed
2. Break down into implementable tasks
3. Move through development phases
4. After completion, move doc to `docs/archive/`
5. Update `CLAUDE.md` if new patterns introduced

---

**Last Updated**: 2026-03-27
