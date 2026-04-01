"use client";

import {
  Database,
  KeyRound,
  AlertTriangle,
  Settings,
  Save,
  Loader2,
  Shield,
  Mail,
  Plug,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SETTING_TABS,
  SETTING_TAB_LABELS,
  type SettingTab,
} from "@/core/domain/value-objects/settings-registry";
import type { SettingResponseDTO } from "@/interface-adapters/dtos/settings/settings.dto";
import { SettingsFormField } from "./settings-form-field";
import { SettingsEnvironmentTab } from "./settings-environment-tab";

interface SettingsPageViewProps {
  settingsByTab: Record<SettingTab, SettingResponseDTO[]>;
  activeTab: SettingTab;
  formValues: Record<string, string | null>;
  dirtyKeys: Set<string>;
  isPending: boolean;
  isLoading: boolean;
  canManage: boolean;
  stats: {
    dbOverrides: number;
    secretsConfigured: number;
    totalSecrets: number;
    notSet: number;
  };
  restartNeeded: boolean;
  onTabChange: (tab: SettingTab) => void;
  onValueChange: (key: string, value: string | null) => void;
  onSaveTab: (tab: SettingTab) => void;
  onResetSetting: (key: string) => void;
  onRestart: () => void;
}

type SignalTone = "neutral" | "good" | "info" | "warn";

const TAB_ICONS: Record<SettingTab, typeof Settings> = {
  general: Settings,
  authentication: Shield,
  email: Mail,
  integrations: Plug,
  environment: Monitor,
};

const TONE_CLASSES: Record<
  SignalTone,
  { icon: string; value: string; border: string }
> = {
  neutral: {
    icon: "bg-slate-500/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400",
    value: "text-foreground",
    border: "border-border/60",
  },
  good: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/50 dark:border-emerald-900/50",
  },
  info: {
    icon: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400",
    value: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200/50 dark:border-sky-900/50",
  },
  warn: {
    icon: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/50 dark:border-amber-900/50",
  },
};

export function SettingsPageView({
  settingsByTab,
  activeTab,
  formValues,
  dirtyKeys,
  isPending,
  isLoading,
  canManage,
  stats,
  restartNeeded,
  onTabChange,
  onValueChange,
  onSaveTab,
  onResetSetting,
  onRestart,
}: SettingsPageViewProps) {
  const heroSignals: Array<{
    label: string;
    value: string;
    helper: string;
    tone: SignalTone;
    icon: typeof Database;
  }> = [
    {
      label: "DB Overrides",
      value: stats.dbOverrides.toString(),
      helper:
        stats.dbOverrides > 0
          ? "Settings stored in database, overriding environment"
          : "All settings using environment values",
      tone: stats.dbOverrides > 0 ? "info" : "neutral",
      icon: Database,
    },
    {
      label: "Secrets",
      value: `${stats.secretsConfigured}/${stats.totalSecrets}`,
      helper:
        stats.secretsConfigured === stats.totalSecrets
          ? "All secrets configured"
          : `${stats.totalSecrets - stats.secretsConfigured} secrets not configured`,
      tone: stats.secretsConfigured === stats.totalSecrets ? "good" : "warn",
      icon: KeyRound,
    },
    {
      label: "Not Set",
      value: stats.notSet.toString(),
      helper:
        stats.notSet > 0
          ? "Settings with no value from any source"
          : "All settings have values",
      tone: stats.notSet > 0 ? "warn" : "good",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-background relative isolate min-h-[100dvh] overflow-hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.28),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-64 bg-[linear-gradient(180deg,hsl(var(--muted)/0.5),transparent)] dark:bg-[linear-gradient(180deg,hsl(var(--muted)/0.22),transparent)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-col gap-4 lg:gap-6">
        {/* Hero Card */}
        <Card className="border-border/70 bg-card/95 relative overflow-hidden shadow-[0_30px_90px_-70px_rgba(0,0,0,0.85)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.18),transparent_38%)]" />
          <CardContent className="relative space-y-6 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
                <Settings className="h-3.5 w-3.5" />
                Application configuration
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  System Settings
                </h1>
                <p className="text-muted-foreground max-w-3xl text-sm leading-7 sm:text-base">
                  Manage application configuration with database overrides.
                  Settings fall back to environment variables when no database
                  value is set.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {heroSignals.map((signal) => (
                  <SignalCard
                    key={signal.label}
                    label={signal.label}
                    value={signal.value}
                    helper={signal.helper}
                    tone={signal.tone}
                    icon={signal.icon}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restart Banner */}
        {restartNeeded && canManage && (
          <Card className="border-amber-300/70 bg-amber-50/80 backdrop-blur dark:border-amber-800/50 dark:bg-amber-950/30">
            <CardContent className="flex items-center justify-between gap-4 p-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Restart required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Some saved settings need an application restart to take
                    effect.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={onRestart}
                className="shrink-0 gap-1.5 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Restart Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Settings Tabs */}
        {isLoading ? (
          <Card className="border-border/70 bg-card/95 backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-xl" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 bg-card/95 backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <Tabs
                value={activeTab}
                onValueChange={(v) => onTabChange(v as SettingTab)}
              >
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="h-auto flex-wrap">
                    {SETTING_TABS.map((tab) => {
                      const Icon = TAB_ICONS[tab];
                      return (
                        <TabsTrigger key={tab} value={tab} className="gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {SETTING_TAB_LABELS[tab]}
                          {tab !== "environment" && (
                            <Badge
                              variant="secondary"
                              className="ml-1 h-5 px-1.5 text-[10px]"
                            >
                              {settingsByTab[tab].length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {activeTab !== "environment" && canManage && (
                    <Button
                      size="sm"
                      disabled={
                        isPending ||
                        !Array.from(dirtyKeys).some((k) =>
                          settingsByTab[activeTab].some((s) => s.key === k),
                        )
                      }
                      onClick={() => onSaveTab(activeTab)}
                      className="gap-1.5"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save {SETTING_TAB_LABELS[activeTab]}
                    </Button>
                  )}
                </div>

                {SETTING_TABS.filter((tab) => tab !== "environment").map(
                  (tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {settingsByTab[tab].map((setting) => (
                          <SettingsFormField
                            key={setting.key}
                            setting={setting}
                            value={
                              setting.isSecret
                                ? (formValues[setting.key] ?? null)
                                : (formValues[setting.key] ?? setting.value)
                            }
                            isDirty={dirtyKeys.has(setting.key)}
                            disabled={!canManage || isPending}
                            onChange={onValueChange}
                            onReset={onResetSetting}
                          />
                        ))}
                      </div>
                      {settingsByTab[tab].length === 0 && (
                        <p className="text-muted-foreground py-12 text-center text-sm">
                          No settings in this category.
                        </p>
                      )}
                    </TabsContent>
                  ),
                )}

                <TabsContent value="environment">
                  <SettingsEnvironmentTab
                    settings={settingsByTab.environment}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SignalCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: SignalTone;
  icon: typeof Database;
}) {
  const classes = TONE_CLASSES[tone];

  return (
    <div
      className={`border-border/60 bg-card/80 flex items-start gap-4 rounded-2xl border p-4 backdrop-blur ${classes.border}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.22em] uppercase">
          {label}
        </p>
        <p className={`text-2xl font-semibold tracking-tight ${classes.value}`}>
          {value}
        </p>
        <p className="text-muted-foreground/70 text-xs leading-relaxed">
          {helper}
        </p>
      </div>
    </div>
  );
}
