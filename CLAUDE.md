This file provides high-level guidance when working with this repository.

## IMPORTANT: Maintaining This File

**CLAUDE.md is a lean orchestrator, NOT a reference manual.** When updating this file, strictly adhere to these principles:

1. **Lean & Focused**: Keep content high-level with references to detailed docs - target ~250 lines maximum
2. **Better Organization**: Group related patterns by category (Framework, Security, Architecture, Feature-Specific)
3. **No Redundancy**: Each piece of information appears ONCE with references to detailed documentation
4. **No Outdated Info**: NEVER add progress tracking, completion dates, metrics, status indicators (✅, ⏳, 🚧), or percentage improvements
5. **Easy Navigation**: Maintain clear hierarchy with proper cross-references to detailed docs
6. **Maintainable**: Changes to detailed docs should NOT require CLAUDE.md updates

**What to do when adding new features**: Add 1-2 line summary with reference to detailed doc. NO code examples, implementation details, or status tracking.

**What belongs in CLAUDE.md**: Essential patterns, critical rules, quick command reference, links to detailed documentation, and high-level architecture overview.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**: Layer 1 (12 foundation entities), Layer 2 (9 asset/inventory entities), Layer 3 (10 modules with ~35 entities including CMDB, License Management, Service Management, and Intune Integration). See [docs/README.md](docs/README.md) for complete feature documentation.

## Quick Commands

```bash
# IMPORTANT: NEVER run `npm run dev` - user manages the dev server

# Initial Setup
npm run db:seed        # production preset (config/reference only)
npm run db:seed:dev    # dev preset (full demo data)
# Create first admin via /register, then assign system-administrator role via Prisma Studio or SQL

# Development
npm run validate # Type-check + lint + test

# Build & Deploy
npm run build         # Production build (type-check + lint + build)
npm run build:fast    # Fast build (skips TypeScript)
npm run deploy        # Full deployment: build → migrate → seed (if empty) → cache clear → PM2 start

# Database
npm run db:reset      # Reset database + seed (drops all data!)
npx prisma studio     # Visual DB editor
# See docs/guides/PRISMA_GUIDE.md for migrations, schema, and troubleshooting

# Local Docker Testing
./scripts/dev/docker-local.sh           # Fast: Build on host + package in Docker (~32s)
docker compose up --build               # Full: Complete production build in Docker (~20-30min)
docker compose -f docker-compose.local.yml down  # Stop fast build containers
docker compose logs app -f              # Follow app logs
# See docs/deployment/LOCAL_DOCKER_TESTING.md for setup and troubleshooting

# Admin Tools & Scripts
# See scripts/README.md for user management, backups, and deployment tools
```

## CI/CD Pipeline

**Platform**: GitLab CI (http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub)
**Deployment**: GitOps via ArgoCD (OCI + GCP clouds)
**Duration**: ~12-15 minutes (typical workflow with cache)
**Local Testing**: Use `./scripts/dev/docker-local.sh` for fast Docker testing (~32s, matches CI approach) or `docker compose up --build` for full production build testing (see LOCAL_DOCKER_TESTING.md)

```bash
# View pipeline status
# GitLab UI > CI/CD > Pipelines

# Automatic deployment to OCI production (main branch)
# Push to main → builds image → updates values-dev.yaml → ArgoCD syncs

# Automatic deployment to GCP dev (develop branch)
# Push to develop → builds image → updates values-gcpdev.yaml → ArgoCD syncs

# Manual build only (no deployment)
# GitLab UI > CI/CD > Pipelines > Run pipeline > set type=build_only

# Image promotion (dev → uat/test/perf)
# GitLab UI > CI/CD > Pipelines > [Pipeline] > promote-to-uat-oci > Play

# Check K8s deployments (via kubectl or ArgoCD UI)
kubectl get pods -n istio-dev -l app=techhub              # OCI production
kubectl get pods -n horizontal-services -l app=techhub    # GCP development
```

**Pipeline Stages**: Validate (type-check, lint, tests) → Build & Deploy (Kaniko, GitOps) → Image Promotion (manual)

