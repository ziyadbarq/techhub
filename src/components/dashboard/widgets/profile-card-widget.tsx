/**
 * Profile Card Widget
 * Displays the user's profile information from their linked Person entity
 */

"use client";

import { useCurrentPersonContext } from "@/contexts/current-person-context";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building2, ExternalLink, Calendar, Hash } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date-format";

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

export function ProfileCardWidget() {
  const { person, isLoading, hasLinkedPerson } = useCurrentPersonContext();

  if (isLoading) {
    return (
      <WidgetContainer title="My Profile" icon={<User className="h-4 w-4" />}>
        <WidgetSkeleton rows={4} />
      </WidgetContainer>
    );
  }

  if (!hasLinkedPerson || !person) {
    return (
      <WidgetContainer title="My Profile" icon={<User className="h-4 w-4" />}>
        <WidgetEmpty
          icon={User}
          title="Profile not linked"
          description="Your account is not linked to an employee profile yet."
        />
      </WidgetContainer>
    );
  }

  const fullName =
    [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unknown";

  return (
    <WidgetContainer
      title="My Profile"
      icon={<User className="h-4 w-4" />}
      headerAction={
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/persons/${person.id}`}>
            <ExternalLink className="mr-1 h-3 w-3" />
            View
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-lg">
              {getInitials(person.firstName, person.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{fullName}</h3>
            {person.title && (
              <p className="text-muted-foreground text-sm">{person.title}</p>
            )}
            <Badge
              variant={person.isActive ? "default" : "secondary"}
              className="mt-1"
            >
              {person.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {person.employeeId && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>Employee ID: {person.employeeId}</span>
            </div>
          )}
          {person.department && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{person.department}</span>
            </div>
          )}
          {person.hireDate && formatDate(person.hireDate) && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Joined: {formatDate(person.hireDate)}</span>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
