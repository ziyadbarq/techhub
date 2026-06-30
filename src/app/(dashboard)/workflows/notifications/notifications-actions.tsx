"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/design";

export function NotificationsActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    try {
      await fetch("/api/workflow/notifications/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={markAllRead}
      disabled={busy}
      variant="secondary"
      size="sm"
    >
      {busy ? "Marking…" : "Mark all as read"}
    </Button>
  );
}
