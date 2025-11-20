# Build Optimization Guide

This guide explains how to optimize build performance and analyze your production bundle.

## Build Scripts

### Standard Build (Enhanced)

```bash
npm run build
```

- Full type checking
- Production optimizations
- Enhanced progress indicators
- Build timing and statistics
- **Time:** ~10s

### Fast Build (Development)

```bash
npm run build:fast
```

- **Skips TypeScript checking** for faster iteration
- Production optimizations enabled
- Use when you've already type-checked separately
- **Time:** ~3s (70% faster!)

⚠️ **Warning:** Always run full `npm run build` before deploying to production!

### Bundle Analysis

```bash
npm run build:analyze
```

Runs a custom Turbopack-compatible bundle analyzer that provides:

- Total build size breakdown (server + client code)
- Static assets size (what users actually download)
- Top 10 largest JavaScript chunks with color-coded warnings
- Size recommendations and optimization tips

**Sample Output:**

```
📊 Bundle Size Analysis
─────────────────────────────────────────
  Total build:        352.31 MB
  Static assets:      3.20 MB (downloaded by users)
  JavaScript chunks:  2.92 MB

✓ Static bundle size is good!

Top 10 Largest Chunks
  1. 3441-2de20b307bf81ab1.js ─ 994.37 KB  (red: >200KB)
  2. aaea2bcf-449d119d39e3115d.js ─ 317.76 KB
  ...
```

**What to Look For:**

- **Static assets <5MB:** Good overall performance
- **Red chunks (>200KB):** Investigate and consider code splitting
- **Yellow chunks (100-200KB):** Monitor as you add features
- **Top chunk >500KB:** May contain large dependencies to optimize

**Note:** This custom tool works with Turbopack builds. The standard `@next/bundle-analyzer` doesn't support Turbopack yet and requires Webpack (causing compatibility issues with server-only packages).

### Quiet Build

```bash
npm run build:quiet
```

- Standard Next.js build without enhancements
- Useful for CI/CD pipelines
- Minimal output

## Performance Optimization Strategies

### 1. TypeScript Build Optimization

**Incremental Builds:**
TypeScript now uses incremental compilation with `.next/cache/tsbuildinfo.json`. This speeds up subsequent builds by:

- Caching type information between builds
- Only re-checking changed files
- Reusing previous compilation results

**Parallel Type Checking:**
Run type checking in a separate terminal during development:

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Type checking in watch mode
npm run type-check:watch
```

This allows you to:

- Get immediate type feedback while coding
- Use `npm run build:fast` for quick production builds
- Separate type checking from build process

### 2. Bundle Size Optimization

#### Analyzing Your Bundle

Run bundle analyzer to identify large dependencies:

```bash
npm run build:analyze
```

**What to look for:**

1. **Large dependencies** (>100KB)
   - Can they be lazy-loaded?
   - Are there lighter alternatives?
   - Is the entire library needed?

2. **Duplicate dependencies**
   - Multiple versions of the same package
   - Similar libraries doing the same thing

3. **Server-only code in client bundles**
   - Database clients (Prisma)
   - Node.js-only packages
   - Already handled via `serverExternalPackages` in `next.config.ts`

#### Common Optimizations

**Lazy Loading Components:**

```typescript
// Instead of:
import { HeavyComponent } from './HeavyComponent';

// Use dynamic import:
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

**Code Splitting by Route:**
Next.js automatically code-splits by route. Heavy features should be in separate routes when possible.

**Tree Shaking:**

- Use named imports: `import { specific } from 'library'`
- Avoid `import * as lib from 'library'`
- Mark side-effect-free packages in `package.json`

### 3. Current Bundle Configuration

**Server External Packages:**
These packages are excluded from client bundles (see `next.config.ts`):

- `@prisma/client` - Database client
- `bullmq`, `ioredis` - Queue and cache
- `pino`, `pino-pretty` - Logging
- `inversify`, `reflect-metadata` - Dependency injection
- `better-auth` - Authentication

