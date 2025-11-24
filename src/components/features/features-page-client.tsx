/**
 * Features Page Client Component
 * Display grouped feature flags with toggle controls
 */

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Settings,
  Layers,
  Package,
  Boxes,
} from "lucide-react";
import { listFeatureFlagsAction } from "@/interface-adapters/controllers/feature-flags/feature-flag.controller";
import { FeatureFlagToggle } from "./feature-flag-toggle";

import type { FeatureFlagResponseDTO } from "@/interface-adapters/dtos/feature-flags/feature-flag.dto";

type CategoryType = "SYSTEM" | "LAYER_1" | "LAYER_2" | "LAYER_3";

interface GroupedFlags {
  SYSTEM: FeatureFlagResponseDTO[];
  LAYER_1: FeatureFlagResponseDTO[];
  LAYER_2: FeatureFlagResponseDTO[];
  LAYER_3: FeatureFlagResponseDTO[];
}

const CATEGORY_CONFIG: Record<
  CategoryType,
  {
    label: string;
    description: string;
    badgeColor: string;
    icon: React.ElementType;
  }
> = {
  SYSTEM: {
    label: "System Flags",
    description: "Global system-level feature flags",
    badgeColor: "bg-blue-500 text-white",
    icon: Settings,
  },
  LAYER_1: {
    label: "Foundation Layer",
    description: "Core entities and services",
    badgeColor: "bg-green-500 text-white",
    icon: Layers,
  },
  LAYER_2: {
    label: "Asset Management Layer",
    description: "Asset tracking and inventory management",
    badgeColor: "bg-purple-500 text-white",
    icon: Package,
  },
  LAYER_3: {
    label: "Advanced ITAM Layer",
    description: "Advanced IT asset management features",
    badgeColor: "bg-orange-500 text-white",
    icon: Boxes,
  },
};

export function FeaturesPageClient() {
  const [groupedFlags, setGroupedFlags] = useState<GroupedFlags>({
    SYSTEM: [],
    LAYER_1: [],
    LAYER_2: [],
    LAYER_3: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<CategoryType>>(
    new Set(["SYSTEM"]), // Open SYSTEM by default
  );

  const loadFlags = async () => {
    setIsLoading(true);
    try {
      const result = await listFeatureFlagsAction();

      if (result.success && result.data) {
        // Group flags by category
        const grouped: GroupedFlags = {
          SYSTEM: [],
          LAYER_1: [],
          LAYER_2: [],
          LAYER_3: [],
        };

        result.data.flags.forEach((flag: FeatureFlagResponseDTO) => {
          const category = flag.category as CategoryType;
          grouped[category].push(flag);
        });

        setGroupedFlags(grouped);
      } else {
        toast.error("Failed to load feature flags", {
          description: !result.success
            ? result.error
            : "An unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
      toast.error("Failed to load feature flags", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleCategory = (category: CategoryType) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getStatusBadge = (flag: FeatureFlagResponseDTO) => {
    if (flag.name === "MAINTENANCE_MODE") {
      return (
        <Badge
          variant={flag.isEnabled ? "destructive" : "outline"}
          className={
            flag.isEnabled ? "bg-red-500 text-white hover:bg-red-600" : ""
          }
        >
          {flag.isEnabled ? (
            <>
              <AlertTriangle className="mr-1 h-3 w-3" />
              Enabled
            </>
          ) : (
            "Disabled"
          )}
        </Badge>
      );
    }

    return (
      <Badge variant={flag.isEnabled ? "default" : "outline"}>
        {flag.isEnabled ? "Enabled" : "Disabled"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <p className="text-muted-foreground mt-2">
          Manage system features and capabilities. Toggle features on or off to
          control availability across the application.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Caution:</strong> Disabling features will immediately affect
          all users. Some features have dependencies that must remain enabled
          for proper functionality.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const categoryFlags = groupedFlags[category];
          const Icon = config.icon;
          const isOpen = openCategories.has(category);

          if (categoryFlags.length === 0) return null;

          return (
            <Card key={category}>
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="text-muted-foreground h-5 w-5" />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {config.label}
                            <Badge className={config.badgeColor}>
                              {categoryFlags.length}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {categoryFlags.map((flag) => (
                      <div
                        key={flag.id}
                        className="flex items-start justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {flag.displayName}
                            </h3>
                            {getStatusBadge(flag)}
                            {flag.isSystem && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground text-sm">
                            {flag.description}
                          </p>

                          {flag.dependsOn.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                Dependencies:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {flag.dependsOn.map((dep) => (
                                  <Badge
                                    key={dep}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-muted-foreground text-xs">
                            <span className="font-mono">{flag.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <FeatureFlagToggle
                            featureFlag={flag}
                            onToggleSuccess={loadFlags}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
