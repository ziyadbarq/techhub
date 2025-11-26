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
import { createReservationAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { CreateReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";

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
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrganizationUnitDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized options for searchable selects
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

  const form = useForm<ReservationFormValues, undefined, ReservationFormOutput>(
    {
      resolver: zodResolver(CreateReservationDTO),
      defaultValues: {
        assetId: "",
        reservedByPersonId: undefined,
        reservedByOrgUnitId: undefined,
        startDate: new Date(),
        endDate: new Date(),
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
      const [assetsResult, personsResult, orgUnitsResult] = await Promise.all([
        listAssetsAction(),
        listPersonsAction(),
        listOrganizationUnitsAction(),
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
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
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
                      placeholder="Select an asset"
                      searchPlaceholder="Search assets..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>The asset to reserve</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reserved By Person */}
            <FormField
              control={form.control}
              name="reservedByPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserved By (Person)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "__none__", label: "No Person" },
                        ...personOptions,
                      ]}
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
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

            {/* Reserved By Org Unit */}
            <FormField
              control={form.control}
              name="reservedByOrgUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserved By (Org Unit)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "__none__", label: "No Org Unit" },
                        ...orgUnitOptions,
                      ]}
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
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
