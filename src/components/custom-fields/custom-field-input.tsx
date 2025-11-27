/**
 * CustomFieldInput Component
 * Renders the appropriate input based on field data type
 * Supports all 14 data types including reference types
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

// Actions for reference types
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";

interface CustomFieldInputProps {
  field: EnrichedAssetCategoryFieldDTO;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const NONE_VALUE = "__none__";

export function CustomFieldInput({
  field,
  value,
  onChange,
  error,
  disabled = false,
  className,
}: CustomFieldInputProps) {
  // Render based on data type
  switch (field.dataType as FieldDataTypeEnum) {
    case "STRING":
      return (
        <StringInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "TEXT":
      return (
        <TextInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "INTEGER":
      return (
        <IntegerInput
          field={field}
          value={value as number | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "DECIMAL":
      return (
        <DecimalInput
          field={field}
          value={value as number | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "BOOLEAN":
      return (
        <BooleanInput
          field={field}
          value={value as boolean | null}
          onChange={onChange}
          disabled={disabled}
          className={className}
        />
      );

    case "DATE":
      return (
        <DateInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "DATETIME":
      return (
        <DateTimeInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "ENUM":
      return (
        <EnumInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "JSON":
      return (
        <JsonInput
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "CI_REFERENCE":
      return (
        <CIReferenceInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "PERSON_REFERENCE":
      return (
        <PersonReferenceInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "ORG_UNIT_REFERENCE":
      return (
        <OrgUnitReferenceInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "LOCATION_REFERENCE":
      return (
        <LocationReferenceInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    default:
      return (
        <div className="text-muted-foreground text-sm">
          Unsupported field type: {field.dataType}
        </div>
      );
  }
}

// Individual input components for each data type

interface BaseInputProps {
  field: EnrichedAssetCategoryFieldDTO;
  error?: string;
  disabled?: boolean;
  className?: string;
}

interface StringInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function StringInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: StringInputProps) {
  const rules = field.validationRules;
  const maxLength =
    typeof rules?.maxLength === "number" ? rules.maxLength : undefined;
  const minLength =
    typeof rules?.minLength === "number" ? rules.minLength : undefined;
  const pattern =
    typeof rules?.pattern === "string" ? rules.pattern : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={field.fieldDescription || `Enter ${field.fieldLabel}`}
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface TextInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function TextInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: TextInputProps) {
  const rules = field.validationRules;
  const maxLength =
    typeof rules?.maxLength === "number" ? rules.maxLength : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={field.fieldDescription || `Enter ${field.fieldLabel}`}
        disabled={disabled}
        maxLength={maxLength}
        className={cn("resize-none", error && "border-destructive")}
        rows={3}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface IntegerInputProps extends BaseInputProps {
  value: number | null;
  onChange: (value: unknown) => void;
}

function IntegerInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: IntegerInputProps) {
  const rules = field.validationRules;
  const min = typeof rules?.min === "number" ? rules.min : undefined;
  const max = typeof rules?.max === "number" ? rules.max : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="number"
        step="1"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : parseInt(val, 10));
        }}
        placeholder={field.fieldDescription || `Enter ${field.fieldLabel}`}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface DecimalInputProps extends BaseInputProps {
  value: number | null;
  onChange: (value: unknown) => void;
}

function DecimalInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: DecimalInputProps) {
  const rules = field.validationRules;
  const min = typeof rules?.min === "number" ? rules.min : undefined;
  const max = typeof rules?.max === "number" ? rules.max : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="number"
        step="0.01"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : parseFloat(val));
        }}
        placeholder={field.fieldDescription || `Enter ${field.fieldLabel}`}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface BooleanInputProps extends BaseInputProps {
  value: boolean | null;
  onChange: (value: unknown) => void;
}

function BooleanInput({
  field: _field,
  value,
  onChange,
  disabled,
  className,
}: BooleanInputProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        checked={value ?? false}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={disabled}
      />
      <span className="text-muted-foreground text-sm">
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

interface DateInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function DateInput({
  field: _field,
  value,
  onChange,
  error,
  disabled,
  className,
}: DateInputProps) {
  // Convert ISO string to YYYY-MM-DD format for input
  const inputValue = value ? new Date(value).toISOString().split("T")[0] : "";

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="date"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? new Date(val).toISOString() : null);
        }}
        disabled={disabled}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface DateTimeInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function DateTimeInput({
  field: _field,
  value,
  onChange,
  error,
  disabled,
  className,
}: DateTimeInputProps) {
  // Convert ISO string to datetime-local format
  const inputValue = value ? new Date(value).toISOString().slice(0, 16) : "";

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="datetime-local"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? new Date(val).toISOString() : null);
        }}
        disabled={disabled}
        className={cn(error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface EnumInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function EnumInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: EnumInputProps) {
  const options = field.enumOptions ?? [];

  return (
    <div className={cn("space-y-2", className)}>
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(val) => onChange(val === NONE_VALUE ? null : val)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={`Select ${field.fieldLabel}`} />
        </SelectTrigger>
        <SelectContent>
          {!field.isRequired && (
            <SelectItem value={NONE_VALUE}>None</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface JsonInputProps extends BaseInputProps {
  value: unknown;
  onChange: (value: unknown) => void;
}

function JsonInput({
  field: _field,
  value,
  onChange,
  error,
  disabled,
  className,
}: JsonInputProps) {
  const [jsonString, setJsonString] = useState(() => {
    if (value === null || value === undefined) return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  });
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleChange = (newValue: string) => {
    setJsonString(newValue);
    if (!newValue.trim()) {
      setJsonError(null);
      onChange(null);
      return;
    }
    try {
      const parsed = JSON.parse(newValue);
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='{"key": "value"}'
        disabled={disabled}
        className={cn(
          "resize-none font-mono text-sm",
          (error || jsonError) && "border-destructive",
        )}
        rows={4}
      />
      {(jsonError || error) && (
        <p className="text-destructive text-xs">{jsonError || error}</p>
      )}
    </div>
  );
}

// Reference type inputs with data loading

interface ReferenceInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function CIReferenceInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: ReferenceInputProps) {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      try {
        const result = await listConfigurationItemsAction();
        if (result.success) {
          const opts: SearchableSelectOption[] = [
            { value: NONE_VALUE, label: "None" },
            ...result.data.map((ci) => ({
              value: ci.id,
              label: ci.ciKey ? `${ci.name} (${ci.ciKey})` : ci.name,
            })),
          ];
          setOptions(opts);
        }
      } catch {
        // Failed to load options
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <SearchableSelect
        options={options}
        value={value ?? NONE_VALUE}
        onValueChange={(val) => onChange(val === NONE_VALUE ? null : val)}
        placeholder={loading ? "Loading..." : `Select ${field.fieldLabel}`}
        searchPlaceholder="Search configuration items..."
        emptyMessage="No configuration items found"
        disabled={disabled || loading}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function PersonReferenceInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: ReferenceInputProps) {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      try {
        const result = await listPersonsAction();
        if (result.success) {
          const opts: SearchableSelectOption[] = [
            { value: NONE_VALUE, label: "None" },
            ...result.data.map((person) => ({
              value: person.id,
              label: `${person.firstName} ${person.lastName}`,
            })),
          ];
          setOptions(opts);
        }
      } catch {
        // Failed to load options
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <SearchableSelect
        options={options}
        value={value ?? NONE_VALUE}
        onValueChange={(val) => onChange(val === NONE_VALUE ? null : val)}
        placeholder={loading ? "Loading..." : `Select ${field.fieldLabel}`}
        searchPlaceholder="Search people..."
        emptyMessage="No people found"
        disabled={disabled || loading}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function OrgUnitReferenceInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: ReferenceInputProps) {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      try {
        const result = await listOrganizationUnitsAction();
        if (result.success) {
          const opts: SearchableSelectOption[] = [
            { value: NONE_VALUE, label: "None" },
            ...result.data.map((ou) => ({
              value: ou.id,
              label: `${ou.name} (${ou.code})`,
            })),
          ];
          setOptions(opts);
        }
      } catch {
        // Failed to load options
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <SearchableSelect
        options={options}
        value={value ?? NONE_VALUE}
        onValueChange={(val) => onChange(val === NONE_VALUE ? null : val)}
        placeholder={loading ? "Loading..." : `Select ${field.fieldLabel}`}
        searchPlaceholder="Search organization units..."
        emptyMessage="No organization units found"
        disabled={disabled || loading}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function LocationReferenceInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: ReferenceInputProps) {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      try {
        const result = await listLocationsAction();
        if (result.success) {
          const opts: SearchableSelectOption[] = [
            { value: NONE_VALUE, label: "None" },
            ...result.data.map((loc) => ({
              value: loc.id,
              label: `${loc.name} (${loc.code})`,
            })),
          ];
          setOptions(opts);
        }
      } catch {
        // Failed to load options
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <SearchableSelect
        options={options}
        value={value ?? NONE_VALUE}
        onValueChange={(val) => onChange(val === NONE_VALUE ? null : val)}
        placeholder={loading ? "Loading..." : `Select ${field.fieldLabel}`}
        searchPlaceholder="Search locations..."
        emptyMessage="No locations found"
        disabled={disabled || loading}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default CustomFieldInput;
