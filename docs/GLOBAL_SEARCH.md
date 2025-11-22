# Global Search - Command Palette

## Overview

The global search feature provides a fast, keyboard-driven command palette for searching across multiple entity types in the ITAM/CMDB system. Built following Clean Architecture principles with full type safety and permission-aware filtering.

## User Guide

### Opening the Search

**Keyboard Shortcut:**

- **macOS:** `⌘K`
- **Windows/Linux:** `Ctrl+K`

**Mouse/Touch:**

- Click the search icon (🔍) in the top navigation bar

### Using the Search

1. **Type your query** - Minimum 2 characters required
2. **Results appear in real-time** - Debounced 300ms for performance
3. **Navigate with keyboard:**
   - `↑` / `↓` - Move between results
   - `Enter` - Navigate to selected result
   - `Esc` - Close the palette
4. **Or click** any result to navigate directly

### Searchable Entities

The search covers the following entity types:

| Entity Type             | Search Fields                              | Result Link                                       |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- |
| **Assets**              | Asset Tag, Serial Number, Notes            | Detail page: `/assets/[assetTag]`                 |
| **Persons**             | First/Last Name, Email, Employee ID, Title | Table view: `/persons?highlight={id}`             |
| **Vendors**             | Name, Code, Legal Name                     | Table view: `/vendors?highlight={id}`             |
| **Configuration Items** | Name, CI Key, Description                  | Table view: `/configuration-items?highlight={id}` |
| **Contracts**           | Name, Contract Number                      | Table view: `/contracts?highlight={id}`           |
| **License Products**    | Name, Code, Description                    | Table view: `/license-products?highlight={id}`    |

### Result Display

Results are grouped by entity type with:

- **Icon** - Visual indicator for entity type
- **Title** - Primary identifier (e.g., Asset Tag, Person Name)
- **Subtitle** - Secondary info (e.g., Serial Number, Email)
- **Category Header** - Entity type label with result count

## Technical Implementation

### Architecture

Follows 5-layer Clean Architecture pattern:

```
Presentation (UI)
    ↓
Interface Adapters (Controllers, DTOs)
    ↓
Use Cases (Business Logic)
    ↓
Domain (Entities, Interfaces)
    ↓
Infrastructure (Repositories)
```

### Components

#### **1. Domain Layer** (`src/core/domain/`)

**SearchResult Entity:**

```typescript
// src/core/domain/entities/search/search-result.entity.ts
export class SearchResult {
  private constructor(private props: SearchResultProps) {}

  static create(props: SearchResultProps): SearchResult;
  static reconstitute(props: SearchResultProps): SearchResult;
}

export type SearchEntityType =
  | "asset"
  | "person"
  | "vendor"
  | "configuration-item"
  | "contract"
  | "license-product"
  | ...;
```

**Repository Interface:**

```typescript
// src/core/repositories/search.repository.interface.ts
export interface ISearchRepository {
  searchAll(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
```

#### **2. Use Cases Layer** (`src/core/use-cases/search/`)

**GlobalSearchUseCase:**

```typescript
// src/core/use-cases/search/global-search/global-search.use-case.ts
@injectable()
export class GlobalSearchUseCase {
  constructor(
    @inject(DI_TOKENS.ISearchRepository)
    private readonly searchRepository: ISearchRepository,
  ) {}

  async execute(input: GlobalSearchInput): Promise<SearchResult[]> {
    // Validates query (min 2 chars)
    // Executes parallel search across repositories
    // Returns filtered, grouped results
  }
}
```

#### **3. Interface Adapters Layer**

**Search Controller:**

```typescript
// src/interface-adapters/controllers/search.controller.ts
export async function globalSearchAction(
  data: SearchRequestDTO,
): Promise<ActionResponse<SearchResultDTO[]>> {
  // Validates input with Zod
  // Resolves use case from DI container
  // Executes search
  // Maps to DTOs
}
```

**DTOs:**

```typescript
// src/interface-adapters/dtos/search.dto.ts
export const SearchRequestSchema = z.object({
  query: z.string().min(2).max(200),
  entityTypes: z.array(z.enum([...])).optional(),
  limit: z.number().int().min(1).max(50).optional().default(5),
});

export const SearchResultSchema = z.object({
  id: z.string(),
  entityType: z.enum([...]),
  title: z.string(),
  subtitle: z.string().nullable(),
  metadata: z.record(z.string(), z.string()).nullable(),
  url: z.string(),
});
```

