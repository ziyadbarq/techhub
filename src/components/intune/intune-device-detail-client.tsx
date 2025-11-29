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
  Loader2,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  linkDeviceToAssetAction,
  linkDeviceToPersonAction,
} from "@/interface-adapters/controllers/intune-device.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { ComplianceHistoryTab } from "@/components/intune/tabs/compliance-history-tab";
import { RelatedItemsTab } from "@/components/intune/tabs/related-items-tab";
import { CreateAssetFromDeviceWizard } from "@/components/intune/create-asset-from-device-wizard";
import { formatDateTime } from "@/lib/utils/date-format";

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
  const canCreateAsset = hasPermission(PERMISSIONS.ASSETS_CREATE) && canLink;

  // Create Asset wizard state
  const [createAssetOpen, setCreateAssetOpen] = useState(false);

  // Link to Asset dialog state
  const [linkAssetOpen, setLinkAssetOpen] = useState(false);
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [isLinkingAsset, setIsLinkingAsset] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Link to Person dialog state
  const [linkPersonOpen, setLinkPersonOpen] = useState(false);
  const [persons, setPersons] = useState<PersonDTO[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [isLinkingPerson, setIsLinkingPerson] = useState(false);
  const [loadingPersons, setLoadingPersons] = useState(false);

  const isWindows = device.operatingSystem?.toLowerCase().includes("windows");

  // Calculate stats
  const daysSinceEnrollment = device.enrolledDateTime
    ? Math.floor(
        (Date.now() - new Date(device.enrolledDateTime).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const daysSinceLastSync = device.lastSyncDateTime
    ? Math.floor(
        (Date.now() - new Date(device.lastSyncDateTime).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const isCompliant = device.complianceState === "COMPLIANT";
  const hasAssetLink = !!device.linkedAssetId;
  const hasPersonLink = !!device.linkedPersonId;

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

  // Load assets for linking dialog
  const loadAssets = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const result = await listAssetsAction();
      if (result.success && result.data) {
        // Filter out assets that already have an Intune device linked
        setAssets(result.data);
      }
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  // Load persons for linking dialog
  const loadPersons = useCallback(async () => {
    setLoadingPersons(true);
    try {
      const result = await listPersonsAction();
      if (result.success && result.data) {
        // Filter to only active persons
        setPersons(result.data.filter((p) => p.isActive));
      }
    } catch {
      toast.error("Failed to load persons");
    } finally {
      setLoadingPersons(false);
    }
  }, []);

  // Handle linking device to asset
  const handleLinkAsset = async () => {
    if (!selectedAssetId) return;

    setIsLinkingAsset(true);
    try {
      const result = await linkDeviceToAssetAction({
        deviceId: device.id,
        assetId: selectedAssetId,
      });
      if (result.success) {
        toast.success("Device linked to asset");
        setLinkAssetOpen(false);
        setSelectedAssetId("");
        await refreshDevice();
      } else {
        toast.error(result.error ?? "Failed to link device to asset");
      }
    } catch {
      toast.error("Failed to link device to asset");
    } finally {
      setIsLinkingAsset(false);
    }
  };

  // Handle linking device to person
  const handleLinkPerson = async () => {
    if (!selectedPersonId) return;

    setIsLinkingPerson(true);
    try {
      const result = await linkDeviceToPersonAction({
        deviceId: device.id,
        personId: selectedPersonId,
      });
      if (result.success) {
        toast.success("Device linked to person");
        setLinkPersonOpen(false);
        setSelectedPersonId("");
        await refreshDevice();
      } else {
        toast.error(result.error ?? "Failed to link device to person");
      }
    } catch {
      toast.error("Failed to link device to person");
    } finally {
      setIsLinkingPerson(false);
    }
  };

  // Open asset linking dialog
  const openLinkAssetDialog = () => {
    setLinkAssetOpen(true);
    loadAssets();
  };

  // Open person linking dialog
  const openLinkPersonDialog = () => {
    setLinkPersonOpen(true);
    loadPersons();
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isCompliant
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900"
              }`}
            >
              {isCompliant ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Compliance</p>
              <p
                className={`font-semibold ${isCompliant ? "text-green-600" : "text-red-600"}`}
              >
                {getComplianceStateLabel(device.complianceState)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Calendar className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Enrolled</p>
              <p className="font-semibold">
                {daysSinceEnrollment !== null
                  ? `${daysSinceEnrollment} day${daysSinceEnrollment !== 1 ? "s" : ""} ago`
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                daysSinceLastSync !== null && daysSinceLastSync > 7
                  ? "bg-amber-100 dark:bg-amber-900"
                  : "bg-muted"
              }`}
            >
              <Clock
                className={`h-5 w-5 ${
                  daysSinceLastSync !== null && daysSinceLastSync > 7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last Sync</p>
              <p
                className={`font-semibold ${
                  daysSinceLastSync !== null && daysSinceLastSync > 7
                    ? "text-amber-600"
                    : ""
                }`}
              >
                {daysSinceLastSync !== null
                  ? daysSinceLastSync === 0
                    ? "Today"
                    : `${daysSinceLastSync} day${daysSinceLastSync !== 1 ? "s" : ""} ago`
                  : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                hasAssetLink && hasPersonLink
                  ? "bg-green-100 dark:bg-green-900"
                  : hasAssetLink || hasPersonLink
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-muted"
              }`}
            >
              <LinkIcon
                className={`h-5 w-5 ${
                  hasAssetLink && hasPersonLink
                    ? "text-green-600 dark:text-green-400"
                    : hasAssetLink || hasPersonLink
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">ITAM Links</p>
              <p className="font-semibold">
                {hasAssetLink && hasPersonLink
                  ? "Fully Linked"
                  : hasAssetLink
                    ? "Asset Linked"
                    : hasPersonLink
                      ? "Person Linked"
                      : "Not Linked"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="links">ITAM Links</TabsTrigger>
          <TabsTrigger value="related">Related Items</TabsTrigger>
          <TabsTrigger value="compliance-history">
            Compliance History
          </TabsTrigger>
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
                    <p>{formatDateTime(device.enrolledDateTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Intune Sync</p>
                    <p>{formatDateTime(device.lastSyncDateTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last ITAM Sync</p>
                    <p>{formatDateTime(device.lastSyncedFromIntune)}</p>
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
                    <div className="flex flex-col items-center gap-2">
                      {canLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openLinkAssetDialog}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Link to Asset
                        </Button>
                      )}
                      {canCreateAsset &&
                        device.serialNumber &&
                        device.serialNumber !== "0" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setCreateAssetOpen(true)}
                            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Create Asset
                          </Button>
                        )}
                    </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openLinkPersonDialog}
                      >
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

        {/* Related Items Tab */}
        <TabsContent value="related">
          <RelatedItemsTab device={device} />
        </TabsContent>

        {/* Compliance History Tab */}
        <TabsContent value="compliance-history">
          <ComplianceHistoryTab deviceId={device.id} />
        </TabsContent>
      </Tabs>

      {/* Link to Asset Dialog */}
      <Dialog open={linkAssetOpen} onOpenChange={setLinkAssetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link Device to Asset</DialogTitle>
            <DialogDescription>
              Select an ITAM asset to link to this Intune device. This creates a
              cross-reference for asset tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingAssets ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading assets...</span>
              </div>
            ) : (
              <SearchableSelect
                options={assets.map((asset) => ({
                  value: asset.id,
                  label: `${asset.assetTag}${asset.serialNumber ? ` (SN: ${asset.serialNumber})` : ""} - ${asset.categoryName ?? "Unknown Category"}`,
                }))}
                value={selectedAssetId}
                onValueChange={setSelectedAssetId}
                placeholder="Select an asset..."
                searchPlaceholder="Search by tag, serial, category..."
                maxVisibleItems={8}
              />
            )}
            {device.serialNumber && (
              <p className="text-muted-foreground text-sm">
                Tip: This device has serial number{" "}
                <span className="font-mono">{device.serialNumber}</span>. Look
                for an asset with a matching serial number.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkAssetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkAsset}
              disabled={!selectedAssetId || isLinkingAsset}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              {isLinkingAsset ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Person Dialog */}
      <Dialog open={linkPersonOpen} onOpenChange={setLinkPersonOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link Device to Person</DialogTitle>
            <DialogDescription>
              Select a person to link to this Intune device. This creates a
              cross-reference for ownership tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingPersons ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading persons...</span>
              </div>
            ) : (
              <SearchableSelect
                options={persons.map((person) => ({
                  value: person.id,
                  label: `${person.firstName} ${person.lastName} (${person.email})`,
                }))}
                value={selectedPersonId}
                onValueChange={setSelectedPersonId}
                placeholder="Select a person..."
                searchPlaceholder="Search by name or email..."
                maxVisibleItems={8}
              />
            )}
            {device.userDisplayName && (
              <p className="text-muted-foreground text-sm">
                Tip: This device is assigned to{" "}
                <span className="font-medium">{device.userDisplayName}</span> in
                Intune ({device.userPrincipalName}). Look for a matching person.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkPersonOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkPerson}
              disabled={!selectedPersonId || isLinkingPerson}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              {isLinkingPerson ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Person"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Asset Wizard */}
      <CreateAssetFromDeviceWizard
        device={device}
        open={createAssetOpen}
        onOpenChange={setCreateAssetOpen}
        onSuccess={refreshDevice}
      />
    </div>
  );
}
