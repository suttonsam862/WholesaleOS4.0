import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowRight, List, type LucideIcon } from "lucide-react";
import { ActionDeck } from "@/components/actions";
import { getHubActions } from "@/lib/actionsConfig";
import { useIsMobile } from "@/hooks/use-mobile";

export interface HubCardConfig {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  count: number;
  href: string;
}

interface LandingHubProps {
  title: string;
  subtitle: string;
  cards: HubCardConfig[];
  viewAllHref: string;
  viewAllLabel: string;
  isLoading?: boolean;
  tip?: string;
  testIdPrefix?: string;
  hubId?: string;
}

export function LandingHub({
  title,
  subtitle,
  cards,
  viewAllHref,
  viewAllLabel,
  isLoading = false,
  tip,
  testIdPrefix = "hub",
  hubId,
}: LandingHubProps) {
  const isMobile = useIsMobile();
  const hasActions = hubId && getHubActions(hubId);
  
  if (isLoading) {
    return (
      <div className={cn("p-6", isMobile && "p-4")}>
        <div className="mb-6">
          <h1 className={cn("text-2xl font-bold", isMobile && "text-xl")} data-testid={`text-${testIdPrefix}-title`}>
            {title}
          </h1>
          <p className={cn("text-muted-foreground", isMobile && "text-sm")}>Loading...</p>
        </div>
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-2 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className={cn("h-40", isMobile ? "p-3 h-28" : "p-6")} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6", isMobile && "p-4")}>
      <div className={cn("flex items-center justify-between mb-6", isMobile && "mb-4 flex-col items-start gap-3")}>
        <div>
          <h1 className={cn("text-2xl font-bold", isMobile && "text-xl")} data-testid={`text-${testIdPrefix}-title`}>
            {title}
          </h1>
          <p className={cn("text-muted-foreground", isMobile && "text-sm")}>{subtitle}</p>
        </div>
        <Link href={viewAllHref}>
          <Button 
            variant="outline" 
            data-testid={`link-${testIdPrefix}-view-all`}
            className={cn(isMobile && "h-11 min-h-[44px]")}
          >
            <List className="h-4 w-4 mr-2" />
            {viewAllLabel}
          </Button>
        </Link>
      </div>

      {hasActions && hubId && (
        isMobile ? (
          <ScrollArea className="w-full mb-4">
            <div className="pb-3">
              <ActionDeck hubId={hubId} />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <ActionDeck hubId={hubId} />
        )
      )}

      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              data-testid={`tile-${testIdPrefix}-${card.id}`}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
                  card.borderColorClass,
                  "border-2",
                  isMobile && "active:scale-[0.98]"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${card.label}: ${card.count} items`}
              >
                <CardContent className={cn("p-6", isMobile && "p-3")}>
                  <div className={cn("flex items-start justify-between mb-4", isMobile && "mb-2")}>
                    <div className={cn("p-3 rounded-lg", card.bgColorClass, isMobile && "p-2")}>
                      <Icon className={cn("h-6 w-6", card.colorClass, isMobile && "h-5 w-5")} aria-hidden="true" />
                    </div>
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        card.count > 0 ? card.colorClass : "text-muted-foreground",
                        isMobile && "text-2xl"
                      )}
                      data-testid={`count-${testIdPrefix}-${card.id}`}
                    >
                      {card.count}
                    </span>
                  </div>
                  <h3
                    className={cn("font-semibold text-lg mb-1", isMobile && "text-sm mb-0.5")}
                    data-testid={`label-${testIdPrefix}-${card.id}`}
                  >
                    {card.label}
                  </h3>
                  <p className={cn("text-sm text-muted-foreground mb-3", isMobile && "text-xs mb-2 line-clamp-2")}>{card.description}</p>
                  <div className={cn("flex items-center text-sm font-medium text-primary", isMobile && "text-xs")}>
                    View {title.toLowerCase()}
                    <ArrowRight className={cn("h-4 w-4 ml-1", isMobile && "h-3 w-3")} aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {tip && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> {tip}
          </p>
        </div>
      )}
    </div>
  );
}

export const hubColors = {
  blue: {
    colorClass: "text-blue-500",
    bgColorClass: "bg-blue-500/10",
    borderColorClass: "border-blue-500/30",
  },
  yellow: {
    colorClass: "text-yellow-500",
    bgColorClass: "bg-yellow-500/10",
    borderColorClass: "border-yellow-500/30",
  },
  purple: {
    colorClass: "text-purple-500",
    bgColorClass: "bg-purple-500/10",
    borderColorClass: "border-purple-500/30",
  },
  orange: {
    colorClass: "text-orange-500",
    bgColorClass: "bg-orange-500/10",
    borderColorClass: "border-orange-500/30",
  },
  amber: {
    colorClass: "text-amber-500",
    bgColorClass: "bg-amber-500/10",
    borderColorClass: "border-amber-500/30",
  },
  indigo: {
    colorClass: "text-indigo-500",
    bgColorClass: "bg-indigo-500/10",
    borderColorClass: "border-indigo-500/30",
  },
  green: {
    colorClass: "text-green-500",
    bgColorClass: "bg-green-500/10",
    borderColorClass: "border-green-500/30",
  },
  red: {
    colorClass: "text-red-500",
    bgColorClass: "bg-red-500/10",
    borderColorClass: "border-red-500/30",
  },
  pink: {
    colorClass: "text-pink-500",
    bgColorClass: "bg-pink-500/10",
    borderColorClass: "border-pink-500/30",
  },
  cyan: {
    colorClass: "text-cyan-500",
    bgColorClass: "bg-cyan-500/10",
    borderColorClass: "border-cyan-500/30",
  },
  teal: {
    colorClass: "text-teal-500",
    bgColorClass: "bg-teal-500/10",
    borderColorClass: "border-teal-500/30",
  },
  slate: {
    colorClass: "text-slate-500",
    bgColorClass: "bg-slate-500/10",
    borderColorClass: "border-slate-500/30",
  },
};
