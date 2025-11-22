# Database Seeding: Essential vs Demo Mode Separation

**Status**: Planned
**Priority**: Medium
**Complexity**: Small
**Estimated Effort**: 2-3 hours

---

## Overview

Split the database seeding system into two modes to support different use cases and improve developer experience:

- **Essential Mode**: Seeds only the minimum data required for app functionality (RBAC, basic lifecycle, CMDB relationship types)
- **Full Mode**: Seeds all data including rich demo/test data (current behavior)

### Business Requirements

1. **Faster CI/CD**: Reduce test suite execution time by seeding only essential data
2. **Cleaner Testing**: Allow developers to start with minimal data and add what they need
3. **Production-Ready**: Enable production environments to seed essential data without demo/test data
4. **Developer Flexibility**: Quick iteration with minimal seed, full demo experience when needed
5. **Backward Compatibility**: Maintain existing workflows (default behavior unchanged)

### Current Pain Points

- Full seed takes 30-60 seconds (too slow for rapid iteration and CI/CD)
- No way to seed production-ready minimal data
- Test environments polluted with unnecessary demo data
- Developers can't easily distinguish essential vs demo data

---

## Technical Design

### Seed Modes Architecture

#### Mode 1: Essential (New)

```bash
npm run db:seed:essential
```

**Seeds** :

- ✅ RBAC: All permissions (200+), admin role, role-permission assignments
- ✅ Foundation: 1 lifecycle model ("Standard IT Assets"), 2 states (DEPLOYED, RETIRED)
- ✅ CMDB: 10 relationship types (DEPENDS_ON, RUNS_ON, etc.)

  **Execution Time** : ~2-5 seconds (12-30x faster)
  **Total Entities** : ~220 records

#### Mode 2: Full (Current Behavior)

```bash
npm run db:seed  # or npm run db:seed:full
```

**Seeds** :

- ✅ Everything from essential mode
- ✅ Foundation: 8 vendors, 8 org units, 5 locations, 8 persons, 14 fields, transitions
- ✅ Assets: 8 categories, 15 models, 50+ assets, stock, assignments
- ✅ Warranties & Maintenance: Schedules, records (80% coverage)
- ✅ Layer 3 ITAM: Disposals, kits, reservations
- ✅ AI Prompts: 4 blocks, 2 compositions
- ✅ Tasks: 5 example tasks

  **Execution Time** : ~30-60 seconds
  **Total Entities** : ~1000+ records

### Architecture Changes

#### 1. Seed Configuration (`seed-config.ts`)

**Add Type Definitions** :

```typescript
export type SeedMode = "essential" | "full";

export interface SeedModeConfig {
  foundation: {
    lifecycleModels: number;
    lifecycleStates: number;
    vendors: number;
    orgUnits: number;
    locations: number;
    persons: number;
    fieldDefinitions: number;
    transitions: number;
  };
  assets: { enabled: boolean };
  warranties: { enabled: boolean };
  maintenance: { enabled: boolean };
  layer3Itam: { enabled: boolean };
  prompts: { enabled: boolean };
  tasks: { enabled: boolean };
}
```

**Add Mode Configurations** :

```typescript
export const SEED_MODE_CONFIG: Record<SeedMode, SeedModeConfig> = {
  essential: {
    foundation: {
      lifecycleModels: 1,
      lifecycleStates: 2,
      vendors: 0,
      orgUnits: 0,
      locations: 0,
      persons: 0,
      fieldDefinitions: 0,
      transitions: 0,
    },
    assets: { enabled: false },
    warranties: { enabled: false },
    maintenance: { enabled: false },
    layer3Itam: { enabled: false },
    prompts: { enabled: false },
    tasks: { enabled: false },
  },
  full: {
    // All current config values
  },
};
```

#### 2. Seeder Function Signatures

**Update Function Signatures** :

```typescript
// seed-foundation.ts
export async function seedFoundation(
  prisma: PrismaClient,
  mode: SeedMode = "full",
): Promise<SeedResult>;

// Other seeders (return early if mode === 'essential')
export async function seedAssets(
  prisma: PrismaClient,
  mode: SeedMode = "full",
): Promise<SeedResult>;
```

