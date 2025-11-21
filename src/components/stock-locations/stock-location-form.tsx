/**
 * Stock Location Form Component
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
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import {
  createStockLocationAction,
  updateStockLocationAction,
} from "@/interface-adapters/controllers/stock-location.controller";
import {
  CreateStockLocationSchema,
  type CreateStockLocationDTO,
} from "@/interface-adapters/dtos/generated/stock-location.dto";

interface StockLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stockLocation?: StockLocationDTO | null;
}

type StockLocationFormValues = z.input<typeof CreateStockLocationSchema>;

export function StockLocationForm({
  open,
  onOpenChange,
  onSuccess,
  stockLocation,
}: StockLocationFormProps) {
  const isEditing = !!stockLocation;

  const form = useForm<
    StockLocationFormValues,
    undefined,
    CreateStockLocationDTO
  >({
    resolver: zodResolver(CreateStockLocationSchema),
    defaultValues: {
      name: stockLocation?.name ?? "",
      code: stockLocation?.code ?? "",
      description: stockLocation?.description ?? "",
      locationId: stockLocation?.locationId ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: stockLocation?.name ?? "",
      code: stockLocation?.code ?? "",
      description: stockLocation?.description ?? "",
      locationId: stockLocation?.locationId ?? "",
    });
  }, [stockLocation, form]);

  const onSubmit = async (data: CreateStockLocationDTO) => {
    try {
      const result = isEditing
        ? await updateStockLocationAction(stockLocation.id, data)
        : await createStockLocationAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Stock location updated!" : "Stock location created!",
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
          ? "Failed to update stock location"
          : "Failed to create stock location",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Stock Location" : "Create Stock Location"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the stock location information."
              : "Add a new stock location (warehouse or storage area)."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Warehouse" {...field} />
                  </FormControl>
                  <FormDescription>
                    Display name for this stock location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="WH-001"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier (alphanumeric, hyphens, underscores)
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
                      placeholder="Primary storage facility..."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of this stock location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Location (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Location ID"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to a physical location entity if applicable
                  </FormDescription>
                  <FormMessage />
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
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
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
