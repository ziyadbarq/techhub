/**
 * License Product Form
 * Handles create and edit flows with vendor + lifecycle selections.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLicenseProduct,
  updateLicenseProduct,
} from "@/interface-adapters/controllers/license-product.controller";
import {
  CreateLicenseProductSchema,
  type CreateLicenseProductDTO,
} from "@/interface-adapters/dtos/generated/license-product.dto";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import { LicenseMetricType } from "@/core/domain/entities/license-product.entity";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";

type LicenseProductFormValues = z.input<typeof CreateLicenseProductSchema>;

interface LicenseProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  licenseProduct?: LicenseProductDTO | null;
}

const NONE_OPTION_VALUE = "__none__";

const metricTypeOptions: Array<{ value: LicenseMetricType; label: string }> = [
  { value: LicenseMetricType.PER_DEVICE, label: "Per Device" },
  { value: LicenseMetricType.PER_USER, label: "Per User" },
  { value: LicenseMetricType.PER_CORE, label: "Per Core" },
  { value: LicenseMetricType.PER_VM, label: "Per VM" },
  { value: LicenseMetricType.PER_CLUSTER, label: "Per Cluster" },
];

export function LicenseProductForm({
  open,
  onOpenChange,
  onSuccess,
  licenseProduct,
}: LicenseProductFormProps) {
  const isEditing = Boolean(licenseProduct);
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [lifecycleModels, setLifecycleModels] = useState<LifecycleModelDTO[]>(
    [],
  );
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorOptions: SearchableSelectOption[] = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: vendor.id,
        label: `${vendor.name} (${vendor.code})`,
      })),
    [vendors],
  );

  const lifecycleModelOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...lifecycleModels.map((model) => ({
        value: model.id,
        label: model.name,
      })),
    ],
    [lifecycleModels],
  );

  const form = useForm<LicenseProductFormValues>({
    resolver: zodResolver(CreateLicenseProductSchema),
    defaultValues: {
      name: licenseProduct?.name ?? "",
      code: licenseProduct?.code ?? "",
      vendorId: licenseProduct?.vendorId ?? "",
      metricType: licenseProduct?.metricType ?? LicenseMetricType.PER_USER,
      description: licenseProduct?.description ?? "",
      lifecycleModelId: licenseProduct?.lifecycleModelId ?? null,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: licenseProduct?.name ?? "",
      code: licenseProduct?.code ?? "",
      vendorId: licenseProduct?.vendorId ?? "",
      metricType: licenseProduct?.metricType ?? LicenseMetricType.PER_USER,
      description: licenseProduct?.description ?? "",
      lifecycleModelId: licenseProduct?.lifecycleModelId ?? null,
    });
  }, [licenseProduct, form, open]);

  useEffect(() => {
    if (!open) return;

    async function loadReferenceData() {
      setLoadingRefs(true);
      try {
        const [vendorsResult, lifecycleResult] = await Promise.all([
          listVendorsAction(),
          listLifecycleModelsAction(),
        ]);

        if (vendorsResult.success) {
          setVendors(vendorsResult.data);
        } else {
          toast.error(vendorsResult.error);
        }

        if (lifecycleResult.success) {
          setLifecycleModels(lifecycleResult.data);
        } else {
          toast.error(lifecycleResult.error);
        }
      } catch (_error) {
        toast.error("Failed to load reference data");
      } finally {
        setLoadingRefs(false);
      }
    }

    void loadReferenceData();
  }, [open]);

  const handleSubmit = async (data: LicenseProductFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateLicenseProductDTO = {
        name: data.name.trim(),
        code: data.code?.trim() ? data.code.trim().toUpperCase() : undefined,
        vendorId: data.vendorId,
        metricType: data.metricType,
        description: data.description?.trim() || null,
        lifecycleModelId: data.lifecycleModelId || null,
      };

      const result = isEditing
        ? await updateLicenseProduct(licenseProduct!.id, payload)
        : await createLicenseProduct(payload);

      if (result.success) {
        toast.success(
          isEditing
            ? "License product updated successfully"
            : "License product created successfully",
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing
          ? "Failed to update license product"
          : "Failed to create license product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit License Product" : "New License Product"}
          </DialogTitle>
          <DialogDescription>
            Define a licensable product, metric type, and vendor association.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Microsoft 365 E5"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Product name shown across licensing workflows
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
                        placeholder="LIC-0001"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Optional unique code; generated if left blank
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vendor <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={vendorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select vendor..."
                        searchPlaceholder="Search vendors..."
                        emptyMessage="No vendors found"
                        disabled={isSubmitting || loadingRefs}
                      />
                    </FormControl>
                    <FormDescription>
                      Software vendor or publisher
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metricType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Metric Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metricTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How allocations are measured for this product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes about licensing terms or scope"
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lifecycleModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lifecycle Model</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={lifecycleModelOptions}
                      value={field.value ?? NONE_OPTION_VALUE}
                      onValueChange={(value) =>
                        field.onChange(
                          value === NONE_OPTION_VALUE ? null : value,
                        )
                      }
                      placeholder="Select lifecycle model..."
                      searchPlaceholder="Search lifecycle models..."
                      emptyMessage="No lifecycle models found"
                      disabled={isSubmitting || loadingRefs}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional lifecycle state machine for this product
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save changes"
                    : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
