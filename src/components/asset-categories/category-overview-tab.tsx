/**
 * Category Overview Tab
 * Displays basic category information
 */

"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";

interface CategoryOverviewTabProps {
  category: AssetCategoryDTO;
}

export function CategoryOverviewTab({ category }: CategoryOverviewTabProps) {
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
            <p className="text-sm">{category.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Code</p>
            <p className="font-mono text-sm">{category.code}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Type</p>
            <p className="text-sm">
              {category.isConsumable
                ? "Consumable (no lifecycle tracking)"
                : "Tracked Asset (full lifecycle)"}
            </p>
          </div>
          {category.description && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {category.description}
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
              {format(new Date(category.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Last Updated
            </p>
            <p className="text-sm">
              {format(new Date(category.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
