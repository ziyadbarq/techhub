"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import {
  seedMinimalDataAction,
  createFirstUserAction,
} from "@/interface-adapters/controllers/setup.controller";

/**
 * Minimal Wizard Component - Debug Version
 * Full setup wizard implementation
 */

interface MinimalWizardProps {
  initialLoadError: string | null;
  rbacCounts: { roles: number; permissions: number };
}

interface HealthCheckResult {
  database: {
    connected: boolean;
    error?: string;
  };
  redis: {
    connected: boolean;
    error?: string;
  };
  environment: {
    valid: boolean;
    missing: string[];
  };
  migrations: {
    applied: boolean;
    pending: number;
    error?: string;
  };
  overall: boolean;
}

export function MinimalWizard({
  initialLoadError,
  rbacCounts,
}: MinimalWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(
    null,
  );
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isSeedingData, setIsSeedingData] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [currentRbacCounts, setCurrentRbacCounts] = useState(rbacCounts);

  const steps = ["Health Check", "Seed Data", "Create User", "Complete"];
  const progress = (completedSteps.length / steps.length) * 100;

  // Effect to run health check on mount
  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      console.log("[MinimalWizard] checkHealth called");
      setIsCheckingHealth(true);
      try {
        const response = await fetch("/api/system-health");
        const data = await response.json();

        if (!mounted) return;

        // API returns {success: true, data: {...}} wrapper
        const healthData = data.success && data.data ? data.data : data;
        setHealthStatus(healthData);
      } catch (error) {
        console.error("[MinimalWizard] Health check error:", error);
      } finally {
        if (mounted) {
          setIsCheckingHealth(false);
        }
      }
    };

    checkHealth();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  const handleSeedData = async () => {
    setIsSeedingData(true);
    setSeedError(null);
    try {
      const result = await seedMinimalDataAction();

      if (!result.success) {
        throw new Error(result.error || "Seeding failed");
      }

      if (!result.data?.success) {
        throw new Error(result.data?.message || "Seeding failed");
      }

      // Update RBAC counts from the seeding result
      if (result.data?.details) {
        setCurrentRbacCounts({
          roles: result.data.details.rolesCreated || 10,
          permissions: result.data.details.permissionsCreated || 269,
        });
      }

      setCompletedSteps((prev) => [...new Set([...prev, 1])]);
      setCurrentStep(2);
    } catch (error) {
      setSeedError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSeedingData(false);
    }
  };

  const handleCreateUser = async (
    email: string,
    password: string,
    name: string,
  ) => {
    setIsCreatingUser(true);
    setUserError(null);
    try {
      const result = await createFirstUserAction({ email, password, name });

      if (!result.success) {
        throw new Error(result.error || "User creation failed");
      }

      setCompletedSteps((prev) => [...new Set([...prev, 2])]);
      setCurrentStep(3);
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleFinish = () => {
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">System Setup (v2)</h1>
        <p className="text-muted-foreground">
          Complete setup wizard - Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {initialLoadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Initialization Error</p>
            <p>{initialLoadError}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {completedSteps.length} of {steps.length} completed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.includes(idx);
          const isCurrent = currentStep === idx;
          const isAccessible = idx <= currentStep;
          return (
            <button
              key={idx}
              onClick={() =>
                isAccessible &&
                !isCheckingHealth &&
                !isSeedingData &&
                !isCreatingUser &&
                setCurrentStep(idx)
              }
              disabled={
                !isAccessible ||
                isCheckingHealth ||
                isSeedingData ||
                isCreatingUser
              }
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all ${isCurrent ? "border-primary bg-primary/5 ring-primary ring-2 ring-offset-2" : ""} ${isCompleted ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""} ${isAccessible && !isCurrent ? "hover:border-primary/50 cursor-pointer" : ""} ${!isAccessible ? "cursor-not-allowed opacity-50" : ""} `}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${isCompleted ? "bg-green-500 text-white" : ""} ${isCurrent && !isCompleted ? "bg-primary text-primary-foreground" : ""} ${!isCurrent && !isCompleted ? "bg-muted text-muted-foreground" : ""} `}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
              </div>
              <div className="text-xs font-medium">{step}</div>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Verifying system requirements"}
            {currentStep === 1 && "Initialize RBAC roles and permissions"}
            {currentStep === 2 && "Create first administrator account"}
            {currentStep === 3 && "Setup complete"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 0: Health Check */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {isCheckingHealth ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Checking system health...
                  </p>
                </div>
              ) : healthStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <HealthItem
                      label="Database Connection"
                      connected={healthStatus.database?.connected}
                      error={healthStatus.database?.error}
                    />
                    <HealthItem
                      label="Redis Connection"
                      connected={healthStatus.redis?.connected}
                      error={healthStatus.redis?.error}
                    />
                    <HealthItem
                      label="Environment Variables"
                      connected={healthStatus.environment?.valid}
                      details={
                        healthStatus.environment?.missing?.length
                          ? `Missing: ${healthStatus.environment.missing.join(", ")}`
                          : undefined
                      }
                    />
                    <HealthItem
                      label="Database Migrations"
                      connected={healthStatus.migrations?.applied}
                      details={
                        healthStatus.migrations?.pending
                          ? `${healthStatus.migrations.pending} pending`
                          : undefined
                      }
                      error={healthStatus.migrations?.error}
                    />
                  </div>

                  {healthStatus.overall ? (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        All systems operational. Ready to proceed.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        System health check failed. Please resolve the issues
                        above before continuing.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}

              {healthStatus && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      setCompletedSteps([0]);
                      setCurrentStep(1);
                    }}
                    disabled={!healthStatus.overall}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Seed Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {seedError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{seedError}</AlertDescription>
                </Alert>
              )}

              <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">
                    Database Initialization
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Initialize the database with essential RBAC (Role-Based
                    Access Control) data required for the system to function.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-background flex items-center gap-3 rounded-lg border p-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Shield className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {currentRbacCounts.permissions}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Permissions
                      </p>
                    </div>
                  </div>
                  <div className="bg-background flex items-center gap-3 rounded-lg border p-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <CheckCircle2 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {currentRbacCounts.roles}
                      </p>
                      <p className="text-muted-foreground text-xs">Roles</p>
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground space-y-1 pt-2 text-xs">
                  <p className="font-medium">What will be created:</p>
                  <ul className="list-inside list-disc space-y-0.5 pl-2">
                    <li>System and user roles with hierarchical permissions</li>
                    <li>Fine-grained access control for all modules</li>
                    <li>Default role assignments for common workflows</li>
                  </ul>
                </div>
              </div>

              {isSeedingData && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Seeding database... This may take a few moments.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  disabled={isSeedingData}
                >
                  Back
                </Button>
                <Button onClick={handleSeedData} disabled={isSeedingData}>
                  {isSeedingData && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSeedingData ? "Seeding..." : "Seed RBAC Data"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create User */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Administrator Account</h3>
                <p className="text-muted-foreground text-sm">
                  Create the first administrator account. This user will have
                  full system access and can manage other users.
                </p>
                <div className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
                  <Shield className="h-3 w-3" />
                  <span>
                    This account will be assigned the{" "}
                    <strong className="text-foreground">
                      System Administrator
                    </strong>{" "}
                    role
                  </span>
                </div>
              </div>

              {userError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{userError}</AlertDescription>
                </Alert>
              )}

              {isCreatingUser && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Creating administrator account...
                  </AlertDescription>
                </Alert>
              )}

              <UserForm
                onSubmit={handleCreateUser}
                isSubmitting={isCreatingUser}
                onBack={() => setCurrentStep(1)}
              />
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="space-y-6 py-4 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Setup Complete!</h3>
                <p className="text-muted-foreground">
                  Your ITAM system is now ready to use
                </p>
              </div>

              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">What's been configured:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>System health verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{currentRbacCounts.permissions} permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{currentRbacCounts.roles} roles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Admin user created</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleFinish}
                size="lg"
                className="min-w-[200px]"
              >
                Go to Login
              </Button>

              <p className="text-muted-foreground text-xs">
                You'll be redirected to the login page
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthItem({
  label,
  connected,
  error,
  details,
}: {
  label: string;
  connected?: boolean;
  error?: string;
  details?: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {connected ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="text-destructive h-5 w-5" />
        )}
      </div>
      {(error || details) && (
        <p className="text-muted-foreground text-xs">{error || details}</p>
      )}
    </div>
  );
}

function UserForm({
  onSubmit,
  isSubmitting,
  onBack,
}: {
  onSubmit: (email: string, password: string, name: string) => void;
  isSubmitting: boolean;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name || name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(email, password, name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-background w-full rounded-md border px-3 py-2"
          placeholder="Name"
          autoComplete="name"
          required
        />
        {errors.name && (
          <p className="text-destructive text-xs">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background w-full rounded-md border px-3 py-2"
          placeholder="admin@barq.com"
          required
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-background w-full rounded-md border px-3 py-2"
          placeholder="••••••••"
          required
          minLength={8}
        />
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Must be 8+ characters with uppercase, lowercase, and number
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Admin User"}
        </Button>
      </div>
    </form>
  );
}
