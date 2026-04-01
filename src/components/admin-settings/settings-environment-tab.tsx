"use client";

import { CheckCircle2, XCircle, Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SettingResponseDTO } from "@/interface-adapters/dtos/settings/settings.dto";

interface SettingsEnvironmentTabProps {
  settings: SettingResponseDTO[];
}

export function SettingsEnvironmentTab({
  settings,
}: SettingsEnvironmentTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Read-only view of infrastructure environment variables. These are
          managed via <code className="text-foreground/80 text-xs">.env</code>{" "}
          files or the Spring Cloud Config Server and cannot be changed from the
          UI.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className={cn(
              "border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4 backdrop-blur",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                setting.hasValue
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400",
              )}
            >
              {setting.hasValue ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{setting.label}</span>
                {setting.isSecret ? (
                  <Lock className="text-muted-foreground/50 h-3 w-3" />
                ) : (
                  <Globe className="text-muted-foreground/50 h-3 w-3" />
                )}
              </div>
              <p className="text-muted-foreground/70 text-xs">
                {setting.description}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-muted-foreground font-mono text-[10px] tracking-wider">
                  {setting.key}
                </code>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    setting.hasValue
                      ? "border-emerald-300/50 text-emerald-600 dark:border-emerald-800/50 dark:text-emerald-400"
                      : "border-red-300/50 text-red-600 dark:border-red-800/50 dark:text-red-400",
                  )}
                >
                  {setting.hasValue ? "Configured" : "Not Set"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
