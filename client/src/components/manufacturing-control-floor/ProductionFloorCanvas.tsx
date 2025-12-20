import { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProductionZone } from "./ProductionZone";
import { FloorMetricsHUD } from "./FloorMetricsHUD";
import { ExceptionPanel } from "./ExceptionPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, ChevronRight, LayoutGrid, List, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ZONE_CONFIGS,
  getStageConfig,
  type ManufacturerZone,
  type ManufacturerFunnelStatus,
} from "@/lib/manufacturerFunnelConfig";

interface Job {
  id: number;
  manufacturerStatus: string;
  publicStatus: string;
  requiredDeliveryDate: string | null;
  priority: string;
  order?: {
    orderCode: string;
    organization?: {
      name: string;
    };
  };
}

interface ProductionFloorCanvasProps {
  jobs: Job[];
  className?: string;
}

export function ProductionFloorCanvas({ jobs, className }: ProductionFloorCanvasProps) {
  const isMobile = useIsMobile();
  const [showExceptions, setShowExceptions] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"canvas" | "list">("list");
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number>(0);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (lastTouchDistance.current > 0) {
        const delta = distance - lastTouchDistance.current;
        const scaleChange = delta * 0.005;
        setScale((prev) => Math.min(Math.max(prev + scaleChange, 0.5), 2));
      }
      
      lastTouchDistance.current = distance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = 0;
  }, []);

  const jobsByZone = useMemo(() => {
    const grouped: Record<ManufacturerZone, Job[]> = {
      intake: [],
      specs: [],
      samples: [],
      production: [],
      shipping: [],
    };

    for (const job of jobs) {
      const stageConfig = getStageConfig(job.manufacturerStatus as ManufacturerFunnelStatus);
      if (stageConfig) {
        grouped[stageConfig.zone].push(job);
      }
    }

    return grouped;
  }, [jobs]);

  const metrics = useMemo(() => {
    const activeJobs = jobs.filter(
      (j) => !["delivered_confirmed", "handed_to_carrier"].includes(j.manufacturerStatus)
    ).length;
    
    const readyToShip = jobs.filter((j) => j.manufacturerStatus === "packing_complete").length;
    
    const urgent = jobs.filter(
      (j) => j.priority === "urgent" || j.priority === "high"
    ).length;
    
    const overdue = jobs.filter((j) => {
      if (!j.requiredDeliveryDate) return false;
      const completedStatuses = ["delivered_confirmed", "handed_to_carrier"];
      return new Date(j.requiredDeliveryDate) < new Date() && 
             !completedStatuses.includes(j.manufacturerStatus);
    }).length;

    return { activeJobs, readyToShip, urgent, overdue };
  }, [jobs]);

  const exceptions = useMemo(() => {
    const exceptionList: Array<{
      id: number;
      orderCode: string;
      clientName?: string;
      type: "urgent" | "overdue";
      requiredDeliveryDate?: string | null;
      priority?: string;
    }> = [];

    const completedStatuses = ["delivered_confirmed", "handed_to_carrier"];
    
    for (const job of jobs) {
      const isOverdue = job.requiredDeliveryDate && 
        new Date(job.requiredDeliveryDate) < new Date() &&
        !completedStatuses.includes(job.manufacturerStatus);
      
      if (isOverdue) {
        exceptionList.push({
          id: job.id,
          orderCode: job.order?.orderCode || `Job #${job.id}`,
          clientName: job.order?.organization?.name,
          type: "overdue",
          requiredDeliveryDate: job.requiredDeliveryDate,
        });
      }

      const isUrgent = (job.priority === "urgent" || job.priority === "high") && !isOverdue;
      if (isUrgent) {
        exceptionList.push({
          id: job.id,
          orderCode: job.order?.orderCode || `Job #${job.id}`,
          clientName: job.order?.organization?.name,
          type: "urgent",
          priority: job.priority,
        });
      }
    }

    return exceptionList;
  }, [jobs]);

  const MobileListView = () => (
    <div className="space-y-3">
      {ZONE_CONFIGS.map((zone) => {
        const zoneJobs = jobsByZone[zone.id];
        return (
          <Card key={zone.id} className="glass-card border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-medium text-sm">{zone.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {zoneJobs.length}
                </Badge>
              </div>
              {zoneJobs.length > 0 ? (
                <div className="space-y-2">
                  {zoneJobs.slice(0, 3).map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 min-h-[44px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {job.order?.orderCode || `Job #${job.id}`}
                        </p>
                        {job.order?.organization?.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {job.order.organization.name}
                          </p>
                        )}
                      </div>
                      {(job.priority === "urgent" || job.priority === "high") && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] shrink-0 ml-2",
                            job.priority === "urgent" ? "border-red-500/50 text-red-400" : "border-orange-500/50 text-orange-400"
                          )}
                        >
                          {job.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {zoneJobs.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{zoneJobs.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No jobs in this zone
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className={cn("space-y-4", isMobile && "space-y-3", className)} data-testid="production-floor-canvas">
      <div className={cn("flex items-center justify-between gap-4", isMobile && "flex-col gap-3")}>
        <FloorMetricsHUD
          activeJobs={metrics.activeJobs}
          readyToShip={metrics.readyToShip}
          urgent={metrics.urgent}
          overdue={metrics.overdue}
          className="flex-1 w-full"
        />
        
        <div className={cn("flex items-center gap-2", isMobile && "w-full justify-between")}>
          {isMobile && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setMobileViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
                  mobileViewMode === "list"
                    ? "bg-primary/20 text-primary"
                    : "text-white/40 hover:text-white"
                )}
                data-testid="button-mobile-list-view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileViewMode("canvas")}
                className={cn(
                  "p-2 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
                  mobileViewMode === "canvas"
                    ? "bg-primary/20 text-primary"
                    : "text-white/40 hover:text-white"
                )}
                data-testid="button-mobile-canvas-view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {exceptions.length > 0 && (
            <Button
              variant={showExceptions ? "default" : "outline"}
              onClick={() => setShowExceptions(!showExceptions)}
              className={cn(
                "gap-2",
                exceptions.length > 0 && "border-red-500/50 text-red-400 hover:bg-red-500/10",
                isMobile && "h-11 min-h-[44px]"
              )}
              data-testid="button-toggle-exceptions"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{exceptions.length} Exceptions</span>
            </Button>
          )}
        </div>
      </div>

      {isMobile && mobileViewMode === "list" ? (
        <MobileListView />
      ) : (
        <>
          {isMobile && mobileViewMode === "canvas" && (
            <div className="flex items-center justify-center gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="h-10 w-10 p-0 min-w-[44px] min-h-[44px]"
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="h-10 w-10 p-0 min-w-[44px] min-h-[44px]"
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                className="h-10 w-10 p-0 min-w-[44px] min-h-[44px]"
                data-testid="button-reset-zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <ScrollArea className="w-full">
              <div 
                ref={canvasRef}
                className={cn("flex gap-4 pb-4", isMobile ? "min-h-[350px]" : "min-h-[500px]")}
                style={isMobile ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}
                onTouchStart={isMobile ? handleTouchStart : undefined}
                onTouchMove={isMobile ? handleTouchMove : undefined}
                onTouchEnd={isMobile ? handleTouchEnd : undefined}
              >
                {ZONE_CONFIGS.map((zone) => (
                  <ProductionZone
                    key={zone.id}
                    id={zone.id}
                    label={zone.label}
                    description={zone.description}
                    color={zone.color}
                    icon={zone.icon}
                    jobs={jobsByZone[zone.id]}
                    maxCapacity={zone.id === "production" ? 30 : 20}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </motion.div>

          {!isMobile && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
              <span>Scroll horizontally to see all production zones</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </>
      )}

      <ExceptionPanel
        exceptions={exceptions}
        isOpen={showExceptions}
        onClose={() => setShowExceptions(false)}
      />
    </div>
  );
}
