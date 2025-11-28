/**
 * Person Services Tab
 *
 * Displays service ownerships, configuration items, and data ownerships.
 */

"use client";

import { Server, Database, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PersonServicesTabProps {
  personId: string;
  counts: {
    serviceOwnerships: number;
    configurationItems: number;
    dataOwnerships: number;
  };
}

export function PersonServicesTab({
  personId: _personId,
  counts,
}: PersonServicesTabProps) {
  const totalItems =
    counts.serviceOwnerships +
    counts.configurationItems +
    counts.dataOwnerships;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No services, configuration items, or data ownerships assigned
            </p>
          </CardContent>
        </Card>
      )}

      {/* Service Ownerships */}
      {counts.serviceOwnerships > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Service Ownerships
              <Badge variant="secondary">{counts.serviceOwnerships}</Badge>
            </CardTitle>
            <CardDescription>
              Services owned by this person (Technical, Business, or Product
              owner)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.serviceOwnerships} service
              {counts.serviceOwnerships !== 1 ? "s" : ""} owned
            </p>
            {/* TODO: Load and display actual service ownerships */}
          </CardContent>
        </Card>
      )}

      {/* Configuration Items */}
      {counts.configurationItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Configuration Items
              <Badge variant="secondary">{counts.configurationItems}</Badge>
            </CardTitle>
            <CardDescription>
              CMDB configuration items owned by this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.configurationItems} CI
              {counts.configurationItems !== 1 ? "s" : ""} owned
            </p>
            {/* TODO: Load and display actual CIs */}
          </CardContent>
        </Card>
      )}

      {/* Data Ownerships */}
      {counts.dataOwnerships > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Data Ownerships
              <Badge variant="secondary">{counts.dataOwnerships}</Badge>
            </CardTitle>
            <CardDescription>Data domains owned by this person</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.dataOwnerships} data domain
              {counts.dataOwnerships !== 1 ? "s" : ""} owned
            </p>
            {/* TODO: Load and display actual data ownerships */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
