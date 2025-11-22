/**
 * Service Detail View Component
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  ServiceDTO,
  ServiceOwnerDTO,
  ServiceInfrastructureDTO,
  ServiceAssetDTO,
} from "@/interface-adapters/presenters/service.presenter";
import {
  deleteServiceAction,
  retireServiceAction,
} from "@/interface-adapters/controllers/service.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { ServiceStatus, CriticalityLevel } from "@/generated/prisma/enums";

interface ServiceDetailViewProps {
  service: ServiceDTO;
  owners: ServiceOwnerDTO[];
  infrastructure: ServiceInfrastructureDTO | null;
  linkedAssets: ServiceAssetDTO[];
}

export function ServiceDetailView({
  service,
  owners,
  infrastructure,
  linkedAssets,
}: ServiceDetailViewProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRetiring, setIsRetiring] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteServiceAction(service.id);
      if (result.success) {
        toast.success("Service deleted successfully");
        router.push("/services");
      } else {
        toast.error(result.error || "Failed to delete service");
      }
    } catch (_error) {
      toast.error("Failed to delete service");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRetire = async () => {
    setIsRetiring(true);
    try {
      const result = await retireServiceAction(service.id);
      if (result.success) {
        toast.success("Service retired successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to retire service");
      }
    } catch (_error) {
      toast.error("Failed to retire service");
    } finally {
      setIsRetiring(false);
      setRetireDialogOpen(false);
    }
  };

  const getStatusBadgeVariant = (
    status: ServiceStatus,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case ServiceStatus.PRODUCTION:
        return "default";
      case ServiceStatus.RETIRED:
        return "secondary";
      case ServiceStatus.UAT:
        return "outline";
      default:
        return "outline";
    }
  };

  const getCriticalityBadgeVariant = (
    criticality: CriticalityLevel,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (criticality) {
      case CriticalityLevel.CRITICAL:
        return "destructive";
      case CriticalityLevel.HIGH:
        return "default";
      case CriticalityLevel.MEDIUM:
        return "outline";
      case CriticalityLevel.LOW:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const groupOwnersByType = () => {
    const grouped: Record<string, ServiceOwnerDTO[]> = {
      TECHNICAL: [],
      PRODUCT: [],
      BUSINESS: [],
    };

    owners.forEach((owner) => {
      if (grouped[owner.ownershipType]) {
        grouped[owner.ownershipType].push(owner);
      }
    });

    return grouped;
  };

  const groupedOwners = groupOwnersByType();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant={getStatusBadgeVariant(service.currentStatus)}>
              {service.currentStatus}
            </Badge>
            <Badge variant={getCriticalityBadgeVariant(service.criticality)}>
              {service.criticality}
            </Badge>
            {service.isEssentialService && (
              <Badge variant="outline">Essential Service</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.SERVICES_UPDATE) && (
            <Button onClick={() => router.push(`/services/${service.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {hasPermission(PERMISSIONS.SERVICES_RETIRE) &&
            service.currentStatus !== ServiceStatus.RETIRED && (
              <Button
                variant="outline"
                onClick={() => setRetireDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Retire
              </Button>
            )}
          {hasPermission(PERMISSIONS.SERVICES_DELETE) && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="owners">Owners ({owners.length})</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="assets">
            Linked Assets ({linkedAssets.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Service Type
                </p>
                <p className="text-sm">
                  {service.serviceType.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Business Impact Level
                </p>
                <p className="text-sm">{service.businessImpactLevel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Data Confidentiality
                </p>
                <p className="text-sm">{service.dataConfidentiality}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Deployment Date
                </p>
                <p className="text-sm">
                  {service.deploymentDate
                    ? format(new Date(service.deploymentDate), "MMM d, yyyy")
                    : "—"}
                </p>
              </div>
              {service.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Description
                  </p>
                  <p className="text-sm">{service.description}</p>
                </div>
              )}
              {service.businessPurpose && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Business Purpose
                  </p>
                  <p className="text-sm">{service.businessPurpose}</p>
                </div>
              )}
              {service.gitlabRepoUrl && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    GitLab Repository
                  </p>
                  <a
                    href={service.gitlabRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    {service.gitlabRepoUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle & Governance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Last Patch Date
                </p>
                <p className="text-sm">
                  {service.lastPatchDate
                    ? format(new Date(service.lastPatchDate), "MMM d, yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Planned Decommission
                </p>
                <p className="text-sm">
                  {service.plannedDecommissionDate
                    ? format(
                        new Date(service.plannedDecommissionDate),
                        "MMM d, yyyy",
                      )
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Vendor
                </p>
                <p className="text-sm">{service.vendorName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Business Process
                </p>
                <p className="text-sm">{service.businessProcessName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  In Central Register
                </p>
                <p className="text-sm">
                  {service.isInCentralRegister ? "Yes" : "No"}
                </p>
              </div>
              {service.complianceNotes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Compliance Notes
                  </p>
                  <p className="text-sm">{service.complianceNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owners Tab */}
        <TabsContent value="owners" className="space-y-4">
          {Object.entries(groupedOwners).map(([type, typeOwners]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{type} Owners</CardTitle>
              </CardHeader>
              <CardContent>
                {typeOwners.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No {type.toLowerCase()} owners assigned
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeOwners.map((owner) => (
                        <TableRow key={owner.id}>
                          <TableCell>{owner.personName || "Unknown"}</TableCell>
                          <TableCell>{owner.personEmail || "—"}</TableCell>
                          <TableCell>
                            {owner.isPrimary && (
                              <Badge variant="outline">Primary</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!infrastructure ? (
                <p className="text-muted-foreground text-sm">
                  No infrastructure details configured
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Location
                    </p>
                    <p className="text-sm">{infrastructure.location}</p>
                  </div>
                  {infrastructure.cloudProvider && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Cloud Provider
                      </p>
                      <p className="text-sm">{infrastructure.cloudProvider}</p>
                    </div>
                  )}
                  {infrastructure.region && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Region
                      </p>
                      <p className="text-sm">{infrastructure.region}</p>
                    </div>
                  )}
                  {infrastructure.compartment && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Compartment
                      </p>
                      <p className="text-sm">{infrastructure.compartment}</p>
                    </div>
                  )}
                  {infrastructure.project && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Project
                      </p>
                      <p className="text-sm">{infrastructure.project}</p>
                    </div>
                  )}
                  {infrastructure.ipAddress && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        IP Address
                      </p>
                      <p className="font-mono text-sm">
                        {infrastructure.ipAddress}
                      </p>
                    </div>
                  )}
                  {infrastructure.hostname && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Hostname
                      </p>
                      <p className="font-mono text-sm">
                        {infrastructure.hostname}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Backup Enabled
                    </p>
                    <p className="text-sm">
                      {infrastructure.backupEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                  {infrastructure.backupSchedule && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Backup Schedule
                      </p>
                      <p className="text-sm">{infrastructure.backupSchedule}</p>
                    </div>
                  )}
                  {infrastructure.lastBackupDate && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Last Backup
                      </p>
                      <p className="text-sm">
                        {format(
                          new Date(infrastructure.lastBackupDate),
                          "MMM d, yyyy HH:mm",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Linked Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {linkedAssets.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No assets linked to this service
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.assetTag || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.relationship}</Badge>
                        </TableCell>
                        <TableCell>{asset.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Created At
                </p>
                <p className="text-sm">
                  {format(new Date(service.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Created By
                </p>
                <p className="text-sm">{service.createdBy || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Updated At
                </p>
                <p className="text-sm">
                  {format(new Date(service.updatedAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Updated By
                </p>
                <p className="text-sm">{service.updatedBy || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete service &quot;{service.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Retire Confirmation Dialog */}
      <AlertDialog open={retireDialogOpen} onOpenChange={setRetireDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark service &quot;{service.name}&quot; as RETIRED. This
              action can be reversed by editing the service status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRetiring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetire}
              disabled={isRetiring}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isRetiring ? "Retiring..." : "Retire"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
