# VS Code Workspace Configuration

This directory contains the ultimate VS Code workspace configuration for the Barq Assets project, optimized for Clean Architecture, Next.js 16, React 19, TypeScript 5.9, Prisma 7, and InversifyJS development.

## 🚀 Quick Start

### 1. Install Recommended Extensions

When you open this workspace in VS Code, you'll see a notification to install recommended extensions. Click **"Install All"** or install them manually from the Extensions panel (`Cmd+Shift+X` / `Ctrl+Shift+X`).

**Essential Extensions (Must Install):**
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- TypeScript Importer

**Recommended Extensions (Highly Beneficial):**
- Thunder Client (API testing)
- Error Lens (inline errors)
- Vitest (test runner)
- Database Client (PostgreSQL)
- Path Intellisense
- Import Cost

### 2. Configure TypeScript

VS Code will prompt you to use the workspace TypeScript version. Click **"Allow"** or **"Always Allow"** to enable workspace TypeScript (v5.9) with decorator support for InversifyJS.

### 3. Verify Setup

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "TypeScript: Select TypeScript Version"
3. Choose "Use Workspace Version"

## 📁 Configuration Files

### `settings.json`
Workspace settings optimized for:
- **Performance**: Large codebase with 100+ use cases, 82 repositories
- **TypeScript**: Auto-imports, decorator support, strict checking
- **Formatting**: Prettier on save, ESLint integration
- **Navigation**: File nesting, custom associations, smart exclusions
- **Tailwind**: Class autocomplete, CVA support

### `extensions.json`
23 recommended extensions covering:
- Core development (Prisma, ESLint, Prettier, Tailwind)
- React & Next.js (snippets, auto-rename, MDX)
- Git & collaboration (GitLens, Git Graph)
- Code quality (Error Lens, SonarLint, Vitest)
- Productivity (Project Manager, Todo Tree, Import Cost)

### `tasks.json`
Quick access to common commands:
- **Start Dev Server** (`Cmd+Shift+D`)
- **Type Check** (`Cmd+Shift+T`)
- **Validate (Type + Lint + Test)** (`Cmd+Shift+V`)
- **Prisma Studio** (`Cmd+Shift+P`)
- Run Tests, Seed Database, Clear Cache, Migration Status, Drift Check

### `launch.json`
Debug configurations for:
- Next.js server-side debugging
- Next.js client-side debugging
- Full stack debugging (compound)
- Vitest current file
- Vitest all tests

### `typescript.json`
Code snippets for Clean Architecture patterns:
- **usecase** - Use Case with DI and logging decorator
- **repo** - Prisma Repository implementation
- **dto** - Zod DTO schema
- **controller** - Controller with DI
- **serveraction** - Server Action with permission check
- **pageclient** - Page Client Component
- **featureflag** - Feature flag check
- **permcheck** - Permission check

### `typescriptreact.json`
React-specific snippets:
- **rsc** - React Server Component
- **rcc** - React Client Component
- **rhform** - Form with React Hook Form and Zod

## ⚡ Quick Commands

### Running Tasks
Press `Cmd+Shift+P` (or `Ctrl+Shift+P`) and type "Tasks: Run Task", then choose:

- **Start Dev Server** - Start Next.js dev server with Turbopack
- **Type Check** - Run TypeScript type checking
- **Validate** - Run type check + lint + tests (default build task)
- **Prisma Studio** - Open Prisma Studio for database management
- **Prisma Generate** - Regenerate Prisma client
- **Seed Database (Dev)** - Seed database with dev data
- **Clear Cache** - Clear Next.js and build cache
- **Migration Status** - Check Prisma migration status
- **Drift Check** - Check for database schema drift

### Using Code Snippets

In TypeScript files (`.ts`):
1. Type `usecase` and press `Tab` - Creates a Use Case with DI and logging
2. Type `repo` and press `Tab` - Creates a Prisma Repository
3. Type `dto` and press `Tab` - Creates a Zod DTO schema
4. Type `controller` and press `Tab` - Creates a Controller with DI
5. Type `serveraction` and press `Tab` - Creates a Server Action with permissions
6. Type `featureflag` and press `Tab` - Adds feature flag check
7. Type `permcheck` and press `Tab` - Adds permission check

In React files (`.tsx`):
1. Type `rsc` and press `Tab` - Creates a React Server Component
2. Type `rcc` and press `Tab` - Creates a React Client Component
3. Type `rhform` and press `Tab` - Creates a form with React Hook Form

### Navigation Shortcuts

**File Search (`Cmd+P` / `Ctrl+P`):**
- `*.use-case.ts` - Find all use cases
- `*-page-client.tsx` - Find all client page components
- `*.dto.ts` - Find all DTOs
- `prisma-*.repository.ts` - Find all repositories
- `*.controller.ts` - Find all controllers

**Symbol Search (`Cmd+T` / `Ctrl+T`):**
- Search by class name: `CreateAssetUseCase`
- Search by interface: `IAssetRepository`
- Search by type: `AssetDTO`

**Workspace Search (`Cmd+Shift+F` / `Ctrl+Shift+F`):**
```
@injectable()      - Find all DI-registered classes
@LogExecution      - Find all logged operations
requirePermission  - Find all permission checks
requireFeature     - Find all feature flag checks
```

**Layer-Specific Search:**
```
folder:src/core/use-cases              - Use cases only
folder:src/infrastructure/repositories - Repositories only
folder:src/interface-adapters          - Controllers, DTOs, etc.
folder:src/components                  - Components only
```

## 🎨 File Nesting

