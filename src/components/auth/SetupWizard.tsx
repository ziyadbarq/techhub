"use client";

/**
 * Setup Wizard Component
 * Allows first user to claim System Administrator role
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { assignFirstAdminAction } from "@/interface-adapters/controllers/setup.controller";
import { toast } from "sonner";

interface SetupWizardProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export function SetupWizard({ user }: SetupWizardProps) {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAssignAdmin = async () => {
    try {
      setIsAssigning(true);

      const result = await assignFirstAdminAction();

      if (result.success) {
        if (result.data.success) {
          setIsComplete(true);
          toast.success("System Administrator role assigned successfully!");

          // Wait 2 seconds then redirect
          setTimeout(() => {
            router.push("/admin");
            router.refresh();
          }, 2000);
        } else {
          toast.error(
            result.data.message || "Failed to assign System Administrator role",
          );
        }
      } else {
        toast.error(
          result.error || "Failed to assign System Administrator role",
        );
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsAssigning(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle className="text-success h-8 w-8" />
          </div>
          <CardTitle>Setup Complete!</CardTitle>
          <CardDescription>
            You have been assigned the System Administrator role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-success/20 bg-success/5 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Redirecting to admin dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Shield className="text-primary h-8 w-8" />
        </div>
        <CardTitle>Welcome to Your Application</CardTitle>
        <CardDescription>
          No System Administrator has been set up yet. Would you like to become
          the first one?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-primary h-5 w-5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                What is a System Administrator?
              </p>
              <p className="text-muted-foreground text-sm">
                System Administrators have full access to manage users, roles,
                permissions, and all system features. You will be able to assign
                roles to other users and manage the entire application.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium">Current User</p>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            {user.name && (
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Name:</span> {user.name}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Important:</span> This action can only
            be performed once. Make sure you want to proceed.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button
          className="w-full"
          size="lg"
          onClick={handleAssignAdmin}
          disabled={isAssigning}
        >
          {isAssigning ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Assigning Role...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Become System Administrator
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/")}
          disabled={isAssigning}
        >
          Skip for Now
        </Button>
      </CardFooter>
    </Card>
  );
}
