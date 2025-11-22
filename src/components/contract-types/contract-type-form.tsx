"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  CreateContractTypeSchema,
  UpdateContractTypeSchema,
  type CreateContractTypeDTO,
  type UpdateContractTypeDTO,
} from "@/interface-adapters/dtos/generated/contract-type.dto";
import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import {
  createContractType,
  updateContractType,
} from "@/interface-adapters/controllers/contract-type.controller";

interface ContractTypeFormProps {
  contractType?: ContractTypeDTO;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContractTypeForm({
  contractType,
  onSuccess,
  onCancel,
}: ContractTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!contractType;
  const [showCodeField, setShowCodeField] = React.useState(isEditing);

  const form = useForm<CreateContractTypeDTO | UpdateContractTypeDTO>({
    resolver: zodResolver(
      isEditing ? UpdateContractTypeSchema : CreateContractTypeSchema,
    ),
    defaultValues: {
      name: contractType?.name || "",
      code: contractType?.code || "",
      description: contractType?.description || "",
      isActive: contractType?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    setShowCodeField(isEditing);
  }, [isEditing]);

  const onSubmit = async (
    data: CreateContractTypeDTO | UpdateContractTypeDTO,
  ) => {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateContractType(
            contractType.id,
            data as UpdateContractTypeDTO,
          )
        : await createContractType(data as CreateContractTypeDTO);

      if (result.success) {
        toast.success(
          `Contract type ${isEditing ? "updated" : "created"} successfully`,
        );
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} contract type`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Software License Agreement"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The display name for this contract type
              </FormDescription>
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
                    placeholder="e.g., SLA"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Unique code for this contract type (uppercase, letters/numbers/hyphens/underscores only)"
                    : "Leave empty to auto-generate"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description..."
                  className="resize-none"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Active contract types can be used for new contracts
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
