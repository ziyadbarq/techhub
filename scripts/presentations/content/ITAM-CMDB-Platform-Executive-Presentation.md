**Executive-Grade Presentation** for PowerPoint, Google Slides, or Slidev

Designed for _C-level and board impact_: strategic outcomes, regulatory compliance, business value, and zero technical jargon.

Today is 04 Dec, 2025.

---

# **Barq ITAM & CMDB Platform — Executive Presentation**

---

## **Presentation Guide**

- **Duration:** 25-30 min presentation + 10-15 min Q&A
- **Story arc:** Problem → Vision → Platform → Proof → Ask
- **Use:** Open with Slides 1-2, flow through 3-15, reserve appendices for Q&A
- **Key message:** Barq runs a single, self-owned ITAM/CMDB platform that eliminates compliance risk and returns ~2.35-2.85M SAR per year through cost avoidance and operational savings.

---

## **Slide 1 — Title**

# **Enterprise ITAM & CMDB Platform**

### Regulatory-Grade Asset Intelligence for Saudi Arabia's Leading Fintech

**Presented by:** Technology Division, Barq
**Governed by:** SAMA (Saudi Central Bank)

---

## **Slide 2 — Executive Summary**

# **Why This Matters**

- **Regulatory pressure:** SAMA demands 100% asset accountability; siloed trackers created blind spots and recurring audit pain.
- **Our response:** Unified ITAM & CMDB platform built in-house, deployed on-premises, and integrated with HR, Intune, Azure AD, ERP, and procurement systems.
- **Value delivered:** Avoids 1.5-2M SAR/year in vendor licensing plus ~850K SAR/year in operational efficiency — total ~2.35-2.85M SAR annually with zero vendor lock-in and a lifetime license for unlimited users.

---

## **Slide 3 — The Challenge Before**

# **Fragmented Operations Were Costly**

- **Several departments** maintained separate spreadsheets with mismatched ownership data
- **weeks** of manual effort were needed for every SAMA audit readiness cycle.
- Unknown “ghost devices” lingered after employee departures.
- License over-allocation, contract renewal misses, and onboarding/offboarding delays inflated cost and risk.

---

## **Slide 4 — Our Vision**

# **One Source of Truth for All Technology Assets**

**A centralized, automated, always-accurate platform that:**

- Eliminates spreadsheet chaos and departmental silos.
- Integrates HR, Intune, Azure AD, ERP, procurement, and discovery sources.
- Powers smart decisions across IT, Security, Finance, and Operations.
- Provides SAMA-ready audit trails and compliance evidence.
- Scales with Barq's growth as a leading fintech innovator.

**"If it's technology, it's tracked. If it's tracked, it's optimized."**

---

## **Slide 5 — The Platform**

# **What We Built: Enterprise-Grade ITAM & CMDB**

**10 integrated modules and 35+ entity types anchored by a clean architecture.**

### **Foundation Layer**

- People, Departments, Locations, Vendors, Tags, Custom Fields, Attachments.

### **Asset & Inventory Management**

- Lifecycle automation: Stock → Kits → Reservations → Assignment → Maintenance → Disposal.

### **CMDB, Service & Compliance**

- Service catalog with dependency mapping, Intune integration, impact analysis, license & contract management, and immutable audit trails.

---

## **Slide 6 — Architecture & Integration**

# **Enterprise-Grade Foundation**

```
External Systems        TechHub Platform Core                 Output
─────────────────       ───────────────────────────────       ──────────────
HR           ───┐                                             ┌──▶ ERP / Finance
Azure AD / SSO ─┤    • ITAM & Asset Management                │
Intune / MDM ───┼──▶ • CMDB & Service Catalog ────────────────┼──▶ Audit Reports
Procurement ────┤    • Change & ITSM Roadmap                  │
Vendors ────────┤    • Unified Task Hub (2026)                └──▶ Analytics & BI
```

- Built on Next.js 16 (React 19), TypeScript 5.9, Prisma 7 (PostgreSQL), Redis, and a 5-layer clean architecture with modular dependency injection.
- Zero external SaaS dependencies — complete data sovereignty and on-prem control.

---

## **Slide 7 — Operational Intelligence**

# **Every Asset and Service in Context**

- Asset 360° view: ownership history (HR + Azure AD), Intune compliance, warranty/PO metadata, lifecycle state, and related kits/reservations/disposal records.
- Relationship mapping: Service → CI → Infrastructure → Integrations lineage for change impact and incident response.
- Automated discovery feeds OCI, GCP, and network data directly into the CMDB with drift detection and reconciliation.

---

## **Slide 8 — Connected Ecosystem**

# **Deep Integrations Across the Organization**

### **Identity & Authentication**

- Azure AD / Microsoft Entra ID via Better Auth with 269 granular permissions.

### **Device & Compliance**

