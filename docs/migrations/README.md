# Migration Guides

This directory contains comprehensive migration guides for major feature implementations and system-wide upgrades.

## Completed Migrations

### Column Visibility Migration (Dec 2024)

**File**: [COLUMN_VISIBILITY_MIGRATION.md](./COLUMN_VISIBILITY_MIGRATION.md)

**Overview**: App-wide implementation of centralized column visibility with localStorage persistence across 37 tables.

**Status**: ✅ Complete

**Key Achievements**:
- Created `useColumnVisibilityEnhanced` hook for DRY column visibility management
- Applied to 37 tables across the entire application
- Automatic extraction of `hiddenByDefault` from column meta
- localStorage persistence per table for user preferences
- Full TypeScript type safety
- TanStack Table compatibility

**Impact**:
- Users can customize column visibility per table
- Preferences persist across sessions
- Consistent pattern across all tables
- Improved UX with cleaner default views

**Documentation**:
- **Implementation Guide**: [TABLE_COMPONENTS_GUIDE.md](../guides/TABLE_COMPONENTS_GUIDE.md#usecolumnvisibilityenhanced-recommended)
- **Hook Source**: `src/hooks/use-column-visibility-enhanced.ts`
- **Migration Summary**: [COLUMN_VISIBILITY_MIGRATION.md](./COLUMN_VISIBILITY_MIGRATION.md)

## Migration Best Practices

When creating new migration guides, follow these principles:

1. **Comprehensive Documentation**: Include:
   - Overview and context
   - What was built/changed
   - Migration statistics (files affected)
   - Implementation patterns
   - Validation steps
   - Lessons learned

2. **Code Examples**: Provide before/after comparisons showing:
   - Old approach vs new approach
   - Migration patterns for developers
   - Common pitfalls and solutions

3. **Reference Links**: Link to:
   - Related documentation
   - Source code files
   - API documentation
   - Related migrations

4. **Timeline**: Document:
   - Start and completion dates
   - Batching strategy (if applicable)
   - Total effort estimation

5. **Validation**: Include:
   - TypeScript compilation status
   - Test results
   - Performance metrics (if applicable)
   - Breaking changes (if any)

## Future Migrations

As the system evolves, document major migrations here including:
- Database schema changes
- API version updates
- Framework upgrades
- Architectural refactoring
- Breaking changes

Each migration should have its own dedicated markdown file following the structure established in `COLUMN_VISIBILITY_MIGRATION.md`.
