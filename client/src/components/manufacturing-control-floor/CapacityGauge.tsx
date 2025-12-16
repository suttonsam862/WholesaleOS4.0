import { cn } from "@/lib/utils";

interface CapacityGaugeProps {
  current: number;
  max: number;
  className?: string;
}

export function CapacityGauge({ current, max, className }: CapacityGaugeProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  
  const getColor = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="capacity-gauge">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {current}/{max}
      </span>
    </div>
  );
}