The workspace uses smart file nesting to reduce clutter:
- Test files nest under source files (e.g., `foo.test.ts` nests under `foo.ts`)
- Client pages nest under server pages (e.g., `*-page-client.tsx` nests under `page.tsx`)
- DTOs nest under use cases (e.g., `foo.dto.ts` nests under `foo.use-case.ts`)
- Config files nest under main files (e.g., `.env.local` nests under `.env`)

To toggle file nesting: `Cmd+Shift+P` → "File Nesting: Toggle File Nesting"

## 🐛 Debugging

### Debug Next.js Application

1. **Server-Side Debugging:**
   - Press `F5` or click "Next.js: debug server-side" in Debug panel
   - Set breakpoints in server components, API routes, or server actions
   - Open http://localhost:3000 in browser

2. **Client-Side Debugging:**
   - Click "Next.js: debug client-side" in Debug panel
   - Set breakpoints in client components or hooks
   - Browser will open automatically

3. **Full Stack Debugging:**
   - Click "Next.js: debug full stack (compound)"
   - Debug both server and client simultaneously

### Debug Vitest Tests

1. **Current File:**
   - Open a test file
   - Click "Vitest: Current File" in Debug panel
   - Set breakpoints in test file

2. **All Tests:**
   - Click "Vitest: All Tests" in Debug panel
   - Runs entire test suite with debugger attached

## 📊 Extension Features

### Thunder Client (API Testing)
- Right-click in Explorer → "New HTTP Request"
- Test API routes without leaving VS Code
- Create collections for common requests
- Set environment variables for different environments

### Database Client (PostgreSQL)
- Click Database icon in sidebar
- Connect to local PostgreSQL (from `.env.local`)
- Browse schema, run queries, view data
- Export/import data

### GitLens (Git Insights)
- Hover over code to see Git blame
- Click line annotations to see commit details
- View repository insights and file history
- Compare branches and commits

### Error Lens (Inline Diagnostics)
- See errors and warnings inline (no need to hover)
- Color-coded by severity
- Instant visibility of issues

### Import Cost (Bundle Size)
- See package size inline when importing
- Helps optimize bundle size
- Color-coded: green (small), yellow (medium), red (large)

## 🔧 Customization

### Personal Settings
Keep these in your **User Settings** (not workspace):
- Theme preferences
- Font size and family
- Keyboard shortcuts
- Personal snippets

### Workspace Settings
Committed to repo (shared with team):
- Code formatting rules
- TypeScript configuration
- ESLint rules
- File associations
- Extension recommendations

## 📈 Performance Tips

1. **Large Codebase Optimization:**
   - TypeScript server memory: 8GB (already configured)
   - Excluded folders: `.next/`, `node_modules/`, `src/generated/`
   - File watchers optimized

2. **Extension Management:**
   - Disable unused extensions per workspace
   - Monitor: `Cmd+Shift+P` → "Developer: Show Running Extensions"
   - Use Extension Bisect to find performance issues

3. **Search Performance:**
   - Use specific glob patterns when searching
   - Leverage folder-specific search
   - Exclude generated files

## 🆘 Troubleshooting

### TypeScript Errors Not Showing
1. Verify workspace TypeScript version: `Cmd+Shift+P` → "TypeScript: Select TypeScript Version"
2. Restart TS Server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Check `.vscode/settings.json` for correct `typescript.tsdk`

### Prettier Not Formatting
1. Check default formatter: Should be `esbenp.prettier-vscode`
2. Verify `editor.formatOnSave` is `true`
3. Check for Prettier config conflicts

### Extensions Not Loading
1. Reload window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Check extension errors: `Cmd+Shift+P` → "Developer: Show Extension Logs"
3. Verify extensions are enabled for workspace

### Tasks Not Running
1. Check `tasks.json` syntax
2. Verify npm scripts exist in `package.json`
3. Check terminal shell configuration

### Code Snippets Not Working
1. Verify file extension matches snippet scope (`.ts` for typescript.json)
2. Check IntelliSense is enabled: `editor.quickSuggestions` should be `true`
3. Try triggering manually: `Cmd+Space` after typing prefix

## 📚 Additional Resources

- **Project Docs:** [/docs](/docs) - Developer guides and architecture docs
- **VS Code Docs:** https://code.visualstudio.com/docs
- **Next.js 16:** https://nextjs.org/docs/app/getting-started/installation
- **Prisma:** https://www.prisma.io/docs/orm/tools/prisma-vscode
- **TypeScript:** https://code.visualstudio.com/docs/languages/typescript

## 🤝 Team Collaboration

### Sharing Configuration
All `.vscode/` files are committed to the repo for team consistency. When onboarding:

1. Clone repo
2. Open in VS Code
3. Install recommended extensions
4. Accept workspace TypeScript version
5. Start coding!

### Updating Configuration
When adding new patterns or improving setup:

1. Update relevant `.vscode/` files
2. Test changes locally
3. Document in this README
4. Commit and push
5. Notify team in Slack/Teams

### Extension Recommendations
Before recommending a new extension:

1. Test for 1-2 weeks
2. Verify it doesn't conflict with existing setup
3. Check performance impact
4. Add to `extensions.json`
5. Update this README

## 📝 Maintenance

**Monthly:**
- Review extension updates
- Update snippets based on new patterns
- Monitor performance

**Quarterly:**
- Prune unused extensions
- Update documentation
- Share productivity tips with team

**Annually:**
- Major configuration review
- Align with framework updates
- Team retrospective on tooling

---

## 🎯 Expected Benefits

- **20-30% faster development** - Snippets, auto-imports, AI assistance
- **50% fewer context switches** - Integrated API testing, database client
- **Better code quality** - Real-time linting, type checking, import cost
- **Easier onboarding** - Consistent setup, documented patterns
- **Enhanced collaboration** - Git insights, shared configuration

---

**Created:** December 2025
**Version:** 1.0.0
**Maintainer:** Development Team