**GitOps Workflow**: CI updates values.yaml in deployment-configs repo → ArgoCD monitors repo → Automatically syncs to K8s

**Deployment Targets**:
- OCI Cloud: `istio-dev` namespace (production, auto-deploy from main)
- GCP Cloud: `horizontal-services` namespace (development, auto-deploy from develop)

**UI-Selectable Variables**: type (build_only/build_and_deploy), CLOUD (oci/gcp), npm_migration (true/false)

See **[docs/deployment/LOCAL_DOCKER_TESTING.md](docs/deployment/LOCAL_DOCKER_TESTING.md)** for local Docker testing, **[docs/deployment/GITLAB_CI_SETUP.md](docs/deployment/GITLAB_CI_SETUP.md)** for CI/CD setup, [docs/deployment/BUILD_STEPS.md](docs/deployment/BUILD_STEPS.md) for build process, and [docs/deployment/KUBERNETES_OPERATIONS.md](docs/deployment/KUBERNETES_OPERATIONS.md) for K8s operations.

## Documentation

### Essential Reading (Start Here)

- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide, adding features, troubleshooting
- **[TABLE_COMPONENTS_GUIDE.md](docs/guides/TABLE_COMPONENTS_GUIDE.md)** - Table standardization: hooks, components, migration recipes
- **[PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)** - Critical: Connection pool, imports, type-safe patterns
- **[NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)** - Critical: Async APIs, rendering, breaking changes
- **[STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)** - Breaking changes reference (Prisma 7, Next 16, Zod 4, etc.)
- **[DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md)** - Comprehensive seed system guide: architecture, factories, configuration

See **[docs/README.md](docs/README.md)** for full documentation index (Architecture, Guides, Features, Infrastructure, Roadmap).

## Critical Patterns (AI Must Know)

### Framework Patterns (ALWAYS Follow)

**Prisma**:
- Default `@/generated/prisma` is browser-safe (types + enums), use anywhere
- Server code needing `PrismaClient`: `import from "@/generated/prisma/server"`
- Use singleton from `@/infrastructure/database/prisma/client` (NOT new instances)
- NEVER import from `@prisma/client` (ESLint enforced)
- See [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md) for schema, migrations, and detailed patterns

**Prisma Migrations**: Edit `.prisma` files → `npx prisma migrate dev --name change_name` → `npm run db:generate`. NEVER create migrations manually, use `db push`, or `migrate resolve --applied`. See [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md).

**Next.js 16 Async APIs**:
- ALWAYS await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- Server: `const params = await props.params;` | Client: `useParams()` (no await)
- Set `dynamic = "force-dynamic"` for pages using auth/session
- Use `proxy.ts` at project root (NOT `middleware.ts`)
- See [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)

**Type Safety & UI**:
- Use `import type` for type-only imports (ESLint enforced)
- Use Sonner toast: `toast.success("Message")` (NOT shadcn useToast)
- Add `"use no memo";` directive to TanStack Table components
- Use centralized utilities: `formatDate()`, `getStatusBadgeClasses()`

**Client-Side Session**:
- In dashboard: use `useSessionContext()` from `@/contexts/session-context`
- Outside dashboard: use `authClient.getSession()` in useEffect

**Client-Side Permissions & Feature Flags**:
- Use `usePermissions()` hook - delegates to `PermissionsProvider` context
- Use `useIsFeatureEnabled("FLAG")` hook - delegates to `FeatureFlagsProvider` context

### Security Patterns (ALWAYS Enforce)

**Route Protection** (CRITICAL):
- ALL protected routes MUST have server-side `requirePermission()` - client checks can be bypassed
- Pattern: Server component checks permissions → returns client component
- Add `export const dynamic = "force-dynamic"` to protected pages
- Register new routes in `protected-routes.ts` configuration
- Defense in depth: (1) Server component, (2) Server actions, (3) Client hooks (UX only)
- Cross-module data: gate each fetch by feature flag + permission to avoid leaking presence

**Permission Checking**:
- Check permissions at server action layer: `await requirePermission(PERMISSIONS.ENTITY_VIEW);`
- 269 permissions in 14 groups - see [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md)

