# Barq TechHub

[![GitLab CI/CD](https://img.shields.io/badge/CI%2FCD-GitLab-orange?logo=gitlab)](docs/deployment/GITLAB_CI_SETUP.md)
[![Deployment](https://img.shields.io/badge/Deployment-GitOps-success)](docs/deployment/KUBERNETES_OPERATIONS.md)

**Internal enterprise CMDB and IT Asset Management system for Barq Technology Operations**

Production-grade platform with **72 entities**, **81 dashboard routes**, **272 permissions**, and **32 DI modules** supporting SAMA-compliant IT operations.

**Tech Stack**: Next.js 16.0.6 (Turbopack) | React 19.2.0 | Prisma 7.0.1 | TypeScript 5.9.3 | Zod 4.1.12 | Tailwind CSS 4.1.17
**Architecture**: 5-layer Clean Architecture with InversifyJS 7 dependency injection
**Deployment**: On-premises at Barq facilities (dev, UAT, prod) | Local development on macOS

## 🚀 Features

### Architecture & Patterns

- ✅ **Clean Architecture** - 5-layer architecture with strict dependency rules
- ✅ **Dependency Injection** - InversifyJS container with type-safe resolution
- ✅ **Repository Pattern** - Interface-based data access abstraction
- ✅ **Use Case Pattern** - Business logic orchestration
- ✅ **Domain-Driven Design** - Entities with business rules and validation

### Technology Stack

- ✅ **Next.js 16.0.6** (App Router + Turbopack) + **React 19.2.0**
- ✅ **TypeScript 5.9.3** (strict mode)
- ✅ **Tailwind CSS 4.1.17** with OKLCH color space
- ✅ **Prisma 7.0.1** ORM (PostgreSQL)
- ✅ **Zod 4.1.12** validation
- ✅ **shadcn/ui** (35+ components)
- ✅ **InversifyJS 7** dependency injection
- ✅ **Vitest 4.0.10** testing framework

### Core Capabilities

- ✅ **RBAC System** - 272 granular permissions across 14 groups with defense-in-depth enforcement
- ✅ **Modular DI** - 32 modules with 3-tier lazy loading (CORE, DASHBOARD, HEAVY)
- ✅ **Real-time Features** - Server-Sent Events (SSE) + PartyKit WebSocket integration
- ✅ **Background Jobs** - BullMQ queue system with worker health monitoring
- ✅ **Multi-Currency** - SAR base currency with dual display and exchange rate management
- ✅ **Microsoft Graph** - Azure AD sync, Teams integration, Intune device management
- ✅ **Global Search** - Command palette (⌘K/Ctrl+K) across all entities
- ✅ **Audit Logging** - Comprehensive audit trail for regulatory compliance
- ✅ **Database Ops** - Automated backup/restore system with PM2 deployment

### Theme System

- ✅ **OKLCH Colors** - Modern color space for consistent, perceptually uniform colors
- ✅ **Barq Branding** - Yellow & light blue brand colors (customizable)
- ✅ **Dark Mode** - Automatic theme switching with `next-themes`
- ✅ **Semantic Tokens** - Design system colors for consistency
- ✅ **Type-Safe** - TypeScript definitions for all theme tokens

### Development Experience

- ✅ **Type-Safe** - End-to-end TypeScript with strict mode
- ✅ **ESLint** + **Prettier** - Code quality and formatting
- ✅ **Husky** + **lint-staged** - Pre-commit hooks
- ✅ **Hot Module Replacement** - Fast development with Turbopack
- ✅ **Error Boundaries** - Graceful error handling

## 📦 What's Included

### Layer 1: Foundation (12 Entities, 55 Use Cases)

Complete core building blocks for CMDB/ITAM:

- **12 Foundation Entities** - OrganizationUnit, Person, Role, Location, Vendor, VendorContact, LifecycleModel, LifecycleState, LifecycleTransition, FieldDefinition, FieldTemplate, ExchangeRate
- **Hierarchical Structures** - Self-referencing org units and locations with recursive CTE queries
- **Lifecycle Management** - Reusable state machines for assets, CIs, and licenses
- **Dynamic Fields** - Meta-model for custom attributes on assets and CIs
- **Multi-Currency** - Foreign exchange rates with SAR base currency
- **Employee Directory** - Interactive org chart with lazy loading and 360° person view

### Layer 2: Assets & Inventory (9 Entities, 60+ Use Cases)

Comprehensive IT asset lifecycle management:

- **9 Asset Entities** - Asset, AssetCategory, AssetModel, AssetAssignment, Warranty, MaintenanceSchedule, MaintenanceRecord, StockLocation, StockMovement
- **Asset Lifecycle** - Track from acquisition to disposal with condition monitoring
- **Assignment Workflows** - Wizard-driven checkout/return with conflict detection
- **Warranty Management** - Automatic expiration tracking and renewal alerts
- **Preventive Maintenance** - Recurring schedules with work order tracking
- **Inventory Control** - Multi-location stock tracking with movement audit trail
- **Universal Importer** - Single-file asset import with auto-creation of vendors, categories, models

### Layer 3: Advanced ITAM (10 Modules, ~35 Entities, 195+ Use Cases)

Enterprise-grade features for compliance and governance:

**Asset Disposals**
- Multi-step approval workflow (PENDING → APPROVED → IN_PROGRESS → SANITIZED → COMPLETED)
- Data sanitization checklist for SAMA compliance
- PDF certificate generation with approval chain audit trail

**Asset Kits**
- Predefined bundles (e.g., "New Hire Kit" = laptop + accessories)
- Checkout tracking with partial return support
- Individual item status (active, damaged, lost, returned)

**Asset Reservations**
- Future-date reservations with conflict detection engine
- Availability checker across date ranges
- Auto-activation via background jobs

**CMDB (Configuration Items)**
- CI classes with custom field definitions
- Relationship types (DEPENDS_ON, RUNS_ON, INSTALLED_ON, CONNECTS_TO)
- Dependency graph with impact analysis support
- Lifecycle state tracking

**License Management**
- License products with entitlements and allocations
- Multi-currency cost tracking with SAR conversion
- Add-on management for supplementary licenses
- Compliance monitoring and renewal tracking

**Service Management**
- IT service catalog with ownership tracking
- Infrastructure linking (servers, databases, applications)
- Business process alignment
- SLA monitoring with health status and automated alerting

**Governance System**
- Data domain classification
- Data ownership assignment (data owners, stewards, custodians)
- Verification campaigns for SAMA compliance
- Quarterly review workflows

**Contract Management**
- Multiple contract types (support, license, service, lease)
- Polymorphic linking to assets and CIs
- Lifecycle tracking with renewal reminders

**Intune Integration**
- Microsoft Intune/MDM device sync via Microsoft Graph
- Compliance monitoring and policy enforcement
- Asset linking for unified hardware view
- SAMA governance reporting

**Attachments System**
- Polymorphic file attachments for compliance documentation
- MIME type and magic number validation
- Attachment type categorization

### RBAC & Security

Enterprise-grade access control and compliance:

- **272 Permissions** - Granular permissions across 14 groups (Users, Roles, Assets, CMDB, Licenses, Services, etc.)
- **Defense in Depth** - Multi-layer enforcement (server actions, use cases, UI components, route guards)
- **Feature Flags** - Master toggles for modules with dependency validation and admin bypass
- **2FA with TOTP** - QR code enrollment, backup codes, and login challenge
- **Session Management** - Better Auth integration with automatic Person entity linking
- **Comprehensive Audit** - Complete audit trail for all entity operations with request tracking
- **Protected Routes** - 81 routes with server-side permission checks and `force-dynamic` rendering
- **File Upload Security** - MIME whitelist, extension validation, and magic number detection

### Architectural Reference

Task entity serves as **Clean Architecture reference implementation** (hidden from production UI):

- **Complete Layer Pattern** - Domain entity → Repository → Use cases → Controller → UI
- **Business Logic** - Demonstrates validation, state management, and ownership checks
- **Permission Integration** - Shows RBAC enforcement at all layers
- **Server Actions** - Next.js 16 controllers with Zod validation
- **UI Patterns** - TanStack Table with sorting, filtering, pagination, and CSV export

**Note**: Task is kept as learning resource and testing fixture, not production feature.

## Dashboard Routes (81 Routes)

Comprehensive web interface covering full ITAM lifecycle:

**Admin** (16 routes)
- Roles & Permissions management with dependency validation
- User administration with role assignment
- Audit logs with advanced filtering
- Feature flags with dependency enforcement
- Database backups with one-click restore
- System health dashboard with diagnostics

**Assets** (13 routes)
- Asset catalog with advanced filtering
- Categories, models, and custom fields
- Assignment workflow with conflict detection
- Disposals with multi-step approval
- Kits with bundle checkout
- Reservations with calendar view

**CMDB** (5 routes)
- Configuration items with lifecycle tracking
- CI relationships with dependency graph
- Relationship types with scope definitions
- CI classes with field templates

**Licenses** (3 routes)
- License products with add-on management
- Entitlements with allocation tracking
- Usage monitoring and compliance reporting

**Services** (4 routes)
- Service catalog with ownership
- Infrastructure tracking
- SLA monitoring with health status
- Business process alignment

**Intune/MDM** (2 routes)
- Device inventory with compliance status
- Detailed device view with asset linking

**Governance** (3 routes)
- Data domains with classification
- Ownership tracking (owners, stewards, custodians)
- Verification campaigns for SAMA compliance

**Foundation** (11 routes)
- Employee directory with org chart
- Locations with hierarchical structure
- Vendors with 360° view (products, contracts, assets)
- Lifecycle models and state machines
- Custom field definitions

**Settings** (6 routes)
- Platform configuration
- Operations settings
- Integration management (Microsoft Graph, Intune)
- Authentication settings (2FA, SSO)
- Notification preferences

**Additional** (18 routes)
- Dashboard home with metrics and activity
- Profile management with 2FA setup
- Documentation browser (MDX)
- Data import wizard
- Global search
- Analytics and reports

### 35+ UI Components

All shadcn/ui primitives included:

- Button, Dialog, Card, Input, Textarea
- Select, Checkbox, Switch, Slider
- Tabs, Accordion, Collapsible
- Toast notifications (sonner)
- And many more...

### Utilities & Hooks

- `cn()` - Class name utility
- `Result<T,E>` - Type-safe error handling
- `logger` - Structured logging
- `useKeyboardShortcuts` - Keyboard shortcuts system
- `useMediaQuery` - Responsive design hook

## 🏁 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- **Redis** for caching and background jobs
- **OpenAI API key** (optional - AI features currently disabled)

**Local Development**: macOS with PostgreSQL and Redis via Homebrew (NOT Docker)
**Production**: On-premises infrastructure at Barq facilities (dev, UAT, prod environments)

### Installation

```bash
# 1. Clone or navigate to the project
cd /Users/abdullahalzuwayed/dev/barq/barq-assets

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with:
#   - DATABASE_URL (PostgreSQL connection)
#   - REDIS_URL (Redis connection)
#   - OPENAI_API_KEY (optional)
#   - BETTER_AUTH_SECRET (generate with `openssl rand -base64 32`)

# 4. Initialize database
npx prisma migrate dev              # Apply all migrations

# Choose seeding strategy:
npm run db:seed                     # Production preset (RBAC, config, reference data only)
# OR
npm run db:seed:dev                 # Dev preset (includes demo assets, test users, sample data)

# 5. Create first admin user
# Visit http://localhost:3000/register to create an account
# Then assign "system-administrator" role via:
npm run roles:manage                # Interactive role assignment script
# OR use Prisma Studio: npx prisma studio

# 6. Run development server (managed by user - don't run this yourself)
npm run dev                         # Starts at http://localhost:3000
```

**First Login**: Navigate to [http://localhost:3000/login](http://localhost:3000/login) with your registered account

## 📚 Project Structure

```
src/
├── app/                              # Next.js 16 App Router
│   ├── (auth)/                       # Authentication pages (7 routes)
│   ├── (dashboard)/                  # Protected dashboard (81 routes)
│   │   ├── admin/                    # Admin panel (16 routes)
│   │   ├── assets/                   # Asset management (13 routes)
│   │   ├── cmdb/                     # CMDB features (5 routes)
│   │   ├── licenses/                 # License management (3 routes)
│   │   ├── services/                 # Service catalog (4 routes)
│   │   ├── intune/                   # Intune integration (2 routes)
│   │   └── [foundation entities]/    # Foundation layer (11 routes)
│   ├── (marketing)/                  # Public landing page
│   └── api/                          # API routes (auth, webhooks, SSE)
│
├── components/
│   ├── ui/                           # 35+ shadcn/ui components
│   ├── providers/                    # Context providers (theme, session, permissions)
│   ├── layout/                       # Sidebar, navbar, breadcrumbs
│   ├── [entity]/                     # Entity-specific components (72 entity types)
│   └── mdx/                          # MDX documentation components
│
├── core/                             # Clean Architecture core
│   ├── domain/
│   │   ├── entities/                 # 72 domain entities with business logic
│   │   ├── value-objects/            # Permission keys, enums, types
│   │   └── errors/                   # Domain-specific errors
│   ├── repositories/                 # Repository interfaces (72 interfaces)
│   ├── services/                     # Service interfaces (AI, email, storage, queue)
│   └── use-cases/                    # Business logic (250+ use cases)
│       ├── [foundation]/             # Foundation layer use cases (55 use cases)
│       ├── [assets]/                 # Asset layer use cases (60+ use cases)
│       └── [advanced]/               # Layer 3 use cases (195+ use cases)
│
├── di/                               # Dependency Injection (InversifyJS 7)
│   ├── container.ts                  # Container singleton
│   ├── types.ts                      # DI tokens (250+ tokens)
│   └── modules/                      # 32 binding modules
│       ├── [CORE tier]/              # 14 modules (logger, database, rbac, etc.)
│       ├── [DASHBOARD tier]/         # 11 modules (asset, inventory, cmdb, etc.)
│       └── [HEAVY tier]/             # 7 modules (ms-graph, intune, service, etc.)
│
├── infrastructure/                   # External implementations
│   ├── database/prisma/
│   │   ├── schema/                   # Multi-file schema (17 domain files)
│   │   ├── migrations/               # Prisma migrations (versioned)
│   │   └── seed.ts                   # Production & dev seeders with factories
│   ├── repositories/                 # 72 Prisma repository implementations
│   └── services/                     # Email, file storage, queue, AI, Graph API
│
├── interface-adapters/               # Controllers, DTOs, Presenters
│   ├── controllers/                  # Server actions (72 controllers)
│   ├── dtos/                         # Zod validation schemas (150+ DTOs)
│   ├── presenters/                   # Entity → DTO transformers
│   ├── queries/                      # View composers with DataLoader (N+1 prevention)
│   └── permissions/                  # 272 permission keys in 14 groups
│
├── contexts/                         # React contexts
│   ├── session-context.tsx           # Memoized session with 5-min cache
│   ├── permissions-provider.tsx      # Client-side permission checks (UX only)
│   └── feature-flags-provider.tsx    # Client-side feature flag checks
│
├── lib/                              # Shared utilities
│   ├── theme/                        # OKLCH color system, Barq branding
│   ├── hooks/                        # React hooks (keyboard shortcuts, media query, etc.)
│   ├── utils.ts                      # Date formatting, status badges, cn()
│   ├── result.ts                     # Type-safe Result<T,E> monad
│   └── logger.ts                     # Structured logging with Pino
│
├── content/docs/                     # MDX documentation for end users
│
├── docs/                             # 90 markdown documentation files
│   ├── architecture/                 # 13 architecture docs
│   ├── guides/                       # 33 developer guides
│   ├── features/                     # 29 feature docs
│   ├── operations/                   # 4 ops docs
│   └── archive/                      # 10 historical docs
│
└── scripts/                          # Admin and deployment scripts
    ├── deploy/                       # Deployment automation (PM2)
    ├── users/                        # User management (role assignment, 2FA reset)
    ├── db/                           # Database utilities (drift detection, backups)
    ├── monitoring/                   # Health checks, Bull Board
    └── dev/                          # Development tools (cache clear, email test)
```

## 🏗️ Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│         1. Presentation Layer (Next.js)              │
│              App Router + Components                 │
├─────────────────────────────────────────────────────┤
│      2. Interface Adapters (Controllers/DTOs)        │
│           Server Actions + Validation                │
├─────────────────────────────────────────────────────┤
│           3. Use Cases (Business Logic)              │
│          Orchestrate repositories & services         │
├─────────────────────────────────────────────────────┤
│        4. Domain (Entities + Interfaces)             │
│         Business rules + Repository contracts        │
├─────────────────────────────────────────────────────┤
│     5. Infrastructure (Prisma + External APIs)       │
│        Database + OpenAI + File Storage              │
└─────────────────────────────────────────────────────┘
```

**Dependency Rule**: Dependencies point inward only.
Infrastructure and Presentation depend on Domain, never the reverse.

### Dependency Injection Flow

```typescript
// 1. Define interface in core layer
export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  create(task: Task): Promise<Task>;
}

// 2. Implement in infrastructure layer
@injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(@inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient) {}
  // ...implementation
}

// 3. Bind in DI container
container
  .bind<ITaskRepository>(DI_TOKENS.ITaskRepository)
  .to(PrismaTaskRepository)
  .inSingletonScope();

// 4. Inject into use case
@injectable()
export class CreateTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository) private repo: ITaskRepository,
  ) {}
  async execute(props: CreateTaskProps) {
    const task = Task.create(props);
    return await this.repo.create(task);
  }
}

