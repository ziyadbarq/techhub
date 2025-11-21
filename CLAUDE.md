# CLAUDE.md

This file provides high-level guidance to Claude Code when working with this repository.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **Layer 1 (Foundation)**: 11 core entities - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions
- **Layer 2 (Asset/Inventory)**: 9 entities - Asset, AssetCategory, AssetModel, AssetAssignment, StockLocation, StockMovement, Warranty, MaintenanceSchedule, MaintenanceRecord
- **Reference**: Task entity (complete implementation, hidden from UI)
- **Marketing**: Public landing page showcasing system capabilities

## Quick Commands

```bash
npm run setup    # One-command setup (install + schema + seed)
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

npm run build       # Production build
npm run build:fast  # Fast build (skips TypeScript)

npm run reset # Reset database + seed (drops all data!)
```

## Documentation

### Essential Reading (Start Here)

- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide, adding features, troubleshooting
- **[PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)** - Critical: Connection pool, imports, type-safe patterns
- **[NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)** - Critical: Async APIs, rendering, breaking changes
- **[STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)** - Breaking changes reference (Prisma 7, Next 16, Zod 4, etc.)

### Architecture & Design

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation, layer diagrams
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [LAYER_1_IMPLEMENTATION.md](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Foundation Layer technical details

### Development Guides

- [ENTITY_REFERENCE.md](docs/guides/ENTITY_REFERENCE.md) - Entity quick reference, validation standards
- [FOUNDATION_LAYER.md](docs/guides/FOUNDATION_LAYER.md) - Foundation entities user guide
- [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [DATABASE_MIGRATIONS.md](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow
- [LOGGING.md](docs/guides/LOGGING.md) - Structured logging with Pino
- [BUILD_OPTIMIZATION.md](docs/guides/BUILD_OPTIMIZATION.md) - Turbopack, bundle analysis

### Asset Layer (Layer 2)

- [WARRANTY_SYSTEM.md](docs/WARRANTY_SYSTEM.md) - Complete warranty management implementation (reference for Asset layer features)
- [MAINTENANCE_SYSTEM.md](docs/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules and records with workflow state management

### Marketing & Public Pages

- **Landing Page**: `app/(marketing)/page.tsx` - Public marketing page at `/` showcasing system capabilities
- **Route Structure**: Unauthenticated users see landing page, authenticated users auto-redirect to `/dashboard`
- **Components**: `components/marketing/` - Reusable marketing components (hero, features, FAQ, etc.)
- **Styling**: Barq brand colors (yellow `#ffda00`, light blue `#dff5f7`), dark mode support, Framer Motion animations

### In-App Documentation (MDX)

The application includes a built-in documentation system at `/docs` for end-user guidance:

**Architecture**:

- **Content**: MDX files in `src/content/docs/` with YAML frontmatter (title, description, icon, order)
- **Renderer**: Dynamic route at `app/(dashboard)/docs/[slug]/page.tsx` using `next-mdx-remote/rsc`
- **Components**: Custom MDX components in `components/mdx/` (Card, Callout, CodeBlock with copy button)
- **Plugins**: GFM, syntax highlighting (rehype-highlight), auto-heading links (rehype-slug, rehype-autolink-headings)
- **Styling**: Tailwind prose classes with custom @layer rules in `globals.css`

**Current Documentation Pages**:

- `/docs/getting-started` - Foundation layer and data management basics
- `/docs/entities` - Complete entity reference (Layer 1 + Layer 2)
- `/docs/workflows` - Common workflows and guides
- `/docs/admin-guide` - RBAC and user management

**Key Files**:

- `src/lib/mdx.ts` - Utilities for reading/parsing MDX files
- `src/components/mdx/mdx-components.tsx` - Custom component mappings
- `src/components/mdx/code-block.tsx` - Enhanced code block with copy button
- `src/app/(dashboard)/docs/layout.tsx` - Documentation layout with sidebar

**IMPORTANT**: MDX plugins are configured in the component (NOT `next.config.ts`) for Turbopack compatibility. The config only sets `pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"]` for future compatibility.

### Dashboards & Analytics

- **Dashboard**: `app/(dashboard)/dashboard/page.tsx` - Main analytics dashboard with widgets (metrics, task queue, activity feed, quick actions)
- **Analytics**: `app/(dashboard)/analytics/page.tsx` - Asset analytics and charts (renamed from `/assets-dashboard`)
- **Widgets**: `components/dashboard/widgets/` - Reusable dashboard components
- **Reports**: `app/(dashboard)/reports/page.tsx` - Custom reports and data exports

### All Documentation

See [docs/README.md](docs/README.md) for complete documentation index.

## Critical Patterns (AI Must Know)

### Prisma Usage

**ALWAYS** import from `@/generated/prisma` (NOT `@prisma/client`):

```typescript
import type { PrismaClient, Prisma, Asset } from "@/generated/prisma";
```

**ALWAYS** use singleton from `client.ts` (NOT new instances):

```typescript
import { prisma } from "@/infrastructure/database/prisma/client";
```

**See**: [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md) for complete patterns.

### Next.js 16 Async APIs

**ALWAYS** await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`

```typescript
// Server components
const params = await props.params;
const cookieStore = await cookies();

// Client components use hooks (not async)
const params = useParams(); // No await
```

**Set `dynamic = "force-dynamic"`** for pages using auth/session.

**See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) for migration guide.

### Next.js 16 Proxy Convention

**IMPORTANT**: Next.js 16 uses `proxy.ts` instead of `middleware.ts`

```typescript
// proxy.ts (at project root)
export async function proxy(request: NextRequest) {
  // Request interception logic
  return NextResponse.next();
}
```

**Key Points**:

- File location: `proxy.ts` at **project root** (NOT in src/)
- Export function named `proxy()` (NOT `middleware()`)
- Existing proxy handles auth redirect + landing page routing
- Do NOT create new middleware.ts or modify proxy.ts without checking existing logic

**See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) section "Proxy Convention"

### Type Safety

**ALWAYS** use `import type` for type-only imports (ESLint enforces this):

```typescript
import type { IRepository } from "@/core/repositories/...";
```

### Permissions

**ALWAYS** check permissions at server action layer:

```typescript
await requirePermission(PERMISSIONS.ASSETS.UPDATE);
```

**See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md)

### Logging

**NEVER** use `console.log` - use DI logger:

```typescript
constructor(@inject(DI_TOKENS.ILoggerService) private logger: ILoggerService) {}
```

**See**: [LOGGING.md](docs/guides/LOGGING.md)

### MDX Documentation

**ALWAYS** configure MDX plugins in the component, NOT in `next.config.ts`:

```typescript
// ✅ CORRECT: In component (app/(dashboard)/docs/[slug]/page.tsx)
<MDXRemote
  source={content}
  components={customComponents}
  options={{
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight, rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
    },
  }}
/>

// ❌ WRONG: In next.config.ts with withMDX wrapper (breaks Turbopack)
const withMDX = createMDX({ options: { remarkPlugins: [...] } });
export default withMDX(nextConfig);
```

**MDX Content Files**:

- Store in `src/content/docs/` with `.mdx` extension
- Include YAML frontmatter: `title`, `description`, `icon`, `order`
- Use custom components: `<Card>`, `<Callout type="info|warning|error|success">`

**See**: `src/lib/mdx.ts` for utilities, `src/components/mdx/` for custom components

## Architecture Overview

**Clean Architecture Layers**:

1. **Presentation** - Next.js pages, React components
2. **Interface Adapters** - Controllers (server actions), DTOs, Presenters
3. **Use Cases** - Application business logic
4. **Domain** - Entities, business rules
5. **Infrastructure** - Prisma repositories, external services

**Adding Features** - Follow layer-by-layer approach:

1. Domain entity
2. Repository interface
3. Use cases + **barrel export** (`index.ts`)
4. Infrastructure repository
5. DI registration
6. Controllers
7. DTOs/Presenters
8. UI components
9. Routes

**See**: [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature" for detailed walkthrough with code examples.

## Development Workflow

1. **Understand the slice** - Trace Presentation → Controllers → Use Cases → Repositories
2. **Use DI container** - Resolve via `getContainer()`/`resolve()`, never `new`
3. **Check permissions** - Use `requirePermission()` in server actions
4. **Validate early** - DTOs (Zod) at boundaries, entities for business rules
5. **Use structured logging** - Inject `ILoggerService`, never `console.log`
6. **Before committing** - Run `npm run validate` (type-check + lint + test)

## Critical Checklist

### ✅ DO

- Import Prisma from `@/generated/prisma`
- Use Prisma singleton from `client.ts`
- Await async request APIs (`params`, `cookies()`, etc.)
- Use `import type` for type-only imports
- Check permissions in server actions
- Create barrel exports for new use case modules
- Use DI logger (not `console.log`)
- Validate at boundaries
- Follow Clean Architecture layers
- Configure MDX plugins in components (runtime), not next.config.ts (build-time)

### ❌ DON'T

- Import from `@prisma/client` (causes TypeScript errors)
- Create new `Pool()` or `PrismaClient()` instances (exhausts connections)
- Access `params`/`searchParams` synchronously (runtime errors in Next.js 16)
- Create `middleware.ts` (use existing `proxy.ts` instead - Next.js 16 convention)
- Use `withMDX` wrapper in next.config.ts (breaks Turbopack serialization)
- Skip permission checks
- Forget barrel exports for use case modules (breaks pre-commit)
- Use `console.log` in server code
- Bypass architecture layers
- Use Docker (macOS native only)

## Environment

**Platform**: macOS only (PostgreSQL and Redis run natively via Homebrew)
**Docker**: NOT used in this project

**Environment Variables**: Copy `.env.example` to `.env.local`

- Required: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`
- Optional: `PRISMA_VERBOSE_LOGS=true`, `AUTH_DEBUG_LOGS=true`, `LOG_LEVEL=debug`

## Naming Conventions

- Controllers: `*.controller.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Repositories: `prisma-*.repository.ts`
- Interfaces: `*.interface.ts`
- MDX Content: `*.mdx` (in `src/content/docs/`)
- MDX Components: `*.tsx` (in `src/components/mdx/`)

**See**: [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) for database naming conventions.
