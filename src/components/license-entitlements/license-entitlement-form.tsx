/**
 * License Entitlement Form Component
 */

"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
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
import type { LicenseEntitlementDTO } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import {
  createLicenseEntitlement,
  updateLicenseEntitlement,
} from "@/interface-adapters/controllers/license-entitlement.controller";
import { CreateLicenseEntitlementSchema } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import { listLicenseProducts } from "@/interface-adapters/controllers/license-product.controller";
import { listContracts } from "@/interface-adapters/controllers/contract.controller";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";

interface LicenseEntitlementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entitlement?: LicenseEntitlementDTO | null;
}

type EntitlementFormValues = z.input<typeof CreateLicenseEntitlementSchema>;

const NONE_OPTION_VALUE = "__none__";

export function LicenseEntitlementForm({
  open,
  onOpenChange,
  onSuccess,
  entitlement,
}: LicenseEntitlementFormProps) {
  const isEditing = !!entitlement;
  const [licenseProducts, setLicenseProducts] = useState<LicenseProductDTO[]>(
    [],
  );
  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Memoized options for searchable dropdowns
  const productOptions: SearchableSelectOption[] = useMemo(
    () =>
      licenseProducts.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.code})`,
      })),
    [licenseProducts],
  );

  const contractOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...contracts.map((c) => ({
        value: c.id,
        label: `${c.contractNumber} - ${c.name}`,
      })),
    ],
    [contracts],
  );

  const form = useForm<EntitlementFormValues>({
    resolver: zodResolver(CreateLicenseEntitlementSchema),
    defaultValues: {
      licenseProductId: entitlement?.licenseProductId ?? "",
      contractId: entitlement?.contractId ?? null,
      purchasedQuantity: entitlement?.purchasedQuantity ?? 1,
      effectiveStart: entitlement?.effectiveStart
        ? new Date(entitlement.effectiveStart)
        : new Date(),
      effectiveEnd: entitlement?.effectiveEnd
        ? new Date(entitlement.effectiveEnd)
        : null,
      allowedScope: entitlement?.allowedScope ?? null,
      note: entitlement?.note ?? "",
      unitCost: entitlement?.unitCost ?? null,
      currency: entitlement?.currency ?? "SAR",
    },
  });

  // Reset form when entitlement changes
  useEffect(() => {
    if (open) {
      form.reset({
        licenseProductId: entitlement?.licenseProductId ?? "",
        contractId: entitlement?.contractId ?? null,
        purchasedQuantity: entitlement?.purchasedQuantity ?? 1,
        effectiveStart: entitlement?.effectiveStart
          ? new Date(entitlement.effectiveStart)
          : new Date(),
        effectiveEnd: entitlement?.effectiveEnd
          ? new Date(entitlement.effectiveEnd)
          : null,
        allowedScope: entitlement?.allowedScope ?? null,
        note: entitlement?.note ?? "",
        unitCost: entitlement?.unitCost ?? null,
        currency: entitlement?.currency ?? "SAR",
      });
    }
  }, [entitlement, open, form]);

  // Load reference data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsResult, contractsResult] = await Promise.all([
          listLicenseProducts(),
          listContracts(),
        ]);

        if (productsResult.success) {
          setLicenseProducts(productsResult.data);
        }
        if (contractsResult.success) {
          setContracts(contractsResult.data);
        }
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      void loadData();
    }
  }, [open]);

  const onSubmit = async (data: EntitlementFormValues) => {
    setSubmitting(true);
    try {
      // Ensure dates are Date objects
      const effectiveStart =
        data.effectiveStart instanceof Date
          ? data.effectiveStart
          : new Date(data.effectiveStart as string);
      const effectiveEnd =
        data.effectiveEnd instanceof Date
          ? data.effectiveEnd
          : data.effectiveEnd
            ? new Date(data.effectiveEnd as string)
            : null;

      if (isEditing && entitlement) {
        const result = await updateLicenseEntitlement({
          id: entitlement.id,
          purchasedQuantity: data.purchasedQuantity,
          effectiveStart,
          effectiveEnd,
          allowedScope: data.allowedScope,
          note: data.note,
          unitCost: data.unitCost,
          currency: data.currency,
        });

        if (result.success) {
          toast.success("License entitlement updated successfully");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createLicenseEntitlement({
          licenseProductId: data.licenseProductId,
          contractId:
            data.contractId === NONE_OPTION_VALUE ? null : data.contractId,
          purchasedQuantity: data.purchasedQuantity,
          effectiveStart,
          effectiveEnd,
          allowedScope: data.allowedScope,
          note: data.note,
          unitCost: data.unitCost,
          currency: data.currency,
        });

        if (result.success) {
          toast.success("License entitlement created successfully");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit License Entitlement" : "New License Entitlement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the license entitlement details"
              : "Add a new license entitlement to track purchased licenses"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* License Product */}
            <FormField
              control={form.control}
              name="licenseProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Product *</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={productOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a license product..."
                      disabled={loading || isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    The software product this entitlement covers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract */}
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={contractOptions}
                      value={field.value ?? NONE_OPTION_VALUE}
                      onValueChange={(val) =>
                        field.onChange(val === NONE_OPTION_VALUE ? null : val)
                      }
                      placeholder="Select a contract..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Link to a procurement contract
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="purchasedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchased Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value, 10) : 1,
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Number of licenses purchased (seats, devices, cores, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Start *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective End</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                    <FormDescription>
                      Leave empty for perpetual licenses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Cost Tracking Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Cost Tracking</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>Cost per license unit</FormDescription>
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
                        value={field.value ?? "SAR"}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes about this entitlement..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
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
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || loading}>
                {submitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Entitlement"
                    : "Create Entitlement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
