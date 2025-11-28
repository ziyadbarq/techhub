"use client";

/**
 * Related Items Tab
 *
 * Displays items related to an Intune device such as linked assets and persons.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  User,
  Calendar,
  Tag,
  MapPin,
  Building2,
  FileText,
  Loader2,
  ExternalLink,
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
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import { getAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { getPersonAction } from "@/interface-adapters/controllers/person.controller";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";

interface RelatedItemsTabProps {
  device: IntuneDeviceDTO;
}

export function RelatedItemsTab({ device }: RelatedItemsTabProps) {
  const [asset, setAsset] = useState<AssetDTO | null>(null);
  const [person, setPerson] = useState<PersonDTO | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [loadingPerson, setLoadingPerson] = useState(false);

  // Load linked asset details
  const loadAsset = useCallback(async () => {
    if (!device.linkedAssetId) return;

    setLoadingAsset(true);
    try {
      const result = await getAssetAction(device.linkedAssetId);
      if (result.success && result.data) {
        setAsset(result.data);
      }
    } catch {
      toast.error("Failed to load asset details");
    } finally {
      setLoadingAsset(false);
    }
  }, [device.linkedAssetId]);

  // Load linked person details
  const loadPerson = useCallback(async () => {
    if (!device.linkedPersonId) return;

    setLoadingPerson(true);
    try {
      const result = await getPersonAction(device.linkedPersonId);
      if (result.success && result.data) {
        setPerson(result.data);
      }
    } catch {
      toast.error("Failed to load person details");
    } finally {
      setLoadingPerson(false);
    }
  }, [device.linkedPersonId]);

  useEffect(() => {
    loadAsset();
    loadPerson();
  }, [loadAsset, loadPerson]);

  const hasLinkedAsset = !!device.linkedAssetId;
  const hasLinkedPerson = !!device.linkedPersonId;
  const hasNoLinks = !hasLinkedAsset && !hasLinkedPerson;

  return (
    <div className="space-y-6">
      {hasNoLinks && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              This device has no linked assets or persons.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Use the &quot;ITAM Links&quot; tab to link this device to existing
              assets or persons.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Linked Asset Card */}
      {hasLinkedAsset && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-muted-foreground h-5 w-5" />
                <CardTitle>Linked Asset</CardTitle>
              </div>
              <Link href={`/assets/${device.linkedAssetTag}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Asset
                </Button>
              </Link>
            </div>
            <CardDescription>
              Asset linked via{" "}
              {device.assetLinkMethod === "auto_serial"
                ? "serial number (auto)"
                : "manual link"}
              {device.assetLinkedAt &&
                ` on ${new Date(device.assetLinkedAt).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAsset ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground ml-2">
                  Loading asset...
                </span>
              </div>
            ) : asset ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Asset Tag</p>
                      <p className="font-mono font-medium">{asset.assetTag}</p>
                    </div>
                  </div>

                  {asset.serialNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Serial Number
                        </p>
                        <p className="font-mono">{asset.serialNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Package className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Category</p>
                      <p>{asset.categoryName ?? "Uncategorized"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {asset.vendorName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">Vendor</p>
                        <p>{asset.vendorName}</p>
                      </div>
                    </div>
                  )}

                  {asset.modelName && (
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">Model</p>
                        <p>{asset.modelName}</p>
                      </div>
                    </div>
                  )}

                  {asset.stockLocationName && (
                    <div className="flex items-center gap-2">
                      <MapPin className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Location
                        </p>
                        <p>{asset.stockLocationName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="col-span-full flex flex-wrap gap-2 border-t pt-4">
                  {asset.lifecycleStateName && (
                    <Badge variant="secondary">
                      {asset.lifecycleStateName}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                Asset details not available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Person Card */}
      {hasLinkedPerson && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-5 w-5" />
                <CardTitle>Linked Person</CardTitle>
              </div>
              <Link href={`/people/${device.linkedPersonId}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Person
                </Button>
              </Link>
            </div>
            <CardDescription>
              Person linked via{" "}
              {device.personLinkMethod === "auto_azuread"
                ? "Azure AD (auto)"
                : "manual link"}
              {device.personLinkedAt &&
                ` on ${new Date(device.personLinkedAt).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPerson ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground ml-2">
                  Loading person...
                </span>
              </div>
            ) : person ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Full Name</p>
                      <p className="font-medium">
                        {person.firstName} {person.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <p>{person.email}</p>
                    </div>
                  </div>

                  {person.employeeId && (
                    <div className="flex items-center gap-2">
                      <Tag className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Employee ID
                        </p>
                        <p className="font-mono">{person.employeeId}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {person.title && (
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Job Title
                        </p>
                        <p>{person.title}</p>
                      </div>
                    </div>
                  )}

                  {person.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Department
                        </p>
                        <p>{person.department}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="col-span-full flex flex-wrap gap-2 border-t pt-4">
                  <Badge
                    variant={person.isActive ? "default" : "secondary"}
                    className={
                      person.isActive ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    {person.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {person.hireDate && (
                    <Badge variant="outline">
                      <Calendar className="mr-1 h-3 w-3" />
                      Hired {new Date(person.hireDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                Person details not available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Intune User Info (for comparison) */}
      {device.userDisplayName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="text-muted-foreground h-4 w-4" />
              Intune User Assignment
            </CardTitle>
            <CardDescription>
              User assigned to this device in Microsoft Intune
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{device.userDisplayName}</p>
                <p className="text-muted-foreground text-sm">
                  {device.userPrincipalName}
                </p>
              </div>
              {device.intuneUserId && (
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {device.intuneUserId.slice(0, 8)}...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
