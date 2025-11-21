/**
 * Asset Form Component
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
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  createAssetAction,
  updateAssetAction,
} from "@/interface-adapters/controllers/asset.controller";
import {
  CreateAssetSchema,
  type CreateAssetDTO,
} from "@/interface-adapters/dtos/generated/asset.dto";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listAssetModelsAction } from "@/interface-adapters/controllers/asset-model.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import { isValidAssetCondition } from "@/core/domain/value-objects/asset-condition";

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  asset?: AssetDTO | null;
}

type AssetFormValues = z.input<typeof CreateAssetSchema>;

const NONE_OPTION_VALUE = "__none__";

export function AssetForm({
  open,
  onOpenChange,
  onSuccess,
  asset,
}: AssetFormProps) {
  const normalizeCondition = (
    value: AssetDTO["condition"] | undefined,
  ): AssetFormValues["condition"] => {
    if (value && isValidAssetCondition(value)) {
      return value;
    }
    return null;
  };

  const isEditing = !!asset;
  const [categories, setCategories] = useState<AssetCategoryDTO[]>([]);
  const [models, setModels] = useState<AssetModelDTO[]>([]);
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>([]);
  const [lifecycleStates, setLifecycleStates] = useState<LifecycleStateDTO[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const form = useForm<AssetFormValues, undefined, CreateAssetDTO>({
    resolver: zodResolver(CreateAssetSchema),
    defaultValues: {
      assetTag: asset?.assetTag ?? "",
      assetCategoryId: asset?.assetCategoryId ?? "",
      assetModelId: asset?.assetModelId ?? null,
      vendorId: asset?.vendorId ?? null,
      currentStockLocationId: asset?.currentStockLocationId ?? null,
      lifecycleStateId: asset?.lifecycleStateId ?? null,
      serialNumber: asset?.serialNumber ?? "",
      condition: normalizeCondition(asset?.condition),
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchaseCost: asset?.purchaseCost ?? undefined,
      currency: asset?.currency ?? "",
      warrantyEndDate: asset?.warrantyEndDate
        ? new Date(asset.warrantyEndDate)
        : undefined,
      note: asset?.note ?? "",
    },
  });

  // Load categories, models, and vendors when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        categoriesResult,
        modelsResult,
        vendorsResult,
        stockLocationsResult,
        lifecycleStatesResult,
      ] = await Promise.all([
        listAssetCategoriesAction(),
        listAssetModelsAction(),
        listVendorsAction(),
        listStockLocationsAction(),
        listLifecycleStatesAction(),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      if (modelsResult.success) {
        setModels(modelsResult.data);
      }

      if (vendorsResult.success) {
        setVendors(vendorsResult.data);
      }

      if (stockLocationsResult.success) {
        setStockLocations(stockLocationsResult.data);
      }

      if (lifecycleStatesResult.success) {
        setLifecycleStates(lifecycleStatesResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.reset({
      assetTag: asset?.assetTag ?? "",
      assetCategoryId: asset?.assetCategoryId ?? "",
      assetModelId: asset?.assetModelId ?? null,
      vendorId: asset?.vendorId ?? null,
      currentStockLocationId: asset?.currentStockLocationId ?? null,
      lifecycleStateId: asset?.lifecycleStateId ?? null,
      serialNumber: asset?.serialNumber ?? "",
      condition: normalizeCondition(asset?.condition),
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchaseCost: asset?.purchaseCost ?? undefined,
      currency: asset?.currency ?? "",
      warrantyEndDate: asset?.warrantyEndDate
        ? new Date(asset.warrantyEndDate)
        : undefined,
      note: asset?.note ?? "",
    });
  }, [asset, form]);

  const onSubmit = async (data: CreateAssetDTO) => {
    try {
      const result = isEditing
        ? await updateAssetAction(asset.id, data)
        : await createAssetAction(data);

      if (result.success) {
        toast.success(isEditing ? "Asset updated!" : "Asset created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update asset" : "Failed to create asset",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Asset" : "Create Asset"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the asset information."
              : "Add a new asset to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Asset Tag */}
            <FormField
              control={form.control}
              name="assetTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Tag</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="IT-LAP-001"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Category */}
            <FormField
              control={form.control}
              name="assetCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The category this asset belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Model */}
            <FormField
              control={form.control}
              name="assetModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Model (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? undefined}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Specific model/make of this asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? undefined}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The supplier or manufacturer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock Location */}
            <FormField
              control={form.control}
              name="currentStockLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Location (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? undefined}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      {stockLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current physical location of the asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lifecycle State */}
            <FormField
              control={form.control}
              name="lifecycleStateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lifecycle State (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? undefined}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      {lifecycleStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current lifecycle state of the asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Serial Number */}
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC123XYZ789"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Manufacturer's serial number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Condition */}
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Physical condition of the asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value && field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value && typeof field.value === "string"
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    When the asset was purchased
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Cost */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Cost (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="999.99"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : Number(value),
                          );
                        }}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Cost in specified currency
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="USD"
                        maxLength={3}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>3-letter ISO code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Warranty End Date */}
            <FormField
              control={form.control}
              name="warrantyEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value && field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value && typeof field.value === "string"
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>When the warranty expires</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this asset"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>Any additional information</FormDescription>
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
                disabled={form.formState.isSubmitting || loading}
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
