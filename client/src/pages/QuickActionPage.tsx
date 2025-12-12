import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { QuickActionWizard, type WizardStep } from "@/components/quick-actions";
import { getActionById, getHubActions, type ActionConfig } from "@/lib/actionsConfig";
import { Loader2 } from "lucide-react";

interface QuickActionPageProps {
  hubId: string;
}

export function QuickActionPage({ hubId }: QuickActionPageProps) {
  const [, params] = useRoute(`/${hubId}/actions/:actionId`);
  const [, setLocation] = useLocation();
  const actionId = params?.actionId;

  const action = actionId ? getActionById(hubId, actionId) : undefined;
  const hubConfig = getHubActions(hubId);

  const handleClose = () => {
    setLocation(`/${hubId}`);
  };

  const handleComplete = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  if (!action || !hubConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading action...</p>
        </div>
      </div>
    );
  }

  const Icon = action.icon;

  const wizardSteps: WizardStep[] = action.steps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    component: (
      <DefaultStepContent
        step={step}
        action={action}
        hubId={hubId}
      />
    ),
    isValid: true,
  }));

  return (
    <QuickActionWizard
      isOpen={true}
      onClose={handleClose}
      title={action.title}
      description={action.description}
      icon={<Icon className="h-6 w-6 text-primary" />}
      steps={wizardSteps}
      onComplete={handleComplete}
      isAiPowered={action.requiresAI}
      isComingSoon={action.isComingSoon}
    />
  );
}

interface DefaultStepContentProps {
  step: {
    id: string;
    type: string;
    title: string;
    description?: string;
  };
  action: ActionConfig;
  hubId: string;
}

function DefaultStepContent({ step, action, hubId }: DefaultStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <action.icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {step.description || `Complete this step to continue with ${action.title}`}
        </p>
      </div>

      {step.type === "pick" && (
        <div className="p-6 border border-dashed border-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Selection interface will be implemented here based on the specific action requirements.
          </p>
        </div>
      )}

      {step.type === "choose" && (
        <div className="p-6 border border-dashed border-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Configuration options will be implemented here based on the specific action requirements.
          </p>
        </div>
      )}

      {step.type === "preview" && (
        <div className="p-6 border border-dashed border-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Preview of changes will be shown here before confirmation.
          </p>
        </div>
      )}

      {step.type === "confirm" && (
        <div className="p-6 border border-dashed border-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Final confirmation and summary will be shown here.
          </p>
        </div>
      )}
    </div>
  );
}