- Microsoft Intune inventory, compliance history, encryption status, and patch posture.
- Zero-touch cloud/network discovery (OCI, GCP, switches, routers) with multi-cloud readiness.

### **Business Systems**

- HR lifecycle feeds, ERP/procurement purchase orders and contracts, custom Excel/CSV imports.

### **TechHub Roadmap Integrations**

- Built-in change management (Q1-Q2 2026), unified task hub and ITSM (Q3-Q4 2026), SOC/SIEM feeds and automation toolchains thereafter.

---

## **Slide 9 — Governance & Compliance**

# **SAMA-Ready Controls**

### **Ownership & Accountability**

- IT Operations: platform administration and lifecycle enforcement.
- Information Security: compliance monitoring and audit support.
- Procurement & Finance: contract governance and cost control.
- Department Heads: custody attestation and usage accountability.

### **Automated Controls**

- Immutable audit logs, HR↔Azure AD↔Intune reconciliation, verification campaigns, renewal alerts, and role-based approvals.

### **Regulatory Alignment**

- SAMA cybersecurity framework readiness with evidence for asset accountability, change management, and disposal governance.

---

## **Slide 10 — Business Benefits**

# **What Leaders Gain**

### **Financial**

- Reduced license waste, linked PO-to-asset visibility, automated renewal alerts, and leverage in vendor negotiations.

### **Operational**

- Zero-touch discovery, accurate onboarding/offboarding kits, dashboards with compliance signals, and exportable audit packs.

### **Security & Compliance**

- Verified asset ownership, dependency-aware incident response, and immutable audit trails with disposal certificates.

---

## **Slide 11 — Proof of Impact**

# **Platform Delivered & Operational**

### **Implementation Scope**

- 10 modules live, 35+ entity types, 269 permissions, clean architecture with modular DI.

### **Operational Metrics**

- 4,200+ assets tracked with complete lifecycle visibility.
- 100% coverage for Intune-managed devices; automated OCI/GCP/network discovery.
- Device-to-user correlation accuracy at 98%+.
- Onboarding kit preparation reduced from days to minutes; audit prep from months to days.

### **Business Impact**

- ~500K SAR/year license waste eliminated.
- Six departmental trackers consolidated.
- 22 critical services modeled with full dependency graphs.
- Ghost devices eliminated through verification campaigns.

---

## **Slide 12 — Visual Evidence**

# **Platform in Action**

Replace this slide with current screenshots:

- Executive dashboard (asset distribution, compliance risks, renewals, asset value).
- Asset 360° record with Intune trend, warranty, PO, and dependency graph.
- CMDB service map with impact simulation.
- Automated discovery dashboard showing OCI/GCP coverage and drift alerts.
- Active verification campaign tracker.

---

## **Slide 13 — Strategic Roadmap**

# **From ITAM to Enterprise Intelligence**

### **Q1-Q2 2026**

- Change Management System (BRD → deployment) with TechHub visibility and multi-step approvals.
- Mobile access for verification, approvals, and task management.

### **Q3-Q4 2026**

- Enterprise Task Hub aggregating TechHub, Jira, CRM, renewals, and compliance tasks.
- Built-in ITSM module with full CMDB context and predictive analytics powered by Intune telemetry.

### **2027 Vision**

- RAG AI assistant over Barq's knowledge base, intelligent automation for approvals, predictive maintenance, and enterprise-wide intelligence dashboards.

---

## **Slide 14 — Leadership Support Needed**

# **Critical Success Factors**

1. **Executive mandate:** Enforce asset attestation, disposal sign-offs, and platform adoption as the single source of truth.
2. **Resource allocation:** Dedicated development capacity, integration budget, departmental stewards (2-4 hrs/month), and formal training.
3. **Process authority:** Govern procurement, change management, and contract tracking through the platform.
4. **Strategic investment:** Fund TechHub roadmap, AI infrastructure, external connectors, and capacity for enterprise-wide task orchestration.

---

## **Slide 15 — Return on Investment**

# **Value Delivered: ~2.35-2.85M SAR/Year**

### **Platform Cost Avoidance**

- 1.5-2M SAR/year saved vs. ServiceNow-class ITAM+CMDB+ITSM licensing.
- 500K-1M SAR one-time implementation/consulting cost avoidance.
- Lifetime license with unlimited seats and zero vendor lock-in.

### **Operational Savings**

- ~500K SAR/year from license optimization.
- ~200K SAR/year from faster audits and reconciliations.
- ~150K SAR/year from eliminating ghost-device security exposure.

### **Efficiency & Risk**

- 85% faster onboarding kit prep, 90% faster audit prep, 100% elimination of duplicate trackers, and a fully automated infrastructure inventory.

---

## **Slide 16 — Closing**

# **From Fragmentation to Intelligence**

Barq now runs a single, compliant, data-sovereign ITAM & CMDB platform that turns asset management into operational intelligence. The platform removes blind spots, accelerates decisions, and keeps the organization SAMA-ready while creating a durable financial advantage. Built by Barq, for Barq — ready for questions.

