# Utility Scripts

This directory contains TypeScript and shell scripts to help with development, testing, and maintenance of the Barq App Boilerplate.

## Available Scripts

### 1. Reset Development Environment

**Purpose:** Completely resets your local development environment to a clean state.

**Usage:**

```bash
npm run reset
# or
npx tsx scripts/reset-dev-environment.ts
```

**What it does:**

1. Clears build caches (.next, coverage directories)
2. Drops all database tables
3. Recreates database schema
4. Re-seeds database with default data

**When to use:**

- Starting fresh after major changes
- Testing migrations
- Resolving database inconsistencies
- Preparing for demos
- Cleaning up after experimentation

**Safety:**

- Prompts for confirmation before executing
- Shows what will be deleted and total size
- Cannot be undone - use with caution!

---

### 2. Type Check Staged Files

**Purpose:** Fast TypeScript type-checking for git pre-commit hooks.

**Usage:**

```bash
npm run type-check:staged
# or
bash scripts/type-check-staged.sh
```

**What it does:**

- Gets list of staged TypeScript files from git
- Runs `tsc --noEmit` only on those files
- Skips check if no TypeScript files are staged
- Much faster than checking entire project

**When to use:**

- Automatically runs in git pre-commit hook
- Manual check before committing: `npm run type-check:staged`
- Compare with full check: `npm run type-check` (checks all files)

**Benefits:**

- **10-20x faster** than full project type-check
- Only validates code you're about to commit
- Faster git workflow

---

## Common Workflows

### Starting Fresh

Reset your environment and start clean:

```bash
# Full reset
npm run reset

# Start dev server
npm run dev
```

### Before Committing

The git pre-commit hook automatically:

1. **Phase 1 (Auto-fix):**
   - Runs Prettier formatting
   - Fixes ESLint issues
   - Stages fixed files

2. **Phase 2 (Manual checks):**
   - Type-checks only staged files
   - Fails if type errors exist

You can also run manually:

```bash
# Check what will be validated
npm run type-check:staged

# Fix all issues before commit
npm run format
npm run lint
npm run type-check
```

### Daily Development

```bash
# Standard workflow
npm run dev              # Start development server
npm run type-check       # Full type check
npm run lint             # Lint check
npm run format           # Format code
npm run test             # Run tests

# Database operations
npm run db:push          # Push schema changes
npm run db:seed          # Seed data
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Create migration (production)
```

---

## Script Architecture

All scripts in this directory follow these patterns:

### TypeScript Scripts

- **ES Modules:** Use `import` syntax with `type: "module"` in package.json
- **TypeScript with tsx:** Run with `tsx` for direct execution
- **Shebang:** Include `#!/usr/bin/env tsx` for direct execution
- **Error Handling:** Comprehensive error messages and graceful failures
- **User Feedback:** Progress messages with emoji indicators
- **Validation:** Check prerequisites before executing
- **Safety:** Prompt for confirmation on destructive operations

### Shell Scripts

- **Bash:** Use `/bin/bash` for compatibility
- **Error Handling:** Check exit codes and provide helpful messages
- **Validation:** Verify prerequisites (git, files, etc.)
- **Executable:** Use `chmod +x` to make executable

---

## Development

### Creating New Scripts

1. **Create script file:**

   ```bash
   # TypeScript script
   touch scripts/my-script.ts

   # Shell script
   touch scripts/my-script.sh
   ```

2. **Add shebang:**

   ```typescript
   #!/usr/bin/env tsx
   // For TypeScript scripts
   ```

   ```bash
   #!/bin/bash
   # For shell scripts
   ```

3. **Make executable:**

   ```bash
   chmod +x scripts/my-script.ts
   chmod +x scripts/my-script.sh
   ```

4. **Add npm script** (optional):

   ```json
   {
     "scripts": {
       "my-script": "tsx scripts/my-script.ts"
     }
   }
   ```

5. **Document in this README**

### Best Practices

✅ **DO**:

- Add clear descriptions and usage examples
- Show what the script will do before executing
- Prompt for confirmation on destructive operations
- Provide helpful error messages
- Use emoji indicators for visual feedback
- Make scripts idempotent when possible
- Document prerequisites and dependencies

❌ **DON'T**:

- Execute destructive operations without confirmation
- Assume prerequisites exist (check first)
- Use cryptic error messages
- Hardcode paths or configuration
- Mix concerns (one script, one purpose)

---

## Troubleshooting

### "Permission denied"

```bash
# Make script executable
chmod +x scripts/your-script.ts
```

### "Container not initialized" (TypeScript scripts)

Ensure you import `reflect-metadata` at the top:

```typescript
import "reflect-metadata";
```

### "Command not found: tsx"

```bash
# Install tsx globally (optional)
npm install -g tsx

# Or use npx
npx tsx scripts/your-script.ts
```

### "Database connection failed"

- Check `.env` file exists and has `DATABASE_URL`
- Verify PostgreSQL is running
- Confirm database exists

### Reset script fails

- Ensure PostgreSQL is running
- Check database permissions
- Verify `.env` configuration
- Try running steps manually:
  ```bash
  npm run db:push
  npm run db:seed
  ```

---

## Support

For issues or questions:

1. Check this README for documentation
2. Review the script source code (well-documented)
3. Check [CLAUDE.md](../CLAUDE.md) for project architecture
4. Review [docs/README.md](../docs/README.md) for additional documentation

---

**Last Updated:** 2025-11-19
