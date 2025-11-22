/**
 * Exchange Rate Form Component
 */

"use client";
"use no memo";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import {
  createExchangeRateAction,
  updateExchangeRateAction,
} from "@/interface-adapters/controllers/exchange-rate.controller";
import {
  CreateExchangeRateSchema,
  type CreateExchangeRateDTO,
} from "@/interface-adapters/dtos/generated/exchange-rate.dto";

interface FxRateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  rate?: ExchangeRateResponseDTO | null;
}

type FxRateFormValues = z.input<typeof CreateExchangeRateSchema>;

// List of supported currencies (excluding SAR which is the base)
const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
];

export function FxRateForm({
  open,
  onOpenChange,
  onSuccess,
  rate,
}: FxRateFormProps) {
  const isEditing = !!rate;

  const form = useForm<FxRateFormValues, undefined, CreateExchangeRateDTO>({
    resolver: zodResolver(CreateExchangeRateSchema),
    defaultValues: {
      currency: rate?.currency ?? "",
      rateToSAR: rate?.rateToSAR ?? 0,
      isActive: rate?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      currency: rate?.currency ?? "",
      rateToSAR: rate?.rateToSAR ?? 0,
      isActive: rate?.isActive ?? true,
    });
  }, [rate, form]);

  const onSubmit = async (data: CreateExchangeRateDTO) => {
    try {
      const result = isEditing
        ? await updateExchangeRateAction({
            id: rate.id,
            rateToSAR: data.rateToSAR,
            isActive: data.isActive,
          })
        : await createExchangeRateAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Exchange rate updated!"
            : "Exchange rate created successfully!",
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
          ? "Failed to update exchange rate"
          : "Failed to create exchange rate",
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const selectedCurrency = form.watch("currency");
  const rateValue = form.watch("rateToSAR");
  const currencyInfo = SUPPORTED_CURRENCIES.find(
    (c) => c.code === selectedCurrency,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Exchange Rate" : "Create Exchange Rate"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the exchange rate details below. The currency code cannot be changed."
              : "Add a new exchange rate for currency conversion to SAR."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEditing
                      ? "Currency code cannot be changed after creation"
                      : "Select the currency for which you want to set an exchange rate"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exchange Rate */}
            <FormField
              control={form.control}
              name="rateToSAR"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate to SAR</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <TrendingUp className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="3.75"
                        className="pl-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    How many SAR equals 1 unit of{" "}
                    {selectedCurrency || "currency"}
                    {currencyInfo && rateValue > 0 && (
                      <span className="mt-1 block font-mono text-sm">
                        1 {currencyInfo.code} = {rateValue.toFixed(6)} SAR
                        <br />1 SAR = {(1 / rateValue).toFixed(6)}{" "}
                        {currencyInfo.code}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Only active rates are used for currency conversion
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Rate"
                    : "Create Rate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
