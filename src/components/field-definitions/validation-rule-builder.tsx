/**
 * Validation Rule Builder Component
 * Visual interface for configuring field validation rules
 */

"use client";

import { useState, useMemo, useRef } from "react";
import {
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  Regex,
  Hash,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

// Define validation rule types by data type
interface ValidationRuleConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  inputType: "number" | "text" | "date" | "boolean" | "pattern";
  placeholder?: string;
  min?: number;
  max?: number;
}

// Validation rules available for each data type
const VALIDATION_RULES_BY_TYPE: Partial<
  Record<FieldDataTypeEnum, ValidationRuleConfig[]>
> = {
  [FieldDataTypeEnum.STRING]: [
    {
      key: "minLength",
      label: "Minimum Length",
      description: "Minimum number of characters required",
      icon: Hash,
      inputType: "number",
      min: 0,
      placeholder: "e.g., 1",
    },
    {
      key: "maxLength",
      label: "Maximum Length",
      description: "Maximum number of characters allowed",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 10000,
      placeholder: "e.g., 255",
    },
    {
      key: "pattern",
      label: "Pattern (Regex)",
      description: "Regular expression the value must match",
      icon: Regex,
      inputType: "pattern",
      placeholder: "e.g., ^[A-Z]{2}\\d{4}$",
    },
  ],
  [FieldDataTypeEnum.TEXT]: [
    {
      key: "minLength",
      label: "Minimum Length",
      description: "Minimum number of characters required",
      icon: Hash,
      inputType: "number",
      min: 0,
      placeholder: "e.g., 10",
    },
    {
      key: "maxLength",
      label: "Maximum Length",
      description: "Maximum number of characters allowed",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 100000,
      placeholder: "e.g., 5000",
    },
  ],
  [FieldDataTypeEnum.INTEGER]: [
    {
      key: "min",
      label: "Minimum Value",
      description: "Minimum allowed value",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 0",
    },
    {
      key: "max",
      label: "Maximum Value",
      description: "Maximum allowed value",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 1000",
    },
  ],
  [FieldDataTypeEnum.DECIMAL]: [
    {
      key: "min",
      label: "Minimum Value",
      description: "Minimum allowed value",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 0.00",
    },
    {
      key: "max",
      label: "Maximum Value",
      description: "Maximum allowed value",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 999999.99",
    },
    {
      key: "precision",
      label: "Decimal Precision",
      description: "Number of decimal places allowed",
      icon: Settings,
      inputType: "number",
      min: 0,
      max: 10,
      placeholder: "e.g., 2",
    },
  ],
  [FieldDataTypeEnum.DATE]: [
    {
      key: "minDate",
      label: "Earliest Date",
      description: "Earliest allowed date",
      icon: Calendar,
      inputType: "date",
    },
    {
      key: "maxDate",
      label: "Latest Date",
      description: "Latest allowed date",
      icon: Calendar,
      inputType: "date",
    },
    {
      key: "allowFuture",
      label: "Allow Future Dates",
      description: "Whether dates in the future are allowed",
      icon: Calendar,
      inputType: "boolean",
    },
    {
      key: "allowPast",
      label: "Allow Past Dates",
      description: "Whether dates in the past are allowed",
      icon: Calendar,
      inputType: "boolean",
    },
  ],
  [FieldDataTypeEnum.DATETIME]: [
    {
      key: "minDate",
      label: "Earliest Date/Time",
      description: "Earliest allowed date and time",
      icon: Calendar,
      inputType: "date",
    },
    {
      key: "maxDate",
      label: "Latest Date/Time",
      description: "Latest allowed date and time",
      icon: Calendar,
      inputType: "date",
    },
    {
      key: "allowFuture",
      label: "Allow Future",
      description: "Whether dates in the future are allowed",
      icon: Calendar,
      inputType: "boolean",
    },
    {
      key: "allowPast",
      label: "Allow Past",
      description: "Whether dates in the past are allowed",
      icon: Calendar,
      inputType: "boolean",
    },
  ],
  // New data types (Phase 3)
  [FieldDataTypeEnum.URL]: [
    {
      key: "maxLength",
      label: "Maximum Length",
      description: "Maximum URL length (default 2048)",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 10000,
      placeholder: "e.g., 2048",
    },
  ],
  [FieldDataTypeEnum.EMAIL]: [
    {
      key: "maxLength",
      label: "Maximum Length",
      description: "Maximum email length (default 254)",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 500,
      placeholder: "e.g., 254",
    },
  ],
  [FieldDataTypeEnum.PHONE]: [
    {
      key: "minLength",
      label: "Minimum Length",
      description: "Minimum number of digits",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 20,
      placeholder: "e.g., 7",
    },
    {
      key: "maxLength",
      label: "Maximum Length",
      description: "Maximum number of digits",
      icon: Hash,
      inputType: "number",
      min: 1,
      max: 30,
      placeholder: "e.g., 15",
    },
    {
      key: "pattern",
      label: "Pattern (Regex)",
      description: "Custom phone number format",
      icon: Regex,
      inputType: "pattern",
      placeholder: "e.g., ^\\+?[1-9]\\d{1,14}$",
    },
  ],
  [FieldDataTypeEnum.MULTI_SELECT_ENUM]: [
    {
      key: "minSelected",
      label: "Minimum Selections",
      description: "Minimum number of options that must be selected",
      icon: Hash,
      inputType: "number",
      min: 0,
      placeholder: "e.g., 1",
    },
    {
      key: "maxSelected",
      label: "Maximum Selections",
      description: "Maximum number of options that can be selected",
      icon: Hash,
      inputType: "number",
      min: 1,
      placeholder: "e.g., 5",
    },
  ],
  [FieldDataTypeEnum.CURRENCY]: [
    {
      key: "min",
      label: "Minimum Amount",
      description: "Minimum allowed amount",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 0.00",
    },
    {
      key: "max",
      label: "Maximum Amount",
      description: "Maximum allowed amount",
      icon: Hash,
      inputType: "number",
      placeholder: "e.g., 1000000.00",
    },
  ],
};

