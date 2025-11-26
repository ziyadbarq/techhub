/**
 * Welcome Banner Widget
 * Displays a personalized greeting with the user's name and time-based message
 */

"use client";

import { useCurrentPerson } from "@/hooks/use-current-person";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function WelcomeBannerWidget() {
  const { person, isLoading, hasLinkedPerson } = useCurrentPerson();

  if (isLoading) {
    return (
      <Card className="from-primary/10 to-primary/5 bg-gradient-to-r">
        <CardContent className="py-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = hasLinkedPerson ? person?.firstName || "User" : "User";

  return (
    <Card className="from-primary/10 to-primary/5 border-none bg-gradient-to-r">
      <CardContent className="py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">{getFormattedDate()}</p>
      </CardContent>
    </Card>
  );
}
