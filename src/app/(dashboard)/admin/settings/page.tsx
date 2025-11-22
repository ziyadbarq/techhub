"use client";

"use client";

import type React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Bell,
  Cloud,
  Globe2,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";

type SettingsState = {
  general: {
    organization: string;
    productName: string;
    baseUrl: string;
    timezone: string;
    locale: string;
    announcement: string;
  };
  auth: {
    require2FA: boolean;
    enforceSSO: boolean;
    sessionTimeout: string;
    passwordRotation: string;
    allowPersonalEmails: boolean;
    approvalFlow: string;
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    weeklyDigest: boolean;
    alertRecipients: string;
    slackWebhook: string;
    digestDay: string;
  };
  operations: {
    maintenanceMode: boolean;
    maintenanceWindow: string;
    maintenanceOwner: string;
    dataRetention: string;
    auditRetention: string;
    backupWindow: string;
  };
  integrations: {
    cmdbSync: boolean;
    ticketingSync: boolean;
    webhooksEnabled: boolean;
    sandboxMode: boolean;
    webhookUrl: string;
    changeFreeze: boolean;
  };
};

const initialSettings: SettingsState = {
  general: {
    organization: "Barq Technology",
    productName: "Barq Assets",
    baseUrl: "https://assets.barq.com",
    timezone: "Asia/Riyadh",
    locale: "en-SA",
    announcement:
      "Scheduled maintenance Friday 2:00-3:00 AM AST. Changes auto-paused.",
  },
  auth: {
    require2FA: true,
    enforceSSO: true,
    sessionTimeout: "30",
    passwordRotation: "90",
    allowPersonalEmails: false,
    approvalFlow: "tiered",
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: true,
    weeklyDigest: true,
    alertRecipients: "infra@barq.com, compliance@barq.com",
    slackWebhook: "https://hooks.slack.com/services/barq/system-events",
    digestDay: "Sunday",
  },
  operations: {
    maintenanceMode: false,
    maintenanceWindow: "Friday 02:00-03:00 AST",
    maintenanceOwner: "NOC Team",
    dataRetention: "365",
    auditRetention: "180",
    backupWindow: "02:30 AST",
  },
  integrations: {
    cmdbSync: true,
    ticketingSync: true,
    webhooksEnabled: true,
    sandboxMode: false,
    webhookUrl: "https://hooks.barq.com/assets/ingest",
    changeFreeze: false,
  },
};

