/**
 * Return Asset to Inventory Wizard
 * Wizard for returning assets from employees back to stock
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { returnAssetAction } from "@/interface-adapters/controllers/asset-workflow.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";

interface ReturnAssetWizardProps {
  assetId: string;
  assetTag: string;
  assignmentId: string;
  assignedToName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ReturnAssetSchema = z.object({
  stockLocationToId: z.string().min(1, "Please select a return location"),
  performedById: z.string().min(1, "Performer ID is required"),
  note: z.string().optional(),
});

type ReturnAssetFormValues = z.infer<typeof ReturnAssetSchema>;

export function ReturnAssetWizard({
  assetId,
  assetTag,
  assignmentId,
  assignedToName,
  open,
  onOpenChange,
  onSuccess,
}: ReturnAssetWizardProps) {
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm<ReturnAssetFormValues>({
    resolver: zodResolver(ReturnAssetSchema),
    defaultValues: {
      stockLocationToId: "",
      performedById: "", // TODO: Get from session
      note: "",
    },
  });

  // Load stock locations when dialog opens
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const locationsResult = await listStockLocationsAction();

        if (locationsResult.success) {
          setStockLocations(locationsResult.data);
        } else {
          toast.error("Failed to load stock locations");
        }
      } catch (_error) {
        toast.error("Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
      // TODO: Get current user from session and set performedById
      // For now, we'll use a placeholder - this should be replaced with actual session logic
      form.setValue("performedById", "current-user-id-placeholder");
    }
  }, [open, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        stockLocationToId: "",
        performedById: "",
        note: "",
      });
    }
  }, [open, form]);

  const onSubmit = async (data: ReturnAssetFormValues) => {
    try {
      const result = await returnAssetAction({
        assetId,
        assignmentId,
        stockLocationToId: data.stockLocationToId,
        performedById: data.performedById,
        note: data.note,
      });

      if (result.success) {
        toast.success("Asset returned successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Failed to return asset");
      }
    } catch (_error) {
      toast.error("Failed to return asset");
    }
  };

  const getSelectedLocation = () => {
    const locationId = form.watch("stockLocationToId");
    if (!locationId) return null;
    return stockLocations.find((l) => l.id === locationId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Return Asset to Inventory</DialogTitle>
          <DialogDescription>
            Return asset <span className="font-semibold">{assetTag}</span> to
            stock location
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="border-muted bg-muted/50 rounded-lg border p-4">
                {/* Return Summary */}
                <div className="bg-background mb-4 space-y-2 rounded-md p-3 text-sm">
                  <div>
                    <span className="font-medium">Asset:</span> {assetTag}
                  </div>
                  {assignedToName && (
                    <div>
                      <span className="font-medium">
                        Currently Assigned To:
                      </span>{" "}
                      {assignedToName}
                    </div>
                  )}
                  {getSelectedLocation() && (
                    <div>
                      <span className="font-medium">Return To:</span>{" "}
                      {getSelectedLocation()?.name} (
                      {getSelectedLocation()?.code})
                    </div>
                  )}
                </div>

                {/* Return Location */}
                <FormField
                  control={form.control}
                  name="stockLocationToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Return Location{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingData}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stock location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name} ({location.code})
                              {location.description && (
                                <span className="text-muted-foreground text-xs">
                                  {" "}
                                  - {location.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the stock location where the asset will be
                        returned
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this return (e.g., condition, reason for return)..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional information about the return, asset
                        condition, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Warning Message */}
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <p className="font-medium">Note:</p>
                <p className="mt-1 text-xs">
                  This will end the current assignment and create a stock
                  movement record. The asset will be marked as available in the
                  selected stock location.
                </p>
              </div>
            </div>

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
                disabled={form.formState.isSubmitting || loadingData}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting ? "Returning..." : "Return Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