---

# **APPENDIX SLIDES** _(Use for Q&A / Technical Deep-Dive)_

---

## **Appendix A — Technical Architecture**

# **Platform Stack Overview**

### **Frontend**

- Next.js 16 (App Router, Server Components, Turbopack), React 19, TypeScript 5.9, shadcn/ui, TanStack Table, Recharts.

### **Backend**

- 5-layer clean architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure).
- InversifyJS 7 DI across CORE, DASHBOARD, HEAVY modules.
- Prisma 7 with PostgreSQL 15+ and Redis for caching/session management.

### **Security & Compliance**

- 269 permissions, feature flags, file upload validation, immutable audit logs, encrypted attachment storage.

### **DevOps**

- PM2-managed deployment, automated Prisma migrations, on-prem databases (no Docker), structured logging.

---

## **Appendix B — Data Model Overview**

# **Entity Relationship Snapshot**

- **Foundation (12):** People, Users, Departments, Locations, Vendors, Tags, Custom Fields, Field Definitions, Attachments, Files, Notes, Activity Logs.
- **Assets & Inventory (9):** Assets, Asset Categories, Asset Models, Stock Items, Stock Movements, Kits, Kit Items, Reservations, Asset Disposal Records.
- **CMDB & Services (14):** Services, Service Dependencies, Configuration Items, CI Relationships, Infrastructure Components, Integrations, Intune Devices, Intune Compliance Snapshots, Licenses, License Assignments, Contracts, Purchase Orders, Verification Campaigns, Verification Responses.

---

## **Appendix C — Automated Asset Discovery**

# **Infrastructure-Wide Continuous Intelligence**

- **Scope:** OCI and GCP primary coverage with extensibility to Azure/AWS; includes compute, containers, databases, storage, and office network devices (switches, routers, APs).
- **Mechanisms:** Native cloud APIs/SDKs, SNMP for network devices, optional lightweight agents, and webhook-driven change detection.
- **Cadence:** Continuous sync (default 6-hour interval) with drift alerts and auto-reconciliation using identifiers (MAC, serial, instance ID).
- **Business impact:** 100% cloud visibility, cost optimization insight, drift compliance, and self-healing CMDB accuracy.

---

## **Appendix D — Integration Patterns**

# **How Systems Connect**

- **Intune:** Daily automated sync for inventory, compliance, OS version, encryption, and history; data correlated to assets via serial/asset tag.
- **HR System:** Lifecycle-driven updates to Person records, automatic assignment/offboarding triggers, and audit trails.
- **Azure AD / SSO:** Better Auth integration with pre-existing Person requirement and internal role management.
- **ERP / Procurement:** Purchase orders linked to assets/contracts/vendors with multi-currency support and future depreciation tracking.

---

## **Appendix E — Presenter Notes & FAQs**

# **Key Emphasis & Responses**

### **Messages by Audience**

- **Executives:** Strategic control, SAMA readiness, ~2.35-2.85M SAR annual value, and TechHub roadmap toward enterprise intelligence.
- **Finance:** Cost avoidance vs. ServiceNow-class tooling, zero per-agent fees, 5-year value of 11.75-14.25M SAR, real-time asset value tracking.
- **Security/Compliance:** Complete visibility, Intune-backed compliance trending, immutable audit evidence.
- **IT Operations:** Zero-touch discovery across OCI/GCP, integration hub for HR/Intune/ERP, drift alerts, and scalable architecture.

### **Common Q&A**

- **Timeline:** Iterative build now fully operational across 10 modules and 35+ entities.
- **New integrations:** Follows standard interface → repository → DI registration pattern; timeline depends on API availability.
- **Data accuracy:** Automated syncs + verification campaigns + audit trails; current accuracy 98%+.
- **TCO:** Existing on-prem infrastructure, minimal OpEx, and internal roadmap autonomy vs. recurring vendor fees.
- **Exports & resilience:** Audit-ready exports logged for compliance; Intune sync failures alert admins with manual override options.
- **Why build ITSM in-house:** Deep CMDB context, unified experience, cost/control advantages, with optional legacy integrations.

---

## **Appendix F — Success Metrics & KPIs**

# **How Impact Is Tracked**

- **Operational:** Asset reconciliation accuracy (target 98%+), automated discovery coverage (100%), onboarding time (<30 min), audit prep (<3 days), verification completion (95%+ in 30 days).
- **Financial:** License waste reduction (~500K SAR/year), renewal awareness (100% visibility 90 days prior), ghost device elimination, vendor consolidation insights.
- **Compliance:** Intune coverage (100% of managed devices), encryption adherence, disposal certificate completion, audit trail completeness.
- **Adoption:** Monthly active users by department, department coverage, self-service kit requests (roadmap), and training completion for asset coordinators.

---

**End of Presentation**

---
