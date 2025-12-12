import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, ExternalLink, Clock, Sparkles } from "lucide-react";
import { getPinnedActions, getHubActions, type ActionConfig } from "@/lib/actionsConfig";
import { motion } from "framer-motion";

interface ActionDeckProps {
  hubId: string;
  className?: string;
}

function ActionCard({ action, hubId, index }: { action: ActionConfig; hubId: string; index: number }) {
  const Icon = action.icon;
  const hubConfig = getHubActions(hubId);
  const actionRoute = `${hubConfig?.actionsRoute}/${action.id}`;

  return (
    <Link href={actionRoute} data-testid={`action-card-${action.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
            "border border-primary/20 hover:border-primary/40",
            "h-full relative overflow-hidden group",
            "bg-gradient-to-br from-background to-background/80"
          )}
          tabIndex={0}
          role="button"
          aria-label={action.title}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              boxShadow: '0 0 20px hsl(var(--primary) / 0.5)'
            }}
          />
          <CardContent className="p-5 relative">
            <div className="flex items-start gap-3 mb-3">
              <div className={cn(
                "p-2.5 rounded-lg shrink-0 transition-all",
                "bg-primary/10 group-hover:bg-primary/20",
                "ring-1 ring-primary/20 group-hover:ring-primary/40"
              )}>
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {action.requiresAI && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
                {action.isComingSoon && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-500 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Soon
                  </span>
                )}
              </div>
            </div>
            <h3 className="font-semibold text-base mb-1" data-testid={`action-title-${action.id}`}>
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {action.description}
            </p>
            <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
              Start
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {pinnedActions.map((action, index) => (
          <ActionCard key={action.id} action={action} hubId={hubId} index={index} />
        ))}
      </div>
    </div>
  );
}
