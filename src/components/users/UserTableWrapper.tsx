/**
 * User Table Wrapper Component
 *
 * Client-side wrapper for UserTable to handle router refresh on updates.
 * Includes advanced filtering capabilities.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { UserTable } from "@/components/users/UserTable";
import { UserFilters, type UserFiltersState } from "@/components/users/UserFilters";
import type { UserWithRolesDTO } from "@/interface-adapters/controllers/user-role.controller";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface UserTableWrapperProps {
  data: UserWithRolesDTO[];
  availableRoles: { id: string; name: string; displayName: string }[];
}

export function UserTableWrapper({
  data,
  availableRoles,
}: UserTableWrapperProps) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<UserFiltersState>({
    query: "",
    roles: [],
    verificationStatus: "all",
    dateRange: undefined,
  });

  // Apply filters to data
  const filteredData = React.useMemo(() => {
    return data.filter((user) => {
      // Query filter (email or name)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesName = user.name?.toLowerCase().includes(query);
        if (!matchesEmail && !matchesName) return false;
      }

      // Role filter
      if (filters.roles.length > 0) {
        const userRoleIds = user.roles.map((r) => r.roleId);
        const hasMatchingRole = filters.roles.some((roleId) =>
          userRoleIds.includes(roleId),
        );
        if (!hasMatchingRole) return false;
      }

      // Verification status filter
      if (filters.verificationStatus !== "all") {
        const isVerified = user.emailVerified !== null;
        if (filters.verificationStatus === "verified" && !isVerified) {
          return false;
        }
        if (filters.verificationStatus === "unverified" && isVerified) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const createdAt = new Date(user.createdAt);
        if (filters.dateRange.from && createdAt < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to) {
          // Set to end of day for inclusive range
          const toEndOfDay = new Date(filters.dateRange.to);
          toEndOfDay.setHours(23, 59, 59, 999);
          if (createdAt > toEndOfDay) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, filters]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.roles.length > 0) count++;
    if (filters.verificationStatus !== "all") count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Filter Users</SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down the user list
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <UserFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableRoles={availableRoles}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="text-muted-foreground text-sm">
            Showing {filteredData.length} of {data.length} users
          </div>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        data={filteredData}
        availableRoles={availableRoles}
        onUpdate={() => router.refresh()}
      />
    </div>
  );
}
