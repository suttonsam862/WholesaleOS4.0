import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, List, Factory, Clock, Scissors, Printer, Package, Truck, CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDeck } from "@/components/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MANUFACTURING_STATUS_CONFIG,
  type ManufacturingStatus,
} from "@/lib/status-system";

interface ManufacturingRecord {
  id: number;
  status: string;
}

const iconMap: Record<string, typeof Factory> = {
  Clock,
  PackageCheck,
  Scissors,
  Printer,
  Package,
  Truck,
  CheckCircle2,
};

const ALL_STAGE_CONFIG = {
  id: "all",
  label: "All Items",
  description: "View all manufacturing records",
  icon: Factory,
  colorClass: "text-blue-500",
  bgColorClass: "bg-blue-500/10",
  borderColorClass: "border-blue-500/30",
};

const STATUS_STAGE_CONFIGS = Object.entries(MANUFACTURING_STATUS_CONFIG).map(([id, config]) => ({
  id,
  label: config.label,
  description: getStageDescription(id),
  icon: iconMap[config.icon] || Package,
  colorClass: config.textClass,
  bgColorClass: config.bgClass,
  borderColorClass: config.borderClass,
}));

const STAGE_CONFIGS = [ALL_STAGE_CONFIG, ...STATUS_STAGE_CONFIGS];

function getStageDescription(stageId: string): string {
  const descriptions: Record<string, string> = {
    awaiting_admin_confirmation: "Orders awaiting admin confirmation",
    confirmed_awaiting_manufacturing: "Confirmed and ready for production",
    cutting_sewing: "In cutting and sewing phase",
    printing: "In printing phase",
    final_packing_press: "Final packing and pressing",
    shipped: "Shipped to customer",
    complete: "Manufacturing complete",
  };
  return descriptions[stageId] || "Manufacturing records";
}

export default function ManufacturingHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: manufacturingRecords = [], isLoading: recordsLoading } = useQuery<ManufacturingRecord[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: manufacturingRecords.length,
    };
    STATUS_STAGE_CONFIGS.forEach(stage => {
      counts[stage.id] = 0;
    });
    
    manufacturingRecords.forEach((record) => {
      if (counts[record.status] !== undefined) {
        counts[record.status]++;
      }
    });

    return counts;
  }, [manufacturingRecords]);

  if (recordsLoading) {
    return (
      <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Manufacturing</h1>
          <p className="text-sm text-muted-foreground">Loading your workflow...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className={cn("h-32 sm:h-40", isMobile ? "p-3" : "p-6")} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Manufacturing</h1>
          <p className="text-sm text-muted-foreground">Select a workflow stage to view manufacturing records</p>
        </div>
        <Link href="/manufacturing/list">
          <Button 
            variant="outline" 
            data-testid="link-all-manufacturing"
            className={cn("min-h-[44px]", isMobile && "w-full")}
          >
            <List className="h-4 w-4 mr-2" />
            View All Manufacturing
          </Button>
        </Link>
      </div>

      {isMobile ? (
        <ScrollArea className="w-full whitespace-nowrap mb-4">
          <div className="flex gap-2 pb-3">
            <ActionDeck hubId="manufacturing" />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <ActionDeck hubId="manufacturing" />
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {STAGE_CONFIGS.map((stage) => {
          const count = stageCounts[stage.id] || 0;
          const Icon = stage.icon;
          
          return (
            <Link
              key={stage.id}
              href={stage.id === "all" ? "/manufacturing/list" : `/manufacturing/list?status=${stage.id}`}
              data-testid={`tile-stage-${stage.id}`}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                  stage.borderColorClass,
                  "border-2 min-h-[44px]"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${stage.label}: ${count} records`}
              >
                <CardContent className={cn(isMobile ? "p-3" : "p-6")}>
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className={cn(
                      "rounded-lg",
                      isMobile ? "p-2" : "p-3",
                      stage.bgColorClass
                    )}>
                      <Icon className={cn(
                        isMobile ? "h-5 w-5" : "h-6 w-6",
                        stage.colorClass
                      )} aria-hidden="true" />
                    </div>
                    <span
                      className={cn(
                        isMobile ? "text-2xl" : "text-3xl",
                        "font-bold",
                        count > 0 ? stage.colorClass : "text-muted-foreground"
                      )}
                      data-testid={`count-stage-${stage.id}`}
                    >
                      {count}
                    </span>
                  </div>
                  <h3 className={cn(
                    "font-semibold mb-0.5 sm:mb-1",
                    isMobile ? "text-sm" : "text-lg"
                  )} data-testid={`label-stage-${stage.id}`}>
                    {stage.label}
                  </h3>
                  <p className={cn(
                    "text-muted-foreground mb-2 sm:mb-3 line-clamp-2",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {stage.description}
                  </p>
                  <div className={cn(
                    "flex items-center font-medium text-primary",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    View records
                    <ArrowRight className={cn(
                      "ml-1",
                      isMobile ? "h-3 w-3" : "h-4 w-4"
                    )} aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className={cn(
        "mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/50 rounded-lg",
        isMobile && "mb-20"
      )}>
        <p className="text-xs sm:text-sm text-muted-foreground">
          <strong>Tip:</strong> Click on any stage above to see manufacturing records in that workflow state. 
          Use "View All Manufacturing" for a complete list with advanced filters.
        </p>
      </div>
    </div>
  );
}