#### 3. Main Orchestrator (`seed.ts`)

**CLI Argument Parsing** :

```typescript
const args = process.argv.slice(2);
const mode: SeedMode = args.includes("--essential") ? "essential" : "full";

console.log(`🌱 Starting database seed in ${mode.toUpperCase()} mode...`);
```

**Conditional Execution** :

```typescript
// Always run (both modes)
await seedRBAC(prisma);
await seedFoundation(prisma, mode);
await seedCMDB(prisma);

// Only in full mode
if (mode === "full") {
  await seedAssets(prisma, mode);
  await seedWarrantiesAndMaintenance(prisma, mode);
  await seedLayer3ITAM(prisma, mode);
  await seedPrompts(prisma, mode);
  // Seed example tasks
}
```

### Schema Changes

**None** - This is a seeding logic change only, no Prisma schema modifications required.

### Component Updates

**None** - This is a backend/infrastructure change only.

### NPM Scripts Updates

**Add to `package.json`** :

```json
{
  "scripts": {
    "db:seed:essential": "tsx src/infrastructure/database/prisma/seed.ts --essential",
    "db:seed:full": "npm run db:seed",
    "setup:minimal": "npm install && npx prisma db push && npm run db:seed:essential"
  }
}
```

**Existing Scripts** (no changes):

- `db:seed` - Default (full mode)
- `setup` - Full setup
- `reset` - Full reset + seed

---

## Implementation Checklist

### Phase 1: Configuration & Types (30 min)

- [ ] Add `SeedMode` type to `seed-config.ts`
- [ ] Add `SeedModeConfig` interface to `seed-config.ts`
- [ ] Add `SEED_MODE_CONFIG` constant with essential and full configs
- [ ] Update existing config to match full mode structure

### Phase 2: Seeder Refactoring (45 min)

- [ ] Update `seed-foundation.ts`:
  - Add `mode` parameter
  - Add conditional logic for essential mode (1 lifecycle, 2 states only)
  - Keep full mode logic unchanged
- [ ] Update `seed-assets.ts`:
  - Add `mode` parameter
  - Return early if `mode === 'essential'`
- [ ] Update `seed-warranties-maintenance.ts`:
  - Add `mode` parameter
  - Return early if `mode === 'essential'`
- [ ] Update `seed-layer3-itam.ts`:
  - Add `mode` parameter
  - Return early if `mode === 'essential'`
- [ ] Update `seed-prompts.ts`:
  - Add `mode` parameter
  - Return early if `mode === 'essential'`

### Phase 3: Orchestrator Updates (15 min)

- [ ] Update `seed.ts`:
  - Add CLI argument parsing (`--essential` flag)
  - Add mode logging to console output
  - Pass mode to `seedFoundation()`
  - Conditionally call other seeders based on mode
  - Update summary logging to show mode

### Phase 4: NPM Scripts (5 min)

- [ ] Add `db:seed:essential` script
- [ ] Add `db:seed:full` alias (for clarity)
- [ ] Add `setup:minimal` script

### Phase 5: Documentation (30 min)

- [ ] Update `docs/guides/DATABASE_SEEDING.md`:
  - Add "Seed Modes" section
  - Document essential vs full mode
  - Add usage examples
  - Update Quick Start to mention modes
- [ ] Update `docs/guides/DEVELOPER_GUIDE.md`:
  - Update "Database Seeding" quick commands
  - Add guidance on when to use each mode
- [ ] Update `CLAUDE.md`:
  - Update "Quick Commands" section
  - Add `setup:minimal` command
  - Add `db:seed:essential` command

### Phase 6: Testing (30 min)

- [ ] Test essential mode:
  - Run `npm run reset`
  - Run `npm run db:seed:essential`
  - Verify app starts successfully
  - Verify login works (admin user from RBAC)
  - Verify navigation renders (no crashes)
  - Check database counts match expected (~220 records)
- [ ] Test full mode:
  - Run `npm run reset`
  - Run `npm run db:seed`
  - Verify all demo data present
  - Check database counts match current behavior (~1000+ records)
- [ ] Test mode switching:
  - Run essential mode
  - Run full mode (should error - duplicate keys)
  - Confirm reset required between mode changes

