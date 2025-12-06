/**
 * Settings Page
 *
 * Allows users to manage their account settings:
 * - Profile information (name, email, avatar)
 * - Security settings (password, 2FA)
 * - Preferences
 */

import { requireAuth } from "@/lib/auth/session";
import { requirePermission as requireUserPermission } from "@/lib/permissions/check-permission";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user } = await requireAuth();

  try {
    await requireUserPermission(user.id, PERMISSIONS.SETTINGS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/settings");
    throw error;
  }

  // Fetch latest user data from database (session may be cached)
  const container = getContainer();
  const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);
  const userWithMetadata = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      twoFactorEnabled: true,
      lastLoginMethod: true,
      image: true,
      name: true,
    },
  });

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
      <SettingsForm
        user={{
          ...user,
          twoFactorEnabled: userWithMetadata?.twoFactorEnabled ?? false,
          lastLoginMethod: userWithMetadata?.lastLoginMethod ?? null,
          image: userWithMetadata?.image ?? user.image,
          name: userWithMetadata?.name ?? user.name,
        }}
      />
    </div>
  );
}
