/**
 * User Profile Page
 *
 * Displays the current user's profile information including:
 * - Basic info (name, email, avatar)
 * - Account details (created date, last login)
 * - Roles and permissions
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Clock, Shield, Settings } from "lucide-react";
import Link from "next/link";
import { EmailVerificationBadge } from "@/components/auth/EmailVerificationBadge";
import { VerifyEmailButton } from "@/components/auth/VerifyEmailButton";
import { formatDate, formatDateTime } from "@/lib/utils/date-format";
import { loadProfileSummary } from "../shared/profile-summary";

export const dynamic = "force-dynamic";

const isDateLike = (value: unknown): value is Date | string =>
  typeof value === "string" || value instanceof Date;

export default async function ProfilePage() {
  const { user, person, assets, licenses, reservations, errors } =
    await loadProfileSummary();

  // Generate initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((segment: string) => segment?.[0] ?? "")
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  const isEmailVerified = Boolean(user.emailVerified);

  // Format dates
  const emailVerificationStatus = isEmailVerified
    ? isDateLike(user.emailVerified)
      ? `Verified on ${formatDate(user.emailVerified)}`
      : "Email verified"
    : "Email not verified";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account information
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings#preferences">
            <Button variant="outline" className="gap-2">
              Notifications
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="default" className="gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardHeader>
            <CardTitle className="text-destructive">
              We couldn&apos;t load everything
            </CardTitle>
            <CardDescription className="space-y-1">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Profile Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || ""}
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            {/* User Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {user.name || "Anonymous User"}
                </h2>
                <div className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                  <EmailVerificationBadge
                    isVerified={isEmailVerified}
                    showLabel
                    className="ml-2"
                  />
                </div>
              </div>

              {/* Account Status */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Active Account
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Member Since */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-muted-foreground text-sm">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-muted-foreground text-sm">
                  {formatDateTime(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Employee Record */}
      {person && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Linked Employee Record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-muted-foreground text-sm">
                {person.title ?? "No title"} •{" "}
                {person.orgUnitName ?? person.organizationUnitId ?? "Org unit"}
              </p>
              {person.department && (
                <p className="text-muted-foreground text-sm">
                  Department: {person.department}
                </p>
              )}
              {person.hireDate && (
                <p className="text-muted-foreground text-sm">
                  Hired: {formatDate(person.hireDate)}
                </p>
              )}
            </div>
            <div className="flex items-start justify-end gap-2">
              <Badge variant={person.isActive ? "default" : "secondary"}>
                {person.isActive ? "Active" : "Inactive"}
              </Badge>
              {person.isExcluded && <Badge variant="outline">Excluded</Badge>}
              <Button asChild variant="outline" size="sm">
                <Link href={`/persons/${person.id}`}>Open Person Record</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Assets Summary */}
      {person && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Assets</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/persons/${person.id}`}>View all my assets</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryBadge
                label="Assigned Assets"
                value={assets.length}
                description="Active assignments"
              />
              <SummaryBadge
                label="Active Licenses"
                value={licenses.length}
                description="Allocated to you"
              />
              <SummaryBadge
                label="Reservations"
                value={reservations.length}
                description="Upcoming/active"
              />
            </div>

            {assets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Assets</p>
                <div className="divide-border rounded-md border">
                  {assets.slice(0, 3).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">
                          {asset.assetTag ?? "Asset"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Assigned {formatDate(asset.assignedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-muted-foreground text-sm">
                Last updated recently
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Managed by SSO
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <EmailVerificationBadge isVerified={isEmailVerified} />
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-muted-foreground text-sm">
                  {emailVerificationStatus}
                </p>
              </div>
            </div>
            {!isEmailVerified && user.email && (
              <VerifyEmailButton email={user.email} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryBadgeProps {
  label: string;
  value: number;
  description?: string;
}

function SummaryBadge({ label, value, description }: SummaryBadgeProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}
