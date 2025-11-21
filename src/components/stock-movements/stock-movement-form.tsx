/**
 * Stock Movement Form Component
 */

"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { createStockMovementAction } from "@/interface-adapters/controllers/stock-movement.controller";
import {
  CreateStockMovementSchema,
  type CreateStockMovementDTO,
} from "@/interface-adapters/dtos/generated/stock-movement.dto";

interface StockMovementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type StockMovementFormValues = z.input<typeof CreateStockMovementSchema>;

export function StockMovementForm({
  open,
  onOpenChange,
  onSuccess,
}: StockMovementFormProps) {
  const form = useForm<
    StockMovementFormValues,
    undefined,
    CreateStockMovementDTO
  >({
    resolver: zodResolver(CreateStockMovementSchema),
    defaultValues: {
      movementType: "IN",
      stockLocationFromId: "",
      stockLocationToId: "",
      assetId: "",
      quantity: 1,
      reason: "",
      performedById: "",
      occurredAt: new Date(),
    },
  });

  const movementType = useWatch({
    control: form.control,
    name: "movementType",
  });

  useEffect(() => {
    // Clear location fields when movement type changes
    if (movementType === "IN") {
      form.setValue("stockLocationFromId", "");
    } else if (movementType === "OUT") {
      form.setValue("stockLocationToId", "");
    }
  }, [movementType, form]);

  const onSubmit = async (data: CreateStockMovementDTO) => {
    try {
      const result = await createStockMovementAction(data);

      if (result.success) {
        toast.success("Stock movement recorded!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to record stock movement");
    }
  };

  const showSourceLocation =
    movementType === "OUT" || movementType === "TRANSFER";
  const showDestinationLocation =
    movementType === "IN" || movementType === "TRANSFER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
          <DialogDescription>
            Track inventory movements (receipts, issues, transfers,
            adjustments).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select movement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IN">
                        IN - Receive into stock
                      </SelectItem>
                      <SelectItem value="OUT">
                        OUT - Issue from stock
                      </SelectItem>
                      <SelectItem value="TRANSFER">
                        TRANSFER - Move between locations
                      </SelectItem>
                      <SelectItem value="ADJUSTMENT">
                        ADJUSTMENT - Inventory correction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of stock movement being recorded
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSourceLocation && (
              <FormField
                control={form.control}
                name="stockLocationFromId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Source Location {movementType === "TRANSFER" && "*"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Stock location ID"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Location where items are being removed from
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showDestinationLocation && (
              <FormField
                control={form.control}
                name="stockLocationToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Stock location ID"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Location where items are being added to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Asset ID (if applicable)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to a specific asset if this movement relates to one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>Number of items being moved</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for this movement..."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional explanation for this stock movement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="performedById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performed By *</FormLabel>
                  <FormControl>
                    <Input placeholder="User ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    User who performed this movement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occurred At</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    When this movement occurred (defaults to now)
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
                  ? "Recording..."
                  : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
