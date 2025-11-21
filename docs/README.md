# Documentation Index

Welcome to the comprehensive documentation for Barq Assets. This index provides quick access to all documentation resources organized by category.

## 📚 Quick Start

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

### Infrastructure & Systems

- [Database Migrations & Deployment](./guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow, development vs production, and deployment best practices
- [Build Optimization Guide](./guides/BUILD_OPTIMIZATION.md) - Build performance optimization and bundle analysis
- [RBAC Developer Guide](./guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions and protecting routes/actions/UI
- [RBAC Admin Guide](./guides/RBAC_ADMIN_GUIDE.md) - Managing roles, permissions, and user access
- [First User Admin Assignment](./guides/FIRST_USER_ADMIN.md) - Automatic admin role assignment for the first user
- [Logging Guide](./guides/LOGGING.md) - Production-grade structured logging system
- [UI Components Guide](./guides/UI_COMPONENTS.md) - Advanced UI patterns with TanStack Table, React Hook Form, and CSV
- [Real-time Features Guide](./guides/REALTIME.md) - Server-Sent Events (SSE) and Partykit WebSocket integration
- [Background Jobs Guide](./guides/BACKGROUND_JOBS.md) - BullMQ job queue system for background processing
- [Branding Guide](./guides/BRANDING.md) - Brand customization and asset management
- [Sidebar Features](./guides/SIDEBAR_FEATURES.md) - Advanced sidebar features including collapsible groups, nested navigation, permissions, animations, and real-time badges
- [Sidebar Examples](./guides/SIDEBAR_EXAMPLES.md) - Real-world usage examples for sidebar features across different application types

## 💻 Code Documentation

Documentation embedded within the codebase:

- [Controller Error Handling](../src/interface-adapters/controllers/README.md) - Standardized error handling patterns
- [Repository Helpers](../src/infrastructure/repositories/prisma-helpers.ts) - Type-safe Prisma utilities

## 🛠️ Development

Development tools and utilities:

- [Scripts Documentation](../scripts/README.md) - Utility scripts and automation tools

## 🔗 External Resources

- [Next.js 15 Docs](https://nextjs.org/docs) - Next.js framework documentation
- [Prisma Docs](https://www.prisma.io/docs) - Prisma ORM documentation
- [InversifyJS](https://inversify.io/) - Dependency injection documentation
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
