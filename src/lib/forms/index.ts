/**
 * Form Utilities
 *
 * Helper functions and types for working with React Hook Form
 */

import { toast } from "sonner";
import { ZodError } from "zod";
import type { FieldErrors } from "react-hook-form";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; [key: string]: unknown };

/**
 * Extract error message from field errors
 */
export function getFieldError(
  errors: FieldErrors,
  field: string,
): string | undefined {
  const error = errors[field];
  if (!error) return undefined;
  return error.message as string;
}

/**
 * Handle form submission with server action
 *
 * Automatically handles loading states, errors, and success feedback.
 *
 * @example
 * ```tsx
 * const onSubmit = handleFormSubmit(
 *   async (data) => await createTaskAction(data),
 *   {
 *     onSuccess: () => {
 *       toast.success("Task created!");
 *       reset();
 *     },
 *   }
 * );
 * ```
 */
export function handleFormSubmit<TData, TResult>(
  action: (data: TData) => Promise<ActionResponse<TResult>>,
  options?: {
    onSuccess?: (data: TResult) => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  },
) {
  return async (data: TData) => {
    try {
      const result = await action(data);

      if (result.success) {
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        if (options?.onSuccess && result.data !== undefined) {
          options.onSuccess(result.data);
        }
      } else {
        const errorMsg =
          options?.errorMessage || result.error || "An error occurred";
        toast.error(errorMsg);
        if (options?.onError) {
          options.onError(result.error || "Unknown error");
        }
      }

      return result;
    } catch (error) {
      const errorMsg = options?.errorMessage || "An unexpected error occurred";
      toast.error(errorMsg);
      if (options?.onError) {
        options.onError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
      throw error;
    }
  };
}

/**
 * Format Zod validation errors for display
 */
export function formatZodError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
  }
  return "Validation failed";
}

/**
 * Debounce function for async validation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,

  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Type-safe form field props helper
 */
export type FormFieldProps<T> = {
  name: keyof T;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
};

/**
 * Generate form field id from name
 */
export function getFieldId(name: string): string {
  return name.replace(/\./g, "-").replace(/\[/g, "-").replace(/\]/g, "");
}