type SettingsSection = keyof SettingsState;

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

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const updateSetting = <
    TSection extends SettingsSection,
    K extends keyof SettingsState[TSection],
  >(
    section: TSection,
    key: K,
    value: SettingsState[TSection][K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async (label: string) => {
    setSavingSection(label);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(`${label} saved`, {
      description:
        "Changes stored. Apply via deployment or API sync when ready.",
    });
    setSavingSection(null);
  };

  return (
    <PermissionGuard
      permission={PERMISSIONS.SETTINGS_MANAGE}
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access denied</h2>
            <p className="text-muted-foreground mt-2">
              You need the settings:manage permission to view system settings.
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
              Application & System Settings
            </h1>
            <p className="text-muted-foreground">
              Control platform defaults, authentication policies, notifications,
              and integration guardrails from a single, tabbed workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave("Draft saved for all sections")}
              disabled={Boolean(savingSection)}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("All settings")}
              disabled={Boolean(savingSection)}
            >
              {savingSection ? "Saving..." : "Publish Changes"}
            </Button>
          </div>
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

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <SectionHeading
                  icon={Globe2}
                  title="Platform identity"
                  description="Set how the product identifies itself in emails, links, and banners."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={settings.general.organization}
                      onChange={(event) =>
                        updateSetting(
                          "general",
                          "organization",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product name</Label>
                    <Input
                      id="productName"
                      value={settings.general.productName}
                      onChange={(event) =>
                        updateSetting(
                          "general",
                          "productName",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Primary base URL</Label>
                    <Input
                      id="baseUrl"
                      value={settings.general.baseUrl}
                      onChange={(event) =>
                        updateSetting("general", "baseUrl", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={settings.general.timezone}
                        onValueChange={(value) =>
                          updateSetting("general", "timezone", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Riyadh">
                            Asia/Riyadh (AST)
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Europe/London">
                            Europe/London
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Locale</Label>
                      <Select
                        value={settings.general.locale}
                        onValueChange={(value) =>
                          updateSetting("general", "locale", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select locale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-SA">English (Saudi)</SelectItem>
                          <SelectItem value="ar-SA">Arabic (Saudi)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement">Banner message</Label>
                  <Textarea
                    id="announcement"
                    value={settings.general.announcement}
                    onChange={(event) =>
                      updateSetting(
                        "general",
                        "announcement",
                        event.target.value,
                      )
                    }
                    placeholder="Add a short announcement that shows across the platform."
                    className="min-h-[96px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave("General settings")}
                    disabled={savingSection !== null}
                  >
                    {savingSection === "General settings"
                      ? "Saving..."
                      : "Save General"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
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
                      checked={settings.auth.require2FA}
                      onCheckedChange={(checked) =>
                        updateSetting("auth", "require2FA", checked)
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
                      checked={settings.auth.enforceSSO}
                      onCheckedChange={(checked) =>
                        updateSetting("auth", "enforceSSO", checked)
                      }
                    />
                  }
                />
                <SettingRow
                  title="Session idle timeout"
                  description="Automatic sign-out after inactivity."
                  action={
                    <Select
                      value={settings.auth.sessionTimeout}
                      onValueChange={(value) =>
                        updateSetting("auth", "sessionTimeout", value)
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
                      value={settings.auth.passwordRotation}
                      onValueChange={(value) =>
                        updateSetting("auth", "passwordRotation", value)
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
                      checked={!settings.auth.allowPersonalEmails}
                      onCheckedChange={(checked) =>
                        updateSetting("auth", "allowPersonalEmails", !checked)
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
                      value={settings.auth.approvalFlow}
                      onValueChange={(value) =>
                        updateSetting("auth", "approvalFlow", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Approval flow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No approval</SelectItem>
                        <SelectItem value="single">Single approver</SelectItem>
                        <SelectItem value="tiered">
                          Tiered (NOC + owner)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />

                <div className="bg-muted/40 flex items-center justify-between rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">Current posture</p>
                    <p className="text-muted-foreground text-sm">
                      MFA enforced, SSO enforced, 30 minute idle timeout. All
                      changes logged to audit events.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-barq-yellow/20">
                    Protected
                  </Badge>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave("Authentication policy")}
                    disabled={savingSection !== null}
                  >
                    {savingSection === "Authentication policy"
                      ? "Saving..."
                      : "Save Authentication"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
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
                      checked={settings.notifications.emailEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "emailEnabled", checked)
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
                      checked={settings.notifications.slackEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "slackEnabled", checked)
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
                        checked={settings.notifications.weeklyDigest}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "notifications",
                            "weeklyDigest",
                            checked,
                          )
                        }
                      />
                      <Select
                        value={settings.notifications.digestDay}
                        onValueChange={(value) =>
                          updateSetting("notifications", "digestDay", value)
                        }
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
                      value={settings.notifications.alertRecipients}
                      onChange={(event) =>
                        updateSetting(
                          "notifications",
                          "alertRecipients",
                          event.target.value,
                        )
                      }
                      placeholder="ops@barq.com, security@barq.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slackWebhook">Slack webhook</Label>
                    <Input
                      id="slackWebhook"
                      value={settings.notifications.slackWebhook}
                      onChange={(event) =>
                        updateSetting(
                          "notifications",
                          "slackWebhook",
                          event.target.value,
                        )
                      }
                      placeholder="https://hooks.slack.com/..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave("Notification settings")}
                    disabled={savingSection !== null}
                  >
                    {savingSection === "Notification settings"
                      ? "Saving..."
                      : "Save Notifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
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
                      checked={settings.operations.maintenanceMode}
                      onCheckedChange={(checked) =>
                        updateSetting("operations", "maintenanceMode", checked)
                      }
                    />
                  }
                  badge={settings.operations.maintenanceMode ? "Active" : ""}
                />
                <SettingRow
                  title="Maintenance window"
                  description="Preferred time slot for deployments and schema changes."
                  action={
                    <Input
                      value={settings.operations.maintenanceWindow}
                      onChange={(event) =>
                        updateSetting(
                          "operations",
                          "maintenanceWindow",
                          event.target.value,
                        )
                      }
                    />
                  }
                />
                <SettingRow
                  title="Maintenance owner group"
                  description="Who owns communication and approvals during change windows."
                  action={
                    <Input
                      value={settings.operations.maintenanceOwner}
                      onChange={(event) =>
                        updateSetting(
                          "operations",
                          "maintenanceOwner",
                          event.target.value,
                        )
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
                      value={settings.operations.dataRetention}
                      onValueChange={(value) =>
                        updateSetting("operations", "dataRetention", value)
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
                      value={settings.operations.auditRetention}
                      onValueChange={(value) =>
                        updateSetting("operations", "auditRetention", value)
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
                      value={settings.operations.backupWindow}
                      onChange={(event) =>
                        updateSetting(
                          "operations",
                          "backupWindow",
                          event.target.value,
                        )
                      }
                    />
                  }
                />

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave("Operational policies")}
                    disabled={savingSection !== null}
                  >
                    {savingSection === "Operational policies"
                      ? "Saving..."
                      : "Save Operations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <SectionHeading
                  icon={Cloud}
                  title="Integrations & sync"
                  description="Control how Barq Assets exchanges data with other platforms."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingRow
                  title="CMDB sync"
                  description="Mirror authoritative CMDB data nightly and flag drifts."
                  action={
                    <Switch
                      checked={settings.integrations.cmdbSync}
                      onCheckedChange={(checked) =>
                        updateSetting("integrations", "cmdbSync", checked)
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
                      checked={settings.integrations.ticketingSync}
                      onCheckedChange={(checked) =>
                        updateSetting("integrations", "ticketingSync", checked)
                      }
                    />
                  }
                />
                <SettingRow
                  title="Outbound webhooks"
                  description="Send lifecycle events to downstream systems in real time."
                  action={
                    <Switch
                      checked={settings.integrations.webhooksEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting(
                          "integrations",
                          "webhooksEnabled",
                          checked,
                        )
                      }
                    />
                  }
                />
                <SettingRow
                  title="Webhook endpoint"
                  description="Primary endpoint for change events."
                  action={
                    <Input
                      value={settings.integrations.webhookUrl}
                      onChange={(event) =>
                        updateSetting(
                          "integrations",
                          "webhookUrl",
                          event.target.value,
                        )
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
                      checked={settings.integrations.sandboxMode}
                      onCheckedChange={(checked) =>
                        updateSetting("integrations", "sandboxMode", checked)
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
                      checked={settings.integrations.changeFreeze}
                      onCheckedChange={(checked) =>
                        updateSetting("integrations", "changeFreeze", checked)
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
                      {settings.integrations.sandboxMode
                        ? " sandbox"
                        : " production"}
                      .
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave("Integration controls")}
                    disabled={savingSection !== null}
                  >
                    {savingSection === "Integration controls"
                      ? "Saving..."
                      : "Save Integrations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
