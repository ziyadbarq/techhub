/**
 * Stock Location Form Component
 * Create and edit stock location records
 */

"use client";

import { useEffect, useState } from "react";
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
import { Edit2 } from "lucide-react";
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
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";
import {
  createStockLocationAction,
  updateStockLocationAction,
} from "@/interface-adapters/controllers/stock-location.controller";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
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
  const [showCodeField, setShowCodeField] = useState(isEditing);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm<
    StockLocationFormValues,
    undefined,
    CreateStockLocationDTO
  >({
    resolver: zodResolver(CreateStockLocationSchema),
    defaultValues: {
      name: stockLocation?.name ?? "",
      code: stockLocation?.code ?? "",
      description: stockLocation?.description ?? null,
      locationId: stockLocation?.locationId ?? null,
    },
  });

  // Load locations
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      setLoadingData(true);
      try {
        const locationsResult = await listLocationsAction();
        if (locationsResult.success) {
          setLocations(locationsResult.data);
        }
      } catch (_error) {
        toast.error("Failed to load locations");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [open]);

  // Reset form when stockLocation changes
  useEffect(() => {
    setShowCodeField(isEditing);
    form.reset({
      name: stockLocation?.name ?? "",
      code: stockLocation?.code ?? "",
      description: stockLocation?.description ?? null,
      locationId: stockLocation?.locationId ?? null,
    });
  }, [stockLocation, form, isEditing]);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        placeholder="WH-001"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditing
                        ? "Unique identifier (alphanumeric, hyphens, underscores)"
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
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || loadingData}
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
