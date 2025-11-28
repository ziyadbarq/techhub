/**
 * ConditionalLogicBuilder Component
 * UI for building conditional logic rules for field definitions
 * Supports visibility, required, and disabled conditions
 */

"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  FieldConditionalLogic,
  ConditionalRule,
  ConditionalOperator,
} from "@/core/domain/entities/field-definition.entity";

// Operator definitions with labels and value requirements
const OPERATORS: Array<{
  value: ConditionalOperator;
  label: string;
  requiresValue: boolean;
  valueType?: "text" | "number" | "array";
}> = [
  { value: "equals", label: "Equals", requiresValue: true, valueType: "text" },
  {
    value: "notEquals",
    label: "Not equals",
    requiresValue: true,
    valueType: "text",
  },
  {
    value: "contains",
    label: "Contains",
    requiresValue: true,
    valueType: "text",
  },
  {
    value: "notContains",
    label: "Does not contain",
    requiresValue: true,
    valueType: "text",
  },
  { value: "isEmpty", label: "Is empty", requiresValue: false },
  { value: "isNotEmpty", label: "Is not empty", requiresValue: false },
  {
    value: "greaterThan",
    label: "Greater than",
    requiresValue: true,
    valueType: "number",
  },
  {
    value: "lessThan",
    label: "Less than",
    requiresValue: true,
    valueType: "number",
  },
  {
    value: "greaterThanOrEqual",
    label: "Greater than or equal",
    requiresValue: true,
    valueType: "number",
  },
  {
    value: "lessThanOrEqual",
    label: "Less than or equal",
    requiresValue: true,
    valueType: "number",
  },
  { value: "in", label: "Is one of", requiresValue: true, valueType: "array" },
  {
    value: "notIn",
    label: "Is not one of",
    requiresValue: true,
    valueType: "array",
  },
];

interface AvailableField {
  name: string;
  label: string;
  dataType: string;
}

