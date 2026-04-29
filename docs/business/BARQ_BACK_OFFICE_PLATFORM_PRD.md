# Product Requirements Document (PRD)

## Barq Back Office Platform

**Document Version:** 1.0
**Date:** April 23, 2026
**Organization:** Barq
**Document Owner:** Technology Department
**Classification:** Internal Use Only

---

## Executive Summary

Barq Back Office Platform is a custom Next.js-based internal application platform intended to replace Retool over time for Barq's internal dashboards, workflows, operational tools, and administrative interfaces.

This is a platform decision, not only a UI tooling decision. The primary problem to solve is not drag-and-drop productivity by itself. The core problem is safe software delivery for internal tools across `dev`, `uat`, and `prod`, with strong GitLab reviewability, environment-owned configuration, reusable shared components, and a development model that scales to 50+ engineers and future AI-assisted implementation.

The recommended direction is a two-track strategy:

1. Keep Retool running for legacy apps and urgent business continuity.
2. Build all new strategic back-office applications on a custom Next.js platform with shared libraries, shared auth, shared UI, and environment-safe delivery controls.

---

## 1. Background

### 1.1 Current Situation

Barq uses Retool extensively for back-office applications, dashboards, and operational tools across multiple environments. While Retool has enabled fast delivery, the operating model has become increasingly difficult to govern at company scale.

### 1.2 Core Pain Points

- Environment promotion from `dev -> uat -> prod` is fragile.
- Environment-specific API URLs, paths, and datasource configuration can be overwritten during promotion.
- GitLab reviewability is weaker than a normal code-first application workflow.
- Shared logic and shared UI patterns are hard to standardize across many exported apps.
- Repo hygiene degrades quickly when many developers work through generated low-code artifacts.
- AI-assisted development is constrained by serialized exports and platform-specific conventions instead of normal source code.

### 1.3 Strategic Opportunity

Barq can replace low-code sprawl with a governed internal platform that treats back-office apps as real software products:

- code-reviewed
- environment-safe
- testable
- reusable
- observable
- AI-friendly

---

## 2. Product Vision

Build a secure, self-hosted, code-first internal platform for Barq back-office applications that provides the speed of internal tooling with the governance, reusability, and delivery safety of modern software engineering.

---

## 3. Product Goals

### 3.1 Primary Goals

1. Eliminate environment drift during promotion from `dev` to `uat` to `prod`.
2. Replace fragile low-code exports with normal GitLab-based software delivery.
3. Standardize shared UI, auth, permissions, data access, logging, and observability.
4. Reduce vendor lock-in and licensing dependence for core internal operations.
5. Create a platform that AI can extend through normal code generation and review workflows.

### 3.2 Success Outcomes

- New strategic internal apps are built on the platform instead of Retool.
- Promotions no longer overwrite target-environment secrets, URLs, or resource configuration.
- Teams share reusable modules instead of cloning app logic across tools.
- Critical back-office workflows can be tested, reviewed, and promoted through GitLab CI.
- The platform becomes Barq's default path for internal tools with non-trivial business logic.

---

## 4. Non-Goals

The first platform release will not attempt to:

- rebuild every existing Retool app immediately
- create a public or customer-facing portal
- introduce a generic drag-and-drop page builder
- replace all workflow engines or operational systems at once
- solve every department's bespoke reporting need in phase 1

---

## 5. Users and Stakeholders

### 5.1 Primary Users

| User Group                              | Needs                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Operations teams                        | Fast, reliable internal tools for approvals, investigations, and day-to-day workflows |
| Risk, compliance, and audit teams       | Strong auditability, traceability, and environment-safe promotions                    |
| Engineering teams                       | Reusable building blocks, safe deployment, and normal code review                     |
| Platform and DevOps teams               | Stable CI/CD, environment isolation, secrets discipline, and observability            |
| Engineering managers and product owners | Faster delivery without platform sprawl or governance regressions                     |

### 5.2 Secondary Stakeholders

- Security
- Infrastructure
- Internal audit
- Business operations
- Department heads who depend on operational dashboards and approvals

---

## 6. Requirements

### 6.1 Must-Have Requirements

- Self-hosted or private-cloud deployable
- Clean `dev / uat / prod` separation
- Secrets and datasource config owned by the target environment and never overwritten by promotion
- GitLab-friendly workflow with branches, merge requests, CI gates, and scheduled audits
- Ability to scale beyond a small builder-oriented team
- Fine-grained permissions, audit logs, and security controls
- Reusable components, modules, and shared business logic
- Extensible APIs and code paths for complex workflows and integration logic
- Low vendor lock-in
- A practical migration path from Retool

### 6.2 Should-Have Requirements

- First-class multi-environment operating model
- Strong Git sync and version-control ergonomics
- Easy backup, restore, and export discipline
- Mature SSO and RBAC integration
- Strong support for REST, SQL, and internal APIs
- Straightforward self-hosting on Docker and Kubernetes
- AI-assisted development without fighting generated artifacts

