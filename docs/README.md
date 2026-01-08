# Documentation Index

Welcome to the comprehensive documentation for Barq Assets. This index provides quick access to all documentation resources organized by category.

## 🚀 Start Here

**Project Overview:**

- [Main README](../README.md) - Project overview, features, and quick start guide
- [CLAUDE.md](../CLAUDE.md) - Architecture guide and development workflows for AI assistants
- [Business Requirements Document](./business/BUSINESS_REQUIREMENTS_DOCUMENT.md) - High-level non-technical business requirements and objectives

## 🏗️ Architecture & Technical Design

Technical documentation for system architecture and design decisions:

- [Architecture Guide](./architecture/ARCHITECTURE.md) - Complete Clean Architecture implementation guide
- [Import Rules & Layer Boundaries](./architecture/IMPORT_RULES.md) - Import matrix, ESLint enforcement, and architectural boundary patterns (Phase 1 complete)
- [Logging Improvements](./architecture/LOGGING_IMPROVEMENTS.md) - DRY refactoring plan, request tracking, and observability enhancements (Phase 4 roadmap)
- [Layer 1 Implementation](./architecture/LAYER_1_IMPLEMENTATION.md) - Foundation layer technical implementation details
- [Database Schema Design](./architecture/DATABASE_SCHEMA.md) - Schema design conventions, ID strategies, naming patterns, and best practices
- [TechHub Layer Dependencies](./architecture/TECHHUB_LAYER_DEPENDENCIES.md) - Complete layer dependency map for data migration and seeding (technical reference)
- [RBAC Architecture](./architecture/RBAC_ARCHITECTURE.md) - Role-Based Access Control system architecture
- [Theme System](./architecture/THEME_SYSTEM.md) - Centralized theme system with OKLCH color space

## 👤 User Guides

End-user documentation for barq TechHub users:

- [Two-Factor Authentication User Guide](./guides/USER_GUIDE_2FA.md) - Complete guide for enabling, using, and troubleshooting 2FA

## 👨‍💻 Developer Guides

Developer-facing documentation for building with the assets app:

- [Developer Guide](./guides/DEVELOPER_GUIDE.md) - Comprehensive development guide and best practices
- [Refactoring Patterns](./guides/REFACTORING_PATTERNS.md) - Proven refactoring patterns for maintaining clean, maintainable code (component, configuration, logic, and module extraction)

### Data Migration & Initial Setup

**For Teams Populating TechHub with Company Data:**

- [Data Collection Guide](./guides/DATA_COLLECTION_GUIDE.md) - **Non-technical guide** for all Barq teams: what data to provide, examples, and templates for initial data population

### Foundation Layer (Layer 1)

Core building blocks for the CMDB/ITAM system:

- [Foundation Layer Guide](./guides/FOUNDATION_LAYER.md) - Complete user guide for all 11 Foundation entities
- [Entity Reference](./guides/ENTITY_REFERENCE.md) - Quick reference for OrganizationUnit, Person, Role, Location, Vendor, Lifecycle, and FieldDefinition entities
- [Employee Directory & Org Chart](./features/EMPLOYEE_DIRECTORY.md) - Interactive org chart visualization with lazy loading, recursive CTE queries, and theme-aware styling
- [Person Details Page](./features/PERSON_DETAILS.md) - Comprehensive 360-degree view of person profile with related entities, reporting chain, and role assignments
- [Vendor Details Page](./features/VENDOR_DETAILS.md) - Comprehensive 360-degree view of vendor profile with products, assets, contracts, warranties, and services

### Asset & Inventory Layer (Layer 2)

Asset management, inventory tracking, warranties, and maintenance:

