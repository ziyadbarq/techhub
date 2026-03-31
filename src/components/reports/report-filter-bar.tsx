/**
 * Report Filter Bar
 *
 * Renders dynamic filter controls based on a report's filter definitions.
 */

"use client";

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
import type { ReportFilterDefinition } from "@/core/domain/reports/report-types";

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
  return (
    <div className="flex flex-wrap items-end gap-4">
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[160px] space-y-1">
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
          ) : filter.type === "select" && filter.options ? (
            <Select
              value={values[filter.key] ?? ""}
              onValueChange={(v) => onChange(filter.key, v)}
            >
              <SelectTrigger id={filter.key} className="h-9">
                <SelectValue placeholder={filter.placeholder ?? "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((opt) => (
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
      ))}

      <Button onClick={onRun} disabled={loading} size="sm" className="h-9">
        <Play className="mr-1 h-4 w-4" />
        {loading ? "Running..." : "Run Report"}
      </Button>
    </div>
  );
}
