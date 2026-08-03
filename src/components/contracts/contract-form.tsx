"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  createContract,
  updateContract,
} from "@/interface-adapters/controllers/contract.controller";
import { listContractTypes } from "@/interface-adapters/controllers/contract-type.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import {
  type CreateContractDTO,
  type UpdateContractDTO,
} from "@/interface-adapters/dtos/generated/contract.dto";
import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";

type ContractFormValues = {
  contractTypeId: string;
  vendorId: string;
  name: string;
  contractNumber: string;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  renewalTerms: string;
  totalValue?: number;
  currency: string;
  note: string;
};

interface ContractFormProps {
  contract?: ContractDTO;
}

export function ContractForm({ contract }: ContractFormProps) {
  const router = useRouter();
  const isEditing = !!contract;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vendors, setVendors] = React.useState<VendorDTO[]>([]);
  const [contractTypes, setContractTypes] = React.useState<ContractTypeDTO[]>(
    [],
  );
  const [isLoadingLookups, setIsLoadingLookups] = React.useState(true);

  const form = useForm<ContractFormValues>({
    defaultValues: {
      contractTypeId: contract?.contractTypeId ?? "",
      vendorId: contract?.vendorId ?? "",
      name: contract?.name ?? "",
      contractNumber: contract?.contractNumber ?? "",
      startDate: new Date(contract?.startDate ?? new Date()),
      endDate: contract?.endDate ? new Date(contract.endDate) : undefined,
      autoRenew: contract?.autoRenew ?? false,
      renewalTerms: contract?.renewalTerms ?? "",
      totalValue: contract?.totalValue ?? undefined,
      currency: contract?.currency ?? "SAR",
      note: contract?.note ?? "",
    },
  });

  React.useEffect(() => {
    const loadLookups = async () => {
      setIsLoadingLookups(true);
      try {
        const [vendorsResult, contractTypesResult] = await Promise.all([
          listVendorsAction(),
          listContractTypes({ activeOnly: true }),
        ]);

        if (vendorsResult.success) {
          setVendors(vendorsResult.data);
        } else {
          toast.error(vendorsResult.error);
        }

        if (contractTypesResult.success) {
          setContractTypes(contractTypesResult.data);
        } else {
          toast.error(contractTypesResult.error);
        }
      } finally {
        setIsLoadingLookups(false);
      }
    };

    void loadLookups();
  }, []);

  const onSubmit = async (values: ContractFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        contractTypeId: values.contractTypeId,
        vendorId: values.vendorId,
        name: values.name,
        contractNumber: values.contractNumber || null,
        startDate: values.startDate,
        endDate: values.endDate ?? null,
        autoRenew: values.autoRenew,
        renewalTerms: values.renewalTerms || null,
        totalValue: values.totalValue ?? null,
        currency: values.currency || null,
        note: values.note || null,
      } satisfies CreateContractDTO | UpdateContractDTO;

      const result = isEditing
        ? await updateContract(contract.id, payload as UpdateContractDTO)
        : await createContract(payload as CreateContractDTO);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Contract ${isEditing ? "updated" : "created"} successfully`,
      );
      router.push(`/contracts/${result.data.id}`);
      router.refresh();
    } catch (_error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} contract`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., ABSHER API Support Contract"
                    {...field}
                  />
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
                  <Input placeholder="e.g., CNT-2026-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Type *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingLookups}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingLookups}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    placeholder="Select start date"
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
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                    placeholder="Select end date"
                    clearable
                  />
                </FormControl>
                <FormDescription>
                  Leave empty for open-ended or renewable contracts.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 125000"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
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
                  <Input placeholder="e.g., SAR" maxLength={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="renewalTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Renewal Terms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe renewal terms or notice period"
                  className="min-h-24 resize-y"
                  {...field}
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
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes"
                  className="min-h-24 resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="autoRenew"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Auto Renew</FormLabel>
                <FormDescription>
                  Enable if the contract renews automatically.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(contract ? `/contracts/${contract.id}` : "/contracts")
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingLookups}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Contract"
                : "Create Contract"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