- [Warranty System](./features/WARRANTY_SYSTEM.md) - Complete warranty management implementation with expiration tracking
- [Maintenance System](./features/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules and records with recurring schedules and workflow state management
- [Multi-Currency Support](./features/MULTI_CURRENCY_GUIDE.md) - Multi-currency support with SAR base, dual currency display, and exchange rate management
- **[MISSING]** Stock Location Management - Inventory location tracking and organization
- **[MISSING]** Stock Movement System - Inventory movement tracking and audit trail
- **[MISSING]** Asset Assignment System - Asset checkout/checkin and assignment tracking
- **[MISSING]** Asset Categories & Models - Category hierarchy and model specifications

### Advanced ITAM Layer (Layer 3)

Advanced IT Asset Management features:

- [Layer 3 Overview](./features/LAYER3_OVERVIEW.md) - Comprehensive overview of all 9 Layer 3 modules with features, routes, permissions, and database implementation
- [ITAM Features Overview](./features/ITAM_FEATURES.md) - Complete guide to all advanced ITAM modules
- [Asset Disposals](./features/ASSET_DISPOSALS.md) - Multi-step disposal workflow with approval chain and PDF certificate generation
- [Asset Kits](./features/ASSET_KITS.md) - Predefined asset bundles with checkout tracking
- [Asset Reservations](./features/ASSET_RESERVATIONS.md) - Pre-assignment workflow for holding assets before employee assignment with auto-cancellation on assignment
- [CMDB Guide](./features/CMDB_GUIDE.md) - Configuration Management Database with dependency tracking
- Contract Management - Contract types, contract lifecycle, and polymorphic asset/CI linking (see [Layer 3 Overview](./features/LAYER3_OVERVIEW.md#6-contract-management))
- [License Management](./features/LICENSE_MANAGEMENT.md) - License products, entitlements, allocations, cost tracking with multi-currency support, and addon management
- [Governance System](./features/GOVERNANCE_SYSTEM.md) - Data governance, ownership tracking, and verification campaigns for SAMA compliance
- [Attachments System](./features/ATTACHMENTS_SYSTEM.md) - Polymorphic file attachments for compliance documentation and audit trails
- [Service Management](./features/SERVICE_MANAGEMENT.md) - IT service catalog with ownership, infrastructure tracking, and business process alignment
- [Service SLA & Health Monitoring](./features/SERVICE_SLA_HEALTH_MONITORING.md) - Enterprise-grade SLA tracking and automated health monitoring with compliance status, performance metrics, and proactive alerting (can be disabled via `SERVICE_HEALTH_SLA` feature flag)
- [Intune Integration](./features/INTUNE_INTEGRATION.md) - Microsoft Intune/MDM device sync with compliance monitoring, asset linking, and SAMA governance reporting

### Global Features

Cross-cutting features and utilities:

- [Feature Flags](./features/FEATURE_FLAGS.md) - Master toggle system for enabling/disabling major modules with admin bypass, dependency enforcement, and maintenance mode
- [Global Search](./features/GLOBAL_SEARCH.md) - Command palette global search with keyboard shortcuts (⌘K/Ctrl+K)
- **[PARTIALLY COMPLETE]** [Universal Data Importer](../roadmap/UNIVERSAL_DATA_IMPORTER.md) - CSV/Excel import wizard for all entities with fuzzy matching, validation, and batch processing (core complete, 64 entity configurations pending)
- [Universal Assets Importer](./features/UNIVERSAL_ASSETS_IMPORTER.md) - Single-file asset import with auto-creation of vendors, categories, models, locations, and custom fields using prefixed column format
- **[MISSING]** Dashboard & Widgets - Main dashboard with metrics cards, recent activity, task queue, and quick actions
- **[MISSING]** Navigation System - Global navigation, sidebar with collapsible groups, breadcrumbs, and permission filtering
- **[MISSING]** Reports System - Asset reports (EOL, by category, value analysis, warranty status, unassigned assets)
- **[MISSING]** Settings Management - Platform, operations, notifications, authentication, and integration settings
- **[MISSING]** CSV Export - Bulk export functionality for all entities
- **[MISSING]** Multi-Currency Support - Foreign exchange rates and currency conversion
- **[MISSING]** Audit Logging (User Guide) - Viewing audit trails and compliance reports (technical docs exist)
- [Entity Registry](./features/ENTITY_REGISTRY.md) - Centralized registry of 20 business entities supporting custom fields across 7 categories
- Field Definition System - Dynamic custom fields for Assets and Configuration Items (complete), LicenseProduct infrastructure ready (UI pending)
- **[MISSING]** Lifecycle Management - Lifecycle models, states, and transition rules

### Infrastructure & Systems

#### Core Technical Guides

- **[System Setup](./features/SYSTEM_SETUP.md)** - First-time installation wizard and admin dashboard for system health, diagnostics, and database operations
- **[Prisma Guide](./guides/PRISMA_GUIDE.md)** - Complete Prisma 7 patterns, connection pool management, type-safe imports, and repository implementation
- **[Next.js 16 Guide](./guides/NEXTJS_16_GUIDE.md)** - Next.js 16 async request APIs, rendering modes, Turbopack, and migration patterns
- **[Performance Optimizations](./performance/PERFORMANCE_OPTIMIZATIONS.md)** - Session memoization, Redis caching, N+1 query elimination, and client-side optimizations
- **[localStorage & Hydration Patterns](./guides/LOCALSTORAGE_HYDRATION.md)** - Best practices for client-side state persistence, avoiding race conditions, and async data dependencies
- **[Code Generation System](./guides/CODE_GENERATION.md)** - Automatic code/tag generation for entities with database-backed sequences and manual override
- **[Stack Upgrades Reference](./guides/STACK_UPGRADES.md)** - Breaking changes in Prisma 7, Zod 4, Next.js 16, React 19, and InversifyJS 7
- [Database Migrations & Deployment](./guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow, development vs production, and deployment best practices
- [Database Seeding Guide](./guides/DATABASE_SEEDING.md) - Comprehensive seed system: architecture, factories, configuration, and layered seeders (see also: [TechHub Layer Dependencies](./architecture/TECHHUB_LAYER_DEPENDENCIES.md) for complete technical reference)
- [Build Optimization Guide](./guides/BUILD_OPTIMIZATION.md) - Build performance optimization and bundle analysis
- Email Service Integration - Microsoft Graph email via `MicrosoftGraphEmailService`, test with `scripts/dev/test-email.ts`
- **[MISSING]** File Storage System - File upload/download, storage backends, and metadata management
- **[MISSING]** AI Infrastructure - OpenAI integration, prompt management, caching, and structured outputs (currently disabled)

#### Authentication & Security

- [RBAC Developer Guide](./guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions and protecting routes/actions/UI
- [RBAC Admin Guide](./features/RBAC_ADMIN_GUIDE.md) - Managing roles, permissions, and user access
- [User Provisioning System](./features/USER_PROVISIONING.md) - Admin user account creation, secure password generation, and password reset for employees
- [Two-Factor Authentication](./features/TWO_FACTOR_AUTHENTICATION.md) - TOTP-based 2FA with QR code setup, backup codes, and login challenge
- **[MISSING]** Permission Groups & Dependencies - Permission organization, dependency validation, and auto-fix features
- **[MISSING]** Role Conflict Detection - Segregation of duties enforcement and conflict resolution
- **[MISSING]** Role Cloning - One-click role duplication with permission copying
- **[MISSING]** Bulk Permission Operations - Multi-select permission assignment and removal
- **[MISSING]** Authentication System - NextAuth.js setup, user registration, login, and initial setup
- [Logging Guide](./guides/LOGGING.md) - Production-grade structured logging system
- **[MISSING]** Error Handling System - Error boundaries, global error pages, and structured error logging

#### UI & Real-time Features

- [UI Components Guide](./guides/UI_COMPONENTS.md) - Advanced UI patterns with TanStack Table, React Hook Form, and CSV
- [Table Components Guide](./guides/TABLE_COMPONENTS_GUIDE.md) - Complete guide to standardized tables with hooks, column visibility, filtering, and DRY patterns
- [UI/UX Improvements](./guides/UI_UX_IMPROVEMENTS.md) - User experience enhancements and navigation improvements
- [Sidebar Features](./guides/SIDEBAR_FEATURES.md) - Advanced sidebar features including collapsible groups, nested navigation, permissions, animations, and real-time badges
- **[MISSING]** Theme System (User Guide) - Using and customizing the OKLCH color space theme system
- **[MISSING]** Form Patterns - React Hook Form integration, validation, and error handling
- [Real-time Features Guide](./guides/REALTIME.md) - Server-Sent Events (SSE) and Partykit WebSocket integration
- [Background Jobs Guide](./guides/BACKGROUND_JOBS.md) - BullMQ job queue system for background processing

## 💻 Code Documentation

Documentation embedded within the codebase:

- [Controller Error Handling](../src/interface-adapters/controllers/README.md) - Standardized error handling patterns
- [Repository Helpers](../src/infrastructure/repositories/prisma-helpers.ts) - Type-safe Prisma utilities
- **[MISSING]** Controller Patterns - Comprehensive guide to server action patterns and Clean Architecture controllers
- **[MISSING]** Repository Patterns - Complete repository implementation guide with Prisma best practices
- **[MISSING]** DTO Validation System - Zod schema patterns and validation at API boundaries
- [DI Container Modularization](./architecture/DI_MODULARIZATION.md) - Three-tier modular DI system with lazy loading, health checks, and performance optimization
- **[MISSING]** Use Case Patterns - Use case implementation guide and business logic organization

## 🛠️ Development

Development tools and utilities:

- [Scripts Documentation](../scripts/README.md) - Utility scripts and automation tools
- **[MISSING]** Environment Configuration Guide - Environment variables, configuration management, and secrets
- **[MISSING]** API Routes Documentation - REST API endpoints, authentication, and integration patterns
- **[MISSING]** Testing Guide - Unit testing, integration testing, and test patterns
- **[MISSING]** Deployment Guide - Production deployment, environment setup, and CI/CD

## 🗄️ Operations & Deployment

Operational documentation and deployment resources:

### CI/CD Pipeline

GitLab CI/CD pipeline with GitOps deployment to Kubernetes:

- [GitLab CI Setup Guide](./deployment/GITLAB_CI_SETUP.md) - Complete GitOps setup with ArgoCD, Kaniko, and container registries
- [Build Steps Reference](./deployment/BUILD_STEPS.md) - Detailed breakdown of pipeline stages, GitOps workflow, and image promotion
- [Kubernetes Operations](./deployment/KUBERNETES_OPERATIONS.md) - Day-to-day K8s operations and kubectl commands

### Operations

Production operations and security:

- [Automated Deployment Guide](./operations/AUTOMATED_DEPLOYMENT.md) - PM2 deployment workflows and automation (production scripts)
- [TechHub Risk Assessment](./operations/TechHub-Risk-Assessment.md) - Comprehensive risk assessment for CMDB and IT asset management platform
- [Auth Security Testing Guide](./testing/AUTH_SECURITY_TESTING_GUIDE.md) - Security testing procedures and validation

## 📦 Releases, Migrations & Archive

Release notes, migration guides, and archived documentation:

- [Release Notes](./releases/) - Version release notes and changelogs
  - [v1.2.0](./releases/RELEASE_NOTES_v1.2.0.md)
  - [v1.3.0](./releases/RELEASE_NOTES_v1.3.0.md)
- [Migrations](./migrations/) - Feature migration and upgrade guides
  - [Column Visibility Migration](./migrations/COLUMN_VISIBILITY_MIGRATION.md) - Completed: App-wide column visibility with localStorage persistence (Dec 2024)
- [Archive](./archive/) - Historical documentation and completed implementation summaries
  - [Person-Role Removal](./archive/PERSON_ROLE_REMOVAL.md) - Completed implementation (Dec 2025)
  - [Phase 3 DI Modularization](./archive/PHASE_3_SUMMARY.md) - DI container refactoring summary
  - [Scripts Reorganization](./archive/scripts-reorganization-mapping.md) - Historical file mapping

## 🎯 Public & Marketing

Content for public-facing pages:

- **[MISSING]** Landing Page - Marketing site showcasing system capabilities and features
- [In-App Documentation System](./guides/DOCUMENTATION_SYSTEM.md) - MDX documentation for end-users (`src/content/docs/`), custom components, permission gating, and glossary-aware search

## 🔗 External Resources

- [Next.js 16 Docs](https://nextjs.org/docs) - Next.js framework documentation
- [Prisma 7 Docs](https://www.prisma.io/docs) - Prisma ORM documentation
- [InversifyJS 7](https://inversify.io/) - Dependency injection documentation
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 📖 Documentation Standards

When adding new documentation:

### 1. **Location**:

- User guides → `docs/guides/`
- Architecture docs → `docs/architecture/`
- Code docs → Next to the code in `src/`
- Scripts docs → `scripts/README.md`

### 2. **Format**:

- Use clear, descriptive titles
- Include table of contents for long documents
- Add code examples with syntax highlighting
- Use relative links for internal references

### 3. **Maintenance**:

- Update this index when adding new documentation
- Keep documentation in sync with code changes
- Remove or archive outdated documentation

### 4. **What to Document**:

✅ **DO Document**:

- Current application state and architecture
- Technical design decisions and patterns
- Developer guides and how-to instructions
- API interfaces and usage examples
- Common workflows and best practices

❌ **DON'T Document**:

- Refactoring summaries or implementation history
- Development phases or status tracking
- Changelogs (use git history instead)
- Migration guides (unless actively needed)
- Temporary notes or work-in-progress

---

**Last Updated**: December 2025
