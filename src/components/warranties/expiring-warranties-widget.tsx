/**
 * Expiring Warranties Widget
 * Dashboard widget to display warranties expiring soon
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, AlertTriangle, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import { listExpiringWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";
import { WarrantyStatusBadge } from "./warranty-status-badge";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface ExpiringWarrantiesWidgetProps {
  daysThreshold?: number; // Default: 30 days
  maxItems?: number; // Default: 5
  className?: string;
}

export function ExpiringWarrantiesWidget({
  daysThreshold = 30,
  maxItems = 5,
  className,
}: ExpiringWarrantiesWidgetProps) {
  const [warranties, setWarranties] = useState<WarrantyDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissions();

  const canViewWarranties = hasPermission(PERMISSIONS.WARRANTIES_VIEW);

  useEffect(() => {
    const loadExpiringWarranties = async () => {
      if (!canViewWarranties) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await listExpiringWarrantiesAction(daysThreshold);
        if (result.success) {
          setWarranties(result.data.slice(0, maxItems));
        } else {
          toast.error(result.error);
        }
      } catch (_error) {
        toast.error("Failed to load expiring warranties");
      } finally {
        setIsLoading(false);
      }
    };

    loadExpiringWarranties();
  }, [daysThreshold, maxItems, canViewWarranties]);

  if (!canViewWarranties) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-barq-yellow h-5 w-5" />
              Expiring Warranties
            </CardTitle>
            <CardDescription>
              Warranties expiring in the next {daysThreshold} days
            </CardDescription>
          </div>
          {!isLoading && warranties.length > 0 && (
            <Badge
              variant="outline"
              className="bg-warning/10 text-warning border-warning"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {warranties.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : warranties.length === 0 ? (
          <div className="py-8 text-center">
            <Shield className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              No warranties expiring soon
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              All warranties are current or have sufficient coverage time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {warranties.map((warranty) => (
              <Link
                key={warranty.id}
                href="/warranties"
                className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {warranty.assetTag || "Unknown Asset"}
                      </p>
                      <WarrantyStatusBadge
                        isActive={warranty.isActive}
                        isExpired={warranty.isExpired}
                        isExpiringSoon={warranty.isExpiringSoon}
                        daysRemaining={warranty.daysRemaining}
                        showIcon={false}
                      />
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {warranty.assetTag || "Unknown Asset"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground text-xs">
                        Expires{" "}
                        {format(new Date(warranty.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                </div>
              </Link>
            ))}

            <Link href="/warranties" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                View All Warranties
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
