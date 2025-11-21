/**
 * Person Role Assignment Form Component
 */

"use client";

import { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { PersonRoleAssignmentDTO } from "@/interface-adapters/presenters/person-role-assignment.presenter";
import {
  createPersonRoleAssignmentAction,
  updatePersonRoleAssignmentAction,
} from "@/interface-adapters/controllers/person-role-assignment.controller";
import {
  CreatePersonRoleAssignmentSchema,
  type CreatePersonRoleAssignmentDTO,
} from "@/interface-adapters/dtos/generated/person-role-assignment.dto";

interface PersonRoleAssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assignment?: PersonRoleAssignmentDTO | null;
  personId: string;
  roleId: string;
}

type PersonRoleAssignmentFormValues = z.input<
  typeof CreatePersonRoleAssignmentSchema
>;

export function PersonRoleAssignmentForm({
  open,
  onOpenChange,
  onSuccess,
  assignment,
  personId,
  roleId,
}: PersonRoleAssignmentFormProps) {
  const isEditing = !!assignment;
  const form = useForm<
    PersonRoleAssignmentFormValues,
    undefined,
    CreatePersonRoleAssignmentDTO
  >({
    resolver: zodResolver(CreatePersonRoleAssignmentSchema),
    defaultValues: {
      personId: assignment?.personId ?? personId,
      roleId: assignment?.roleId ?? roleId,
      scope: assignment?.scope ?? "",
      isPrimary: assignment?.isPrimary ?? false,
      isActive: assignment?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      personId: assignment?.personId ?? personId,
      roleId: assignment?.roleId ?? roleId,
      scope: assignment?.scope ?? "",
      isPrimary: assignment?.isPrimary ?? false,
      isActive: assignment?.isActive ?? true,
    });
  }, [assignment, personId, roleId, form]);

  const onSubmit = async (data: CreatePersonRoleAssignmentDTO) => {
    try {
      const result = isEditing
        ? await updatePersonRoleAssignmentAction({ id: assignment.id, ...data })
        : await createPersonRoleAssignmentAction(data);
      if (result.success) {
        toast.success(
          isEditing ? "Assignment updated!" : "Assignment created!",
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
          ? "Failed to update assignment"
          : "Failed to create assignment",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Role Assignment" : "Create Role Assignment"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Department, Project"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional scope for this assignment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary Assignment</FormLabel>
                    <FormDescription>
                      This is the person's primary role
                    </FormDescription>
                  </div>
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
                      This assignment is currently active
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
