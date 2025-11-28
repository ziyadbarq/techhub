/**
 * Person Overview Tab
 *
 * Displays personal information, employment details, organization,
 * location, and status information.
 */

"use client";

import Link from "next/link";
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  Shield,
  Calendar,
  Mail,
  Phone,
  Hash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";

interface PersonOverviewTabProps {
  person: EmployeeDirectoryDTO;
  reportingChain: EmployeeDirectoryDTO[];
}

export function PersonOverviewTab({
  person,
  reportingChain,
}: PersonOverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{person.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Initials</p>
              <p className="font-medium">{person.initials}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Email</p>
              <a
                href={`mailto:${person.email}`}
                className="text-primary flex items-center gap-1 font-medium hover:underline"
              >
                <Mail className="h-3 w-3" />
                {person.email}
              </a>
            </div>
            {person.phone && (
              <div>
                <p className="text-muted-foreground">Phone</p>
                <a
                  href={`tel:${person.phone}`}
                  className="text-primary flex items-center gap-1 font-medium hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {person.phone}
                </a>
              </div>
            )}
            {person.mobile && (
              <div>
                <p className="text-muted-foreground">Mobile</p>
                <a
                  href={`tel:${person.mobile}`}
                  className="text-primary flex items-center gap-1 font-medium hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {person.mobile}
                </a>
              </div>
            )}
            {person.employeeId && (
              <div>
                <p className="text-muted-foreground">Employee ID</p>
                <p className="flex items-center gap-1 font-mono font-medium">
                  <Hash className="h-3 w-3" />
                  {person.employeeId}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Employment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium">{person.title ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{person.department ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hire Date</p>
              <p className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3" />
                {person.hireDate
                  ? new Date(person.hireDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Organization Unit</p>
              <p className="font-medium">
                {person.orgUnitName}
                {person.orgUnitCode && (
                  <span className="text-muted-foreground ml-2">
                    ({person.orgUnitCode})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Manager</p>
              {person.managerId ? (
                <Link
                  href={`/persons/${person.managerId}`}
                  className="text-primary font-medium hover:underline"
                >
                  {person.managerName}
                </Link>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            {reportingChain.length > 1 && (
              <div>
                <p className="text-muted-foreground mb-2">Reporting Chain</p>
                <div className="flex flex-wrap items-center gap-1">
                  {reportingChain.slice(0, -1).map((manager, index) => (
                    <span key={manager.id} className="flex items-center gap-1">
                      <Link
                        href={`/persons/${manager.id}`}
                        className="text-primary text-xs hover:underline"
                      >
                        {manager.fullName}
                      </Link>
                      {index < reportingChain.length - 2 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            {person.locationName ? (
              <>
                <div>
                  <p className="text-muted-foreground">Assigned Location</p>
                  <p className="font-medium">{person.locationName}</p>
                </div>
                {person.locationCity && (
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{person.locationCity}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No location assigned</p>
            )}
            {person.office && (
              <div>
                <p className="text-muted-foreground">Office</p>
                <p className="font-medium">{person.office}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Status
          </CardTitle>
          <CardDescription>Account status and system flags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Account Status:
              </span>
              {person.isActive ? (
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                TechHub Visibility:
              </span>
              {person.isExcluded ? (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600"
                >
                  Excluded
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Visible
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Direct Reports:
              </span>
              <Badge variant="secondary">{person.directReportsCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
