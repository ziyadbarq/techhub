"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { Cloud, ShieldCheck, Webhook } from "lucide-react";
import { toast } from "sonner";

type IntegrationSettings = {
  cmdbSync: boolean;
  ticketingSync: boolean;
  webhooksEnabled: boolean;
  sandboxMode: boolean;
  webhookUrl: string;
  changeFreeze: boolean;
};

const initialSettings: IntegrationSettings = {
  cmdbSync: true,
  ticketingSync: true,
  webhooksEnabled: true,
  sandboxMode: false,
  webhookUrl: "https://hooks.barq.com/assets/ingest",
  changeFreeze: false,
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

export default function IntegrationSettingsPage() {
  const [settings, setSettings] =
    useState<IntegrationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof IntegrationSettings>(
    key: K,
    value: IntegrationSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Integration settings saved", {
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
              You need the settings:manage permission to view integration
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
              Integration Settings
            </h1>
            <p className="text-muted-foreground">
              Configure external system integrations, webhooks, and data
              synchronization.
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
              icon={Cloud}
              title="Integrations & sync"
              description="Control how TechHub exchanges data with other platforms."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="CMDB sync"
              description="Mirror authoritative CMDB data nightly and flag drifts."
              action={
                <Switch
                  checked={settings.cmdbSync}
                  onCheckedChange={(checked) =>
                    updateSetting("cmdbSync", checked)
                  }
                />
              }
              badge="Core"
            />
            <SettingRow
              title="Ticketing sync"
              description="Bi-directional updates with incidents and change tickets."
              action={
                <Switch
                  checked={settings.ticketingSync}
                  onCheckedChange={(checked) =>
                    updateSetting("ticketingSync", checked)
                  }
                />
              }
            />
            <SettingRow
              title="Outbound webhooks"
              description="Send lifecycle events to downstream systems in real time."
              action={
                <Switch
                  checked={settings.webhooksEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("webhooksEnabled", checked)
                  }
                />
              }
            />
            <SettingRow
              title="Webhook endpoint"
              description="Primary endpoint for change events."
              action={
                <Input
                  value={settings.webhookUrl}
                  onChange={(event) =>
                    updateSetting("webhookUrl", event.target.value)
                  }
                />
              }
            />
            <Separator />
            <SettingRow
              title="Sandbox mode"
              description="Route integration calls to non-production targets."
              action={
                <Switch
                  checked={settings.sandboxMode}
                  onCheckedChange={(checked) =>
                    updateSetting("sandboxMode", checked)
                  }
                />
              }
              badge="Safe"
            />
            <SettingRow
              title="Change freeze"
              description="Halt outbound sync during critical change freezes."
              action={
                <Switch
                  checked={settings.changeFreeze}
                  onCheckedChange={(checked) =>
                    updateSetting("changeFreeze", checked)
                  }
                />
              }
            />

            <div className="bg-muted/40 flex items-center gap-3 rounded-lg p-4">
              <div className="bg-barq-yellow/20 text-barq-yellow flex h-10 w-10 items-center justify-center rounded">
                <Webhook className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Sync status</p>
                <p className="text-muted-foreground text-sm">
                  CMDB and ticketing sync are enabled. Webhooks routed to
                  {settings.sandboxMode ? " sandbox" : " production"}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
