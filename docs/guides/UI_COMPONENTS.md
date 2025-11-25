# UI Components Guide

Advanced UI component patterns for building production-ready interfaces with TanStack Table, React Hook Form, and CSV operations.

## Table of Contents

- [DataTable Component](#datatable-component)
- [React Hook Form Integration](#react-hook-form-integration)
- [CSV Import/Export](#csv-importexport)
- [Form Utilities](#form-utilities)
- [Best Practices](#best-practices)

---

## DataTable Component

Generic, reusable data table built with TanStack Table v9. Supports sorting, filtering, pagination, row selection, and column visibility.

### Basic Usage

```tsx
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";

// Define columns
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <span>{row.getValue("name")}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email"),
  },
];

// Use in component
<DataTable
  columns={columns}
  data={users}
  searchable
  searchKey="name"
  searchPlaceholder="Search users..."
  pagination={{ pageSize: 10 }}
/>;
```

### Props Reference

| Prop                | Type                         | Default         | Description                   |
| ------------------- | ---------------------------- | --------------- | ----------------------------- |
| `columns`           | `ColumnDef<TData, TValue>[]` | **required**    | Column definitions            |
| `data`              | `TData[]`                    | **required**    | Table data                    |
| `pagination`        | `PaginationOptions`          | `undefined`     | Pagination config             |
| `searchable`        | `boolean`                    | `false`         | Enable search input           |
| `searchKey`         | `string`                     | `undefined`     | Column key to search          |
| `searchPlaceholder` | `string`                     | `"Search..."`   | Search input placeholder      |
| `selectable`        | `boolean`                    | `false`         | Enable row selection          |
| `onSelectionChange` | `(rows: TData[]) => void`    | `undefined`     | Selection change callback     |
| `showColumnToggle`  | `boolean`                    | `true`          | Show column visibility toggle |
| `loading`           | `boolean`                    | `false`         | Loading state                 |
| `emptyMessage`      | `string`                     | `"No results."` | Empty state message           |
| `toolbarActions`    | `ReactNode`                  | `undefined`     | Custom toolbar actions        |

### Pagination Options

```tsx
interface PaginationOptions {
  pageSize?: number; // Items per page
  pageIndex?: number; // Current page (0-indexed)
  total?: number; // Total items (for server-side)
  onPaginationChange?: (state: PaginationState) => void; // Server-side callback
}
```

### Sortable Columns

Use `DataTableColumnHeader` for sortable columns:

```tsx
{
  accessorKey: "createdAt",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Created" />
  ),
  cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PP"),
}
```

### Filterable Columns

Add custom filter functions:

```tsx
{
  accessorKey: "status",
  header: "Status",
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id));
  },
}
```

### Row Selection

```tsx
const [selectedRows, setSelectedRows] = useState<User[]>([]);

<DataTable
  columns={columns}
  data={users}
  selectable
  onSelectionChange={setSelectedRows}
/>;
```

### Custom Actions Column

```tsx
{
  id: "actions",
  cell: ({ row }) => {
    const item = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(item)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

### Server-Side Pagination

```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
const [total, setTotal] = useState(0);

const handlePaginationChange = async (newPagination: PaginationState) => {
  setPagination(newPagination);
  // Fetch data from server
  const result = await fetchData({
    page: newPagination.pageIndex,
    pageSize: newPagination.pageSize,
  });
  setData(result.data);
  setTotal(result.total);
};

<DataTable
  columns={columns}
  data={data}
  pagination={{
    pageSize: pagination.pageSize,
    pageIndex: pagination.pageIndex,
    total: total,
    onPaginationChange: handlePaginationChange,
  }}
/>;
```

---

## React Hook Form Integration

Type-safe form handling with Zod validation following shadcn/ui patterns.

### Basic Form Setup

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name..." {...field} />
              </FormControl>
              <FormDescription>Your full name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
```

### With Server Actions

```tsx
import { handleFormSubmit } from "@/lib/forms";
import { createUserAction } from "@/interface-adapters/controllers/user.controller";

const onSubmit = async (data: FormData) => {
  const result = await createUserAction(data);

  if (result.success) {
    toast.success("User created!");
    form.reset();
  } else {
    toast.error(result.error);
  }
};

// Or use the helper
const onSubmit = handleFormSubmit(createUserAction, {
  successMessage: "User created!",
  onSuccess: () => {
    form.reset();
    router.push("/users");
  },
});
```

### Select Fields

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<FormField
  control={form.control}
  name="status"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Status</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>;
```

### SearchableSelect Component

For dropdowns with many options (>10 items), use the `SearchableSelect` component which provides search/filter functionality and limits visible results:

```tsx
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";

// Define options (memoize to prevent re-renders)
const categoryOptions: SearchableSelectOption[] = useMemo(
  () =>
    categories.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.code})`,
    })),
  [categories]
);

// Use with React Hook Form
<FormField
  control={form.control}
  name="categoryId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <SearchableSelect
        options={categoryOptions}
        value={field.value || undefined}
        onValueChange={field.onChange}
        placeholder="Select a category..."
        searchPlaceholder="Search categories..."
        emptyMessage="No categories found"
        maxVisibleItems={5}
        disabled={loading}
      />
      <FormMessage />
    </FormItem>
  )}
/>;
```

#### SearchableSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SearchableSelectOption[]` | **required** | Array of options with value/label |
| `value` | `string` | `undefined` | Selected value |
| `onValueChange` | `(value: string) => void` | **required** | Selection change callback |
| `placeholder` | `string` | `"Select..."` | Trigger button placeholder |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `emptyMessage` | `string` | `"No results found"` | Empty state message |
| `maxVisibleItems` | `number` | `5` | Max visible items before "X more" |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `undefined` | Additional CSS classes |

#### When to Use SearchableSelect vs Select

| Scenario | Component |
|----------|-----------|
| Static list with <10 items | `Select` |
| Dynamic list that may grow | `SearchableSelect` |
| Entity lookups (persons, assets, etc.) | `SearchableSelect` |
| Enum values (status, type) | `Select` |
| User-facing forms with many options | `SearchableSelect` |

### Textarea Fields

```tsx
import { Textarea } from "@/components/ui/textarea";

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Enter description..."
          rows={4}
          {...field}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormDescription>
        {field.value?.length || 0}/2000 characters
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>;
```

### Checkbox Fields

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<FormField
  control={form.control}
  name="agreeToTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Accept terms and conditions</FormLabel>
        <FormDescription>
          You agree to our Terms of Service and Privacy Policy
        </FormDescription>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>;
```

### Dynamic Field Arrays

```tsx
import { useFieldArray } from "react-hook-form";

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "items",
});

{
  fields.map((field, index) => (
    <div key={field.id} className="flex gap-2">
      <FormField
        control={form.control}
        name={`items.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={() => remove(index)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ));
}

<Button type="button" variant="outline" onClick={() => append({ name: "" })}>
  Add Item
</Button>;
```

---

## CSV Import/Export

CSV operations with validation and error handling.

### Service Architecture

**Interface** (`src/core/services/csv.service.interface.ts`):

```typescript
export interface ICSVService {
  exportToCSV<T>(data: T[], options?: CSVExportOptions): string;
  importFromCSV<T>(
    file: File,
    schema: ZodSchema<T>,
  ): Promise<CSVImportResult<T>>;
  parseCSV<T>(csvString: string, schema: ZodSchema<T>): CSVImportResult<T>;
}
```

**Implementation** (`src/infrastructure/services/csv/papaparse-csv.service.ts`):

- Uses PapaParse for parsing
- Validates with Zod schemas
- Detailed error reporting

### Export CSV

```tsx
import { exportTasksToCSV } from "@/interface-adapters/controllers/csv.controller";

const handleExport = async () => {
  const result = await exportTasksToCSV(tasks);

  if (result.success && result.data) {
    // Create download
    const blob = new Blob([result.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Exported successfully");
  }
};
```

### Import CSV

Use the `CSVImportModal` component:

```tsx
import { CSVImportModal } from "@/components/tasks/csv-import-modal";

const [isImportOpen, setIsImportOpen] = useState(false);

<CSVImportModal
  open={isImportOpen}
  onOpenChange={setIsImportOpen}
  onSuccess={() => {
    loadData();
    toast.success("Import complete");
  }}
/>;
```

### Custom CSV Import

```tsx
import { importTasksFromCSV } from "@/interface-adapters/controllers/csv.controller";

const handleFileUpload = async (file: File) => {
  const content = await file.text();
  const result = await importTasksFromCSV(content);

  if (result.success && result.data) {
    console.log(`Imported ${result.data.successCount} items`);
    console.log(`Failed: ${result.data.errorCount}`);

    result.data.errors.forEach((error) => {
      console.error(`Row ${error.row}: ${error.message}`);
    });
  }
};
```

### CSV Format

Required columns (example for tasks):

```csv
Title,Description,Status
"Task 1","Description here",PENDING
"Task 2","Another task",IN_PROGRESS
"Task 3","Completed task",COMPLETED
```

Header mapping is automatic via the controller's `headerMap` option.

---

## Form Utilities

Helper functions for common form operations.

### handleFormSubmit

Wrapper for server actions with automatic error handling:

```tsx
import { handleFormSubmit } from "@/lib/forms";

const onSubmit = handleFormSubmit(createTaskAction, {
  successMessage: "Task created!",
  errorMessage: "Failed to create task",
  onSuccess: (data) => {
    form.reset();
    router.push(`/tasks/${data.id}`);
  },
  onError: (error) => {
    console.error(error);
  },
});
```

### getFieldError

Extract error messages from field errors:

```tsx
import { getFieldError } from "@/lib/forms";

const titleError = getFieldError(form.formState.errors, "title");
```

### formatZodError

Format Zod validation errors for display:

```tsx
import { formatZodError } from "@/lib/forms";

try {
  schema.parse(data);
} catch (error) {
  const message = formatZodError(error);
  toast.error(message);
}
```

### debounce

Debounce async validation:

```tsx
import { debounce } from "@/lib/forms";

const checkUsername = debounce(async (username: string) => {
  const result = await checkUsernameAvailable(username);
  return result.available;
}, 500);
```

---

## Best Practices

### Data Tables

1. **Always use column accessors**: Define `accessorKey` for sortable/filterable columns
2. **Memoize columns**: Define columns outside component or use `useMemo`
3. **Server-side pagination**: For large datasets (>1000 rows)
4. **Optimize renders**: Use `enableRowSelection` sparingly
5. **Loading states**: Always show loading skeleton during data fetch

### Forms

1. **Validate at boundaries**: Use Zod schemas in both form and server action
2. **Handle errors gracefully**: Show toast notifications for errors
3. **Reset on success**: Clear form after successful submission
4. **Disable on submit**: Prevent double submissions
5. **Show character counts**: For fields with length limits

### CSV Operations

1. **Validate before import**: Use `validateTasksCSV` to preview errors
2. **Limit file size**: Add file size checks (e.g., max 5MB)
3. **Show progress**: For large imports, use progress indicators
4. **Batch operations**: Import in chunks for large files (>1000 rows)
5. **Error reporting**: Always show which rows failed and why

### Performance

1. **Virtual scrolling**: For tables with 100+ rows, consider virtualization
2. **Lazy loading**: Load data on demand for large datasets
3. **Debounce searches**: Debounce search input (300-500ms)
4. **Optimize columns**: Hide heavy columns by default
5. **Memoize callbacks**: Use `useCallback` for table callbacks

---

## Example Implementation

See the complete Task CRUD example:

- **DataTable**: `/src/components/tasks/tasks-table.tsx`
- **Form**: `/src/components/task/task-form.tsx`
- **CSV Import**: `/src/components/tasks/csv-import-modal.tsx`
- **Page**: `/src/app/(dashboard)/tasks/page.tsx`

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- **Keyboard navigation**: Full keyboard support
- **ARIA labels**: Proper semantic HTML and ARIA attributes
- **Focus management**: Clear focus indicators
- **Screen readers**: Descriptive labels and announcements
- **Color contrast**: Meets AA contrast ratios

---

## TypeScript

All components are fully typed:

```tsx
import { type ColumnDef } from "@tanstack/react-table";
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";

// Infer types from schemas
type FormData = z.infer<typeof formSchema>;

// Generic components
function MyTable<T>({ data }: { data: T[] }) {
  // ...
}
```

---

## Troubleshooting

### Table not sorting

- Check that `accessorKey` is defined on the column
- Ensure `getSortedRowModel` is included in table config

### Form not validating

- Verify Zod schema is passed to `zodResolver`
- Check that field names match schema keys

### CSV import failing

- Verify CSV headers match expected format
- Check for encoding issues (should be UTF-8)
- Validate that Zod schema matches data structure

### Performance issues

- Enable server-side pagination for large datasets
- Use `React.memo` for table cells
- Debounce search inputs
- Limit visible columns

---

## Related Documentation

- [Architecture Guide](../ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Theme System](../THEME_SYSTEM.md)
- [Controller Error Handling](../../src/interface-adapters/controllers/README.md)
