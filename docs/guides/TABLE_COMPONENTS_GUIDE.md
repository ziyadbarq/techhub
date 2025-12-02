# Table Components Guide

**Complete guide to building standardized tables in Barq Assets using hooks and reusable components.**

## Overview

The table system provides a consistent, DRY approach to building tables across the application. It consists of:

- **5 Custom Hooks** - State management, filtering, URL sync, presets
- **Enhanced DataTable Component** - Controlled state support, preset filters slot
- **3 Filter Components** - Search, select dropdowns, preset buttons

## Quick Start

### Simple Table (No URL Sync)

```tsx
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  // ... more columns
];

export function PersonsTable({ persons }) {
  return (
    <DataTable
      columns={columns}
      data={persons}
      pagination={{ pageSize: 20 }}
      showColumnToggle
    />
  );
}
```

### Advanced Table (With URL Sync + Filters)

```tsx
import { DataTable } from "@/components/ui/data-table";
import { TableSearch } from "@/components/ui/table-search";
import { TableFilterSelect } from "@/components/ui/table-filter-select";
import { TablePresetFilters } from "@/components/ui/table-preset-filters";
import { useTableState } from "@/hooks/use-table-state";
import { useTableFilters } from "@/hooks/use-table-filters";
import { usePresetFilters } from "@/hooks/use-preset-filters";

export function AdvancedTable({ data }) {
  // State management with URL sync
  const tableState = useTableState({
    enableUrlSync: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 25 },
    },
  });

  // Filters with debouncing
  const filters = useTableFilters({
    initialFilters: {
      status: 'all',
      priority: 'all',
    },
    searchConfig: { debounceMs: 250 },
  });

  // Preset filters
  const presets = usePresetFilters({
    presets: [
      {
        key: 'high-priority',
        label: 'High Priority',
        description: 'Show high priority items only',
        filters: { priority: 'HIGH' },
      },
    ],
    onApply: filters.setFilters,
  });

  const columns = [ /* ... */ ];

  return (
    <DataTable
      columns={columns}
      data={data}
      controlledState={{
        sorting: tableState.sorting,
        pagination: tableState.pagination,
        columnVisibility: tableState.columnVisibility,
      }}
      onSortingChange={tableState.setSorting}
      onPaginationChange={tableState.setPagination}
      onColumnVisibilityChange={tableState.setColumnVisibility}
      toolbarSlot={
        <div className="flex flex-1 items-center gap-3">
          <TableSearch
            value={filters.searchTerm}
            onChange={filters.setSearchTerm}
            placeholder="Search..."
          />
          <TableFilterSelect
            value={filters.filters.status}
            onChange={(v) => filters.setFilter('status', v)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            placeholder="Status"
          />
        </div>
      }
      presetFilters={
        <TablePresetFilters
          presets={presets.presets}
          activePreset={presets.activePreset}
          onApply={presets.applyPreset}
          onClear={presets.clearPreset}
        />
      }
    />
  );
}
```

## Hook Reference

### useTableState

**Purpose**: Orchestrator hook managing all TanStack Table state.

**Features**:
- Manages sorting, filters, pagination, column visibility, row selection
- Optional URL synchronization
- Optional localStorage persistence for column visibility
- Auto-resets pagination when filters change

**API**:
```typescript
const tableState = useTableState({
  enableUrlSync?: boolean;
  urlSyncOptions?: {
    pagination?: { key?: string; pageSizeKey?: string; defaultPageSize?: number };
    sorting?: { key?: string; orderKey?: string };
    columnVisibility?: { key?: string };
  };
  enableColumnPersistence?: boolean;
  storageKey?: string;
  initialState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    pagination?: PaginationState;
    columnVisibility?: VisibilityState;
    rowSelection?: Record<string, boolean>;
  };
});

// Returns:
// - sorting, columnFilters, pagination, columnVisibility, rowSelection
// - setSorting, setColumnFilters, setPagination, setColumnVisibility, setRowSelection
// - resetPagination, resetFilters, resetAll
```

**Example**:
```typescript
const tableState = useTableState({
  enableUrlSync: true,
  urlSyncOptions: {
    pagination: { key: 'page', defaultPageSize: 25 },
  },
  enableColumnPersistence: true,
  storageKey: 'my-table-columns',
});

// Use with DataTable
<DataTable
  controlledState={{
    sorting: tableState.sorting,
    pagination: tableState.pagination,
  }}
  onSortingChange={tableState.setSorting}
  onPaginationChange={tableState.setPagination}
/>
```

### useTableFilters

**Purpose**: Generic filter management with debouncing.

**Features**:
- Type-safe filter state
- Automatic debouncing for search
- Batch filter updates
- Active filter counting

