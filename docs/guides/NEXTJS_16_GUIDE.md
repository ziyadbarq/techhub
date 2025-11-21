# Next.js 16 Guide

Complete guide for working with Next.js 16 in this project, including async request APIs, rendering modes, Turbopack, and migration patterns.

## Table of Contents

- [Next.js 16 Overview](#nextjs-16-overview)
- [Breaking Changes](#breaking-changes)
- [Async Request APIs](#async-request-apis)
- [Rendering Modes](#rendering-modes)
- [Client vs Server Components](#client-vs-server-components)
- [Turbopack](#turbopack)
- [Proxy Convention](#proxy-convention)
- [Migration Guide](#migration-guide)
- [Common Errors and Solutions](#common-errors-and-solutions)
- [Best Practices](#best-practices)

## Next.js 16 Overview

### What's New in Next.js 16

This project uses **Next.js 16.0** with major changes:

- **Turbopack is now default**: No `--turbopack` flag needed
- **React 19.2 integrated**: Latest React features built-in
- **Async Request APIs fully enforced**: Breaking change for `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- **Proxy Convention**: New `proxy.ts` replaces `middleware.ts`
- **Improved build performance**: Faster builds and better tree-shaking

### Tech Stack Integration

- **Next.js 16.0**: App Router with Turbopack
- **React 19.2**: New hooks (useActionState, useFormStatus, useOptimistic)
- **TypeScript 5.9**: Strict mode with path aliases
- **Turbopack**: Default bundler (replaces Webpack)

## Breaking Changes

### 1. Async Request APIs (CRITICAL)

**All dynamic request APIs must now be awaited:**

| API            | Old (Next.js 15) | New (Next.js 16) | Status      |
| -------------- | ---------------- | ---------------- | ----------- |
| `params`       | Sync object      | `Promise<T>`     | ⚠️ BREAKING |
| `searchParams` | Sync object      | `Promise<T>`     | ⚠️ BREAKING |
| `cookies()`    | Sync function    | Async function   | ⚠️ BREAKING |
| `headers()`    | Sync function    | Async function   | ⚠️ BREAKING |
| `draftMode()`  | Sync function    | Async function   | ⚠️ BREAKING |

**Impact**: All server components using these APIs must be updated.

**See**: [Async Request APIs](#async-request-apis) for detailed migration.

### 2. Turbopack Default

**Change**: Turbopack is now the default bundler; `--turbopack` flag removed.

**Before (Next.js 15)**:

```json
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}
```

**After (Next.js 16)**:

```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```

**Impact**: Existing `--turbopack` flags in scripts should be removed.

### 3. Proxy Convention

**Change**: `middleware.ts` deprecated in favor of `proxy.ts`.

**Migration**:

- Rename `middleware.ts` → `proxy.ts`
- Rename export: `middleware()` → `proxy()`
- Update imports if needed

**See**: [Proxy Convention](#proxy-convention) for details.

## Async Request APIs

### Overview

Next.js 16 fully enforces async request APIs. **All dynamic request APIs must be awaited.**

### Server Components with params/searchParams

#### ❌ Old Pattern (Next.js 15)

```typescript
// This will cause runtime errors in Next.js 16!
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Error: Cannot access property of Promise
  // ...
}
```

#### ✅ New Pattern (Next.js 16)

```typescript
// Correct: params and searchParams are Promises
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const id = params.id;
  const query = searchParams.query;
  // ...
}
```

**Key Points**:

- `params` is now `Promise<T>`
- `searchParams` is now `Promise<T>`
- Must await both before accessing properties
- Applies to pages, layouts, route handlers

### Server Components with cookies/headers

#### ❌ Old Pattern (Next.js 15)

```typescript
import { cookies, headers } from "next/headers";

export async function MyServerComponent() {
  const cookieStore = cookies(); // Error in Next.js 16!
  const headersList = headers(); // Error in Next.js 16!

  const token = cookieStore.get("token");
  // ...
}
```

#### ✅ New Pattern (Next.js 16)

```typescript
import { cookies, headers } from "next/headers";

export async function MyServerComponent() {
  const cookieStore = await cookies();
  const headersList = await headers();

  const token = cookieStore.get("token");
  const userAgent = headersList.get("user-agent");
  // ...
}
```

**Key Points**:

- `cookies()` must be awaited
- `headers()` must be awaited
- `draftMode()` must be awaited
- APIs return Promises in Next.js 16

### Client Components (Unchanged)

Client components use hooks, which are **not async** and don't require changes:

```typescript
"use client";

import { useParams, useSearchParams } from "next/navigation";

export function MyClientComponent() {
  const params = useParams(); // No await needed
  const searchParams = useSearchParams(); // No await needed

  const id = params.id;
  const query = searchParams.get("query");
  // ...
}
```

**Key Points**:

- Client components use hooks (unchanged)
- `useParams()` and `useSearchParams()` are not async
- No migration needed for client components

### Route Handlers

Route handlers also require await for request APIs:

```typescript
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const cookieStore = await cookies();
  const headersList = await headers();

  const id = params.id;
  const token = cookieStore.get("token");
  const auth = headersList.get("authorization");

  // ... route handler logic
}
```

### Layouts and Templates

Layouts and templates follow the same pattern:

```typescript
// app/[id]/layout.tsx
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { id } = await params;

  // ... layout logic

  return <div>{children}</div>;
}
```

## Rendering Modes

### Dynamic vs Static Rendering

Next.js 16 continues to support both dynamic and static rendering, but enforces stricter rules.

### Force Dynamic Rendering

**When to use**: If a page/layout/template uses any of:

- `cookies()`
- `headers()`
- `getSession()` or `requireAuth()` (project-specific)
- Permission helpers (project-specific)
- Any dynamic request API

**How to force**:

```typescript
// app/(dashboard)/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  // ...
}
```

**Why**: Prevents `Dynamic server usage` build failures.

**Default for**:

- New dashboard pages
- New auth pages
- Root app layout (if using auth/sessions)

### Suspense Boundaries

**Components using `useSearchParams()` must be wrapped in `Suspense`**:

```typescript
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SearchComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchComponent />
    </Suspense>
  );
}
```

**Why**: Satisfies CSR (Client-Side Rendering) bailout rule.

## Client vs Server Components

### Server Components (Default)

**Use when**:

- Fetching data from server
- Accessing databases/APIs directly
- Using server actions
- Rendering without interactivity

**Example**:

```typescript
// Server component (default)
export default async function Page() {
  const session = await getSession();
  const data = await fetchData();

  return <div>{data.title}</div>;
}
```

**Benefits**:

- Can use server actions
- Faster initial load
- Smaller bundle size
- Direct database/API access

### Client Components

**Use when**:

- Need interactivity (onClick, onChange, etc.)
- Using React hooks (useState, useEffect, etc.)
- Need browser APIs (localStorage, window, etc.)
- Need real-time updates

**Example**:

```typescript
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  const params = useParams();

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Rules**:

- Must include `'use client'` directive at top
- Cannot import server-only modules
- Cannot use server actions directly (must call via server components)
- Cannot use `cookies()`, `headers()`, etc.

### Composition Pattern

**Best practice**: Compose server and client components:

```typescript
// app/page.tsx (Server Component)
import { ClientComponent } from "@/components/client-component";

export default async function Page() {
  const session = await getSession();
  const data = await fetchData();

  return (
    <div>
      <h1>Server-rendered: {data.title}</h1>
      <ClientComponent initialData={data} userId={session.user.id} />
    </div>
  );
}
```

```typescript
// components/client-component.tsx (Client Component)
"use client";

import { useState } from "react";

export function ClientComponent({ initialData, userId }: Props) {
  const [data, setData] = useState(initialData);

  // Interactive logic...

  return <div>{/* Interactive UI */}</div>;
}
```

## Turbopack

### Default Bundler

Turbopack is now the default bundler in Next.js 16:

- **No configuration needed**: Works out of the box
- **Faster builds**: Up to 10x faster than Webpack
- **Better HMR**: Instant hot module replacement
- **Smaller bundles**: Improved tree-shaking

### Development

```bash
npm run dev  # Uses Turbopack by default (no --turbopack flag)
```

### Production Builds

```bash
npm run build  # Uses Turbopack for optimization
```

### Bundle Analysis

For bundle size analysis (Turbopack-compatible):

```bash
npm run build:analyze
```

**See**: [BUILD_OPTIMIZATION.md](BUILD_OPTIMIZATION.md) for complete build guide.

### Server External Packages

Prevent server-only dependencies from being bundled in client:

```typescript
// next.config.ts
export default {
  serverExternalPackages: [
    "@prisma/client",
    "bullmq",
    "ioredis",
    "pino",
    "pino-pretty",
    "inversify",
    "reflect-metadata",
  ],
};
```

**When to add**: New server-only dependencies (database drivers, job queues, etc.).

## Proxy Convention

### Migration from middleware.ts

Next.js 16 introduces `proxy.ts` to replace `middleware.ts`:

#### ❌ Old Pattern (middleware.ts)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware logic
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

#### ✅ New Pattern (proxy.ts)

```typescript
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Proxy logic (same as middleware)
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Changes**:

- Rename file: `middleware.ts` → `proxy.ts`
- Rename function: `middleware()` → `proxy()`
- Config remains the same

### Automatic Migration

Use the official codemod:

```bash
npx @next/codemod@latest middleware-to-proxy .
```

**Note**: `middleware.ts` still works but will be removed in future versions.

## Migration Guide

### Automatic Migration

Next.js provides codemods for automatic migration:

#### Migrate Async Request APIs

```bash
npx @next/codemod@latest next-async-request-api .
```

**What it does**:

- Updates `params` and `searchParams` to Promises
- Adds `await` for `cookies()`, `headers()`, `draftMode()`
- Updates type annotations

#### Migrate Middleware to Proxy

```bash
npx @next/codemod@latest middleware-to-proxy .
```

**What it does**:

- Renames `middleware.ts` to `proxy.ts`
- Renames `middleware()` to `proxy()`
- Preserves config and logic

### Manual Migration Checklist

1. **Update params/searchParams in pages**

   ```typescript
   // Before
   async function Page({ params }: { params: { id: string } }) {
     const id = params.id;
   }

   // After
   async function Page(props: { params: Promise<{ id: string }> }) {
     const { id } = await props.params;
   }
   ```

2. **Update cookies/headers calls**

   ```typescript
   // Before
   const cookieStore = cookies();

   // After
   const cookieStore = await cookies();
   ```

3. **Add dynamic export where needed**

   ```typescript
   export const dynamic = "force-dynamic";
   ```

4. **Wrap useSearchParams in Suspense**

   ```typescript
   <Suspense fallback={<Loading />}>
     <ComponentWithSearchParams />
   </Suspense>
   ```

5. **Remove --turbopack flags**

   ```json
   // Before
   "dev": "next dev --turbopack"

   // After
   "dev": "next dev"
   ```

6. **Migrate middleware.ts to proxy.ts** (if applicable)

## Common Errors and Solutions

### Error: "Cannot access property of Promise"

**Cause**: Accessing `params` or `searchParams` without await.

**Solution**:

```typescript
// ❌ Wrong
const id = params.id;

// ✅ Correct
const { id } = await props.params;
```

### Error: "Dynamic server usage: cookies/headers"

**Cause**: Using dynamic APIs without force-dynamic export.

**Solution**:

```typescript
// Add to top of file
export const dynamic = "force-dynamic";
```

### Error: "useSearchParams() should be wrapped in a suspense boundary"

**Cause**: Client component using `useSearchParams()` without Suspense wrapper.

**Solution**:

```typescript
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentWithSearchParams />
    </Suspense>
  );
}
```

### Error: "Module has no exports"

**Cause**: Using value imports for type-only modules with Turbopack.

**Solution**:

```typescript
// ❌ Wrong
import { IRepository } from "@/core/repositories/...";

