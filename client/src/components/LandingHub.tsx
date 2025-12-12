import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, List, type LucideIcon } from "lucide-react";

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
}: LandingHubProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid={`text-${testIdPrefix}-title`}>
            {title}
          </h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-40" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid={`text-${testIdPrefix}-title`}>
            {title}
          </h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Link href={viewAllHref}>
          <Button variant="outline" data-testid={`link-${testIdPrefix}-view-all`}>
            <List className="h-4 w-4 mr-2" />
            {viewAllLabel}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  "border-2"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${card.label}: ${card.count} items`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-3 rounded-lg", card.bgColorClass)}>
                      <Icon className={cn("h-6 w-6", card.colorClass)} aria-hidden="true" />
                    </div>
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        card.count > 0 ? card.colorClass : "text-muted-foreground"
                      )}
                      data-testid={`count-${testIdPrefix}-${card.id}`}
                    >
                      {card.count}
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-lg mb-1"
                    data-testid={`label-${testIdPrefix}-${card.id}`}
                  >
                    {card.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{card.description}</p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    View {title.toLowerCase()}
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
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
