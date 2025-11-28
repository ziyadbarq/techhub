/**
 * Field Definition Preview Component
 * Shows a live preview of how the field will appear based on current form values
 */

"use client";

import { useState } from "react";
import {
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  FileJson,
  Link,
  User,
  Building2,
  MapPin,
  Eye,
  AlertCircle,
  Link as LinkIcon,
  Mail,
  Phone,
  ListChecks,
  DollarSign,
  Paperclip,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

// Data type configuration
const DATA_TYPE_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    badge: "default" | "secondary" | "outline";
  }
> = {
  STRING: {
    icon: Type,
    label: "Short Text",
    description: "Single-line text input (up to 255 chars)",
    badge: "default",
  },
  TEXT: {
    icon: Type,
    label: "Long Text",
    description: "Multi-line text area",
    badge: "default",
  },
  INTEGER: {
    icon: Hash,
    label: "Integer",
    description: "Whole numbers only",
    badge: "secondary",
  },
  DECIMAL: {
    icon: Hash,
    label: "Decimal",
    description: "Numbers with decimal places",
    badge: "secondary",
  },
  BOOLEAN: {
    icon: ToggleLeft,
    label: "Yes/No",
    description: "Toggle switch (true/false)",
    badge: "outline",
  },
  DATE: {
    icon: Calendar,
    label: "Date",
    description: "Date picker (no time)",
    badge: "outline",
  },
  DATETIME: {
    icon: Calendar,
    label: "Date & Time",
    description: "Date and time picker",
    badge: "outline",
  },
  ENUM: {
    icon: List,
    label: "Dropdown",
    description: "Select from predefined options",
    badge: "default",
  },
  JSON: {
    icon: FileJson,
    label: "JSON",
    description: "Structured JSON data",
    badge: "secondary",
  },
  CI_REFERENCE: {
    icon: Link,
    label: "CI Reference",
    description: "Link to Configuration Item",
    badge: "outline",
  },
  PERSON_REFERENCE: {
    icon: User,
    label: "Person Reference",
    description: "Link to Person record",
    badge: "outline",
  },
  ORG_UNIT_REFERENCE: {
    icon: Building2,
    label: "Org Unit Reference",
    description: "Link to Organization Unit",
    badge: "outline",
  },
  LOCATION_REFERENCE: {
    icon: MapPin,
    label: "Location Reference",
    description: "Link to Location record",
    badge: "outline",
  },
  // New data types (Phase 3)
  URL: {
    icon: LinkIcon,
    label: "URL",
    description: "Web address (clickable link)",
    badge: "default",
  },
  EMAIL: {
    icon: Mail,
    label: "Email",
    description: "Email address",
    badge: "default",
  },
  PHONE: {
    icon: Phone,
    label: "Phone",
    description: "Phone number",
    badge: "default",
  },
  MULTI_SELECT_ENUM: {
    icon: ListChecks,
    label: "Multi-Select",
    description: "Select multiple options",
    badge: "default",
  },
  CURRENCY: {
    icon: DollarSign,
    label: "Currency",
    description: "Amount with currency code",
    badge: "secondary",
  },
  ATTACHMENT_REFERENCE: {
    icon: Paperclip,
    label: "Attachment",
    description: "Link to uploaded file",
    badge: "outline",
  },
};

interface FieldDefinitionPreviewProps {
  label: string;
  name: string;
  description?: string | null;
  dataType: FieldDataTypeEnum;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: unknown;
  enumOptions?: string[];
  validationRules?: Record<string, unknown> | null;
  className?: string;
}