// 5. Use in server action
const container = getContainer();
const useCase = container.get<CreateTaskUseCase>(DI_TOKENS.CreateTaskUseCase);
const task = await useCase.execute({ title: "Learn Clean Architecture" });
```

## 🎨 Theme System

### Barq Brand Colors

```tsx
import { Button } from "@/components/ui/button";

// Use Tailwind utilities (preferred)
<Button className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90">
  Create Task
</Button>

// Semantic tokens
<div className="bg-destructive/10 text-destructive">Error</div>
<div className="bg-success/10 text-success">Success</div>
```

### Available Brand Colors

- `barq-yellow` - Primary brand color (#FFDA00)
- `barq-light-blue` - Secondary brand color (#00D9FF)
- `barq-black` - Dark neutral (#1A1A1A)
- `barq-white` - Light neutral (#FFFFFF)

See `docs/THEME_SYSTEM.md` for complete documentation.

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations (development)
npm run db:migrate

# Apply migrations without prompts (production)
npm run db:migrate:deploy

# Seed database with prompts
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Adding a New Model

1. **Update Prisma schema** (add to appropriate file in `src/infrastructure/database/prisma/schema/`)
2. **Create domain entity** (`src/core/domain/entities/`)
3. **Create repository interface** (`src/core/repositories/`)
4. **Implement Prisma repository** (`src/infrastructure/repositories/`)
5. **Register in DI container** (`src/di/modules/database.module.ts`)
6. **Create use cases** (`src/core/use-cases/`)
7. **Create server actions** (`src/interface-adapters/controllers/`)
8. **Build UI components** (`src/components/`)

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Type check
npm run type-check
```

