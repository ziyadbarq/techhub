/**
 * Organization Unit Form Component
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";
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
  const [showCodeField, setShowCodeField] = useState(isEditing);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Organization Unit" : "Create Organization Unit"}
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!showCodeField && !isEditing ? (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodeField(true)}
                  className="h-8 text-xs"
                >
                  <Edit2 className="mr-2 h-3 w-3" />
                  Manually set code (optional)
                </Button>
                <p className="text-muted-foreground mt-1 text-xs">
                  Code will be auto-generated if not provided
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Code{" "}
                      {isEditing && <span className="text-destructive">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ORG-001"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditing
                        ? "Unique code (uppercase letters, numbers, hyphens, underscores)"
                        : "Leave empty to auto-generate"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
      </DialogContent>
    </Dialog>
  );
}