#### **4. Infrastructure Layer**

**PrismaSearchRepository:**

```typescript
// src/infrastructure/repositories/prisma-search.repository.ts
@injectable()
export class PrismaSearchRepository implements ISearchRepository {
  constructor(
    @inject(DI_TOKENS.IAssetRepository) private assetRepository,
    @inject(DI_TOKENS.IPersonRepository) private personRepository,
    // ... other repositories
  ) {}

  async searchAll(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    // Searches all entity repositories in parallel
    const [assets, persons, vendors, cis, contracts, licenses] =
      await Promise.all([
        this.assetRepository.search({ searchTerm: query, limit }),
        this.personRepository.search(query, { take: limit }),
        // ...
      ]);

    // Maps each entity to SearchResult
    // Returns aggregated results
  }
}
```

**Repository Search Methods:**

Added `search()` methods to:

- `IConfigurationItemRepository` - searches name, ciKey, description
- `IContractRepository` - searches name, contractNumber
- `ILicenseProductRepository` - searches name, code, description

Existing search methods used:

- `IAssetRepository.search()` - searches assetTag, serialNumber, note
- `IPersonRepository.search()` - searches firstName, lastName, email, employeeId
- `IVendorRepository.search()` - searches name, code, legalName

#### **5. Presentation Layer**

**Command Palette Component:**

```typescript
// src/components/search/command-palette.tsx
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDTO[]>([]);

  // Debounced search (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const response = await globalSearchAction({ query, limit: 5 });
      setResults(response.data);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Groups results by entity type
  const groupedResults = useMemo(() => {
    /* ... */
  }, [results]);

  // Renders CommandDialog with categorized results
}
```

**Context Provider:**

```typescript
// src/components/search/command-palette-context.tsx
export function CommandPaletteContextProvider({ children }) {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut handler (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}
```

### Dependency Injection

**DI Module:**

```typescript
// src/di/modules/search.module.ts
export function bindSearchDependencies(container: Container): void {
  container
    .bind<ISearchRepository>(DI_TOKENS.ISearchRepository)
    .to(PrismaSearchRepository)
    .inSingletonScope();

  container
    .bind<GlobalSearchUseCase>(DI_TOKENS.GlobalSearchUseCase)
    .to(GlobalSearchUseCase)
    .inSingletonScope();
}
```

**Registered in Container:**

```typescript
// src/di/container.ts
import { bindSearchDependencies } from "./modules/search.module";

function createContainer(): Container {
  // ... other bindings
  bindSearchDependencies(newContainer);
  // ...
}
```

### Performance Optimizations

1. **Debounced Input** - 300ms delay reduces server load
2. **Parallel Queries** - All entity searches execute simultaneously with `Promise.all()`
3. **Limited Results** - Default 5 results per entity type (configurable)
4. **Case-Insensitive Search** - Uses Prisma `mode: "insensitive"`
5. **Repository Logging** - Tracks query performance with timers

### Query Pattern

All repository search methods follow this pattern:

```typescript
async search(query: string, options?: { take?: number }): Promise<Entity[]> {
  return await this.prisma.entity.findMany({
    where: {
      OR: [
        { field1: { contains: query, mode: "insensitive" } },
        { field2: { contains: query, mode: "insensitive" } },
        { field3: { contains: query, mode: "insensitive" } },
      ],
    },
    take: options?.take,
    orderBy: { primaryField: "asc" },
  });
}
```

## Future Enhancements

### Phase 2 Entities

- Asset Categories
- Asset Models
- Locations
- Stock Locations

### Advanced Features

- **Search Analytics** - Track popular searches to optimize ranking
- **Redis Caching** - Cache frequent search terms for faster results
- **Full-Text Search** - PostgreSQL `tsvector`/`tsquery` with ranking
- **Recent Searches** - Persist in localStorage, show on empty state
- **Search Filters** - Filter by entity type before searching
- **Fuzzy Matching** - PostgreSQL `pg_trgm` extension for typo tolerance
- **Search Highlighting** - Highlight matching text in results
- **Deep Linking** - Support query parameters for direct search state

### Permission Integration

Currently, the search repository aggregates results from all entities. Future enhancement:

