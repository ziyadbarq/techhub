/**
 * Asset Overview Tab Component
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { CheckCircle2, XCircle } from "lucide-react";
import { convertCurrencyAction } from "@/interface-adapters/controllers/exchange-rate.controller";

interface AssetOverviewTabProps {
  asset: AssetDTO;
}

export function AssetOverviewTab({ asset }: AssetOverviewTabProps) {
  const [currencyConversion, setCurrencyConversion] = React.useState<{
    sarAmount: number;
    exchangeRate: number;
  } | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = React.useState(false);

  // Fetch currency conversion on mount if currency is not SAR
  React.useEffect(() => {
    async function fetchConversion() {
      // Only convert if we have a purchase cost and currency that's not SAR
      if (!asset.purchaseCost || !asset.currency || asset.currency === "SAR") {
        return;
      }

      setIsLoadingConversion(true);
      try {
        const result = await convertCurrencyAction({
          amount: asset.purchaseCost,
          fromCurrency: asset.currency,
        });

        if (result.success && result.data) {
          setCurrencyConversion({
            sarAmount: result.data.convertedAmount,
            exchangeRate: result.data.exchangeRate,
          });
        }
      } catch (error) {
        // Silently fail - just won't show conversion
        console.error("Failed to fetch currency conversion:", error);
      } finally {
        setIsLoadingConversion(false);
      }
    }

    fetchConversion();
  }, [asset.purchaseCost, asset.currency]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core asset details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Asset Tag
              </p>
              <p className="font-mono text-sm">{asset.assetTag}</p>
            </div>
            {asset.serialNumber && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Serial Number
                </p>
                <p className="font-mono text-sm">{asset.serialNumber}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Category
              </p>
              <p className="text-sm">{asset.categoryName || "—"}</p>
            </div>
            {asset.modelName && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Model
                </p>
                <p className="text-sm">{asset.modelName}</p>
              </div>
            )}
          </div>

          {asset.vendorName && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Vendor
              </p>
              <p className="text-sm">{asset.vendorName}</p>
            </div>
          )}

          {asset.lifecycleStateName && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Lifecycle State
              </p>
              <Badge variant="outline">{asset.lifecycleStateName}</Badge>
            </div>
          )}

          {asset.stockLocationName && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Current Location
              </p>
              <p className="text-sm">{asset.stockLocationName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>Purchase and depreciation details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {asset.purchaseDate && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Purchase Date
              </p>
              <p className="text-sm">
                {format(new Date(asset.purchaseDate), "MMMM d, yyyy")}
              </p>
            </div>
          )}

          {asset.purchaseCost !== null && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Purchase Cost
              </p>
              <div className="text-sm font-semibold">
                {isLoadingConversion ? (
                  <span className="text-muted-foreground">
                    {asset.currency || "SAR"} {asset.purchaseCost.toLocaleString()} (converting...)
                  </span>
                ) : (
                  <CurrencyDisplay
                    amount={asset.purchaseCost}
                    currency={asset.currency || "SAR"}
                    sarAmount={currencyConversion?.sarAmount}
                    exchangeRate={currencyConversion?.exchangeRate}
                    mode="dual"
                    className="text-sm font-semibold"
                  />
                )}
              </div>
            </div>
          )}

          {asset.depreciationModel && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">
                Depreciation
              </p>
              <div className="space-y-1">
                <p className="text-sm">Model: {asset.depreciationModel}</p>
                {asset.depreciationStart && (
                  <p className="text-muted-foreground text-xs">
                    Start:{" "}
                    {format(new Date(asset.depreciationStart), "MMM d, yyyy")}
                  </p>
                )}
                {asset.depreciationEnd && (
                  <p className="text-muted-foreground text-xs">
                    End:{" "}
                    {format(new Date(asset.depreciationEnd), "MMM d, yyyy")}
                  </p>
                )}
                {asset.isFullyDepreciated && (
                  <Badge variant="secondary" className="mt-1">
                    Fully Depreciated
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warranty Information */}
      <Card>
        <CardHeader>
          <CardTitle>Warranty Information</CardTitle>
          <CardDescription>Warranty status and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {asset.warrantyEndDate ? (
            <>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Warranty End Date
                </p>
                <p className="text-sm">
                  {format(new Date(asset.warrantyEndDate), "MMMM d, yyyy")}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Status
                </p>
                {asset.isUnderWarranty ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Expired
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No warranty information
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {asset.note && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{asset.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Attributes */}
      {asset.attributes && Object.keys(asset.attributes).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Attributes</CardTitle>
            <CardDescription>Custom fields and properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(asset.attributes).map(([key, value]) => (
                <div key={key}>
                  <p className="text-muted-foreground text-sm font-medium capitalize">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>System information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Created At
            </p>
            <p className="text-sm">
              {format(new Date(asset.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Last Updated
            </p>
            <p className="text-sm">
              {format(new Date(asset.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
