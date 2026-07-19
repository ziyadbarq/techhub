/**
 * Lifecycle Transition Form Component
 */

"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
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
  models?: LifecycleModelDTO[];
  states?: LifecycleStateDTO[];
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
  models = [],
  states = [],
}: LifecycleTransitionFormProps) {
  const isEditing = !!transition;
  const fallbackModelId = transition?.modelId ?? modelId;

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

  const watchedModelId = useWatch({
    control: form.control,
    name: "modelId",
  });
  const watchedFromStateId = useWatch({
    control: form.control,
    name: "fromStateId",
  });
  const effectiveModelId = watchedModelId || fallbackModelId;

  const modelOptions = useMemo(
    () =>
      models.map((model) => ({
        value: model.id,
        label: model.name,
      })),
    [models],
  );

  const stateOptions = useMemo(
    () =>
      states
        .filter((state) => state.modelId === effectiveModelId)
        .map((state) => ({
          value: state.id,
          label: `${state.name} (${state.code})`,
        })),
    [states, effectiveModelId],
  );

  const toStateOptions = useMemo(
    () =>
      stateOptions.map((state) => ({
        ...state,
        disabled: state.value === watchedFromStateId,
      })),
    [stateOptions, watchedFromStateId],
  );

  const showModelSelect = !modelId;

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

  useEffect(() => {
    if (!isEditing) {
      const availableStateIds = new Set(
        stateOptions.map((state) => state.value),
      );
      const currentFromStateId = form.getValues("fromStateId");
      const currentToStateId = form.getValues("toStateId");

      if (currentFromStateId && !availableStateIds.has(currentFromStateId)) {
        form.setValue("fromStateId", "", { shouldValidate: true });
      }
      if (currentToStateId && !availableStateIds.has(currentToStateId)) {
        form.setValue("toStateId", "", { shouldValidate: true });
      }
    }
  }, [form, isEditing, stateOptions]);

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

            {showModelSelect && (
              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Lifecycle Model{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={modelOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("fromStateId", "", {
                            shouldValidate: true,
                          });
                          form.setValue("toStateId", "", {
                            shouldValidate: true,
                          });
                        }}
                        placeholder="Select lifecycle model"
                        searchPlaceholder="Search lifecycle models..."
                        emptyMessage="No lifecycle models found."
                        disabled={isEditing || modelOptions.length === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fromStateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      From State <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={stateOptions}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (form.getValues("toStateId") === value) {
                            form.setValue("toStateId", "", {
                              shouldValidate: true,
                            });
                          }
                        }}
                        placeholder={
                          effectiveModelId
                            ? "Select source state"
                            : "Select a model first"
                        }
                        searchPlaceholder="Search states..."
                        emptyMessage="No states found for this model."
                        disabled={
                          isEditing ||
                          !effectiveModelId ||
                          stateOptions.length === 0
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toStateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      To State <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={toStateOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={
                          effectiveModelId
                            ? "Select destination state"
                            : "Select a model first"
                        }
                        searchPlaceholder="Search states..."
                        emptyMessage="No states found for this model."
                        disabled={
                          isEditing ||
                          !effectiveModelId ||
                          stateOptions.length === 0
                        }
                      />
                    </FormControl>
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
