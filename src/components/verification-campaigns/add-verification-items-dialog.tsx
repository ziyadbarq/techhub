/**
 * Add Verification Items Dialog
 *
 * Lets a user populate a verification campaign by selecting the assets or
 * configuration items (per the campaign's target type) that are not already
 * in the campaign, and creating a verification item for each.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { createVerificationItem } from "@/interface-adapters/controllers/verification-item.controller";

interface SelectableTarget {
  id: string;
  label: string;
  sublabel?: string;
}

interface AddVerificationItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  /** Campaign target type — determines which entities can be added. */
  targetType: "CI" | "ASSET";
  /** Target IDs already in the campaign, excluded from the picker. */
  existingTargetIds: Set<string>;
  onAdded: () => void;
}

export function AddVerificationItemsDialog({
  open,
  onOpenChange,
  campaignId,
  targetType,
  existingTargetIds,
  onAdded,
}: AddVerificationItemsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<SelectableTarget[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const entityLabel = targetType === "CI" ? "configuration items" : "assets";

  // Load candidate entities when the dialog opens. "Already in campaign"
  // filtering happens in the render-time memo below, so this effect depends
  // only on open/targetType (existingTargetIds is a fresh Set each render).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSelected(new Set());
      setSearch("");
      try {
        const targets: SelectableTarget[] =
          targetType === "ASSET"
            ? await loadAssets()
            : await loadConfigurationItems();
        if (!cancelled) setCandidates(targets);
      } catch {
        if (!cancelled) {
          toast.error(
            `Failed to load ${targetType === "CI" ? "configuration items" : "assets"}`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, targetType]);

  // Candidates not already in the campaign
  const available = useMemo(
    () => candidates.filter((c) => !existingTargetIds.has(c.id)),
    [candidates, existingTargetIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.sublabel?.toLowerCase().includes(q),
    );
  }, [available, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const results = await Promise.all(
        [...selected].map((targetId) =>
          createVerificationItem({
            verificationCampaignId: campaignId,
            targetType,
            targetId,
          }),
        ),
      );
      const added = results.filter((r) => r.success).length;
      const failed = results.length - added;

      if (added > 0) {
        toast.success(
          `Added ${added} item${added === 1 ? "" : "s"} to the campaign`,
        );
        onAdded();
      }
      if (failed > 0) {
        toast.error(
          `${failed} item${failed === 1 ? "" : "s"} could not be added`,
        );
      }
      if (failed === 0) onOpenChange(false);
    } catch {
      toast.error("Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {entityLabel}</DialogTitle>
          <DialogDescription>
            Select the {entityLabel} to add to this campaign. Items already in
            the campaign are not shown.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder={`Search ${entityLabel}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-1">
          {loading ? (
            <div className="text-muted-foreground flex h-24 items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
              {available.length === 0
                ? `No ${entityLabel} available to add`
                : "No matches"}
            </div>
          ) : (
            filtered.map((target) => (
              <label
                key={target.id}
                className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md p-2"
              >
                <Checkbox
                  checked={selected.has(target.id)}
                  onCheckedChange={() => toggle(target.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{target.label}</p>
                  {target.sublabel ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {target.sublabel}
                    </p>
                  ) : null}
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <span className="text-muted-foreground text-sm">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting || selected.size === 0}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add {selected.size > 0 ? selected.size : ""} item
              {selected.size === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function loadAssets(): Promise<SelectableTarget[]> {
  const result = await listAssetsAction();
  if (!result.success) throw new Error(result.error);
  return result.data.map((asset) => ({
    id: asset.id,
    label: asset.assetTag,
    sublabel:
      [asset.categoryName, asset.modelName].filter(Boolean).join(" · ") ||
      undefined,
  }));
}

async function loadConfigurationItems(): Promise<SelectableTarget[]> {
  const result = await listConfigurationItemsAction();
  if (!result.success) throw new Error(result.error);
  return result.data.map((ci) => ({
    id: ci.id,
    label: ci.name,
    sublabel: ci.ciKey ?? undefined,
  }));
}
