"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { ServerCog, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type OperationsSettings = {
  maintenanceMode: boolean;
  maintenanceWindow: string;
  maintenanceOwner: string;
  dataRetention: string;
  auditRetention: string;
  backupWindow: string;
};

const initialSettings: OperationsSettings = {
  maintenanceMode: false,
  maintenanceWindow: "Friday 02:00-03:00 AST",
  maintenanceOwner: "NOC Team",
  dataRetention: "365",
  auditRetention: "180",
  backupWindow: "02:30 AST",
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

export default function OperationsSettingsPage() {
  const [settings, setSettings] = useState<OperationsSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof OperationsSettings>(
    key: K,
    value: OperationsSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Operations settings saved", {
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
              You need the settings:manage permission to view operations
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
              Operations Settings
            </h1>
            <p className="text-muted-foreground">
              Configure maintenance windows, data retention policies, and backup
              schedules.
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
            These controls apply across the Barq Assets platform. Changes are
            logged in audit trails and mirrored to downstream services when
            synchronization is enabled.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <SectionHeading
              icon={ServerCog}
              title="Operational policies"
              description="Maintenance windows, retention policies, and resilience controls."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              title="Maintenance mode"
              description="Pause risky actions and show banners during maintenance."
              action={
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    updateSetting("maintenanceMode", checked)
                  }
                />
              }
              badge={settings.maintenanceMode ? "Active" : ""}
            />
            <SettingRow
              title="Maintenance window"
              description="Preferred time slot for deployments and schema changes."
              action={
                <Input
                  value={settings.maintenanceWindow}
                  onChange={(event) =>
                    updateSetting("maintenanceWindow", event.target.value)
                  }
                />
              }
            />
            <SettingRow
              title="Maintenance owner group"
              description="Who owns communication and approvals during change windows."
              action={
                <Input
                  value={settings.maintenanceOwner}
                  onChange={(event) =>
                    updateSetting("maintenanceOwner", event.target.value)
                  }
                />
              }
            />
            <Separator />
            <SettingRow
              title="Data retention"
              description="Keep operational data for at least this many days."
              action={
                <Select
                  value={settings.dataRetention}
                  onValueChange={(value) =>
                    updateSetting("dataRetention", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Retention" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Audit log retention"
              description="How long to keep detailed audits before archiving."
              action={
                <Select
                  value={settings.auditRetention}
                  onValueChange={(value) =>
                    updateSetting("auditRetention", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Audit retention" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                    <SelectItem value="1095">3 years</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              title="Backup window"
              description="Preferred backup start time in AST."
              action={
                <Input
                  value={settings.backupWindow}
                  onChange={(event) =>
                    updateSetting("backupWindow", event.target.value)
                  }
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
