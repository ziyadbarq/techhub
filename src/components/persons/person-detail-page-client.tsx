/**
 * Person Detail Page Client
 *
 * Client component for displaying a person's 360-degree view.
 * Includes quick stats, tabs for different data categories, and action buttons.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Users,
  Package,
  Activity,
  Mail,
  Phone,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import type { PersonRelationCounts } from "@/interface-adapters/controllers/person-details.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  deletePersonAction,
  togglePersonExclusionAction,
} from "@/interface-adapters/controllers/person.controller";
import { PersonForm } from "@/components/persons/person-form";
import { PersonOverviewTab } from "@/components/persons/tabs/person-overview-tab";
import { PersonOrganizationTab } from "@/components/persons/tabs/person-organization-tab";
import { PersonAssetsTab } from "@/components/persons/tabs/person-assets-tab";
import { PersonServicesTab } from "@/components/persons/tabs/person-services-tab";
import { PersonGovernanceTab } from "@/components/persons/tabs/person-governance-tab";
import { PersonActivityTab } from "@/components/persons/tabs/person-activity-tab";

interface PersonDetailPageClientProps {
  person: EmployeeDirectoryDTO;
  counts: PersonRelationCounts | null;
  reportingChain: EmployeeDirectoryDTO[];
}

export function PersonDetailPageClient({
  person: initialPerson,
  counts,
  reportingChain,
}: PersonDetailPageClientProps) {
  const router = useRouter();
  const [person, setPerson] = useState(initialPerson);
  const { hasPermission } = usePermissions();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingExclusion, setIsTogglingExclusion] = useState(false);

  // Permission checks
  const canUpdate = hasPermission(PERMISSIONS.PERSONS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.PERSONS_DELETE);
  const canManage = hasPermission(PERMISSIONS.PERSONS_MANAGE);

  // Calculate stats for quick stats cards
  const totalAssets =
    (counts?.intuneDevices ?? 0) +
    (counts?.assetReservations ?? 0) +
    (counts?.kitCheckouts ?? 0);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    router.refresh();
  }, [router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePersonAction(person.id);
      if (result.success) {
        toast.success(`${person.fullName} has been deleted`);
        router.push("/persons");
      } else {
        toast.error(result.error ?? "Failed to delete person");
      }
    } catch {
      toast.error("Failed to delete person");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleExclusion = async () => {
    setIsTogglingExclusion(true);
    try {
      const newExcluded = !person.isExcluded;
      const result = await togglePersonExclusionAction(person.id, newExcluded);
      if (result.success) {
        setPerson({ ...person, isExcluded: newExcluded });
        toast.success(
          newExcluded
            ? `${person.fullName} has been excluded`
            : `${person.fullName} has been included`,
        );
      } else {
        toast.error(result.error ?? "Failed to update exclusion status");
      }
    } catch {
      toast.error("Failed to update exclusion status");
    } finally {
      setIsTogglingExclusion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/persons")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Persons
          </Button>
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              firstName={person.firstName}
              lastName={person.lastName}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {person.fullName}
              </h1>
              <p className="text-muted-foreground">
                {person.title ?? "No title"} • {person.orgUnitName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {person.isActive ? (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </Badge>
                )}
                {person.isExcluded && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600"
                  >
                    Excluded
                  </Badge>
                )}
                {person.employeeId && (
                  <Badge variant="outline">ID: {person.employeeId}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {person.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${person.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
          )}
          {(person.phone || person.mobile) && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${person.mobile || person.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExclusion}
              disabled={isTogglingExclusion}
            >
              {isTogglingExclusion ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : person.isExcluded ? (
                <UserCheck className="mr-2 h-4 w-4" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              {person.isExcluded ? "Include" : "Exclude"}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Role & Organization */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Building2 className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Role</p>
              <p className="font-semibold">{person.title ?? "Not set"}</p>
              <p className="text-muted-foreground text-xs">
                {person.orgUnitName}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (counts?.directReports ?? 0) > 0
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-muted"
              }`}
            >
              <Users
                className={`h-5 w-5 ${
                  (counts?.directReports ?? 0) > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Team</p>
              <p className="font-semibold">
                {counts?.directReports ?? 0} direct report
                {(counts?.directReports ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-muted-foreground text-xs">
                {(counts?.directReports ?? 0) > 0
                  ? "Manager"
                  : "Individual Contributor"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assets & Devices */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                totalAssets > 0 ? "bg-green-100 dark:bg-green-900" : "bg-muted"
              }`}
            >
              <Package
                className={`h-5 w-5 ${
                  totalAssets > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Assets & Devices</p>
              <p className="font-semibold">
                {totalAssets} item{totalAssets !== 1 ? "s" : ""}
              </p>
              <p className="text-muted-foreground text-xs">
                {counts?.intuneDevices ?? 0} device
                {(counts?.intuneDevices ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Activity className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Activity</p>
              <p className="font-semibold">
                {(counts?.stockMovements ?? 0) +
                  (counts?.verificationItems ?? 0) +
                  (counts?.attachments ?? 0)}{" "}
                action
                {(counts?.stockMovements ?? 0) +
                  (counts?.verificationItems ?? 0) +
                  (counts?.attachments ?? 0) !==
                1
                  ? "s"
                  : ""}
              </p>
              <p className="text-muted-foreground text-xs">Total activities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organization">
            Organization
            {(counts?.directReports ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {counts?.directReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assets">
            Assets & Licenses
            {totalAssets > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalAssets}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="services">
            Services & CMDB
            {(counts?.serviceOwnerships ?? 0) +
              (counts?.configurationItems ?? 0) >
              0 && (
              <Badge variant="secondary" className="ml-2">
                {(counts?.serviceOwnerships ?? 0) +
                  (counts?.configurationItems ?? 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="governance">
            Governance
            {(counts?.verificationCampaigns ?? 0) +
              (counts?.verificationItems ?? 0) >
              0 && (
              <Badge variant="secondary" className="ml-2">
                {(counts?.verificationCampaigns ?? 0) +
                  (counts?.verificationItems ?? 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PersonOverviewTab person={person} reportingChain={reportingChain} />
        </TabsContent>

        <TabsContent value="organization">
          <PersonOrganizationTab
            personId={person.id}
            reportingChain={reportingChain}
            directReportsCount={counts?.directReports ?? 0}
            roleAssignmentsCount={counts?.roleAssignments ?? 0}
          />
        </TabsContent>

        <TabsContent value="assets">
          <PersonAssetsTab
            personId={person.id}
            counts={{
              intuneDevices: counts?.intuneDevices ?? 0,
              assetReservations: counts?.assetReservations ?? 0,
              kitCheckouts: counts?.kitCheckouts ?? 0,
              stockMovements: counts?.stockMovements ?? 0,
              maintenanceSchedules: counts?.maintenanceSchedules ?? 0,
            }}
          />
        </TabsContent>

        <TabsContent value="services">
          <PersonServicesTab
            personId={person.id}
            counts={{
              serviceOwnerships: counts?.serviceOwnerships ?? 0,
              configurationItems: counts?.configurationItems ?? 0,
              dataOwnerships: counts?.dataOwnerships ?? 0,
            }}
          />
        </TabsContent>

        <TabsContent value="governance">
          <PersonGovernanceTab
            personId={person.id}
            counts={{
              verificationCampaigns: counts?.verificationCampaigns ?? 0,
              verificationItems: counts?.verificationItems ?? 0,
              attachments: counts?.attachments ?? 0,
              initiatedDisposals: counts?.initiatedDisposals ?? 0,
              approvedDisposals: counts?.approvedDisposals ?? 0,
            }}
          />
        </TabsContent>

        <TabsContent value="activity">
          <PersonActivityTab personId={person.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <PersonForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormClose}
        person={{
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: null,
          email: person.email,
          phone: person.phone,
          employeeId: person.employeeId,
          organizationUnitId: person.orgUnitId,
          primaryRoleId: "", // Not available in EmployeeDirectoryDTO - form will load from server
          locationId: person.locationId,
          managerId: person.managerId,
          title: person.title,
          department: person.department,
          hireDate: person.hireDate,
          terminationDate: null,
          isActive: person.isActive,
          metadata: null,
          createdAt: "",
          updatedAt: "",
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {person.fullName}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
