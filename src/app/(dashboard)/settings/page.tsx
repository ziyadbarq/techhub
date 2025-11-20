/**
 * Settings Page
 *
 * Allows users to manage their account settings:
 * - Profile information (name, email, avatar)
 * - Security settings (password, 2FA)
 * - Preferences
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const { user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Link href="/profile" className="mb-6 inline-block">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Form */}
      <SettingsForm user={user} />
    </div>
  );
}
