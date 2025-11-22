/**
 * Lifecycle State Form Component
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2 } from "lucide-react";
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
}

type LifecycleStateFormValues = z.input<typeof CreateLifecycleStateSchema>;

export function LifecycleStateForm({
  open,
  onOpenChange,
  onSuccess,
  state,
  modelId,
}: LifecycleStateFormProps) {
  const isEditing = !!state;
  const [showCodeField, setShowCodeField] = useState(isEditing);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Lifecycle State" : "Create Lifecycle State"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lifecycle state details below."
              : "Add a new state to the lifecycle model."}
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
                      placeholder="Enter state name..."
                      maxLength={100}
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
                        placeholder="STATE-000001"
                        maxLength={50}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditing
                        ? "Unique code within this lifecycle model"
                        : "Leave empty to auto-generate"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
      </DialogContent>
    </Dialog>
  );
}
