import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Sparkles, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { celebrateSuccess } from "@/lib/confetti";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  isValid?: boolean;
}

interface QuickActionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  steps: WizardStep[];
  onComplete: () => Promise<void> | void;
  isAiPowered?: boolean;
  isComingSoon?: boolean;
  accentColor?: string;
}

export function QuickActionWizard({
  isOpen,
  onClose,
  title,
  description,
  icon,
  steps,
  onComplete,
  isAiPowered = false,
  isComingSoon = false,
  accentColor = "primary",
}: QuickActionWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canProceed = currentStep?.isValid !== false;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setIsCompleted(false);
      setIsCompleting(false);
      setIsError(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [isLastStep, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    setIsError(false);
    setErrorMessage("");
    try {
      await onComplete();
      setIsCompleted(true);
      celebrateSuccess();
    } catch (error) {
      console.error("Failed to complete action:", error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  }, [onComplete]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        data-testid="quick-action-wizard-overlay"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={cn(
            "relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden rounded-2xl",
            "bg-gradient-to-br from-background/95 via-background/90 to-background/95",
            "backdrop-blur-xl border border-white/10",
            "shadow-2xl shadow-black/20",
            "ring-1 ring-white/5"
          )}
          style={{
            boxShadow: `0 0 60px -15px hsl(var(--${accentColor}) / 0.3)`,
          }}
          data-testid="quick-action-wizard-modal"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div
            className={cn(
              "absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none",
              `bg-${accentColor}`
            )}
            style={{ background: `hsl(var(--${accentColor}) / 0.2)` }}
          />

          {isComingSoon && (
            <div className="absolute top-4 right-16 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500 text-sm font-medium">
                <Clock className="h-3.5 w-3.5" />
                Coming Soon
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 z-10 p-2 rounded-full",
              "bg-white/5 hover:bg-white/10 transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-close-wizard"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative flex flex-col h-full max-h-[90vh]">
            <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-white/5">
              <div className="flex items-start gap-4">
                {icon && (
                  <div
                    className={cn(
                      "flex-shrink-0 p-3 rounded-xl",
                      "bg-gradient-to-br from-primary/20 to-primary/10",
                      "ring-1 ring-primary/20"
                    )}
                  >
                    {icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-2xl font-bold tracking-tight"
                      data-testid="text-wizard-title"
                    >
                      {title}
                    </h2>
                    {isAiPowered && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="mt-1 text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>

              {steps.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          index < currentStepIndex && setCurrentStepIndex(index)
                        }
                        disabled={index > currentStepIndex}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          index === currentStepIndex &&
                            "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                          index < currentStepIndex &&
                            "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer",
                          index > currentStepIndex &&
                            "bg-white/5 text-muted-foreground cursor-not-allowed"
                        )}
                        data-testid={`step-indicator-${step.id}`}
                      >
                        {index < currentStepIndex ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current/10 text-xs">
                            {index + 1}
                          </span>
                        )}
                        <span className="hidden sm:inline">{step.title}</span>
                      </button>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "w-8 h-0.5 rounded-full",
                            index < currentStepIndex
                              ? "bg-primary"
                              : "bg-white/10"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {isCompleted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <Check className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Action Complete!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your changes have been saved successfully.
                  </p>
                  <Button onClick={onClose} data-testid="button-done">
                    Done
                  </Button>
                </motion.div>
              ) : isError ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" data-testid="text-error-title">Something went wrong</h3>
                  <p className="text-muted-foreground mb-2 max-w-md" data-testid="text-error-message">
                    {errorMessage || "Failed to complete the action. Please try again."}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} data-testid="button-close-error">
                      Close
                    </Button>
                    <Button onClick={handleComplete} disabled={isCompleting} data-testid="button-retry">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isCompleting ? "Retrying..." : "Try Again"}
                    </Button>
                  </div>
                </motion.div>
              ) : isComingSoon ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                    <Clock className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-2 max-w-md">
                    This feature is currently in development and will be available soon.
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-6">
                    Shopify integration requires additional setup and API configuration.
                  </p>
                  <Button variant="outline" onClick={onClose} data-testid="button-close-coming-soon">
                    Close
                  </Button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep?.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep?.component}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {!isCompleted && !isError && !isComingSoon && (
              <div className="flex-shrink-0 px-8 py-4 border-t border-white/5 bg-white/2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className={cn(isFirstStep && "invisible")}
                    data-testid="button-back"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Step {currentStepIndex + 1} of {steps.length}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed || isCompleting}
                    className={cn(
                      "min-w-[120px]",
                      isLastStep &&
                        "bg-green-600 hover:bg-green-700 text-white"
                    )}
                    data-testid={isLastStep ? "button-complete" : "button-next"}
                  >
                    {isCompleting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : isLastStep ? (
                      <>
                        Complete
                        <Check className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