**When to add more:**
Add server-only dependencies to `serverExternalPackages` if you see them in client bundle analysis.

### 4. Development vs Production

**Development Build (`npm run dev`):**

- Uses Turbopack (700x faster than Webpack)
- Hot module replacement
- No optimization (for faster reloads)
- Source maps enabled

**Production Build (`npm run build`):**

- Uses Turbopack by default (Next.js 16+)
- Full TypeScript checking
- Code minification
- Tree shaking
- Bundle optimization
- Static generation

**Bundle Analysis Build (`npm run build:analyze`):**

- Uses Webpack (required for bundle analyzer)
- Slower than Turbopack builds (~2-3x)
- Generates interactive bundle reports
- Use monthly or when investigating bundle size issues

## Build Performance Monitoring

### Timing Breakdown

Current build performance (production):

```
┌─────────────────────────────────┐
│  📦 Build Phases               │
├─────────────────────────────────┤
│  Compilation:      ~2s          │
│  TypeScript:       ~7s          │
│  Page Collection:  ~0.5s        │
│  Static Gen:       ~0.4s        │
│  Finalization:     ~0.01s       │
├─────────────────────────────────┤
│  Total:            ~10s         │
└─────────────────────────────────┘
```

**Bottleneck:** TypeScript checking (70% of build time)

**Solutions:**

1. Use `npm run build:fast` when iterating
2. Run `npm run type-check:watch` in parallel during development
3. TypeScript incremental builds help on subsequent builds

### CI/CD Optimization

**Recommended CI/CD pipeline:**

```yaml
# Parallel jobs for faster CI
jobs:
  type-check:
    - npm run type-check

  lint:
    - npm run lint

  test:
    - npm run test

  build:
    needs: [type-check, lint, test]
    - npm run build:fast  # Skip type check (already done)
```

This runs type checking, linting, and tests in parallel, then builds fast since type checking is already verified.

## Cache Optimization

### Next.js Build Cache

Location: `.next/cache/`

**What's cached:**

- Compiled pages and components
- Image optimization results
- TypeScript build info
- Webpack/Turbopack compilation

**Tips:**

- Don't delete `.next/cache` unless debugging
- CI/CD should restore cache between builds
- Typical cache size: 50-200MB

**CI Cache Configuration:**

```yaml
# GitHub Actions example
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

## Troubleshooting

### Build is Slower Than Expected

1. **Clear cache and rebuild:**

   ```bash
   rm -rf .next
   npm run build
   ```

2. **Check for large dependencies:**

   ```bash
   npm run build:analyze
   ```

3. **Verify TypeScript cache is working:**

   ```bash
   # First build (slower)
   npm run build

   # Second build should be faster
   npm run build
   ```

### Type Checking Takes Too Long

1. **Use incremental builds** (already enabled in `tsconfig.json`)
2. **Exclude unnecessary files** from `tsconfig.json`
3. **Use `skipLibCheck: true`** (already enabled)
4. **Run type checking separately** with `npm run type-check:watch`

### Bundle Size Growing

1. **Run analyzer regularly:**

   ```bash
   npm run build:analyze
   ```

2. **Check for unnecessary imports:**

   ```bash
   # Find unused dependencies
   npx depcheck
   ```

3. **Review Radix UI usage:**
   - Import specific components: `@radix-ui/react-dialog`
   - Don't import from barrel files

## Best Practices

✅ **DO:**

- Use `npm run build:fast` during development iteration
- Run `npm run build:analyze` monthly to check bundle size
- Keep TypeScript cache (`.next/cache/tsbuildinfo.json`)
- Use dynamic imports for heavy components
- Run full `npm run build` before production deploys

❌ **DON'T:**

- Delete `.next/cache` unless debugging
- Skip type checking in production builds
- Import entire libraries when you need one function
- Bundle server-only code in client bundles
- Ignore bundle analyzer warnings

## Additional Resources

- [Next.js Build Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [Bundle Analysis Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
