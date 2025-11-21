/**
 * Lifecycle Model Form Component
 *
 * Dialog form for creating and editing lifecycle models.
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
import { toast } from "sonner";
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import {
  createLifecycleModelAction,
  updateLifecycleModelAction,
} from "@/interface-adapters/controllers/lifecycle-model.controller";
import {
  CreateLifecycleModelSchema,
  type CreateLifecycleModelDTO,
} from "@/interface-adapters/dtos/generated/lifecycle-model.dto";

interface LifecycleModelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  model?: LifecycleModelDTO | null;
}

export function LifecycleModelForm({
  open,
  onOpenChange,
  onSuccess,
  model,
}: LifecycleModelFormProps) {
  const isEditing = !!model;

  const form = useForm<CreateLifecycleModelDTO>({
    resolver: zodResolver(CreateLifecycleModelSchema),
    defaultValues: {
      name: model?.name ?? "",
      description: model?.description ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: model?.name ?? "",
      description: model?.description ?? "",
    });
  }, [model, form]);

  const onSubmit = async (data: CreateLifecycleModelDTO) => {
    try {
      const result = isEditing
        ? await updateLifecycleModelAction({
            id: model.id,
            ...data,
          })
        : await createLifecycleModelAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Lifecycle model updated!" : "Lifecycle model created!",
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
          ? "Failed to update lifecycle model"
          : "Failed to create lifecycle model",
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
            {isEditing ? "Edit Lifecycle Model" : "Create Lifecycle Model"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lifecycle model details below."
              : "Add a new lifecycle model to define asset states."}
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
                      placeholder="Enter model name..."
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/100 characters
                  </FormDescription>
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
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
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
