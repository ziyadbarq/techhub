/**
 * Business Process Form Component
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

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

import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";
import {
  createBusinessProcessAction,
  updateBusinessProcessAction,
} from "@/interface-adapters/controllers/business-process.controller";
import {
  CreateBusinessProcessSchema,
  type CreateBusinessProcessDTO,
} from "@/interface-adapters/dtos/generated/service.dto";

interface BusinessProcessFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  businessProcess?: BusinessProcessDTO | null;
}

type BusinessProcessFormValues = z.input<typeof CreateBusinessProcessSchema>;

export function BusinessProcessForm({
  open,
  onOpenChange,
  onSuccess,
  businessProcess,
}: BusinessProcessFormProps) {
  const isEditing = !!businessProcess;

  const form = useForm<
    BusinessProcessFormValues,
    undefined,
    CreateBusinessProcessDTO
  >({
    resolver: zodResolver(CreateBusinessProcessSchema),
    defaultValues: {
      code: businessProcess?.code ?? "",
      name: businessProcess?.name ?? "",
      description: businessProcess?.description ?? "",
      category: businessProcess?.category ?? "",
      metadata: businessProcess?.metadata ?? null,
    },
  });

  React.useEffect(() => {
    form.reset({
      code: businessProcess?.code ?? "",
      name: businessProcess?.name ?? "",
      description: businessProcess?.description ?? "",
      category: businessProcess?.category ?? "",
      metadata: businessProcess?.metadata ?? null,
    });
  }, [businessProcess, form]);

  const onSubmit = async (data: CreateBusinessProcessDTO) => {
    try {
      // Normalize empty strings to undefined for optional fields
      const normalizedData = {
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
      };

      const result = isEditing
        ? await updateBusinessProcessAction(businessProcess.id, normalizedData)
        : await createBusinessProcessAction(normalizedData);

      if (result.success) {
        toast.success(
          isEditing ? "Business process updated!" : "Business process created!",
        );
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (_error) {
      toast.error(
        isEditing
          ? "Failed to update business process"
          : "Failed to create business process",
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Business Process" : "Create Business Process"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the business process details below."
              : "Add a new business process to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., PAYMENT_PROCESSING"
                      {...field}
                      onChange={(e) => {
                        // Auto-uppercase the code
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique code in uppercase (letters, numbers, underscores)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Payment Processing" {...field} />
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
                      placeholder="Describe the business process..."
                      rows={4}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Finance, Operations, Customer Service"
                      {...field}
                      value={field.value || ""}
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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
