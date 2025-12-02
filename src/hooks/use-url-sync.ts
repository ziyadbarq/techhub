/**
 * useUrlSync Hook
 *
 * Bidirectional URL parameter synchronization with debouncing.
 * Reads URL params on mount and updates URL without page reload.
 *
 * @example
 * ```tsx
 * const urlState = useUrlSync({
 *   params: {
 *     q: { type: 'string', defaultValue: '' },
 *     page: { type: 'number', defaultValue: 1 },
 *     criticality: { type: 'string', defaultValue: 'all' },
 *     hide: { type: 'array', defaultValue: [] },
 *   },
 *   debounceMs: 300,
 * });
 *
 * // Use values
 * console.log(urlState.values.q); // Current search value
 *
 * // Update values
 * urlState.setValue('q', 'search term');
 * urlState.setValues({ q: 'search', page: 2 });
 * ```
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "./use-debounce";

type ParamType = "string" | "number" | "boolean" | "array";

interface ParamConfig<T> {
  type: ParamType;
  defaultValue: T;
}

type ParamConfigs = Record<string, ParamConfig<unknown>>;

type InferredValues<T extends ParamConfigs> = {
  [K in keyof T]: T[K]["defaultValue"];
};

export interface UseUrlSyncOptions<T extends ParamConfigs> {
  params: T;
  debounceMs?: number;
}

export interface UseUrlSyncReturn<T extends ParamConfigs> {
  values: InferredValues<T>;
  setValue: <K extends keyof T>(key: K, value: InferredValues<T>[K]) => void;
  setValues: (values: Partial<InferredValues<T>>) => void;
  clearParam: (key: keyof T) => void;
  clearAll: () => void;
}

/**
 * Parse URL parameter value based on type configuration
 */
function parseParam<T>(value: string | null, config: ParamConfig<T>): T {
  if (value === null) {
    return config.defaultValue;
  }

  try {
    switch (config.type) {
      case "string":
        return value as T;
      case "number": {
        const num = Number(value);
        return (Number.isNaN(num) ? config.defaultValue : num) as T;
      }
      case "boolean":
        return (value === "true") as T;
      case "array":
        return (
          value ? value.split(",").filter(Boolean) : config.defaultValue
        ) as T;
      default:
        return config.defaultValue;
    }
  } catch {
    return config.defaultValue;
  }
}

/**
 * Serialize value to URL parameter string
 */
function serializeParam<T>(value: T, type: ParamType): string {
  switch (type) {
    case "string":
      return String(value);
    case "number":
      return String(value);
    case "boolean":
      return String(value);
    case "array":
      return Array.isArray(value) ? value.join(",") : "";
    default:
      return String(value);
  }
}

/**
 * Hook for bidirectional URL parameter synchronization
 */
export function useUrlSync<T extends ParamConfigs>({
  params,
  debounceMs = 300,
}: UseUrlSyncOptions<T>): UseUrlSyncReturn<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [values, setValuesState] = useState<InferredValues<T>>(() => {
    const initial = {} as InferredValues<T>;
    for (const [key, config] of Object.entries(params)) {
      const urlValue = searchParams.get(key);
      initial[key as keyof T] = parseParam(urlValue, config);
    }
    return initial;
  });

  // Debounce values to prevent URL spam
  const debouncedValues = useDebounce(values, debounceMs);

  // Sync debounced values to URL
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams.toString());
    let changed = false;

    for (const [key, value] of Object.entries(debouncedValues)) {
      const config = params[key];
      if (!config) continue;

      const serialized = serializeParam(value, config.type);
      const isDefault =
        value === config.defaultValue ||
        (config.type === "string" && value === "") ||
        (config.type === "array" && (value as unknown[]).length === 0);

      const currentValue = urlParams.get(key);

      if (isDefault) {
        if (currentValue !== null) {
          urlParams.delete(key);
          changed = true;
        }
      } else if (currentValue !== serialized) {
        urlParams.set(key, serialized);
        changed = true;
      }
    }

    if (changed) {
      const query = urlParams.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    }
  }, [debouncedValues, pathname, router, searchParams, params]);

  // Set a single value
  const setValue = useCallback(
    <K extends keyof T>(key: K, value: InferredValues<T>[K]) => {
      setValuesState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Set multiple values at once
  const setValues = useCallback((newValues: Partial<InferredValues<T>>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Clear a single parameter (reset to default)
  const clearParam = useCallback(
    (key: keyof T) => {
      const config = params[key];
      if (config) {
        setValuesState((prev) => ({
          ...prev,
          [key]: config.defaultValue,
        }));
      }
    },
    [params],
  );

  // Clear all parameters (reset all to defaults)
  const clearAll = useCallback(() => {
    const defaults = {} as InferredValues<T>;
    for (const [key, config] of Object.entries(params)) {
      defaults[key as keyof T] =
        config.defaultValue as InferredValues<T>[keyof T];
    }
    setValuesState(defaults);
  }, [params]);

  return {
    values,
    setValue,
    setValues,
    clearParam,
    clearAll,
  };
}
