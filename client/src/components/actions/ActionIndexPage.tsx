import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Search, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import { getHubActions, type ActionConfig } from "@/lib/actionsConfig";

interface ActionIndexPageProps {
  hubId: string;
}

function ActionListItem({ action, hubId }: { action: ActionConfig; hubId: string }) {
  const Icon = action.icon;
  const hubConfig = getHubActions(hubId);
  const actionRoute = `${hubConfig?.actionsRoute}/${action.id}`;

  return (
    <Link href={actionRoute} data-testid={`action-list-item-${action.id}`}>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md hover:border-primary/40",
          "border hover:scale-[1.01]"
        )}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{action.title}</h3>
              {action.requiresAI && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  AI
                </span>
              )}
              {action.pinned && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                  Pinned
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {action.description}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export function ActionIndexPage({ hubId }: ActionIndexPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hubConfig = getHubActions(hubId);

  const filteredActions = useMemo(() => {
    if (!hubConfig) return [];
    if (!searchQuery.trim()) return hubConfig.actions;

    const query = searchQuery.toLowerCase();
    return hubConfig.actions.filter(
      (action) =>
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
    );
  }, [hubConfig, searchQuery]);

  if (!hubConfig) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Hub not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/${hubId}`}>
          <Button variant="ghost" size="sm" data-testid="button-back-to-hub">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {hubConfig.hubTitle}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" data-testid="page-title-actions">
          {hubConfig.hubTitle} Actions
        </h1>
        <p className="text-muted-foreground">
          Choose an action to get started with a guided workflow
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-actions"
        />
      </div>

      <div className="space-y-3">
        {filteredActions.map((action) => (
          <ActionListItem key={action.id} action={action} hubId={hubId} />
        ))}

        {filteredActions.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No actions found matching "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
