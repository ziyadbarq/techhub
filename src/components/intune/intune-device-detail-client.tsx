"use client";

/**
 * Intune Device Detail Client
 *
 * Client component for displaying a single Intune device's details.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Laptop,
  Monitor,
  Shield,
  User,
  Link2,
  Unlink,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import {
  getComplianceStateLabel,
  getComplianceStateColor,
  getOwnershipTypeLabel,
  getOwnershipTypeColor,
  getManagementStateLabel,
} from "@/interface-adapters/presenters/intune-device.presenter";
import {
  getIntuneDeviceAction,
  unlinkDeviceFromAssetAction,
  unlinkDeviceFromPersonAction,
} from "@/interface-adapters/controllers/intune-device.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface IntuneDeviceDetailClientProps {
  device: IntuneDeviceDTO;
}

export function IntuneDeviceDetailClient({
  device: initialDevice,
}: IntuneDeviceDetailClientProps) {
  const router = useRouter();
  const [device, setDevice] = useState(initialDevice);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { hasPermission } = usePermissions();

  const canLink = hasPermission(PERMISSIONS.INTUNE_DEVICES_LINK);

  const isWindows = device.operatingSystem?.toLowerCase().includes("windows");

  const refreshDevice = useCallback(async () => {
    const result = await getIntuneDeviceAction(device.id);
    if (result.success && result.data) {
      setDevice(result.data);
    }
  }, [device.id]);

  const handleUnlinkAsset = async () => {
    setIsUnlinking(true);
    try {
      const result = await unlinkDeviceFromAssetAction({ deviceId: device.id });
      if (result.success) {
        toast.success("Device unlinked from asset");
        await refreshDevice();
      } else {
        toast.error(result.error ?? "Failed to unlink device");
      }
    } catch {
      toast.error("Failed to unlink device");
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleUnlinkPerson = async () => {
    setIsUnlinking(true);
    try {
      const result = await unlinkDeviceFromPersonAction({
        deviceId: device.id,
      });
      if (result.success) {
        toast.success("Device unlinked from person");
        await refreshDevice();
      } else {
        toast.error(result.error ?? "Failed to unlink device");
      }
    } catch {
      toast.error("Failed to unlink device");
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          {isWindows ? (
            <Monitor className="text-muted-foreground h-8 w-8" />
          ) : (
            <Laptop className="text-muted-foreground h-8 w-8" />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {device.deviceName}
            </h1>
            <p className="text-muted-foreground">
              {device.manufacturer} {device.model}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={getComplianceStateColor(device.complianceState)}>
            {getComplianceStateLabel(device.complianceState)}
          </Badge>
          <Badge variant={getOwnershipTypeColor(device.ownershipType)}>
            {getOwnershipTypeLabel(device.ownershipType)}
          </Badge>
          {!device.isActive && <Badge variant="secondary">Inactive</Badge>}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="links">ITAM Links</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-mono">{device.serialNumber ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IMEI</p>
                    <p className="font-mono">{device.imei ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operating System</p>
                    <p>{device.operatingSystem ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">OS Version</p>
                    <p>{device.osVersion ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">WiFi MAC</p>
                    <p className="font-mono">{device.wiFiMacAddress ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ethernet MAC</p>
                    <p className="font-mono">
                      {device.ethernetMacAddress ?? "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned User (Intune)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {device.userDisplayName ? (
                  <div className="space-y-2">
                    <p className="font-medium">{device.userDisplayName}</p>
                    <p className="text-muted-foreground text-sm">
                      {device.userPrincipalName}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No user assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Enrolled</p>
                    <p>
                      {device.enrolledDateTime
                        ? new Date(device.enrolledDateTime).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Intune Sync</p>
                    <p>
                      {device.lastSyncDateTime
                        ? new Date(device.lastSyncDateTime).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last ITAM Sync</p>
                    <p>
                      {device.lastSyncedFromIntune
                        ? new Date(device.lastSyncedFromIntune).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identifiers */}
            <Card>
              <CardHeader>
                <CardTitle>Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Intune Device ID</p>
                    <p className="font-mono text-xs break-all">
                      {device.intuneDeviceId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Azure AD Device ID</p>
                    <p className="font-mono text-xs break-all">
                      {device.azureAdDeviceId ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ITAM ID</p>
                    <p className="font-mono text-xs break-all">{device.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Status
              </CardTitle>
              <CardDescription>
                Device security and compliance information from Intune
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Compliance State
                    </p>
                    <Badge
                      variant={getComplianceStateColor(device.complianceState)}
                      className="mt-1"
                    >
                      {getComplianceStateLabel(device.complianceState)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Management State
                    </p>
                    <p className="font-medium">
                      {getManagementStateLabel(device.managementState)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encrypted</span>
                    <Badge
                      variant={device.isEncrypted ? "default" : "destructive"}
                      className={
                        device.isEncrypted
                          ? "bg-green-600 hover:bg-green-700"
                          : undefined
                      }
                    >
                      {device.isEncrypted ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supervised</span>
                    <Badge
                      variant={device.isSupervised ? "default" : "secondary"}
                      className={
                        device.isSupervised
                          ? "bg-green-600 hover:bg-green-700"
                          : undefined
                      }
                    >
                      {device.isSupervised ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Jailbroken</span>
                    <Badge
                      variant={device.isJailBroken ? "destructive" : "default"}
                      className={
                        !device.isJailBroken
                          ? "bg-green-600 hover:bg-green-700"
                          : undefined
                      }
                    >
                      {device.isJailBroken ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Asset Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Linked Asset
                </CardTitle>
                <CardDescription>
                  Link this device to an ITAM Asset for cross-referencing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {device.linkedAssetId ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{device.linkedAssetTag}</p>
                        <p className="text-muted-foreground text-sm">
                          Linked via{" "}
                          {device.assetLinkMethod === "auto_serial"
                            ? "serial number (auto)"
                            : "manual link"}
                        </p>
                      </div>
                      <Link href={`/assets/${device.linkedAssetTag}`}>
                        <Button variant="outline" size="sm">
                          View Asset
                        </Button>
                      </Link>
                    </div>
                    <Separator />
                    {canLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkAsset}
                        disabled={isUnlinking}
                      >
                        <Unlink className="mr-2 h-4 w-4" />
                        Unlink Asset
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground mb-4">
                      No asset linked
                    </p>
                    {canLink && (
                      <Button variant="outline" size="sm" disabled>
                        <Link2 className="mr-2 h-4 w-4" />
                        Link to Asset
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Person Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Linked Person
                </CardTitle>
                <CardDescription>
                  Link this device to a Person in ITAM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {device.linkedPersonId ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{device.linkedPersonName}</p>
                        <p className="text-muted-foreground text-sm">
                          Linked via{" "}
                          {device.personLinkMethod === "auto_azuread"
                            ? "Azure AD (auto)"
                            : "manual link"}
                        </p>
                      </div>
                      <Link href={`/people/${device.linkedPersonId}`}>
                        <Button variant="outline" size="sm">
                          View Person
                        </Button>
                      </Link>
                    </div>
                    <Separator />
                    {canLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkPerson}
                        disabled={isUnlinking}
                      >
                        <Unlink className="mr-2 h-4 w-4" />
                        Unlink Person
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground mb-4">
                      No person linked
                    </p>
                    {canLink && (
                      <Button variant="outline" size="sm" disabled>
                        <Link2 className="mr-2 h-4 w-4" />
                        Link to Person
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
