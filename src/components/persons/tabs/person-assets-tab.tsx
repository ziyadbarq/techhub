/**
 * Person Assets Tab
 *
 * Displays Intune devices, license allocations, asset reservations,
 * kit checkouts, maintenance schedules, and stock movements.
 */

"use client";

import {
  Laptop,
  Key,
  Calendar,
  Package,
  Wrench,
  ArrowRightLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PersonAssetsTabProps {
  personId: string;
  counts: {
    intuneDevices: number;
    assetReservations: number;
    kitCheckouts: number;
    stockMovements: number;
    maintenanceSchedules: number;
  };
}

export function PersonAssetsTab({
  personId: _personId,
  counts,
}: PersonAssetsTabProps) {
  const totalItems =
    counts.intuneDevices + counts.assetReservations + counts.kitCheckouts;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No assets, devices, or licenses linked to this person
            </p>
          </CardContent>
        </Card>
      )}

      {/* Intune Devices */}
      {counts.intuneDevices > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              Intune Devices
              <Badge variant="secondary">{counts.intuneDevices}</Badge>
            </CardTitle>
            <CardDescription>
              Mobile devices managed through Microsoft Intune
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.intuneDevices} device
              {counts.intuneDevices !== 1 ? "s" : ""} linked
            </p>
            {/* TODO: Load and display actual device list */}
          </CardContent>
        </Card>
      )}

      {/* License Allocations - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            License Allocations
          </CardTitle>
          <CardDescription>
            Software licenses allocated to this person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            License allocations will be displayed here
          </p>
          {/* TODO: Load and display actual license allocations */}
        </CardContent>
      </Card>

      {/* Asset Reservations */}
      {counts.assetReservations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Asset Reservations
              <Badge variant="secondary">{counts.assetReservations}</Badge>
            </CardTitle>
            <CardDescription>Assets reserved for this person</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.assetReservations} reservation
              {counts.assetReservations !== 1 ? "s" : ""}
            </p>
            {/* TODO: Load and display actual reservations */}
          </CardContent>
        </Card>
      )}

      {/* Kit Checkouts */}
      {counts.kitCheckouts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Kit Checkouts
              <Badge variant="secondary">{counts.kitCheckouts}</Badge>
            </CardTitle>
            <CardDescription>
              Asset kits checked out by this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.kitCheckouts} checkout
              {counts.kitCheckouts !== 1 ? "s" : ""}
            </p>
            {/* TODO: Load and display actual kit checkouts */}
          </CardContent>
        </Card>
      )}

      {/* Maintenance Schedules */}
      {counts.maintenanceSchedules > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance Schedules
              <Badge variant="secondary">{counts.maintenanceSchedules}</Badge>
            </CardTitle>
            <CardDescription>
              Maintenance tasks assigned to this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.maintenanceSchedules} schedule
              {counts.maintenanceSchedules !== 1 ? "s" : ""} assigned
            </p>
            {/* TODO: Load and display actual maintenance schedules */}
          </CardContent>
        </Card>
      )}

      {/* Stock Movements */}
      {counts.stockMovements > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Stock Movements
              <Badge variant="secondary">{counts.stockMovements}</Badge>
            </CardTitle>
            <CardDescription>
              Inventory movements initiated by this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {counts.stockMovements} movement
              {counts.stockMovements !== 1 ? "s" : ""} recorded
            </p>
            {/* TODO: Load and display actual stock movements */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
