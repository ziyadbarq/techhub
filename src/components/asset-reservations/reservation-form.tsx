/**
 * Reservation Form Component
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { z } from "zod";
import {
  createReservationAction,
  listUnreservedAssetsAction,
} from "@/interface-adapters/controllers/asset-reservation.controller";
import { CreateReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listAssetModelsByCategoryAction } from "@/interface-adapters/controllers/asset-model.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ReservationFormValues = z.input<typeof CreateReservationDTO>;
type ReservationFormOutput = z.output<typeof CreateReservationDTO>;

export function ReservationForm({
  open,
  onOpenChange,
  onSuccess,
}: ReservationFormProps) {
  const [categories, setCategories] = useState<AssetCategoryDTO[]>([]);
  const [models, setModels] = useState<AssetModelDTO[]>([]);
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrganizationUnitDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Memoized options for searchable selects
  const categoryOptions: SearchableSelectOption[] = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: `${category.name} (${category.code})`,
      })),
    [categories],
  );

  const modelOptions: SearchableSelectOption[] = useMemo(
    () =>
      models.map((model) => ({
        value: model.id,
        label: `${model.name} (${model.code})`,
      })),
    [models],
  );

  const assetOptions: SearchableSelectOption[] = useMemo(
    () =>
      assets.map((asset) => ({
        value: asset.id,
        label: `${asset.assetTag} - ${asset.serialNumber || "No S/N"}`,
      })),
    [assets],
  );

  const personOptions: SearchableSelectOption[] = useMemo(
    () =>
      persons.map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName} (${person.email})`,
      })),
    [persons],
  );

  const orgUnitOptions: SearchableSelectOption[] = useMemo(
    () =>
      orgUnits.map((unit) => ({
        value: unit.id,
        label: `${unit.name} (${unit.code})`,
      })),
    [orgUnits],
  );

  const defaultStartDate = new Date();
  const defaultEndDate = new Date(defaultStartDate);
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);

  const form = useForm<ReservationFormValues, undefined, ReservationFormOutput>(
    {
      resolver: zodResolver(CreateReservationDTO),
      defaultValues: {
        assetId: "",
        reservedForPersonId: undefined,
        reservedForOrgUnitId: undefined,
        // reservedById removed - server gets from session
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        purpose: "",
        notes: "",
      },
    },
  );

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesResult, personsResult, orgUnitsResult] =
        await Promise.all([
          listAssetCategoriesAction(),
          listPersonsAction(),
          listOrganizationUnitsAction(),
        ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      if (personsResult.success) {
        setPersons(personsResult.data);
      }

      if (orgUnitsResult.success) {
        setOrgUnits(orgUnitsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  // Load models when category changes
  const loadModelsByCategory = async (categoryId: string) => {
    if (!categoryId) {
      setModels([]);
      setAssets([]);
      setSelectedModelId("");
      form.setValue("assetId", "");
      return;
    }

    setLoadingModels(true);
    try {
      const result = await listAssetModelsByCategoryAction(categoryId);
      if (result.success) {
        setModels(result.data);
      } else {
        toast.error("Failed to load asset models");
        setModels([]);
      }
    } catch (_error) {
      toast.error("Failed to load asset models");
      setModels([]);
    } finally {
      setLoadingModels(false);
    }

    // Clear downstream selections
    setAssets([]);
    setSelectedModelId("");
    form.setValue("assetId", "");
  };

  // Load assets when model changes
  const loadAssetsByModel = async (modelId: string) => {
    if (!modelId) {
      setAssets([]);
      form.setValue("assetId", "");
      return;
    }

    setLoadingAssets(true);
    try {
      const result = await listUnreservedAssetsAction(modelId);
      if (result.success) {
        setAssets(result.data);
      } else {
        toast.error("Failed to load assets");
        setAssets([]);
      }
    } catch (_error) {
      toast.error("Failed to load assets");
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }

    // Clear asset selection
    form.setValue("assetId", "");
  };

  const onSubmit = async (data: ReservationFormOutput) => {
    try {
      const result = await createReservationAction(data);

      if (result.success) {
        toast.success("Reservation created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create reservation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>
            Reserve an asset for future use.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Asset Category */}
            <div>
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Asset Category
              </label>
              <SearchableSelect
                options={categoryOptions}
                value={selectedCategoryId}
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  loadModelsByCategory(value);
                }}
                placeholder="Select a category"
                searchPlaceholder="Search categories..."
                disabled={loading}
              />
              <p className="text-muted-foreground mt-2 text-sm">
                Select the asset category first
              </p>
            </div>

            {/* Asset Model */}
            <div>
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Asset Model
              </label>
              <SearchableSelect
                options={modelOptions}
                value={selectedModelId}
                onValueChange={(value) => {
                  setSelectedModelId(value);
                  loadAssetsByModel(value);
                }}
                placeholder={
                  selectedCategoryId
                    ? "Select a model"
                    : "Select category first"
                }
                searchPlaceholder="Search models..."
                disabled={loading || loadingModels || !selectedCategoryId}
              />
              <p className="text-muted-foreground mt-2 text-sm">
                {selectedCategoryId
                  ? "Select the asset model"
                  : "Category required"}
              </p>
            </div>

            {/* Asset */}
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={assetOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={
                        selectedModelId
                          ? "Select an asset"
                          : "Select model first"
                      }
                      searchPlaceholder="Search assets..."
                      disabled={loading || loadingAssets || !selectedModelId}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedModelId
                      ? "The asset to reserve"
                      : "Model required"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reserved For Person */}
            <FormField
              control={form.control}
              name="reservedForPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserved For (Person)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "__none__", label: "No Person" },
                        ...personOptions,
                      ]}
                      value={field.value ?? "__none__"}
                      onValueChange={(value) => {
                        field.onChange(
                          value === "__none__" ? undefined : value,
                        );
                        // Clear form-level errors when changing selection
                        form.clearErrors("reservedForPersonId");
                        form.clearErrors("reservedForOrgUnitId");
                      }}
                      placeholder="Select a person"
                      searchPlaceholder="Search persons..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>Who is reserving the asset</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reserved For Org Unit */}
            <FormField
              control={form.control}
              name="reservedForOrgUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserved For (Org Unit)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "__none__", label: "No Org Unit" },
                        ...orgUnitOptions,
                      ]}
                      value={field.value ?? "__none__"}
                      onValueChange={(value) => {
                        field.onChange(
                          value === "__none__" ? undefined : value,
                        );
                        // Clear form-level errors when changing selection
                        form.clearErrors("reservedForPersonId");
                        form.clearErrors("reservedForOrgUnitId");
                      }}
                      placeholder="Select an org unit"
                      searchPlaceholder="Search org units..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    The organizational unit making the reservation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : typeof field.value === "string"
                            ? field.value
                            : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>When the reservation starts</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : typeof field.value === "string"
                            ? field.value
                            : ""
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null,
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>When the reservation ends</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Demo, Testing, Training"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Purpose of the reservation</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      className="resize-none"
                      {...field}
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
                {form.formState.isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
