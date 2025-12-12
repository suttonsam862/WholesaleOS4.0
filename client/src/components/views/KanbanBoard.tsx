import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export interface KanbanColumn<T> {
  id: string;
  title: string;
  color: string;
  items: T[];
  count?: number;
  subtitle?: string;
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnId: string) => React.ReactNode;
  focusedColumnId?: string;
  onCardClick?: (item: T) => void;
  onCardDrop?: (item: T, fromColumn: string, toColumn: string) => void;
  headerContent?: (column: KanbanColumn<T>) => React.ReactNode;
  emptyColumnMessage?: string;
  className?: string;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  focusedColumnId,
  onCardClick,
  headerContent,
  emptyColumnMessage = "No items",
  className,
}: KanbanBoardProps<T>) {
  const focusedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedColumnId && focusedRef.current) {
      focusedRef.current.scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  }, [focusedColumnId]);

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
      {columns.map((column) => {
        const isFocused = focusedColumnId === column.id;
        const isDimmed = focusedColumnId && !isFocused;

        return (
          <motion.div
            key={column.id}
            ref={isFocused ? focusedRef : undefined}
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: isDimmed ? 0.5 : 1, 
              x: 0,
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-80"
            data-testid={`kanban-column-${column.id}`}
          >
            <Card className={cn(
              "glass-card border-white/10 h-full",
              isFocused && "ring-2 ring-primary border-primary/50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <CardTitle className="text-sm font-medium text-white">
                      {column.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {column.count ?? column.items.length}
                  </Badge>
                </div>
                {column.subtitle && (
                  <p className="text-xs text-muted-foreground">{column.subtitle}</p>
                )}
                {headerContent && headerContent(column)}
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {column.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {emptyColumnMessage}
                      </div>
                    ) : (
                      column.items.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => onCardClick?.(item)}
                          className="cursor-pointer"
                        >
                          {renderCard(item, column.id)}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  title: string;
  subtitle?: string;
  badges?: Array<{ label: string; color?: string }>;
  thumbnail?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function KanbanCard({
  title,
  subtitle,
  badges,
  thumbnail,
  footer,
  className,
}: KanbanCardProps) {
  return (
    <Card className={cn("bg-white/5 border-white/10 hover:bg-white/10 transition-colors", className)}>
      <CardContent className="p-3">
        {thumbnail && (
          <div className="mb-2 rounded overflow-hidden">
            <img src={thumbnail} alt="" className="w-full h-24 object-cover" />
          </div>
        )}
        <h4 className="text-sm font-medium text-white line-clamp-2">{title}</h4>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>
        )}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {badges.map((badge, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className={cn("text-xs", badge.color || "bg-white/10")}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
        {footer && <div className="mt-2 pt-2 border-t border-white/10">{footer}</div>}
      </CardContent>
    </Card>
  );
}
