/**
 * Relationship Type Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { z } from "zod";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import {
  createRelationshipTypeAction,
  updateRelationshipTypeAction,
} from "@/interface-adapters/controllers/relationship-type.controller";
import {
  CreateRelationshipTypeSchema,
  UpdateRelationshipTypeSchema,
  type RelationshipTypeDTO,
} from "@/interface-adapters/dtos/generated/relationship-type.dto";

interface RelationshipTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingType?: RelationshipTypeDTO | null;
}

type CreateFormValues = z.input<typeof CreateRelationshipTypeSchema>;
type CreateFormOutput = z.output<typeof CreateRelationshipTypeSchema>;
type UpdateFormValues = z.input<typeof UpdateRelationshipTypeSchema>;
type UpdateFormOutput = z.output<typeof UpdateRelationshipTypeSchema>;

export function RelationshipTypeForm({
  open,
  onOpenChange,
  onSuccess,
  editingType,
}: RelationshipTypeFormProps) {
  const isEditing = !!editingType;

  const createForm = useForm<CreateFormValues, undefined, CreateFormOutput>({
    resolver: zodResolver(CreateRelationshipTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: null,
      direction: "UNIDIRECTIONAL",
      isImpacting: false,
    },
  });

  const updateForm = useForm<UpdateFormValues, undefined, UpdateFormOutput>({
    resolver: zodResolver(UpdateRelationshipTypeSchema),
    defaultValues: {
      name: "",
      description: null,
      direction: "UNIDIRECTIONAL",
      isImpacting: false,
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
    if (open && editingType) {
      updateForm.reset({
        name: editingType.name,
        description: editingType.description,
        direction: editingType.direction,
        isImpacting: editingType.isImpacting,
      });
    } else if (open && !editingType) {
      createForm.reset();
    }
  }, [open, editingType, createForm, updateForm]);

  const onCreateSubmit = async (data: CreateFormOutput) => {
    try {
      const result = await createRelationshipTypeAction(data);
      if (result.success) {
        toast.success("Relationship type created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create relationship type");
    }
  };

  const onUpdateSubmit = async (data: UpdateFormOutput) => {
    try {
      const result = await updateRelationshipTypeAction(editingType!.id, data);
      if (result.success) {
        toast.success("Relationship type updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update relationship type");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...(isEditing ? updateForm : createForm)}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {isEditing ? "Edit Relationship Type:" : "New Relationship Type:"}
              </span>
              <InlineEditableField
                name="code"
                placeholder={isEditing ? "Code" : "Auto-generated"}
                transform="uppercase"
                optional={!isEditing}
              />
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the relationship type details below."
                : "Create a new relationship type for CI relationships."}
            </DialogDescription>
          </DialogHeader>

          {!isEditing ? (
            <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Depends On, Runs On, Hosted By"
                        tabIndex={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNIDIRECTIONAL">
                          Unidirectional (A → B)
                        </SelectItem>
                        <SelectItem value="BIDIRECTIONAL">
                          Bidirectional (A ⟷ B)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unidirectional: relationship flows in one direction.
                      Bidirectional: relationship applies in both directions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="isImpacting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Impacting Relationship</FormLabel>
                      <FormDescription>
                        Mark this relationship as impacting for dependency
                        analysis and impact assessments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this relationship represents"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
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
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                  disabled={createForm.formState.isSubmitting}
                >
                  {createForm.formState.isSubmitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Depends On, Runs On, Hosted By"
                        tabIndex={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNIDIRECTIONAL">
                          Unidirectional (A → B)
                        </SelectItem>
                        <SelectItem value="BIDIRECTIONAL">
                          Bidirectional (A ⟷ B)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unidirectional: relationship flows in one direction.
                      Bidirectional: relationship applies in both directions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="isImpacting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Impacting Relationship</FormLabel>
                      <FormDescription>
                        Mark this relationship as impacting for dependency
                        analysis and impact assessments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this relationship represents"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
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
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                  disabled={updateForm.formState.isSubmitting}
                >
                  {updateForm.formState.isSubmitting ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