## 📝 Scripts

### Development
```bash
npm run dev                 # Start dev server with Turbopack (user-managed)
npm run validate            # Type-check + lint + test (run before committing)
npm run type-check          # TypeScript type checking only
npm run lint                # ESLint
npm run test                # Vitest unit tests
npm run test:ui             # Vitest with web UI
```

### Build & Deployment
```bash
npm run build               # Production build (type-check + lint + build)
npm run build:fast          # Fast build (skips type checking)
npm run deploy              # Full deployment: build → migrate → seed (if empty) → PM2 start
npm run deploy:full         # Force reinstall dependencies and rebuild
npm run start               # Start production server (auto-kills port conflicts)
```

### Database
```bash
npm run db:generate         # Generate Prisma Client
npx prisma migrate dev      # Create migration (never use db:push)
npm run db:migrate:deploy   # Apply migrations (production)
npm run db:seed             # Seed with production preset
npm run db:seed:dev         # Seed with dev preset (demo data)
npm run db:seed:interactive # Interactive seeder with prompts
npm run db:reset            # ⚠️  Reset database + seed dev (DROPS ALL DATA!)
npx prisma studio           # Visual DB editor
npm run db:backup           # Create timestamped backup
npm run db:restore          # Restore from backup (interactive)
```

### Admin Tools
```bash
npm run roles:manage        # Assign/remove user roles
npm run sync:users          # Sync users from Microsoft Graph
npm run link:user-to-person # Link Better Auth user to Person entity
npm run disable:2fa         # Disable 2FA for locked-out user
npm run fix:admin-perms     # Ensure system-administrator has all permissions
```

