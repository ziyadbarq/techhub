import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Feature Disabled",
  description:
    "This feature is currently disabled by your system administrator",
};

interface FeatureDisabledPageProps {
  searchParams: Promise<{
    feature?: string;
  }>;
}

/**
 * Feature Disabled page - shown when users attempt to access a disabled feature
 * Query params:
 * - feature: The feature name that is disabled (e.g., "CONTRACTS", "LICENSES")
 */
export default async function FeatureDisabledPage({
  searchParams,
}: FeatureDisabledPageProps) {
  const params = await searchParams;
  const featureName = params.feature ?? "this feature";

  // Convert feature name to display format (e.g., "CONTRACTS" → "Contract Management")
  const displayName = featureName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/20">
            <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Feature Disabled
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            The <strong>{displayName}</strong> module is currently disabled by
            your system administrator.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            If you need access to this feature, please contact your system
            administrator to enable it from the{" "}
            <span className="font-medium">Feature Management</span> admin panel.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Error Code: FEATURE_DISABLED • Feature: {featureName}
          </p>
        </div>
      </div>
    </div>
  );
}