// Common regex patterns
const COMMON_PATTERNS: {
  label: string;
  pattern: string;
  description: string;
}[] = [
  {
    label: "Email",
    pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$",
    description: "Standard email format",
  },
  {
    label: "URL",
    pattern: "^https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w.,@?^=%&:/~+#-]*$",
    description: "HTTP/HTTPS URL",
  },
  {
    label: "Phone (International)",
    pattern: "^\\+?[1-9]\\d{1,14}$",
    description: "E.164 international phone format",
  },
  {
    label: "Alphanumeric",
    pattern: "^[a-zA-Z0-9]+$",
    description: "Letters and numbers only",
  },
  {
    label: "Alpha Only",
    pattern: "^[a-zA-Z]+$",
    description: "Letters only",
  },
  {
    label: "Uppercase",
    pattern: "^[A-Z]+$",
    description: "Uppercase letters only",
  },
  {
    label: "Lowercase",
    pattern: "^[a-z]+$",
    description: "Lowercase letters only",
  },
  {
    label: "No Spaces",
    pattern: "^\\S+$",
    description: "No whitespace allowed",
  },
  {
    label: "UUID",
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    description: "Standard UUID format",
  },
  {
    label: "IP Address (v4)",
    pattern:
      "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "IPv4 address format",
  },
];

interface ValidationRuleBuilderProps {
  dataType: FieldDataTypeEnum;
  value?: Record<string, unknown> | null;
  onChange: (rules: Record<string, unknown>) => void;
  className?: string;
}

