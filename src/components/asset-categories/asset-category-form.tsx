/**
 * Asset Category Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useAutoGenerateCode } from "@/hooks/use-auto-generate-code";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import {
  createAssetCategoryAction,
  updateAssetCategoryAction,
} from "@/interface-adapters/controllers/asset-category.controller";
import {
  CreateAssetCategorySchema,
  type CreateAssetCategoryDTO,
} from "@/interface-adapters/dtos/generated/asset-category.dto";

interface AssetCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assetCategory?: AssetCategoryDTO | null;
}

type AssetCategoryFormValues = z.input<typeof CreateAssetCategorySchema>;

export function AssetCategoryForm({
  open,
  onOpenChange,
  onSuccess,
  assetCategory,
}: AssetCategoryFormProps) {
  const isEditing = !!assetCategory;

  const form = useForm<
    AssetCategoryFormValues,
    undefined,
    CreateAssetCategoryDTO
  >({
    resolver: zodResolver(CreateAssetCategorySchema),
    defaultValues: {
      name: assetCategory?.name ?? "",
      code: assetCategory?.code ?? "",
      description: assetCategory?.description ?? "",
      isConsumable: assetCategory?.isConsumable ?? false,
    },
  });

  // Auto-generate code from name (like WordPress slugs)
  useAutoGenerateCode({ form, isEditing });

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const firstField =
          document.querySelector<HTMLInputElement>('input[name="name"]');
        if (firstField) {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    form.reset({
      name: assetCategory?.name ?? "",
      code: assetCategory?.code ?? "",
      description: assetCategory?.description ?? "",
      isConsumable: assetCategory?.isConsumable ?? false,
    });
  }, [assetCategory, form]);

  const onSubmit = async (data: CreateAssetCategoryDTO) => {
    try {
      const result = isEditing
        ? await updateAssetCategoryAction(assetCategory.id, data)
        : await createAssetCategoryAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Asset category updated!" : "Asset category created!",
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
          ? "Failed to update asset category"
          : "Failed to create asset category",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[525px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {isEditing ? "Edit Asset Category:" : "Create Asset Category:"}
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
                ? "Update the asset category information."
                : "Add a new asset category to classify your assets."}
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
                      <Input placeholder="Printer" tabIndex={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      Display name for this asset category
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
                        placeholder="Printing devices and equipment"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isConsumable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Consumable Category</FormLabel>
                      <FormDescription>
                        Consumable items (cables, mice, keyboards) don&apos;t
                        require individual tracking or lifecycle management
                      </FormDescription>
                    </div>
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