// ✅ Correct
import type { IRepository } from "@/core/repositories/...";
```

**See**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for type-only imports.

### Build Error: "Page is using dynamic APIs"

**Cause**: Page uses dynamic APIs but isn't marked as dynamic.

**Solution**:

```typescript
// Add to page file
export const dynamic = "force-dynamic";
```

## Best Practices

### ✅ DO

1. **Always await params and searchParams in server components**

   ```typescript
   const params = await props.params;
   const searchParams = await props.searchParams;
   ```

2. **Always await cookies(), headers(), draftMode()**

   ```typescript
   const cookieStore = await cookies();
   const headersList = await headers();
   ```

3. **Use hooks in client components (not async)**

   ```typescript
   const params = useParams(); // No await
   const searchParams = useSearchParams(); // No await
   ```

4. **Set dynamic = "force-dynamic" for auth/session pages**

   ```typescript
   export const dynamic = "force-dynamic";
   ```

5. **Wrap useSearchParams in Suspense**

   ```typescript
   <Suspense fallback={<Loading />}>
     <ComponentWithSearchParams />
   </Suspense>
   ```

6. **Use server components by default**
   - Only add `'use client'` when needed
   - Compose server and client components

7. **Use type-only imports**

   ```typescript
   import type { IRepository } from "@/core/repositories/...";
   ```

8. **Run codemods for migration**
   ```bash
   npx @next/codemod@latest next-async-request-api .
   ```

### ❌ DON'T

1. **Don't access params/searchParams without await**

   ```typescript
   // ❌ Wrong
   const id = params.id;
   ```

2. **Don't call cookies()/headers() without await**

   ```typescript
   // ❌ Wrong
   const cookieStore = cookies();
   ```

3. **Don't make client component hooks async**

   ```typescript
   // ❌ Wrong - useParams() is not async
   const params = await useParams();
   ```

4. **Don't skip dynamic export for dynamic pages**

   ```typescript
   // ❌ Wrong - Missing dynamic export
   export default async function Page() {
     const session = await getSession();
   }
   ```

5. **Don't use --turbopack flag**

   ```bash
   # ❌ Wrong (Next.js 16)
   next dev --turbopack

   # ✅ Correct
   next dev
   ```

6. **Don't import server modules in client components**

   ```typescript
   // ❌ Wrong
   "use client";
   import { prisma } from "@/infrastructure/database/prisma/client";
   ```

7. **Don't use value imports for types**

   ```typescript
   // ❌ Wrong
   import { IRepository } from "@/core/repositories/...";

   // ✅ Correct
   import type { IRepository } from "@/core/repositories/...";
   ```

## Related Documentation

- [Developer Guide](DEVELOPER_GUIDE.md) - Complete development guide
- [Build Optimization](BUILD_OPTIMIZATION.md) - Build performance and Turbopack
- [Architecture Guide](../architecture/ARCHITECTURE.md) - Clean Architecture patterns
- [React 19 Patterns](DEVELOPER_GUIDE.md#react-19-patterns) - New React hooks
- [RBAC Developer Guide](RBAC_DEVELOPER_GUIDE.md) - Permission patterns

## Quick Reference

### Server Component Template (Next.js 16)

```typescript
// app/example/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Force dynamic rendering for auth/sessions
export const dynamic = "force-dynamic";

