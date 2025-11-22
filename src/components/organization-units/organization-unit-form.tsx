/**
 * Organization Unit Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import {
  Dialog,
  DialogContent,
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
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import {
  createOrganizationUnitAction,
  updateOrganizationUnitAction,
} from "@/interface-adapters/controllers/organization-unit.controller";
import {
  CreateOrganizationUnitSchema,
  type CreateOrganizationUnitDTO,
} from "@/interface-adapters/dtos/generated/organization-unit.dto";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

interface OrganizationUnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  unit?: OrganizationUnitDTO | null;
}

type OrganizationUnitFormValues = z.input<typeof CreateOrganizationUnitSchema>;

export function OrganizationUnitForm({
  open,
  onOpenChange,
  onSuccess,
  unit,
}: OrganizationUnitFormProps) {
  const isEditing = !!unit;
  const form = useForm<
    OrganizationUnitFormValues,
    undefined,
    CreateOrganizationUnitDTO
  >({
    resolver: zodResolver(CreateOrganizationUnitSchema),
    defaultValues: {
      name: unit?.name ?? "",
      code: unit?.code ?? "",
      description: unit?.description ?? "",
      unitType: unit?.unitType ?? OrganizationUnitType.DEPARTMENT,
      costCenter: unit?.costCenter ?? "",
      note: unit?.note ?? "",
      isActive: unit?.isActive ?? true,
    },
  });

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const firstField =
          document.querySelector<HTMLInputElement>('input[name="name"]');
        if (firstField) {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    form.reset({
      name: unit?.name ?? "",
      code: unit?.code ?? "",
      description: unit?.description ?? "",
      unitType: unit?.unitType ?? OrganizationUnitType.DEPARTMENT,
      costCenter: unit?.costCenter ?? "",
      note: unit?.note ?? "",
      isActive: unit?.isActive ?? true,
    });
  }, [unit, form]);

  const onSubmit = async (data: CreateOrganizationUnitDTO) => {
    try {
      const result = isEditing
        ? await updateOrganizationUnitAction({ id: unit.id, ...data })
        : await createOrganizationUnitAction(data);

      if (result.success) {
        toast.success(isEditing ? "Unit updated!" : "Unit created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update unit" : "Failed to create unit",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {isEditing ? "Edit Organization Unit:" : "Create Organization Unit:"}
              </span>
              <InlineEditableField
                name="code"
                placeholder={isEditing ? "Code" : "Auto-generated"}
                transform="uppercase"
                optional={!isEditing}
              />
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Enter unit name..."
                      maxLength={200}
                      tabIndex={1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Unit Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(OrganizationUnitType).map((type) => (
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

            <FormField
              control={form.control}
              name="costCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Center</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CC-001"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this organization unit..."
                      className="resize-none"
                      maxLength={5000}
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      This unit is available for use
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
