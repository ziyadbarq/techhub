# Risk Assessment - CMDB & IT Assets Management (TechHub)

Comprehensive risk view for the Barq TechHub IT Asset Management (ITAM) and CMDB platform. This document captures ownership, design decisions, security controls, operational safeguards, and residual risks for both UAT and Production environments.

## Table of Contents

1. [Overview](#overview)
2. [Application Design](#application-design)
   - [High-Level Architecture](#high-level-architecture)
   - [Low-Level Architecture](#low-level-architecture)
   - [Type of Data](#type-of-data)
   - [Encryption](#encryption)
3. [Access Management &amp; Controls](#access-management--controls)
4. [Logs Management &amp; Controls](#logs-management--controls)
5. [Network Management &amp; Controls](#network-management--controls)
6. [Monitoring &amp; Patching](#monitoring--patching)
7. [Additional Information](#additional-information)

---

## Overview

| Field                          | Details                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Application Name**     | TechHub IT Asset Management & CMDB Platform                                                                    |
| **Application Type**     | Internal Enterprise ITAM/CMDB (Next.js 16 + Node 22)                                                           |
| **Application Category** | In-house developed, planned for on-premises deployment                                                         |
| **Primary Purpose**      | Regulatory-grade asset inventory, CMDB relationship mapping, lifecycle automation, and audit evidence for SAMA |
| **Business Owners**      | Waleed Alhasson · Abdullah Alzuwayed · Moath Almansour                                                       |
| **Technical Owner**      | Abdullah Alzuwayed (Technology Division)                                                                       |
| **Environments**         | Development only (UAT and Production planned for Q1 2026)                                                      |
| **Deployment Status**    | Active development — not yet deployed to production infrastructure                                            |
| **Created On**           | 03 Dec 2025                                                                                                    |
| **Last Review**          | 04 Dec 2025                                                                                                    |

---

## Application Design

### High-Level Architecture

- **Presentation Layer:** Next.js 16 (App Router, Server Components) running in development mode or PM2-managed Node process for future production deployment.
- **Interface & Use Cases:** InversifyJS 7-powered Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure).
- **Data Layer:** Prisma 7 ORM targeting PostgreSQL 15+; Redis provides caching, rate limiting, and BullMQ queues.
- **Integrations:** Microsoft Graph (Intune + Email), Azure AD (Better Auth SSO), HR feed, ERP/Procurement APIs, and automated OCI/GCP discovery jobs (planned).
- **Current Deployment:** Development server on Oracle Linux 8.10 with PostgreSQL and Redis (no Docker).
- **Planned Deployment:** Dual-node topology (app server + worker) per environment with immutable artifacts built via `npm run build` and deployed by PM2 scripts.

### Low-Level Architecture

- **Frontend assets** compiled via Turbopack; static assets served from `public/` with cache-busting.
- **Server Runtime:** Node.js 22 LTS with TypeScript 5.9, strict type checking, and centralized DI container (3-tier modular system: CORE, DASHBOARD, HEAVY).
- **Background Jobs:** BullMQ queues for Intune sync, verification campaigns, discovery ingestion, and email dispatch (worker process architecture ready).
- **Configuration:** Environment variables in `.env.local` for development; production will use managed secrets injected via PM2 `ecosystem.config.cjs`.
- **Observability:** Structured logging via Winston + AsyncLocalStorage with request context tracking; DI-injected `ILoggerService` with automatic sensitive data redaction.

### Type of Data

- **Identity:** Employees (HR feed), Azure AD identities, authentication metadata, session context.
- **Asset Inventory:** Devices, stock movements, kits, reservations, lifecycle events, disposal certificates.
- **CMDB Entities:** Services, CIs, infrastructure components, integrations, Intune compliance snapshots, discovery telemetry.
- **Financial & Vendor Data:** Purchase orders, contracts, license assignments, multi-currency valuations.
- **Operational Logs:** Immutable audit history of actions, permission grants, feature flag toggles.
- **Attachments:** Certificates, invoices, statements of work (stored via encrypted object storage).

### Encryption

**Current Implementation (Development):**

- **In Transit:** Development server uses HTTP (internal network); production will enforce TLS 1.3.
- **At Rest:**
  - PostgreSQL and Redis data directories protected by Linux filesystem permissions.
  - Attachment uploads validated via MIME whitelist, extension whitelist, and magic number detection (see `attachment.entity.ts`).
- **Secrets:** Stored in `.env.local` for development; excluded from Git via `.gitignore`.

---

## Access Management & Controls

### Active Directory / SSO Integration

**Current Implementation:**

- **Provider:** Azure AD / Microsoft Entra ID via Better Auth (OIDC) - configured and functional.
- **Authentication Model:** **SSO-only** — username/password login and self-registration completely disabled in production.
- **Capabilities:** Single sign-on with attribute sync (display name, department, email).
- **Security Control:** Just-in-time provisioning disabled — login requires pre-existing Person record plus role assignment (prevents unauthorized access).

### Multi-Factor Authentication

**Current State:**

- MFA enforcement depends on Azure AD tenant configuration (controlled by IT Security team).
- Platform itself delegates authentication to Azure AD — inherits organizational MFA policies.

### Privileged Access Matrix

**Platform implements 269 granular permissions across 14 permission groups.** Role assignments currently managed manually via database during development; production will integrate with Azure AD security groups.

| Role                             | Purpose                                                           | Implementation Status                                          | Production Plan                                           |
| -------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| **System Administrator**   | Full platform configuration, feature flags, deployment approvals  | Implemented via RBAC (system-administrator role seeded)        | Map to Azure AD security group with CAB approval workflow |
| **Security Administrator** | Audit exports, disposal certificate review, compliance dashboards | Implemented via RBAC (security-administrator role seeded)      | InfoSec approval + read-only finance access               |
| **Platform Operator**      | Queue monitoring, Intune sync, job retries                        | Permission structure defined (operations-manager role seeded)  | TechOps manager approval, no schema modification rights   |
| **Database Administrator** | PostgreSQL/Redis maintenance, schema migrations                   | Outside platform scope (native DB access)                      | Separate bastion access with SSH certificates             |
| **Department Manager**     | View departmental assets, approve verifications                   | Implemented via RBAC (department-manager role + row-level sec) | Department head assignment via HR sync                    |
| **Viewer**                 | Read-only access to assigned modules                              | Implemented via RBAC (viewer role seeded)                      | Default role for general staff                            |

---

## Security Controls & Implementation

### Executive Summary

The platform demonstrates production-grade security fundamentals with comprehensive authentication, authorization, and data protection. System is ready for on-premises internal deployment with military-grade encryption (AES-256-GCM), comprehensive audit logging, 269-permission RBAC, and robust input validation across 60+ DTO files.

### Cryptographic Controls

**OAuth Token Encryption** ([src/lib/auth/encryption.ts](../src/lib/auth/encryption.ts))

- AES-256-GCM with authentication tags for tamper detection
- PBKDF2 key derivation (100,000 iterations, SHA-512)
- Random IV and salt per encryption (prevents pattern analysis)
- Automatic encryption/decryption via Prisma middleware

**SSO-Only Authentication (Production Configuration)**

- **Exclusive Microsoft Azure AD SSO** - username/password login completely disabled in production
- No local credentials stored in database
- No password reset flows or self-registration endpoints
- All authentication delegated to Azure AD with organizational MFA policies
- Session tokens encrypted and stored securely via Better Auth

**Sensitive Data Redaction** ([src/infrastructure/services/logger/pino-logger.service.ts:79-93](../src/infrastructure/services/logger/pino-logger.service.ts#L79-L93))

- Automatic filtering of passwords, API keys, secrets, tokens from logs
- Nested field support (`*.password`, `*.apiKey`, `*.token`)
- Complete removal (not masking) prevents accidental exposure

### Access Control & Validation

**Comprehensive Audit Logging** ([src/infrastructure/repositories/prisma-audit-log.repository.ts](../src/infrastructure/repositories/prisma-audit-log.repository.ts))

- Who, what, when, where tracking for all critical operations
- Before/after state capture in JSON for forensic analysis
- IP address and User-Agent logging for security investigations
- Database-indexed for fast compliance queries

**Path Traversal Protection** ([src/infrastructure/services/local-file-storage.service.ts:254-297](../src/infrastructure/services/local-file-storage.service.ts#L254-L297))

- Multi-layer validation blocking `../`, null bytes, control characters
- Path normalization and bounds checking
- No user-controlled directory paths in file operations

**Input Validation** ([src/interface-adapters/dtos/](../src/interface-adapters/dtos/))

- 4,810+ lines of Zod validation across 60+ DTO files
- Comprehensive checks: format, length, type, business rules
- Centralized validation helpers for currency, dates, emails
- CSV import sanitization (BOM removal, invisible chars, smart quotes)

**SSO-Only Access Control** ([src/infrastructure/services/auth/better-auth.ts:88-152](../src/infrastructure/services/auth/better-auth.ts#L88-L152))

- **Exclusive authentication method**: Microsoft Azure AD OAuth - all other login methods disabled
- Requires pre-existing active Person record (prevents unauthorized access)
- Blocks unknown Microsoft accounts from system access
- Automatic cleanup of unauthorized login attempts
- Audit logging of all authentication attempts (successful and blocked)
- No username/password, no self-registration, no password recovery flows

### Defense in Depth (4-Layer Security Model)

1. **Proxy Layer** ([proxy.ts:35-47](../proxy.ts#L35-L47)) - Cookie-based authentication check
2. **Dashboard Template** ([src/app/(dashboard)/template.tsx:14-23](../src/app/(dashboard)/template.tsx#L14-L23)) - Server-side session validation
3. **Page-Level Guards** ([src/app/(dashboard)/assets/page.tsx:14-23](../src/app/(dashboard)/assets/page.tsx#L14-L23)) - Permission checks (66 of 92 protected pages)
4. **Controller Actions** ([src/interface-adapters/controllers/asset.controller.ts:223](../src/interface-adapters/controllers/asset.controller.ts#L223)) - Final enforcement at business logic layer

### SQL Injection Prevention

- **Prisma ORM**: Parameterized queries throughout entire codebase
- **Raw Query Analysis**: 19 instances of `$queryRaw` - all properly parameterized using tagged templates
- **Zero String Concatenation**: No SQL string concatenation with user input detected
- **Type Safety**: TypeScript 5.9 strict mode prevents query construction errors

### Rate Limiting

**Better Auth Integration** ([src/infrastructure/services/auth/better-auth.ts:656-685](../src/infrastructure/services/auth/better-auth.ts#L656-L685))

- `/get-session`: 2000/minute (high limit for internal SSR needs)
- OAuth callback endpoints: Standard rate limiting applied
- **Note**: Password-based endpoints (`/sign-in`, `/sign-up`, `/reset-password`) disabled in production (SSO-only)

### OWASP Top 10 (2021) Compliance

| Vulnerability                              | Status        | Current Mitigation                                                     |
| ------------------------------------------ | ------------- | ---------------------------------------------------------------------- |
| **A01: Broken Access Control**       | ✅ Mitigated  | 269-permission RBAC + Feature Flags + 4-layer defense in depth         |
| **A02: Cryptographic Failures**      | ✅ Mitigated  | AES-256-GCM token encryption, TLS in production, no local passwords    |
| **A03: Injection**                   | ✅ Mitigated  | Prisma parameterized queries + 4,810 lines Zod validation              |
| **A04: Insecure Design**             | ✅ Mitigated  | Defense in depth, security by default, Clean Architecture              |
| **A05: Security Misconfiguration**   | ⚠️ Partial  | Production requires explicit security headers (planned)                |
| **A06: Vulnerable Components**       | ✅ Mitigated  | Minimal dependencies, automated `npm audit`, no known CVEs           |
| **A07: Authentication Failures**     | ✅ Mitigated  | SSO-only (Azure AD) + pre-authorized accounts + MFA (production)       |
| **A08: Data Integrity Failures**     | ✅ Mitigated  | Immutable audit logs, encrypted tokens, database transaction integrity |
| **A09: Logging Failures**            | ✅ Mitigated  | Structured logging with request context, sensitive data redaction      |
| **A10: Server-Side Request Forgery** | N/A (No Risk) | No outbound HTTP requests constructed from user input                  |

### Security Recommendations for Production

**Critical (Pre-Launch):**

- Implement explicit security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Enable TLS 1.3 at reverse proxy with strong cipher suites
- Configure Azure AD Conditional Access requiring MFA and managed devices
- Enable PostgreSQL SSL mode for encrypted database connections

**High Priority (Post-Launch):**

- Implement application-level rate limiting for business actions (e.g., asset creation, bulk imports)
- Add Web Application Firewall (WAF) at reverse proxy tier
- Enable real-time alerting for failed authentication patterns
- Implement secrets rotation schedule (quarterly for service accounts, annually for encryption keys)

**Medium Priority (Ongoing):**

- Automated dependency vulnerability scanning in CI/CD pipeline
- Regular penetration testing (annually or after major releases)
- Security awareness training for platform administrators
- Backup encryption verification and disaster recovery testing

---

## Logs Management & Controls

### Current Implementation

**Application Logging:**

- **Framework:** Winston with structured logging and AsyncLocalStorage for request context.
- **Usage Pattern:** DI-injected `ILoggerService` (NEVER `console.log`) — enforced via ESLint.
- **Automatic Context:** Request ID, user ID, path included in all log entries.
- **Sensitive Data Redaction:** Automatic filtering of passwords, tokens, API keys.
- **Use Case Decorator:** `@LogExecution('operation.name')` for automatic execution tracking.

**Log Types Currently Generated:**

- **Application:** HTTP requests, controller actions, use case executions, background job results.
- **Security:** Authentication attempts (via Better Auth), permission checks, feature flag evaluations.
- **Database:** Prisma queries at `warn` and `error` levels (configurable via `PRISMA_VERBOSE_LOGS=true`).
- **Infrastructure:** Development server lifecycle, database connection pool metrics.

**Audit Trail (Database):**

- `ActivityLog` entity tracks all asset lifecycle events, permission grants, verification responses.
- Immutable records with timestamp, user, action type, and entity references.
- Currently retained indefinitely; production will implement 24-month retention policy.

### Planned Production Logging Infrastructure

**Log Aggregation Pipeline:**

- Fluent Bit agents collecting from application logs, PM2 process logs, PostgreSQL audit logs.
- Central Kafka topic (`techhub-logs`) feeding Elastic Stack (ELK).
- S3 archival for compliance retention (30-day hot, 12-month warm, 24-month cold storage).

**Security Monitoring:**

- PostgreSQL `pgaudit` extension for DDL/DML auditing per role.
- SIEM integration with automated alerting for anomalous patterns.
- Tamper-evident log hashing (SHA-256 with HMAC key rotation every 90 days).

**Access & Retention:**

- Read-only API access for Security team and compliance auditors.
- Least-privilege IAM policies; log deletion requires dual approval.
- 24-month retention for regulatory compliance (SAMA requirements).

---

## Network Management & Controls

### Current Development Environment

**Infrastructure:**

- Oracle Linux Server 8.10 running Next.js dev server, PostgreSQL, and Redis.
- Network: 10.100.12.108/24 on dev.baraq.com.internal domain.
- Internal access only; no public internet exposure.
- PostgreSQL on default port 5432, Redis on default port 6379.

**External Integrations (Development):**

- Microsoft Graph API (Intune + Email) - using development/sandbox tenant credentials.
- Azure AD for SSO authentication - configured with dev app registration.
- Outbound HTTPS to npm registry, GitHub, cloud provider APIs for testing.

### Planned Production Network Architecture

**Deployment Topology:**

- **Application Tier:** Dual-node web servers (`techhub-app-01`, `techhub-app-02`) behind layer-7 load balancer.
- **Worker Tier:** Dedicated background job processor (`techhub-worker-01`) for BullMQ queues.
- **Data Tier:** PostgreSQL HA cluster (primary + synchronous replica), Redis cluster with persistence.
- **Network Segmentation:** Application, worker, and data tiers in separate VLANs with firewall rules.

**Security Controls (Planned):**

- No public internet ingress; internal access only via corporate network or VPN.
- Outbound egress restricted to: Microsoft Graph API, OCI/GCP APIs, software repositories (npm, GitHub).
- TLS 1.3 for all external communication; mTLS for internal service-to-service.
- Bastion host with jump access for emergency administration (time-bound, logged).

**Production Network Flow (Planned):**

```
User Workstation → Corporate Network → Reverse Proxy (TLS termination) → App Server → PostgreSQL/Redis
                                                                         ↓
                                                Worker Node → External APIs (Microsoft Graph, OCI, GCP)
```

### Infrastructure Asset Inventory (Planned)

**UAT Environment:**

| Asset          | Hostname                         | IP Address | Ports     | Notes             |
| -------------- | -------------------------------- | ---------- | --------- | ----------------- |
| Web/API Server | `techhub-app-uat.barq.corp`    |            | 443, 3000 | PM2 `barq-web`  |
| Worker         | `techhub-worker-uat.barq.corp` |            | 9229      | BullMQ, cron jobs |
| PostgreSQL     | `techhub-db-uat.barq.corp`     |            | 5432      | Primary DB node   |
| Redis          | `techhub-redis-uat.barq.corp`  |            | 6379      | Cache + queue     |

**Production Environment:**

| Asset          | Hostname                             | IP Address | Ports      | Notes                |
| -------------- | ------------------------------------ | ---------- | ---------- | -------------------- |
| Web/API Server | `techhub-app-prod-01.barq.corp`    |            | 443, 3000  | Active-active ready  |
| Web/API Server | `techhub-app-prod-02.barq.corp`    |            | 443, 3000  | Load balanced pair   |
| Worker         | `techhub-worker-prod-01.barq.corp` |            | 9229       | Queue + discovery    |
| PostgreSQL     | `techhub-db-prod-01.barq.corp`     |            | 5432       | HA primary           |
| PostgreSQL     | `techhub-db-prod-02.barq.corp`     |            | 5432       | HA sync replica      |
| Redis          | `techhub-redis-prod.barq.corp`     |            | 6380 (TLS) | Requires client cert |

*Note: IP addresses to be assigned during infrastructure provisioning.*

### Network Access Matrix (UAT - Planned)

| Source                 | Destination           | Protocol(s)  | Port(s) | Purpose           |
| ---------------------- | --------------------- | ------------ | ------- | ----------------- |
| Developer VPN          | `techhub-app-uat`   | HTTPS        | 443     | QA access         |
| `techhub-app-uat`    | `techhub-db-uat`    | TLS over TCP | 5432    | Prisma traffic    |
| `techhub-app-uat`    | `techhub-redis-uat` | TCP          | 6379    | Cache + BullMQ    |
| `techhub-worker-uat` | Microsoft Graph       | HTTPS        | 443     | Intune sync, mail |
| `techhub-worker-uat` | `techhub-db-uat`    | TLS over TCP | 5432    | Queue persistence |
| `techhub-worker-uat` | OCI / GCP APIs        | HTTPS        | 443     | Discovery testing |

### Network Access Matrix (Production - Planned)

| Source                     | Destination                | Protocol(s)           | Port(s) | Purpose                    |
| -------------------------- | -------------------------- | --------------------- | ------- | -------------------------- |
| Reverse Proxy Tier         | `techhub-app-prod-01/02` | HTTPS                 | 443     | User traffic               |
| `techhub-app-prod-01/02` | `techhub-db-prod-01`     | TLS over TCP          | 5432    | Primary DB                 |
| `techhub-app-prod-01/02` | `techhub-redis-prod`     | TLS over TCP          | 6380    | Cache + job queue          |
| `techhub-worker-prod-01` | `techhub-db-prod-01`     | TLS over TCP          | 5432    | Background jobs            |
| `techhub-worker-prod-01` | OCI / GCP APIs             | HTTPS                 | 443     | Discovery + telemetry      |
| `techhub-worker-prod-01` | Microsoft Graph            | HTTPS                 | 443     | Intune sync, email         |
| SOC Jump Host              | `techhub-app-prod-01`    | SSH (through bastion) | 22      | Break-glass (Just-in-time) |
| Monitoring System          | All production nodes       | HTTPS                 | 9090+   | Metrics collection         |

*All assets will reside in segmented VLANs behind layer-7 firewalls. No public ingress; internet egress limited to Microsoft Graph, OCI/GCP APIs, and managed software repositories.*

### Separation of Duties (Planned)

| Function               | Technology               | Responsible Team       | Secondary Reviewer   |
| ---------------------- | ------------------------ | ---------------------- | -------------------- |
| Application Deployment | PM2 + deployment scripts | Technology Division    | Platform Owner       |
| Schema Migrations      | Prisma Migrate           | Platform Owner + DBA   | Security Engineering |
| Integration Jobs       | BullMQ worker            | Platform Owner         | Security Engineering |
| Access Provisioning    | Azure AD + TechHub RBAC  | Identity & Access Mgmt | Internal Audit       |
| Production DB Access   | PostgreSQL native auth   | DBA Team               | Platform Owner       |
| Security Monitoring    | Application logs + audit | Security Operations    | Compliance           |

---

## Monitoring & Patching

### Current Development Monitoring

**Application Monitoring:**

- Development server console logs showing requests, errors, and structured log output.
- Browser DevTools for client-side debugging and network inspection.
- Prisma query logging via `PRISMA_VERBOSE_LOGS=true` for database performance analysis.

**Database Monitoring:**

- PostgreSQL logs accessible via systemd journal (journalctl).
- Manual query analysis using `EXPLAIN ANALYZE` for optimization.
- Connection pool metrics logged by Prisma Client.

**Code Quality & Testing:**

- Pre-commit hooks running TypeScript type-checking, ESLint, and automated tests.
- `npm run validate` combines type-checking + linting + testing for comprehensive validation.
- Git-based change tracking with commit history and branch management.

### Planned Production Monitoring

**Infrastructure Monitoring:**

- PostgreSQL `pg_stat_monitor` extension for query performance and anomaly detection.
- Redis monitoring via redis-cli INFO and custom metrics collection.
- PM2 process monitoring with automatic restarts and resource usage tracking.
- Health check endpoints for load balancer integration.

**Application Performance:**

- BullMQ queue metrics (job completion rates, failures, processing times).
- Daily reconciliation jobs detecting drift between source systems and CMDB.
- Automated alerting for failed background jobs or integration sync errors.

**Security Monitoring:**

- Automated exports summarizing privileged database queries and failed access attempts.
- Real-time alerts for suspicious authentication patterns or permission escalation attempts.
- Integration with SOC SIEM for centralized security event correlation.

### Configuration Management

**Current Configuration Files (Version Controlled):**

- `next.config.ts` - Next.js build and runtime configuration
- `tsconfig.json` - TypeScript compiler options
- `proxy.ts` - Application routing and middleware logic
- `ecosystem.config.cjs` - PM2 process management (ready for production)
- `scripts/deploy/*.sh` - Deployment automation scripts
- `.env.example` - Environment variable template (secrets excluded from Git)

**Security Controls:**

- All configuration tracked in Git with mandatory code review.
- Secrets stored in `.env.local` (development) and excluded via `.gitignore`.
- Production secrets will be injected at deployment time only (never committed).

### Security Patch Management

**Current Process (Development):**

1. **Dependency Updates:** Regular `npm outdated` checks for available updates.
2. **Security Advisories:** `npm audit` for known vulnerabilities in dependencies.
3. **Testing:** Update dependencies, run `npm run validate`, verify functionality.
4. **Version Control:** Commit updates with changelog documentation.

**Planned Production Process:**

1. **Advisory Intake:** Weekly review of Node.js, Prisma, Next.js, PostgreSQL, Redis security bulletins.
2. **Impact Assessment:** Classify as Critical/High/Medium; critical patches applied within 72 hours.
3. **UAT Testing:** Deploy to UAT environment, run validation suite, verify integrations.
4. **Change Approval:** CAB approval with evidence (test results, risk assessment).
5. **Production Deployment:** Execute `production-deploy.sh` (build → migrate → seed check → PM2 restart).
6. **Post-Deployment:** Monitor for 48 hours, document outcomes in change register.

---

## Additional Information

### Current Development Status (December 2025)

**Completed Implementation:**

- **10 modules** fully functional: ITAM, CMDB, Service Management, License Management, Intune Integration, Verification Campaigns, etc.
- **35+ entity types** across Foundation, Asset & Inventory, and CMDB domains.
- **269 granular permissions** across 14 permission groups with role-based access control.
- **5-layer Clean Architecture** with modular dependency injection (CORE, DASHBOARD, HEAVY).
- **Automated discovery** architecture ready; OCI/GCP integration planned for Q1 2026.
- **Better Auth SSO** with Azure AD integration operational.
- **Multi-currency support** (SAR base + 8 currencies) with dual-display formatting.
- **Universal data importer** with auto-entity creation and prefixed column mapping.

**Platform Roadmap:**

- **Q1-Q2 2026:** Change management system, TechHub centralized visibility, multi-step approval workflows.
- **Q3-Q4 2026:** Built-in ITSM module, unified task management hub, advanced analytics.
- **2027:** RAG AI assistant for context-aware guidance and predictive maintenance.

### Risk Assessment

**Current Risks (Development Phase):**

- **Single-user development:** No redundancy or backup developer; mitigated by comprehensive documentation and modular architecture.
- **Local infrastructure:** Development database and Redis on single machine; mitigated by regular backups and version control.
- **Integration dependencies:** Reliance on external APIs (Microsoft Graph, cloud providers); mitigated by cached data and graceful degradation.

**Production Residual Risks (Planned Mitigations):**

- **Microsoft Graph API dependency:** Intune sync requires Graph API availability; mitigated by cached compliance snapshots and manual CSV import fallback.
- **Cloud provider API availability:** Automated discovery depends on OCI/GCP API uptime; mitigated by scheduled retries and drift detection alerts.
- **Single application codebase:** All features in monolithic Next.js app; mitigated by modular DI architecture allowing gradual service extraction if needed.
- **On-premises infrastructure:** Dependency on internal network and hardware; mitigated by HA database cluster, load-balanced app servers, and documented recovery procedures.

### Regulatory Alignment

**SAMA Cybersecurity Framework:**

- **Asset Management:** Complete asset lifecycle tracking with ownership accountability and disposal certificates.
- **Access Control:** 269-permission RBAC system with Azure AD integration and MFA enforcement (in production).
- **Audit & Compliance:** Immutable audit trails, verification campaigns, exportable compliance reports.
- **Change Management:** Documented deployment procedures, schema migration controls, and approval workflows (expanding in 2026).
- **Operations Security:** Structured logging, encryption standards, separation of duties, and incident response readiness.

**Data Sovereignty:** Platform designed for on-premises deployment ensuring all sensitive ITAM/CMDB data remains within Barq's controlled infrastructure.

### Technology Stack Details

**Frontend:** Next.js 16 (React 19.2) with TypeScript 5.9, shadcn/ui, TanStack Table, Recharts
**Backend:** Node.js 22 LTS, Prisma 7, InversifyJS 7, Zod 4, Better Auth
**Database:** PostgreSQL 15+ (planned HA cluster), Redis 7+ (caching + BullMQ)
**Infrastructure:** PM2 process management, Oracle Linux 8.10 development server, planned production deployment
**Integrations:** Microsoft Graph, Azure AD, HR feeds, ERP/Procurement APIs, OCI/GCP SDKs

---