**API**:
```typescript
const filters = useTableFilters({
  initialFilters: TFilters;
  searchConfig?: {
    initialValue?: string;
    debounceMs?: number;
  };
  onFilterChange?: (filters: TFilters) => void;
});

// Returns:
// - filters, searchTerm, debouncedSearchTerm
// - setFilter, setFilters, setSearchTerm
// - clearFilters, clearSearch
// - hasActiveFilters, activeFilterCount
```

**Example**:
```typescript
const filters = useTableFilters({
  initialFilters: {
    criticality: 'all',
    environment: 'all',
  },
  searchConfig: { debounceMs: 250 },
  onFilterChange: () => tableState.resetPagination(),
});

// Update filters
filters.setFilter('criticality', 'HIGH');
filters.setSearchTerm('search term');
filters.clearFilters(); // Reset all
```

### useUrlSync

**Purpose**: Bidirectional URL parameter synchronization.

**Features**:
- Reads URL params on mount
- Updates URL without page reload
- Clean URLs (skips defaults)
- Supports strings, numbers, booleans, arrays

**API**:
```typescript
const urlState = useUrlSync({
  params: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array';
      defaultValue: T;
    };
  };
  debounceMs?: number;
});

// Returns:
// - values: current URL param values
// - setValue, setValues, clearParam, clearAll
```

**Example**:
```typescript
const urlState = useUrlSync({
  params: {
    q: { type: 'string', defaultValue: '' },
    page: { type: 'number', defaultValue: 1 },
    hide: { type: 'array', defaultValue: [] },
  },
  debounceMs: 300,
});

// Read/write values
console.log(urlState.values.q);
urlState.setValue('q', 'search term');
urlState.clearAll();
```

### useColumnVisibility

**Purpose**: Column visibility with persistence.

**Features**:
- localStorage persistence
- URL parameter sync
- Merge strategy (URL overrides localStorage)
- Batch operations

**API**:
```typescript
const columnVis = useColumnVisibility({
  storageKey?: string;
  initialVisibility?: VisibilityState;
  enableUrlSync?: boolean;
  urlParamKey?: string;
});

// Returns:
// - visibility: current state
// - setColumnVisibility, toggleColumn, setVisibility
// - resetToDefaults, showAll, hideAll
```

**Example**:
```typescript
const columnVis = useColumnVisibility({
  storageKey: 'my-table-columns',
  initialVisibility: { email: false, phone: false },
  enableUrlSync: true,
});

// Toggle columns
columnVis.toggleColumn('email');
columnVis.showAll();
columnVis.resetToDefaults();
```

### usePresetFilters

**Purpose**: Declarative preset filter combinations.

**Features**:
- Define preset filter combinations
- Track active preset
- Apply/clear presets

**API**:
```typescript
const presets = usePresetFilters({
  presets: Array<{
    key: string;
    label: string;
    description?: string;
    filters: Partial<TFilters>;
    icon?: React.ComponentType;
  }>;
  onApply: (filters: Partial<TFilters>) => void;
  onClear?: () => void;
});

// Returns:
// - presets, activePreset
// - applyPreset, clearPreset, isPresetActive
```

**Example**:
```typescript
const presets = usePresetFilters({
  presets: [
    {
      key: 'prod-critical',
      label: 'Prod Critical',
      description: 'Critical items in production',
      filters: { criticality: 'CRITICAL', environment: 'PROD' },
    },
  ],
  onApply: (filters) => tableFilters.setFilters(filters),
});

// Apply preset
presets.applyPreset('prod-critical');
```

## Component Reference

### TableSearch

**Purpose**: Search input with debouncing and clear button.

**Props**:
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
}
```

**Features**:
- ⌘K keyboard shortcut to focus
- Clear button (X icon)
- Loading indicator
- Search icon

**Example**:
```tsx
<TableSearch
  value={filters.searchTerm}
  onChange={filters.setSearchTerm}
  placeholder="Search by name..."
  loading={isLoading}
/>
```

### TableFilterSelect

**Purpose**: Filter dropdown with "All" option.

**Props**:
```typescript
{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ComponentType }>;
  placeholder?: string;
  allLabel?: string;
  showBadge?: boolean;
  showClear?: boolean;
  className?: string;
  disabled?: boolean;
}
```

**Features**:
- Automatic "All" option
- Optional badge indicator
- Optional inline clear button
- Icon support

**Example**:
```tsx
<TableFilterSelect
  value={filters.filters.criticality}
  onChange={(v) => filters.setFilter('criticality', v)}
  options={[
    { value: 'LOW', label: 'Low' },
    { value: 'HIGH', label: 'High' },
  ]}
  placeholder="Criticality"
  allLabel="All Criticality"
