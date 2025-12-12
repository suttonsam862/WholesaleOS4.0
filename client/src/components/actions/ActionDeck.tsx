import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, ExternalLink } from "lucide-react";
import { getPinnedActions, getHubActions, type ActionConfig } from "@/lib/actionsConfig";

interface ActionDeckProps {
  hubId: string;
  className?: string;
}

function ActionCard({ action, hubId }: { action: ActionConfig; hubId: string }) {
  const Icon = action.icon;
  const hubConfig = getHubActions(hubId);
  const actionRoute = `${hubConfig?.actionsRoute}/${action.id}`;

  return (
    <Link href={actionRoute} data-testid={`action-card-${action.id}`}>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
          "border-2 border-primary/20 hover:border-primary/40",
          "h-full"
        )}
        tabIndex={0}
        role="button"
        aria-label={action.title}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            {action.requiresAI && (
              <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex items-center gap-1">
                <Zap className="h-3 w-3" />
                AI
              </span>
            )}
          </div>
          <h3 className="font-semibold text-base mb-1" data-testid={`action-title-${action.id}`}>
            {action.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {action.description}
          </p>
          <div className="flex items-center text-sm font-medium text-primary">
            Start
            <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ActionDeck({ hubId, className }: ActionDeckProps) {
  const pinnedActions = getPinnedActions(hubId);
  const hubConfig = getHubActions(hubId);

  if (!hubConfig || pinnedActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="section-quick-actions">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <p className="text-sm text-muted-foreground">Common tasks you can do right now</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={hubConfig.actionsRoute}>
            <Button variant="ghost" size="sm" data-testid="link-more-actions">
              More actions
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href={hubConfig.fullPageRoute}>
            <Button variant="outline" size="sm" data-testid="link-full-page">
              <ExternalLink className="h-4 w-4 mr-1" />
              View full detail page
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pinnedActions.map((action) => (
          <ActionCard key={action.id} action={action} hubId={hubId} />
        ))}
      </div>
    </div>
  );
}
