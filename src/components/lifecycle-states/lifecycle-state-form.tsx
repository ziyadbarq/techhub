/**
 * Lifecycle State Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useAutoGenerateCode } from "@/hooks/use-auto-generate-code";
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
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import {
  createLifecycleStateAction,
  updateLifecycleStateAction,
} from "@/interface-adapters/controllers/lifecycle-state.controller";
import {
  CreateLifecycleStateSchema,
  type CreateLifecycleStateDTO,
} from "@/interface-adapters/dtos/generated/lifecycle-state.dto";
import { StateType } from "@/core/domain/value-objects/foundation-enums";

interface LifecycleStateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  state?: LifecycleStateDTO | null;
  modelId: string;
  models?: LifecycleModelDTO[];
}

type LifecycleStateFormValues = z.input<typeof CreateLifecycleStateSchema>;

export function LifecycleStateForm({
  open,
  onOpenChange,
  onSuccess,
  state,
  modelId,
  models = [],
}: LifecycleStateFormProps) {
  const isEditing = !!state;
  const showModelSelect = !modelId;
  const modelOptions = models.map((model) => ({
    value: model.id,
    label: model.name,
  }));

  const form = useForm<
    LifecycleStateFormValues,
    undefined,
    CreateLifecycleStateDTO
  >({
    resolver: zodResolver(CreateLifecycleStateSchema),
    defaultValues: {
      name: state?.name ?? "",
      code: state?.code ?? "",
      description: state?.description ?? "",
      modelId: state?.modelId ?? modelId,
      stateType: state?.stateType ?? StateType.ACTIVE,
      isActive: state?.isActive ?? true,
    },
  });

  // Auto-generate code from name (like WordPress slugs)
  useAutoGenerateCode({ form, isEditing });

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
      name: state?.name ?? "",
      code: state?.code ?? "",
      description: state?.description ?? "",
      modelId: state?.modelId ?? modelId,
      stateType: state?.stateType ?? StateType.ACTIVE,
      isActive: state?.isActive ?? true,
    });
  }, [state, modelId, form]);

  const onSubmit = async (data: CreateLifecycleStateDTO) => {
    try {
      const result = isEditing
        ? await updateLifecycleStateAction({
            id: state.id,
            ...data,
          })
        : await createLifecycleStateAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Lifecycle state updated!" : "Lifecycle state created!",
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
          ? "Failed to update lifecycle state"
          : "Failed to create lifecycle state",
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
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {isEditing
                  ? "Edit Lifecycle State:"
                  : "Create Lifecycle State:"}
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
                ? "Update the lifecycle state details below."
                : "Add a new state to the lifecycle model."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          onValueChange={field.onChange}
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
                        placeholder="Enter state name..."
                        maxLength={100}
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
                name="stateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      State Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(StateType).map((type) => (
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
                        This state is available for use
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