### Background Workers
```bash
npm run worker:dev          # Start background worker (dev mode with watch)
npm run worker:start        # Start background worker (production)
npm run worker:health       # Check worker health status
npm run queues:board        # Open Bull Board dashboard
```

### Real-time
```bash
npm run partykit:dev        # Start PartyKit WebSocket server (dev)
npm run partykit:deploy     # Deploy PartyKit to production
```

### Process Management (PM2)
```bash
npm run pm2:start           # Start all services via PM2
npm run pm2:stop            # Stop all PM2 services
npm run pm2:restart         # Restart PM2 services
npm run pm2:logs            # View PM2 logs
npm run pm2:status          # Check PM2 status
```

See [scripts/README.md](scripts/README.md) for detailed documentation of all utility scripts.

## 📖 Documentation

90+ documentation files covering all aspects of the system.

### Start Here

- **[CLAUDE.md](CLAUDE.md)** - AI assistant context, critical patterns, and development workflows
- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide for adding features
- **[docs/README.md](docs/README.md)** - Full documentation index with 90 files

### Architecture (13 Documents)

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation guide
- [DI_MODULARIZATION.md](docs/architecture/DI_MODULARIZATION.md) - 3-tier DI system with lazy loading
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design conventions and best practices
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-Based Access Control system
- [IMPORT_RULES.md](docs/architecture/IMPORT_RULES.md) - Layer boundaries and ESLint enforcement
- [ID_GENERATION.md](docs/architecture/ID_GENERATION.md) - CUID2-based centralized ID service