interface ConditionalLogicBuilderProps {
  /** Current conditional logic configuration */
  value: FieldConditionalLogic | null;
  /** Callback when logic changes */
  onChange: (logic: FieldConditionalLogic | null) => void;
  /** List of available fields that can be referenced */
  availableFields: AvailableField[];
  /** Whether the builder is disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * ConditionalLogicBuilder - Build conditional logic rules for field definitions
 */
export function ConditionalLogicBuilder({
  value,
  onChange,
  availableFields,
  disabled = false,
  className,
}: ConditionalLogicBuilderProps) {
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({
    visibility: true,
    required: false,
    disabled: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRulesChange = (
    type: "visibility" | "required" | "disabled",
    rules: ConditionalRule[] | undefined,
  ) => {
    const newLogic: FieldConditionalLogic = {
      ...value,
      [type]: rules && rules.length > 0 ? rules : undefined,
    };

    // If all rule arrays are empty, return null
    const hasAnyRules =
      (newLogic.visibility && newLogic.visibility.length > 0) ||
      (newLogic.required && newLogic.required.length > 0) ||
      (newLogic.disabled && newLogic.disabled.length > 0);

    onChange(hasAnyRules ? newLogic : null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <RuleSection
        title="Visibility Rules"
        description="Show this field only when conditions are met"
        type="visibility"
        rules={value?.visibility}
        onChange={(rules) => handleRulesChange("visibility", rules)}
        availableFields={availableFields}
        disabled={disabled}
        isOpen={openSections.visibility}
        onToggle={() => toggleSection("visibility")}
      />

      <RuleSection
        title="Required Rules"
        description="Make this field required when conditions are met"
        type="required"
        rules={value?.required}
        onChange={(rules) => handleRulesChange("required", rules)}
        availableFields={availableFields}
        disabled={disabled}
        isOpen={openSections.required}
        onToggle={() => toggleSection("required")}
      />

      <RuleSection
        title="Disabled Rules"
        description="Disable this field when conditions are met"
        type="disabled"
        rules={value?.disabled}
        onChange={(rules) => handleRulesChange("disabled", rules)}
        availableFields={availableFields}
        disabled={disabled}
        isOpen={openSections.disabled}
        onToggle={() => toggleSection("disabled")}
      />
    </div>
  );
}

interface RuleSectionProps {
  title: string;
  description: string;
  type: "visibility" | "required" | "disabled";
  rules: ConditionalRule[] | undefined;
  onChange: (rules: ConditionalRule[] | undefined) => void;
  availableFields: AvailableField[];
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function RuleSection({
  title,
  description,
  type: _type,
  rules,
  onChange,
  availableFields,
  disabled,
  isOpen,
  onToggle,
}: RuleSectionProps) {
  const ruleCount = rules?.length ?? 0;

  const addRule = () => {
    const newRule: ConditionalRule = {
      sourceField: availableFields[0]?.name ?? "",
      operator: "equals",
      value: "",
      combineWith: ruleCount > 0 ? "AND" : undefined,
    };
    onChange([...(rules ?? []), newRule]);
  };

  const updateRule = (index: number, updatedRule: ConditionalRule) => {
    const newRules = [...(rules ?? [])];
    newRules[index] = updatedRule;
    onChange(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = (rules ?? []).filter((_, i) => i !== index);
    // Update combineWith for the first rule after removal
    if (newRules.length > 0 && newRules[0].combineWith) {
      newRules[0] = { ...newRules[0], combineWith: undefined };
    }
    onChange(newRules.length > 0 ? newRules : undefined);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted/50 flex w-full items-center justify-between p-4 transition-colors"
            disabled={disabled}
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{title}</span>
                  {ruleCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ruleCount} rule{ruleCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t p-4">
            {rules && rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <RuleEditor
                    key={index}
                    rule={rule}
                    index={index}
                    onChange={(updatedRule) => updateRule(index, updatedRule)}
                    onRemove={() => removeRule(index)}
                    availableFields={availableFields}
                    disabled={disabled}
                    showCombineWith={index > 0}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No rules configured. Add a rule to enable conditional logic.
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRule}
              disabled={disabled || availableFields.length === 0}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface RuleEditorProps {
  rule: ConditionalRule;
  index: number;
  onChange: (rule: ConditionalRule) => void;
  onRemove: () => void;
  availableFields: AvailableField[];
  disabled: boolean;
  showCombineWith: boolean;
}

function RuleEditor({
  rule,
  index: _index,
  onChange,
  onRemove,
  availableFields,
  disabled,
  showCombineWith,
}: RuleEditorProps) {
  const selectedOperator = OPERATORS.find((op) => op.value === rule.operator);

  const handleFieldChange = (sourceField: string) => {
    onChange({ ...rule, sourceField });
  };

  const handleOperatorChange = (operator: ConditionalOperator) => {
    const opDef = OPERATORS.find((op) => op.value === operator);
    onChange({
      ...rule,
      operator,
      // Clear value if operator doesn't require one
      value: opDef?.requiresValue ? rule.value : undefined,
    });
  };

  const handleValueChange = (value: unknown) => {
    onChange({ ...rule, value });
  };

  const handleCombineWithChange = (combineWith: "AND" | "OR") => {
    onChange({ ...rule, combineWith });
  };

  return (
    <div className="bg-muted/30 space-y-3 rounded-md border p-3">
      {showCombineWith && (
        <div className="mb-2 flex items-center gap-2">
          <Select
            value={rule.combineWith ?? "AND"}
            onValueChange={(v) => handleCombineWithChange(v as "AND" | "OR")}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">
            combine with previous rule
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {/* Source Field */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Field</Label>
          <Select
            value={rule.sourceField}
            onValueChange={handleFieldChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Operator</Label>
          <Select
            value={rule.operator}
            onValueChange={(v) =>
              handleOperatorChange(v as ConditionalOperator)
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Value</Label>
          {selectedOperator?.requiresValue ? (
            selectedOperator.valueType === "number" ? (
              <Input
                type="number"
                value={(rule.value as number) ?? ""}
                onChange={(e) =>
                  handleValueChange(
                    e.target.value === "" ? "" : parseFloat(e.target.value),
                  )
                }
                placeholder="Enter number"
                disabled={disabled}
              />
            ) : selectedOperator.valueType === "array" ? (
              <Input
                type="text"
                value={Array.isArray(rule.value) ? rule.value.join(", ") : ""}
                onChange={(e) =>
                  handleValueChange(
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="value1, value2"
                disabled={disabled}
              />
            ) : (
              <Input
                type="text"
                value={(rule.value as string) ?? ""}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Enter value"
                disabled={disabled}
              />
            )
          ) : (
            <div className="text-muted-foreground flex h-10 items-center text-sm">
              No value needed
            </div>
          )}
        </div>

        {/* Remove Button */}
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact display of conditional logic for read-only views
 */
export function ConditionalLogicDisplay({
  logic,
  className,
}: {
  logic: FieldConditionalLogic | null;
  className?: string;
}) {
  if (!logic) {
    return null;
  }

  const hasVisibility = logic.visibility && logic.visibility.length > 0;
  const hasRequired = logic.required && logic.required.length > 0;
  const hasDisabled = logic.disabled && logic.disabled.length > 0;

  if (!hasVisibility && !hasRequired && !hasDisabled) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {hasVisibility && (
        <Badge variant="outline" className="text-xs">
          Conditional visibility
        </Badge>
      )}
      {hasRequired && (
        <Badge variant="outline" className="text-xs">
          Conditional required
        </Badge>
      )}
      {hasDisabled && (
        <Badge variant="outline" className="text-xs">
          Conditional disabled
        </Badge>
      )}
    </div>
  );
}
