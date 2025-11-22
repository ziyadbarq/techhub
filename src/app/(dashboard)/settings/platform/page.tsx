"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { Globe2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type PlatformSettings = {
  organization: string;
  productName: string;
  baseUrl: string;
  timezone: string;
  locale: string;
  announcement: string;
};

const initialSettings: PlatformSettings = {
  organization: "Barq Technology",
  productName: "Barq Assets",
  baseUrl: "https://assets.barq.com",
  timezone: "Asia/Riyadh",
  locale: "en-SA",
  announcement:
    "Scheduled maintenance Friday 2:00-3:00 AM AST. Changes auto-paused.",
};

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

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Platform settings saved", {
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
              You need the settings:manage permission to view platform settings.
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
              Platform Settings
            </h1>
            <p className="text-muted-foreground">
              Configure platform identity, branding, and general settings for
              Barq Assets.
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
                  value={settings.organization}
                  onChange={(event) =>
                    updateSetting("organization", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Product name</Label>
                <Input
                  id="productName"
                  value={settings.productName}
                  onChange={(event) =>
                    updateSetting("productName", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Primary base URL</Label>
                <Input
                  id="baseUrl"
                  value={settings.baseUrl}
                  onChange={(event) =>
                    updateSetting("baseUrl", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting("timezone", value)}
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
                    value={settings.locale}
                    onValueChange={(value) => updateSetting("locale", value)}
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
                value={settings.announcement}
                onChange={(event) =>
                  updateSetting("announcement", event.target.value)
                }
                placeholder="Add a short announcement that shows across the platform."
                className="min-h-[96px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
