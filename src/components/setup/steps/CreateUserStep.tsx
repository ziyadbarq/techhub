"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { createFirstUserAction } from "@/interface-adapters/controllers/setup.controller";
import { createFirstUserDtoSchema, type CreateFirstUserDto } from "@/interface-adapters/dtos/system-setup.dto";
import { toast } from "sonner";

interface CreateUserStepProps {
  onComplete: () => void;
  onProcessing: (processing: boolean) => void;
  onBack: () => void;
}

export function CreateUserStep({
  onComplete,
  onProcessing,
  onBack,
}: CreateUserStepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateFirstUserDto>({
    resolver: zodResolver(createFirstUserDtoSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = async (data: CreateFirstUserDto) => {
    setIsCreating(true);
    onProcessing(true);
    setError(null);

    try {
      const result = await createFirstUserAction(data);

      if (result.success && result.data.success) {
        setIsCreated(true);
        setCreatedUser({ email: data.email, name: data.name });
        toast.success("First administrator account created successfully!");
        // Auto-proceed after 1 second
        setTimeout(() => {
          onComplete();
        }, 1000);
      } else {
        const errorMessage =
          (result.success ? result.data.message : result.error) ||
          "Failed to create user";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
      onProcessing(false);
    }
  };

  if (isCreated && createdUser) {
    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                Administrator account created successfully!
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Name:</strong> {createdUser.name}
                </p>
                <p>
                  <strong>Email:</strong> {createdUser.email}
                </p>
                <p>
                  <strong>Role:</strong> System Administrator
                </p>
                <p>
                  <strong>Permissions:</strong> All 269 permissions assigned
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Your administrator account is ready! You can now log in with the
            credentials you just created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Explanation */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create First Administrator
        </h3>
        <p className="text-sm text-muted-foreground">
          This account will have full system access with all 269 permissions.
          You can create additional users and assign roles after logging in.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    disabled={isCreating}
                  />
                </FormControl>
                <FormDescription>
                  This will be displayed in the system
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@barq.com"
                    {...field}
                    disabled={isCreating}
                  />
                </FormControl>
                <FormDescription>
                  This will be your login username
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      disabled={isCreating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isCreating}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Minimum 8 characters with uppercase, lowercase, and number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Important:</strong> Remember these credentials - you'll
              use them to log in after setup is complete.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              disabled={isCreating}
            >
              Back
            </Button>

            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Administrator...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Administrator Account
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
