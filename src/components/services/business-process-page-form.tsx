/**
 * Business Process Page Form Component
 * For use in standalone pages (not modals)
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";
import {
  createBusinessProcessAction,
  updateBusinessProcessAction,
} from "@/interface-adapters/controllers/business-process.controller";
import {
  CreateBusinessProcessSchema,
  type CreateBusinessProcessDTO,
} from "@/interface-adapters/dtos/generated/service.dto";

interface BusinessProcessPageFormProps {
  mode: "create" | "edit";
  businessProcess?: BusinessProcessDTO;
}

type BusinessProcessFormValues = z.input<typeof CreateBusinessProcessSchema>;

export function BusinessProcessPageForm({
  mode,
  businessProcess,
}: BusinessProcessPageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const onSubmit = async (data: CreateBusinessProcessDTO) => {
    setIsSubmitting(true);
    try {
      // Normalize empty strings to undefined for optional fields
      const normalizedData = {
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
      };

      const result =
        mode === "edit" && businessProcess
          ? await updateBusinessProcessAction(
              businessProcess.id,
              normalizedData,
            )
          : await createBusinessProcessAction(normalizedData);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Business process updated!"
            : "Business process created!",
        );
        router.push(
          mode === "edit"
            ? `/business-processes/${businessProcess?.id}`
            : "/business-processes",
        );
        router.refresh();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (_error) {
      toast.error(
        mode === "edit"
          ? "Failed to update business process"
          : "Failed to create business process",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="BP-001"
                      {...field}
                      disabled={mode === "edit"}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the business process
                    {mode === "edit" && " (cannot be changed)"}
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
                    <Input placeholder="Customer Onboarding" {...field} />
                  </FormControl>
                  <FormDescription>
                    Display name for the business process
                  </FormDescription>
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
                      placeholder="Customer Service"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional category or classification
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
                      placeholder="Describe the business process..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the business process and its purpose
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                mode === "edit"
                  ? `/business-processes/${businessProcess?.id}`
                  : "/business-processes",
              )
            }
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Business Process"
                : "Create Business Process"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
