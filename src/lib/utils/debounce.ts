/**
 * Debounce Utility
 *
 * Creates a debounced function that delays invoking the provided function
 * until after `delay` milliseconds have elapsed since the last time it was invoked.
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching:', query);
 * }, 300);
 *
 * debouncedSearch('hello'); // Will only execute after 300ms of no calls
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-explicit-any
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>): void => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  };

  // Cancel pending execution
  debounced.cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  // Execute immediately with last arguments
  debounced.flush = (): void => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}
