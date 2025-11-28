# Employee Directory & Org Chart

**Status**: Implemented (Layer 1 Feature)
**Version**: 2.0.0
**Last Updated**: 2025-11-26

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Backend Implementation](#backend-implementation)
- [Frontend Components](#frontend-components)
- [Use Cases](#use-cases)
- [Hooks Reference](#hooks-reference)
- [Configuration](#configuration)
- [Theme Customization](#theme-customization)
- [Accessibility](#accessibility)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The Employee Directory is a comprehensive view of all personnel in the organization, providing three distinct visualization modes:

1. **Table View** - Traditional paginated table with sorting and filtering
2. **Card Grid View** - Visual card layout with employee photos/avatars
3. **Org Chart View** - Interactive hierarchical visualization using XYFlow (React Flow)

### Key Features

- **Lazy Loading Org Chart**: Efficient node expansion for large organizations (scales to 10,000+ employees)
- **Recursive CTE Queries**: Database-optimized hierarchy traversal using PostgreSQL CTEs
- **Theme-Aware Styling**: Full light/dark mode support with CSS variables
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation and ARIA labels
- **Search & Filter**: Real-time search with department filtering
- **Reporting Chain**: View full management hierarchy for any employee

### Statistics

- **Views**: 3 (Table, Cards, Org Chart)
- **Use Cases**: 5 (List, Get Root, Get Direct Reports, Get Reporting Chain, Get Single)
- **Components**: 15+ extracted components and hooks
- **Performance**: O(n) hierarchy queries via recursive CTEs

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐   │
│  │ TableView   │ │ CardGridView│ │ OrgChartView         │   │
│  └─────────────┘ └─────────────┘ │ ├─ OrgChartToolbar   │   │
│                                   │ ├─ OrgChartControls │   │
│                                   │ ├─ EmployeeNode     │   │
│                                   │ └─ OrgChartEmptyState│  │
│                                   └──────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                 Interface Adapters Layer                     │
│  ┌────────────────────────────┐ ┌────────────────────────┐  │
│  │ EmployeeDirectoryController│ │ EmployeeDirectoryDTO   │  │
│  │ ├─ listEmployeesAction     │ │ EmployeeDirectoryPresenter│
│  │ ├─ getRootEmployeesAction  │ └────────────────────────┘  │
│  │ ├─ getDirectReportsAction  │                              │
│  │ └─ getReportingChainAction │                              │
│  └────────────────────────────┘                              │
├─────────────────────────────────────────────────────────────┤
│                    Use Cases Layer                           │
│  ┌─────────────────────┐ ┌─────────────────────────────┐    │
│  │ GetRootEmployeesUC  │ │ GetDirectReportsUseCase     │    │
│  └─────────────────────┘ └─────────────────────────────┘    │
│  ┌─────────────────────┐ ┌─────────────────────────────┐    │
│  │GetReportingChainUC  │ │ ListEmployeesForDirectoryUC │    │
│  └─────────────────────┘ └─────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PrismaPersonRepository                                 │  │
│  │ ├─ findRootEmployeesForDirectory()                    │  │
│  │ ├─ findDirectReportsForDirectory(managerId)           │  │
│  │ └─ findReportingChain(personId) [Recursive CTE]       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/employee-directory/
│   ├── employee-avatar.tsx              # Theme-aware avatar with initials
│   ├── reporting-chain-dialog.tsx       # Reporting chain modal
│   ├── org-chart/
│   │   ├── index.ts                     # Barrel export
│   │   ├── config.ts                    # Centralized configuration
│   │   ├── employee-node.tsx            # XYFlow custom node
│   │   ├── org-chart-toolbar.tsx        # Search & filter panel
│   │   ├── org-chart-controls.tsx       # Expand/collapse controls
│   │   ├── org-chart-empty-state.tsx    # Empty state component
│   │   └── hooks/
│   │       ├── index.ts                 # Hooks barrel export
│   │       ├── use-org-chart-state.ts   # Node expansion state
│   │       ├── use-org-chart-filters.ts # Search & department filter
│   │       └── use-org-chart-layout.ts  # Tree layout calculation
│   └── views/
│       ├── index.ts                     # Views barrel export
│       ├── table-view.tsx               # Table view component
│       ├── card-grid-view.tsx           # Card grid view component
│       └── org-chart-view.tsx           # Org chart view (205 lines)
├── core/use-cases/foundation/employee-directory/
│   ├── index.ts                         # Use case barrel export
│   ├── get-root-employees.use-case.ts
│   ├── get-direct-reports.use-case.ts
│   └── get-reporting-chain.use-case.ts
└── interface-adapters/
    ├── controllers/employee-directory.controller.ts
    └── presenters/employee-directory.presenter.ts
```

## Backend Implementation

### Recursive CTE for Reporting Chain

The reporting chain query uses PostgreSQL's recursive CTEs for efficient hierarchy traversal:

```typescript
// prisma-person.repository.ts
async findReportingChain(personId: string): Promise<PersonWithDirectoryRelations[]> {
  // Step 1: Get chain of IDs using recursive CTE
  const chainIds = await this.prisma.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE reporting_chain AS (
      -- Base case: start with the target person
      SELECT id, "managerId", 0 AS depth
      FROM persons
      WHERE id = ${personId}::uuid AND "isActive" = true

      UNION ALL

      -- Recursive case: follow manager links up
      SELECT p.id, p."managerId", rc.depth + 1
      FROM persons p
      INNER JOIN reporting_chain rc ON p.id = rc."managerId"
      WHERE p."isActive" = true
    )
    SELECT id FROM reporting_chain ORDER BY depth DESC
  `;

  // Step 2: Fetch full person data with relations
  const persons = await this.prisma.person.findMany({
    where: { id: { in: chainIds.map((c) => c.id) } },
    include: {
      orgUnit: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, city: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { directReports: { where: { isActive: true } } } },
    },
  });

  // Step 3: Preserve order from CTE
  const personMap = new Map(persons.map((p) => [p.id, p]));
  return chainIds.map((c) => personMap.get(c.id)).filter(Boolean);
}
```

### Use Case Pattern

```typescript
// get-root-employees.use-case.ts
@injectable()
export class GetRootEmployeesUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<GetRootEmployeesOutput> {
    this.logger.debug("Fetching root employees for org chart");

    const rootEmployees = await this.personRepository.findRootEmployeesForDirectory();

    return {
      rootEmployees,
      total: rootEmployees.length,
    };
  }
}
```

## Frontend Components

### OrgChartView Component

The main org chart view is a lean orchestrator that delegates to specialized hooks:

```tsx
// org-chart-view.tsx (205 lines)
export function OrgChartView({ employees, isLoading, onViewReportingChain }: OrgChartViewProps) {
  const config = DEFAULT_ORG_CHART_CONFIG;

  // Filters hook - manages search, department filter, and derived data
  const {
    searchQuery, setSearchQuery,
    selectedDepartment, setSelectedDepartment,
    filteredEmployees, departments, highlightedNodes,
    // ... more derived data
  } = useOrgChartFilters({ employees });

  // State hook - manages node expansion
  const {
    expandedNodes, handleToggleExpand,
    handleExpandAll, handleCollapseAll,
  } = useOrgChartState({ employees, filteredEmployees, rootEmployees, ... });

  // Layout hook - generates nodes and edges from tree structure
  const { nodes: flowNodes, edges: flowEdges } = useOrgChartLayout({
    filteredEmployees, expandedNodes, highlightedNodes,
    onToggleExpand: handleToggleExpand,
    // ... more options
  });

  return (
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} /* ... */>
      <Background variant={BackgroundVariant.Dots} />
      <Controls />
      <MiniMap />
      <OrgChartToolbar /* search & filter props */ />
      <OrgChartControls /* expand/collapse props */ />
    </ReactFlow>
  );
}
```

### EmployeeNode Component

Custom XYFlow node with accessibility:

```tsx
// employee-node.tsx
<Card
  className={cn(
    "w-48 cursor-pointer transition-all",
    "focus-visible:ring-ring focus-visible:ring-2",
    isHighlighted && "ring-primary ring-2 shadow-lg bg-primary/5",
  )}
  role="article"
  tabIndex={0}
  aria-label={`${employee.fullName}, ${employee.title}, ${employee.orgUnitName}`}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onViewReportingChain(employee);
    }
  }}
>
  {/* Employee info, avatar, department badge, expand/collapse button */}
</Card>
```

## Use Cases

| Use Case | Purpose | Input | Output |
|----------|---------|-------|--------|
| `GetRootEmployeesUseCase` | Get employees without managers (org chart roots) | None | `PersonWithDirectoryRelations[]` |
| `GetDirectReportsUseCase` | Get direct reports for a manager (lazy loading) | `managerId` | `PersonWithDirectoryRelations[]` |
| `GetReportingChainUseCase` | Get full reporting chain up to CEO | `personId` | `EmployeeDirectoryDTO[]` |
| `ListEmployeesForDirectoryUseCase` | Paginated list for table/card views | Pagination params | `PaginatedResult<EmployeeDirectoryDTO>` |

## Hooks Reference

### useOrgChartFilters

Manages search query, department filter, and computes derived data:

```typescript
interface UseOrgChartFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  employeeMap: Map<string, EmployeeDirectoryDTO>;
  departments: string[];
  filteredEmployees: EmployeeDirectoryDTO[];
  rootEmployees: EmployeeDirectoryDTO[];
  departmentHeads: Map<string, EmployeeDirectoryDTO>;
  highlightedNodes: Set<string>;
  handleResetFilters: () => void;
}
```

### useOrgChartState

Manages node expansion state with auto-expand on department change:

```typescript
interface UseOrgChartStateReturn {
  expandedNodes: Set<string>;
  setExpandedNodes: Dispatch<SetStateAction<Set<string>>>;
  handleToggleExpand: (id: string) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
}
```

### useOrgChartLayout

Computes XYFlow nodes and edges using Reingold-Tilford layout algorithm:

```typescript
interface UseOrgChartLayoutReturn {
  nodes: EmployeeNodeType[];
  edges: Edge[];
}
```

## Configuration

### OrgChartConfig

Centralized configuration in `org-chart/config.ts`:

```typescript
export const DEFAULT_ORG_CHART_CONFIG: OrgChartConfig = {
  dimensions: {
    nodeWidth: 192,   // w-48 = 12rem = 192px
    nodeHeight: 120,
  },
  spacing: {
    horizontal: 40,   // Gap between siblings
    vertical: 80,     // Gap between levels
    treeGap: 80,      // Gap between separate trees
  },
  colors: {
    nodeStroke: "hsl(var(--border))",
    nodeHighlight: "hsl(var(--primary))",
    edge: "hsl(var(--border))",
    edgeHighlight: "hsl(var(--primary))",
    minimap: "hsl(var(--muted))",
  },
  fitView: {
    padding: 0.3,
    includeHiddenNodes: false,
  },
  zoom: {
    min: 0.05,
    max: 3,
  },
  marker: {
    width: 15,
    height: 15,
  },
};
```

## Theme Customization

### Avatar Colors

Theme-aware avatar colors with dark mode support:

```typescript
// employee-avatar.tsx
const avatarColors = [
  { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
  { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  // ... 10 color variants
];
```

### XYFlow Theme CSS

Global CSS overrides in `globals.css`:

```css
@layer components {
  .react-flow {
    background-color: hsl(var(--background));
  }

  .react-flow__controls {
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
  }

  .react-flow__minimap {
    background-color: hsl(var(--background) / 0.9);
  }
}
```

## Accessibility

### ARIA Attributes

| Component | ARIA Attribute | Purpose |
|-----------|---------------|---------|
| `EmployeeNode Card` | `role="article"` | Semantic container for employee info |
| `EmployeeNode Card` | `aria-label` | Full employee context for screen readers |
| `EmployeeNode Card` | `tabIndex={0}` | Keyboard focusable |
| Expand Button | `aria-expanded` | Indicates expansion state |
| Expand Button | `aria-label` | Describes action (expand/collapse N reports) |
| Icons | `aria-hidden="true"` | Decorative icons hidden from screen readers |

### Keyboard Navigation

- **Tab**: Navigate between nodes
- **Enter/Space**: View reporting chain for focused node
- **Arrow keys**: Navigate within XYFlow canvas (native support)

## API Reference

### Server Actions

```typescript
// employee-directory.controller.ts

// List employees with pagination
export async function listEmployeesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  orgUnitId?: string;
}): Promise<ActionResult<PaginatedResult<EmployeeDirectoryDTO>>>

// Get root employees (no manager)
export async function getRootEmployeesAction(): Promise<ActionResult<{
  employees: EmployeeDirectoryDTO[];
  total: number;
}>>

// Get direct reports for lazy loading
export async function getDirectReportsAction(managerId: string): Promise<ActionResult<{
  employees: EmployeeDirectoryDTO[];
  total: number;
}>>

// Get reporting chain (recursive CTE)
export async function getReportingChainAction(employeeId: string): Promise<ActionResult<{
  chain: EmployeeDirectoryDTO[];
}>>
```

### EmployeeDirectoryDTO

```typescript
interface EmployeeDirectoryDTO {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  email: string;
  title: string | null;
  department: string | null;
  office: string | null;
  phone: string | null;
  mobile: string | null;
  employeeId: string | null;
  hireDate: string | null;
  isActive: boolean;
  // Resolved relations
  orgUnitId: string;
  orgUnitName: string;
  orgUnitCode: string | null;
  locationId: string | null;
  locationName: string | null;
  locationCity: string | null;
  managerId: string | null;
  managerName: string | null;
  directReportsCount: number;
}
```

## Best Practices

### Performance

1. **Use Lazy Loading**: Don't fetch all employees upfront. Use `getRootEmployeesAction` for initial load, then `getDirectReportsAction` for expansion.

2. **Leverage Recursive CTEs**: For hierarchy queries, always use the PostgreSQL CTE-based repository methods instead of client-side recursion.

3. **Memoize Layout Calculations**: The `useOrgChartLayout` hook uses `useMemo` to prevent recalculating the tree on every render.

### Code Organization

1. **Extract Hooks**: Keep view components lean by extracting state and logic into hooks.

2. **Use Config Objects**: Centralize dimensions, spacing, and colors in a config file for easy customization.

3. **Barrel Exports**: Always create `index.ts` files for clean imports.

### Accessibility

1. **Always Include ARIA Labels**: Every interactive element should have a descriptive label.

2. **Support Keyboard Navigation**: All actions should be triggerable via keyboard.

3. **Use Semantic HTML**: Prefer semantic elements (`article`, `nav`, `button`) over generic `div`.

---

## Related Features

### Person Details Page

While the Employee Directory provides navigation and visualization of the organizational hierarchy, the **Person Details Page** (`/persons/[id]`) offers an in-depth 360-degree view of individual employees:

- **Overview**: Personal info, employment, organization, location, status
- **Organization**: Full reporting chain, direct reports list, role assignments
- **Assets & Licenses**: Intune devices, reservations, kit checkouts, maintenance
- **Services & CMDB**: Service ownerships, configuration items, data ownerships
- **Governance**: Verification campaigns, attachments, disposal activities
- **Activity Log**: Audit trail and activity history

Users can navigate to the Person Details page by clicking an employee's name in the table view or org chart.

See [Person Details Page](./PERSON_DETAILS.md) for complete documentation.

---

**Related Documentation:**
- [Person Details Page](./PERSON_DETAILS.md) - Comprehensive 360-degree view of person profile
- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md)
- [Entity Reference](../guides/ENTITY_REFERENCE.md)
- [Refactoring Patterns](../guides/REFACTORING_PATTERNS.md)
- [Theme System](../architecture/THEME_SYSTEM.md)
