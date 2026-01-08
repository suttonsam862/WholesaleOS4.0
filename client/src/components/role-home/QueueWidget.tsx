import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon, ExternalLink, Inbox, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { HttpError } from "@/lib/queryClient";

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
  const { 
    data: rawData = [], 
    isLoading,
    isError,
    error,
    isPlaceholderData
  } = useQuery<any[]>({
    queryKey,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });

  const hasData = rawData.length > 0;
  const showLoading = isLoading && !hasData;
  
  // Treat 403 permission errors as "no access" - show empty state, not error
  const isPermissionDenied = isError && error instanceof HttpError && error.status === 403;
  const showError = isError && !isPermissionDenied;

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

      <div className="divide-y divide-white/5 relative min-h-[100px]">
        <AnimatePresence mode="wait">
          {showLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </motion.div>
          ) : showError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-10 flex flex-col items-center justify-center text-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-sm text-red-400">Failed to load {title.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Please try again later"}
              </p>
            </motion.div>
          ) : displayData.length === 0 || isPermissionDenied ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-10 flex flex-col items-center justify-center text-center"
            >
              <EmptyIcon className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{emptyState.message}</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-white/5"
            >
              {displayData.map((row, idx) => {
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
              })}
            </motion.div>
          )}
        </AnimatePresence>
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
