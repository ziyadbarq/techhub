/**
 * Users Without Persons Table
 *
 * Displays a list of Users who don't have Person records linked yet.
 * Allows admins to link Users to existing Person records.
 */

"use client";
"use no memo";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Calendar,
  Link2,
  CheckCircle2,
  User as UserIcon,
} from "lucide-react";
import type { UserWithoutPersonDTO } from "@/interface-adapters/controllers/user-provisioning.controller";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LinkUserToPersonDialog } from "./LinkUserToPersonDialog";
import { formatDate } from "@/lib/utils/date-format";

interface UsersWithoutPersonsTableProps {
  data: UserWithoutPersonDTO[];
}

export function UsersWithoutPersonsTable({
  data,
}: UsersWithoutPersonsTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] =
    React.useState<UserWithoutPersonDTO | null>(null);

  const handleLinkUser = (user: UserWithoutPersonDTO) => {
    setSelectedUser(user);
  };

  const handleDialogClose = (linked: boolean) => {
    setSelectedUser(null);
    if (linked) {
      router.refresh();
    }
  };

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">All users linked!</h3>
        <p className="text-muted-foreground mt-2">
          Every user has a Person record linked.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Found {data.length} user{data.length === 1 ? "" : "s"} without linked
          Person records
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={user.name || undefined}
                        email={user.email}
                        image={user.image || undefined}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium">
                          {user.name || (
                            <span className="text-muted-foreground italic">
                              No name
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <UserIcon className="h-3 w-3" />
                          User Account
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Mail className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="font-mono text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-sm">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleLinkUser(user)}
                    >
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Link to Person
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Link Dialog */}
      <LinkUserToPersonDialog user={selectedUser} onClose={handleDialogClose} />
    </>
  );
}
