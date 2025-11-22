# Code Generation System

**Automatic code/tag generation for entities** - A comprehensive guide to the auto-generation system that creates unique identifiers for all major entities in Barq Assets.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Supported Entities](#supported-entities)
4. [Usage Patterns](#usage-patterns)
5. [User Experience](#user-experience)
6. [Implementation Details](#implementation-details)
7. [Database Schema](#database-schema)
8. [Adding New Entities](#adding-new-entities)

---

## Overview

### What is Code Generation?

The code generation system automatically creates unique, sequential identifiers (codes/tags) for entities when they are created. This eliminates the need for users to manually enter codes while still allowing manual override when needed.

### Key Features

- ✅ **Automatic Generation** - Sequential codes generated in format `PREFIX-NNNNNN`
- ✅ **Concurrent Safe** - Database-backed sequences ensure no duplicates
- ✅ **Manual Override** - Optional manual entry via collapsible UI
- ✅ **Scoped Sequences** - Support for entity-specific scoping (e.g., LifecycleState per model)
- ✅ **13 Entity Types** - Covers all major entities in the system

### Benefits

1. **Improved UX** - Users don't need to think about code formats or numbering
2. **Consistency** - All codes follow the same pattern
3. **No Conflicts** - Database ensures uniqueness even with concurrent requests
4. **Flexibility** - Manual override available for special cases

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Forms with collapsible code fields                     │ │
│  │ - Hidden by default on create                          │ │
│  │ - "Manually set code" button reveals field             │ │
│  │ - Always visible on edit                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Interface Adapters                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DTOs with optional code fields                         │ │
│  │ Controllers pass undefined when code not provided      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Use Cases                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Auto-generate code if not provided:                    │ │
│  │ const code = props.code ??                             │ │
│  │   await codeGenerator.generateCode(TYPE, PREFIX)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Code Generator Service                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Database-backed sequence generation                    │ │
│  │ Atomic upsert operations for concurrency safety        │ │
│  │ Format: PREFIX-NNNNNN (6-digit padding)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (Prisma)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CodeSequence table                                     │ │
│  │ - entityType: Unique identifier                        │ │
│  │ - prefix: Code prefix                                  │ │
│  │ - lastNumber: Current sequence number                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Service Interface

```typescript
export interface ICodeGeneratorService {
  /**
   * Generate next sequential code for entity type
   * @param entityType - Unique identifier for entity type
   * @param prefix - Code prefix (e.g., "VENDOR", "ASSET")
   * @param options - Optional configuration (scopeId, timestamp-based)
   * @returns Generated code (e.g., "VENDOR-000001")
   */
  generateCode(
    entityType: string,
    prefix: string,
    options?: CodeGenerationOptions,
  ): Promise<string>;

  /**
   * Generate timestamp-based code (fallback for conflicts)
   */
  generateTimestampCode(prefix: string): string;

  /**
   * Validate code format
   */
  validateFormat(code: string): boolean;

  /**
   * Preview next sequence number without incrementing
   */
  peekNextSequence(entityType: string): Promise<number>;

  /**
   * Reset sequence counter (admin use only)
   */
  resetSequence(entityType: string, startFrom?: number): Promise<void>;
}
```

---

## Supported Entities

| Entity            | Code Field | Prefix | Example       | Scoped |
| ----------------- | ---------- | ------ | ------------- | ------ |
| Vendor            | `code`     | VENDOR | VENDOR-000001 | No     |
| Asset             | `assetTag` | ASSET  | ASSET-000001  | No     |
| Organization Unit | `code`     | ORG    | ORG-000001    | No     |
| Location          | `code`     | LOC    | LOC-000001    | No     |
| Lifecycle State   | `code`     | STATE  | STATE-000001  | Yes\*  |
| CI Class          | `code`     | CI     | CI-000001     | No     |
| Relationship Type | `code`     | REL    | REL-000001    | No     |
| Asset Category    | `code`     | CAT    | CAT-000001    | No     |
| Asset Model       | `code`     | MODEL  | MODEL-000001  | No     |
| Stock Location    | `code`     | STOCK  | STOCK-000001  | No     |
| Asset Kit         | `code`     | KIT    | KIT-000001    | No     |
| Contract Type     | `code`     | CTYPE  | CTYPE-000001  | No     |
| License Product   | `code`     | LIC    | LIC-000001    | No     |

\* **Lifecycle State** is scoped per lifecycle model, meaning each model has its own sequence starting from STATE-000001.

---

## Usage Patterns

### For End Users

#### Creating a New Entity (Default Behavior)

1. Open create form (e.g., "Create Vendor")
2. Fill in required fields (name, type, etc.)
3. **Code field is hidden** - no need to enter a code
4. Click "Create"
5. System auto-generates code: `VENDOR-000001`, `VENDOR-000002`, etc.

#### Manual Code Entry (Optional)

1. Open create form
2. Click **"Manually set code (optional)"** button
3. Code field expands
4. Enter custom code (must match format: `PREFIX-NNNNNN`)
5. Click "Create"
6. System validates and saves your custom code

#### Editing Existing Entity

1. Open edit form
2. **Code field is always visible**
3. Modify code if needed (must remain unique)
4. Click "Update"

### For Developers

#### In Use Cases

```typescript
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

@injectable()
export class CreateVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(props: CreateVendorProps): Promise<Vendor> {
    // Auto-generate code if not provided
    const code =
      props.code ?? (await this.codeGenerator.generateCode("VENDOR", "VENDOR"));

    // Check for duplicate
    const existingVendor = await this.vendorRepository.findByName(props.name);
    if (existingVendor) {
      throw new Error(`Vendor with name "${props.name}" already exists`);
    }

    const vendor = Vendor.create({ ...props, code });
    return await this.vendorRepository.create(vendor);
  }
}
```

#### In Forms (React Components)

```typescript
export function VendorForm({ vendor, onSuccess }: VendorFormProps) {
  const isEditing = !!vendor;
  const [showCodeField, setShowCodeField] = useState(isEditing);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(CreateVendorSchema),
    defaultValues: {
      name: vendor?.name ?? "",
      code: vendor?.code ?? "",
      // ... other fields
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Name field */}
        <FormField name="name" {...} />

        {/* Code field - conditional rendering */}
        {!showCodeField && !isEditing ? (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCodeField(true)}
            >
              <Edit2 className="mr-2 h-3 w-3" />
              Manually set code (optional)
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Code will be auto-generated if not provided
            </p>
          </div>
        ) : (
          <FormField
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Code {isEditing && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="VENDOR-001"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Unique vendor code"
                    : "Leave empty to auto-generate"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Other fields */}
      </form>
    </Form>
  );
}
```

---

## User Experience

### Create Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Create Vendor                                          [x]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name *                                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Acme Corporation                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ✎ Manually set code (optional)                            │
│  Code will be auto-generated if not provided               │
│                                                             │
│  Vendor Type *                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ MANUFACTURER                        ▼              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│                               [Cancel]  [Create Vendor]    │
└─────────────────────────────────────────────────────────────┘
```

After clicking **"Manually set code (optional)"**:

```
┌─────────────────────────────────────────────────────────────┐
│ Create Vendor                                          [x]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name *                                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Acme Corporation                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Code                                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ VENDOR-001                                         │    │
│  └────────────────────────────────────────────────────┘    │
│  Leave empty to auto-generate                              │
│                                                             │
│  Vendor Type *                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ MANUFACTURER                        ▼              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│                               [Cancel]  [Create Vendor]    │
└─────────────────────────────────────────────────────────────┘
```

### Edit Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Vendor                                            [x]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name *                                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Acme Corporation                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Code *                                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ VENDOR-000042                                      │    │
│  └────────────────────────────────────────────────────┘    │
│  Unique vendor code (uppercase letters, numbers, -)        │
│                                                             │
│  Vendor Type *                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ MANUFACTURER                        ▼              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│                               [Cancel]  [Update Vendor]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Service Implementation

**Location:** `src/infrastructure/services/code-generator/code-generator.service.ts`

```typescript
@injectable()
export class CodeGeneratorService implements ICodeGeneratorService {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private readonly logger: ILoggerService,
  ) {}

  async generateCode(
    entityType: string,
    prefix: string,
    options?: CodeGenerationOptions,
  ): Promise<string> {
    const entityTypeKey = options?.scopeId
      ? `${entityType}:${options.scopeId}`
      : entityType;

    // Atomic upsert for concurrency safety
    const sequence = await this.prisma.codeSequence.upsert({
      where: { entityType: entityTypeKey },
      create: {
        entityType: entityTypeKey,
        prefix,
        lastNumber: 1,
      },
      update: {
        lastNumber: { increment: 1 },
      },
    });

    const paddedNumber = String(sequence.lastNumber).padStart(6, "0");
    return `${prefix}-${paddedNumber}`;
  }
}
```

### Concurrency Safety

The service uses **Prisma's atomic upsert** operation with increment:

```typescript
update: {
  lastNumber: {
    increment: 1;
  }
}
```

This ensures that even with multiple concurrent requests:

1. Each request gets a unique number
2. No duplicates are created
3. No gaps in the sequence (unless manually deleted)

### Scoped Sequences

For entities that need unique codes within a scope (like LifecycleState per model):

```typescript
// LifecycleState codes are unique per lifecycle model
const code =
  props.code ??
  (await this.codeGenerator.generateCode("LIFECYCLE_STATE", "STATE", {
    scopeId: props.lifecycleModelId, // Scope to specific model
  }));
```

This creates separate sequences:

- Model A: `STATE-000001`, `STATE-000002`, ...
- Model B: `STATE-000001`, `STATE-000002`, ...

---

## Database Schema

### CodeSequence Table

```prisma
model CodeSequence {
  id         String   @id @default(cuid())
  entityType String   @unique
  prefix     String
  lastNumber Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([entityType])
  @@map("code_sequences")
}
```

### Seed Data Initialization

**Location:** `src/infrastructure/database/prisma/seed.ts`

```typescript
// Initialize code sequences
const sequenceConfigs = [
  { entityType: "VENDOR", prefix: "VENDOR" },
  { entityType: "ASSET", prefix: "ASSET" },
  { entityType: "ORGANIZATION_UNIT", prefix: "ORG" },
  { entityType: "LOCATION", prefix: "LOC" },
  { entityType: "LIFECYCLE_STATE", prefix: "STATE" },
  { entityType: "CI_CLASS", prefix: "CI" },
  { entityType: "RELATIONSHIP_TYPE", prefix: "REL" },
  { entityType: "ASSET_CATEGORY", prefix: "CAT" },
  { entityType: "ASSET_MODEL", prefix: "MODEL" },
  { entityType: "STOCK_LOCATION", prefix: "STOCK" },
  { entityType: "ASSET_KIT", prefix: "KIT" },
  { entityType: "CONTRACT_TYPE", prefix: "CTYPE" },
  { entityType: "LICENSE_PRODUCT", prefix: "LIC" },
];

for (const config of sequenceConfigs) {
  await prisma.codeSequence.create({
    data: {
      entityType: config.entityType,
      prefix: config.prefix,
      lastNumber: 0,
    },
  });
}
```

---

## Adding New Entities

To add code generation for a new entity type, follow these steps:

### 1. Update DTO (Make Code Optional)

**File:** `src/interface-adapters/dtos/generated/[entity].dto.ts`

```typescript
export const CreateEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/)
    .optional(), // ← Make optional
  // ... other fields
});
```

### 2. Update Use Case

**File:** `src/core/use-cases/[entity]/create-[entity].use-case.ts`

```typescript
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateEntityProps {
  name: string;
  code?: string; // ← Make optional
  // ... other fields
}

@injectable()
export class CreateEntityUseCase {
  constructor(
    @inject(DI_TOKENS.IEntityRepository)
    private readonly entityRepository: IEntityRepository,
    @inject(DI_TOKENS.ICodeGeneratorService) // ← Inject service
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(props: CreateEntityProps): Promise<Entity> {
    // Auto-generate code if not provided
    const code =
      props.code ??
      (await this.codeGenerator.generateCode("ENTITY_TYPE", "PREFIX"));

    // Check for duplicates
    const existsByCode = await this.entityRepository.existsByCode(code);
    if (existsByCode) {
      throw new Error(`Entity with code "${code}" already exists`);
    }

    const entity = Entity.create({ ...props, code });
    return await this.entityRepository.create(entity);
  }
}
```

### 3. Update Entity Interface

**File:** `src/core/domain/entities/[entity].entity.ts`

```typescript
export interface CreateEntityProps {
  name: string;
  code?: string; // ← Make optional
  // ... other fields
}

export class Entity {
  static create(props: CreateEntityProps): Entity {
    // Ensure code is provided (should be auto-generated by use case)
    if (!props.code) {
      throw new Error("Code is required");
    }

    // ... validation and entity creation
  }
}
```

### 4. Update Form Component

**File:** `src/components/[entities]/[entity]-form.tsx`

```typescript
export function EntityForm({ entity, onSuccess }: EntityFormProps) {
  const isEditing = !!entity;
  const [showCodeField, setShowCodeField] = useState(isEditing);

  // ... form setup

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Name field */}
        <FormField name="name" {...} />

        {/* Code field with collapsible pattern */}
        {!showCodeField && !isEditing ? (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCodeField(true)}
              className="h-8 text-xs"
            >
              <Edit2 className="mr-2 h-3 w-3" />
              Manually set code (optional)
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Code will be auto-generated if not provided
            </p>
          </div>
        ) : (
          <FormField
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Code{" "}
                  {isEditing && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="PREFIX-000001"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Unique entity code"
                    : "Leave empty to auto-generate"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Other fields */}
      </form>
    </Form>
  );
}
```

### 5. Initialize Sequence in Seed Script

**File:** `src/infrastructure/database/prisma/seed.ts`

```typescript
const sequenceConfigs = [
  // ... existing sequences
  { entityType: "MY_NEW_ENTITY", prefix: "MYNEW" }, // ← Add new sequence
];
```

### 6. Update Tests

**File:** `src/core/use-cases/[entity]/__tests__/create-[entity].use-case.test.ts`

```typescript
class MockCodeGeneratorService implements Partial<ICodeGeneratorService> {
  private counters = new Map<string, number>();

  async generateCode(entityType: string, prefix: string): Promise<string> {
    const current = this.counters.get(entityType) || 0;
    const next = current + 1;
    this.counters.set(entityType, next);
    return `${prefix}-${String(next).padStart(6, "0")}`;
  }
}

describe("CreateEntityUseCase", () => {
  let useCase: CreateEntityUseCase;
  let mockRepository: MockEntityRepository;
  let mockCodeGenerator: MockCodeGeneratorService;

  beforeEach(() => {
    mockRepository = new MockEntityRepository();
    mockCodeGenerator = new MockCodeGeneratorService();
    useCase = new CreateEntityUseCase(
      mockRepository as unknown as IEntityRepository,
      mockCodeGenerator as unknown as ICodeGeneratorService,
    );
  });

  // ... tests
});
```

---

## Best Practices

### DO ✅

- **Let the system generate codes** - Only manually set codes for special cases
- **Use consistent prefixes** - Keep prefixes short (3-6 chars) and descriptive
- **Validate format** - Ensure manual codes follow the `PREFIX-NNNNNN` pattern
- **Check for duplicates** - Always validate code uniqueness before saving
- **Use scoping when needed** - For entities with composite unique constraints
- **Initialize sequences in seed** - Ensure sequences exist before first use

### DON'T ❌

- **Don't create gaps** - Let the system handle sequential numbering
- **Don't reuse codes** - Deleted entities should not have their codes reassigned
- **Don't skip validation** - Even auto-generated codes should be validated
- **Don't hardcode sequences** - Always use the CodeGeneratorService
- **Don't forget DI** - Always inject ICodeGeneratorService via constructor

---

## Troubleshooting

### Code Generation Fails

**Symptom:** "Code already exists" error even though no entity has that code

**Solution:** Check if the sequence was initialized in seed script. Run:

```bash
npm run reset  # Resets database and re-seeds
```

### Duplicate Codes in Concurrent Requests

**Symptom:** Two entities created with same code

**Solution:** This should never happen due to atomic database operations. If it does:

1. Check Prisma version compatibility
2. Verify database supports atomic upsert
3. Review transaction isolation level

### Form Not Showing Code Field on Edit

**Symptom:** Code field hidden when editing existing entity

**Solution:** Check `useState` initialization:

```typescript
const [showCodeField, setShowCodeField] = useState(isEditing);
```

Should be `true` when editing.

### Sequence Starts from Wrong Number

**Symptom:** First generated code is `PREFIX-000042` instead of `PREFIX-000001`

**Solution:** Sequence was initialized with wrong `lastNumber`. Reset via:

```typescript
await codeGenerator.resetSequence("ENTITY_TYPE", 0);
```

---

## Related Documentation

- [Developer Guide](DEVELOPER_GUIDE.md) - General development patterns
- [Entity Reference](ENTITY_REFERENCE.md) - Entity validation standards
- [Database Seeding](DATABASE_SEEDING.md) - Seed data management
- [Prisma Guide](PRISMA_GUIDE.md) - Database operations
