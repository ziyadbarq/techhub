"use client";

/**
 * System Setup Wizard Component
 * Multi-step wizard for first-time system initialization
 *
 * Steps:
 * 1. System Health Check
 * 2. Seed RBAC Data
 * 3. Create First Admin User
 * 4. Completion
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SystemHealthStep } from "./steps/SystemHealthStep";
import { SeedDataStep } from "./steps/SeedDataStep";
import { CreateUserStep } from "./steps/CreateUserStep";
import { CompletionStep } from "./steps/CompletionStep";
import { CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  {
    id: 1,
    title: "System Health",
    description: "Verify system requirements",
  },
  {
    id: 2,
    title: "Initialize Database",
    description: "Seed RBAC roles and permissions",
  },
  {
    id: 3,
    title: "Create Admin User",
    description: "Set up first administrator account",
  },
  {
    id: 4,
    title: "Complete",
    description: "Setup complete",
  },
] as const;

export function SystemSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const progress = (completedSteps.length / STEPS.length) * 100;
  const currentStepConfig = STEPS.find((s) => s.id === currentStep);

  const handleStepComplete = (stepId: number) => {
    setCompletedSteps((prev) => [...prev, stepId]);

    // Move to next step if not last
    if (stepId < STEPS.length) {
      setCurrentStep(stepId + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Setup</h1>
        <p className="text-muted-foreground">
          Welcome! Let's set up your ITAM system.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {completedSteps.length} of {STEPS.length} steps completed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-4">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isAccessible = step.id <= currentStep;

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && setCurrentStep(step.id)}
              disabled={!isAccessible || isProcessing}
              className={`
                flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all
                ${isCurrent ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2" : ""}
                ${isCompleted ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                ${!isAccessible ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
              `}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${isCurrent && !isCompleted ? "bg-primary text-primary-foreground" : ""}
                  ${!isCurrent && !isCompleted ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.id}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepConfig?.title}</CardTitle>
          <CardDescription>{currentStepConfig?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isProcessing && currentStep === 1 && (
            <SystemHealthStep
              onComplete={() => handleStepComplete(1)}
              onProcessing={setIsProcessing}
            />
          )}

          {!isProcessing && currentStep === 2 && (
            <SeedDataStep
              onComplete={() => handleStepComplete(2)}
              onProcessing={setIsProcessing}
              onBack={handleBack}
            />
          )}

          {!isProcessing && currentStep === 3 && (
            <CreateUserStep
              onComplete={() => handleStepComplete(3)}
              onProcessing={setIsProcessing}
              onBack={handleBack}
            />
          )}

          {!isProcessing && currentStep === 4 && (
            <CompletionStep onFinish={handleFinish} />
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need help? Contact your system administrator or{" "}
          <a href="mailto:support@barq.com" className="text-primary hover:underline">
            support@barq.com
          </a>
        </p>
      </div>
    </div>
  );
}
