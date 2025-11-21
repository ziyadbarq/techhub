/**
 * Disposal Form Component
 */

"use client";

import { useEffect, useState } from "react";
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
import type { z } from "zod";
import { createAssetDisposalAction } from "@/interface-adapters/controllers/asset-disposal.controller";
import { CreateAssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { Checkbox } from "@/components/ui/checkbox";

interface DisposalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type DisposalFormValues = z.input<typeof CreateAssetDisposalDTO>;
type DisposalFormOutput = z.output<typeof CreateAssetDisposalDTO>;

export function DisposalForm({
  open,
  onOpenChange,
  onSuccess,
}: DisposalFormProps) {
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<DisposalFormValues, undefined, DisposalFormOutput>({
    resolver: zodResolver(CreateAssetDisposalDTO),
    defaultValues: {
      assetId: "",
      disposalType: "DESTROY",
      disposalMethod: "",
      reason: "",
      estimatedValue: undefined,
      approverIds: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsResult, personsResult] = await Promise.all([
        listAssetsAction(),
        listPersonsAction(),
      ]);

      if (assetsResult.success) {
        setAssets(assetsResult.data);
      }

      if (personsResult.success) {
        setPersons(personsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproverToggle = (approverId: string) => {
    setSelectedApprovers((prev) => {
      const updated = prev.includes(approverId)
        ? prev.filter((id) => id !== approverId)
        : [...prev, approverId];
      form.setValue("approverIds", updated);
      return updated;
    });
  };

  const onSubmit = async (data: DisposalFormOutput) => {
    try {
      const result = await createAssetDisposalAction(data);

      if (result.success) {
        toast.success("Disposal request created!");
        form.reset();
        setSelectedApprovers([]);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create disposal request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Disposal Request</DialogTitle>
          <DialogDescription>
            Submit an asset for disposal approval.
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.assetTag} - {asset.serialNumber || "No S/N"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The asset to be disposed of</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disposal Type */}
            <FormField
              control={form.control}
              name="disposalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disposal Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SELL">Sell</SelectItem>
                      <SelectItem value="DONATE">Donate</SelectItem>
                      <SelectItem value="RECYCLE">Recycle</SelectItem>
                      <SelectItem value="DESTROY">Destroy</SelectItem>
                      <SelectItem value="RETURN_TO_VENDOR">
                        Return to Vendor
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How the asset will be disposed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disposal Method */}
            <FormField
              control={form.control}
              name="disposalMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disposal Method</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Certified e-waste recycler, Auction, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific method or vendor for disposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Disposal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this asset needs to be disposed..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Business justification for disposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Value */}
            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
                    Estimated salvage or sale value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Approvers */}
            <FormField
              control={form.control}
              name="approverIds"
              render={() => (
                <FormItem>
                  <FormLabel>Approvers (Select at least one)</FormLabel>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-4">
                    {persons.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`approver-${person.id}`}
                          checked={selectedApprovers.includes(person.id)}
                          onCheckedChange={() =>
                            handleApproverToggle(person.id)
                          }
                        />
                        <label
                          htmlFor={`approver-${person.id}`}
                          className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {person.firstName} {person.lastName} ({person.email})
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Select users who need to approve this disposal
                  </FormDescription>
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
                {form.formState.isSubmitting ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
