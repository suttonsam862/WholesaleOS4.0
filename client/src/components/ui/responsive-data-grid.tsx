import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { useDataView, DataViewToggle } from "./data-view-toggle";
import { MobileDataCard, MobileDataCardSkeleton } from "./mobile-data-card";
import { ResponsiveTable } from "@/components/responsive-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface CardConfig<T> {
  title: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  status?: (item: T) => { value: string; label: string } | undefined;
  metadata?: (item: T) => Array<{ label: string; value: React.ReactNode; icon?: React.ReactNode }>;
  actions?: (item: T) => Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "danger" | "success" | "warning";
  }>;
}

interface ResponsiveDataGridProps<T> {
  items: T[];
  columns: Column<T>[];
  cardConfig: CardConfig<T>;
  onItemClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  skeletonCount?: number;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  storageKey?: string;
  className?: string;
  showViewToggle?: boolean;
  headerContent?: React.ReactNode;
  stickyFirstColumn?: boolean;
  "data-testid"?: string;
}

export function ResponsiveDataGrid<T>({
  items,
  columns,
  cardConfig,
  onItemClick,
  keyExtractor,
  isLoading = false,
  skeletonCount = 5,
  emptyState,
  storageKey,
  className,
  showViewToggle = true,
  headerContent,
  stickyFirstColumn = false,
  "data-testid": testId,
}: ResponsiveDataGridProps<T>) {
  const { view, setView, isMobile } = useDataView(storageKey);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)} data-testid={testId}>
        {showViewToggle && (
          <div className="flex items-center justify-between gap-4">
            {headerContent}
            <DataViewToggle view={view} onViewChange={setView} disabled />
          </div>
        )}
        {view === "cards" || isMobile ? (
          <div className="data-card-stack">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <MobileDataCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return (
      <div className={cn("space-y-4", className)} data-testid={testId}>
        {showViewToggle && (
          <div className="flex items-center justify-between gap-4">
            {headerContent}
            <DataViewToggle view={view} onViewChange={setView} />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 text-center glass-card rounded-xl border border-white/10"
        >
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            {emptyState.icon || <Inbox className="w-8 h-8 text-muted-foreground" />}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {emptyState.title}
          </h3>
          {emptyState.description && (
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {emptyState.description}
            </p>
          )}
          {emptyState.action}
        </motion.div>
      </div>
    );
  }

  const effectiveView = isMobile ? "cards" : view;

  return (
    <div className={cn("space-y-4", className)} data-testid={testId}>
      {showViewToggle && (
        <div className="flex items-center justify-between gap-4">
          {headerContent}
          {!isMobile && <DataViewToggle view={view} onViewChange={setView} />}
        </div>
      )}

      <AnimatePresence mode="wait">
        {effectiveView === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="data-card-stack"
          >
            <AnimatePresence>
              {items.map((item, index) => (
                <MobileDataCard
                  key={keyExtractor(item)}
                  title={cardConfig.title(item)}
                  subtitle={cardConfig.subtitle?.(item)}
                  status={cardConfig.status?.(item)}
                  metadata={cardConfig.metadata?.(item)}
                  actions={cardConfig.actions?.(item)}
                  onClick={onItemClick ? () => onItemClick(item) : undefined}
                  index={index}
                  data-testid={`card-item-${keyExtractor(item)}`}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-xl border border-white/10 overflow-hidden",
              stickyFirstColumn && "responsive-table-sticky"
            )}
          >
            <div className="responsive-table-scroll">
              <ResponsiveTable>
                <TableHeader>
                  <TableRow className="border-b border-white/10 bg-black/20">
                    {columns.map((col, i) => (
                      <TableHead 
                        key={col.key}
                        className={cn(
                          col.className,
                          stickyFirstColumn && i === 0 && "sticky-column"
                        )}
                      >
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={keyExtractor(item)}
                      onClick={onItemClick ? () => onItemClick(item) : undefined}
                      className={cn(
                        "border-b border-white/5 transition-colors",
                        onItemClick && "cursor-pointer hover:bg-white/5"
                      )}
                      data-testid={`row-item-${keyExtractor(item)}`}
                    >
                      {columns.map((col, i) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.className,
                            stickyFirstColumn && i === 0 && "sticky-column"
                          )}
                          data-label={col.mobileLabel || col.header}
                        >
                          {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </ResponsiveTable>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
