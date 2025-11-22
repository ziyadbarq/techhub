# Stack Upgrades Reference

Documentation of major stack upgrades and breaking changes in this project (November 2025). This guide serves as a historical reference for breaking changes and migration patterns.

## Table of Contents

- [Overview](#overview)
- [Prisma 7.0](#prisma-70)
- [Zod 4.1](#zod-41)
- [Next.js 16.0](#nextjs-160)
- [React 19.2.0](#react-1920)
  - [TanStack Table v8 Incompatibility](#5-tanstack-table-v8-incompatibility)
- [InversifyJS 7.10](#inversifyjs-710)
- [@types/node 24.x](#typesnode-24x)
- [Migration Timeline](#migration-timeline)

## Overview

This project underwent major stack upgrades in November 2025, adopting the latest versions of core dependencies. All breaking changes have been addressed in the codebase.

**Upgrade Summary**:

| Package     | Old Version | New Version | Impact Level   |
| ----------- | ----------- | ----------- | -------------- |
| Prisma      | 6.x         | 7.0         | 🔴 High        |
| Zod         | 3.x         | 4.1         | 🟡 Medium      |
| Next.js     | 15.x        | 16.0        | 🔴 High        |
| React       | 18.x        | 19.2        | 🟡 Medium      |
| InversifyJS | 6.x         | 7.10        | 🟠 Medium-High |
| @types/node | 20.x        | 24.x        | 🟢 Low         |

## Prisma 7.0

### Overview

Prisma 7.0 introduces the new Rust-free client with significant performance improvements and breaking changes.

### Key Changes

#### 1. Rust-Free Client with PostgreSQL Adapter

**Change**: New client architecture using `@prisma/adapter-pg`

**Benefits**:

- 90% smaller bundle size
- 3x faster queries
- Better Node.js integration

**Migration**:

```typescript
// Old (Prisma 6.x)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// New (Prisma 7.0)
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**⚠️ Important**: Always use the singleton from [src/infrastructure/database/prisma/client.ts](../../src/infrastructure/database/prisma/client.ts)

#### 2. Explicit Output Path Required

**Change**: Schema generator now requires explicit `output` path

**Migration**:

```prisma
// Old (Prisma 6.x)
generator client {
  provider = "prisma-client-js"
}

// New (Prisma 7.0)
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
  engineType = "client"
}
```

**Benefits**:

- `engineType = "client"` enables Rust-free client
- Explicit output path for better tooling support
- Consistent generated client location

#### 3. Import Path Change

**Change**: Import from generated barrel export instead of `@prisma/client`

**Migration**:

```typescript
// Old (Prisma 6.x)
import type { PrismaClient } from "@prisma/client";

// New (Prisma 7.0)
import type { PrismaClient } from "@/generated/prisma";
```

**Why**: Generated client includes schema-specific types and model delegates.

**See**: [PRISMA_GUIDE.md](PRISMA_GUIDE.md) for complete Prisma patterns.

## Zod 4.1

### Overview

Zod 4.1 introduces breaking API changes for better type safety and consistency.

### Key Changes

#### 1. String Validation Methods Moved

**Change**: Common string validators moved to top-level functions

**Migration**:

```typescript
// Old (Zod 3.x)
z.string().email();
z.string().uuid();
z.string().datetime();

// New (Zod 4.1)
z.email();
z.uuid();
z.datetime();
```

**Impact**: All email/UUID/datetime validations need updating.

#### 2. Date Coercion

**Change**: Date coercion now uses `z.coerce.date()`

**Migration**:

```typescript
// Old (Zod 3.x)
z.string().datetime();

// New (Zod 4.1)
z.coerce.date();
```

#### 3. Error Handling

**Change**: `error.errors` renamed to `error.issues`

**Migration**:

```typescript
// Old (Zod 3.x)
try {
  schema.parse(data);
} catch (error) {
  console.log(error.errors);
}

// New (Zod 4.1)
try {
  schema.parse(data);
} catch (error) {
  console.log(error.issues);
}
```

#### 4. Record Type

**Change**: `z.record()` now requires explicit key and value types

**Migration**:

```typescript
// Old (Zod 3.x)
z.record(z.string());

// New (Zod 4.1)
z.record(z.string(), z.string());
```

#### 5. Date Configuration

**Change**: `z.date()` now requires configuration object

**Migration**:

```typescript
// Old (Zod 3.x)
z.date();

// New (Zod 4.1)
z.date({ coerce: true });
```

### Updated DTO Patterns

```typescript
// Example DTO with Zod 4.1
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email(), // Changed from z.string().email()
  id: z.uuid(), // Changed from z.string().uuid()
  metadata: z.record(z.string(), z.unknown()), // Now requires explicit types
  createdAt: z.coerce.date(), // Changed from z.string().datetime()
});
```

## Next.js 16.0

### Overview

Next.js 16.0 makes Turbopack the default bundler and fully enforces async request APIs.

### Key Changes

#### 1. Turbopack Default

**Change**: Turbopack is now default; `--turbopack` flag removed

**Migration**:

```json
// Old (Next.js 15)
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}

// New (Next.js 16)
{
  "scripts": {
    "dev": "next dev"
  }
}
```

**Benefits**:

- Up to 10x faster builds
- Better HMR (Hot Module Replacement)
- Improved tree-shaking

#### 2. Async Request APIs (BREAKING)

**Change**: All dynamic request APIs must be awaited

**Affected APIs**:

- `params` → `Promise<T>`
- `searchParams` → `Promise<T>`
- `cookies()` → Async function
- `headers()` → Async function
- `draftMode()` → Async function

**Migration**:

```typescript
// Old (Next.js 15)
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const cookieStore = cookies();
}

// New (Next.js 16)
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const cookieStore = await cookies();
}
```

**Codemod**:

```bash
npx @next/codemod@latest next-async-request-api .
```

**See**: [NEXTJS_16_GUIDE.md](NEXTJS_16_GUIDE.md) for complete migration guide.

#### 3. Proxy Convention

**Change**: `middleware.ts` deprecated, use `proxy.ts`

**Migration**:

```typescript
// Old (Next.js 15) - middleware.ts
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// New (Next.js 16) - proxy.ts
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

**Codemod**:

```bash
npx @next/codemod@latest middleware-to-proxy .
```

**Note**: `middleware.ts` still works but will be removed in future versions.

#### 4. React 19.2 Integration

**Change**: React 19.2 built into Next.js 16

**Benefits**:

- New hooks: `useActionState`, `useFormStatus`, `useOptimistic`
- View Transitions support
- Activity rendering improvements

## React 19.2.0

### Overview

React 19.2 introduces new hooks for forms and optimistic updates, plus the React Compiler.

### Key Changes

#### 1. New Hooks

**Added Hooks**:

- `useActionState`: Form actions with error handling
- `useFormStatus`: Access parent form status
- `useOptimistic`: Optimistic UI updates

**Examples**:

```typescript
// useActionState
import { useActionState } from 'react';

function MyForm() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateData(formData);
      if (error) return error;
      redirect("/success");
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <button disabled={isPending}>Submit</button>
      {error && <p>{error}</p>}
    </form>
  );
}

// useFormStatus
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>Submit</button>;
}

// useOptimistic
import { useOptimistic } from 'react';

function MyComponent({ currentValue, onUpdate }) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);

  const handleUpdate = async (newValue) => {
    setOptimisticValue(newValue);
    await onUpdate(newValue);
  };
}
```

#### 2. React Compiler

**Change**: ESLint plugin for automatic memoization

**Configuration**:

```javascript
// eslint.config.mjs
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
];
```

**Benefits**:

- Automatic memoization suggestions
- Performance optimization recommendations
- React Rules enforcement

#### 3. JSX Namespace Augmentation

**Change**: JSX namespace must be wrapped in module declarations

**Migration**:

```typescript
// Old (React 18.x)
declare namespace JSX {
  interface IntrinsicElements {
    "custom-element": any;
  }
}

// New (React 19.2)
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "custom-element": any;
    }
  }
}
```

**See**: [global.d.ts](../../global.d.ts) for implementation.

#### 4. View Transitions Support

**Added**: Native support for View Transitions API

**Usage**:

```typescript
import { useTransition } from "react";

function MyComponent() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      // State update
    });
  };
}
```

#### 5. TanStack Table v8 Incompatibility

**Issue**: TanStack Table v8 is not compatible with React Compiler

**Affected API**: `useReactTable()` returns functions that cannot be safely memoized

**Symptoms**:

- ESLint warning: `react-hooks/incompatible-library`
- React Compiler skips optimization for table components
- Tables don't re-render when data changes with compiler enabled

**Workaround Applied**:

```typescript
// Add "use no memo" directive to table components
"use client";
"use no memo";

import { useReactTable } from "@tanstack/react-table";

export function MyTable() {
  const table = useReactTable({
    // ... configuration
  });
}
```

**ESLint Configuration**:

```javascript
// eslint.config.mjs
{
  files: [
    "src/components/ui/data-table.tsx",
    "src/components/asset-disposals/asset-disposals-table.tsx",
    // ... other table files
  ],
  rules: {
    "react-compiler/react-compiler": "off",
    "react-hooks/incompatible-library": "off",
  },
}
```

**Affected Components** (9 total):

- `src/components/ui/data-table.tsx`
- `src/components/asset-disposals/asset-disposals-table.tsx`
- `src/components/asset-kits/kit-checkouts-table.tsx`
- `src/components/asset-kits/asset-kits-table.tsx`
- `src/components/asset-reservations/asset-reservations-table.tsx`
- `src/components/ci-classes/ci-classes-table.tsx`
- `src/components/relationship-types/relationship-types-table.tsx`
- `src/components/configuration-items/configuration-items-table.tsx`
- `src/components/ci-relationships/ci-relationships-table.tsx`

**Future Resolution**:

- TanStack Table v9 (in alpha) will fix React Compiler compatibility
- Expected stable release: Q2-Q3 2025
- When upgrading: Remove `"use no memo"` directives and ESLint overrides

**Why This Works**:

- `"use no memo"` is React's official escape hatch for incompatible libraries
- Explicitly tells React Compiler to skip optimizing these components
- Tables work correctly, just without automatic memoization
- No impact on other components in the codebase

**References**:

- GitHub Issue: https://github.com/TanStack/table/issues/5567
- TanStack Table v9 RFC: Addresses React Compiler compatibility

## InversifyJS 7.10

### Overview

InversifyJS 7.10 removes the `interfaces` namespace and simplifies the container API.

### Key Changes

#### 1. Direct Imports

**Change**: Use direct imports instead of `interfaces` namespace

**Migration**:

```typescript
// Old (InversifyJS 6.x)
import { Container, interfaces } from "inversify";
const context: interfaces.Context = ...;
const provider: interfaces.Provider<T> = ...;

// New (InversifyJS 7.10)
import { Container, ResolutionContext, Provider } from "inversify";
const context: ResolutionContext = ...;
const provider: Provider<T> = ...;
```

#### 2. Async Methods

**Change**: Container methods are now async (with `*Sync` alternatives)

**Affected Methods**:

- `load` → async
- `unload` → async
- `rebind` → async
- `unbind` → async

**Migration**:

```typescript
// Old (InversifyJS 6.x)
container.load(module);
container.unload(module);

// New (InversifyJS 7.10) - Async
await container.load(module);
await container.unload(module);

// Or use synchronous alternatives
container.loadSync(module);
container.unloadSync(module);
```

#### 3. Merged Get Methods

**Change**: `getNamed`, `getTagged` merged into `get` with options

**Migration**:

```typescript
// Old (InversifyJS 6.x)
container.getNamed(TYPE, "name");
container.getTagged(TYPE, "tag", "value");

// New (InversifyJS 7.10)
container.get(TYPE, { name: "name" });
container.get(TYPE, { tag: "tag", value: "value" });
```

#### 4. Child Containers

**Change**: Use `new Container({ parent })` instead of `createChild()`

**Migration**:

```typescript
// Old (InversifyJS 6.x)
const childContainer = container.createChild();

// New (InversifyJS 7.10)
const childContainer = new Container({ parent: container });
```

### Updated DI Patterns

```typescript
// Example container setup with InversifyJS 7.10
import { Container, injectable, inject } from "inversify";
import { DI_TOKENS } from "./types";

// Create container
const container = new Container();

// Load modules (async)
await container.load(databaseModule);
await container.load(repositoryModule);

// Get with options
const service = container.get(TYPE, { name: "MyService" });

// Child containers
const childContainer = new Container({ parent: container });
```

## @types/node 24.x

### Overview

Latest Node.js type definitions with improved type coverage.

### Key Changes

#### 1. Enhanced Type Coverage

**Added**: Better types for Node.js APIs

**Benefits**:

- More accurate `fs` promise types
- Better `http`/`https` types
- Improved `process` types
- Enhanced `Buffer` types

#### 2. Compatibility

**Compatible with**: Node.js 18.x, 20.x, 22.x

**No Breaking Changes**: Drop-in replacement for `@types/node` 20.x-23.x

## Migration Timeline

### Pre-Migration (Before November 2025)

- Prisma 6.x
- Zod 3.x
- Next.js 15.x
- React 18.x
- InversifyJS 6.x
- @types/node 20.x

### Migration Process (November 2025)

1. **Phase 1**: Update dependencies

   ```bash
   npm install prisma@7.0 @prisma/client@7.0 @prisma/adapter-pg
   npm install zod@4.1
   npm install next@16.0 react@19.2 react-dom@19.2
   npm install inversify@7.10
   npm install -D @types/node@24
   ```

2. **Phase 2**: Run codemods

   ```bash
   npx @next/codemod@latest next-async-request-api .
   npx @next/codemod@latest middleware-to-proxy .
   ```

3. **Phase 3**: Manual migrations
   - Update Prisma schema (add `output`, `engineType`)
   - Update Prisma imports (`@/generated/prisma`)
   - Update Zod schemas (new API)
   - Update InversifyJS imports (direct imports)

4. **Phase 4**: Testing
   - Run type-check: `npm run type-check`
   - Run linter: `npm run lint`
   - Run tests: `npm run test`
   - Build: `npm run build`

5. **Phase 5**: Documentation
   - Update CLAUDE.md
   - Create migration guides
   - Update README.md

### Post-Migration (Current State)

- ✅ All dependencies updated
- ✅ All breaking changes addressed
- ✅ Tests passing
- ✅ Build successful
- ✅ Documentation updated

## Related Documentation

- [Prisma Guide](PRISMA_GUIDE.md) - Complete Prisma 7 patterns
- [Next.js 16 Guide](NEXTJS_16_GUIDE.md) - Next.js 16 migration and patterns
- [Developer Guide](DEVELOPER_GUIDE.md) - Complete development guide
- [Architecture Guide](../architecture/ARCHITECTURE.md) - Clean Architecture patterns

## Summary

This project successfully migrated to the latest versions of all core dependencies in November 2025. All breaking changes have been addressed, and the codebase is fully compatible with:

- ✅ Prisma 7.0 (Rust-free client)
- ✅ Zod 4.1 (new API)
- ✅ Next.js 16.0 (Turbopack, async APIs)
- ✅ React 19.2 (new hooks)
- ✅ InversifyJS 7.10 (simplified API)
- ✅ @types/node 24.x (enhanced types)

For specific migration patterns, see the related documentation above.
