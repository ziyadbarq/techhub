/**
 * Profile Card Widget
 * Displays the user's profile information from their linked Person entity
 */

"use client";

import { useCurrentPerson } from "@/hooks/use-current-person";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Building2, Briefcase, ExternalLink } from "lucide-react";
import Link from "next/link";

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

export function ProfileCardWidget() {
  const { person, isLoading, hasLinkedPerson } = useCurrentPerson();

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
          <Link href={`/directory/persons/${person.id}`}>
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
          {person.email && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{person.email}</span>
            </div>
          )}
          {person.department && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{person.department}</span>
            </div>
          )}
          {person.employeeId && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>ID: {person.employeeId}</span>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
