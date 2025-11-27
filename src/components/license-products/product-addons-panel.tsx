"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Package, Power, PowerOff } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import {
  listLicenseAddons,
  createLicenseAddon,
  updateLicenseAddon,
  deleteLicenseAddon,
} from "@/interface-adapters/controllers/license-addon.controller";
import type { LicenseAddonDTO } from "@/interface-adapters/dtos/generated/license-addon.dto";

interface ProductAddonsPanelProps {
  licenseProductId: string;
}

export function ProductAddonsPanel({
  licenseProductId,
}: ProductAddonsPanelProps) {
  const [addons, setAddons] = React.useState<LicenseAddonDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAddon, setSelectedAddon] =
    React.useState<LicenseAddonDTO | null>(null);

  // Form states
  const [name, setName] = React.useState<string>("");
  const [code, setCode] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState(false);

  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);

  const loadAddons = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLicenseAddons({ licenseProductId });
      if (result.success) {
        setAddons(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, [licenseProductId]);

  React.useEffect(() => {
    void loadAddons();
  }, [loadAddons]);

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setIsActive(true);
    setSelectedAddon(null);
  };

  // Auto-generate code from name
  const generateCode = (inputName: string): string => {
    return inputName
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Only auto-generate code if it's empty or matches the previous auto-generated value
    if (!code || code === generateCode(name)) {
      setCode(generateCode(value));
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!code.trim()) {
      toast.error("Code is required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createLicenseAddon({
        licenseProductId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        isActive,
      });

      if (result.success) {
        toast.success("Addon created successfully");
        setCreateDialogOpen(false);
        resetForm();
        await loadAddons();
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
      const result = await updateLicenseAddon({
        id: selectedAddon.id,
        name: name.trim() || undefined,
        description: description.trim() || null,
        isActive,
      });

      if (result.success) {
        toast.success("Addon updated successfully");
        setEditDialogOpen(false);
        resetForm();
        await loadAddons();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAddon) return;

    setSubmitting(true);
    try {
      const result = await deleteLicenseAddon(selectedAddon.id);

      if (result.success) {
        toast.success("Addon deleted successfully");
        setDeleteDialogOpen(false);
        resetForm();
        await loadAddons();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (addon: LicenseAddonDTO) => {
    setSelectedAddon(addon);
    setName(addon.name);
    setCode(addon.code);
    setDescription(addon.description || "");
    setIsActive(addon.isActive);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (addon: LicenseAddonDTO) => {
    setSelectedAddon(addon);
    setDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Product Addons
          </CardTitle>
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading addons...</p>
        ) : addons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No addons defined for this product. Addons can be used to track
            extras like premium support, training, or additional features.
          </p>
        ) : (
          <div className="space-y-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{addon.name}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {addon.code}
                    </Badge>
                    {addon.isActive ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-green-500/10 text-xs text-green-600"
                      >
                        <Power className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-gray-500/10 text-xs text-gray-500"
                      >
                        <PowerOff className="h-2.5 w-2.5" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {addon.description && (
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      {addon.description}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Addon</DialogTitle>
            <DialogDescription>
              Define a new addon template for this license product. Addons can
              be attached to entitlements with individual pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Premium Support"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                placeholder="e.g., PREMIUM_SUPPORT"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                Unique identifier. Only uppercase letters, numbers, underscores,
                and hyphens.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this addon includes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-muted-foreground text-xs">
                  Inactive addons cannot be attached to new entitlements
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Addon"}
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
              Update the addon details. Code cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Premium Support"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={code} disabled className="bg-muted font-mono" />
              <p className="text-muted-foreground text-xs">
                Code cannot be changed after creation
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this addon includes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-muted-foreground text-xs">
                  Inactive addons cannot be attached to new entitlements
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
            <DialogTitle>Delete Addon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this addon? This action cannot be
              undone. Note: You cannot delete addons that are attached to
              entitlements - detach them first or deactivate the addon instead.
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
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete Addon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