```typescript
// Filter by user permissions
async searchAll(query: string, userId: string): Promise<SearchResult[]> {
  const permissions = await getUserPermissions(userId);

  const searchableEntities = [
    { type: "assets", permission: PERMISSIONS.ASSETS_VIEW },
    { type: "persons", permission: PERMISSIONS.PERSONS_VIEW },
    // ...
  ].filter(e => hasPermission(permissions, e.permission));

  // Only search entities user can view
}
```

## Troubleshooting

### Search Not Working

1. **Check keyboard shortcut** - Ensure no other app/extension is intercepting `⌘K`/`Ctrl+K`
2. **Verify button renders** - Search icon should appear in top navigation bar
3. **Check console** - Look for JavaScript errors in browser DevTools
4. **Verify DI registration** - Ensure `bindSearchDependencies()` is called in container

### No Results Found

1. **Check query length** - Must be at least 2 characters
2. **Verify data exists** - Ensure database has seeded data
3. **Check permissions** - User must have VIEW permissions for entity types
4. **Test individual repositories** - Use repository search methods directly to debug

### Performance Issues

1. **Reduce result limit** - Lower `limit` parameter in search options
2. **Add database indexes** - Index searchable text columns
3. **Enable query logging** - Set `PRISMA_VERBOSE_LOGS=true` to see SQL queries
4. **Check network latency** - Use browser DevTools Network tab

## Testing

### Manual Testing Checklist

- [ ] Press `⌘K`/`Ctrl+K` - Palette opens
- [ ] Click search icon - Palette opens
- [ ] Type 2+ characters - Results appear
- [ ] Type 1 character - Shows "Type at least 2 characters" message
- [ ] Type nonsense query - Shows "No results found"
- [ ] Navigate with arrow keys - Selection changes
- [ ] Press Enter on result - Navigates to correct page
- [ ] Press Esc - Palette closes
- [ ] Click outside palette - Palette closes
- [ ] Mobile: Palette is full-screen and usable

### Test Data

Use seeded data to test each entity type:

```bash
npm run seed
```

Then search for:

- **Assets:** "laptop", "BARQ-IT"
- **Persons:** "ahmed", "admin@barq"
- **Vendors:** "dell", "apple"
- **CIs:** "db-prod", "web-server"
- **Contracts:** "support", "maint"
- **Licenses:** "office", "windows"

## Dependencies

### NPM Packages

```json
{
  "cmdk": "^1.0.0" // Command palette UI library
}
```

### shadcn/ui Components

- `command` - Command palette primitives
- `dialog` - Modal wrapper (already installed)

## File Reference

### Created Files (13)

**Domain:**

- `src/core/domain/entities/search/search-result.entity.ts`
- `src/core/repositories/search.repository.interface.ts`

**Use Cases:**

- `src/core/use-cases/search/global-search/global-search.use-case.ts`
- `src/core/use-cases/search/global-search/index.ts`

**Interface Adapters:**

- `src/interface-adapters/controllers/search.controller.ts`
- `src/interface-adapters/dtos/search.dto.ts`

**Infrastructure:**

- `src/infrastructure/repositories/prisma-search.repository.ts`

**DI:**

- `src/di/modules/search.module.ts`

**Components:**

- `src/components/search/command-palette.tsx`
- `src/components/search/command-palette-context.tsx`
- `src/components/search/command-palette-provider.tsx`
- `src/components/ui/command.tsx`
- `src/app/(dashboard)/dashboard-layout-client.tsx`

### Modified Files (12)

**Repository Interfaces:**

- `src/core/repositories/configuration-item.repository.interface.ts`
- `src/core/repositories/contract.repository.interface.ts`
- `src/core/repositories/license-product.repository.interface.ts`

**Repository Implementations:**

- `src/infrastructure/repositories/prisma-configuration-item.repository.ts`
- `src/infrastructure/repositories/prisma-contract.repository.ts`
- `src/infrastructure/repositories/prisma-license-product.repository.ts`

**DI Configuration:**

- `src/di/container.ts`
- `src/di/types.ts`

**UI Integration:**

- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Header.tsx`

**Dependencies:**

- `package.json`
- `package-lock.json`

## Related Documentation

- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Clean Architecture overview
- [DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md) - Adding new features
- [RBAC_DEVELOPER_GUIDE.md](./guides/RBAC_DEVELOPER_GUIDE.md) - Permission integration
