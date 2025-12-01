/**
 * Service Detail View Component
 *
 * Refactored to use extracted components for better maintainability and DRY compliance.
 */

"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Trash2, XCircle, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ServiceHealthHistoryDTO,
  ServiceSlaMetricDTO,
} from "@/interface-adapters/presenters/service.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { ServiceStatus } from "@/generated/prisma/enums";

// Extracted hooks and utilities
import { useServiceActions } from "@/hooks/use-service-actions";
import {
  getStatusBadgeVariant,
  getCriticalityBadgeVariant,
  formatEnumValue,
  formatServiceDateTime,
} from "@/lib/services/service-display-utils";

// Extracted components
import { ServiceActionDialog } from "./service-action-dialogs";
import {
  DetailField,
  DetailDateField,
  ConditionalDetailField,
} from "./service-detail-fields";
import { ServiceDependenciesTab } from "./dependencies/service-dependencies-tab";
import { ServiceOwnersManager } from "./service-owners-manager";
import { ServiceHealthBadge } from "./service-health-badge";
import { ServiceSlaBadge } from "./service-sla-badge";
import { ServiceHealthMonitoringCard } from "./service-health-monitoring-card";
import { ServiceHealthHistoryTable } from "./service-health-history-table";
import { ServiceSlaMonitoringCard } from "./service-sla-monitoring-card";
import { ServiceSlaMetricsTable } from "./service-sla-metrics-table";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";

interface ServiceDetailViewProps {
  service: ServiceDTO;
  owners: ServiceOwnerDTO[];
  infrastructure: ServiceInfrastructureDTO | null;
  linkedAssets: ServiceAssetDTO[];
  persons: PersonDTO[];
  healthHistory: ServiceHealthHistoryDTO[];
  slaMetrics: ServiceSlaMetricDTO[];
  healthSlaEnabled: boolean;
}

export function ServiceDetailView({
  service,
  owners,
  infrastructure,
  linkedAssets,
  persons,
  healthHistory,
  slaMetrics,
  healthSlaEnabled,
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
  const overviewContent = (
    <div className="space-y-4">
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
          <ConditionalDetailField label="Service URL" value={service.url} />
          <ConditionalDetailField
            label="Support Contact"
            value={service.supportContact}
          />
          <ConditionalDetailField
            label="Support Hours"
            value={service.supportHours}
          />
          <ConditionalDetailField
            label="GitLab Repository"
            value={service.gitlabRepoUrl}
          />
          <ConditionalDetailField
            label="Health Check URL"
            value={service.healthCheckUrl}
          />
          <ConditionalDetailField
            label="SLA Contact Email"
            value={service.slaContactEmail}
          />
          <ConditionalDetailField
            label="SLA Support Tier"
            value={service.slaSupportTier}
          />
          <DetailField
            label="Criticality"
            value={service.criticality}
            formatValue={formatEnumValue}
          />
          <DetailField
            label="Current Status"
            value={service.currentStatus}
            formatValue={formatEnumValue}
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

      {/* Ownership Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Service Ownership
          </CardTitle>
        </CardHeader>
        <CardContent>
          {owners.length > 0 ? (
            <div className="space-y-4">
              {/* Primary Business Owner */}
              {owners
                .filter((o) => o.ownershipType === "BUSINESS" && o.isPrimary)
                .map((owner) => (
                  <div key={owner.id} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs font-semibold uppercase">
                        Primary Business Owner
                      </p>
                      <p className="text-sm font-medium">
                        {owner.personName || "Unknown"}
                      </p>
                      {owner.personEmail && (
                        <p className="text-muted-foreground text-xs">
                          {owner.personEmail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              {/* Primary Technical Owner */}
              {owners
                .filter((o) => o.ownershipType === "TECHNICAL" && o.isPrimary)
                .map((owner) => (
                  <div key={owner.id} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs font-semibold uppercase">
                        Primary Technical Owner
                      </p>
                      <p className="text-sm font-medium">
                        {owner.personName || "Unknown"}
                      </p>
                      {owner.personEmail && (
                        <p className="text-muted-foreground text-xs">
                          {owner.personEmail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              {/* Additional Owners */}
              {owners.filter((o) => !o.isPrimary).length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
                    Additional Owners (
                    {owners.filter((o) => !o.isPrimary).length})
                  </p>
                  <div className="space-y-2">
                    {owners
                      .filter((o) => !o.isPrimary)
                      .map((owner) => (
                        <div
                          key={owner.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <span>{owner.personName || "Unknown"}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatEnumValue(owner.ownershipType)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <User className="text-muted-foreground/30 mx-auto mb-2 h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                No owners assigned to this service
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const healthSlaContent = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ServiceHealthMonitoringCard service={service} />
        <ServiceSlaMonitoringCard service={service} />
      </div>
      <ServiceHealthHistoryTable histories={healthHistory} />
      <ServiceSlaMetricsTable metrics={slaMetrics} />
    </div>
  );

  const ownersContent = (
    <div className="space-y-4">
      <ServiceOwnersManager
        serviceId={service.id}
        owners={owners}
        persons={persons}
      />
    </div>
  );

  const infrastructureContent = (
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
                <p className="font-mono text-sm">{infrastructure.ipAddress}</p>
              </div>
            )}
            {infrastructure.hostname && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Hostname
                </p>
                <p className="font-mono text-sm">{infrastructure.hostname}</p>
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
  );

  const assetsContent = (
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
  );

  const dependenciesContent = (
    <ServiceDependenciesTab serviceId={service.id} serviceName={service.name} />
  );

  const historyContent = (
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
  );

  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: overviewContent,
      showWhenZero: true,
    },
    {
      value: "health-sla",
      label: "Health & SLA",
      canView: healthSlaEnabled,
      content: healthSlaContent,
      showWhenZero: true,
    },
    {
      value: "owners",
      label: "Owners",
      count: owners.length,
      content: ownersContent,
    },
    {
      value: "infrastructure",
      label: "Infrastructure",
      canView: !!infrastructure,
      count: infrastructure ? 1 : 0,
      content: infrastructureContent,
    },
    {
      value: "assets",
      label: "Linked Assets",
      count: linkedAssets.length,
      content: assetsContent,
    },
    {
      value: "dependencies",
      label: "Dependencies",
      content: dependenciesContent,
      showWhenZero: true,
    },
    {
      value: "history",
      label: "History",
      count: healthHistory.length,
      content: historyContent,
      showWhenZero: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={getStatusBadgeVariant(service.currentStatus)}>
              {service.currentStatus}
            </Badge>
            <Badge variant={getCriticalityBadgeVariant(service.criticality)}>
              {service.criticality}
            </Badge>
            {service.isEssentialService && (
              <Badge variant="outline">Essential Service</Badge>
            )}
            {healthSlaEnabled && (
              <>
                <ServiceHealthBadge status={service.healthStatus} />
                {service.hasSlaTargets && (
                  <ServiceSlaBadge status={service.slaComplianceStatus} />
                )}
              </>
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

      <CountedTabs defaultValue="overview" tabs={tabs} tabsClassName="w-full" />

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
