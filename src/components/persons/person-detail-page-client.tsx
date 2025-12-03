/**
 * Person Detail Page Client
 *
 * Client component for displaying a person's 360-degree view.
 * Includes quick stats, tabs for different data categories, and action buttons.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
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
  UserPlus,
  RefreshCw,
  Link2,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import type {
  PersonRelationCounts,
  PersonLinkedUserDTO,
} from "@/interface-adapters/controllers/person-details.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import {
  deletePersonAction,
  togglePersonExclusionAction,
} from "@/interface-adapters/controllers/person.controller";
import {
  getPersonDetailsAction,
  getPersonLinkedUserAction,
} from "@/interface-adapters/controllers/person-details.controller";
import { syncPersonFromGraphAction } from "@/interface-adapters/controllers/microsoft-graph.controller";
import {
  createUserForPersonAction,
  linkUserToPersonAction,
  listUnlinkedUsersForPersonAction,
} from "@/interface-adapters/controllers/user-provisioning.controller";
import type { UserForLinkingDTO } from "@/interface-adapters/controllers/user-provisioning.controller";
import { PersonForm } from "@/components/persons/person-form";
import { PersonOverviewTab } from "@/components/persons/tabs/person-overview-tab";
import { PersonOrganizationTab } from "@/components/persons/tabs/person-organization-tab";
import { PersonAssetsTab } from "@/components/persons/tabs/person-assets-tab";
import { PersonServicesTab } from "@/components/persons/tabs/person-services-tab";
import { PersonGovernanceTab } from "@/components/persons/tabs/person-governance-tab";
import { PersonActivityTab } from "@/components/persons/tabs/person-activity-tab";
import { formatDate } from "@/lib/utils/date-format";
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";

interface PersonDetailPageClientProps {
  person: EmployeeDirectoryDTO;
  counts: PersonRelationCounts | null;
  reportingChain: EmployeeDirectoryDTO[];
  intuneDevices: IntuneDeviceDTO[];
}

export function PersonDetailPageClient({
  person: initialPerson,
  counts,
  reportingChain,
  intuneDevices,
}: PersonDetailPageClientProps) {
  const router = useRouter();
  const [person, setPerson] = useState(initialPerson);
  const { hasPermission } = usePermissions();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingExclusion, setIsTogglingExclusion] = useState(false);

  // User provisioning states
  const [linkedUser, setLinkedUser] = useState<PersonLinkedUserDTO | null>(
    null,
  );
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isLinkUserDialogOpen, setIsLinkUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLinkingUser, setIsLinkingUser] = useState(false);
  const [matchingUsers, setMatchingUsers] = useState<UserForLinkingDTO[]>([]);
  const [isLoadingMatchingUsers, setIsLoadingMatchingUsers] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<
    "email" | "password" | "both" | null
  >(null);
  const [isSyncingFromGraph, setIsSyncingFromGraph] = useState(false);

  // Permission checks
  const canUpdate = hasPermission(PERMISSIONS.PERSONS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.PERSONS_DELETE);
  const canManage = hasPermission(PERMISSIONS.PERSONS_MANAGE);
  const canManageUsers = hasPermission(PERMISSIONS.USERS_MANAGE);
  const canSync = hasPermission(PERMISSIONS.PERSONS_SYNC);

  // Feature flag checks (type-safe)
  const isLicensesEnabled = useIsFeatureEnabled(
    FEATURE_FLAGS.LICENSE_MANAGEMENT,
  );
  const isAssetReservationsEnabled = useIsFeatureEnabled(
    FEATURE_FLAGS.ASSET_RESERVATIONS,
  );
  const isAssetKitsEnabled = useIsFeatureEnabled(FEATURE_FLAGS.ASSET_KITS);
  const isIntuneEnabled = useIsFeatureEnabled(FEATURE_FLAGS.INTUNE);
  const isServicesEnabled = useIsFeatureEnabled(
    FEATURE_FLAGS.SERVICE_MANAGEMENT,
  );
  const isCmdbEnabled = useIsFeatureEnabled(FEATURE_FLAGS.CMDB);
  const isGovernanceEnabled = useIsFeatureEnabled(FEATURE_FLAGS.GOVERNANCE);
  const isAttachmentsEnabled = useIsFeatureEnabled(FEATURE_FLAGS.ATTACHMENTS);
  const isAssetDisposalsEnabled = useIsFeatureEnabled(
    FEATURE_FLAGS.ASSET_DISPOSALS,
  );

  const isCountsLoading = !counts;
  const totalAssets =
    (intuneDevices.length || counts?.intuneDevices || 0) +
    (counts?.licenseAllocations ?? 0) +
    (counts?.assetReservations ?? 0) +
    (counts?.kitCheckouts ?? 0);
  const tabCount = (value: number | undefined) =>
    isCountsLoading ? undefined : (value ?? 0);
  const servicesAndCmdbCount =
    (counts?.serviceOwnerships ?? 0) + (counts?.configurationItems ?? 0);
  const governanceCount =
    (counts?.verificationCampaigns ?? 0) +
    (counts?.verificationItems ?? 0) +
    (counts?.attachments ?? 0) +
    (counts?.initiatedDisposals ?? 0) +
    (counts?.approvedDisposals ?? 0);
  const activityCount =
    (counts?.stockMovements ?? 0) +
    (counts?.verificationItems ?? 0) +
    (counts?.attachments ?? 0);
  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: (
        <PersonOverviewTab person={person} reportingChain={reportingChain} />
      ),
      showWhenZero: true,
    },
    {
      value: "organization",
      label: "Organization",
      count: tabCount(counts?.directReports),
      content: (
        <PersonOrganizationTab
          personId={person.id}
          reportingChain={reportingChain}
          directReportsCount={counts?.directReports ?? 0}
          roleAssignmentsCount={counts?.roleAssignments ?? 0}
        />
      ),
    },
    {
      value: "assets",
      label: "Assets & Licenses",
      count: tabCount(totalAssets),
      canView:
        isLicensesEnabled ||
        isAssetReservationsEnabled ||
        isAssetKitsEnabled ||
        isIntuneEnabled,
      content: (
        <PersonAssetsTab
          personId={person.id}
          intuneDevices={intuneDevices}
          counts={{
            intuneDevices: intuneDevices.length || counts?.intuneDevices || 0,
            licenseAllocations: counts?.licenseAllocations ?? 0,
            assetReservations: counts?.assetReservations ?? 0,
            kitCheckouts: counts?.kitCheckouts ?? 0,
            stockMovements: counts?.stockMovements ?? 0,
            maintenanceSchedules: counts?.maintenanceSchedules ?? 0,
          }}
          isLicensesEnabled={isLicensesEnabled}
          isAssetReservationsEnabled={isAssetReservationsEnabled}
          isAssetKitsEnabled={isAssetKitsEnabled}
          isIntuneEnabled={isIntuneEnabled}
        />
      ),
    },
    {
      value: "services",
      label: "Services & CMDB",
      count: tabCount(servicesAndCmdbCount),
      canView: isServicesEnabled || isCmdbEnabled || isGovernanceEnabled,
      content: (
        <PersonServicesTab
          personId={person.id}
          counts={{
            serviceOwnerships: counts?.serviceOwnerships ?? 0,
            configurationItems: counts?.configurationItems ?? 0,
            dataOwnerships: counts?.dataOwnerships ?? 0,
          }}
          isServicesEnabled={isServicesEnabled}
          isCmdbEnabled={isCmdbEnabled}
          isGovernanceEnabled={isGovernanceEnabled}
        />
      ),
    },
    {
      value: "governance",
      label: "Governance",
      count: tabCount(governanceCount),
      canView:
        isGovernanceEnabled || isAttachmentsEnabled || isAssetDisposalsEnabled,
      content: (
        <PersonGovernanceTab
          personId={person.id}
          counts={{
            verificationCampaigns: counts?.verificationCampaigns ?? 0,
            verificationItems: counts?.verificationItems ?? 0,
            attachments: counts?.attachments ?? 0,
            initiatedDisposals: counts?.initiatedDisposals ?? 0,
            approvedDisposals: counts?.approvedDisposals ?? 0,
          }}
          isGovernanceEnabled={isGovernanceEnabled}
          isAttachmentsEnabled={isAttachmentsEnabled}
          isAssetDisposalsEnabled={isAssetDisposalsEnabled}
        />
      ),
    },
    {
      value: "activity",
      label: "Activity Log",
      count: tabCount(activityCount),
      content: <PersonActivityTab personId={person.id} />,
    },
  ];

  // Fetch linked user on mount
  useEffect(() => {
    const fetchLinkedUser = async () => {
      setIsLoadingUser(true);
      try {
        const result = await getPersonLinkedUserAction(person.id);
        if (result.success) {
          setLinkedUser(result.data);
        }
      } catch {
        // Silently fail - we'll just show no user linked
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchLinkedUser();
  }, [person.id]);

  // Fetch matching users when link dialog opens
  const handleOpenLinkDialog = useCallback(async () => {
    setIsLinkUserDialogOpen(true);
    setIsLoadingMatchingUsers(true);
    try {
      const result = await listUnlinkedUsersForPersonAction(person.id);
      if (result.success) {
        setMatchingUsers(result.data);
      } else {
        toast.error(result.error ?? "Failed to fetch matching users");
      }
    } catch {
      toast.error("Failed to fetch matching users");
    } finally {
      setIsLoadingMatchingUsers(false);
    }
  }, [person.id]);

  // Handle creating a new user account
  const handleCreateUser = async () => {
    setIsCreatingUser(true);
    try {
      const result = await createUserForPersonAction(person.id);
      if (result.success) {
        setCredentials({
          email: result.data.email,
          password: result.data.password,
        });
        setIsCreateUserDialogOpen(false);
        // Refresh linked user state
        const userResult = await getPersonLinkedUserAction(person.id);
        if (userResult.success) {
          setLinkedUser(userResult.data);
        }
        toast.success("User account created successfully!");
      } else {
        toast.error(result.error ?? "Failed to create user account");
      }
    } catch {
      toast.error("Failed to create user account");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handle linking to existing user
  const handleLinkUser = async (userId: string) => {
    setIsLinkingUser(true);
    try {
      const result = await linkUserToPersonAction(userId, person.id);
      if (result.success) {
        setIsLinkUserDialogOpen(false);
        // Refresh linked user state
        const userResult = await getPersonLinkedUserAction(person.id);
        if (userResult.success) {
          setLinkedUser(userResult.data);
        }
        toast.success("User linked successfully!");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to link user");
      }
    } catch {
      toast.error("Failed to link user");
    } finally {
      setIsLinkingUser(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (
    text: string,
    field: "email" | "password" | "both",
  ) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(
      `${field === "both" ? "Credentials" : field === "email" ? "Email" : "Password"} copied to clipboard`,
    );
  };

  const formatForSlack = (creds: { email: string; password: string }) => {
    return `New User Account Created
Email: ${creds.email}
Password: ${creds.password}

Please change your password after first login.`;
  };

  const handleFormClose = useCallback(async () => {
    setIsFormOpen(false);
    // Fetch updated person data to refresh UI immediately
    const result = await getPersonDetailsAction(person.id);
    if (result.success) {
      setPerson(result.data);
    }
    router.refresh();
  }, [person.id, router]);

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

  const handleSyncPerson = async () => {
    if (!person.azureAdId) {
      toast.error("Cannot sync because this person is not linked to Entra ID");
      return;
    }

    setIsSyncingFromGraph(true);
    try {
      const result = await syncPersonFromGraphAction(person.id);
      if (result.success) {
        const updated = await getPersonDetailsAction(person.id);
        if (updated.success) {
          setPerson(updated.data);
        }
        toast.success("Person synced from Microsoft Graph");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to sync person");
      }
    } catch {
      toast.error("Failed to sync person");
    } finally {
      setIsSyncingFromGraph(false);
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
                {/* User Account Status Badge */}
                {isLoadingUser ? (
                  <Badge variant="outline" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </Badge>
                ) : linkedUser ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="gap-1 border-blue-500 text-blue-600"
                        >
                          <KeyRound className="h-3 w-3" />
                          User Account Linked
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Linked to: {linkedUser.email}
                          <br />
                          Created: {formatDate(linkedUser.createdAt)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : canManageUsers ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer gap-1 border-orange-500 text-orange-600"
                      >
                        <XCircle className="h-3 w-3" />
                        No User Account
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuItem
                        onClick={() => setIsCreateUserDialogOpen(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenLinkDialog}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Link Existing User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-orange-500 text-orange-600"
                  >
                    <XCircle className="h-3 w-3" />
                    No User Account
                  </Badge>
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
          {canSync && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncPerson}
                    disabled={isSyncingFromGraph || !person.azureAdId}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isSyncingFromGraph ? "animate-spin" : ""}`}
                    />
                    {isSyncingFromGraph ? "Syncing..." : "Sync from Entra"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {person.azureAdId
                    ? "Refresh this person from Microsoft Entra ID"
                    : "This person is not linked to Microsoft Entra ID"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          {(canSync || canManageUsers || canManage || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canManageUsers && !linkedUser && !isLoadingUser && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setIsCreateUserDialogOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenLinkDialog}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Link Existing User
                    </DropdownMenuItem>
                    {(canSync || canManage || canDelete) && (
                      <DropdownMenuSeparator />
                    )}
                  </>
                )}

                {canSync && person.azureAdId && (
                  <DropdownMenuItem
                    onClick={handleSyncPerson}
                    disabled={isSyncingFromGraph}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isSyncingFromGraph ? "animate-spin" : ""}`}
                    />
                    {isSyncingFromGraph ? "Syncing..." : "Sync from Entra"}
                  </DropdownMenuItem>
                )}

                {canManage && (
                  <DropdownMenuItem
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
                    {person.isExcluded ? "Include person" : "Exclude person"}
                  </DropdownMenuItem>
                )}

                {canDelete && (
                  <>
                    {(canSync && person.azureAdId) || canManage ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete person
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
              <p className="text-muted-foreground text-xs">Job Title</p>
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

      <CountedTabs
        defaultValue="overview"
        tabs={tabs}
        loading={isCountsLoading}
        tabsClassName="space-y-4"
      />

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
          locationId: person.locationId,
          managerId: person.managerId,
          title: person.title,
          department: person.department,
          hireDate: person.hireDate,
          terminationDate: null,
          isActive: person.isActive,
          isExcluded: person.isExcluded,
          orgUnitName: person.orgUnitName ?? null,
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

      {/* Create User Account Confirmation Dialog */}
      <AlertDialog
        open={isCreateUserDialogOpen}
        onOpenChange={setIsCreateUserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a login account for{" "}
              <strong>{person.fullName}</strong> ({person.email}) with a secure
              random password.
              <br />
              <br />
              The password will be displayed only once. Make sure to copy and
              securely share it with the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingUser}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link to Existing User Dialog */}
      <Dialog
        open={isLinkUserDialogOpen}
        onOpenChange={setIsLinkUserDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link to Existing User
            </DialogTitle>
            <DialogDescription>
              Find and link a User account for{" "}
              <strong className="text-foreground">{person.fullName}</strong> (
              {person.email})
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingMatchingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : matchingUsers.length === 0 ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  No matching User found
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  No unlinked User account exists with email{" "}
                  <strong>{person.email}</strong>. Use the &quot;Create New User
                  Account&quot; option instead.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Found {matchingUsers.length} matching User
                  {matchingUsers.length === 1 ? "" : "s"} with email{" "}
                  <strong>{person.email}</strong>:
                </p>
                <div className="space-y-2">
                  {matchingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <KeyRound className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {user.name || (
                              <span className="text-muted-foreground italic">
                                No name
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          <span>Created {formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkUser(user.id)}
                        disabled={isLinkingUser}
                      >
                        {isLinkingUser ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Link"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLinkUserDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              User Account Created
            </DialogTitle>
            <DialogDescription>
              Account created for <strong>{person.fullName}</strong>. Copy these
              credentials and share them securely with the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email-display">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email-display"
                  value={credentials?.email || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    credentials && copyToClipboard(credentials.email, "email")
                  }
                >
                  {copiedField === "email" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password-display">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password-display"
                  value={credentials?.password || ""}
                  readOnly
                  className="border-yellow-200 bg-yellow-50 font-mono text-sm dark:border-yellow-800 dark:bg-yellow-950/20"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    credentials &&
                    copyToClipboard(credentials.password, "password")
                  }
                >
                  {copiedField === "password" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                This password will only be shown once. Copy it now!
              </p>
            </div>

            {/* Copy for Slack/Teams */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (credentials) {
                    const message = formatForSlack(credentials);
                    copyToClipboard(message, "both");
                  }
                }}
              >
                {copiedField === "both" ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy for Slack/Teams
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
