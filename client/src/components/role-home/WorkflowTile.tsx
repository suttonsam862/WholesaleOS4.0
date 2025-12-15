import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface SubAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

interface TileBadge {
  count: number;
  label: string;
  variant?: "default" | "warning" | "success";
}

interface WorkflowTileProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  primaryAction: {
    label: string;
    href: string;
  };
  subActions?: SubAction[];
  badge?: TileBadge;
  className?: string;
}

const badgeVariants = {
  default: "bg-primary/20 text-primary border-primary/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function WorkflowTile({
  id,
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  bgGradient = "from-primary/10 to-primary/5",
  primaryAction,
  subActions,
  badge,
  className,
}: WorkflowTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative group rounded-xl border border-white/10 bg-gradient-to-br overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-primary/5",
        bgGradient,
        className
      )}
      data-testid={`workflow-tile-${id}`}
    >
      {badge && badge.count > 0 && (
        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold rounded-full border",
            badgeVariants[badge.variant || "default"]
          )}
          data-testid={`badge-${id}`}
        >
          {badge.count} {badge.label}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className={cn(
              "w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0",
              iconColor
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href={primaryAction.href}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-white group/btn"
              data-testid={`button-${id}-primary`}
            >
              <span>{primaryAction.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-white transition-colors" />
            </button>
          </Link>

          {subActions && subActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subActions.map((action, idx) => (
                action.href ? (
                  <Link key={idx} href={action.href}>
                    <button
                      className="px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition-all"
                      data-testid={`link-${id}-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {action.label}
                    </button>
                  </Link>
                ) : (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="px-3 py-1.5 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition-all"
                    data-testid={`button-${id}-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {action.label}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