export default async function Page(props: PageProps) {
  // Await params and searchParams
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Await cookies/headers
  const cookieStore = await cookies();
  const headersList = await headers();

  // Access properties
  const id = params.id;
  const query = searchParams.query;

  // Fetch data
  const session = await getSession();
  const data = await fetchData(id);

  return <div>{/* Server-rendered UI */}</div>;
}
```

### Client Component Template (Next.js 16)

```typescript
// components/example-component.tsx
"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export function ExampleComponent() {
  // Use hooks (not async)
  const params = useParams();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);

  // Access properties
  const id = params.id;
  const query = searchParams.get("query");

  // Interactive logic
  const handleClick = () => {
    setState(newState);
  };

  return <div onClick={handleClick}>{/* Interactive UI */}</div>;
}

// Wrap in Suspense when using useSearchParams
export function PageWithSearch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExampleComponent />
    </Suspense>
  );
}
```

### Route Handler Template (Next.js 16)

```typescript
// app/api/example/[id]/route.ts
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Await params
  const params = await context.params;

  // Await cookies/headers
  const cookieStore = await cookies();
  const headersList = await headers();

  // Access properties
  const id = params.id;
  const token = cookieStore.get("token");
  const auth = headersList.get("authorization");

  // Route handler logic
  const data = await fetchData(id);

  return NextResponse.json({ data });
}
```