### Developer Guides (33 Documents)

**Core Technical Guides:**
- [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md) - Connection pool, imports, migrations, type-safe patterns
- [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) - Async APIs, rendering modes, breaking changes
- [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md) - Prisma 7, Zod 4, Next.js 16, React 19 migration
- [TABLE_COMPONENTS_GUIDE.md](docs/guides/TABLE_COMPONENTS_GUIDE.md) - Standardized TanStack Table patterns
- [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md) - Seed system architecture and factories

**Security & Permissions:**
- [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions and protecting routes
- [LOGGING.md](docs/guides/LOGGING.md) - Structured logging with Pino and request tracking

**UI & Real-time:**
- [UI_COMPONENTS.md](docs/guides/UI_COMPONENTS.md) - Advanced UI patterns and form handling
- [REALTIME.md](docs/guides/REALTIME.md) - SSE and PartyKit WebSocket integration
- [BACKGROUND_JOBS.md](docs/guides/BACKGROUND_JOBS.md) - BullMQ queue system

**Development Tools:**
- [BUILD_OPTIMIZATION.md](docs/guides/BUILD_OPTIMIZATION.md) - Build performance and bundle analysis
- [REFACTORING_PATTERNS.md](docs/guides/REFACTORING_PATTERNS.md) - Code extraction and maintainability

### Feature Documentation (29 Documents)

**Layer 3 Features:**
- [LAYER3_OVERVIEW.md](docs/features/LAYER3_OVERVIEW.md) - Complete overview of 10 advanced modules
- [ITAM_FEATURES.md](docs/features/ITAM_FEATURES.md) - Complete ITAM feature guide
- [CMDB_GUIDE.md](docs/features/CMDB_GUIDE.md) - Configuration items and dependency tracking
- [LICENSE_MANAGEMENT.md](docs/features/LICENSE_MANAGEMENT.md) - Entitlements, allocations, cost tracking
- [SERVICE_MANAGEMENT.md](docs/features/SERVICE_MANAGEMENT.md) - Service catalog and SLA monitoring
- [GOVERNANCE_SYSTEM.md](docs/features/GOVERNANCE_SYSTEM.md) - SAMA compliance and verification campaigns
- [INTUNE_INTEGRATION.md](docs/features/INTUNE_INTEGRATION.md) - Microsoft Intune/MDM sync

**Foundation & Assets:**
- [FOUNDATION_LAYER.md](docs/guides/FOUNDATION_LAYER.md) - Complete guide to 12 foundation entities
- [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md) - SAR base with dual currency display
- [WARRANTY_SYSTEM.md](docs/features/WARRANTY_SYSTEM.md) - Warranty tracking and renewal alerts
- [MAINTENANCE_SYSTEM.md](docs/features/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules

**Cross-Cutting:**
- [RBAC_ADMIN_GUIDE.md](docs/features/RBAC_ADMIN_GUIDE.md) - Managing roles and permissions
- [FEATURE_FLAGS.md](docs/features/FEATURE_FLAGS.md) - Module toggles with dependency validation
- [GLOBAL_SEARCH.md](docs/features/GLOBAL_SEARCH.md) - Command palette (⌘K) implementation
- [ENTITY_REGISTRY.md](docs/features/ENTITY_REGISTRY.md) - 20 entities supporting custom fields

### Operations & Deployment

**CI/CD Pipeline (Kubernetes):**
- [GITLAB_CI_SETUP.md](docs/deployment/GITLAB_CI_SETUP.md) - GitLab CI/CD setup with GitOps and ArgoCD
- [BUILD_STEPS.md](docs/deployment/BUILD_STEPS.md) - Detailed build process and pipeline stages
- [KUBERNETES_OPERATIONS.md](docs/deployment/KUBERNETES_OPERATIONS.md) - Day-to-day K8s operations and kubectl commands

**Operations:**
- [AUTOMATED_DEPLOYMENT.md](docs/operations/AUTOMATED_DEPLOYMENT.md) - Alternative PM2-based deployment (on-premises)
- [DATABASE_MIGRATIONS.md](docs/guides/DATABASE_MIGRATIONS.md) - Migration best practices
- [TechHub-Risk-Assessment.md](docs/operations/TechHub-Risk-Assessment.md) - Security risk assessment

### User Guides

- [USER_GUIDE_2FA.md](docs/guides/USER_GUIDE_2FA.md) - Two-factor authentication setup

---

## Internal Use Only

**Built by**: Barq Technology Operations
**Purpose**: SAMA-compliant IT asset management and configuration tracking
**Deployment**: On-premises at Barq facilities (dev, UAT, prod) for data sovereignty
**Support**: Contact TechHub team for assistance
**Documentation**: See [docs/README.md](docs/README.md) for complete index

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), [shadcn/ui](https://ui.shadcn.com/)
- Architecture inspired by Clean Architecture and Domain-Driven Design principles
- Supports Barq's compliance with SAMA (Saudi Central Bank) regulatory requirements
