import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon, ExternalLink, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface QueueColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface QueueWidgetProps {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  queryKey: string[];
  filter?: (items: any[]) => any[];
  columns: QueueColumn[];
  rowAction: {
    label?: string;
    href: string | ((row: any) => string);
  };
  emptyState?: {
    message: string;
    icon?: LucideIcon;
  };
  maxRows?: number;
  viewAllHref?: string;
  className?: string;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function QueueWidget({
  id,
  title,
  description,
  icon: Icon,
  queryKey,
  filter,
  columns,
  rowAction,
  emptyState = { message: "No items to display", icon: Inbox },
  maxRows = 5,
  viewAllHref,
  className,
}: QueueWidgetProps) {
  const { data: rawData = [], isLoading } = useQuery<any[]>({
    queryKey,
    retry: 1,
  });

  const data = filter ? filter(rawData) : rawData;
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;
  const EmptyIcon = emptyState.icon || Inbox;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 overflow-hidden",
        className
      )}
      data-testid={`queue-widget-${id}`}
    >
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
              data-testid={`link-${id}-view-all`}
            >
              View All
              <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : displayData.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
            <EmptyIcon className="w-8 h-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{emptyState.message}</p>
          </div>
        ) : (
          displayData.map((row, idx) => {
            const href = typeof rowAction.href === "function" 
              ? rowAction.href(row) 
              : rowAction.href;

            return (
              <Link key={row.id || idx} href={href}>
                <div
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                  data-testid={`queue-row-${id}-${row.id || idx}`}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className={cn(
                        "text-sm truncate",
                        col.className || "flex-1"
                      )}
                    >
                      {col.render
                        ? col.render(getNestedValue(row, col.key), row)
                        : getNestedValue(row, col.key)}
                    </div>
                  ))}
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {hasMore && viewAllHref && (
        <div className="px-5 py-3 border-t border-white/10 text-center">
          <Link href={viewAllHref}>
            <button className="text-xs text-primary hover:underline" data-testid={`link-${id}-more`}>
              +{data.length - maxRows} more items
            </button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
