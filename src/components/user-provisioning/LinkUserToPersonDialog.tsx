/**
 * Link User To Person Dialog
 *
 * Dialog for linking an existing User to a matching Person record.
 * Shows matching Persons (by email) and allows admin to confirm linking.
 */

"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Mail,
  Building2,
  Briefcase,
  AlertCircle,
  Loader2,
  Link2,
  User as UserIcon,
} from "lucide-react";
import type {
  UserWithoutPersonDTO,
  PersonForLinkingDTO,
} from "@/interface-adapters/controllers/user-provisioning.controller";
import {
  listUnlinkedPersonsForUserAction,
  linkUserToPersonAction,
} from "@/interface-adapters/controllers/user-provisioning.controller";
import { Button } from "@/components/ui/button";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LinkUserToPersonDialogProps {
  user: UserWithoutPersonDTO | null;
  onClose: (linked: boolean) => void;
}

export function LinkUserToPersonDialog({
  user,
  onClose,
}: LinkUserToPersonDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLinking, setIsLinking] = React.useState(false);
  const [matchingPersons, setMatchingPersons] = React.useState<
    PersonForLinkingDTO[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] =
    React.useState<PersonForLinkingDTO | null>(null);

  // Fetch matching persons when user changes
  React.useEffect(() => {
    if (!user) {
      setMatchingPersons([]);
      setError(null);
      return;
    }

    const fetchMatchingPersons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listUnlinkedPersonsForUserAction(user.id);
        if (result.success) {
          setMatchingPersons(result.data);
        } else {
          setError(result.error || "Failed to fetch matching persons");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch matching persons",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchingPersons();
  }, [user]);

  const handleSelectPerson = (person: PersonForLinkingDTO) => {
    setSelectedPerson(person);
  };

  const handleConfirmLink = async () => {
    if (!user || !selectedPerson) return;

    setIsLinking(true);
    try {
      const result = await linkUserToPersonAction(user.id, selectedPerson.id);

      if (result.success) {
        toast.success(
          `Successfully linked ${user.email} to ${result.data.personName}`,
        );
        setSelectedPerson(null);
        onClose(true);
      } else {
        toast.error(result.error || "Failed to link user to person");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to link user to person",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelectedPerson(null);
    onClose(false);
  };

  return (
    <>
      {/* Main Dialog - Shows matching persons */}
      <Dialog
        open={!!user && !selectedPerson}
        onOpenChange={() => handleClose()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link User to Person
            </DialogTitle>
            <DialogDescription>
              Find and link a Person record for{" "}
              <strong className="text-foreground">{user?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : matchingPersons.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No matching Person found</AlertTitle>
                <AlertDescription>
                  No unlinked Person record exists with email{" "}
                  <strong>{user?.email}</strong>. You may need to create a
                  Person record first, or the existing Person may already be
                  linked to another user.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Found {matchingPersons.length} matching Person
                  {matchingPersons.length === 1 ? "" : "s"} with email{" "}
                  <strong>{user?.email}</strong>:
                </p>
                <div className="space-y-2">
                  {matchingPersons.map((person) => (
                    <div
                      key={person.id}
                      className="hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {person.firstName} {person.lastName}
                          </span>
                          {person.employeeId && (
                            <Badge variant="outline" className="text-xs">
                              {person.employeeId}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {person.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {person.orgUnit.name}
                          </span>
                          {person.title && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {person.title}
                            </span>
                          )}
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {person.primaryRole.displayName}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectPerson(person)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedPerson}
        onOpenChange={(open) => !open && setSelectedPerson(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Link</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to link this User to the selected
                  Person?
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">User:</span>{" "}
                      <strong>{user?.email}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Person:</span>{" "}
                      <strong>
                        {selectedPerson?.firstName} {selectedPerson?.lastName}
                      </strong>
                      {selectedPerson?.employeeId && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({selectedPerson.employeeId})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  This action will associate the user account with the employee
                  record. The user will inherit the person&apos;s organizational
                  context.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLinking}>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmLink} disabled={isLinking}>
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Confirm Link
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
