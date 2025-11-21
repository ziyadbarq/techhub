/**
 * Field Definition Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

interface FieldDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  field?: FieldDefinitionDTO | null;
}

export function FieldDefinitionForm({
  open,
  onOpenChange,
  onSuccess,
  field,
}: FieldDefinitionFormProps) {
  const isEditing = !!field;

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
    },
  });

  useEffect(() => {
    form.reset({
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
    });
  }, [field, form]);

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
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      Unique field identifier (snake_case)
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
                      Label <span className="text-destructive">*</span>
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
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Field Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as FieldDataTypeEnum)
                      }
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FieldDataTypeEnum).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
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
                      Entity Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Asset, Person, etc."
                        maxLength={100}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Entity this field belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          typeof field.value === "string" ? field.value : ""
                        }
                      />
                    </FormControl>
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
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Order for displaying field in forms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        This field must have a value
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isUnique"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Unique</FormLabel>
                      <FormDescription>
                        This field value must be unique
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      This field definition is available for use
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
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
