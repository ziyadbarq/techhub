# Barq Assets

An enterprise **CMDB (Configuration Management Database)** and **IT Asset Management (ITAM)** system built with **Next.js 16**, **Clean Architecture**, and **Dependency Injection**. Provides comprehensive infrastructure for managing IT assets, configuration items, organizational structures, and service dependencies with production-grade RBAC, logging, and real-time capabilities.

## 🚀 Features

### Architecture & Patterns

- ✅ **Clean Architecture** - 5-layer architecture with strict dependency rules
- ✅ **Dependency Injection** - InversifyJS container with type-safe resolution
- ✅ **Repository Pattern** - Interface-based data access abstraction
- ✅ **Use Case Pattern** - Business logic orchestration
- ✅ **Domain-Driven Design** - Entities with business rules and validation

### Technology Stack

- ✅ **Next.js 15** (App Router) + **React 19**
- ✅ **TypeScript** (strict mode)
- ✅ **Tailwind CSS 4** with OKLCH color space
- ✅ **Prisma ORM** (PostgreSQL)
- ✅ **shadcn/ui** (35+ components)
- ✅ **OpenAI** integration with structured outputs
- ✅ **Zod** validation
- ✅ **Vitest** testing framework

### AI Infrastructure

- ✅ **OpenAI Integration** - GPT-5 family models with structured outputs
- ✅ **Extended Prompt Caching** - 24-hour caching for 90% cost savings
- ✅ **Modular Prompt System** - Reusable prompt blocks with compositions
- ✅ **Debug Tracing** - Comprehensive AI operation logging
- ✅ **Cost Tracking** - Token usage and pricing monitoring

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

### Foundation Layer (Layer 1)

Complete implementation of core building blocks for CMDB/ITAM:

- **11 Foundation Entities** - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions
- **Hierarchical Structures** - Self-referencing org units and locations with tree queries
- **Lifecycle Management** - Reusable state machines for CIs, Assets, and Licenses
- **Dynamic Field System** - Meta-model for defining custom attributes
- **55 Use Cases** - Complete CRUD operations with business logic and permission checks
- **Full UI** - TanStack Table, React Hook Form, collapsible navigation

### Asset & Inventory Layer (Layer 2)

Complete IT asset management and inventory tracking:

- **9 Asset Entities** - Asset, AssetCategory, AssetModel, AssetAssignment, Warranty, MaintenanceSchedule, MaintenanceRecord, StockLocation, StockMovement
- **Asset Lifecycle** - Track assets from acquisition through disposal with condition tracking
- **Assignment Workflows** - Wizards for asset assignment and returns with session integration
- **Warranty Management** - Automatic expiration tracking and alerts
- **Preventive Maintenance** - Recurring schedules (weekly/monthly/quarterly/yearly) with work order tracking
- **Inventory Control** - Stock locations, movements (IN/OUT/TRANSFER), and enriched reporting
- **Comprehensive UI** - Dashboard with metrics, CSV import/export, workflow wizards

### RBAC & Security

Complete role-based access control system:

- **Merged Role System** - Single entity for RBAC permissions + organizational job roles
- **Permission Enforcement** - Multi-layer checks (server actions, use cases, UI components, routes)
- **Audit Logging** - Complete audit trail for all entity operations
- **Session Management** - Better Auth integration with automatic Person entity creation

### Reference Implementation

Task entity kept as architectural reference (hidden from UI):

- **Domain Entity** (`Task`) with business logic and validation
- **Complete Layer Implementation** - Shows proper Clean Architecture patterns
- **Use Cases** - Create, List, Get, Update, Delete, Complete with permission checks
- **Server Actions** - Next.js 16 controllers with Zod validation
- **UI Components** - TanStack Table with sorting, filtering, pagination, CSV import/export

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
- **OpenAI API key**

### Installation

```bash
# 1. Clone or navigate to the assets app
cd /Users/abdullahalzuwayed/dev/barq/barq-assets

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, REDIS_URL, and OPENAI_API_KEY

# 4. Initialize database
npm run db:push        # Push Prisma schema to database
npm run db:seed        # Seed RBAC data, Foundation entities, and test data

# 5. Create admin account
npm run admin:create   # Creates admin@admin.com / admin123

# 6. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with admin credentials!

## 📚 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   └── tasks/                    # Task CRUD demo (to be built)
│
├── components/
│   ├── ui/                       # 35+ shadcn/ui components
│   ├── providers/                # Theme, toaster, shortcuts providers
│   └── task/                     # Task UI components (to be built)
│
├── core/                         # Clean Architecture core
│   ├── domain/
│   │   ├── entities/             # Task, PromptBlock entities
│   │   └── errors/               # Domain errors
│   ├── repositories/             # Repository interfaces
│   ├── services/                 # Service interfaces (AI)
│   └── use-cases/
│       └── task/                 # Task CRUD use cases ✅
│
├── di/                           # Dependency Injection
│   ├── container.ts              # InversifyJS container
│   ├── types.ts                  # DI tokens
│   └── modules/                  # Binding modules
│
├── infrastructure/               # External implementations
│   ├── database/prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Database seeder
│   ├── repositories/             # Prisma repository implementations
│   └── services/ai/              # OpenAI service implementations
│
├── interface-adapters/           # Controllers & DTOs
│   ├── controllers/              # Server actions
│   ├── dtos/                     # Zod validation schemas
│   └── presenters/               # Entity to DTO transformers
│
└── lib/                          # Shared utilities
    ├── theme/                    # Theme system (colors, tokens, utils)
    ├── hooks/                    # React hooks
    ├── utils.ts                  # Common utilities
    ├── result.ts                 # Result type
    └── logger.ts                 # Logger
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

# Push schema changes to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Seed database with prompts
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Adding a New Model

1. **Update Prisma schema** (`src/infrastructure/database/prisma/schema.prisma`)
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

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema (dev)
npm run db:migrate       # Create migration (prod)
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

## 🛠️ Customization

### Rename "Barq" Branding

1. Update theme colors in `src/lib/theme/constants.ts`
2. Update Tailwind config in `tailwind.config.ts`
3. Update project name in `package.json`

### Add New Features

Follow the Task CRUD example as a template for your features. The pattern is:

1. Create domain entity with validation
2. Define repository interface
3. Implement Prisma repository
4. Create use cases
5. Build server actions
6. Design UI components

## 📖 Documentation

- **[THEME_SYSTEM.md](docs/THEME_SYSTEM.md)** - Complete theme system guide
- **[ASSETS_STATUS.md](ASSETS_STATUS.md)** - Build status and progress
- **DEVELOPER_GUIDE.md** - Comprehensive development guide (to be created)
- **ARCHITECTURE.md** - Architecture deep dive (to be created)
- **CLAUDE.md** - AI assistant context (to be created)

## 🤝 Contributing

This is a assets app template. Fork it and make it your own!

## 📄 License

MIT License - feel free to use this assets app for any project.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [OpenAI](https://openai.com/)
- Architecture inspired by Clean Architecture principles

---

**Need help?** Check the [ASSETS_STATUS.md](ASSETS_STATUS.md) file for current build status and next steps.

**Ready to build?** Start by exploring the Task CRUD example in `src/core/domain/entities/task.entity.ts` and following the pattern for your own features!
