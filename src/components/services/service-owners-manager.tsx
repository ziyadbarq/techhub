/**
 * Service Owners Manager Component
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Plus } from "lucide-react";
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
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
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

import type { ServiceOwnerDTO } from "@/interface-adapters/presenters/service.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import {
  addServiceOwnerAction,
  removeServiceOwnerAction,
  setServicePrimaryOwnerAction,
} from "@/interface-adapters/controllers/service-ownership.controller";
import { OwnershipType } from "@/generated/prisma/enums";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface ServiceOwnersManagerProps {
  serviceId: string;
  owners: ServiceOwnerDTO[];
  persons: PersonDTO[];
}

export function ServiceOwnersManager({
  serviceId,
  owners,
  persons,
}: ServiceOwnersManagerProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.SERVICES_MANAGE);

  const [selectedPersonId, setSelectedPersonId] = React.useState<string>("");
  const [selectedOwnershipType, setSelectedOwnershipType] =
    React.useState<OwnershipType>(OwnershipType.TECHNICAL);
  const [isPrimary, setIsPrimary] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [ownerToRemove, setOwnerToRemove] =
    React.useState<ServiceOwnerDTO | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);

  const handleAddOwner = async () => {
    if (!selectedPersonId || !selectedOwnershipType) {
      toast.error("Please select a person and ownership type");
      return;
    }

    setIsAdding(true);
    try {
      const result = await addServiceOwnerAction({
        serviceId,
        personId: selectedPersonId,
        ownershipType: selectedOwnershipType,
        isPrimary,
      });

      if (result.success) {
        toast.success("Service owner added successfully");
        setSelectedPersonId("");
        setIsPrimary(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add service owner");
      }
    } catch (_error) {
      toast.error("Failed to add service owner");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveOwner = async (owner: ServiceOwnerDTO) => {
    setIsRemoving(true);
    try {
      const result = await removeServiceOwnerAction(
        serviceId,
        owner.personId,
        owner.ownershipType,
      );

      if (result.success) {
        toast.success("Service owner removed successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove service owner");
      }
    } catch (_error) {
      toast.error("Failed to remove service owner");
    } finally {
      setIsRemoving(false);
      setRemoveDialogOpen(false);
      setOwnerToRemove(null);
    }
  };

  const handleSetPrimary = async (owner: ServiceOwnerDTO) => {
    try {
      const result = await setServicePrimaryOwnerAction({
        serviceId,
        personId: owner.personId,
        ownershipType: owner.ownershipType,
      });

      if (result.success) {
        toast.success("Primary owner updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update primary owner");
      }
    } catch (_error) {
      toast.error("Failed to update primary owner");
    }
  };

  const groupOwnersByType = () => {
    const grouped: Record<string, ServiceOwnerDTO[]> = {
      TECHNICAL: [],
      PRODUCT: [],
      BUSINESS: [],
    };

    owners.forEach((owner) => {
      if (grouped[owner.ownershipType]) {
        grouped[owner.ownershipType].push(owner);
      }
    });

    return grouped;
  };

  const groupedOwners = groupOwnersByType();

  // Filter out persons who are already owners of the selected type
  const availablePersons = persons.filter((person) => {
    return !owners.some(
      (owner) =>
        owner.personId === person.id &&
        owner.ownershipType === selectedOwnershipType,
    );
  });

  // Memoized options for searchable dropdown
  const personOptions: SearchableSelectOption[] = React.useMemo(
    () =>
      availablePersons.map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName} (${p.email})`,
      })),
    [availablePersons],
  );

  return (
    <div className="space-y-6">
      {/* Add Owner Section */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Add Service Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Person</Label>
                <SearchableSelect
                  options={personOptions}
                  value={selectedPersonId}
                  onValueChange={setSelectedPersonId}
                  placeholder="Select person..."
                  searchPlaceholder="Search persons..."
                  emptyMessage="No persons available"
                />
              </div>

              <div className="space-y-2">
                <Label>Ownership Type</Label>
                <Select
                  value={selectedOwnershipType}
                  onValueChange={(value) =>
                    setSelectedOwnershipType(value as OwnershipType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OwnershipType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Set as primary owner for this type
              </Label>
            </div>

            <Button
              onClick={handleAddOwner}
              disabled={!selectedPersonId || isAdding}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAdding ? "Adding..." : "Add Owner"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Owners by Type */}
      {Object.entries(groupedOwners).map(([type, typeOwners]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle>
              {type} Owners ({typeOwners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeOwners.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No {type.toLowerCase()} owners assigned
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Primary</TableHead>
                    {canManage && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>{owner.personName || "Unknown"}</TableCell>
                      <TableCell>{owner.personEmail || "—"}</TableCell>
                      <TableCell>
                        {owner.isPrimary ? (
                          <Badge variant="outline" className="gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            Primary
                          </Badge>
                        ) : canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(owner)}
                          >
                            <Star className="h-3 w-3" />
                            Set Primary
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOwnerToRemove(owner);
                              setRemoveDialogOpen(true);
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
      ))}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service Owner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{ownerToRemove?.personName}&quot; as a{" "}
              {ownerToRemove?.ownershipType} owner. This action can be reversed
              by adding them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ownerToRemove) {
                  handleRemoveOwner(ownerToRemove);
                }
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
