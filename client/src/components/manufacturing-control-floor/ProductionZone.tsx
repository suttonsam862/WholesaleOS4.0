import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ProductionUnit } from "./ProductionUnit";
import { CapacityGauge } from "./CapacityGauge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStageConfig, type ManufacturerFunnelStatus } from "@/lib/manufacturerFunnelConfig";

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

interface ProductionZoneProps {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
  jobs: Job[];
  maxCapacity?: number;
  className?: string;
}

export function ProductionZone({
  id,
  label,
  description,
  color,
  icon: Icon,
  jobs,
  maxCapacity = 20,
  className,
}: ProductionZoneProps) {
  const sortedJobs = [...jobs].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    if (a.requiredDeliveryDate && b.requiredDeliveryDate) {
      return new Date(a.requiredDeliveryDate).getTime() - new Date(b.requiredDeliveryDate).getTime();
    }
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden min-w-[280px] flex-1",
        className
      )}
      style={{ borderColor: `${color}30` }}
      data-testid={`production-zone-${id}`}
    >
      <div 
        className="p-4 border-b"
        style={{ 
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          borderColor: `${color}20`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color }}>
              {jobs.length}
            </span>
            <p className="text-xs text-muted-foreground">jobs</p>
          </div>
        </div>
        <CapacityGauge current={jobs.length} max={maxCapacity} className="mt-3" />
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {sortedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No jobs in this zone
            </div>
          ) : (
            sortedJobs.map((job) => {
              const stageConfig = getStageConfig(job.manufacturerStatus as ManufacturerFunnelStatus);
              return (
                <ProductionUnit
                  key={job.id}
                  id={job.id}
                  orderCode={job.order?.orderCode || `Job #${job.id}`}
                  clientName={job.order?.organization?.name}
                  priority={job.priority}
                  requiredDeliveryDate={job.requiredDeliveryDate}
                  status={job.manufacturerStatus}
                  statusLabel={stageConfig?.label}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
