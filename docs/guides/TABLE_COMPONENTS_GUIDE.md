# Table Components Guide

**Complete guide to building standardized tables in TechHub using hooks and reusable components.**

## Overview

The table system provides a consistent, DRY approach to building tables across the application. It consists of:

- **6 Custom Hooks** - State management, filtering, URL sync, presets, column visibility
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

## Critical: React Compiler Compatibility

**REQUIRED**: All TanStack Table components MUST include the `"use no memo"` directive to ensure compatibility with React 19's Compiler.

### The Directive

```tsx
"use client";
"use no memo";  // Required for React Compiler compatibility

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
```

### Why This Is Required

- **TanStack Table v8 is incompatible** with React 19's Compiler
- Without the directive, tables may fail to re-render properly
- The directive tells React Compiler to skip optimization for this component
- This is React's official escape hatch for incompatible libraries

### Placement Rules

1. **Must be BEFORE all imports** (comments are OK before the directive)
2. **Must use double or single quotes** (NOT backticks)
3. **Must exactly match** `"use no memo"` or its alias `"use no forget"`

### When to Remove

- When upgrading to **TanStack Table v9** (expected Q2-Q3 2025)
- See [STACK_UPGRADES.md](STACK_UPGRADES.md) for migration guide
- All `"use no memo"` directives should be removed after the upgrade

