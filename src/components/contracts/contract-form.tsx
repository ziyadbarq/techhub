/**
 * Contract Form Component
 * Create and edit contract records.
 */

"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createContract } from "@/interface-adapters/controllers/contract.controller";
import {
  CreateContractSchema,
  type CreateContractDTO,
} from "@/interface-adapters/dtos/generated/contract.dto";
import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";

interface ContractFormProps {
  contractTypes: ContractTypeDTO[];
  vendors: VendorDTO[];
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ContractForm({ contractTypes, vendors }: ContractFormProps) {
  const router = useRouter();

  const form = useForm<CreateContractDTO>({
    resolver: zodResolver(CreateContractSchema) as Resolver<CreateContractDTO>,
    defaultValues: {
      contractTypeId: "",
      vendorId: "",
      name: "",
      contractNumber: "",
      startDate: new Date(),
      endDate: null,
      autoRenew: false,
      renewalTerms: "",
      totalValue: null,
      currency: "SAR",
      note: "",
    },
  });

  const contractTypeOptions = contractTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  const onSubmit = async (data: CreateContractDTO) => {
    const result = await createContract(data);

    if (result.success) {
      toast.success("Contract created");
      router.push("/contracts");
      router.refresh();
      return;
    }

    toast.error(result.error);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push("/contracts")}
          aria-label="Back to contracts"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Contract</h1>
          <p className="text-muted-foreground">
            Create a vendor contract or agreement.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contractTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contract Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={contractTypeOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select contract type"
                      searchPlaceholder="Search contract types..."
                      emptyMessage="No contract types found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Select vendor"
                      searchPlaceholder="Search vendors..."
                      emptyMessage="No vendors found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Master services agreement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CTR-2026-001"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Start Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(event) =>
                        field.onChange(new Date(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          ? toDateInputValue(field.value)
                          : ""
                      }
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? new Date(event.target.value)
                            : null,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="totalValue"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Total Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : null,
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
                  <FormControl>
                    <Input
                      maxLength={3}
                      placeholder="SAR"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="autoRenew"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Auto Renew</FormLabel>
                  <FormDescription>
                    Contract renews automatically when it reaches the end date.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="renewalTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Renewal Terms</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Renewal notice period, renewal duration, or other terms..."
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
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Additional notes..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/contracts")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
