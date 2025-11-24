/**
 * Service Detail View Component
 *
 * Refactored to use extracted components for better maintainability and DRY compliance.
 */

"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { ServiceStatus } from "@/generated/prisma/enums";

// Extracted hooks and utilities
import { useServiceActions } from "@/hooks/use-service-actions";
import {
  getStatusBadgeVariant,
  getCriticalityBadgeVariant,
  groupOwnersByType,
  formatEnumValue,
  formatServiceDateTime,
} from "@/lib/services/service-display-utils";

// Extracted components
import { ServiceActionDialog } from "./service-action-dialogs";
import {
  DetailField,
  DetailDateField,
  ConditionalDetailField,
  ConditionalDetailLinkField,
} from "./service-detail-fields";

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

  // Use extracted hook for all service actions
  const {
    deleteDialog,
    retireDialog,
    isDeleting,
    isRetiring,
    handleDelete,
    handleRetire,
  } = useServiceActions(service);

  // Use extracted utility function
  const groupedOwners = groupOwnersByType(owners);

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
                onClick={() => retireDialog.setOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Retire
              </Button>
            )}
          {hasPermission(PERMISSIONS.SERVICES_DELETE) && (
            <Button
              variant="destructive"
              onClick={() => deleteDialog.setOpen(true)}
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
              <DetailField
                label="Service Type"
                value={service.serviceType}
                formatValue={formatEnumValue}
              />
              <DetailField
                label="Business Impact Level"
                value={service.businessImpactLevel}
              />
              <DetailField
                label="Data Confidentiality"
                value={service.dataConfidentiality}
              />
              <DetailDateField
                label="Deployment Date"
                date={service.deploymentDate}
              />
              <ConditionalDetailField
                label="Description"
                value={service.description}
                className="col-span-2"
              />
              <ConditionalDetailField
                label="Business Purpose"
                value={service.businessPurpose}
                className="col-span-2"
              />
              <ConditionalDetailLinkField
                label="GitLab Repository"
                url={service.gitlabRepoUrl}
                className="col-span-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle & Governance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailDateField
                label="Last Patch Date"
                date={service.lastPatchDate}
              />
              <DetailDateField
                label="Planned Decommission"
                date={service.plannedDecommissionDate}
              />
              <DetailField label="Vendor" value={service.vendorName} />
              <DetailField
                label="Business Process"
                value={service.businessProcessName}
              />
              <DetailField
                label="In Central Register"
                value={service.isInCentralRegister ? "Yes" : "No"}
              />
              <ConditionalDetailField
                label="Compliance Notes"
                value={service.complianceNotes}
                className="col-span-2"
              />
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
              <DetailField
                label="Created At"
                value={formatServiceDateTime(service.createdAt)}
              />
              <DetailField label="Created By" value={service.createdBy} />
              <DetailField
                label="Updated At"
                value={formatServiceDateTime(service.updatedAt)}
              />
              <DetailField label="Updated By" value={service.updatedBy} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <ServiceActionDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.setOpen}
        serviceName={service.name}
        actionType="delete"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
      />

      <ServiceActionDialog
        open={retireDialog.open}
        onOpenChange={retireDialog.setOpen}
        serviceName={service.name}
        actionType="retire"
        isProcessing={isRetiring}
        onConfirm={handleRetire}
      />
    </div>
  );
}
