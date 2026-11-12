"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useFeatureFlagsContext } from "@/contexts/feature-flags-context";

type Notice = {
  id: string;
  subject: string;
  body: string;
  requestId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { isFeatureEnabled } = useFeatureFlagsContext();
  const enabled =
    isFeatureEnabled("WORKFLOW_ENGINE") &&
    hasPermission(PERMISSIONS.WORKFLOWS_NOTIFICATIONS_VIEW);
  const [items, setItems] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await fetch("/api/workflow/notifications?limit=8", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        notifications: Notice[];
        unreadCount: number;
      };
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Retain the last known count when the network is unavailable.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    // Schedule the initial refresh outside the synchronous effect body.
    const initialTimer = window.setTimeout(() => {
      void reload();
    }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, 30000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, reload]);

  async function openNotice(item: Notice) {
    if (!item.readAt) {
      try {
        const response = await fetch("/api/workflow/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [item.id] }),
        });
        if (response.ok) {
          setItems((previous) =>
            previous.map((notice) =>
              notice.id === item.id
                ? { ...notice, readAt: new Date().toISOString() }
                : notice,
            ),
          );
          setUnreadCount((previous) => Math.max(0, previous - 1));
        }
      } catch {
        // A failed read update must not prevent navigation.
      }
    }
    router.push(item.requestId ? "/workflows/requests/" + item.requestId : "/notifications");
  }

  if (!enabled) return null;

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void reload(); }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 md:h-9 md:w-9"
          aria-label={
            unreadCount > 0
              ? "Notifications, " + unreadCount + " unread"
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>TechHub Notifications</span>
          <span className="text-muted-foreground text-xs font-normal">
            {unreadCount} unread
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        {items.length ? (
          <div className="max-h-[22rem] overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { void openNotice(item); }}
                className="hover:bg-muted flex w-full items-start gap-3 border-b px-4 py-3 text-left transition last:border-0"
              >
                <span className={
                  "mt-2 h-2 w-2 shrink-0 rounded-full " +
                  (item.readAt ? "bg-transparent" : "bg-blue-500")
                } aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.subject}</span>
                  <span className="text-muted-foreground mt-1 block line-clamp-2 text-xs">{item.body}</span>
                  <span className="text-muted-foreground mt-2 block text-[11px]">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </span>
                {item.readAt ? <Check className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-label="Read" /> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            You're all caught up.
          </p>
        )}
        <DropdownMenuSeparator className="m-0" />
        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="hover:bg-muted flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
        >
          View all notifications <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
