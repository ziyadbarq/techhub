/**
 * Verification Campaign Items Page Client Component
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Edit,
  Eye,
  Flag,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VerificationCampaignDTO } from "@/interface-adapters/presenters/verification-campaign.presenter";
import type { VerificationItemDTO } from "@/interface-adapters/presenters/verification-item.presenter";
import {
  deleteVerificationItem,
  flagExceptionVerificationItem,
  listVerificationItems,
  updateVerificationItem,
  verifyVerificationItem,
} from "@/interface-adapters/controllers/verification-item.controller";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { formatDate } from "@/lib/utils/date-format";
import { AddVerificationItemsDialog } from "@/components/verification-campaigns/add-verification-items-dialog";

interface VerificationCampaignItemsPageClientProps {
  campaign: VerificationCampaignDTO;
  initialItems: VerificationItemDTO[];
}

const statusClasses: Record<string, string> = {
  PENDING: "bg-blue-500/10 text-blue-600",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  VERIFIED: "bg-green-500/10 text-green-600",
  EXCEPTION: "bg-red-500/10 text-red-600",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function targetLabel(item: VerificationItemDTO) {
  return item.targetType === "CI" ? "Configuration Item" : "Asset";
}

export function VerificationCampaignItemsPageClient({
  campaign,
  initialItems,
}: VerificationCampaignItemsPageClientProps) {
  const [items, setItems] = useState<VerificationItemDTO[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<VerificationItemDTO | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<VerificationItemDTO | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<VerificationItemDTO | null>(
    null,
  );
  const [workflowItem, setWorkflowItem] = useState<{
    item: VerificationItemDTO;
    mode: "verify" | "exception";
  } | null>(null);
  const [verifierPersonId, setVerifierPersonId] = useState("");
  const [comment, setComment] = useState("");
  const [workflowComment, setWorkflowComment] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const existingTargetIds = useMemo(
    () => new Set(items.map((item) => item.targetId)),
    [items],
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING").length,
      inProgress: items.filter((item) => item.status === "IN_PROGRESS").length,
      verified: items.filter((item) => item.status === "VERIFIED").length,
      exception: items.filter((item) => item.status === "EXCEPTION").length,
    }),
    [items],
  );

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const result = await listVerificationItems({ campaignId: campaign.id });
      if (result.success) {
        setItems(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to load verification items");
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (item: VerificationItemDTO) => {
    setEditingItem(item);
    setVerifierPersonId(item.verifierPersonId ?? "");
    setComment(item.comment ?? "");
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    const result = await updateVerificationItem(editingItem.id, {
      verifierPersonId: verifierPersonId.trim() || null,
      comment: comment.trim() || null,
    });

    if (result.success) {
      toast.success("Verification item updated");
      setEditingItem(null);
      await loadItems();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    const result = await deleteVerificationItem(deletingItem.id);
    if (result.success) {
      toast.success("Verification item deleted");
      setDeletingItem(null);
      await loadItems();
    } else {
      toast.error(result.error);
    }
  };

  const openWorkflow = (
    item: VerificationItemDTO,
    mode: "verify" | "exception",
  ) => {
    setWorkflowItem({ item, mode });
    setWorkflowComment(item.comment ?? "");
  };

  const handleWorkflow = async () => {
    if (!workflowItem) return;

    const result =
      workflowItem.mode === "verify"
        ? await verifyVerificationItem(workflowItem.item.id, {
            comment: workflowComment.trim() || undefined,
          })
        : await flagExceptionVerificationItem(workflowItem.item.id, {
            comment: workflowComment.trim(),
          });

    if (result.success) {
      toast.success(
        workflowItem.mode === "verify"
          ? "Verification item marked verified"
          : "Verification item flagged as exception",
      );
      setWorkflowItem(null);
      await loadItems();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/verification-campaigns" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Campaigns
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{campaign.name}</h2>
            <p className="text-muted-foreground">
              {campaign.description || "Verification campaign items"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {campaign.targetType === "CI" ? "Configuration Items" : "Assets"}
            </Badge>
            <Badge variant="outline">{counts.total} items</Badge>
            <Badge variant="outline">{counts.pending} pending</Badge>
            <Badge variant="outline">{counts.inProgress} in progress</Badge>
            <Badge variant="outline">{counts.verified} verified</Badge>
            <Badge variant="outline">{counts.exception} exceptions</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <PermissionGuard permission={PERMISSIONS.VERIFICATION_ITEMS_MANAGE}>
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Items
            </Button>
          </PermissionGuard>
          <Button
            type="button"
            variant="outline"
            onClick={loadItems}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <AddVerificationItemsDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        campaignId={campaign.id}
        targetType={campaign.targetType === "CI" ? "CI" : "ASSET"}
        existingTargetIds={existingTargetIds}
        onAdded={loadItems}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verifier Person ID</TableHead>
              <TableHead>Verified At</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="w-[190px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length ? (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{targetLabel(item)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.targetId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusClasses[item.status] ?? ""}
                    >
                      {formatStatus(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.verifierPersonId || "-"}
                  </TableCell>
                  <TableCell>{formatDate(item.verifiedAt) || "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {item.comment || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewItem(item)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <PermissionGuard
                        permission={PERMISSIONS.VERIFICATION_ITEMS_UPDATE}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>

                      {item.status === "IN_PROGRESS" && (
                        <>
                          <PermissionGuard
                            permission={PERMISSIONS.VERIFICATION_ITEMS_VERIFY}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openWorkflow(item, "verify")}
                              title="Mark Verified"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>

                          <PermissionGuard
                            permission={
                              PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION
                            }
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openWorkflow(item, "exception")}
                              title="Flag Exception"
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        </>
                      )}

                      <PermissionGuard
                        permission={PERMISSIONS.VERIFICATION_ITEMS_MANAGE}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingItem(item)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No verification items found for this campaign.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification Item Preview</DialogTitle>
            <DialogDescription>
              Review target, status, verifier, and audit timestamps.
            </DialogDescription>
          </DialogHeader>
          {previewItem && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Item ID" value={previewItem.id} mono />
              <Detail
                label="Campaign ID"
                value={previewItem.verificationCampaignId}
                mono
              />
              <Detail label="Target Type" value={targetLabel(previewItem)} />
              <Detail label="Target ID" value={previewItem.targetId} mono />
              <Detail label="Status" value={formatStatus(previewItem.status)} />
              <Detail
                label="Verifier Person ID"
                value={previewItem.verifierPersonId || "-"}
                mono
              />
              <Detail
                label="Verified At"
                value={formatDate(previewItem.verifiedAt) || "-"}
              />
              <Detail
                label="Created"
                value={formatDate(previewItem.createdAt) || "-"}
              />
              <div className="sm:col-span-2">
                <Detail label="Comment" value={previewItem.comment || "-"} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setPreviewItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Verification Item</DialogTitle>
            <DialogDescription>
              Update the assigned verifier person ID and review comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verifier Person ID</label>
              <Input
                value={verifierPersonId}
                onChange={(event) => setVerifierPersonId(event.target.value)}
                placeholder="Optional person ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a verification note..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!workflowItem} onOpenChange={() => setWorkflowItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {workflowItem?.mode === "verify"
                ? "Mark Item Verified"
                : "Flag Item Exception"}
            </DialogTitle>
            <DialogDescription>
              {workflowItem?.mode === "verify"
                ? "Add an optional verification comment."
                : "An exception comment is required."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={workflowComment}
            onChange={(event) => setWorkflowComment(event.target.value)}
            placeholder="Add review comment..."
            rows={4}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWorkflowItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWorkflow}
              disabled={
                workflowItem?.mode === "exception" && !workflowComment.trim()
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Verification Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from the campaign. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "break-words"}>
        {value}
      </div>
    </div>
  );
}
