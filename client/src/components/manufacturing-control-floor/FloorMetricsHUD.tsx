import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Factory, Truck, AlertTriangle, Clock, type LucideIcon } from "lucide-react";

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
  const metrics: Metric[] = [
    { label: "Active Jobs", value: activeJobs, icon: Factory, color: "text-blue-400" },
    { label: "Ready to Ship", value: readyToShip, icon: Truck, color: "text-emerald-400" },
    { label: "Urgent", value: urgent, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Overdue", value: overdue, icon: Clock, color: "text-red-400" },
  ];

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
      {metrics.map((metric) => (
        <div key={metric.label} className="flex items-center gap-3" data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
          <metric.icon className={cn("h-5 w-5", metric.color)} />
          <div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
