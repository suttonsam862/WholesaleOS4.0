import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Loader2, Zap } from "lucide-react";
import { getActionById, type ActionStep, type ActionConfig } from "@/lib/actionsConfig";

interface ActionPageShellProps {
  hubId: string;
  actionId: string;
  children: (props: {
    currentStep: ActionStep;
    stepIndex: number;
    totalSteps: number;
    goNext: () => void;
    goBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    setStepData: (data: any) => void;
    stepData: Record<string, any>;
    action: ActionConfig;
  }) => React.ReactNode;
}

function StepIndicator({ 
  steps, 
  currentStepIndex 
}: { 
  steps: ActionStep[]; 
  currentStepIndex: number;
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                isCompleted && "bg-primary border-primary text-primary-foreground",
                isCurrent && "border-primary text-primary",
                !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
              )}
              data-testid={`step-indicator-${step.id}`}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex flex-col ml-2 mr-4 min-w-[80px]">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mr-4",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ActionPageShell({ hubId, actionId, children }: ActionPageShellProps) {
  const [, navigate] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const action = getActionById(hubId, actionId);

  if (!action) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Action not found</p>
            <Link href={`/${hubId}`}>
              <Button variant="link" className="mt-4">
                Go back to {hubId}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = action.steps;
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const updateStepData = (data: any) => {
    setStepData((prev) => ({
      ...prev,
      [currentStep.id]: data,
    }));
  };

  const Icon = action.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/${hubId}`}>
          <Button variant="ghost" size="sm" data-testid="button-back-to-hub">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {action.title.split(" ")[0]}
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2" data-testid="action-page-title">
                {action.title}
                {action.requiresAI && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    AI-powered
                  </span>
                )}
              </CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <StepIndicator steps={steps} currentStepIndex={currentStepIndex} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg" data-testid="current-step-title">
            {currentStep.title}
          </CardTitle>
          {currentStep.description && (
            <CardDescription>{currentStep.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {children({
            currentStep,
            stepIndex: currentStepIndex,
            totalSteps: steps.length,
            goNext,
            goBack,
            isFirstStep,
            isLastStep,
            isLoading,
            setLoading: setIsLoading,
            setStepData: updateStepData,
            stepData,
            action,
          })}

          {currentStep.type === "done" && (
            <div className="flex justify-center mt-6">
              <Link href={`/${hubId}`}>
                <Button data-testid="button-finish">
                  Finish
                  <Check className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {currentStep.type !== "done" && (
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={isFirstStep || isLoading}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={goNext}
                disabled={isLoading}
                data-testid="button-next"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : currentStep.type === "confirm" ? (
                  <>
                    Confirm & Save
                    <Check className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
