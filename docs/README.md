# Documentation Index

Welcome to the comprehensive documentation for Barq Assets. This index provides quick access to all documentation resources organized by category.

## 🚀 Start Here

**Project Overview:**

- [Main README](../README.md) - Project overview, features, and quick start guide
- [CLAUDE.md](../CLAUDE.md) - Architecture guide and development workflows for AI assistants

## 🏗️ Architecture & Technical Design

Technical documentation for system architecture and design decisions:

- [Architecture Guide](./architecture/ARCHITECTURE.md) - Complete Clean Architecture implementation guide
- [Layer 1 Implementation](./architecture/LAYER_1_IMPLEMENTATION.md) - Foundation layer technical implementation details
- [Database Schema Design](./architecture/DATABASE_SCHEMA.md) - Schema design conventions, ID strategies, naming patterns, and best practices
- [RBAC Architecture](./architecture/RBAC_ARCHITECTURE.md) - Role-Based Access Control system architecture
- [Theme System](./architecture/THEME_SYSTEM.md) - Centralized theme system with OKLCH color space

## 👤 Developer Guides

Developer-facing documentation for building with the assets app:

- [Developer Guide](./guides/DEVELOPER_GUIDE.md) - Comprehensive development guide and best practices

### Foundation Layer (Layer 1)

Core building blocks for the CMDB/ITAM system:

- [Foundation Layer Guide](./guides/FOUNDATION_LAYER.md) - Complete user guide for all 11 Foundation entities
- [Entity Reference](./guides/ENTITY_REFERENCE.md) - Quick reference for OrganizationUnit, Person, Role, Location, Vendor, Lifecycle, and FieldDefinition entities

### Asset & Inventory Layer (Layer 2)

Asset management, inventory tracking, warranties, and maintenance:

- [Warranty System](./features/WARRANTY_SYSTEM.md) - Complete warranty management implementation with expiration tracking
- [Maintenance System](./features/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules and records with recurring schedules and workflow state management

### Advanced ITAM Layer (Layer 3)

Advanced IT Asset Management features:

- [ITAM Features Overview](./features/ITAM_FEATURES.md) - Complete guide to all advanced ITAM modules
- [Asset Disposals](./features/ASSET_DISPOSALS.md) - Multi-step disposal workflow with approval chain and PDF certificate generation
- [Asset Kits](./features/ASSET_KITS.md) - Predefined asset bundles with checkout tracking
- [Asset Reservations](./features/ASSET_RESERVATIONS.md) - Future asset reservations with conflict detection and automated background jobs
- [CMDB Guide](./features/CMDB_GUIDE.md) - Configuration Management Database with dependency tracking
- [Governance System](./features/GOVERNANCE_SYSTEM.md) - Data governance, ownership tracking, and verification campaigns for SAMA compliance
- [Attachments System](./features/ATTACHMENTS_SYSTEM.md) - Polymorphic file attachments for compliance documentation and audit trails

### Global Features

Cross-cutting features and utilities:

- [Global Search](./features/GLOBAL_SEARCH.md) - Command palette global search with keyboard shortcuts (⌘K/Ctrl+K)

### Infrastructure & Systems

#### Core Technical Guides

- **[Prisma Guide](./guides/PRISMA_GUIDE.md)** - Complete Prisma 7 patterns, connection pool management, type-safe imports, and repository implementation
- **[Next.js 16 Guide](./guides/NEXTJS_16_GUIDE.md)** - Next.js 16 async request APIs, rendering modes, Turbopack, and migration patterns
- **[Code Generation System](./guides/CODE_GENERATION.md)** - Automatic code/tag generation for entities with database-backed sequences and manual override
- **[Stack Upgrades Reference](./guides/STACK_UPGRADES.md)** - Breaking changes in Prisma 7, Zod 4, Next.js 16, React 19, and InversifyJS 7
- [Database Migrations & Deployment](./guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow, development vs production, and deployment best practices
- [Database Seeding Guide](./guides/DATABASE_SEEDING.md) - Comprehensive seed system: architecture, factories, configuration, and layered seeders
- [Build Optimization Guide](./guides/BUILD_OPTIMIZATION.md) - Build performance optimization and bundle analysis

#### Authentication & Security

- [RBAC Developer Guide](./guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions and protecting routes/actions/UI
- [RBAC Admin Guide](./guides/RBAC_ADMIN_GUIDE.md) - Managing roles, permissions, and user access
- [Logging Guide](./guides/LOGGING.md) - Production-grade structured logging system

#### UI & Real-time Features

- [UI Components Guide](./guides/UI_COMPONENTS.md) - Advanced UI patterns with TanStack Table, React Hook Form, and CSV
- [UI/UX Improvements](./guides/UI_UX_IMPROVEMENTS.md) - User experience enhancements and navigation improvements
- [Sidebar Features](./guides/SIDEBAR_FEATURES.md) - Advanced sidebar features including collapsible groups, nested navigation, permissions, animations, and real-time badges
- [Real-time Features Guide](./guides/REALTIME.md) - Server-Sent Events (SSE) and Partykit WebSocket integration
- [Background Jobs Guide](./guides/BACKGROUND_JOBS.md) - BullMQ job queue system for background processing

## 💻 Code Documentation

Documentation embedded within the codebase:

- [Controller Error Handling](../src/interface-adapters/controllers/README.md) - Standardized error handling patterns
- [Repository Helpers](../src/infrastructure/repositories/prisma-helpers.ts) - Type-safe Prisma utilities

## 🛠️ Development

Development tools and utilities:

- [Scripts Documentation](../scripts/README.md) - Utility scripts and automation tools

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

**Last Updated**: November 2025
