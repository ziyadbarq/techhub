"use client";

/**
 * Setup Wizard Component
 * Multi-step wizard for initial system setup:
 * Step 1: Database prerequisites check + seed
 * Step 2: Create administrator account
 */

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import {
  checkSetupStatusAction,
  runSetupSeedAction,
  createFirstAdminAction,
  type SetupStatus,
  type SeedPresetOption,
} from "@/interface-adapters/controllers/setup.controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Database,
  Loader2,
  Shield,
  UserPlus,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";
import Link from "next/link";

interface SetupWizardProps {
  initialStatus: SetupStatus;
  /** Error from the server component when DB is unreachable */
  initialError?: string;
}

type Step = "prerequisites" | "account";

export function SetupWizard({ initialStatus, initialError }: SetupWizardProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SetupStatus>(initialStatus);
  const [step, setStep] = useState<Step>(() => {
    const allSeeded =
      initialStatus.rolesSeeded &&
      initialStatus.foundationSeeded &&
      initialStatus.featureFlagsSeeded;
    return allSeeded && initialStatus.canCreateAdmin
      ? "account"
      : "prerequisites";
  });
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(
    initialError ?? null,
  );
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Mount check for theme toggle (must be useEffect to avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  const allSeeded =
    status.rolesSeeded && status.foundationSeeded && status.featureFlagsSeeded;

  const handleSeed = async (preset: SeedPresetOption) => {
    try {
      setSeedError(null);
      setIsSeeding(true);

      const result = await runSetupSeedAction(preset);

      if (!result.success) {
        setSeedError(result.error ?? "Failed to seed database");
        return;
      }

      // Re-check status
      const statusResult = await checkSetupStatusAction();
      if (statusResult.success) {
        setStatus(statusResult.data);

        if (statusResult.data.hasAssignedAdmin) {
          toast.error("Setup is no longer available. An administrator exists.");
          router.replace("/login");
          return;
        }

        const nowSeeded =
          statusResult.data.rolesSeeded &&
          statusResult.data.foundationSeeded &&
          statusResult.data.featureFlagsSeeded;

        if (nowSeeded) {
          toast.success("Database seeded successfully");
          setStep("account");
        } else if (!statusResult.data.canSeed) {
          setSeedError(
            "Automatic seeding is unavailable once user accounts exist. Assign the system administrator role manually or recover the existing first account.",
          );
        }
      }
    } catch {
      setSeedError("An unexpected error occurred while seeding the database");
    } finally {
      setIsSeeding(false);
    }
  };

  const onSubmitAccount = async (data: RegisterInput) => {
    try {
      setAccountError(null);
      setIsCreatingAccount(true);

      // Atomic server action: creates user + assigns admin role in one call.
      // If admin assignment fails, the user is rolled back automatically.
      // Includes recovery: if a previous attempt left a user without admin,
      // it detects this and assigns the role to the existing user.
      const result = await createFirstAdminAction(data);

      if (!result.success) {
        setAccountError(result.error || "Failed to create administrator.");
        return;
      }

      // User + admin role created successfully. Now sign in to establish session.
      const signInResponse = await authClient.signIn.email({
        email: result.data.email,
        password: data.password,
      });

      if (signInResponse.error) {
        // Admin exists but session failed — user can recover via /login
        setAccountError(
          "Administrator created successfully, but could not sign in automatically. " +
            "Please go to /login to sign in.",
        );
        return;
      }

      toast.success(
        "System administrator account created. Welcome to TechHub!",
      );
      router.push("/dashboard");
    } catch (err) {
      setAccountError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const steps = [
    { id: "prerequisites" as const, label: "Database Setup", icon: Database },
    { id: "account" as const, label: "Admin Account", icon: UserPlus },
  ];

  return (
    <div className="relative flex min-h-screen">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="hover:bg-accent h-9 w-9 transition-colors"
          aria-label={
            mounted
              ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
              : "Toggle theme"
          }
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Left Side - Branding */}
      <div className="dark:from-barq-yellow/10 dark:via-background dark:to-barq-light-blue/10 relative hidden flex-1 flex-col justify-between border-r bg-stone-100 p-12 transition-all duration-300 lg:flex dark:border-r-0 dark:bg-transparent dark:bg-gradient-to-br">
        <div className="bg-grid-pattern absolute inset-0 opacity-5" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Logo className="h-10 w-auto" priority />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="mb-4 text-4xl font-bold">
              <span className="from-barq-yellow to-barq-yellow/70 bg-gradient-to-r bg-clip-text text-transparent">
                Initial Setup
              </span>
              <br />
              System Configuration
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              Configure your TechHub instance in a few simple steps. Set up the
              database and create your administrator account.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = s.id === "prerequisites" ? allSeeded : false;

              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                      isComplete
                        ? "bg-green-500/10 text-green-500"
                        : isActive
                          ? "bg-barq-yellow/10 text-barq-yellow"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${isActive ? "" : "text-muted-foreground"}`}
                    >
                      Step {index + 1}: {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prerequisites Checklist */}
          <div className="space-y-3">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Prerequisites
            </h3>
            {[
              {
                label: "RBAC Roles & Permissions",
                description: "System administrator, viewer, and auditor roles",
                ready: status.rolesSeeded,
              },
              {
                label: "Foundation Data",
                description:
                  "Organization units, locations, and reference data",
                ready: status.foundationSeeded,
              },
              {
                label: "Feature Flags",
                description: "Module visibility and feature toggles",
                ready: status.featureFlagsSeeded,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                {item.ready ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-muted-foreground text-sm">
            {getCopyrightWithTagline(BRANDING.footer.builtFor)}
          </p>
        </div>
      </div>

      {/* Right Side - Setup Content */}
      <div className="bg-background flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Logo className="h-10 w-auto" priority />
            </Link>
          </div>

          {/* Step Indicator (mobile) */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            {steps.map((s, index) => {
              const isActive = step === s.id;
              const isComplete = s.id === "prerequisites" ? allSeeded : false;

              return (
                <div key={s.id} className="flex items-center gap-2">
                  {index > 0 && <div className="bg-border h-px w-8" />}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      isComplete
                        ? "bg-green-500/10 text-green-500"
                        : isActive
                          ? "bg-barq-yellow/10 text-barq-yellow"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            key={step}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {step === "prerequisites" && (
              <PrerequisitesStep
                status={status}
                isSeeding={isSeeding}
                seedError={seedError}
                onSeed={handleSeed}
                onContinue={() => setStep("account")}
              />
            )}

            {step === "account" && (
              <AccountStep
                form={form}
                status={status}
                isCreatingAccount={isCreatingAccount}
                accountError={accountError}
                onSubmit={onSubmitAccount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prerequisites Step
// ---------------------------------------------------------------------------

const SEED_PRESETS: {
  id: SeedPresetOption;
  label: string;
  description: string;
  details: string[];
}[] = [
  {
    id: "production",
    label: "Production",
    description: "Configuration and reference data only",
    details: [
      "Roles & permissions (269 permissions, 10 roles)",
      "Organization units, locations, vendors",
      "Asset categories, models, lifecycle states",
      "CMDB classes, relationship types",
      "Feature flags",
    ],
  },
  {
    id: "dev",
    label: "Development",
    description: "Full demo environment with sample data",
    details: [
      "Everything in Production, plus:",
      "21 demo persons with org hierarchy",
      "50+ demo assets with assignments",
      "Services, contracts, licenses",
      "Warranties, maintenance schedules",
    ],
  },
];

function PrerequisitesStep({
  status,
  isSeeding,
  seedError,
  onSeed,
  onContinue,
}: {
  status: SetupStatus;
  isSeeding: boolean;
  seedError: string | null;
  onSeed: (preset: SeedPresetOption) => void;
  onContinue: () => void;
}) {
  const [selectedPreset, setSelectedPreset] =
    useState<SeedPresetOption>("production");

  const allSeeded =
    status.rolesSeeded && status.foundationSeeded && status.featureFlagsSeeded;
  const setupBlocked =
    status.needsSetup && !status.canSeed && !status.canCreateAdmin;
  const recoveryMode = status.recoveryMode;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Database Setup</h2>
        <p className="text-muted-foreground">
          {recoveryMode
            ? "Recover the existing first account and complete administrator setup."
            : setupBlocked
              ? "Setup requires manual intervention because multiple user accounts exist without a system administrator."
              : allSeeded
                ? "All prerequisites are met. Continue to create your admin account."
                : "Seed the database with required configuration data before creating your account."}
        </p>
      </div>

      {!allSeeded && status.canSeed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seed Preset</CardTitle>
            <CardDescription>Choose what data to populate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SEED_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                disabled={isSeeding}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedPreset === preset.id
                    ? "border-barq-yellow bg-barq-yellow/5"
                    : "border-border hover:border-barq-yellow/50"
                } ${isSeeding ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{preset.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {preset.description}
                    </p>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      selectedPreset === preset.id
                        ? "border-barq-yellow bg-barq-yellow"
                        : "border-muted-foreground"
                    }`}
                  />
                </div>
                <ul className="text-muted-foreground mt-2 space-y-0.5 text-xs">
                  {preset.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {setupBlocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {status.userCount} user accounts exist, but none have the System
            Administrator role. Automatic recovery is unavailable in this state.
            Assign the <code>system-administrator</code> role manually through
            Prisma Studio or SQL, then sign in again.
          </AlertDescription>
        </Alert>
      )}

      {seedError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{seedError}</AlertDescription>
        </Alert>
      )}

      {allSeeded && status.canCreateAdmin ? (
        <Button
          onClick={onContinue}
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
          size="lg"
        >
          {recoveryMode
            ? "Continue to Account Recovery"
            : "Continue to Account Setup"}
        </Button>
      ) : status.canSeed ? (
        <Button
          onClick={() => onSeed(selectedPreset)}
          disabled={isSeeding}
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
          size="lg"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Seeding database ({selectedPreset})...
            </>
          ) : (
            <>
              <Database className="mr-2 h-5 w-5" />
              Seed Database
            </>
          )}
        </Button>
      ) : (
        <Button
          disabled
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
          size="lg"
        >
          Manual Intervention Required
        </Button>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="text-barq-yellow h-4 w-4 flex-shrink-0" />
          <p className="text-muted-foreground text-xs">
            This page remains available until a System Administrator has been
            assigned. Once setup is complete, it will be permanently locked.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account Step
// ---------------------------------------------------------------------------

function AccountStep({
  form,
  status,
  isCreatingAccount,
  accountError,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<RegisterInput>>;
  status: SetupStatus;
  isCreatingAccount: boolean;
  accountError: string | null;
  onSubmit: (data: RegisterInput) => Promise<void>;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus the most relevant field when the step mounts/changes mode
  useEffect(() => {
    if (status.recoveryMode) {
      if (status.existingUserEmail) {
        form.setValue("email", status.existingUserEmail, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
      passwordRef.current?.focus();
      return;
    }

    nameRef.current?.focus();
  }, [form, status.existingUserEmail, status.recoveryMode]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {status.recoveryMode
            ? "Recover Administrator Access"
            : "Create Administrator"}
        </h2>
        <p className="text-muted-foreground">
          {status.recoveryMode
            ? "Complete setup for the existing first account and assign the System Administrator role."
            : "This account will have full system administrator privileges."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {accountError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{accountError}</AlertDescription>
            </Alert>
          )}

          {status.recoveryMode && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the credentials for the existing first account to complete
                setup.
                {status.existingUserEmail
                  ? ` Existing account: ${status.existingUserEmail}.`
                  : ""}
              </AlertDescription>
            </Alert>
          )}

          {!status.recoveryMode && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Admin User"
                      autoComplete="name"
                      disabled={isCreatingAccount}
                      {...field}
                      ref={nameRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@barq.com"
                    autoComplete="username"
                    disabled={isCreatingAccount}
                    readOnly={status.recoveryMode}
                    {...field}
                  />
                </FormControl>
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
                  <PasswordInput
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isCreatingAccount}
                    showStrength
                    {...field}
                    ref={passwordRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isCreatingAccount}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
            size="lg"
            disabled={isCreatingAccount}
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {status.recoveryMode
                  ? "Recovering administrator access..."
                  : "Creating administrator..."}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                {status.recoveryMode
                  ? "Complete Setup Recovery"
                  : "Create Administrator Account"}
              </>
            )}
          </Button>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="text-barq-yellow h-4 w-4 flex-shrink-0" />
              <p className="text-muted-foreground text-xs">
                {status.recoveryMode
                  ? "The existing first account will be assigned the System Administrator role with all 269 permissions across 14 groups."
                  : "This account will be assigned the System Administrator role with all 269 permissions across 14 groups."}
              </p>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
