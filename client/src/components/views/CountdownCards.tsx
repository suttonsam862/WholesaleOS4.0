import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { differenceInDays, differenceInHours, differenceInMinutes, parseISO } from "date-fns";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";

interface CountdownCardProps {
  title: string;
  endDate: Date | string;
  subtitle?: string;
  stats?: Array<{ label: string; value: string | number }>;
  thumbnail?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function CountdownCard({
  title,
  endDate,
  subtitle,
  stats,
  thumbnail,
  onAction,
  actionLabel = "View",
  className,
}: CountdownCardProps) {
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  const now = new Date();
  
  const daysLeft = differenceInDays(end, now);
  const hoursLeft = differenceInHours(end, now) % 24;
  const minutesLeft = differenceInMinutes(end, now) % 60;
  
  const isExpired = daysLeft < 0;
  const isUrgent = daysLeft < 3 && daysLeft >= 0;
  const isAttention = daysLeft >= 3 && daysLeft < 7;

  const getUrgencyColor = () => {
    if (isExpired) return "bg-gray-500";
    if (isUrgent) return "bg-red-500";
    if (isAttention) return "bg-amber-500";
    return "bg-green-500";
  };

  const getUrgencyLabel = () => {
    if (isExpired) return "Expired";
    if (isUrgent) return "Urgent";
    if (isAttention) return "Attention";
    return "On Track";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "glass-card border-white/10 overflow-hidden",
        isUrgent && "border-red-500/50 bg-red-500/5",
        isAttention && "border-amber-500/50 bg-amber-500/5",
        className
      )}>
        <CardContent className="p-0">
          {thumbnail && (
            <div className="h-32 overflow-hidden">
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-white line-clamp-1">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
                )}
              </div>
              <Badge className={cn("ml-2", getUrgencyColor())}>
                {isUrgent && <AlertTriangle className="w-3 h-3 mr-1" />}
                {isAttention && <AlertCircle className="w-3 h-3 mr-1" />}
                {getUrgencyLabel()}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-4 py-4 bg-white/5 rounded-lg mb-3">
              {isExpired ? (
                <span className="text-lg font-bold text-muted-foreground">Ended</span>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{daysLeft}</span>
                    <p className="text-xs text-muted-foreground">Days</p>
                  </div>
                  <span className="text-muted-foreground">:</span>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{hoursLeft}</span>
                    <p className="text-xs text-muted-foreground">Hours</p>
                  </div>
                  <span className="text-muted-foreground">:</span>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{minutesLeft}</span>
                    <p className="text-xs text-muted-foreground">Min</p>
                  </div>
                </>
              )}
            </div>

            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded p-2 text-center">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {onAction && (
              <button
                onClick={onAction}
                className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                data-testid="button-countdown-action"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CountdownGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function CountdownGrid({
  children,
  columns = 3,
  className,
}: CountdownGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
