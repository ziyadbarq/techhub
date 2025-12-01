"use client";

/**
 * Step 1: Entity Selector
 *
 * Allows user to select which entity they want to import data into.
 * Shows entity categories, field counts, and descriptions.
 */

import { useState, useMemo } from "react";
import { getAllEntityConfigs } from "@/interface-adapters/data-import/entity-configs";
import type {
  EntityConfig,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronRight,
  Download,
  Info,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  onEntitySelected: (
    entity: EntityConfig,
    lookupMaps: Map<string, LookupMap>,
  ) => void;
}

export function Step1EntitySelector({ onEntitySelected }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const entities = useMemo(() => getAllEntityConfigs(), []);

  /**
   * Filter entities by search and category
   */
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const matchesSearch =
        searchQuery === "" ||
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || entity.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [entities, searchQuery, selectedCategory]);

  /**
   * Get unique categories
   */
  const categories = useMemo(() => {
    const cats = new Set(entities.map((e) => e.category));
    return Array.from(cats);
  }, [entities]);

  /**
   * Handle entity selection
   */
  const handleSelect = async (entity: EntityConfig) => {
    try {
      // Fetch lookup maps from server
      const { getLookupMapsAction } = await import(
        "@/interface-adapters/controllers/data-import-lookup.controller"
      );

      // Build lookup fields array from entity config
      const lookupFields = entity.fields
        .filter((f) => f.type === "lookup" && f.lookupTarget)
        .map((f) => ({
          name: f.name,
          lookupTarget: f.lookupTarget!,
          lookupField: f.lookupField || "code",
          lookupDisplayField: f.lookupDisplayField || "name",
        }));

      let lookupMaps = new Map<string, LookupMap>();

      // Fetch lookup maps if there are any lookup fields
      if (lookupFields.length > 0) {
        const result = await getLookupMapsAction(lookupFields);
        if (result.success && result.data) {
          lookupMaps = result.data;
        } else {
          toast.warning(
            "Failed to load some lookup data. Import may have limited validation.",
          );
        }
      }

      onEntitySelected(entity, lookupMaps);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to select entity",
      );
    }
  };

  /**
   * Get category label
   */
  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      FOUNDATION:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ASSET_MANAGEMENT:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      INVENTORY:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      CMDB: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      CONTRACTS:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      LICENSES:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      SERVICES: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      GOVERNANCE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      ATTACHMENTS:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[category] || colors.SYSTEM;
  };

  /**
   * Check if Universal Assets is available and get its config
   */
  const universalAssetsConfig = useMemo(() => {
    return entities.find((e) => e.key === "UNIVERSAL_ASSETS");
  }, [entities]);

  /**
   * Filter out Universal Assets from regular entities (it has its own featured card)
   */
  const regularEntities = useMemo(() => {
    return filteredEntities.filter((e) => e.key !== "UNIVERSAL_ASSETS");
  }, [filteredEntities]);

  return (
    <div className="space-y-6">
      {/* Featured: Universal Assets Import */}
      {universalAssetsConfig && (
        <Card
          className="cursor-pointer border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 transition-all hover:shadow-lg dark:border-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50"
          onClick={() => handleSelect(universalAssetsConfig)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500 p-2 text-white">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {universalAssetsConfig.name}
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Recommended
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {universalAssetsConfig.description}
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="font-medium">Auto-creates:</span>
                <span>
                  Vendors, Categories, Models, Locations, Custom Fields
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                title="Optional - assets can be imported without assignment"
              >
                person.email (optional)
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
              >
                asset.*
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
              >
                vendor.*
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
              >
                category.*
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
              >
                model.*
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
              >
                custom.*
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      {universalAssetsConfig && (
        <div className="flex items-center gap-4">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-sm">
            Or import a single entity type
          </span>
          <div className="bg-border h-px flex-1" />
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({entities.length})
          </Button>
          {categories.map((category) => {
            const count = entities.filter(
              (e) => e.category === category,
            ).length;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {getCategoryLabel(category)} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Entity Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {regularEntities.map((entity) => (
          <Card
            key={entity.key}
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => handleSelect(entity)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`mt-2 ${getCategoryColor(entity.category)}`}
                  >
                    {getCategoryLabel(entity.category)}
                  </Badge>
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="line-clamp-2">
                {entity.description}
              </CardDescription>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-muted-foreground">Fields:</span>
                    <span className="ml-1 font-medium">
                      {entity.fields.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Required:</span>
                    <span className="ml-1 font-medium">
                      {entity.requiredFields.length}
                    </span>
                  </div>
                </div>
              </div>

              {entity.lookupFields.length > 0 && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Info className="h-3 w-3" />
                  <span>{entity.lookupFields.length} lookup fields</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {regularEntities.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No entities found matching your search
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Need a template?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            Select an entity to download a CSV or Excel template with all
            required fields, validation rules, and example data.
          </p>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            <span>Templates available after entity selection</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
