/**
 * Person Organization Tab
 *
 * Displays reporting chain, direct reports, managed org units,
 * and role assignments.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, GitBranch, Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import {
  getPersonDirectReportsAction,
  getPersonRoleAssignmentsAction,
  type PersonRoleAssignmentSummaryDTO,
} from "@/interface-adapters/controllers/person-details.controller";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date-format";

interface PersonOrganizationTabProps {
  personId: string;
  reportingChain: EmployeeDirectoryDTO[];
  directReportsCount: number;
  roleAssignmentsCount: number;
}

export function PersonOrganizationTab({
  personId,
  reportingChain,
  directReportsCount,
  roleAssignmentsCount,
}: PersonOrganizationTabProps) {
  const [directReports, setDirectReports] = useState<EmployeeDirectoryDTO[]>(
    [],
  );
  const [loadingReports, setLoadingReports] = useState(true);
  const [roleAssignments, setRoleAssignments] = useState<
    PersonRoleAssignmentSummaryDTO[]
  >([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const loadDirectReports = useCallback(async () => {
    if (directReportsCount === 0) {
      setLoadingReports(false);
      return;
    }

    setLoadingReports(true);
    try {
      const result = await getPersonDirectReportsAction(personId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load direct reports");
        return;
      }
      setDirectReports(result.data);
    } catch {
      toast.error("Failed to load direct reports");
    } finally {
      setLoadingReports(false);
    }
  }, [personId, directReportsCount]);

  const loadRoleAssignments = useCallback(async () => {
    if (roleAssignmentsCount === 0) {
      setRoleAssignments([]);
      setLoadingRoles(false);
      return;
    }

    setLoadingRoles(true);
    try {
      const result = await getPersonRoleAssignmentsAction(personId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load role assignments");
        return;
      }
      setRoleAssignments(result.data);
    } catch {
      toast.error("Failed to load role assignments");
    } finally {
      setLoadingRoles(false);
    }
  }, [personId, roleAssignmentsCount]);

  useEffect(() => {
    loadDirectReports();
  }, [loadDirectReports]);

  useEffect(() => {
    loadRoleAssignments();
  }, [loadRoleAssignments]);

  return (
    <div className="space-y-4">
      {/* Reporting Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Reporting Chain
          </CardTitle>
          <CardDescription>
            Manager hierarchy from top to this person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportingChain.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No reporting chain available
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reportingChain.map((person, index) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3"
                  style={{ marginLeft: `${index * 24}px` }}
                >
                  {index > 0 && <div className="text-muted-foreground">└─</div>}
                  <EmployeeAvatar
                    firstName={person.firstName}
                    lastName={person.lastName}
                    size="sm"
                  />
                  <div>
                    <Link
                      href={`/persons/${person.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {person.fullName}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {person.title ?? "No title"} • {person.orgUnitName}
                    </p>
                  </div>
                  {index === reportingChain.length - 1 && (
                    <Badge variant="outline" className="ml-2">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Direct Reports
            {directReportsCount > 0 && (
              <Badge variant="secondary">{directReportsCount}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            People who report directly to this person
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : directReports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No direct reports</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {directReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <EmployeeAvatar
                    firstName={report.firstName}
                    lastName={report.lastName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/persons/${report.id}`}
                      className="text-primary block truncate font-medium hover:underline"
                    >
                      {report.fullName}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">
                      {report.title ?? "No title"}
                    </p>
                  </div>
                  {report.directReportsCount > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      <Users className="mr-1 h-3 w-3" />
                      {report.directReportsCount}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assignments - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Role Assignments
            {roleAssignmentsCount > 0 && (
              <Badge variant="secondary">{roleAssignmentsCount}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Temporal role assignments with start and end dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRoles ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : roleAssignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active role assignments
            </p>
          ) : (
            <div className="divide-border rounded-md border">
              {roleAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{assignment.roleName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(assignment.startDate)}{" "}
                      {assignment.endDate
                        ? `– ${formatDate(assignment.endDate)}`
                        : "• ongoing"}
                    </p>
                    {assignment.scope && (
                      <p className="text-muted-foreground text-xs">
                        Scope: {assignment.scope}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">
                      {assignment.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {assignment.isPrimary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
