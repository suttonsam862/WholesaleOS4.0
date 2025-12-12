import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface GlowingActionButtonProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  isAiPowered?: boolean;
  isComingSoon?: boolean;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
  testId?: string;
}

const variantStyles = {
  primary: {
    bg: "from-primary/20 to-primary/5",
    border: "border-primary/30 hover:border-primary/50",
    glow: "shadow-primary/20 hover:shadow-primary/40",
    icon: "text-primary",
    ring: "ring-primary/20",
  },
  secondary: {
    bg: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30 hover:border-blue-500/50",
    glow: "shadow-blue-500/20 hover:shadow-blue-500/40",
    icon: "text-blue-500",
    ring: "ring-blue-500/20",
  },
  accent: {
    bg: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30 hover:border-purple-500/50",
    glow: "shadow-purple-500/20 hover:shadow-purple-500/40",
    icon: "text-purple-500",
    ring: "ring-purple-500/20",
  },
};

export function GlowingActionButton({
  title,
  description,
  icon: Icon,
  onClick,
  isAiPowered = false,
  isComingSoon = false,
  variant = "primary",
  size = "md",
  className,
  testId,
}: GlowingActionButtonProps) {
  const styles = variantStyles[variant];

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group w-full text-left rounded-xl overflow-hidden",
        "bg-gradient-to-br backdrop-blur-sm",
        "border transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        styles.bg,
        styles.border,
        styles.glow,
        sizeClasses[size],
        className
      )}
      data-testid={testId}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div
          className={cn(
            "absolute inset-0 blur-xl",
            variant === "primary" && "bg-primary/10",
            variant === "secondary" && "bg-blue-500/10",
            variant === "accent" && "bg-purple-500/10"
          )}
        />
      </div>

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            "bg-white/5 ring-1",
            styles.ring
          )}
        >
          <Icon className={cn(iconSizes[size], styles.icon)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{title}</span>
            {isAiPowered && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-medium">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
            {isComingSoon && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-medium">
                <Clock className="h-2.5 w-2.5" />
                Soon
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          "bg-gradient-to-r from-transparent via-current to-transparent",
          "opacity-0 group-hover:opacity-30 transition-opacity",
          styles.icon
        )}
      />
    </motion.button>
  );
}

interface QuickActionClusterProps {
  actions: Array<{
    id: string;
    title: string;
    description?: string;
    icon: LucideIcon;
    onClick: () => void;
    isAiPowered?: boolean;
    isComingSoon?: boolean;
    variant?: "primary" | "secondary" | "accent";
  }>;
  className?: string;
}

export function QuickActionCluster({ actions, className }: QuickActionClusterProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {actions.map((action, index) => (
        <GlowingActionButton
          key={action.id}
          title={action.title}
          description={action.description}
          icon={action.icon}
          onClick={action.onClick}
          isAiPowered={action.isAiPowered}
          isComingSoon={action.isComingSoon}
          variant={action.variant || (index === 0 ? "primary" : index === 1 ? "secondary" : "accent")}
          testId={`quick-action-${action.id}`}
        />
      ))}
    </div>
  );
}
