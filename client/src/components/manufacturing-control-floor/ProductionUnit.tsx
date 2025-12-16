import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface ProductionUnitProps {
  id: number;
  orderCode: string;
  clientName?: string;
  priority: string;
  requiredDeliveryDate: string | null;
  status: string;
  statusLabel?: string;
  onClick?: () => void;
}

export function ProductionUnit({
  id,
  orderCode,
  clientName,
  priority,
  requiredDeliveryDate,
  status,
  statusLabel,
  onClick,
}: ProductionUnitProps) {
  const isUrgent = priority === "urgent" || priority === "high";
  const isOverdue = requiredDeliveryDate && new Date(requiredDeliveryDate) < new Date();

  return (
    <Link href={`/manufacturer-portal/job/${id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all",
          "bg-card hover:bg-card/80",
          isOverdue && "border-red-500/50 bg-red-500/5",
          isUrgent && !isOverdue && "border-amber-500/50 bg-amber-500/5",
          !isUrgent && !isOverdue && "border-border"
        )}
        onClick={onClick}
        data-testid={`production-unit-${id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {orderCode}
              </span>
              {isUrgent && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              )}
            </div>
            {clientName && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {clientName}
              </p>
            )}
          </div>
          {isOverdue && (
            <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {statusLabel && (
            <span className="text-xs text-muted-foreground truncate">
              {statusLabel}
            </span>
          )}
          {requiredDeliveryDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(requiredDeliveryDate), "MMM d")}</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
