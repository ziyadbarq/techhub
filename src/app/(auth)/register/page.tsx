"use client";

/**
 * Registration Page
 * User registration with email and password
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus, Lock, Key } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <UserPlus className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to get started with your account and manage your tasks
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Registration Form */}
          <RegisterForm />

          {/* Security Features */}
          <div className="mt-8 space-y-4 border-t pt-6">
            <p className="text-muted-foreground text-center text-sm font-medium">
              Secured with
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 text-center">
                <Lock className="text-muted-foreground h-6 w-6" />
                <p className="text-xs font-medium">Encrypted</p>
              </div>

              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 text-center">
                <Key className="text-muted-foreground h-6 w-6" />
                <p className="text-xs font-medium">Secure Storage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