export function FieldDefinitionPreview({
  label,
  name,
  description,
  dataType,
  isRequired,
  isUnique,
  defaultValue,
  enumOptions = [],
  validationRules,
  className,
}: FieldDefinitionPreviewProps) {
  const [previewValue, setPreviewValue] = useState<unknown>(
    defaultValue ?? null,
  );
  const config = DATA_TYPE_CONFIG[dataType] || DATA_TYPE_CONFIG.STRING;
  const Icon = config.icon;

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="text-muted-foreground h-4 w-4" />
          <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field Type Info */}
        <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">{config.label}</span>
          <Badge variant={config.badge} className="ml-auto text-xs">
            {dataType}
          </Badge>
        </div>

        {/* Field Preview */}
        <div className="bg-background space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              {label || "Field Label"}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {isUnique && (
              <Badge variant="outline" className="text-xs">
                Unique
              </Badge>
            )}
          </div>

          {/* Render appropriate input based on data type */}
          <PreviewInput
            dataType={dataType}
            value={previewValue}
            onChange={setPreviewValue}
            enumOptions={enumOptions}
            validationRules={validationRules}
            label={label}
            isRequired={isRequired}
          />

          {description && (
            <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          )}
        </div>

        {/* Field Name (Technical) */}
        <div className="text-muted-foreground text-xs">
          <span className="font-medium">Field name: </span>
          <code className="bg-muted rounded px-1 py-0.5">
            {name || "field_name"}
          </code>
        </div>

        {/* Validation Rules Preview */}
        {validationRules && Object.keys(validationRules).length > 0 && (
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <AlertCircle className="h-3 w-3" />
              Validation Rules
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(validationRules).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PreviewInputProps {
  dataType: FieldDataTypeEnum;
  value: unknown;
  onChange: (value: unknown) => void;
  enumOptions?: string[];
  validationRules?: Record<string, unknown> | null;
  label: string;
  isRequired: boolean;
}

function PreviewInput({
  dataType,
  value,
  onChange,
  enumOptions = [],
  validationRules,
  label,
  isRequired,
}: PreviewInputProps) {
  const placeholder = `Enter ${label || "value"}...`;
  const rules = validationRules || {};

  switch (dataType) {
    case FieldDataTypeEnum.STRING:
      return (
        <Input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={placeholder}
          maxLength={
            typeof rules.maxLength === "number" ? rules.maxLength : 255
          }
          minLength={
            typeof rules.minLength === "number" ? rules.minLength : undefined
          }
        />
      );

    case FieldDataTypeEnum.TEXT:
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={placeholder}
          rows={3}
          maxLength={
            typeof rules.maxLength === "number" ? rules.maxLength : undefined
          }
          className="resize-none"
        />
      );

    case FieldDataTypeEnum.INTEGER:
      return (
        <Input
          type="number"
          step="1"
          value={(value as number) ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === "" ? null : parseInt(val, 10));
          }}
          placeholder={placeholder}
          min={typeof rules.min === "number" ? rules.min : undefined}
          max={typeof rules.max === "number" ? rules.max : undefined}
        />
      );

    case FieldDataTypeEnum.DECIMAL:
      return (
        <Input
          type="number"
          step="0.01"
          value={(value as number) ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === "" ? null : parseFloat(val));
          }}
          placeholder={placeholder}
          min={typeof rules.min === "number" ? rules.min : undefined}
          max={typeof rules.max === "number" ? rules.max : undefined}
        />
      );

    case FieldDataTypeEnum.BOOLEAN:
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-muted-foreground text-sm">
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case FieldDataTypeEnum.DATE:
      return (
        <Input
          type="date"
          value={
            value ? new Date(value as string).toISOString().split("T")[0] : ""
          }
          onChange={(e) => {
            const val = e.target.value;
            onChange(val ? new Date(val).toISOString() : null);
          }}
        />
      );

    case FieldDataTypeEnum.DATETIME:
      return (
        <Input
          type="datetime-local"
          value={
            value ? new Date(value as string).toISOString().slice(0, 16) : ""
          }
          onChange={(e) => {
            const val = e.target.value;
            onChange(val ? new Date(val).toISOString() : null);
          }}
        />
      );

    case FieldDataTypeEnum.ENUM:
      if (enumOptions.length === 0) {
        return (
          <div className="text-muted-foreground bg-muted/30 rounded border p-2 text-sm italic">
            Add enum options to see the dropdown preview
          </div>
        );
      }
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(val) => onChange(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label || "option"}...`} />
          </SelectTrigger>
          <SelectContent>
            {!isRequired && <SelectItem value="">None</SelectItem>}
            {enumOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case FieldDataTypeEnum.JSON:
      return (
        <Textarea
          value={value ? JSON.stringify(value, null, 2) : ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val.trim()) {
              onChange(null);
              return;
            }
            try {
              onChange(JSON.parse(val));
            } catch {
              // Invalid JSON, keep as-is for preview
            }
          }}
          placeholder='{"key": "value"}'
          rows={3}
          className="resize-none font-mono text-sm"
        />
      );

    case FieldDataTypeEnum.CI_REFERENCE:
    case FieldDataTypeEnum.PERSON_REFERENCE:
    case FieldDataTypeEnum.ORG_UNIT_REFERENCE:
    case FieldDataTypeEnum.LOCATION_REFERENCE:
      return (
        <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 rounded border p-2 text-sm italic">
          <Link className="h-4 w-4" />
          Reference fields show a searchable dropdown of related records
        </div>
      );

    // New data types (Phase 3)
    case FieldDataTypeEnum.URL:
      return (
        <div className="relative">
          <LinkIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="url"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="https://example.com"
            className="pl-10"
          />
        </div>
      );

    case FieldDataTypeEnum.EMAIL:
      return (
        <div className="relative">
          <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="email"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="user@example.com"
            className="pl-10"
          />
        </div>
      );

    case FieldDataTypeEnum.PHONE:
      return (
        <div className="relative">
          <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="tel"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="+1 (555) 123-4567"
            className="pl-10"
          />
        </div>
      );

    case FieldDataTypeEnum.MULTI_SELECT_ENUM: {
      if (enumOptions.length === 0) {
        return (
          <div className="text-muted-foreground bg-muted/30 rounded border p-2 text-sm italic">
            Add enum options to see the multi-select preview
          </div>
        );
      }
      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-3">
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((val) => (
                <Badge key={val} variant="secondary" className="gap-1">
                  {val}
                  <button
                    type="button"
                    onClick={() =>
                      onChange(selectedValues.filter((v) => v !== val))
                    }
                    className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {enumOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option));
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    case FieldDataTypeEnum.CURRENCY: {
      const currencyValue = value as {
        amount?: number;
        currency?: string;
      } | null;
      const amount = currencyValue?.amount ?? null;
      const currency = currencyValue?.currency ?? "SAR";
      return (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="number"
              step="0.01"
              value={amount ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  onChange(null);
                } else {
                  onChange({ amount: parseFloat(val), currency });
                }
              }}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
          <Select
            value={currency}
            onValueChange={(newCurrency) => {
              if (amount === null) {
                onChange(null);
              } else {
                onChange({ amount, currency: newCurrency });
              }
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAR">SAR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    case FieldDataTypeEnum.ATTACHMENT_REFERENCE:
      return (
        <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 rounded border p-2 text-sm italic">
          <Paperclip className="h-4 w-4" />
          Attachment fields show a file picker or reference to uploaded files
        </div>
      );

    default:
      return (
        <div className="text-muted-foreground text-sm italic">
          Preview not available for this field type
        </div>
      );
  }
}

export default FieldDefinitionPreview;
