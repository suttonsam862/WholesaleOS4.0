import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Factory, Truck, AlertTriangle, Clock, type LucideIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
}

interface FloorMetricsHUDProps {
  activeJobs: number;
  readyToShip: number;
  urgent: number;
  overdue: number;
  className?: string;
}

export function FloorMetricsHUD({
  activeJobs,
  readyToShip,
  urgent,
  overdue,
  className,
}: FloorMetricsHUDProps) {
  const isMobile = useIsMobile();
  
  const metrics: Metric[] = [
    { label: "Active Jobs", value: activeJobs, icon: Factory, color: "text-blue-400" },
    { label: "Ready to Ship", value: readyToShip, icon: Truck, color: "text-emerald-400" },
    { label: "Urgent", value: urgent, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Overdue", value: overdue, icon: Clock, color: "text-red-400" },
  ];

  const MetricsContent = () => (
    <div className={cn(
      "flex items-center gap-6",
      isMobile && "grid grid-cols-2 gap-3"
    )}>
      {metrics.map((metric) => (
        <div 
          key={metric.label} 
          className={cn(
            "flex items-center gap-3",
            isMobile && "flex-row justify-between p-2 rounded-lg bg-white/5"
          )} 
          data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center gap-2">
            <metric.icon className={cn("h-5 w-5", metric.color, isMobile && "h-4 w-4")} />
            {isMobile && (
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            )}
          </div>
          <div className={cn(isMobile && "text-right")}>
            <p className={cn("text-2xl font-bold text-foreground", isMobile && "text-lg")}>{metric.value}</p>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-xl bg-card/50 border backdrop-blur-sm",
          className
        )}
        data-testid="floor-metrics-hud"
      >
        <ScrollArea className="w-full">
          <MetricsContent />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-wrap items-center gap-6 p-4 rounded-xl bg-card/50 border backdrop-blur-sm",
        className
      )}
      data-testid="floor-metrics-hud"
    >
      <MetricsContent />
    </motion.div>
  );
}
