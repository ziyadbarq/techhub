/**
 * Data Import Page
 *
 * Universal data importer supporting all 66 entities with intelligent validation,
 * fuzzy matching, and comprehensive error handling.
 */

import { Suspense } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { DataImportWizard } from "@/components/data-import/DataImportWizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

/**
 * Server component - handles permission checks and layout
 */
export default async function DataImportPage() {
  // Server-side permission check (security)
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/data-import");
    throw error;
  }

  return (
    <PermissionGuard permission={PERMISSIONS.DATA_IMPORT_MANAGE}>
      <div className="container mx-auto space-y-6 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Import</h1>
            <p className="text-muted-foreground mt-1">
              Import data from CSV or Excel files into any entity in the system
            </p>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            <span>66 entities available</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Supported Formats
              </CardTitle>
              <FileUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CSV, XLSX</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Auto-detects file format
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Smart Features
              </CardTitle>
              <CheckCircle2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Fuzzy Matching</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Auto-corrects typos and variations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Error Handling
              </CardTitle>
              <AlertCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Comprehensive</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Detailed error reports with fixes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Import Wizard */}
        <Card>
          <CardHeader>
            <CardTitle>Import Wizard</CardTitle>
            <CardDescription>
              Follow the step-by-step process to import your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ImportWizardSkeleton />}>
              <DataImportWizard />
            </Suspense>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    1
                  </span>
                  Select Entity
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Choose which entity you want to import data into (Assets,
                  Persons, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    2
                  </span>
                  Configure Settings
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Set import options like duplicate handling and data
                  sanitization
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    3
                  </span>
                  Upload File
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Drag and drop your CSV or Excel file, or download a template
                  first
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    4
                  </span>
                  Map Columns
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Match your file columns to entity fields (auto-mapped when
                  possible)
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    5
                  </span>
                  Validate Data
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Review validation results and download error reports if needed
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    6
                  </span>
                  Import
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Watch real-time progress as your data is imported
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

/**
 * Loading skeleton for wizard
 */
function ImportWizardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-10 rounded" />
      <div className="bg-muted h-64 rounded" />
      <div className="flex justify-between">
        <div className="bg-muted h-10 w-24 rounded" />
        <div className="bg-muted h-10 w-24 rounded" />
      </div>
    </div>
  );
}

/**
 * Metadata for page
 */
export const metadata = {
  title: "Data Import",
  description: "Import data from CSV or Excel files",
};
