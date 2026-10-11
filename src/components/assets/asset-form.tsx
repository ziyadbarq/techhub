/**
 * Asset Form Component
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
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
import { getAssetFilterOptionsAction } from "@/interface-adapters/controllers/asset.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import { isValidAssetCondition } from "@/core/domain/value-objects/asset-condition";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";
import {
  CustomFieldsSection,
  validateCustomFields,
  type CustomFieldValues,
  type CustomFieldErrors,
} from "@/components/custom-fields";
import { useCategoryFields } from "@/hooks/use-category-fields";
import { AssetModelForm } from "@/components/asset-models/asset-model-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  asset?: AssetDTO | null;
  initialAssetCategoryId?: string;
}

type AssetFormValues = z.input<typeof CreateAssetSchema>;

const NONE_OPTION_VALUE = "__none__";

export function AssetForm({
  open,
  onOpenChange,
  onSuccess,
  asset,
  initialAssetCategoryId,
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
  const [owningCompanies, setOwningCompanies] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isModelFormOpen, setIsModelFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    () => (asset?.attributes as CustomFieldValues) ?? {},
  );
  const [customFieldErrors, setCustomFieldErrors] = useState<CustomFieldErrors>(
    {},
  );

  // Memoized options for searchable dropdowns
  const categoryOptions: SearchableSelectOption[] = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.code})`,
      })),
    [categories],
  );

  const modelOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...models.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.code})`,
      })),
    ],
    [models],
  );

  const vendorOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...vendors.map((v) => ({
        value: v.id,
        label: `${v.name} (${v.code})`,
      })),
    ],
    [vendors],
  );

  const stockLocationOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...stockLocations.map((l) => ({
        value: l.id,
        label: l.name,
      })),
    ],
    [stockLocations],
  );

  const owningCompanyOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...owningCompanies.map((company) => ({
        value: company.value,
        label: company.label,
      })),
    ],
    [owningCompanies],
  );

  const lifecycleStateOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...lifecycleStates.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    ],
    [lifecycleStates],
  );

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open && !loading) {
      // Use a timeout to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        const firstField =
          document.querySelector<HTMLButtonElement>('[role="combobox"]');
        if (firstField) {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, loading]);

  const form = useForm<AssetFormValues, undefined, CreateAssetDTO>({
    resolver: zodResolver(CreateAssetSchema),
    defaultValues: {
      assetTag: asset?.assetTag ?? "",
      assetCategoryId: asset?.assetCategoryId ?? initialAssetCategoryId ?? "",
      assetModelId: asset?.assetModelId ?? null,
      vendorId: asset?.vendorId ?? null,
      currentStockLocationId: asset?.currentStockLocationId ?? null,
      owningOrgUnitId: asset?.owningOrgUnitId ?? null,
      lifecycleStateId: asset?.lifecycleStateId ?? null,
      serialNumber: asset?.serialNumber ?? "",
      condition: normalizeCondition(asset?.condition),
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchaseCost: asset?.purchaseCost ?? undefined,
      currency: asset?.currency ?? "SAR",
      note: asset?.note ?? "",
      attributes: (asset?.attributes as Record<string, unknown>) ?? null,
    },
  });

  // Watch the selected category ID for custom fields
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "assetCategoryId",
  });
  const selectedVendorId = useWatch({
    control: form.control,
    name: "vendorId",
  });

  const newModelInitialValues = useMemo(
    () => ({
      assetCategoryId: selectedCategoryId || "",
      vendorId:
        selectedVendorId && selectedVendorId !== NONE_OPTION_VALUE
          ? selectedVendorId
          : "",
    }),
    [selectedCategoryId, selectedVendorId],
  );

  // Fetch custom fields for the selected category
  const { fields: categoryFields } = useCategoryFields(selectedCategoryId);

  // Reset custom field values when category changes (but not on initial load when editing)
  useEffect(() => {
    if (!isEditing && selectedCategoryId) {
      setCustomFieldValues({});
      setCustomFieldErrors({});
    }
  }, [selectedCategoryId, isEditing]);

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
        filterOptionsResult,
      ] = await Promise.all([
        listAssetCategoriesAction(),
        listAssetModelsAction(),
        listVendorsAction(),
        listStockLocationsAction(),
        listLifecycleStatesAction(),
        getAssetFilterOptionsAction(),
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

      if (filterOptionsResult.success) {
        setOwningCompanies(filterOptionsResult.data.owningCompanies);
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
      assetCategoryId: asset?.assetCategoryId ?? initialAssetCategoryId ?? "",
      assetModelId: asset?.assetModelId ?? null,
      vendorId: asset?.vendorId ?? null,
      currentStockLocationId: asset?.currentStockLocationId ?? null,
      owningOrgUnitId: asset?.owningOrgUnitId ?? null,
      lifecycleStateId: asset?.lifecycleStateId ?? null,
      serialNumber: asset?.serialNumber ?? "",
      condition: normalizeCondition(asset?.condition),
      purchaseDate: asset?.purchaseDate
        ? new Date(asset.purchaseDate)
        : undefined,
      purchaseCost: asset?.purchaseCost ?? undefined,
      currency: asset?.currency ?? "SAR",
      note: asset?.note ?? "",
      attributes: (asset?.attributes as Record<string, unknown>) ?? null,
    });
    // Reset custom field values when asset changes (editing mode)
    setCustomFieldValues((asset?.attributes as CustomFieldValues) ?? {});
    setCustomFieldErrors({});
  }, [asset, form, initialAssetCategoryId]);

  const onSubmit = async (data: CreateAssetDTO) => {
    // Validate custom fields before submission
    const visibleFields = categoryFields.filter((f) => f.isVisible);
    const errors = validateCustomFields(visibleFields, customFieldValues);

    if (Object.keys(errors).length > 0) {
      setCustomFieldErrors(errors);
      toast.error("Please fix the custom field errors");
      return;
    }

    // Include custom field values in the submission
    const submitData: CreateAssetDTO = {
      ...data,
      attributes:
        Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
    };

    try {
      const result = isEditing
        ? await updateAssetAction(asset.assetTag, submitData)
        : await createAssetAction(submitData);

      if (result.success) {
        toast.success(isEditing ? "Asset updated!" : "Asset created!");
        form.reset();
        setCustomFieldValues({});
        setCustomFieldErrors({});
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

  const handleModelCreated = (model?: AssetModelDTO) => {
    if (!model) {
      loadData();
      return;
    }

    setModels((currentModels) => {
      const existingIndex = currentModels.findIndex(
        (item) => item.id === model.id,
      );
      if (existingIndex === -1) {
        return [...currentModels, model];
      }

      return currentModels.map((item) => (item.id === model.id ? model : item));
    });
    form.setValue("assetModelId", model.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>{isEditing ? "Edit Asset:" : "Create Asset:"}</span>
              <InlineEditableField
                name="assetTag"
                placeholder={isEditing ? "Asset tag" : "Auto-generated"}
                transform="uppercase"
                optional={!isEditing}
              />
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the asset information."
                : "Add a new asset to your inventory."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["identification"]}
                className="w-full"
              >
                {/* Identification Section - Always Expanded */}
                <AccordionItem value="identification">
                  <AccordionTrigger>Identification</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Asset Category */}
                    <FormField
                      control={form.control}
                      name="assetCategoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Category</FormLabel>
                          <SearchableSelect
                            options={categoryOptions}
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            placeholder="Select a category..."
                            searchPlaceholder="Search categories..."
                            emptyMessage="No categories found"
                            disabled={loading}
                          />
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
                          <div className="flex items-center justify-between gap-3">
                            <FormLabel>Device Model</FormLabel>
                            <PermissionGuard
                              permission={PERMISSIONS.ASSET_MODELS_CREATE}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsModelFormOpen(true)}
                                className="h-8 gap-1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Model
                              </Button>
                            </PermissionGuard>
                          </div>
                          <SearchableSelect
                            options={modelOptions}
                            value={field.value ?? NONE_OPTION_VALUE}
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            placeholder="Select a device model..."
                            searchPlaceholder="Search device models..."
                            emptyMessage="No models found"
                            disabled={loading}
                          />
                          <FormDescription>
                            Specific device model, such as Latitude 5440 or
                            MacBook Pro M3
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
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ABC123XYZ789"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Manufacturer&apos;s serial number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Custom Fields Section - appears when a category is selected */}
                    {selectedCategoryId && (
                      <CustomFieldsSection
                        categoryId={selectedCategoryId}
                        values={customFieldValues}
                        onChange={setCustomFieldValues}
                        errors={customFieldErrors}
                        disabled={loading || form.formState.isSubmitting}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Location & Status Section */}
                <AccordionItem value="location-status">
                  <AccordionTrigger>Location & Status</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Owning Company */}
                    <FormField
                      control={form.control}
                      name="owningOrgUnitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owning Company</FormLabel>
                          <SearchableSelect
                            options={owningCompanyOptions}
                            value={field.value ?? NONE_OPTION_VALUE}
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            placeholder="Select a company..."
                            searchPlaceholder="Search companies..."
                            emptyMessage="No companies found"
                            disabled={loading}
                          />
                          <FormDescription>
                            Legal entity that owns this asset
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
                          <FormLabel>Stock Location</FormLabel>
                          <SearchableSelect
                            options={stockLocationOptions}
                            value={field.value ?? NONE_OPTION_VALUE}
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            placeholder="Select a location..."
                            searchPlaceholder="Search locations..."
                            emptyMessage="No locations found"
                            disabled={loading}
                          />
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
                          <FormLabel>Lifecycle State</FormLabel>
                          <SearchableSelect
                            options={lifecycleStateOptions}
                            value={field.value ?? NONE_OPTION_VALUE}
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            placeholder="Select a state..."
                            searchPlaceholder="Search states..."
                            emptyMessage="No states found"
                            disabled={loading}
                          />
                          <FormDescription>
                            Current lifecycle state of the asset
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
                          <FormLabel>Condition</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NONE_OPTION_VALUE}>
                                None
                              </SelectItem>
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
                  </AccordionContent>
                </AccordionItem>

                {/* Procurement Section */}
                <AccordionItem value="procurement">
                  <AccordionTrigger>Procurement</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Supplier (Override) */}
                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier / Manufacturer</FormLabel>
                          <SearchableSelect
                            options={vendorOptions}
                            value={field.value ?? NONE_OPTION_VALUE}
                            onValueChange={(value) =>
                              field.onChange(
                                value === NONE_OPTION_VALUE ? null : value,
                              )
                            }
                            placeholder="Select a supplier or manufacturer..."
                            searchPlaceholder="Search suppliers or manufacturers..."
                            emptyMessage="No suppliers or manufacturers found"
                            disabled={loading}
                          />
                          <FormDescription>
                            The company that supplied or manufactured this
                            specific asset
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
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value && field.value instanceof Date
                                  ? field.value.toISOString().split("T")[0]
                                  : field.value &&
                                      typeof field.value === "string"
                                    ? new Date(field.value)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                              }
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null,
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
                            <FormLabel>Purchase Cost</FormLabel>
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
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "SAR"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUPPORTED_CURRENCIES.map((curr) => (
                                  <SelectItem key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.code} - {curr.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Currency for purchase cost
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Additional Details Section */}
                <AccordionItem value="additional">
                  <AccordionTrigger>Additional Details</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Note */}
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes about this asset"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Any additional information
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
        </FormProvider>
      </DialogContent>
      <AssetModelForm
        open={isModelFormOpen}
        onOpenChange={setIsModelFormOpen}
        onSuccess={handleModelCreated}
        initialValues={newModelInitialValues}
      />
    </Dialog>
  );
}