export function ValidationRuleBuilder({
  dataType,
  value,
  onChange,
  className,
}: ValidationRuleBuilderProps) {
  const [rules, setRules] = useState<Record<string, unknown>>(value || {});
  const [patternError, setPatternError] = useState<string | null>(null);
  const prevValueRef = useRef<string | null>(null);

  // Get available rules for this data type
  const availableRules = useMemo(
    () => VALIDATION_RULES_BY_TYPE[dataType] || [],
    [dataType],
  );

  // Sync with external value using ref comparison (avoids setState in effect)
  const valueKey = value ? JSON.stringify(value) : null;
  if (valueKey !== prevValueRef.current) {
    prevValueRef.current = valueKey;
    if (value && JSON.stringify(rules) !== valueKey) {
      setRules(value);
    }
  }

  // Update parent when rules change
  const updateRules = (newRules: Record<string, unknown>) => {
    setRules(newRules);
    onChange(newRules);
  };

  const handleRuleChange = (key: string, ruleValue: unknown) => {
    const newRules = { ...rules };
    if (ruleValue === null || ruleValue === undefined || ruleValue === "") {
      delete newRules[key];
    } else {
      newRules[key] = ruleValue;
    }
    updateRules(newRules);
  };

  const handlePatternChange = (pattern: string) => {
    // Validate regex
    try {
      if (pattern) {
        new RegExp(pattern);
      }
      setPatternError(null);
    } catch (_e) {
      setPatternError("Invalid regular expression");
    }
    handleRuleChange("pattern", pattern || null);
  };

  const applyCommonPattern = (pattern: string) => {
    handlePatternChange(pattern);
  };

  // Count active rules
  const activeRuleCount = Object.keys(rules).filter(
    (k) => rules[k] !== null && rules[k] !== undefined && rules[k] !== "",
  ).length;

  if (availableRules.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex items-center gap-2 py-4">
          <Info className="text-muted-foreground h-5 w-5" />
          <span className="text-muted-foreground text-sm">
            No validation rules available for {dataType} fields
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Settings className="h-4 w-4" />
            Validation Rules
          </CardTitle>
          {activeRuleCount > 0 && (
            <Badge variant="secondary">{activeRuleCount} active</Badge>
          )}
        </div>
        <CardDescription>
          Configure validation constraints for this field
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={["rules"]}>
          <AccordionItem value="rules" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Available Rules</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {availableRules.map((rule) => (
                  <RuleInput
                    key={rule.key}
                    config={rule}
                    value={rules[rule.key]}
                    onChange={(v) => handleRuleChange(rule.key, v)}
                    onPatternChange={
                      rule.inputType === "pattern"
                        ? handlePatternChange
                        : undefined
                    }
                    patternError={
                      rule.inputType === "pattern" ? patternError : undefined
                    }
                    commonPatterns={
                      rule.inputType === "pattern" ? COMMON_PATTERNS : undefined
                    }
                    onApplyPattern={
                      rule.inputType === "pattern"
                        ? applyCommonPattern
                        : undefined
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {dataType === FieldDataTypeEnum.STRING && (
            <AccordionItem value="patterns" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="text-sm font-medium">Common Patterns</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {COMMON_PATTERNS.map((p) => (
                    <TooltipProvider key={p.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={
                              rules.pattern === p.pattern
                                ? "secondary"
                                : "outline"
                            }
                            size="sm"
                            className="justify-start text-xs"
                            onClick={() => applyCommonPattern(p.pattern)}
                          >
                            {p.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{p.description}</p>
                          <code className="text-muted-foreground mt-1 block text-xs">
                            {p.pattern}
                          </code>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Active Rules Summary */}
        {activeRuleCount > 0 && (
          <div className="border-t pt-2">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active Rules</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(rules)
                .filter(([_, v]) => v !== null && v !== undefined && v !== "")
                .map(([key, val]) => {
                  const ruleConfig = availableRules.find((r) => r.key === key);
                  const displayValue =
                    typeof val === "boolean"
                      ? val
                        ? "Yes"
                        : "No"
                      : String(val).length > 20
                        ? String(val).slice(0, 17) + "..."
                        : String(val);

                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className="gap-1 pr-1 text-xs"
                    >
                      {ruleConfig?.label || key}: {displayValue}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive hover:text-destructive-foreground h-4 w-4"
                        onClick={() => handleRuleChange(key, null)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RuleInputProps {
  config: ValidationRuleConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onPatternChange?: (pattern: string) => void;
  patternError?: string | null;
  commonPatterns?: typeof COMMON_PATTERNS;
  onApplyPattern?: (pattern: string) => void;
}

function RuleInput({
  config,
  value,
  onChange,
  onPatternChange,
  patternError,
}: RuleInputProps) {
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-4 w-4" />
        <Label className="text-sm font-medium">{config.label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="text-muted-foreground h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{config.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {config.inputType === "number" && (
        <Input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === "" ? null : Number(val));
          }}
          placeholder={config.placeholder}
          min={config.min}
          max={config.max}
          className="h-8"
        />
      )}

      {config.inputType === "text" && (
        <Input
          type="text"
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={config.placeholder}
          className="h-8"
        />
      )}

      {config.inputType === "date" && (
        <Input
          type="date"
          value={value ? String(value) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8"
        />
      )}

      {config.inputType === "boolean" && (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked ? true : null)}
          />
          <span className="text-muted-foreground text-sm">
            {value === true ? "Enabled" : "Not set"}
          </span>
        </div>
      )}

      {config.inputType === "pattern" && (
        <div className="space-y-2">
          <Input
            type="text"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) => onPatternChange?.(e.target.value)}
            placeholder={config.placeholder}
            className={cn(
              "h-8 font-mono text-xs",
              patternError && "border-destructive",
            )}
          />
          {patternError && (
            <p className="text-destructive flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {patternError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidationRuleBuilder;
