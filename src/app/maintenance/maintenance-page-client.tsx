"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Poll every 30 seconds to detect when maintenance mode is disabled
const POLL_INTERVAL = 30000;

export function MaintenancePageClient() {
  const router = useRouter();

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/features", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to check maintenance status");
      }

      const data = await response.json();

      // If maintenance mode is disabled, redirect back to where user was before
      if (data.maintenanceMode === false) {
        const returnUrl =
          sessionStorage.getItem("maintenanceReturnUrl") || "/dashboard";
        sessionStorage.removeItem("maintenanceReturnUrl"); // Clean up
        router.push(returnUrl);
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Error checking maintenance status:", error);
    }
  }, [router]);

  useEffect(() => {
    // Initial check
    checkMaintenanceStatus();

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      checkMaintenanceStatus();
    }, POLL_INTERVAL);

    // Refetch when tab becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkMaintenanceStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkMaintenanceStatus]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Construction className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">System Under Maintenance</h1>
            <p className="text-muted-foreground text-sm">
              We&apos;re currently performing scheduled maintenance to improve
              your experience.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border bg-muted/50 rounded-lg border p-4 text-center">
            <p className="text-sm font-medium">
              The system will be available shortly.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Thank you for your patience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
