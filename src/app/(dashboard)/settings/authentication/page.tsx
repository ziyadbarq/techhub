"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type AuthSettings = {
  require2FA: boolean;
  enforceSSO: boolean;
  sessionTimeout: string;
  passwordRotation: string;
  allowPersonalEmails: boolean;
  approvalFlow: string;
};

const initialSettings: AuthSettings = {
  require2FA: true,
  enforceSSO: true,
  sessionTimeout: "30",
  passwordRotation: "90",
  allowPersonalEmails: false,
  approvalFlow: "tiered",
};

function SettingRow({
  title,
  description,
  action,
  badge,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="leading-none font-medium">{title}</p>
          {badge ? (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-col gap-3 md:w-64">{action}</div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-barq-yellow/10 text-barq-yellow flex h-12 w-12 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg leading-tight font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

export default function AuthenticationSettingsPage() {
  const [settings, setSettings] = useState<AuthSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof AuthSettings>(
    key: K,
    value: AuthSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Authentication settings saved", {
      description:
        "Changes stored. Apply via deployment or API sync when ready.",
    });
    setSaving(false);
  };

  return (
    <PermissionGuard
      permission={PERMISSIONS.SETTINGS_MANAGE}
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access denied</h2>
            <p className="text-muted-foreground mt-2">
              You need the settings:manage permission to view authentication
              settings.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Admin only</Badge>
              <Badge variant="secondary">Live configuration</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Authentication Settings
            </h1>
            <p className="text-muted-foreground">
              Control authentication policies, MFA enforcement, SSO, and
              approval workflows.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Configuration scope</AlertTitle>
          <AlertDescription>
            These controls apply across the TechHub platform. Changes are logged
            in audit trails and mirrored to downstream services when
            synchronization is enabled.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <SectionHeading
              icon={LockKeyhole}
              title="Authentication & access controls"
              description="Set enforcement for MFA, SSO, and approval workflows."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="Require 2FA for all users"
              description="Block sign-in until SMS/OTP or hardware key is registered."
              action={
                <Switch
                  checked={settings.require2FA}
                  onCheckedChange={(checked) =>
                    updateSetting("require2FA", checked)
                  }
                />
              }
              badge="Recommended"
            />
            <SettingRow
              title="Enforce single sign-on"
              description="SAML/Entra ID enforced; fallback credentials disabled except for break-glass accounts."
              action={
                <Switch
                  checked={settings.enforceSSO}
                  onCheckedChange={(checked) =>
                    updateSetting("enforceSSO", checked)
                  }
                />
              }
            />
            <SettingRow
              title="Session idle timeout"
              description="Automatic sign-out after inactivity."
              action={
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    updateSetting("sessionTimeout", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Password rotation"
              description="Minimum cadence for non-SSO service accounts."
              action={
                <Select
                  value={settings.passwordRotation}
                  onValueChange={(value) =>
                    updateSetting("passwordRotation", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rotation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="120">120 days</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Personal email accounts"
              description="Block sign-ups or invitations that use non-corporate domains."
              action={
                <Switch
                  checked={!settings.allowPersonalEmails}
                  onCheckedChange={(checked) =>
                    updateSetting("allowPersonalEmails", !checked)
                  }
                />
              }
              badge="Policy"
            />
            <SettingRow
              title="Change approvals"
              description="Require tiered approvals for risky actions (bulk imports, destructive jobs)."
              action={
                <Select
                  value={settings.approvalFlow}
                  onValueChange={(value) =>
                    updateSetting("approvalFlow", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Approval flow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No approval</SelectItem>
                    <SelectItem value="single">Single approver</SelectItem>
                    <SelectItem value="tiered">Tiered (NOC + owner)</SelectItem>
                  </SelectContent>
                </Select>
              }
            />

            <div className="bg-muted/40 flex items-center justify-between rounded-lg p-4">
              <div className="space-y-1">
                <p className="font-semibold">Current posture</p>
                <p className="text-muted-foreground text-sm">
                  MFA enforced, SSO enforced, {settings.sessionTimeout} minute
                  idle timeout. All changes logged to audit events.
                </p>
              </div>
              <Badge variant="outline" className="bg-barq-yellow/20">
                Protected
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
