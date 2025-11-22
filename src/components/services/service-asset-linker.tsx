/**
 * Service Asset Linker Component
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import type { ServiceAssetDTO } from "@/interface-adapters/presenters/service.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  linkServiceToAssetAction,
  unlinkServiceFromAssetAction,
} from "@/interface-adapters/controllers/service.controller";
import { AssetRelationship } from "@/generated/prisma";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface ServiceAssetLinkerProps {
  serviceId: string;
  linkedAssets: ServiceAssetDTO[];
  availableAssets: AssetDTO[];
}

export function ServiceAssetLinker({
  serviceId,
  linkedAssets,
  availableAssets,
}: ServiceAssetLinkerProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.SERVICES_MANAGE);

  const [selectedAssetId, setSelectedAssetId] = React.useState<string>("");
  const [selectedRelationship, setSelectedRelationship] =
    React.useState<AssetRelationship>(AssetRelationship.HOSTS);
  const [description, setDescription] = React.useState("");
  const [isLinking, setIsLinking] = React.useState(false);
  const [isUnlinking, setIsUnlinking] = React.useState(false);
  const [linkToRemove, setLinkToRemove] =
    React.useState<ServiceAssetDTO | null>(null);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = React.useState(false);

  const handleLinkAsset = async () => {
    if (!selectedAssetId || !selectedRelationship) {
      toast.error("Please select an asset and relationship type");
      return;
    }

    setIsLinking(true);
    try {
      const result = await linkServiceToAssetAction({
        serviceId,
        assetId: selectedAssetId,
        relationship: selectedRelationship,
        description: description || null,
      });

      if (result.success) {
        toast.success("Asset linked successfully");
        setSelectedAssetId("");
        setDescription("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to link asset");
      }
    } catch (_error) {
      toast.error("Failed to link asset");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkAsset = async (link: ServiceAssetDTO) => {
    setIsUnlinking(true);
    try {
      const result = await unlinkServiceFromAssetAction(link.id);

      if (result.success) {
        toast.success("Asset unlinked successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unlink asset");
      }
    } catch (_error) {
      toast.error("Failed to unlink asset");
    } finally {
      setIsUnlinking(false);
      setUnlinkDialogOpen(false);
      setLinkToRemove(null);
    }
  };

  // Filter out assets that are already linked
  const filteredAssets = availableAssets.filter(
    (asset) => !linkedAssets.some((link) => link.assetId === asset.id),
  );

  const getRelationshipBadgeVariant = (
    relationship: AssetRelationship,
  ): "default" | "secondary" | "outline" => {
    switch (relationship) {
      case AssetRelationship.HOSTS:
        return "default";
      case AssetRelationship.DEPENDS_ON:
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Link Asset Section */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Link Asset to Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select
                  value={selectedAssetId}
                  onValueChange={setSelectedAssetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.assetTag} - {asset.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select
                  value={selectedRelationship}
                  onValueChange={(value) =>
                    setSelectedRelationship(value as AssetRelationship)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AssetRelationship).map((relationship) => (
                      <SelectItem key={relationship} value={relationship}>
                        {relationship.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe the relationship between the service and asset..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              onClick={handleLinkAsset}
              disabled={!selectedAssetId || isLinking}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {isLinking ? "Linking..." : "Link Asset"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Linked Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Assets ({linkedAssets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedAssets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No assets linked to this service
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Description</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedAssets.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono">
                      {link.assetTag || "—"}
                    </TableCell>
                    <TableCell>{link.assetName || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRelationshipBadgeVariant(link.relationship)}
                      >
                        {link.relationship.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {link.description || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLinkToRemove(link);
                            setUnlinkDialogOpen(true);
                          }}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this service and asset &quot;
              {linkToRemove?.assetTag}&quot;. This action can be reversed by
              linking them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (linkToRemove) {
                  handleUnlinkAsset(linkToRemove);
                }
              }}
              disabled={isUnlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnlinking ? "Unlinking..." : "Unlink"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
