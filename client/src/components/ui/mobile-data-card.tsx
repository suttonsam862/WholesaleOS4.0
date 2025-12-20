import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface MetadataItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warning";
}

interface MobileDataCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: {
    value: string;
    label: string;
  };
  metadata?: MetadataItem[];
  actions?: ActionItem[];
  onClick?: () => void;
  className?: string;
  index?: number;
  "data-testid"?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

const actionVariants: Record<string, string> = {
  default: "bg-primary/20 text-primary",
  danger: "bg-red-500/20 text-red-400",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
};

export function MobileDataCard({
  title,
  subtitle,
  status,
  metadata = [],
  actions = [],
  onClick,
  className,
  index = 0,
  "data-testid": testId,
}: MobileDataCardProps) {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const x = useMotionValue(0);
  const actionsWidth = actions.length * 60;
  
  const cardX = useTransform(x, (latest) => Math.min(0, Math.max(-actionsWidth, latest)));
  const actionsOpacity = useTransform(x, [-actionsWidth, -20, 0], [1, 0.5, 0]);
  const actionsScale = useTransform(x, [-actionsWidth, 0], [1, 0.8]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = actionsWidth / 2;
    if (info.offset.x < -threshold) {
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
    }
  };

  React.useEffect(() => {
    x.set(isRevealed ? -actionsWidth : 0);
  }, [isRevealed, actionsWidth, x]);

  const handleCardClick = () => {
    if (isRevealed) {
      setIsRevealed(false);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className={cn("relative overflow-hidden rounded-xl", className)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      data-testid={testId}
    >
      {actions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-stretch swipe-actions"
          style={{ opacity: actionsOpacity, scale: actionsScale }}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setIsRevealed(false);
              }}
              className={cn(
                "w-[60px] flex flex-col items-center justify-center gap-1 transition-colors",
                actionVariants[action.variant || "default"]
              )}
              data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {action.icon}
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      <motion.div
        className={cn(
          "glass-card rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform",
          "bg-black/40 backdrop-blur-xl border border-white/10",
          onClick && "hover:border-primary/30"
        )}
        style={{ x: cardX }}
        drag={actions.length > 0 ? "x" : false}
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {status && (
            <StatusBadge status={status.value} className="shrink-0">
              {status.label}
            </StatusBadge>
          )}
        </div>

        {metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {item.icon && (
                  <span className="text-muted-foreground shrink-0">
                    {item.icon}
                  </span>
                )}
                <span className="text-muted-foreground shrink-0 text-xs">
                  {item.label}:
                </span>
                <span className="text-foreground font-medium truncate">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface MobileDataCardSkeletonProps {
  className?: string;
}

export function MobileDataCardSkeleton({ className }: MobileDataCardSkeletonProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 animate-pulse",
        "bg-black/40 backdrop-blur-xl border border-white/10",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-white/10 rounded" />
          <div className="h-4 w-1/2 bg-white/5 rounded mt-1.5" />
        </div>
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
      </div>
    </div>
  );
}
