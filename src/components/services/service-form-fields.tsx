/**
 * Service Form Fields
 *
 * Reusable form field components for service forms.
 * Eliminates repetitive field patterns and improves maintainability.
 */

"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatEnumValue } from "@/lib/services/service-display-utils";

/**
 * Base field props shared across all field components
 */
interface BaseFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  required?: boolean;
}

/**
 * Enum select field props
 */
interface EnumSelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  enumValues: Record<string, string>;
  placeholder?: string;
  formatValue?: (value: string) => string;
}

/**
 * Reusable enum select field component
 *
 * Renders a select field populated with enum values.
 * Automatically formats enum values for display (e.g., SNAKE_CASE → Snake Case).
 *
 * @example
 * ```tsx
 * <EnumSelectField
 *   control={form.control}
 *   name="serviceType"
 *   label="Service Type"
 *   enumValues={ServiceType}
 *   required
 * />
 * ```
 */
export function EnumSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  enumValues,
  placeholder,
  formatValue = formatEnumValue,
}: EnumSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={placeholder || `Select ${label.toLowerCase()}`}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.values(enumValues).map((value) => (
                <SelectItem key={value} value={value}>
                  {formatValue(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Date field props
 */
interface DateFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
}

/**
 * Reusable date input field component
 *
 * Renders a date input with proper value handling for react-hook-form.
 *
 * @example
 * ```tsx
 * <DateField
 *   control={form.control}
 *   name="deploymentDate"
 *   label="Deployment Date"
 *   description="When was this service deployed?"
 * />
 * ```
 */
export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
}: DateFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Checkbox field props
 */
type CheckboxFieldProps<TFieldValues extends FieldValues> =
  BaseFieldProps<TFieldValues>;

/**
 * Reusable checkbox field component
 *
 * Renders a checkbox with label and optional description in a bordered container.
 *
 * @example
 * ```tsx
 * <CheckboxField
 *   control={form.control}
 *   name="isEssentialService"
 *   label="Essential Service"
 *   description="Mark this service as essential for business operations"
 * />
 * ```
 */
export function CheckboxField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: CheckboxFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
        </FormItem>
      )}
    />
  );
}

/**
 * Textarea field props
 */
interface TextareaFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  rows?: number;
}

/**
 * Reusable textarea field component
 *
 * Renders a textarea input with proper null/undefined handling.
 *
 * @example
 * ```tsx
 * <TextareaField
 *   control={form.control}
 *   name="description"
 *   label="Description"
 *   placeholder="Describe the service..."
 *   rows={3}
 * />
 * ```
 */
export function TextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  rows = 3,
}: TextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Text field props
 */
interface TextFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  type?: "text" | "email" | "url" | "number";
}

/**
 * Reusable text input field component
 *
 * Renders a text input with proper null/undefined handling.
 *
 * @example
 * ```tsx
 * <TextField
 *   control={form.control}
 *   name="gitlabRepoUrl"
 *   label="GitLab Repository URL"
 *   type="url"
 *   placeholder="https://gitlab.com/..."
 * />
 * ```
 */
export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  type = "text",
}: TextFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Number field props
 */
interface NumberFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Reusable number input field component
 *
 * Renders a number input with proper value handling for react-hook-form.
 *
 * @example
 * ```tsx
 * <NumberField
 *   control={form.control}
 *   name="slaResponseTimeP50"
 *   label="P50 Response Time"
 *   unit="ms"
 *   min={0}
 * />
 * ```
 */
export function NumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  placeholder,
  min,
  max,
  step,
  unit,
}: NumberFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <div className="relative flex items-center">
              {/* Custom spinner buttons on the left */}
              <div className="absolute left-1 z-10 flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted h-4 w-4 rounded-none p-0"
                  onClick={() => {
                    const currentValue = field.value ?? min ?? 0;
                    const stepValue = step ?? 1;
                    const newValue = Number(currentValue) + stepValue;
                    if (max === undefined || newValue <= max) {
                      field.onChange(newValue);
                    }
                  }}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted h-4 w-4 rounded-none p-0"
                  onClick={() => {
                    const currentValue = field.value ?? min ?? 0;
                    const stepValue = step ?? 1;
                    const newValue = Number(currentValue) - stepValue;
                    if (min === undefined || newValue >= min) {
                      field.onChange(newValue);
                    }
                  }}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              <Input
                type="number"
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                className="[appearance:textfield] pl-7 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : Number(value));
                }}
              />
              {unit && (
                <span className="text-muted-foreground pointer-events-none absolute top-2.5 right-3 text-sm">
                  {unit}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Nullable select field props
 */
interface NullableSelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  options: Array<{ id: string; label: string }>;
  placeholder?: string;
  noneLabel?: string;
}

/**
 * Reusable nullable select field component
 *
 * Renders a select field that allows null selection with a "None" option.
 * Useful for optional foreign key relationships.
 *
 * @example
 * ```tsx
 * <NullableSelectField
 *   control={form.control}
 *   name="vendorId"
 *   label="Vendor"
 *   options={vendors.map(v => ({ id: v.id, label: v.name }))}
 *   noneLabel="No vendor"
 * />
 * ```
 */
export function NullableSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  options,
  placeholder,
  noneLabel = "None",
}: NullableSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <Select
            onValueChange={(value) =>
              field.onChange(value === "none" ? null : value)
            }
            value={field.value ?? "none"}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={placeholder || `Select ${label.toLowerCase()}`}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">{noneLabel}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
