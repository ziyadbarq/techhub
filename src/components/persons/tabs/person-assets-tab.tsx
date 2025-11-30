/**
 * Person Assets Tab
 *
 * Displays Intune devices, license allocations, asset reservations,
 * kit checkouts, maintenance schedules, and stock movements.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import {
  getComplianceStateColor,
  getComplianceStateLabel,
} from "@/interface-adapters/presenters/intune-device.presenter";
import { formatDate, formatDateTime } from "@/lib/utils/date-format";
import {
  getPersonAssetReservationsAction,
  getPersonKitCheckoutsAction,
  getPersonLicenseAllocationsAction,
  getPersonMaintenanceSchedulesAction,
  getPersonStockMovementsAction,
  type PersonAssetReservationDTO,
  type PersonKitCheckoutDTO,
  type PersonLicenseAllocationDTO,
  type PersonMaintenanceScheduleDTO,
  type PersonStockMovementDTO,
} from "@/interface-adapters/controllers/person-details.controller";

interface PersonAssetsTabProps {
  personId: string;
  intuneDevices: IntuneDeviceDTO[];
  counts: {
    intuneDevices: number;
    licenseAllocations: number;
    assetReservations: number;
    kitCheckouts: number;
    stockMovements: number;
    maintenanceSchedules: number;
  };
}

export function PersonAssetsTab({
  personId,
  intuneDevices,
  counts,
}: PersonAssetsTabProps) {
  const [licenseAllocations, setLicenseAllocations] = useState<
    PersonLicenseAllocationDTO[]
  >([]);
  const [reservations, setReservations] = useState<PersonAssetReservationDTO[]>(
    [],
  );
  const [kitCheckouts, setKitCheckouts] = useState<PersonKitCheckoutDTO[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<
    PersonMaintenanceScheduleDTO[]
  >([]);
  const [stockMovements, setStockMovements] = useState<
    PersonStockMovementDTO[]
  >([]);

  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loadingKitCheckouts, setLoadingKitCheckouts] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const totalItems = useMemo(
    () =>
      counts.intuneDevices +
      counts.licenseAllocations +
      counts.assetReservations +
      counts.kitCheckouts +
      counts.maintenanceSchedules +
      counts.stockMovements,
    [counts],
  );

  const loadLicenseAllocations = useCallback(async () => {
    if (counts.licenseAllocations === 0) {
      setLicenseAllocations([]);
      return;
    }
    setLoadingAllocations(true);
    try {
      const result = await getPersonLicenseAllocationsAction(personId);
      if (result.success) {
        setLicenseAllocations(result.data);
      } else {
        toast.error(result.error ?? "Failed to load license allocations");
      }
    } catch {
      toast.error("Failed to load license allocations");
    } finally {
      setLoadingAllocations(false);
    }
  }, [counts.licenseAllocations, personId]);

  const loadReservations = useCallback(async () => {
    if (counts.assetReservations === 0) {
      setReservations([]);
      return;
    }
    setLoadingReservations(true);
    try {
      const result = await getPersonAssetReservationsAction(personId);
      if (result.success) {
        setReservations(result.data);
      } else {
        toast.error(result.error ?? "Failed to load asset reservations");
      }
    } catch {
      toast.error("Failed to load asset reservations");
    } finally {
      setLoadingReservations(false);
    }
  }, [counts.assetReservations, personId]);

  const loadKitCheckouts = useCallback(async () => {
    if (counts.kitCheckouts === 0) {
      setKitCheckouts([]);
      return;
    }
    setLoadingKitCheckouts(true);
    try {
      const result = await getPersonKitCheckoutsAction(personId);
      if (result.success) {
        setKitCheckouts(result.data);
      } else {
        toast.error(result.error ?? "Failed to load kit checkouts");
      }
    } catch {
      toast.error("Failed to load kit checkouts");
    } finally {
      setLoadingKitCheckouts(false);
    }
  }, [counts.kitCheckouts, personId]);

  const loadMaintenance = useCallback(async () => {
    if (counts.maintenanceSchedules === 0) {
      setMaintenanceSchedules([]);
      return;
    }
    setLoadingMaintenance(true);
    try {
      const result = await getPersonMaintenanceSchedulesAction(personId);
      if (result.success) {
        setMaintenanceSchedules(result.data);
      } else {
        toast.error(result.error ?? "Failed to load maintenance schedules");
      }
    } catch {
      toast.error("Failed to load maintenance schedules");
    } finally {
      setLoadingMaintenance(false);
    }
  }, [counts.maintenanceSchedules, personId]);

  const loadStockMovements = useCallback(async () => {
    if (counts.stockMovements === 0) {
      setStockMovements([]);
      return;
    }
    setLoadingStock(true);
    try {
      const result = await getPersonStockMovementsAction(personId);
      if (result.success) {
        setStockMovements(result.data);
      } else {
        toast.error(result.error ?? "Failed to load stock movements");
      }
    } catch {
      toast.error("Failed to load stock movements");
    } finally {
      setLoadingStock(false);
    }
  }, [counts.stockMovements, personId]);

  useEffect(() => {
    void loadLicenseAllocations();
  }, [loadLicenseAllocations]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    void loadKitCheckouts();
  }, [loadKitCheckouts]);

  useEffect(() => {
    void loadMaintenance();
  }, [loadMaintenance]);

  useEffect(() => {
    void loadStockMovements();
  }, [loadStockMovements]);

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

      {/* License Allocations */}
      {counts.licenseAllocations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              License Allocations
              <Badge variant="secondary">{counts.licenseAllocations}</Badge>
            </CardTitle>
            <CardDescription>
              Software licenses allocated to this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAllocations ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : licenseAllocations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No license allocations found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {licenseAllocations.map((allocation) => {
                  const isActive = !allocation.deallocatedAt;
                  return (
                    <div
                      key={allocation.id}
                      className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {allocation.licenseProductName ?? "License Product"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Allocated {formatDate(allocation.allocatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Qty {allocation.allocatedQuantity}
                        </Badge>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={
                            isActive
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : undefined
                          }
                        >
                          {isActive ? "Active" : "Returned"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            {intuneDevices.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No Intune devices linked
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {intuneDevices.map((device) => (
                  <div
                    key={device.id}
                    className="border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Link
                          href={`/intune/devices/${device.id}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {device.deviceName || device.serialNumber || "Device"}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {device.operatingSystem || "Unknown OS"}
                          {device.osVersion ? ` • ${device.osVersion}` : ""}
                        </p>
                        {device.serialNumber && (
                          <p className="text-muted-foreground text-xs">
                            Serial: {device.serialNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={getComplianceStateColor(
                            device.complianceState,
                          )}
                        >
                          {getComplianceStateLabel(device.complianceState)}
                        </Badge>
                        {device.lastSyncDateTime && (
                          <span className="text-muted-foreground text-xs">
                            Last sync {formatDateTime(device.lastSyncDateTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            {loadingReservations ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No active reservations
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {reservation.assetTag}
                        {reservation.assetName
                          ? ` • ${reservation.assetName}`
                          : ""}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(reservation.startDate)} →{" "}
                        {formatDate(reservation.endDate)}
                      </p>
                      {reservation.purpose && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {reservation.purpose}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{reservation.status}</Badge>
                  </div>
                ))}
              </div>
            )}
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
            {loadingKitCheckouts ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : kitCheckouts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No kit checkouts found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {kitCheckouts.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/asset-kits/${checkout.kitId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {checkout.kitName}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        Checked out {formatDate(checkout.checkoutDate)}
                      </p>
                      {checkout.expectedReturnDate && (
                        <p className="text-muted-foreground text-xs">
                          Due {formatDate(checkout.expectedReturnDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{checkout.status}</Badge>
                      {checkout.actualReturnDate && (
                        <Badge variant="secondary">
                          Returned {formatDate(checkout.actualReturnDate)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {loadingMaintenance ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : maintenanceSchedules.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No maintenance schedules assigned
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {maintenanceSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{schedule.title}</p>
                      <p className="text-muted-foreground text-xs">
                        Asset {schedule.assetTag} • Next due{" "}
                        {formatDate(schedule.nextDueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{schedule.priority}</Badge>
                      <Badge variant="secondary">{schedule.scheduleType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {loadingStock ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stockMovements.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No stock movements recorded
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {stockMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {movement.assetTag ?? "Stock Movement"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {movement.stockLocationFrom
                          ? `${movement.stockLocationFrom} → `
                          : ""}
                        {movement.stockLocationTo ?? "Unknown location"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(movement.occurredAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{movement.movementType}</Badge>
                      <Badge variant="secondary">Qty {movement.quantity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
