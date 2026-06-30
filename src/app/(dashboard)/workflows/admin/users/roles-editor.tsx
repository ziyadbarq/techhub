"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Button } from "@/components/design";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
}

const ROLE_TONES: Record<string, "yellow" | "rose" | "teal" | "neutral"> = {
  SUPER_ADMIN: "yellow",
  ADMIN: "rose",
  MEMBER: "teal",
};

/**
 * Inline roles display (and optional editor) for the workflow Admin → Users
 * page. In TechHub, role assignments are owned by the global RBAC subsystem,
 * so this control defaults to read-only — the popover editor is kept for
 * environments that wire `/api/workflow/admin/users/[id]/roles`.
 */
export function RolesEditor({
  userId,
  initialRoleIds,
  allRoles,
  readOnly = false,
}: {
  userId: string;
  initialRoleIds: string[];
  allRoles: Role[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(initialRoleIds),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedRoles = [...allRoles].sort((a, b) => {
    const order = ["SUPER_ADMIN", "ADMIN", "MEMBER"];
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/admin/users/${userId}/roles`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleIds: Array.from(picked) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Save failed");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => setPicked(new Set(initialRoleIds));

  const currentRoleNames = sortedRoles
    .filter((r) => picked.has(r.id))
    .map((r) => r.name);

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1">
        {currentRoleNames.length === 0 ? (
          <span className="text-caption text-stone">—</span>
        ) : (
          currentRoleNames.map((name) => (
            <Badge key={name} tone={ROLE_TONES[name] ?? "neutral"}>
              {name}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {currentRoleNames.length === 0 ? (
        <span className="text-caption text-stone">—</span>
      ) : (
        currentRoleNames.map((name) => (
          <Badge key={name} tone={ROLE_TONES[name] ?? "neutral"}>
            {name}
          </Badge>
        ))
      )}
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label="Edit roles"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-stone transition hover:bg-[var(--color-surface-soft)] hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(
              "z-50 w-[280px] overflow-hidden rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3 shadow-[var(--shadow-3)]",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <p className="mb-2 text-micro-uppercase text-stone">Edit roles</p>
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {sortedRoles.map((r) => {
                const checked = picked.has(r.id);
                return (
                  <li key={r.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition",
                        checked
                          ? "bg-[var(--color-yellow-light)]"
                          : "hover:bg-[var(--color-surface-soft)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(r.id)}
                        className="custom-checkbox"
                      />
                      <span className="font-mono text-body-sm text-ink">
                        {r.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {error ? (
              <p className="mt-2 text-caption text-[var(--color-coral-dark)]">
                {error}
              </p>
            ) : null}
            <div className="mt-3 flex justify-end gap-2 border-t border-[var(--color-hairline-soft)] pt-2">
              <Button
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                variant="ghost"
                size="sm"
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                variant="primary"
                size="sm"
                disabled={busy}
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
