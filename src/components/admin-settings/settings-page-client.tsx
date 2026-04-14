"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  SETTING_TABS,
  type SettingTab,
} from "@/core/domain/value-objects/settings-registry";
import type { SettingResponseDTO } from "@/interface-adapters/dtos/settings/settings.dto";
import {
  listSettingsAction,
  updateSettingsBulkAction,
  restartApplicationAction,
  checkRestartCapabilityAction,
} from "@/interface-adapters/controllers/settings/settings.controller";
import { SettingsPageView } from "./settings-page-view";

export function SettingsPageClient() {
  const [settings, setSettings] = useState<SettingResponseDTO[]>([]);
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [formValues, setFormValues] = useState<Record<string, string | null>>(
    {},
  );
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [canRestart, setCanRestart] = useState<boolean | null>(null);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.SETTINGS_MANAGE);

  const fetchSettings = useCallback(() => {
    startTransition(async () => {
      const [result, restartCheck] = await Promise.all([
        listSettingsAction(),
        canRestart === null ? checkRestartCapabilityAction() : null,
      ]);

      if (restartCheck?.success) {
        setCanRestart(restartCheck.data.canRestart);
      }

      // Use the settings result (rename for clarity)
      const settingsResult = result;
      if (settingsResult.success) {
        setSettings(settingsResult.data.settings);
        // Initialize form values from current settings
        const values: Record<string, string | null> = {};
        for (const setting of settingsResult.data.settings) {
          if (setting.isEditable && !setting.isSecret) {
            values[setting.key] = setting.value;
          }
        }
        setFormValues(values);
        setDirtyKeys(new Set());
      } else {
        toast.error(settingsResult.error);
      }
      setIsLoading(false);
    });
  }, [canRestart]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleValueChange = useCallback((key: string, value: string | null) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  }, []);

  const handleSaveTab = useCallback(
    (tab: SettingTab) => {
      const tabSettings = settings.filter((s) => s.tab === tab && s.isEditable);
      const changedSettings = tabSettings
        .filter((s) => dirtyKeys.has(s.key))
        .map((s) => ({
          key: s.key,
          value: s.isSecret
            ? (formValues[s.key] ?? null)
            : (formValues[s.key] ?? null),
        }))
        // Only send actually changed values (skip secret fields with mask/empty)
        .filter(
          (entry) =>
            entry.value !== null &&
            entry.value !== "" &&
            entry.value !== "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
        );

      if (changedSettings.length === 0) {
        toast.info("No changes to save");
        return;
      }

      startTransition(async () => {
        const result = await updateSettingsBulkAction({
          settings: changedSettings,
        });
        if (result.success) {
          const { updated, errors } = result.data;
          if (errors.length > 0) {
            toast.warning(`${updated} settings saved, ${errors.length} failed`);
          } else {
            toast.success(
              `${updated} setting${updated !== 1 ? "s" : ""} saved`,
            );
          }
          fetchSettings();
        } else {
          toast.error(result.error);
        }
      });
    },
    [settings, formValues, dirtyKeys, fetchSettings],
  );

  const handleResetSetting = useCallback(
    (key: string) => {
      // Reset to env fallback by sending null
      startTransition(async () => {
        const result = await updateSettingsBulkAction({
          settings: [{ key, value: null }],
        });
        if (result.success) {
          toast.success("Setting reset to environment default");
          fetchSettings();
        } else {
          toast.error(result.error);
        }
      });
    },
    [fetchSettings],
  );

  const handleRestart = useCallback(() => {
    setIsRestarting(true);
    startTransition(async () => {
      const result = await restartApplicationAction();
      if (result.success) {
        toast.success("Application reloading (zero-downtime)...");
        // Keep disabled — the app is restarting, the page will reload
      } else {
        toast.error(result.error, { duration: 10000 });
        setIsRestarting(false);
      }
    });
  }, []);

  // Compute stats for hero card
  const dbOverrides = settings.filter((s) => s.source === "database").length;
  const secretsConfigured = settings.filter(
    (s) => s.isSecret && s.hasValue,
  ).length;
  const totalSecrets = settings.filter((s) => s.isSecret).length;
  const notSet = settings.filter((s) => s.source === "not-set").length;
  const restartNeeded = settings.some((s) => s.pendingRestart);

  // Group by tab
  const settingsByTab: Record<SettingTab, SettingResponseDTO[]> = {
    general: [],
    authentication: [],
    email: [],
    integrations: [],
    environment: [],
  };
  for (const tab of SETTING_TABS) {
    settingsByTab[tab] = settings.filter((s) => s.tab === tab);
  }

  return (
    <SettingsPageView
      settingsByTab={settingsByTab}
      activeTab={activeTab}
      formValues={formValues}
      dirtyKeys={dirtyKeys}
      isPending={isPending}
      isLoading={isLoading}
      canManage={canManage}
      stats={{ dbOverrides, secretsConfigured, totalSecrets, notSet }}
      restartNeeded={restartNeeded}
      canRestart={canRestart === true}
      isRestarting={isRestarting}
      onTabChange={setActiveTab}
      onValueChange={handleValueChange}
      onSaveTab={handleSaveTab}
      onResetSetting={handleResetSetting}
      onRestart={handleRestart}
    />
  );
}
