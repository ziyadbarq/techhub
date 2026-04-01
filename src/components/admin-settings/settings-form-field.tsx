"use client";

import {
  AlertTriangle,
  Database,
  RefreshCw,
  RotateCcw,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date-format";
import type { SettingResponseDTO } from "@/interface-adapters/dtos/settings/settings.dto";

interface SettingsFormFieldProps {
  setting: SettingResponseDTO;
  value: string | null;
  isDirty: boolean;
  disabled: boolean;
  onChange: (key: string, value: string | null) => void;
  onReset?: (key: string) => void;
}

export function SettingsFormField({
  setting,
  value,
  isDirty,
  disabled,
  onChange,
  onReset,
}: SettingsFormFieldProps) {
  const inputId = `setting-${setting.key}`;

  return (
    <div
      className={cn(
        "border-border/60 bg-card/80 space-y-3 rounded-2xl border p-5 backdrop-blur transition-colors",
        isDirty && "ring-primary/30 ring-2",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={inputId}
              className="text-sm leading-none font-medium"
            >
              {setting.label}
            </Label>
            <SourceBadge source={setting.source} />
            {setting.requiresRestart && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50/80 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Restart
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {setting.description}
          </p>
        </div>

        {setting.source === "database" && onReset && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 shrink-0 gap-1.5 px-2 text-xs"
            onClick={() => onReset(setting.key)}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="max-w-md">
        <FieldInput
          setting={setting}
          value={value}
          disabled={disabled}
          inputId={inputId}
          onChange={onChange}
        />
      </div>

      {setting.updatedByEmail && setting.updatedAt && (
        <p className="text-muted-foreground/70 text-[11px]">
          Last updated by {setting.updatedByEmail} on{" "}
          {formatDate(setting.updatedAt)}
        </p>
      )}

      <p className="text-muted-foreground/50 font-mono text-[10px] tracking-wider">
        {setting.key}
      </p>
    </div>
  );
}

function FieldInput({
  setting,
  value,
  disabled,
  inputId,
  onChange,
}: {
  setting: SettingResponseDTO;
  value: string | null;
  disabled: boolean;
  inputId: string;
  onChange: (key: string, value: string | null) => void;
}) {
  switch (setting.valueType) {
    case "boolean":
      return (
        <div className="flex items-center gap-3 pt-1">
          <Switch
            id={inputId}
            checked={value === "true" || value === "1"}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onChange(setting.key, checked ? "true" : "false")
            }
          />
          <Label htmlFor={inputId} className="text-muted-foreground text-sm">
            {value === "true" || value === "1" ? "Enabled" : "Disabled"}
          </Label>
        </div>
      );

    case "enum":
      return (
        <Select
          value={value ?? ""}
          disabled={disabled}
          onValueChange={(v) => onChange(setting.key, v)}
        >
          <SelectTrigger id={inputId}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {setting.enumOptions?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "secret":
      return (
        <PasswordInput
          id={inputId}
          placeholder={setting.hasValue ? "••••••••" : "Not configured"}
          disabled={disabled}
          onChange={(e) => onChange(setting.key, e.target.value || null)}
        />
      );

    case "number":
      return (
        <Input
          id={inputId}
          type="number"
          value={value ?? ""}
          placeholder="Not set"
          disabled={disabled}
          onChange={(e) => onChange(setting.key, e.target.value || null)}
        />
      );

    default:
      return (
        <Input
          id={inputId}
          type="text"
          value={value ?? ""}
          placeholder="Not set"
          disabled={disabled}
          onChange={(e) => onChange(setting.key, e.target.value || null)}
        />
      );
  }
}

function SourceBadge({ source }: { source: SettingResponseDTO["source"] }) {
  switch (source) {
    case "database":
      return (
        <Badge
          variant="outline"
          className="border-sky-300 bg-sky-50/80 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
        >
          <Database className="mr-1 h-3 w-3" />
          DB Override
        </Badge>
      );
    case "env":
      return (
        <Badge
          variant="outline"
          className="border-border/70 text-muted-foreground"
        >
          <Server className="mr-1 h-3 w-3" />
          Env
        </Badge>
      );
    case "not-set":
      return (
        <Badge
          variant="outline"
          className="border-red-300 bg-red-50/80 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Not Set
        </Badge>
      );
    default:
      return null;
  }
}
