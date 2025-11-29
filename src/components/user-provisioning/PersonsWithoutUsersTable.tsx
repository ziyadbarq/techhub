/**
 * Persons Without Users Table
 *
 * Displays a list of Persons who don't have User accounts yet.
 * Allows admins to create User accounts for selected individuals.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  CheckCircle2,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import type { PersonWithoutUserDTO } from "@/interface-adapters/controllers/user-provisioning.controller";
import { createUserForPersonAction } from "@/interface-adapters/controllers/user-provisioning.controller";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LinkPersonToUserDialog } from "./LinkPersonToUserDialog";

interface PersonsWithoutUsersTableProps {
  data: PersonWithoutUserDTO[];
}

interface UserCredentials {
  email: string;
  password: string;
  personName: string;
}

const NEW_USER_CREDS_STORAGE_KEY = "user-provisioning/new-user-creds";

export function PersonsWithoutUsersTable({
  data,
}: PersonsWithoutUsersTableProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [selectedPerson, setSelectedPerson] =
    React.useState<PersonWithoutUserDTO | null>(null);
  const [personToLink, setPersonToLink] =
    React.useState<PersonWithoutUserDTO | null>(null);
  const [credentials, setCredentials] = React.useState<UserCredentials | null>(
    null,
  );
  const [copiedField, setCopiedField] = React.useState<
    "email" | "password" | "both" | null
  >(null);

  React.useLayoutEffect(() => {
    const stored = sessionStorage.getItem(NEW_USER_CREDS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as UserCredentials;
      setCredentials(parsed);
    } catch {
      // Ignore malformed stored data
    } finally {
      sessionStorage.removeItem(NEW_USER_CREDS_STORAGE_KEY);
    }
  }, []);

  const handleCreateUser = async (person: PersonWithoutUserDTO) => {
    setSelectedPerson(person);
  };

  const handleLinkToUser = (person: PersonWithoutUserDTO) => {
    setPersonToLink(person);
  };

  const handleLinkDialogClose = (linked: boolean) => {
    setPersonToLink(null);
    if (linked) {
      router.refresh();
    }
  };

  const handleCredentialsOpenChange = (open: boolean) => {
    if (!open) {
      setCredentials(null);
      sessionStorage.removeItem(NEW_USER_CREDS_STORAGE_KEY);
      // Refresh the page when dialog closes to update the persons list
      router.refresh();
    }
  };

  const confirmCreateUser = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedPerson) return;

    setIsCreating(true);
    try {
      const result = await createUserForPersonAction(selectedPerson.id);

      if (!result.success) {
        toast.error(result.error || "Failed to create user account");
        setIsCreating(false);
        return;
      }

      // Store credentials and close confirmation dialog
      const personName = `${selectedPerson.firstName} ${selectedPerson.lastName}`;
      const creds = {
        email: result.data.email,
        password: result.data.password,
        personName,
      };

      sessionStorage.setItem(NEW_USER_CREDS_STORAGE_KEY, JSON.stringify(creds));
      setSelectedPerson(null);

      setCredentials(creds);
      toast.success("User account created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create user account",
      );
      setIsCreating(false);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    field: "email" | "password" | "both",
  ) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(
      `${field === "both" ? "Credentials" : field === "email" ? "Email" : "Password"} copied to clipboard`,
    );
  };

  const formatForSlack = (creds: UserCredentials) => {
    return `New User Account Created
Email: ${creds.email}
Password: ${creds.password}

Please change your password after first login.`;
  };

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">
          All employees provisioned!
        </h3>
        <p className="text-muted-foreground mt-2">
          Every active employee has a user account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Found {data.length} employee{data.length === 1 ? "" : "s"} without
          user accounts
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <User className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <div className="font-medium">
                          {person.firstName} {person.lastName}
                        </div>
                        {person.title && (
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                            <Briefcase className="h-3 w-3" />
                            {person.title}
                          </div>
                        )}
                        {person.employeeId && (
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            ID: {person.employeeId}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Mail className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="font-mono text-sm">{person.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-sm">{person.orgUnit.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {person.primaryRole.displayName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkToUser(person)}
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Link to Existing User
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleCreateUser(person)}
                      >
                        Create User Account
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedPerson}
        onOpenChange={(open) => !open && setSelectedPerson(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a login account for{" "}
              <strong>
                {selectedPerson?.firstName} {selectedPerson?.lastName}
              </strong>{" "}
              ({selectedPerson?.email}) with a secure random password.
              <br />
              <br />
              The password will be displayed only once. Make sure to copy and
              securely share it with the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={confirmCreateUser}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials Display Dialog */}
      <Dialog open={!!credentials} onOpenChange={handleCredentialsOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Account Created</DialogTitle>
            <DialogDescription>
              Account created for <strong>{credentials?.personName}</strong>.
              Copy these credentials and share them securely with the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email-display">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email-display"
                  value={credentials?.email || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    credentials && copyToClipboard(credentials.email, "email")
                  }
                >
                  {copiedField === "email" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password-display">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password-display"
                  value={credentials?.password || ""}
                  readOnly
                  className="border-yellow-200 bg-yellow-50 font-mono text-sm dark:border-yellow-800 dark:bg-yellow-950/20"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    credentials &&
                    copyToClipboard(credentials.password, "password")
                  }
                >
                  {copiedField === "password" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                This password will only be shown once. Copy it now!
              </p>
            </div>

            {/* Copy for Slack/Teams */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (credentials) {
                      const message = formatForSlack(credentials);
                      copyToClipboard(message, "both");
                    }
                  }}
                >
                  {copiedField === "both" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy for Slack/Teams
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleCredentialsOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Existing User Dialog */}
      <LinkPersonToUserDialog
        person={personToLink}
        onClose={handleLinkDialogClose}
      />
    </>
  );
}
