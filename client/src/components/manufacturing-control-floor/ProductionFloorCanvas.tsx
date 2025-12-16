import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProductionZone } from "./ProductionZone";
import { FloorMetricsHUD } from "./FloorMetricsHUD";
import { ExceptionPanel } from "./ExceptionPanel";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  const [showExceptions, setShowExceptions] = useState(false);

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

  return (
    <div className={cn("space-y-6", className)} data-testid="production-floor-canvas">
      <div className="flex items-center justify-between gap-4">
        <FloorMetricsHUD
          activeJobs={metrics.activeJobs}
          readyToShip={metrics.readyToShip}
          urgent={metrics.urgent}
          overdue={metrics.overdue}
          className="flex-1"
        />
        
        {exceptions.length > 0 && (
          <Button
            variant={showExceptions ? "default" : "outline"}
            onClick={() => setShowExceptions(!showExceptions)}
            className={cn(
              "gap-2",
              exceptions.length > 0 && "border-red-500/50 text-red-400 hover:bg-red-500/10"
            )}
            data-testid="button-toggle-exceptions"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{exceptions.length} Exceptions</span>
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-h-[500px]">
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

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" />
        <span>Scroll horizontally to see all production zones</span>
        <ChevronRight className="h-4 w-4" />
      </div>

      <ExceptionPanel
        exceptions={exceptions}
        isOpen={showExceptions}
        onClose={() => setShowExceptions(false)}
      />
    </div>
  );
}