**Feature Flags** (Order Matters):
- Check feature flag FIRST: `await requireFeature("MODULE")`
- Then permission check SECOND: `await requirePermission(PERMISSIONS.X_VIEW)`

**File Upload Security**: Validate MIME whitelist, extension whitelist, and magic number detection. See [attachment.entity.ts](src/core/domain/entities/attachment.entity.ts).

**Rate Limiting**: Better Auth handles auth endpoints. Use existing `ioredis` package with `rate-limiter-flexible` for application-level rate limiting (NOT @upstash packages).

### Architecture Patterns (ALWAYS Follow)

**Logging** (CRITICAL):
- NEVER use `console.log` - inject DI logger: `@inject(DI_TOKENS.ILoggerService)`
- Use `@LogExecution('operation.name')` decorator on use case execute() methods
- Request context (requestId, userId, path) auto-included; sensitive data auto-redacted

**Database Seeding**:
- Fully idempotent: Never wipes data, safe to run repeatedly
- Config in `seed-config.ts`, factories in `seed-factories/`. See [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md)

**Barrel Exports**:
- CRITICAL: Create `index.ts` in use case modules (pre-commit fails without them)
- See [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature"

**Better Auth**: Use repository layer for user creation (NOT Better Auth API). SSO requires pre-existing active Person record.

**Dependency Injection**:
- Three-tier modular system: CORE (14 modules), DASHBOARD (11 modules), HEAVY (4 modules, lazy loaded)
- Resolve dependencies: `getContainer().get(DI_TOKENS.ServiceName)`, never use `new`
- See [DI_MODULARIZATION.md](docs/architecture/DI_MODULARIZATION.md)

**ID Generation**:
- CUID2-based centralized service via DI: `IIdGenerator` interface, `CuidIdGeneratorService` implementation
- Entities: `Entity.create(props, idGenerator)` for code-generated IDs
- DTOs: Validate internal IDs with `z.string().min(24).max(25)` (CUID2), external system IDs with `z.string().uuid()` (Azure AD)
- See [ID_GENERATION.md](docs/architecture/ID_GENERATION.md)

### Feature-Specific Patterns

For specialized features, see dedicated guides:
- **Multi-Currency**: [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md) - SAR base, dual display with `<CurrencyDisplay>`
- **Custom Fields**: [CUSTOM_FIELDS_COMPLETION.md](roadmap/CUSTOM_FIELDS_COMPLETION.md) - `useCategoryFields()`, Asset.attributes JSON
- **Data Import**: [UNIVERSAL_ASSETS_IMPORTER.md](docs/features/UNIVERSAL_ASSETS_IMPORTER.md) - Prefixed columns, auto-entity creation
- **Entity Registry**: [ENTITY_REGISTRY.md](docs/features/ENTITY_REGISTRY.md) - 20 entities across 7 categories
- **Refactoring**: [REFACTORING_PATTERNS.md](docs/guides/REFACTORING_PATTERNS.md) - Extract when files exceed 300-500 lines
- **End-User Docs**: [DOCUMENTATION_SYSTEM.md](docs/guides/DOCUMENTATION_SYSTEM.md) - MDX in `src/content/docs/`, configure plugins in components (runtime)

## Architecture Overview

5-layer Clean Architecture: **Presentation** → **Interface Adapters** (Controllers, DTOs, Presenters, Queries) → **Use Cases** → **Domain** (Entities, business rules) ← **Infrastructure** (Repositories, external services)

**Query Layer**: View composers in `src/interface-adapters/queries/` aggregate data from use cases with DataLoader batching to prevent N+1 queries. Pilot implementations: stock movements (10x faster), asset reservations (30x faster).

**See**: [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for complete diagrams, data flow, and [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature" for step-by-step implementation guide.

## Development Workflow

1. **Study existing patterns** - Review similar completed features to learn established patterns before implementing
2. **Understand the slice** - Trace Presentation → Controllers → Use Cases → Repositories
3. **Use DI container** - Resolve via `getContainer()`/`resolve()`, never `new`
4. **Check permissions** - Use `requirePermission()` in server actions
5. **Validate early** - DTOs (Zod) at boundaries, entities for business rules
6. **Use structured logging** - Inject `ILoggerService`, never `console.log`
7. **Before committing** - Run `npm run validate` (type-check + lint + test)

## Adding New Features - Quick Checklist

When adding a new feature, follow these steps in order:

### 1. Architecture Setup
- [ ] Add Prisma model to appropriate `prisma/schema/*.prisma` file
- [ ] Run `npx prisma migrate dev --name feature_name && npm run db:generate`
- [ ] Create entity in `src/core/domain/entities/`
- [ ] Create repository interface + Prisma implementation
- [ ] Create use cases in `src/core/use-cases/{feature}/`
- [ ] **CRITICAL**: Create barrel export (`index.ts`) in use case folder

### 2. DI & Controllers
- [ ] Register in DI container (`container.ts`)
- [ ] Create controller with server actions (`{feature}.controller.ts`)

### 3. Security (Defense in Depth)
- [ ] Define permissions in `permission-key.ts` + add to seed
- [ ] **Feature flag FIRST**: `await requireFeature("MODULE")`
- [ ] **Permission SECOND**: `await requirePermission(PERMISSIONS.X_VIEW)`
- [ ] Add `export const dynamic = "force-dynamic"` to page
- [ ] Register route in `protected-routes.ts`
- [ ] Add to navigation sidebar in routes manifest + run `npm run generate:routes`
- [ ] Test with viewer account to verify access denial

### 4. Logging & Validation
- [ ] Use `@LogExecution('feature.operation')` decorator on use cases
- [ ] Inject `ILoggerService` via DI (never `console.log`)
- [ ] Run `npm run validate` before committing

See [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature" for detailed walkthrough.

## Developer Notifications

Send push notifications via `mcp__pushover-mcp__send` tool for:
- **New features**: Completing significant new functionality
- **Refactoring**: Major code restructuring or architecture changes
- **Debugging**: Resolving complex bugs after extended investigation
- **Planning complete**: Ready for implementation approval

Keep messages concise with relevant context.

## Environment

**Platform**: macOS only (PostgreSQL and Redis run natively via Homebrew). **Docker NOT used**.

**Environment Variables**: Copy `.env.example` to `.env.local`
- Required: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`
- Debug: `PRISMA_VERBOSE_LOGS=true`, `AUTH_DEBUG_LOGS=true`, `LOG_LEVEL=debug`
- Config Server (optional): `CONFIG_SERVER_URL`, `SPRING_PROFILE` - See instrumentation.ts for Spring Cloud Config integration

## Git Workflow

**Dual Remote Setup**: Repository uses two remotes for backup and CI/CD
- `origin` → GitHub (https://github.com/azzuwayed/barq-assets.git) - Backup repository
- `gitlab` → GitLab (git@gitlab.dev.baraq.com.internal:baraq-engineering/webdev/techhub.git) - CI/CD trigger

**Workflow**: Always commit locally first, then push to both remotes. Pushing to `gitlab` remote triggers CI/CD pipeline.

```bash
# Check commit status (ahead/behind remotes)
git status

# Push to both remotes
git push origin main    # Backup to GitHub
git push gitlab main    # Trigger CI/CD pipeline on GitLab

# Check remote configuration
git remote -v
```

## Naming Conventions

- Controllers: `*.controller.ts` | DTOs: `*.dto.ts` | Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts` | Repositories: `prisma-*.repository.ts`
- Interfaces: `*.interface.ts` | Seeders: `seed-*.ts`
- Scripts: Organized in `scripts/` subdirectories
- MDX: `*.mdx` in `src/content/docs/` | MDX Components: `*.tsx` in `src/components/mdx/`

See [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) for database naming conventions.

## Adding New Scripts

See [scripts/README.md](scripts/README.md) for script organization, technology standards (`@inquirer/prompts` v8+, Prisma singleton, structured logging), and complete guide.

## Documentation Organization

**Archive to `docs/archive/`**: Completed implementations, status indicators (✅, ⏳, 🚧), phase reports

**Delete**: Duplicates and files that only reference others

See [docs/README.md](docs/README.md) for structure and complete index.
