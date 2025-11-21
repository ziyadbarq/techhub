/**
 * Lifecycle Transition Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { LifecycleTransitionDTO } from "@/interface-adapters/presenters/lifecycle-transition.presenter";
import {
  createLifecycleTransitionAction,
  updateLifecycleTransitionAction,
} from "@/interface-adapters/controllers/lifecycle-transition.controller";
import {
  CreateLifecycleTransitionSchema,
  type CreateLifecycleTransitionDTO,
} from "@/interface-adapters/dtos/generated/lifecycle-transition.dto";

interface LifecycleTransitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  transition?: LifecycleTransitionDTO | null;
  modelId: string;
  fromStateId: string;
  toStateId: string;
}

type LifecycleTransitionFormValues = z.input<
  typeof CreateLifecycleTransitionSchema
>;

export function LifecycleTransitionForm({
  open,
  onOpenChange,
  onSuccess,
  transition,
  modelId,
  fromStateId,
  toStateId,
}: LifecycleTransitionFormProps) {
  const isEditing = !!transition;

  const form = useForm<
    LifecycleTransitionFormValues,
    undefined,
    CreateLifecycleTransitionDTO
  >({
    resolver: zodResolver(CreateLifecycleTransitionSchema),
    defaultValues: {
      name: transition?.name ?? "",
      description: transition?.description ?? "",
      modelId: transition?.modelId ?? modelId,
      fromStateId: transition?.fromStateId ?? fromStateId,
      toStateId: transition?.toStateId ?? toStateId,
      requiresApproval: transition?.requiresApproval ?? false,
      isActive: transition?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: transition?.name ?? "",
      description: transition?.description ?? "",
      modelId: transition?.modelId ?? modelId,
      fromStateId: transition?.fromStateId ?? fromStateId,
      toStateId: transition?.toStateId ?? toStateId,
      requiresApproval: transition?.requiresApproval ?? false,
      isActive: transition?.isActive ?? true,
    });
  }, [transition, modelId, fromStateId, toStateId, form]);

  const onSubmit = async (data: CreateLifecycleTransitionDTO) => {
    try {
      const result = isEditing
        ? await updateLifecycleTransitionAction({
            id: transition.id,
            ...data,
          })
        : await createLifecycleTransitionAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Lifecycle transition updated!"
            : "Lifecycle transition created!",
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
          ? "Failed to update lifecycle transition"
          : "Failed to create lifecycle transition",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Lifecycle Transition"
              : "Create Lifecycle Transition"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lifecycle transition details below."
              : "Add a new transition between states."}
          </DialogDescription>
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
                      placeholder="Enter transition name..."
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
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
                      maxLength={500}
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
              name="requiresApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Requires Approval</FormLabel>
                    <FormDescription>
                      This transition requires approval before execution
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
                      This transition is available for use
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
