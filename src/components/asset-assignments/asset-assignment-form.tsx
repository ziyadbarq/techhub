/**
 * Asset Assignment Form Component
 */

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import {
  createAssetAssignmentAction,
  updateAssetAssignmentAction,
} from "@/interface-adapters/controllers/asset-assignment.controller";
import {
  CreateAssetAssignmentSchema,
  type CreateAssetAssignmentDTO,
} from "@/interface-adapters/dtos/generated/asset-assignment.dto";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";

interface AssetAssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assetAssignment?: AssetAssignmentDTO | null;
}

type AssetAssignmentFormValues = z.input<typeof CreateAssetAssignmentSchema>;

export function AssetAssignmentForm({
  open,
  onOpenChange,
  onSuccess,
  assetAssignment,
}: AssetAssignmentFormProps) {
  const isEditing = !!assetAssignment;

  // Entity lists for dropdowns
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrganizationUnitDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [configItems, setConfigItems] = useState<ConfigurationItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Track previous assignee type to detect changes
  const previousAssigneeTypeRef = useRef<string | null>(null);

  // Memoized options for searchable dropdowns
  const assetOptions: SearchableSelectOption[] = useMemo(
    () =>
      assets.map((asset) => ({
        value: asset.id,
        label: `${asset.assetTag}${asset.serialNumber ? ` (${asset.serialNumber})` : ""}`,
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

  const locationOptions: SearchableSelectOption[] = useMemo(
    () =>
      locations.map((loc) => ({
        value: loc.id,
        label: `${loc.name} (${loc.code})`,
      })),
    [locations],
  );

  const configItemOptions: SearchableSelectOption[] = useMemo(
    () =>
      configItems.map((ci) => ({
        value: ci.id,
        label: ci.name,
      })),
    [configItems],
  );

  // Load entity lists when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        assetsResult,
        personsResult,
        orgUnitsResult,
        locationsResult,
        configItemsResult,
      ] = await Promise.all([
        listAssetsAction(),
        listPersonsAction(),
        listOrganizationUnitsAction(),
        listLocationsAction(),
        listConfigurationItemsAction(),
      ]);

      if (assetsResult.success) {
        setAssets(assetsResult.data);
      }
      if (personsResult.success) {
        setPersons(personsResult.data);
      }
      if (orgUnitsResult.success) {
        setOrgUnits(orgUnitsResult.data);
      }
      if (locationsResult.success) {
        setLocations(locationsResult.data);
      }
      if (configItemsResult.success) {
        setConfigItems(configItemsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<
    AssetAssignmentFormValues,
    undefined,
    CreateAssetAssignmentDTO
  >({
    resolver: zodResolver(CreateAssetAssignmentSchema),
    defaultValues: {
      assetId: assetAssignment?.assetId ?? "",
      assigneeType:
        (assetAssignment?.assigneeType as
          | "PERSON"
          | "ORG_UNIT"
          | "LOCATION"
          | "CI") ?? "PERSON",
      assigneeId: assetAssignment?.assigneeId ?? "",
      startDate: assetAssignment?.startDate
        ? new Date(assetAssignment.startDate)
        : new Date(),
      endDate: assetAssignment?.endDate
        ? new Date(assetAssignment.endDate)
        : null,
      isPrimary: assetAssignment?.isPrimary ?? false,
      note: assetAssignment?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      assetId: assetAssignment?.assetId ?? "",
      assigneeType:
        (assetAssignment?.assigneeType as
          | "PERSON"
          | "ORG_UNIT"
          | "LOCATION"
          | "CI") ?? "PERSON",
      assigneeId: assetAssignment?.assigneeId ?? "",
      startDate: assetAssignment?.startDate
        ? new Date(assetAssignment.startDate)
        : new Date(),
      endDate: assetAssignment?.endDate
        ? new Date(assetAssignment.endDate)
        : null,
      isPrimary: assetAssignment?.isPrimary ?? false,
      note: assetAssignment?.note ?? "",
    });
    // Initialize the ref with current assignee type
    previousAssigneeTypeRef.current = assetAssignment?.assigneeType ?? "PERSON";
  }, [assetAssignment, form]);

  // Watch assignee type and clear assigneeId when it changes
  const assigneeType = form.watch("assigneeType");
  useEffect(() => {
    if (
      previousAssigneeTypeRef.current !== null &&
      previousAssigneeTypeRef.current !== assigneeType
    ) {
      form.setValue("assigneeId", "");
    }
    previousAssigneeTypeRef.current = assigneeType;
  }, [assigneeType, form]);

  // Get assignee options based on current type
  const getAssigneeOptions = (): SearchableSelectOption[] => {
    switch (assigneeType) {
      case "PERSON":
        return personOptions;
      case "ORG_UNIT":
        return orgUnitOptions;
      case "LOCATION":
        return locationOptions;
      case "CI":
        return configItemOptions;
      default:
        return [];
    }
  };

  const getAssigneePlaceholder = (): string => {
    switch (assigneeType) {
      case "PERSON":
        return "Select a person...";
      case "ORG_UNIT":
        return "Select an organization unit...";
      case "LOCATION":
        return "Select a location...";
      case "CI":
        return "Select a configuration item...";
      default:
        return "Select assignee...";
    }
  };

  const onSubmit = async (data: CreateAssetAssignmentDTO) => {
    try {
      const result = isEditing
        ? await updateAssetAssignmentAction(assetAssignment.id, data)
        : await createAssetAssignmentAction(data);

      if (result.success) {
        toast.success(
          isEditing ? "Asset assignment updated!" : "Asset assignment created!",
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
          ? "Failed to update asset assignment"
          : "Failed to create asset assignment",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Asset Assignment" : "Create Asset Assignment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the asset assignment information."
              : "Assign an asset to a person, organization unit, location, or configuration item."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset *</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={assetOptions}
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      placeholder="Select an asset..."
                      searchPlaceholder="Search assets..."
                      disabled={loading || isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing
                      ? "Asset cannot be changed after creation"
                      : "Select the asset to assign"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERSON">Person</SelectItem>
                      <SelectItem value="ORG_UNIT">
                        Organization Unit
                      </SelectItem>
                      <SelectItem value="LOCATION">Location</SelectItem>
                      <SelectItem value="CI">Configuration Item</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of entity this asset is assigned to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee *</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={getAssigneeOptions()}
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      placeholder={getAssigneePlaceholder()}
                      searchPlaceholder="Search..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the entity this asset is assigned to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>When assignment starts</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>When assignment ends</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary Assignment</FormLabel>
                    <FormDescription>
                      Mark as the primary assignment for this asset
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this assignment..."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this assignment
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
      </DialogContent>
    </Dialog>
  );
}
