# Controller Error Handling Pattern

## Overview

All controllers now have access to a centralized error handler that provides:

- ✅ Structured logging via `controllerLogger`
- ✅ Type-safe error categorization (Zod, Domain, Generic)
- ✅ Consistent error message formatting
- ✅ Reduced code duplication

## Usage

### Option 1: Manual Error Handling (Recommended for complex flows)

```typescript
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";

export async function someAction(
  formData: FormData,
): Promise<ActionResponse<SomeDTO>> {
  try {
    // ... business logic
    return { success: true, data: responseData };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "someAction", userId: session?.userId },
      "Failed to perform action",
    );
  }
}
```

### Option 2: Wrapper Function (Best for simple actions)

```typescript
import { withErrorHandler } from "./error-handler";

export const someAction = withErrorHandler(
  async (formData: FormData): Promise<SomeDTO> => {
    // ... business logic (no try-catch needed)
    return responseData;
  },
  "someAction",
  "Failed to perform action",
);
```

## Migration Checklist

To migrate existing controllers:

1. **Add imports:**

   ```typescript
   import { handleControllerError } from "./error-handler";
   import type { ActionResponse } from "./types";
   ```

2. **Remove local ActionResponse type** (use shared type from `./types`)

3. **Replace catch blocks:**

   ```typescript
   // OLD:
   } catch (error) {
     console.error("[functionName] Error:", error);
     return {
       success: false,
       error: error instanceof Error ? error.message : "Fallback message",
     };
   }

   // NEW:
   } catch (error) {
     return handleControllerError(
       error,
       { function: "functionName" },
       "Fallback message",
     );
   }
   ```

## Benefits

- **Consistent logging:** All errors logged with structured data
- **Better debugging:** Context passed to logger for troubleshooting
- **Type safety:** Proper handling of Zod, Domain, and generic errors
- **DRY:** 20+ lines of duplicated code → 5 lines

## Files to Migrate

Apply this pattern to:

- ✅ `error-handler.ts` (created)
- ⏳ `presentation.controller.ts` (6 catch blocks)
- ⏳ `folder.controller.ts`
- ⏳ `theme.controller.ts`
- ⏳ `template.controller.ts`
- ⏳ `asset.controller.ts`
- ⏳ `slidev.controller.ts`
- ⏳ `ai.controller.ts`
- ⏳ `ai-debug.controller.ts`
- ⏳ `file.controller.ts`
