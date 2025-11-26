/**
 * Warranty Form Component
 * Create and edit warranty records
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import {
  createWarrantyAction,
  updateWarrantyAction,
} from "@/interface-adapters/controllers/warranty.controller";
import {
  CreateWarrantySchema,
  type CreateWarrantyDTO,
} from "@/interface-adapters/dtos/generated/warranty.dto";
import { WarrantyCoverageType } from "@/generated/prisma/enums";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";

interface WarrantyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  warranty?: WarrantyDTO | null;
  preselectedAssetId?: string | null;
}

type WarrantyFormValues = z.input<typeof CreateWarrantySchema>;

export function WarrantyForm({
  open,
  onOpenChange,
  onSuccess,
  warranty,
  preselectedAssetId,
}: WarrantyFormProps) {
  const isEditing = !!warranty;
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm<WarrantyFormValues, undefined, CreateWarrantyDTO>({
    resolver: zodResolver(CreateWarrantySchema),
    defaultValues: {
      assetId: warranty?.assetId ?? preselectedAssetId ?? "",
      vendorId: warranty?.vendorId ?? null,
      coverageType: warranty?.coverageType ?? WarrantyCoverageType.STANDARD,
      coverageDetails: warranty?.coverageDetails ?? "",
      policyReference: warranty?.policyReference ?? "",
      startDate: warranty?.startDate
        ? new Date(warranty.startDate)
        : new Date(),
      endDate: warranty?.endDate
        ? new Date(warranty.endDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      cost: warranty?.cost ?? null,
      currency: warranty?.currency ?? "SAR",
      note: warranty?.note ?? "",
    },
  });

  // Load assets and vendors
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [assetsResult, vendorsResult] = await Promise.all([
          listAssetsAction(),
          listVendorsAction(),
        ]);

        if (assetsResult.success) {
          setAssets(assetsResult.data);
        }
        if (vendorsResult.success) {
          setVendors(vendorsResult.data);
        }
      } catch (_error) {
        toast.error("Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Memoized options for searchable selects
  const assetOptions: SearchableSelectOption[] = useMemo(
    () =>
      assets.map((asset) => ({
        value: asset.id,
        label: asset.assetTag,
      })),
    [assets],
  );

  const vendorOptions: SearchableSelectOption[] = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
      })),
    [vendors],
  );

  // Reset form when warranty changes
  useEffect(() => {
    form.reset({
      assetId: warranty?.assetId ?? preselectedAssetId ?? "",
      vendorId: warranty?.vendorId ?? null,
      coverageType: warranty?.coverageType ?? WarrantyCoverageType.STANDARD,
      coverageDetails: warranty?.coverageDetails ?? "",
      policyReference: warranty?.policyReference ?? "",
      startDate: warranty?.startDate
        ? new Date(warranty.startDate)
        : new Date(),
      endDate: warranty?.endDate
        ? new Date(warranty.endDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cost: warranty?.cost ?? null,
      currency: warranty?.currency ?? "SAR",
      note: warranty?.note ?? "",
    });
  }, [warranty, preselectedAssetId, form]);

  const onSubmit = async (data: CreateWarrantyDTO) => {
    try {
      const result = isEditing
        ? await updateWarrantyAction(warranty.id, data)
        : await createWarrantyAction(data);

      if (result.success) {
        toast.success(isEditing ? "Warranty updated!" : "Warranty created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update warranty" : "Failed to create warranty",
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Warranty" : "Create Warranty"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the warranty details below."
              : "Add a new warranty to track asset coverage."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Asset Selection */}
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Asset <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={assetOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select an asset"
                      searchPlaceholder="Search assets..."
                      disabled={loadingData || isEditing}
                    />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>
                      Asset cannot be changed after creation
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Selection (Optional) */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "__none__", label: "No Vendor" },
                        ...vendorOptions,
                      ]}
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      placeholder="Select a vendor (optional)"
                      searchPlaceholder="Search vendors..."
                      disabled={loadingData}
                    />
                  </FormControl>
                  <FormDescription>
                    Warranty provider or manufacturer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coverage Type */}
            <FormField
              control={form.control}
              name="coverageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coverage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.values(WarrantyCoverageType) as string[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => {
                  const dateValue = field.value as Date | undefined;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Start Date <span className="text-destructive">*</span>
                      </FormLabel>
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
                                format(dateValue, "PPP")
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
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => {
                  const dateValue = field.value as Date | undefined;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        End Date <span className="text-destructive">*</span>
                      </FormLabel>
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
                                format(dateValue, "PPP")
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
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Policy Reference */}
            <FormField
              control={form.control}
              name="policyReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="WTY-2024-001"
                      maxLength={200}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Policy number or reference code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost and Currency */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
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
                      Currency for warranty cost
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Coverage Details */}
            <FormField
              control={form.control}
              name="coverageDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what is covered under this warranty..."
                      maxLength={5000}
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or comments..."
                      maxLength={5000}
                      rows={2}
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
