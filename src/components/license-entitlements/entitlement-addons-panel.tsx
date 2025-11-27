"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import {
  listEntitlementAddons,
  attachAddonToEntitlement,
  detachAddonFromEntitlement,
  updateEntitlementAddon,
} from "@/interface-adapters/controllers/license-entitlement-addon.controller";
import { listLicenseAddons } from "@/interface-adapters/controllers/license-addon.controller";
import type { LicenseEntitlementAddonDTO } from "@/interface-adapters/dtos/generated/license-entitlement-addon.dto";
import type { LicenseAddonDTO } from "@/interface-adapters/dtos/generated/license-addon.dto";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";

interface EntitlementAddonsPanelProps {
  entitlementId: string;
  licenseProductId: string;
  onAddonsChanged?: () => void;
}

export function EntitlementAddonsPanel({
  entitlementId,
  licenseProductId,
  onAddonsChanged,
}: EntitlementAddonsPanelProps) {
  const [attachedAddons, setAttachedAddons] = React.useState<
    LicenseEntitlementAddonDTO[]
  >([]);
  const [availableAddons, setAvailableAddons] = React.useState<
    LicenseAddonDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [attachDialogOpen, setAttachDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAddon, setSelectedAddon] =
    React.useState<LicenseEntitlementAddonDTO | null>(null);

  // Form states
  const [selectedAddonId, setSelectedAddonId] = React.useState<string>("");
  const [cost, setCost] = React.useState<string>("");
  const [currency, setCurrency] = React.useState<string>("SAR");
  const [note, setNote] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [attachedResult, availableResult] = await Promise.all([
        listEntitlementAddons({ licenseEntitlementId: entitlementId }),
        listLicenseAddons({ licenseProductId, activeOnly: true }),
      ]);

      if (attachedResult.success) {
        setAttachedAddons(attachedResult.data);
      }

      if (availableResult.success) {
        setAvailableAddons(availableResult.data);
      }
    } finally {
      setLoading(false);
    }
  }, [entitlementId, licenseProductId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Get addons that haven't been attached yet
  const unattachedAddons = availableAddons.filter(
    (addon) =>
      !attachedAddons.some((attached) => attached.licenseAddonId === addon.id),
  );

  // Get addon name by ID
  const getAddonName = (addonId: string): string => {
    const addon = availableAddons.find((a) => a.id === addonId);
    return addon?.name || "Unknown Addon";
  };

  const resetForm = () => {
    setSelectedAddonId("");
    setCost("");
    setCurrency("SAR");
    setNote("");
    setSelectedAddon(null);
  };

  const handleAttach = async () => {
    if (!selectedAddonId) {
      toast.error("Please select an addon");
      return;
    }

    setSubmitting(true);
    try {
      const result = await attachAddonToEntitlement({
        licenseEntitlementId: entitlementId,
        licenseAddonId: selectedAddonId,
        cost: cost ? parseFloat(cost) : null,
        currency: cost ? currency : null,
        note: note || null,
      });

      if (result.success) {
        toast.success("Addon attached successfully");
        setAttachDialogOpen(false);
        resetForm();
        await loadData();
        onAddonsChanged?.();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAddon) return;

    setSubmitting(true);
    try {
      const result = await updateEntitlementAddon({
        id: selectedAddon.id,
        cost: cost ? parseFloat(cost) : null,
        currency: cost ? currency : null,
        note: note || null,
      });

      if (result.success) {
        toast.success("Addon updated successfully");
        setEditDialogOpen(false);
        resetForm();
        await loadData();
        onAddonsChanged?.();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetach = async () => {
    if (!selectedAddon) return;

    setSubmitting(true);
    try {
      const result = await detachAddonFromEntitlement(selectedAddon.id);

      if (result.success) {
        toast.success("Addon detached successfully");
        setDeleteDialogOpen(false);
        resetForm();
        await loadData();
        onAddonsChanged?.();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (addon: LicenseEntitlementAddonDTO) => {
    setSelectedAddon(addon);
    setCost(addon.cost?.toString() || "");
    setCurrency(addon.currency || "SAR");
    setNote(addon.note || "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (addon: LicenseEntitlementAddonDTO) => {
    setSelectedAddon(addon);
    setDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Attached Addons
          </CardTitle>
          {canUpdate && unattachedAddons.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttachDialogOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Attach
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading addons...</p>
        ) : attachedAddons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No addons attached to this entitlement.
          </p>
        ) : (
          <div className="space-y-3">
            {attachedAddons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getAddonName(addon.licenseAddonId)}
                    </span>
                    {addon.cost && addon.currency && (
                      <Badge variant="secondary" className="text-xs">
                        <CurrencyDisplay
                          amount={addon.cost}
                          currency={addon.currency}
                          mode="single"
                          className="text-xs"
                        />
                      </Badge>
                    )}
                  </div>
                  {addon.note && (
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      {addon.note}
                    </p>
                  )}
                </div>
                {canUpdate && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(addon)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-7 w-7"
                      onClick={() => openDeleteDialog(addon)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Attach Dialog */}
      <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Addon</DialogTitle>
            <DialogDescription>
              Attach an addon to this entitlement with optional cost tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Addon</Label>
              <Select
                value={selectedAddonId}
                onValueChange={setSelectedAddonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an addon" />
                </SelectTrigger>
                <SelectContent>
                  {unattachedAddons.map((addon) => (
                    <SelectItem key={addon.id} value={addon.id}>
                      {addon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Additional notes about this addon..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAttachDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAttach} disabled={submitting}>
              {submitting ? "Attaching..." : "Attach Addon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Addon</DialogTitle>
            <DialogDescription>
              Update the cost and notes for this addon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Additional notes about this addon..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detach Addon</DialogTitle>
            <DialogDescription>
              Are you sure you want to detach this addon from the entitlement?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDetach}
              disabled={submitting}
            >
              {submitting ? "Detaching..." : "Detach Addon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