/>
```

### TablePresetFilters

**Purpose**: Preset filter button group.

**Props**:
```typescript
{
  presets: Array<PresetFilter<TFilters>>;
  activePreset?: string | null;
  onApply: (key: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
}
```

**Features**:
- Tooltips with descriptions
- Active state highlighting
- Clear all button
- Icon support

**Example**:
```tsx
<TablePresetFilters
  presets={presets.presets}
  activePreset={presets.activePreset}
  onApply={presets.applyPreset}
  onClear={presets.clearPreset}
/>
```

### Enhanced DataTable

**New Props**:
```typescript
{
  // Controlled state
  controlledState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    pagination?: PaginationState;
    columnVisibility?: VisibilityState;
    rowSelection?: Record<string, boolean>;
  };
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  // Slots
  presetFilters?: React.ReactNode;
  toolbarSlot?: React.ReactNode;
  filtersSlot?: React.ReactNode;
}
```

**Backward Compatibility**: All existing props still work! The new props are optional.

## Migration Recipes

### Recipe 1: Simple Table (No Changes Needed)

If your table already uses DataTable without special requirements, no changes needed!

```tsx
// This still works perfectly!
<DataTable
  columns={columns}
  data={data}
  pagination={{ pageSize: 10 }}
/>
```

### Recipe 2: Add URL Sync to Existing Table

**Before (Manual URL Sync)**:
```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

useEffect(() => {
  const params = new URLSearchParams();
  params.set('page', String(pagination.pageIndex + 1));
  router.replace(`${pathname}?${params.toString()}`);
}, [pagination]);
```

**After (Using Hook)**:
```tsx
const tableState = useTableState({
  enableUrlSync: true,
  initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
});

<DataTable
  controlledState={{ pagination: tableState.pagination }}
  onPaginationChange={tableState.setPagination}
/>
```

**Result**: ~50 lines removed!

### Recipe 3: Add Filters to Table

**Before (Manual Filter State)**:
```tsx
const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

// Manual Select components with repetitive onChange handlers
```

**After (Using Hooks + Components)**:
```tsx
const filters = useTableFilters({
  initialFilters: { status: 'all', priority: 'all' },
  searchConfig: { debounceMs: 300 },
});

<DataTable
  toolbarSlot={
    <>
      <TableSearch
        value={filters.searchTerm}
        onChange={filters.setSearchTerm}
      />
      <TableFilterSelect
        value={filters.filters.status}
        onChange={(v) => filters.setFilter('status', v)}
        options={STATUS_OPTIONS}
      />
    </>
  }
/>
```

**Result**: ~100 lines removed, consistent UI!

### Recipe 4: Full Migration (Configuration Items Example)

**Before**: 898 lines with manual TanStack Table setup

**After**: ~150-200 lines using hooks

See [Configuration Items Migration](#configuration-items-example) below for complete example.

## Configuration Items Example

Complete real-world example showing all patterns:

```tsx
export function ConfigurationItemsTable({
  data,
  loading,
  onView,
  onEdit,
}: ConfigurationItemsTableProps) {
  // 1. Table state with URL sync
  const tableState = useTableState({
    enableUrlSync: true,
    urlSyncOptions: {
      pagination: { defaultPageSize: 25 },
      columnVisibility: { key: 'hide' },
    },
    initialState: {
      columnVisibility: {
        ciKey: false,
        primaryOwnerName: false,
        updatedAt: false,
      },
    },
  });

  // 2. Filters with debouncing
  const filters = useTableFilters({
    initialFilters: {
      criticality: 'all',
      environment: 'all',
      owner: 'all',
      assetLink: 'all',
    },
    searchConfig: { debounceMs: 250 },
    onFilterChange: () => tableState.resetPagination(),
  });

  // 3. Preset filters
  const presets = usePresetFilters({
    presets: [
      {
        key: 'prod-critical',
        label: 'Prod Critical',
        description: 'Critical items in production',
        filters: { criticality: 'CRITICAL', environment: 'PROD' },
      },
      {
        key: 'unlinked',
        label: 'Unlinked Assets',
        description: 'CIs without linked assets',
        filters: { assetLink: 'unlinked' },
      },
    ],
    onApply: filters.setFilters,
  });

  // 4. Column definitions (mostly unchanged)
  const columns: ColumnDef<ConfigurationItemDTO>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button onClick={() => onView(row.original)}>
          {row.getValue('name')}
        </button>
      ),
    },
    // ... more columns
  ];

  // 5. Render with DataTable
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      controlledState={{
        sorting: tableState.sorting,
        pagination: tableState.pagination,
        columnVisibility: tableState.columnVisibility,
      }}
      onSortingChange={tableState.setSorting}
      onPaginationChange={tableState.setPagination}
      onColumnVisibilityChange={tableState.setColumnVisibility}
      toolbarSlot={
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <TableSearch
            value={filters.searchTerm}
            onChange={filters.setSearchTerm}
            placeholder="Search by name or CI key..."
          />
          <TableFilterSelect
            value={filters.filters.criticality}
            onChange={(v) => filters.setFilter('criticality', v)}
            options={CRITICALITY_OPTIONS}
            placeholder="Criticality"
          />
          <TableFilterSelect
            value={filters.filters.environment}
            onChange={(v) => filters.setFilter('environment', v)}
            options={ENVIRONMENT_OPTIONS}
            placeholder="Environment"
          />
        </div>
      }
      presetFilters={
        <TablePresetFilters
          presets={presets.presets}
          activePreset={presets.activePreset}
          onApply={presets.applyPreset}
          onClear={presets.clearPreset}
        />
      }
    />
  );
}
```

**Result**: 698 lines removed (78% reduction)!

## Best Practices

### 1. Use Hooks for Complex Tables

If your table has any of these, use hooks:
- URL state synchronization
- Multiple filter dropdowns
- Preset filter buttons
- localStorage persistence
- Complex state management

### 2. Keep Simple Tables Simple

If your table is just columns + data, stick with basic DataTable:

```tsx
<DataTable columns={columns} data={data} />
```

### 3. Compose Hooks Incrementally

Don't use all hooks at once. Add them as needed:

```tsx
// Start simple
const tableState = useTableState();