**Learn more**: [React Compiler Directives](https://react.dev/reference/react-compiler/directives/use-no-memo)

---

### Advanced Table (With URL Sync + Filters)

**Note**: When using filters, pre-filter the data instead of using controlled `columnFilters` (see [Critical Pattern](#critical-pattern-pre-filter-data-dont-use-controlled-columnfilters)).

```tsx
import { useMemo } from "react";
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

  // IMPORTANT: Pre-filter data (don't use controlled columnFilters!)
  const filteredData = useMemo(() => {
    let result = data;

    if (filters.debouncedSearchTerm) {
      const term = filters.debouncedSearchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term)
      );
    }

    if (filters.filters.status !== 'all') {
      result = result.filter(item => item.status === filters.filters.status);
    }

    if (filters.filters.priority !== 'all') {
      result = result.filter(item => item.priority === filters.filters.priority);
    }

    return result;
  }, [data, filters.debouncedSearchTerm, filters.filters]);

  const columns = [ /* ... */ ];

  return (
    <DataTable
      columns={columns}
      data={filteredData} // ✅ Pre-filtered data
      controlledState={{
        sorting: tableState.sorting,
        pagination: tableState.pagination,
        columnVisibility: tableState.columnVisibility,
        // NO columnFilters here!
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

### useColumnVisibilityEnhanced (Recommended)

**Purpose**: Enhanced column visibility with automatic `hiddenByDefault` extraction and localStorage persistence.

**Features**:
- Automatically extracts `hiddenByDefault` from column meta
- localStorage persistence with unique storage key per table
- DRY approach - define visibility once in column definitions
- SOLID principles - Single Responsibility Principle
- Compatible with DataTable component

**Why Use This**:
- **DRY**: Define hidden columns once in column meta instead of repeating in multiple places
- **Persistent**: User preferences saved to localStorage automatically
- **Consistent**: Same behavior across all tables in the app
- **Type-safe**: Full TypeScript support with generics

**API**:
```typescript
const { visibility, onVisibilityChange } = useColumnVisibilityEnhanced<TData>({
  storageKey: string;           // Required - unique key for localStorage
  columns: ColumnDef<TData>[];  // Required - your column definitions
  initialVisibility?: VisibilityState; // Optional override
});
```

**Example**:
```typescript
import { useColumnVisibilityEnhanced } from "@/hooks";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

export function MyTable({ data }) {
  const columns = React.useMemo<ColumnDef<MyData>[]>(() => [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      meta: { label: "ID" },
    },
    {
      accessorKey: "details",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Details" />,
      meta: {
        label: "Details",
        hiddenByDefault: true, // ✅ This column hidden by default
      },
    },
    {
      accessorKey: "notes",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Notes" />,
      meta: {
        label: "Notes",
        hiddenByDefault: true, // ✅ This column hidden by default
      },
    },
  ], []);

  // Hook automatically extracts hiddenByDefault from column meta
  const { visibility, onVisibilityChange } = useColumnVisibilityEnhanced({
    storageKey: "my-table-columns", // Unique key for this table
    columns,
  });

  return (
    <DataTable
      columns={columns}
      data={data}
      initialColumnVisibility={visibility}
      onColumnVisibilityChange={onVisibilityChange}
    />
  );
}
```

**How It Works**:
1. Hook scans columns for `meta.hiddenByDefault = true`
2. Creates initial visibility state: `{ details: false, notes: false }`
3. Merges with localStorage (if exists) - user preference takes priority
4. Returns visibility state and change handler for DataTable
5. User toggles via "Columns" dropdown → saved to localStorage
6. Next visit: User's preference loaded automatically

**Migration from Manual Approach**:

❌ **Before** (Manual, not DRY):
```typescript
// Repeated in multiple places, no persistence
<DataTable
  columns={columns}
  data={data}
  initialColumnVisibility={{
    details: false,
    notes: false,
  }}
/>
```

✅ **After** (DRY, persistent):
```typescript
// Define once in column meta
const columns = [...]; // with meta.hiddenByDefault

const { visibility, onVisibilityChange } = useColumnVisibilityEnhanced({
  storageKey: "my-table-columns",
  columns,
});

<DataTable
  columns={columns}
  data={data}
  initialColumnVisibility={visibility}
  onColumnVisibilityChange={onVisibilityChange}
/>
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

  // 4. Pre-filter data (IMPORTANT: Don't use controlled columnFilters!)
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (filters.debouncedSearchTerm) {
      const term = filters.debouncedSearchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.ciKey?.toLowerCase().includes(term) ?? false)
      );
    }

    // Apply criticality filter
    if (filters.filters.criticality !== 'all') {
      result = result.filter(item => item.criticality === filters.filters.criticality);
    }

    // Apply environment filter
    if (filters.filters.environment !== 'all') {
      result = result.filter(item => item.environment === filters.filters.environment);
    }

    // Apply owner filter
    if (filters.filters.owner === 'none') {
      result = result.filter(item => !item.primaryOwnerName);
    }

    // Apply asset link filter
    if (filters.filters.assetLink === 'unlinked') {
      result = result.filter(item => !item.linkedAssetTag);
    }

    return result;
  }, [data, filters.debouncedSearchTerm, filters.filters]);

  // 5. Column definitions (no filterFn needed - we're pre-filtering!)
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

  // 6. Render with DataTable
  return (
    <DataTable
      columns={columns}
      data={filteredData} // ✅ Pre-filtered data, NOT raw data!
      loading={loading}
      controlledState={{
        sorting: tableState.sorting,
        pagination: tableState.pagination,
        columnVisibility: tableState.columnVisibility,
        // NO columnFilters here!
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

## Critical Pattern: Pre-Filter Data (Don't Use Controlled columnFilters)

**IMPORTANT**: When using custom filters (`useTableFilters`), **do NOT pass `columnFilters` to controlled state**. Instead, filter the data array before passing to DataTable.

### ❌ Wrong Pattern (Causes Infinite Loops)

```tsx
// DON'T DO THIS - causes infinite loop!
const columnFiltersState = useMemo(() => {
  const result = [];
  if (filters.filters.status !== 'all') {
    result.push({ id: 'status', value: filters.filters.status });
  }
  return result;
}, [filters.filters]);

<DataTable
  data={data}
  controlledState={{
    columnFilters: columnFiltersState, // ❌ Causes infinite loop!
  }}
/>
```

**Why it fails**: DataTable has internal state that conflicts with external derived state, creating circular updates.

### ✅ Correct Pattern (Pre-Filter Data)

```tsx
// Filter data BEFORE passing to DataTable
const filteredData = useMemo(() => {
  let result = data;

  // Apply search filter
  if (filters.debouncedSearchTerm) {
    const term = filters.debouncedSearchTerm.toLowerCase();
    result = result.filter(item =>
      item.name.toLowerCase().includes(term)
    );
  }

  // Apply status filter
  if (filters.filters.status !== 'all') {
    result = result.filter(item => item.status === filters.filters.status);
  }

  // Apply priority filter
  if (filters.filters.priority !== 'all') {
    result = result.filter(item => item.priority === filters.filters.priority);
  }

  return result;
}, [data, filters.debouncedSearchTerm, filters.filters]);

// Pass filtered data to DataTable
<DataTable
  data={filteredData} // ✅ Pre-filtered data
  controlledState={{
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    columnVisibility: tableState.columnVisibility,
    // NO columnFilters here!
  }}
/>
```

**Benefits of pre-filtering**:
- ✅ No infinite loops - no state synchronization issues
- ✅ Simpler code - explicit filter logic
- ✅ Better performance - filtering happens once in useMemo
- ✅ Easier debugging - can log `filteredData` to see results
- ✅ More maintainable - clear separation of concerns

### When to Use Each Approach

**Use Pre-Filtering When**:
- Using custom filter UI (`useTableFilters` + `TableFilterSelect`)
- Complex filter logic (multiple conditions, OR logic, etc.)
- Filters from external sources (URL params, props, etc.)
- Need full control over filtering logic

**Use TanStack Table's Built-in Filtering When**:
- Simple single-column filters
- Using DataTable's built-in search feature
- Table manages its own filter state internally

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

### Issue: Infinite loop / "Maximum update depth exceeded"

**Problem**: Passing `columnFilters` to controlled state while using `useTableFilters`.

**Solution**: Pre-filter data instead of using controlled `columnFilters`:

```tsx
// ❌ DON'T DO THIS
<DataTable
  data={data}
  controlledState={{ columnFilters: derivedFilters }} // Causes infinite loop!
/>

// ✅ DO THIS INSTEAD
const filteredData = useMemo(() => {
  let result = data;
  if (filters.filters.status !== 'all') {
    result = result.filter(item => item.status === filters.filters.status);
  }
  return result;
}, [data, filters.filters]);

<DataTable data={filteredData} /> // Pre-filtered, no controlled columnFilters
```

**Note**: The `useTableFilters` hook already handles the `onFilterChange` dependency correctly (it's excluded from the effect dependencies to prevent infinite loops). You don't need to worry about this - just use the hook as documented.

See [Critical Pattern: Pre-Filter Data](#critical-pattern-pre-filter-data-dont-use-controlled-columnfilters) for full explanation.

### Issue: Filters not updating table

**Solution**: When using pre-filtering pattern, make sure `filteredData` has correct dependencies:

```tsx
const filteredData = useMemo(() => {
  let result = data;
  // ... apply filters
  return result;
}, [
  data,
  filters.debouncedSearchTerm,  // ✅ Include all filter values
  filters.filters.status,        // ✅ Include all filter values
  filters.filters.priority,      // ✅ Include all filter values
]);
```

Alternatively, use `filters.filters` as a dependency:

```tsx
}, [data, filters.debouncedSearchTerm, filters.filters]);
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