### 6.3 Nice-to-Have Requirements

- A lightweight visual builder for simple CRUD and admin use cases
- Embedded workflow authoring for selected scenarios
- White-labeling and custom domain flexibility
- Plugin or extension ecosystem

---

## 7. Decision Criteria

Barq should evaluate platform decisions against these criteria:

- Environment promotion safety
- Git and GitLab compatibility
- Self-hosting maturity
- License and lock-in risk
- Fit for 50+ active developers
- Support for shared components and shared libraries
- AI-assisted development fit
- Migration effort from current Retool estate
- Time to first production application
- Long-term maintainability

---

## 8. Alternatives Considered

| Option                  | Self-host | Git / branch workflow | Env separation                                                                  | License / lock-in                     | Fit for 50+ devs                      | Shared components / code-first | Deploy today         | Main risk                                    |
| ----------------------- | --------- | --------------------- | ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------ | -------------------- | -------------------------------------------- |
| Retool                  | Yes       | Yes                   | Possible, but current workflow shows drift risk if resources are promoted badly | Proprietary                           | Yes                                   | Medium                         | Already deployed     | Env overwrite pain, cost, generated exports  |
| Appsmith CE             | Yes       | Yes                   | Workable, but still needs discipline around multi-instance promotion            | Strong OSS posture                    | Better than most OSS low-code options | Good                           | Yes                  | Not a full governance fix by itself          |
| ToolJet                 | Yes       | Yes                   | Strong on paper for environment modeling                                        | Commercial constraints are meaningful | Mixed at company scale without buy-in | Medium-good                    | Yes                  | Licensing and feature gating weaken the case |
| Budibase                | Yes       | Partial               | Less convincing Git and promotion story                                         | Open-core friction                    | Weaker fit                            | Medium                         | Yes                  | Less aligned with Barq's SDLC needs          |
| Custom Next.js platform | Yes       | Best possible         | Best possible if designed correctly                                             | Lowest lock-in on OSS stack           | Best long-term fit                    | Best                           | Initial skeleton yes | Highest upfront investment                   |

### Recommendation

The recommended long-term direction is the custom Next.js platform.

Reasoning:

- Barq's main pain is SDLC governance, not only builder UX.
- A code-first platform best supports shared libraries, shared UI, and shared auth.
- A normal GitLab workflow provides the cleanest promotion model.
- AI can contribute safely inside a standard repository with tests, review, and CI controls.

---

## 9. Product Scope

### 9.1 In Scope for the Platform

- Internal dashboards
- Approval workflows
- Investigation and operations consoles
- Administrative settings panels
- Search, lookup, and case-management screens
- Shared form flows
- Shared table and filtering patterns
- Shared audit and activity views
- Shared notifications and status surfaces
- Shared auth, RBAC, feature flags, and observability foundations

### 9.2 Out of Scope for Phase 1

- Public-facing product surfaces
- A full no-code visual builder
- Real-time workflow design for every edge case
- One-shot migration of the complete Retool estate
- Department-specific one-off tools with unclear business value

---

## 10. Target Platform Requirements

### 10.1 Technical Stack

- Next.js
- React
- TypeScript
- Shared UI package
- Shared auth package integrated with Barq identity systems
- Shared data-access SDK or BFF layer for internal APIs
- TanStack Query for client data fetching
- TanStack Table for data-heavy internal views
- React Hook Form plus Zod for validated forms
- Playwright for critical workflow coverage

### 10.2 Platform Capabilities

- Monorepo-friendly structure for shared packages
- Environment-specific config per deploy target, not hardcoded in app code
- Preview environments for merge requests where appropriate
- Audit logging and structured observability
- Feature flags for controlled rollout
- Reusable layout, navigation, search, filter, and export patterns
- OpenAPI or schema-driven client generation where possible

### 10.3 Delivery Model

- `dev -> uat -> prod` promotion path
- Protected branches with MR-based review
- CI gates for tests, lint, type-checking, and policy validation
- Scheduled audits for environment safety and promotion readiness
- Target-environment-owned secrets and runtime configuration

---

## 11. Functional Requirements

### 11.1 Shared Foundation

- The platform shall provide centralized authentication and session handling.
- The platform shall provide fine-grained RBAC and permission checks on the server.
- The platform shall provide reusable application shell components including navigation, breadcrumbs, tables, forms, drawers, dialogs, and notifications.
- The platform shall provide shared logging, tracing, and audit utilities.
- The platform shall provide shared integration patterns for REST APIs, SQL-backed services, and internal service clients.

### 11.2 Internal App Delivery

- Teams shall be able to create new internal applications using shared platform modules instead of duplicating base infrastructure.
- Teams shall be able to promote code safely across environments without overwriting target-owned configuration.
- Reviewers shall be able to inspect application changes through normal Git diffs and merge requests.
- Platform tooling shall detect blocked promotion content such as hardcoded environment URLs or direct secret leakage.

