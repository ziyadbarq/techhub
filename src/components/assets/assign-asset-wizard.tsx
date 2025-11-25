/**
 * Assign Asset to Employee Wizard
 * Multi-step wizard for assigning assets to employees
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { assignAssetToEmployeeAction } from "@/interface-adapters/controllers/asset-workflow.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";

interface AssignAssetWizardProps {
  assetId: string;
  assetTag: string;
  currentStockLocationId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AssignAssetSchema = z.object({
  personId: z.string().min(1, "Please select an employee"),
  stockLocationFromId: z.string().nullable(),
  note: z.string().optional(),
});

type AssignAssetFormValues = z.infer<typeof AssignAssetSchema>;

const NONE_OPTION_VALUE = "__none__";

export function AssignAssetWizard({
  assetId,
  assetTag,
  currentStockLocationId,
  open,
  onOpenChange,
  onSuccess,
}: AssignAssetWizardProps) {
  const [step, setStep] = useState(1);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Memoized options for searchable dropdowns
  const personOptions: SearchableSelectOption[] = useMemo(
    () =>
      persons.map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName}${p.employeeId ? ` (${p.employeeId})` : ""}`,
      })),
    [persons],
  );

  const stockLocationOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "No Location" },
      ...stockLocations.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.code})`,
      })),
    ],
    [stockLocations],
  );

  const form = useForm<AssignAssetFormValues>({
    resolver: zodResolver(AssignAssetSchema),
    defaultValues: {
      personId: "",
      stockLocationFromId: currentStockLocationId ?? null,
      note: "",
    },
  });

  // Load persons and stock locations when dialog opens
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [personsResult, locationsResult] = await Promise.all([
          listPersonsAction(),
          listStockLocationsAction(),
        ]);

        if (personsResult.success) {
          setPersons(personsResult.data);
        } else {
          toast.error("Failed to load employees");
        }

        if (locationsResult.success) {
          setStockLocations(locationsResult.data);
        } else {
          toast.error("Failed to load stock locations");
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      form.reset({
        personId: "",
        stockLocationFromId: currentStockLocationId ?? null,
        note: "",
      });
    }
  }, [open, form, currentStockLocationId]);

  const onSubmit = async (data: AssignAssetFormValues) => {
    try {
      const result = await assignAssetToEmployeeAction({
        assetId,
        personId: data.personId,
        stockLocationFromId: data.stockLocationFromId,
        note: data.note,
      });

      if (result.success) {
        toast.success("Asset assigned successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Failed to assign asset");
      }
    } catch (_error) {
      toast.error("Failed to assign asset");
    }
  };

  const handleNext = async () => {
    // Validate current step before moving forward
    const isValid = await form.trigger(["personId"]);
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const getSelectedPerson = () => {
    const personId = form.watch("personId");
    return persons.find((p) => p.id === personId);
  };

  const getSelectedLocation = () => {
    const locationId = form.watch("stockLocationFromId");
    if (!locationId) return null;
    return stockLocations.find((l) => l.id === locationId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Asset to Employee</DialogTitle>
          <DialogDescription>
            Asset Tag: <span className="font-semibold">{assetTag}</span> (Step{" "}
            {step} of 2)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-muted bg-muted/50 rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-medium">
                    Step 1: Select Employee
                  </h3>

                  {/* Employee Selection */}
                  <FormField
                    control={form.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Employee <span className="text-destructive">*</span>
                        </FormLabel>
                        <SearchableSelect
                          options={personOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select an employee..."
                          searchPlaceholder="Search employees..."
                          emptyMessage="No employees found"
                          disabled={loadingData}
                        />
                        <FormDescription>
                          Choose the employee to assign this asset to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stock Location From (Optional) */}
                  <FormField
                    control={form.control}
                    name="stockLocationFromId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>From Stock Location</FormLabel>
                        <SearchableSelect
                          options={stockLocationOptions}
                          value={field.value ?? NONE_OPTION_VALUE}
                          onValueChange={(value) =>
                            field.onChange(
                              value === NONE_OPTION_VALUE ? null : value,
                            )
                          }
                          placeholder="Select source location..."
                          searchPlaceholder="Search locations..."
                          emptyMessage="No locations found"
                          disabled={loadingData}
                        />
                        <FormDescription>
                          Current location of the asset (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="border-muted bg-muted/50 rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-medium">
                    Step 2: Confirm Assignment
                  </h3>

                  {/* Assignment Summary */}
                  <div className="bg-background mb-4 space-y-2 rounded-md p-3 text-sm">
                    <div>
                      <span className="font-medium">Asset:</span> {assetTag}
                    </div>
                    <div>
                      <span className="font-medium">Assign to:</span>{" "}
                      {getSelectedPerson()
                        ? `${getSelectedPerson()?.firstName} ${getSelectedPerson()?.lastName}`
                        : "Not selected"}
                    </div>
                    <div>
                      <span className="font-medium">From Location:</span>{" "}
                      {getSelectedLocation()
                        ? getSelectedLocation()?.name
                        : "None"}
                    </div>
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes about this assignment..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional information about this assignment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loadingData}
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                >
                  Next
                </Button>
              )}
              {step === 2 && (
                <>
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                  >
                    {form.formState.isSubmitting
                      ? "Assigning..."
                      : "Assign Asset"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
