/**
 * Link Person To User Dialog
 *
 * Dialog for linking an existing Person to a matching User record.
 * Shows matching Users (by email) and allows admin to confirm linking.
 */

"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  Link2,
  User as UserIcon,
} from "lucide-react";
import type {
  PersonWithoutUserDTO,
  UserForLinkingDTO,
} from "@/interface-adapters/controllers/user-provisioning.controller";
import {
  listUnlinkedUsersForPersonAction,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils/date-format";

interface LinkPersonToUserDialogProps {
  person: PersonWithoutUserDTO | null;
  onClose: (linked: boolean) => void;
}

export function LinkPersonToUserDialog({
  person,
  onClose,
}: LinkPersonToUserDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLinking, setIsLinking] = React.useState(false);
  const [matchingUsers, setMatchingUsers] = React.useState<UserForLinkingDTO[]>(
    [],
  );
  const [error, setError] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] =
    React.useState<UserForLinkingDTO | null>(null);

  // Fetch matching users when person changes
  React.useEffect(() => {
    if (!person) {
      setMatchingUsers([]);
      setError(null);
      return;
    }

    const fetchMatchingUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listUnlinkedUsersForPersonAction(person.id);
        if (result.success) {
          setMatchingUsers(result.data);
        } else {
          setError(result.error || "Failed to fetch matching users");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch matching users",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchingUsers();
  }, [person]);

  const handleSelectUser = (user: UserForLinkingDTO) => {
    setSelectedUser(user);
  };

  const handleConfirmLink = async () => {
    if (!person || !selectedUser) return;

    setIsLinking(true);
    try {
      const result = await linkUserToPersonAction(selectedUser.id, person.id);

      if (result.success) {
        toast.success(
          `Successfully linked ${person.firstName} ${person.lastName} to user account`,
        );
        setSelectedUser(null);
        onClose(true);
      } else {
        toast.error(result.error || "Failed to link person to user");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to link person to user",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    onClose(false);
  };

  const personFullName = person ? `${person.firstName} ${person.lastName}` : "";

  return (
    <>
      {/* Main Dialog - Shows matching users */}
      <Dialog
        open={!!person && !selectedUser}
        onOpenChange={() => handleClose()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link to Existing User
            </DialogTitle>
            <DialogDescription>
              Find and link a User account for{" "}
              <strong className="text-foreground">{personFullName}</strong> (
              {person?.email})
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
            ) : matchingUsers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No matching User found</AlertTitle>
                <AlertDescription>
                  No unlinked User account exists with email{" "}
                  <strong>{person?.email}</strong>. You can create a new user
                  account using the &quot;Create User Account&quot; button
                  instead.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Found {matchingUsers.length} matching User
                  {matchingUsers.length === 1 ? "" : "s"} with email{" "}
                  <strong>{person?.email}</strong>:
                </p>
                <div className="space-y-2">
                  {matchingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {user.name || (
                              <span className="text-muted-foreground italic">
                                No name
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSelectUser(user)}>
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
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Link</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to link this Person to the selected User
                  account?
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Person:</span>{" "}
                      <strong>{personFullName}</strong>
                      {person?.employeeId && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({person.employeeId})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">User:</span>{" "}
                      <strong>{selectedUser?.email}</strong>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  This action will associate the employee record with the user
                  account. The user will gain access based on their assigned
                  roles.
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