### 11.3 AI-Assisted Development

- The platform shall support AI-generated code inside normal repositories and review workflows.
- Shared patterns shall be documented clearly enough that AI can extend the platform without inventing parallel conventions.
- Platform modules shall prefer explicit interfaces and reusable abstractions over hidden builder behavior.

---

## 12. Non-Functional Requirements

### 12.1 Security

- Server-side authorization is mandatory for protected actions and pages.
- Secrets must never be committed in source control.
- Audit logs must be retained for privileged operations and critical workflow transitions.
- Environment configuration must be externally managed per target environment.

### 12.2 Reliability

- Platform services must fail safely and predictably.
- Critical workflows must have automated test coverage.
- Production deploys must be traceable to reviewed commits and pipeline runs.

### 12.3 Maintainability

- Shared code should live in stable packages and modules.
- Platform conventions must be documented and enforced through linting or CI where practical.
- Internal apps should avoid one-off patterns when a shared abstraction is available.

### 12.4 Performance

- Data-heavy back-office views must support filtering, pagination, and export without degrading usability.
- The platform should support responsive internal dashboards and operational search workflows.

---

## 13. Migration Strategy

### 13.1 Recommended Delivery Strategy

Use a two-track migration model:

1. Keep Retool for existing legacy and business-critical apps that cannot move immediately.
2. Build all new strategic internal applications on the custom platform.
3. Migrate existing Retool apps selectively based on business value, risk, and complexity.

### 13.2 Migration Prioritization

Prioritize migration in this order:

1. High-value apps with repeated change demand
2. Apps with environment promotion pain
3. Apps with duplicated logic across multiple Retool exports
4. Apps with security or audit sensitivity
5. Simple low-value dashboards last

### 13.3 Early Migration Candidates

Good early candidates include:

- approval-driven operational tools
- dashboards with repeated reuse needs
- settings-heavy internal admin surfaces
- apps with clear shared table, filter, and form patterns

---

## 14. Phased Rollout

### Phase 1: Platform Foundation

- Create monorepo or package strategy
- Establish auth, RBAC, layout, tables, forms, logging, and data-access foundations
- Implement CI/CD with `dev -> uat -> prod`
- Implement environment-safe configuration and promotion rules

### Phase 2: First Production Apps

- Select 1 to 3 high-value internal apps
- Rebuild them on the platform
- Validate developer experience, reviewability, and promotion safety

### Phase 3: Shared Platform Expansion

- Harden reusable components and packages
- Expand audit tooling, testing standards, and observability
- Reduce duplicated logic across internal tools

### Phase 4: Retool Estate Reduction

- Migrate selected Retool apps based on priority
- Retire redundant or low-value apps
- Maintain Retool only where replacement is not yet justified

---

## 15. Success Metrics

### 15.1 Delivery Metrics

- Time to deliver a new internal app from approved scope to production
- Number of new internal apps built on the platform versus Retool
- Reduction in duplicated app logic across teams

### 15.2 Governance Metrics

- Number of promotion failures caused by environment drift
- Number of blocked promotions due to hardcoded env configuration
- Percentage of production changes delivered through reviewed GitLab MRs

### 15.3 Platform Adoption Metrics

- Number of teams using shared platform components
- Number of apps using shared auth, RBAC, and data-access modules
- Number of Retool apps retired or replaced

---

## 16. Risks and Mitigations

| Risk                                                     | Impact                            | Mitigation                                                  |
| -------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| Platform takes longer than expected to mature            | Slower migration                  | Limit phase 1 to shared foundation plus a few real apps     |
| Teams bypass the platform and rebuild custom patterns    | Fragmentation                     | Enforce shared packages, docs, and review standards         |
| Retool replacement scope becomes too broad too early     | Delivery slowdown                 | Use selective migration and keep legacy Retool apps running |
| AI introduces inconsistent patterns                      | Maintainability and security risk | Keep conventions explicit, reviewed, and lint-enforced      |
| Environment handling regresses into app-level hardcoding | Promotion risk                    | Centralize configuration ownership and audit for violations |

---

## 17. Open Questions

- Which internal apps should be selected as the first production migration candidates?
- Should TechHub become the base platform repository, or should Barq create a dedicated internal-platform monorepo?
- Which identity, permissions, and audit modules should be extracted first as shared packages?
- Where is a lightweight visual builder still justified, if anywhere?
- Which Retool capabilities are genuinely required and must be rebuilt versus intentionally dropped?

---

## 18. Final Decision

Barq should build a custom Next.js internal platform as the strategic replacement path for Retool-backed back-office applications.

Retool should remain in place temporarily for legacy continuity, but it should no longer be the default foundation for new strategic internal tools.

The long-term platform standard should be:

- code-first
- GitLab-reviewed
- environment-safe
- reusable
- self-hosted
- AI-assisted

This direction best matches Barq's governance needs, engineering scale, and long-term platform maturity goals.