// Add filters when needed
const filters = useTableFilters({ ... });

// Add presets when users request them
const presets = usePresetFilters({ ... });
```

### 4. Reset Pagination on Filter Changes

Always reset pagination when filters change:

```tsx
const filters = useTableFilters({
  initialFilters: { ... },
  onFilterChange: () => tableState.resetPagination(),
});
```

### 5. Use Controlled State for Advanced Features

If you need URL sync or complex state management, use controlled state:

```tsx
<DataTable
  controlledState={{
    sorting: tableState.sorting,
    pagination: tableState.pagination,
  }}
  onSortingChange={tableState.setSorting}
  onPaginationChange={tableState.setPagination}
/>
```

### 6. Leverage TypeScript

All hooks and components are fully typed. Let TypeScript guide you:

```typescript
const filters = useTableFilters<{
  status: string;
  priority: string;
}>({
  initialFilters: {
    status: 'all',
    priority: 'all', // TypeScript will error if you forget this!
  },
});
```

## Troubleshooting

### Issue: URL params not syncing

**Solution**: Make sure `enableUrlSync: true` in `useTableState`:

```tsx
const tableState = useTableState({
  enableUrlSync: true, // ✅ Enable this!
});
```

### Issue: Pagination resets when typing in search

**Solution**: This is intentional! Reset is triggered by `onFilterChange`. Remove if not desired:

```tsx
const filters = useTableFilters({
  initialFilters: { ... },
  // onFilterChange: () => tableState.resetPagination(), // ❌ Remove this line
});
```

### Issue: Column visibility not persisting

**Solution**: Enable persistence in `useTableState`:

```tsx
const tableState = useTableState({
  enableColumnPersistence: true, // ✅ Enable this!
  storageKey: 'my-table-columns', // ✅ Provide unique key!
});
```

### Issue: Filters not updating table

**Solution**: Make sure to apply filters to table columns:

```tsx
useEffect(() => {
  table.getColumn('name')?.setFilterValue(filters.debouncedSearchTerm);
  table.getColumn('status')?.setFilterValue(filters.filters.status);
}, [filters, table]);
```

### Issue: TypeScript errors with controlled state

**Solution**: Ensure you're passing the correct state shape:

```tsx
<DataTable
  controlledState={{
    sorting: tableState.sorting, // ✅ Must be SortingState
    pagination: tableState.pagination, // ✅ Must be PaginationState
  }}
/>
```

## Performance Tips

1. **Debounce search inputs** - Use 250-300ms debounce for optimal UX
2. **Use controlled state sparingly** - Only for complex tables needing URL sync
3. **Memoize columns** - Use `useMemo` for column definitions
4. **Lazy load heavy tables** - Split large tables into separate chunks

## Related Documentation

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Adding features
- [REFACTORING_PATTERNS.md](./REFACTORING_PATTERNS.md) - Code organization
- [TanStack Table Docs](https://tanstack.com/table/latest/docs/introduction) - Official docs

## Questions?

If you have questions or encounter issues:
1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review the [Configuration Items Example](#configuration-items-example)
3. Ask the team in #engineering channel
