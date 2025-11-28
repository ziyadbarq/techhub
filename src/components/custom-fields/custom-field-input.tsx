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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Link as LinkIcon,
  Mail,
  Phone as PhoneIcon,
  DollarSign,
  Paperclip,
} from "lucide-react";
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

    // New data types (Phase 3)
    case "URL":
      return (
        <UrlInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "EMAIL":
      return (
        <EmailInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "PHONE":
      return (
        <PhoneInput
          field={field}
          value={value as string | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "MULTI_SELECT_ENUM":
      return (
        <MultiSelectEnumInput
          field={field}
          value={value as string[] | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "CURRENCY":
      return (
        <CurrencyInput
          field={field}
          value={value as { amount: number; currency: string } | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case "ATTACHMENT_REFERENCE":
      return (
        <AttachmentReferenceInput
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

// New data type inputs (Phase 3)

interface UrlInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function UrlInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: UrlInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <LinkIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.fieldDescription || "https://example.com"}
          disabled={disabled}
          className={cn("pl-10", error && "border-destructive")}
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface EmailInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function EmailInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: EmailInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="email"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.fieldDescription || "user@example.com"}
          disabled={disabled}
          className={cn("pl-10", error && "border-destructive")}
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface PhoneInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function PhoneInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <PhoneIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="tel"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.fieldDescription || "+1 (555) 123-4567"}
          disabled={disabled}
          className={cn("pl-10", error && "border-destructive")}
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface MultiSelectEnumInputProps extends BaseInputProps {
  value: string[] | null;
  onChange: (value: unknown) => void;
}

function MultiSelectEnumInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: MultiSelectEnumInputProps) {
  const options = field.enumOptions ?? [];
  const selectedValues = value ?? [];

  const handleToggle = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, option]);
    } else {
      onChange(selectedValues.filter((v) => v !== option));
    }
  };

  const handleRemove = (option: string) => {
    onChange(selectedValues.filter((v) => v !== option));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected values as badges */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val) => (
            <Badge key={val} variant="secondary" className="gap-1">
              {val}
              <button
                type="button"
                onClick={() => handleRemove(val)}
                className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {/* Checkbox options */}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-center gap-2 text-sm",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Checkbox
              checked={selectedValues.includes(option)}
              onCheckedChange={(checked) => handleToggle(option, !!checked)}
              disabled={disabled}
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

// Common currencies for the selector
const COMMON_CURRENCIES = [
  { code: "SAR", name: "Saudi Riyal" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AED", name: "UAE Dirham" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "EGP", name: "Egyptian Pound" },
];

interface CurrencyInputProps extends BaseInputProps {
  value: { amount: number; currency: string } | null;
  onChange: (value: unknown) => void;
}

function CurrencyInput({
  field: _field,
  value,
  onChange,
  error,
  disabled,
  className,
}: CurrencyInputProps) {
  const amount = value?.amount ?? null;
  const currency = value?.currency ?? "SAR";

  const handleAmountChange = (newAmount: number | null) => {
    if (newAmount === null) {
      onChange(null);
    } else {
      onChange({ amount: newAmount, currency });
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (amount === null) {
      onChange(null);
    } else {
      onChange({ amount, currency: newCurrency });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="number"
            step="0.01"
            value={amount ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              handleAmountChange(val === "" ? null : parseFloat(val));
            }}
            placeholder="0.00"
            disabled={disabled}
            className={cn("pl-10", error && "border-destructive")}
          />
        </div>
        <Select
          value={currency}
          onValueChange={handleCurrencyChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

interface AttachmentReferenceInputProps extends BaseInputProps {
  value: string | null;
  onChange: (value: unknown) => void;
}

function AttachmentReferenceInput({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: AttachmentReferenceInputProps) {
  // For now, this is a simple text input for attachment ID
  // In the future, this could be enhanced with a file picker/uploader
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Paperclip className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.fieldDescription || "Attachment ID"}
          disabled={disabled}
          className={cn("pl-10", error && "border-destructive")}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Enter an existing attachment ID or upload a new attachment
      </p>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default CustomFieldInput;
