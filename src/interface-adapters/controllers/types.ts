/**
 * Controller Types
 *
 * Defines common types used across all controllers.
 */

/**
 * ActionResponse discriminated union type
 *
 * All server actions return this type for consistent error handling.
 */
export type ActionResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * BulkCreateResult type
 *
 * Response type for bulk create operations.
 */
export type BulkCreateResult = {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{
    index: number;
    name: string;
    error: string;
  }>;
};
