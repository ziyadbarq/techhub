/**
 * Field Definition Form Component
 * Enhanced with live preview and enum options support
 */

"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntityTypeOptions } from "@/hooks/use-entity-type-options";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import {
  createFieldDefinitionAction,
  updateFieldDefinitionAction,
} from "@/interface-adapters/controllers/field-definition.controller";
import {
  CreateFieldDefinitionSchema,
  type CreateFieldDefinitionDTO,
} from "@/interface-adapters/dtos/generated/field-definition.dto";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import { FieldDefinitionPreview } from "./field-definition-preview";
import { ValidationRuleBuilder } from "./validation-rule-builder";
import { ConditionalLogicBuilder } from "./conditional-logic-builder";
import type { FieldConditionalLogic } from "@/core/domain/entities/field-definition.entity";
import { listFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";

interface FieldDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  field?: FieldDefinitionDTO | null;
}

// Extract enum options from validation rules
function getEnumOptionsFromRules(
  validationRules?: Record<string, unknown> | null,
  fallbackOptions?: string[] | null,
): string[] {
  const options = validationRules?.enumOptions;
  if (Array.isArray(options)) {
    return options.filter((o): o is string => typeof o === "string");
  }
  return fallbackOptions ?? [];
}

export function FieldDefinitionForm({
  open,
  onOpenChange,
  onSuccess,
  field,
}: FieldDefinitionFormProps) {
  const isEditing = !!field;
  const entityTypeOptions = useEntityTypeOptions();
  // Compute initial enum options from field prop
  const initialEnumOptions = getEnumOptionsFromRules(
    field?.validationRules,
    field?.enumOptions,
  );
  const [enumOptions, setEnumOptions] = useState<string[]>(initialEnumOptions);
  const [newEnumOption, setNewEnumOption] = useState("");
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [availableFields, setAvailableFields] = useState<
    Array<{
      name: string;
      label: string;
      dataType: string;
    }>
  >([]);

  const form = useForm<CreateFieldDefinitionDTO>({
    resolver: zodResolver(
      CreateFieldDefinitionSchema,
    ) as Resolver<CreateFieldDefinitionDTO>,
    defaultValues: {
      name: field?.name ?? "",
      label: field?.label ?? "",
      description: field?.description ?? "",
      dataType: field?.dataType ?? FieldDataTypeEnum.STRING,
      entityType: field?.entityType ?? "",
      isRequired: field?.isRequired ?? false,
      isUnique: field?.isUnique ?? false,
      defaultValue: field?.defaultValue ?? "",
      displayOrder: field?.displayOrder ?? 0,
      isActive: field?.isActive ?? true,
      validationRules: field?.validationRules ?? null,
      conditionalLogic:
        (field?.conditionalLogic as FieldConditionalLogic) ?? null,
    },
  });

  // Watch form values for live preview
  const watchedValues = useWatch({ control: form.control });

  // Fetch available fields when entity type changes (for conditional logic builder)
  useEffect(() => {
    const entityType = watchedValues.entityType;

    async function loadAvailableFields() {
      if (!entityType) {
        setAvailableFields([]);
        return;
      }

      try {
        const result = await listFieldDefinitionsAction();
        if (result.success) {
          // Filter to same entity type and exclude the current field being edited
          const otherFields = result.data
            .filter((f) => f.entityType === entityType && f.id !== field?.id)
            .map((f) => ({
              name: f.name,
              label: f.label,
              dataType: f.dataType,
            }));
          setAvailableFields(otherFields);
        } else {
          setAvailableFields([]);
        }
      } catch {
        setAvailableFields([]);
      }
    }

    loadAvailableFields();
  }, [watchedValues.entityType, field?.id]);

  // Update validation rules when enum options change (for ENUM and MULTI_SELECT_ENUM)
  useEffect(() => {
    if (
      watchedValues.dataType === FieldDataTypeEnum.ENUM ||
      watchedValues.dataType === FieldDataTypeEnum.MULTI_SELECT_ENUM
    ) {
      const currentRules =
        (form.getValues("validationRules") as Record<string, unknown>) || {};
      form.setValue("validationRules", {
        ...currentRules,
        enumOptions,
      });
    }
  }, [enumOptions, watchedValues.dataType, form]);

  const addEnumOption = () => {
    const trimmed = newEnumOption.trim();
    if (trimmed && !enumOptions.includes(trimmed)) {
      setEnumOptions([...enumOptions, trimmed]);
      setNewEnumOption("");
    }
  };

  const removeEnumOption = (option: string) => {
    setEnumOptions(enumOptions.filter((o) => o !== option));
  };

  const onSubmit = async (data: CreateFieldDefinitionDTO) => {
    try {
      const result = isEditing
        ? await updateFieldDefinitionAction({
            id: field.id,
            ...data,
          })
        : await createFieldDefinitionAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Field definition updated!" : "Field definition created!",
        );
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing
          ? "Failed to update field definition"
          : "Failed to create field definition",
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setEnumOptions([]);
      setNewEnumOption("");
      setActiveTab("basic");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Field Definition" : "Create Field Definition"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the field definition details below."
              : "Add a new field definition to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr,300px]">
              {/* Form Section */}
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="pr-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4 grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      <TabsTrigger value="conditions">Conditions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-0 space-y-4">
                      {/* Name and Label */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Name <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="field_name"
                                  maxLength={100}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Unique identifier (snake_case)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="label"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Label{" "}
                                <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Field Label"
                                  maxLength={200}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Display name for the field
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter description..."
                                maxLength={1000}
                                rows={2}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data Type and Entity Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dataType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Field Type{" "}
                                <span className="text-destructive">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(value as FieldDataTypeEnum)
                                }
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.values(FieldDataTypeEnum).map(
                                    (type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="entityType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Entity Type{" "}
                                <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <SearchableSelect
                                  options={entityTypeOptions}
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select entity type"
                                  searchPlaceholder="Search entities..."
                                  emptyMessage="No matching entities"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Enum Options (conditional - for ENUM and MULTI_SELECT_ENUM) */}
                      {(watchedValues.dataType === FieldDataTypeEnum.ENUM ||
                        watchedValues.dataType ===
                          FieldDataTypeEnum.MULTI_SELECT_ENUM) && (
                        <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                          <FormLabel>
                            Dropdown Options{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>
                            Add the options that users can select from
                          </FormDescription>

                          {/* Add new option */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter option..."
                              value={newEnumOption}
                              onChange={(e) => setNewEnumOption(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addEnumOption();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              onClick={addEnumOption}
                              disabled={!newEnumOption.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Options list */}
                          {enumOptions.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {enumOptions.map((option) => (
                                <Badge
                                  key={option}
                                  variant="secondary"
                                  className="gap-1 pr-1"
                                >
                                  {option}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-destructive hover:text-destructive-foreground h-4 w-4"
                                    onClick={() => removeEnumOption(option)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm italic">
                              No options added yet
                            </p>
                          )}
                        </div>
                      )}

                      {/* Flags */}
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="isRequired"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-y-0 space-x-2 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none">
                                <FormLabel className="text-sm">
                                  Required
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isUnique"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-y-0 space-x-2 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none">
                                <FormLabel className="text-sm">
                                  Unique
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-y-0 space-x-2 rounded-md border p-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none">
                                <FormLabel className="text-sm">
                                  Active
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0 space-y-4">
                      {/* Default Value and Display Order */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="defaultValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Value</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter default value..."
                                  {...field}
                                  value={
                                    typeof field.value === "string"
                                      ? field.value
                                      : ""
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Value used when field is empty
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="displayOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Order</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value, 10) || 0,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Order in forms (lower = first)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Validation Rules Builder */}
                      <ValidationRuleBuilder
                        dataType={
                          watchedValues.dataType || FieldDataTypeEnum.STRING
                        }
                        value={
                          watchedValues.validationRules as Record<
                            string,
                            unknown
                          > | null
                        }
                        onChange={(rules) => {
                          // Preserve enumOptions if they exist
                          const currentRules =
                            (form.getValues("validationRules") as Record<
                              string,
                              unknown
                            >) || {};
                          const enumOpts = currentRules.enumOptions;
                          form.setValue("validationRules", {
                            ...rules,
                            ...(enumOpts ? { enumOptions: enumOpts } : {}),
                          });
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="conditions" className="mt-0 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Conditional Logic
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Configure when this field should be visible, required,
                          or disabled based on the values of other fields.
                        </p>
                      </div>

                      {watchedValues.entityType ? (
                        availableFields.length > 0 ? (
                          <FormField
                            control={form.control}
                            name="conditionalLogic"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ConditionalLogicBuilder
                                    value={
                                      field.value as FieldConditionalLogic | null
                                    }
                                    onChange={field.onChange}
                                    availableFields={availableFields}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className="rounded-lg border border-dashed p-6 text-center">
                            <p className="text-muted-foreground text-sm">
                              No other fields available for conditional logic.
                              <br />
                              Create other fields for this entity type first.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center">
                          <p className="text-muted-foreground text-sm">
                            Select an entity type first to configure conditional
                            logic.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              {/* Preview Section */}
              <div className="hidden lg:block">
                <FieldDefinitionPreview
                  label={watchedValues.label || ""}
                  name={watchedValues.name || ""}
                  description={watchedValues.description}
                  dataType={watchedValues.dataType || FieldDataTypeEnum.STRING}
                  isRequired={watchedValues.isRequired || false}
                  isUnique={watchedValues.isUnique || false}
                  defaultValue={watchedValues.defaultValue}
                  enumOptions={enumOptions}
                  validationRules={
                    watchedValues.validationRules as Record<
                      string,
                      unknown
                    > | null
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