---

## Testing Strategy

### Unit Tests

**Not Required** - Seeding logic is tested through integration tests

### Integration Tests

**Manual Verification** :

1. Essential mode functional test:
   - App starts without errors
   - Authentication works (admin login)
   - Navigation renders all permitted pages
   - No runtime errors in console
2. Full mode regression test:
   - All current demo data present
   - Entity counts match expectations
   - No changes to existing behavior
3. Performance test:
   - Essential mode: < 10 seconds
   - Full mode: 30-60 seconds (unchanged)

### CI/CD Updates

**Add to GitHub Actions** (future):

```yaml
- name: Test Essential Seed
  run: npm run db:seed:essential

- name: Test Full Seed
  run: npm run reset && npm run db:seed
```

---

## Risk & Considerations

### 1. Maintenance Overhead

**Risk** : Two modes to maintain when schema changes
**Mitigation** :

- Essential mode is minimal (rarely changes)
- Full mode is current behavior (existing maintenance)
- Centralized config in `seed-config.ts`

### 2. Mode Confusion

**Risk** : Developers unsure which mode to use
**Mitigation** :

- Clear documentation with use cases
- Helpful console output showing selected mode
- Descriptive NPM script names

### 3. Essential Mode Incompleteness

**Risk** : Essential mode missing critical data
**Mitigation** :

- Test thoroughly (app must be functional)
- Document what's included/excluded
- Easy to add more if needed

### 4. Backward Compatibility

**Risk** : Breaking existing workflows
**Mitigation** :

- Default behavior unchanged (`npm run db:seed` = full mode)
- All existing scripts work as before
- New scripts are opt-in

### 5. Mode Switching Issues

**Risk** : Running different modes on same DB causes conflicts
**Mitigation** :

- Document that reset is required between mode changes
- Both modes are idempotent independently
- Clear error messages if conflicts occur

---

## Success Criteria

### Functional Requirements

- ✅ Essential mode seeds app to functional state (login works, no crashes)
- ✅ Full mode maintains exact current behavior
- ✅ Both modes are idempotent (can re-run safely)
- ✅ Clear console output shows selected mode and progress

### Performance Requirements

- ✅ Essential mode completes in < 10 seconds
- ✅ Full mode time unchanged (30-60 seconds acceptable)

### Developer Experience

- ✅ Intuitive NPM scripts (`db:seed:essential` is self-explanatory)
- ✅ Documentation clearly explains when to use each mode
- ✅ Examples provided for common workflows

---

## Future Enhancements (Out of Scope)

### Selective Module Seeding

Allow seeding specific modules in isolation:

```bash
npm run db:seed:essential
npm run db:seed:module assets        # Add just assets
npm run db:seed:module layer3-itam   # Add just Layer 3 features
```

### Environment-Based Defaults

Automatically choose mode based on environment:

```typescript
const defaultMode =
  process.env.NODE_ENV === "production" ? "essential" : "full";
```

### Seed Profiles

Predefined combinations for specific use cases:

```bash
npm run db:seed:profile testing   # Essential + minimal assets
npm run db:seed:profile demo      # Essential + full Layer 2
npm run db:seed:profile showcase  # Everything
```

### Seed Data Import/Export

Export seed data as JSON for version control:

```bash
npm run db:seed:export > seed-data.json
npm run db:seed:import seed-data.json
```

---

## Related Documentation

- [DATABASE_SEEDING.md](vscode-webview://0rehr90e1jovobnc17u12f3539dsse3i4s6a0as7kfh5u80fsanh/docs/guides/DATABASE_SEEDING.md) - Current comprehensive seed guide
- [DEVELOPER_GUIDE.md](vscode-webview://0rehr90e1jovobnc17u12f3539dsse3i4s6a0as7kfh5u80fsanh/docs/guides/DEVELOPER_GUIDE.md) - Development workflows
- [PRISMA_GUIDE.md](vscode-webview://0rehr90e1jovobnc17u12f3539dsse3i4s6a0as7kfh5u80fsanh/docs/guides/PRISMA_GUIDE.md) - Database patterns

---

**Last Updated** : 2025-11-22
**Author** : Development Team
