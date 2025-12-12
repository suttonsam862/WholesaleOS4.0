import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, differenceInDays, parseISO, startOfDay, addDays, isSameDay, isWithinInterval } from "date-fns";
import { useMemo } from "react";

interface GanttItem {
  id: string | number;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  color?: string;
  progress?: number;
}

interface GanttViewProps<T extends GanttItem> {
  items: T[];
  startDate?: Date;
  endDate?: Date;
  daysToShow?: number;
  renderTooltip?: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function GanttView<T extends GanttItem>({
  items,
  startDate: propStartDate,
  endDate: propEndDate,
  daysToShow = 30,
  renderTooltip,
  onItemClick,
  className,
  emptyMessage = "No items to display",
}: GanttViewProps<T>) {
  const { viewStart, viewEnd, days } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = propStartDate || today;
    const end = propEndDate || addDays(start, daysToShow);
    
    const daysArray: Date[] = [];
    let current = start;
    while (current <= end) {
      daysArray.push(current);
      current = addDays(current, 1);
    }
    
    return { viewStart: start, viewEnd: end, days: daysArray };
  }, [propStartDate, propEndDate, daysToShow]);

  const totalDays = differenceInDays(viewEnd, viewStart) + 1;

  const getBarPosition = (item: T) => {
    const start = typeof item.startDate === "string" ? parseISO(item.startDate) : item.startDate;
    const end = typeof item.endDate === "string" ? parseISO(item.endDate) : item.endDate;
    
    const startOffset = Math.max(0, differenceInDays(start, viewStart));
    const endOffset = Math.min(totalDays, differenceInDays(end, viewStart) + 1);
    const duration = endOffset - startOffset;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[800px]">
        <div className="flex border-b border-white/10 pb-2 mb-2">
          <div className="w-48 flex-shrink-0 text-sm text-muted-foreground font-medium px-2">
            Item
          </div>
          <div className="flex-1 flex">
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex-1 text-center text-xs text-muted-foreground",
                    isToday && "text-primary font-bold"
                  )}
                >
                  {format(day, "d")}
                  <br />
                  <span className="text-[10px]">{format(day, "EEE")}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => {
            const position = getBarPosition(item);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center"
                data-testid={`gantt-item-${item.id}`}
              >
                <div className="w-48 flex-shrink-0 px-2">
                  <p className="text-sm text-white truncate">{item.title}</p>
                </div>
                <div className="flex-1 relative h-8">
                  <div className="absolute inset-0 flex">
                    {days.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div 
                          key={dayIndex}
                          className={cn(
                            "flex-1 border-r border-white/5",
                            isToday && "bg-primary/10"
                          )}
                        />
                      );
                    })}
                  </div>
                  
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                    style={{ 
                      left: position.left, 
                      width: position.width,
                      originX: 0,
                    }}
                    className={cn(
                      "absolute top-1 h-6 rounded cursor-pointer transition-all hover:brightness-110",
                      item.color || "bg-primary"
                    )}
                    onClick={() => onItemClick?.(item)}
                    title={item.title}
                  >
                    {item.progress !== undefined && (
                      <div 
                        className="absolute inset-0 bg-black/30 rounded"
                        style={{ 
                          clipPath: `inset(0 ${100 - item.progress}% 0 0)`,
                        }}
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-2">
                      {item.title}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
