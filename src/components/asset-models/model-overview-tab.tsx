/**
 * Model Overview Tab
 * Displays basic model information, category, vendor, and default settings
 */

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, FolderTree, Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";

interface ModelOverviewTabProps {
  model: AssetModelDTO;
  category: AssetCategoryDTO | null;
  vendor: VendorDTO | null;
}

export function ModelOverviewTab({
  model,
  category,
  vendor,
}: ModelOverviewTabProps) {
  // Format warranty display
  const formatWarranty = (months: number | null) => {
    if (!months) return "Not specified";
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    if (remainingMonths > 0)
      parts.push(`${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`);
    return parts.join(" ") || "None";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Name</p>
            <p className="text-sm">{model.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Code</p>
            <p className="font-mono text-sm">{model.code}</p>
          </div>
          {model.description && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">{model.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category & Vendor */}
      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Asset Category
            </p>
            {category ? (
              <Link
                href={`/asset-categories/${category.id}`}
                className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
              >
                <FolderTree className="h-4 w-4" />
                {category.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">Not available</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Manufacturer / Vendor
            </p>
            {vendor ? (
              <Link
                href={`/vendors/${vendor.id}`}
                className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {vendor.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">Not available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Default Warranty Period
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm">
                {formatWarranty(model.defaultWarrantyMonths)}
              </p>
              {model.defaultWarrantyMonths && (
                <Badge variant="secondary" className="text-xs">
                  {model.defaultWarrantyMonths} months
                </Badge>
              )}
            </div>
          </div>
          {model.defaultAttributes &&
            Object.keys(model.defaultAttributes).length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Default Attributes
                </p>
                <div className="bg-muted rounded-md p-3">
                  <pre className="max-h-48 overflow-auto text-xs">
                    {JSON.stringify(model.defaultAttributes, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          {(!model.defaultAttributes ||
            Object.keys(model.defaultAttributes).length === 0) && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Default Attributes
              </p>
              <p className="text-muted-foreground text-sm">
                No default attributes configured
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Created At
            </p>
            <p className="text-sm">
              {format(new Date(model.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Last Updated
            </p>
            <p className="text-sm">
              {format(new Date(model.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
