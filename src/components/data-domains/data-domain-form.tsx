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
  CreateDataDomainSchema,
  UpdateDataDomainSchema,
  type CreateDataDomainDTO,
  type UpdateDataDomainDTO,
} from "@/interface-adapters/dtos/generated/data-domain.dto";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import {
  createDataDomain,
  updateDataDomain,
} from "@/interface-adapters/controllers/data-domain.controller";

interface DataDomainFormProps {
  dataDomain?: DataDomainDTO;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DataDomainForm({
  dataDomain,
  onSuccess,
  onCancel,
}: DataDomainFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!dataDomain;
  const [showCodeField, setShowCodeField] = React.useState(isEditing);

  const form = useForm<CreateDataDomainDTO | UpdateDataDomainDTO>({
    resolver: zodResolver(
      isEditing ? UpdateDataDomainSchema : CreateDataDomainSchema,
    ),
    defaultValues: {
      name: dataDomain?.name || "",
      code: dataDomain?.code || "",
      description: dataDomain?.description || "",
      isActive: dataDomain?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    setShowCodeField(isEditing);
  }, [isEditing]);

  const onSubmit = async (data: CreateDataDomainDTO | UpdateDataDomainDTO) => {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateDataDomain(dataDomain.id, data as UpdateDataDomainDTO)
        : await createDataDomain(data as CreateDataDomainDTO);

      if (result.success) {
        toast.success(
          `Data domain ${isEditing ? "updated" : "created"} successfully`,
        );
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} data domain`);
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
                  placeholder="e.g., Personally Identifiable Information"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The display name for this data domain
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
                  Code {isEditing && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., PII"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Unique code for this data domain (uppercase, letters/numbers/hyphens/underscores only)"
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
                  Active data domains can be used for governance tracking
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
