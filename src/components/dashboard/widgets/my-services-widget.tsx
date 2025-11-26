/**
 * My Services Widget
 * Displays services owned by the current user
 */

"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { WidgetError } from "@/components/dashboard/widget-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getMyServicesAction,
  type MyServiceDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PRODUCTION":
      return "default";
    case "UAT":
    case "DR":
      return "secondary";
    case "RETIRED":
      return "destructive";
    default:
      return "outline";
  }
}

function getCriticalityVariant(
  criticality: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (criticality) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    default:
      return "outline";
  }
}

export function MyServicesWidget() {
  const [services, setServices] = useState<MyServiceDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyServicesAction();
      if (result.success) {
        setServices(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <WidgetContainer
        title="My Services"
        icon={<Server className="h-4 w-4" />}
        featureFlag="SERVICES"
        permission={PERMISSIONS.SERVICES_VIEW}
      >
        <WidgetSkeleton rows={3} />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="My Services"
        icon={<Server className="h-4 w-4" />}
        featureFlag="SERVICES"
        permission={PERMISSIONS.SERVICES_VIEW}
      >
        <WidgetError message={error} onRetry={fetchServices} />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="My Services"
      icon={<Server className="h-4 w-4" />}
      featureFlag="SERVICES"
      permission={PERMISSIONS.SERVICES_VIEW}
      headerAction={
        services.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cmdb/services">
              <ExternalLink className="mr-1 h-3 w-3" />
              View All
            </Link>
          </Button>
        )
      }
    >
      {services.length === 0 ? (
        <WidgetEmpty
          icon={Server}
          title="No services owned"
          description="You are not an owner of any services yet."
        />
      ) : (
        <div className="space-y-3">
          {services.slice(0, 5).map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {service.serviceName}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {service.serviceType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getCriticalityVariant(service.criticality)}
                  className="text-xs"
                >
                  {service.criticality}
                </Badge>
                <Badge
                  variant={getStatusVariant(service.status)}
                  className="text-xs"
                >
                  {service.status}
                </Badge>
              </div>
            </div>
          ))}
          {services.length > 5 && (
            <p className="text-muted-foreground pt-2 text-center text-xs">
              +{services.length - 5} more services
            </p>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
