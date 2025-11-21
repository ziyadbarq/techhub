/**
 * Stock Movement Form Component
 * Create stock movement records
 */

"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/client";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { createStockMovementAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
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
  const { data: session } = useSession();
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>([]);
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm<
    StockMovementFormValues,
    undefined,
    CreateStockMovementDTO
  >({
    resolver: zodResolver(CreateStockMovementSchema),
    defaultValues: {
      movementType: "IN",
      stockLocationFromId: null,
      stockLocationToId: null,
      assetId: null,
      quantity: 1,
      reason: null,
      performedById: session?.user?.id ?? "",
      occurredAt: new Date(),
    },
  });

  const movementType = useWatch({
    control: form.control,
    name: "movementType",
  });

  // Load data when dialog opens
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      setLoadingData(true);
      try {
        const [locationsResult, assetsResult] = await Promise.all([
          listStockLocationsAction(),
          listAssetsAction(),
        ]);

        if (locationsResult.success) {
          setStockLocations(locationsResult.data);
        }
        if (assetsResult.success) {
          setAssets(assetsResult.data);
        }
      } catch (_error) {
        toast.error("Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [open]);

  // Update performedById when session changes
  useEffect(() => {
    if (session?.user?.id) {
      form.setValue("performedById", session.user.id);
    }
  }, [session, form]);

  // Clear location fields when movement type changes
  useEffect(() => {
    if (movementType === "IN") {
      form.setValue("stockLocationFromId", null);
    } else if (movementType === "OUT") {
      form.setValue("stockLocationToId", null);
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const showSourceLocation =
    movementType === "OUT" || movementType === "TRANSFER";
  const showDestinationLocation =
    movementType === "IN" || movementType === "TRANSFER";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      value={field.value || "none"}
                      disabled={loadingData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Location</SelectItem>
                        {stockLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} ({location.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>
                      Destination Location{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      value={field.value || "none"}
                      disabled={loadingData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Location</SelectItem>
                        {stockLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} ({location.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Asset (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Asset</SelectItem>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.assetTag} - {asset.serialNumber || "No SN"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="performedById"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Performed By <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="User ID"
                        {...field}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      Current user (auto-filled)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => {
                  const dateValue = field.value as Date | undefined;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Occurred At</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !dateValue && "text-muted-foreground",
                              )}
                            >
                              {dateValue ? (
                                format(dateValue, "PPP HH:mm")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When this movement occurred
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

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
                disabled={form.formState.isSubmitting || loadingData}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting ? "Saving..." : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
