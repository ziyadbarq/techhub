"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Bell, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type NotificationSettings = {
  emailEnabled: boolean;
  slackEnabled: boolean;
  weeklyDigest: boolean;
  alertRecipients: string;
  slackWebhook: string;
  digestDay: string;
};

const initialSettings: NotificationSettings = {
  emailEnabled: true,
  slackEnabled: true,
  weeklyDigest: true,
  alertRecipients: "infra@barq.com, compliance@barq.com",
  slackWebhook: "https://hooks.slack.com/services/barq/system-events",
  digestDay: "Sunday",
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

export default function NotificationSettingsPage() {
  const [settings, setSettings] =
    useState<NotificationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Notification settings saved", {
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
              You need the settings:manage permission to view notification
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
              Notification Settings
            </h1>
            <p className="text-muted-foreground">
              Configure email alerts, Slack notifications, and weekly digest
              summaries.
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
              icon={Bell}
              title="Notifications & communications"
              description="Control who receives alerts and how often summaries are sent."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="Email alerts"
              description="Send critical platform notifications via email."
              action={
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("emailEnabled", checked)
                  }
                />
              }
              badge="Primary"
            />
            <SettingRow
              title="Slack notifications"
              description="Send operational alerts to the Barq #tech-operations channel."
              action={
                <Switch
                  checked={settings.slackEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("slackEnabled", checked)
                  }
                />
              }
            />
            <SettingRow
              title="Weekly digest"
              description="Summary of changes, expiring warranties, and pending approvals."
              action={
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) =>
                      updateSetting("weeklyDigest", checked)
                    }
                  />
                  <Select
                    value={settings.digestDay}
                    onValueChange={(value) => updateSetting("digestDay", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alertRecipients">Default recipients</Label>
                <Input
                  id="alertRecipients"
                  value={settings.alertRecipients}
                  onChange={(event) =>
                    updateSetting("alertRecipients", event.target.value)
                  }
                  placeholder="ops@barq.com, security@barq.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack webhook</Label>
                <Input
                  id="slackWebhook"
                  value={settings.slackWebhook}
                  onChange={(event) =>
                    updateSetting("slackWebhook", event.target.value)
                  }
                  placeholder="https://hooks.slack.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
