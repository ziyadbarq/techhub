/**
 * Checkout Form Component
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
import { createKitCheckoutAction } from "@/interface-adapters/controllers/asset-kit-checkout.controller";
import { CreateKitCheckoutDTO } from "@/interface-adapters/dtos/generated/asset-kit-checkout.dto";
import { listAssetKitsAction } from "@/interface-adapters/controllers/asset-kit.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import type { AssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type CheckoutFormValues = z.input<typeof CreateKitCheckoutDTO>;
type CheckoutFormOutput = z.output<typeof CreateKitCheckoutDTO>;

export function CheckoutForm({
  open,
  onOpenChange,
  onSuccess,
}: CheckoutFormProps) {
  const [kits, setKits] = useState<AssetKitDTO[]>([]);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized options for searchable selects
  const kitOptions: SearchableSelectOption[] = useMemo(
    () =>
      kits.map((kit) => ({
        value: kit.id,
        label: `${kit.name} (${kit.code})`,
      })),
    [kits],
  );

  const personOptions: SearchableSelectOption[] = useMemo(
    () =>
      persons.map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName} (${person.email})`,
      })),
    [persons],
  );

  const form = useForm<CheckoutFormValues, undefined, CheckoutFormOutput>({
    resolver: zodResolver(CreateKitCheckoutDTO),
    defaultValues: {
      kitId: "",
      assigneeType: "PERSON" as const,
      assigneeId: "",
      note: "",
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
      const [kitsResult, personsResult] = await Promise.all([
        listAssetKitsAction(),
        listPersonsAction(),
      ]);

      if (kitsResult.success) {
        setKits(kitsResult.data.filter((kit) => kit.isActive));
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

  const onSubmit = async (data: CheckoutFormOutput) => {
    try {
      const result = await createKitCheckoutAction(data);

      if (result.success) {
        toast.success("Kit checked out successfully!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create checkout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Checkout Kit</DialogTitle>
          <DialogDescription>Check out a kit to a person.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Kit */}
            <FormField
              control={form.control}
              name="kitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kit</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={kitOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a kit"
                      searchPlaceholder="Search kits..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>The kit to check out</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={personOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a person"
                      searchPlaceholder="Search persons..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>Who is checking out the kit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected Return Date */}
            <FormField
              control={form.control}
              name="expectedReturnDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Return Date (Optional)</FormLabel>
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
                          e.target.value ? new Date(e.target.value) : undefined,
                        );
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    When the kit should be returned
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
                {form.formState.isSubmitting ? "Creating..." : "Checkout"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
