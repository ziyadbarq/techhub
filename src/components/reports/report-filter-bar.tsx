/**
 * Report Filter Bar
 *
 * Renders dynamic filter controls based on a report's filter definitions.
 * Filters with `optionsSource` load their options from the database on mount.
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play } from "lucide-react";
import { getFilterOptionsAction } from "@/interface-adapters/controllers/reports/report.controller";
import type {
  ReportFilterDefinition,
  ReportFilterOption,
  FilterOptionsSource,
} from "@/core/domain/reports/report-types";

interface ReportFilterBarProps {
  filters: ReportFilterDefinition[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onRun: () => void;
  loading?: boolean;
}

export function ReportFilterBar({
  filters,
  values,
  onChange,
  onRun,
  loading,
}: ReportFilterBarProps) {
  // Dynamic options loaded from DB, keyed by optionsSource
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, ReportFilterOption[]>
  >({});

  useEffect(() => {
    // Collect unique sources that need loading
    const sources = new Set<FilterOptionsSource>();
    for (const f of filters) {
      if (f.optionsSource && !f.options) {
        sources.add(f.optionsSource);
      }
    }

    if (sources.size === 0) return;

    // Load all sources in parallel
    const loadOptions = async () => {
      const entries = await Promise.all(
        Array.from(sources).map(async (source) => {
          const result = await getFilterOptionsAction(source);
          return [source, result.success ? result.data : []] as const;
        }),
      );
      setDynamicOptions(Object.fromEntries(entries));
    };

    loadOptions();
  }, [filters]);

  const getOptions = (filter: ReportFilterDefinition): ReportFilterOption[] => {
    if (filter.options) return filter.options;
    if (filter.optionsSource) return dynamicOptions[filter.optionsSource] ?? [];
    return [];
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      {filters.map((filter) => {
        const options = getOptions(filter);
        const isSelect =
          filter.type === "select" && (filter.options || filter.optionsSource);

        return (
          <div key={filter.key} className="min-w-40 space-y-1">
            <Label htmlFor={filter.key} className="text-xs">
              {filter.label}
            </Label>

            {filter.type === "date-range" ? (
              <Input
                id={filter.key}
                type="date"
                value={values[filter.key] ?? ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="h-9"
              />
            ) : isSelect ? (
              <Select
                value={values[filter.key] ?? ""}
                onValueChange={(v) => onChange(filter.key, v)}
              >
                <SelectTrigger id={filter.key} className="h-9">
                  <SelectValue
                    placeholder={filter.placeholder ?? "Select..."}
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={filter.key}
                value={values[filter.key] ?? ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="h-9"
              />
            )}
          </div>
        );
      })}

      <Button onClick={onRun} disabled={loading} size="sm" className="h-9">
        <Play className="mr-1 h-4 w-4" />
        {loading ? "Running..." : "Run Report"}
      </Button>
    </div>
  );
}
