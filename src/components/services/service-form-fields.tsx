/**
 * Service Form Fields
 *
 * Reusable form field components for service forms.
 * Eliminates repetitive field patterns and improves maintainability.
 */

"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
