/**
 * User Profile Page
 *
 * Displays the current user's profile information including:
 * - Basic info (name, email, avatar)
 * - Account details (created date, last login)
 * - Roles and permissions
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Clock, Shield, Settings } from "lucide-react";
import Link from "next/link";
import { EmailVerificationBadge } from "@/components/auth/EmailVerificationBadge";
import { VerifyEmailButton } from "@/components/auth/VerifyEmailButton";

export const dynamic = "force-dynamic";

const isDateLike = (value: unknown): value is Date | string =>
  typeof value === "string" || value instanceof Date;

export default async function ProfilePage() {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Generate initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((segment) => segment?.[0] ?? "")
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  const isEmailVerified = Boolean(user.emailVerified);

  // Format dates
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <Link href="/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

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
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </Link>
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
