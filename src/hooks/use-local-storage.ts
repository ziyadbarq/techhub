/**
 * useLocalStorage Hook
 *
 * Safe localStorage hook with error handling, SSR support, and TypeScript types.
 * Automatically syncs state with localStorage and handles edge cases like:
 * - Incognito mode where localStorage may be disabled
 * - SSR where localStorage is not available
 * - JSON parsing errors
 * - Storage quota exceeded
 *
 * @example
 * ```tsx
 * const [isDark, setIsDark] = useLocalStorage('theme-dark', false);
 *
 * // Use like regular useState
 * <Button onClick={() => setIsDark(!isDark)}>Toggle Theme</Button>
 * ```
 */

"use client";

import { useCallback, useEffect, useState } from "react";

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, SetValue<T>] {
  // State to store our value
  // Always start with initialValue to prevent hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage after hydration completes (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Sync state when storage changes in another tab/window
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
