"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, LogIn, BookOpen, Shield } from "lucide-react";

interface CompletionStepProps {
  onFinish: () => void;
}

export function CompletionStep({ onFinish }: CompletionStepProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Setup Complete!</h2>
          <p className="text-muted-foreground mt-2">
            Your ITAM system is now ready to use.
          </p>
        </div>
      </div>

      {/* Summary */}
      <Alert>
        <AlertDescription>
          <div className="space-y-3">
            <p className="font-medium">✓ What we've accomplished:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>
                  Verified system health (Database, Redis, Environment, Migrations)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>
                  Initialized database with 269 permissions and 10 system roles
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>
                  Created your administrator account with full system access
                </span>
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Next Steps */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h3 className="font-semibold">Next Steps:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <LogIn className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">1. Log In</p>
              <p className="text-muted-foreground">
                Use the credentials you just created to access the system
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">2. Configure Users & Roles</p>
              <p className="text-muted-foreground">
                Navigate to Admin → Users to create additional accounts and assign roles
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">3. Explore Documentation</p>
              <p className="text-muted-foreground">
                Visit /docs to learn about system features and capabilities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> You can seed additional test data (Foundation layer, Assets, etc.)
          by running <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">npm run seed</code> from
          the terminal, or use the System Setup page in the admin panel.
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onFinish} size="lg" className="min-w-[200px]">
          <LogIn className="mr-2 h-4 w-4" />
          Go to Login
        </Button>
      </div>
    </div>
  );
}
