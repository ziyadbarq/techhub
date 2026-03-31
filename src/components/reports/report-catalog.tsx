/**
 * Report Catalog Component
 *
 * Grid of report cards grouped by category.
 * Each card links to the report viewer page.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Loader2 } from "lucide-react";
import { getReportCatalogAction } from "@/interface-adapters/controllers/reports/report.controller";
import { toast } from "sonner";
import type {
  ReportDefinition,
  ReportCategory,
} from "@/core/domain/reports/report-types";

const CATEGORY_CONFIG: Record<
  ReportCategory,
  {
    label: string;
    icon: typeof FileText;
    variant: "default" | "secondary" | "outline";
  }
> = {
  assets: { label: "Assets", icon: FileText, variant: "default" },
  cmdb: { label: "CMDB", icon: Database, variant: "secondary" },
};

export function ReportCatalog() {
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const result = await getReportCatalogAction();
        if (result.success) {
          setReports(result.data);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to load report catalog");
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 flex-col items-center justify-center gap-2">
        <FileText className="h-12 w-12" />
        <p>
          No reports available. Enable required feature flags to see reports.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = reports.reduce(
    (acc, report) => {
      const cat = report.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(report);
      return acc;
    },
    {} as Record<ReportCategory, ReportDefinition[]>,
  );

  return (
    <div className="space-y-8">
      {(Object.entries(grouped) as [ReportCategory, ReportDefinition[]][]).map(
        ([category, categoryReports]) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;

          return (
            <div key={category}>
              <div className="mb-4 flex items-center gap-2">
                <Icon className="text-muted-foreground h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {config.label} Reports
                </h2>
                <Badge variant={config.variant}>{categoryReports.length}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryReports.map((report) => (
                  <Card
                    key={report.id}
                    className="hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/reports/${report.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {report.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {report.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm">
                          Run Report
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
