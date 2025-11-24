/**
 * Checkout Form Component
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

  const form = useForm<CheckoutFormValues, undefined, CheckoutFormOutput>({
    resolver: zodResolver(CreateKitCheckoutDTO),
    defaultValues: {
      kitId: "",
      assignedToPersonId: undefined,
      assignedToOrgUnitId: undefined,
      checkoutDate: new Date(),
      expectedReturnDate: new Date(),
      purpose: "",
      assetIds: [],
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a kit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kits.map((kit) => (
                        <SelectItem key={kit.id} value={kit.id}>
                          {kit.name} ({kit.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The kit to check out</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Person */}
            <FormField
              control={form.control}
              name="assignedToPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {persons.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.firstName} {person.lastName} ({person.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
