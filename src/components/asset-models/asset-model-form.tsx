/**
 * Asset Model Form Component
 */

"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
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
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import {
  createAssetModelAction,
  updateAssetModelAction,
} from "@/interface-adapters/controllers/asset-model.controller";
import {
  CreateAssetModelSchema,
  type CreateAssetModelDTO,
} from "@/interface-adapters/dtos/generated/asset-model.dto";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";

interface AssetModelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assetModel?: AssetModelDTO | null;
}

type AssetModelFormValues = z.input<typeof CreateAssetModelSchema>;

export function AssetModelForm({
  open,
  onOpenChange,
  onSuccess,
  assetModel,
}: AssetModelFormProps) {
  const isEditing = !!assetModel;
  const [categories, setCategories] = useState<AssetCategoryDTO[]>([]);
  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<AssetModelFormValues, undefined, CreateAssetModelDTO>({
    resolver: zodResolver(CreateAssetModelSchema),
    defaultValues: {
      name: assetModel?.name ?? "",
      code: assetModel?.code ?? "",
      description: assetModel?.description ?? "",
      assetCategoryId: assetModel?.assetCategoryId ?? "",
      vendorId: assetModel?.vendorId ?? "",
      defaultWarrantyMonths: assetModel?.defaultWarrantyMonths ?? undefined,
    },
  });

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open && !loading) {
      const timer = setTimeout(() => {
        const firstField =
          document.querySelector<HTMLInputElement>('input[name="name"]');
        if (firstField) {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, loading]);

  // Load categories and vendors when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesResult, vendorsResult] = await Promise.all([
        listAssetCategoriesAction(),
        listVendorsAction(),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      if (vendorsResult.success) {
        setVendors(vendorsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.reset({
      name: assetModel?.name ?? "",
      code: assetModel?.code ?? "",
      description: assetModel?.description ?? "",
      assetCategoryId: assetModel?.assetCategoryId ?? "",
      vendorId: assetModel?.vendorId ?? "",
      defaultWarrantyMonths: assetModel?.defaultWarrantyMonths ?? undefined,
    });
  }, [assetModel, form]);

  const onSubmit = async (data: CreateAssetModelDTO) => {
    try {
      const result = isEditing
        ? await updateAssetModelAction(assetModel.id, data)
        : await createAssetModelAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Asset model updated!" : "Asset model created!",
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
          ? "Failed to update asset model"
          : "Failed to create asset model",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {isEditing ? "Edit Asset Model:" : "Create Asset Model:"}
              </span>
              <InlineEditableField
                name="code"
                placeholder={isEditing ? "Code" : "Auto-generated"}
                transform="uppercase"
                optional={!isEditing}
              />
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the asset model information."
                : "Add a new asset model to track specific equipment types."}
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
                    <Input
                      placeholder="HP LaserJet Pro 400"
                      tabIndex={1}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Display name for this asset model
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assetCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                    The category this model belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The manufacturer or supplier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultWarrantyMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Warranty (Months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="12"
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
                    Default warranty period in months (0-120, max 10 years)
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
                      placeholder="Professional color laser printer with duplex printing"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of this model
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
    </Dialog>
  );
}
