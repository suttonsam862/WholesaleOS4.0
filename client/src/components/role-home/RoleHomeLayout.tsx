import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface RoleHomeLayoutProps {
  role: string;
  userName?: string;
  greeting?: string;
  quickActions?: QuickAction[];
  children: ReactNode;
  className?: string;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function RoleHomeLayout({
  role,
  userName,
  greeting,
  quickActions,
  children,
  className,
}: RoleHomeLayoutProps) {
  const displayGreeting = greeting || getTimeBasedGreeting();
  const displayName = userName || "there";

  return (
    <div className={cn("space-y-8", className)} data-testid={`role-home-${role}`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {displayGreeting}, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what needs your attention today
          </p>
        </div>

        {quickActions && quickActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-quick-actions"
              >
                Quick Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {quickActions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={action.onClick}
                  className="cursor-pointer"
                  data-testid={`quick-action-${action.id}`}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

      {children}
    </div>
  );
}

interface WorkflowGridProps {
  children: ReactNode;
  columns?: 2 | 3;
  className?: string;
}

export function WorkflowGrid({ children, columns = 3, className }: WorkflowGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
        className
      )}
      data-testid="workflow-grid"
    >
      {children}
    </div>
  );
}

interface QueuesSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function QueuesSection({ title = "My Work Queues", children, className }: QueuesSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

interface MetricsSnapshotProps {
  title?: string;
  children: ReactNode;
  dashboardLink?: string;
  className?: string;
}

export function MetricsSnapshot({
  title = "Key Metrics",
  children,
  dashboardLink,
  className,
}: MetricsSnapshotProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {dashboardLink && (
          <a
            href={dashboardLink}
            className="text-sm text-primary hover:underline"
            data-testid="link-full-dashboard"
          >
            View Full Dashboard
          </a>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-white/10 bg-white/5",
        className
      )}
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {trend && (
        <p
          className={cn(
            "text-xs mt-2",
            trend.positive ? "text-emerald-400" : "text-red-400"
          )}
        >
          {trend.positive ? "+" : ""}{trend.value}% {trend.label || "vs last period"}
        </p>
      )}
    </div>
  );
}
