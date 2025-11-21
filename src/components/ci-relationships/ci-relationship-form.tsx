/**
 * CI Relationship Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  createCIRelationshipAction,
  updateCIRelationshipAction,
} from "@/interface-adapters/controllers/ci-relationship.controller";
import {
  CreateCIRelationshipSchema,
  UpdateCIRelationshipSchema,
  type CIRelationshipDTO,
} from "@/interface-adapters/dtos/generated/ci-relationship.dto";

interface CIRelationshipFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingRelationship?: CIRelationshipDTO | null;
}

type CreateFormValues = z.input<typeof CreateCIRelationshipSchema>;
type CreateFormOutput = z.output<typeof CreateCIRelationshipSchema>;
type UpdateFormValues = z.input<typeof UpdateCIRelationshipSchema>;
type UpdateFormOutput = z.output<typeof UpdateCIRelationshipSchema>;

export function CIRelationshipForm({
  open,
  onOpenChange,
  onSuccess,
  editingRelationship,
}: CIRelationshipFormProps) {
  const isEditing = !!editingRelationship;

  const createForm = useForm<CreateFormValues, undefined, CreateFormOutput>({
    resolver: zodResolver(CreateCIRelationshipSchema),
    defaultValues: {
      fromCiId: "",
      toCiId: "",
      relationshipTypeId: "",
      validFrom: null,
      validTo: null,
      note: null,
    },
  });

  const updateForm = useForm<UpdateFormValues, undefined, UpdateFormOutput>({
    resolver: zodResolver(UpdateCIRelationshipSchema),
    defaultValues: {
      validTo: null,
      note: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open && editingRelationship) {
      updateForm.reset({
        validTo: editingRelationship.validTo
          ? new Date(editingRelationship.validTo)
          : null,
        note: editingRelationship.note,
        isActive: editingRelationship.isActive,
      });
    } else if (open && !editingRelationship) {
      createForm.reset();
    }
  }, [open, editingRelationship, createForm, updateForm]);

  const onCreateSubmit = async (data: CreateFormOutput) => {
    try {
      const result = await createCIRelationshipAction(
        data.fromCiId,
        data.toCiId,
        data.relationshipTypeId,
        data.note ?? undefined,
      );
      if (result.success) {
        toast.success("Relationship created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create relationship");
    }
  };

  const onUpdateSubmit = async (data: UpdateFormOutput) => {
    try {
      const result = await updateCIRelationshipAction(
        editingRelationship!.id,
        data,
      );
      if (result.success) {
        toast.success("Relationship updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update relationship");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit CI Relationship" : "New CI Relationship"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the relationship details below."
              : "Create a new relationship between configuration items."}
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
                name="fromCiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Configuration Item *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter From CI ID (temporary)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      TODO: Replace with CI selector dropdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="toCiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Configuration Item *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter To CI ID (temporary)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      TODO: Replace with CI selector dropdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="relationshipTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Type *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Relationship Type ID (temporary)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      TODO: Replace with Relationship Type selector dropdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value && field.value instanceof Date
                              ? field.value.toISOString().split("T")[0]
                              : field.value
                                ? String(field.value).split("T")[0]
                                : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value && field.value instanceof Date
                              ? field.value.toISOString().split("T")[0]
                              : field.value
                                ? String(field.value).split("T")[0]
                                : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes"
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
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid To</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value && field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : field.value
                              ? String(field.value).split("T")[0]
                              : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
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
                        Set whether this relationship is currently active
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes"
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
      </DialogContent>
    </Dialog>
  );
}
