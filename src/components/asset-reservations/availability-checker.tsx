/**
 * Availability Checker Component
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { z } from "zod";
import { checkAvailabilityAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { CheckAvailabilityDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { useEffect } from "react";
import { CheckCircle2, XCircle, Search } from "lucide-react";

type AvailabilityFormValues = z.input<typeof CheckAvailabilityDTO>;
type AvailabilityFormOutput = z.output<typeof CheckAvailabilityDTO>;

export function AvailabilityChecker() {
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    isAvailable: boolean;
    conflictingReservationIds: string[];
  } | null>(null);

  const form = useForm<
    AvailabilityFormValues,
    undefined,
    AvailabilityFormOutput
  >({
    resolver: zodResolver(CheckAvailabilityDTO),
    defaultValues: {
      assetId: "",
      startDate: new Date(),
      endDate: new Date(),
      excludeReservationId: undefined,
    },
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const assetsResult = await listAssetsAction();
      if (assetsResult.success) {
        setAssets(assetsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AvailabilityFormOutput) => {
    setChecking(true);
    setResult(null);
    try {
      const response = await checkAvailabilityAction(data);

      if (response.success) {
        setResult(response.data);
        if (response.data.isAvailable) {
          toast.success("Asset is available!");
        } else {
          toast.warning("Asset is not available for the selected dates");
        }
      } else {
        toast.error(response.error);
      }
    } catch (_error) {
      toast.error("Failed to check availability");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check Asset Availability</CardTitle>
      </CardHeader>
      <CardContent>
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
                  <FormDescription>The asset to check</FormDescription>
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
                  <FormDescription>Reservation start date</FormDescription>
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
                  <FormDescription>Reservation end date</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={checking || loading}
              className="w-full gap-2"
            >
              <Search className="h-4 w-4" />
              {checking ? "Checking..." : "Check Availability"}
            </Button>
          </form>
        </Form>

        {/* Result */}
        {result && (
          <div className="mt-6 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {result.isAvailable ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-700">Available</p>
                    <p className="text-muted-foreground text-sm">
                      This asset is available for the selected dates
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700">Not Available</p>
                    <p className="text-muted-foreground text-sm">
                      {result.conflictingReservationIds.length} conflicting
                      reservation(s)
                    </p>
                  </div>
                </>
              )}
            </div>

            {!result.isAvailable &&
              result.conflictingReservationIds.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">
                    Conflicting Reservations:
                  </p>
                  <div className="space-y-1">
                    {result.conflictingReservationIds.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {id.slice(0, 16)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
