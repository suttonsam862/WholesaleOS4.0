import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";

export interface TimelineGroup<T> {
  label: string;
  items: T[];
}

interface TimelineProps<T> {
  items: T[];
  getDate: (item: T) => Date | string;
  renderItem: (item: T, index: number) => React.ReactNode;
  groupBy?: "day" | "week" | "month";
  className?: string;
  emptyMessage?: string;
}

export function Timeline<T>({
  items,
  getDate,
  renderItem,
  groupBy = "day",
  className,
  emptyMessage = "No items to display",
}: TimelineProps<T>) {
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMMM d, yyyy");
  };

  const groupedItems = items.reduce<Record<string, T[]>>((acc, item) => {
    const rawDate = getDate(item);
    const date = typeof rawDate === "string" ? parseISO(rawDate) : rawDate;
    const label = getDateLabel(date);
    
    if (!acc[label]) {
      acc[label] = [];
    }
    acc[label].push(item);
    return acc;
  }, {});

  const groups = Object.entries(groupedItems);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
      
      {groups.map(([label, groupItems], groupIndex) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
              <span className="text-xs font-bold text-white">{groupItems.length}</span>
            </div>
            <h3 className="text-sm font-medium text-white">{label}</h3>
          </div>
          
          <div className="ml-12 space-y-2">
            {groupItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface TimelineItemCardProps {
  title: string;
  subtitle?: string;
  time?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function TimelineItemCard({
  title,
  subtitle,
  time,
  avatar,
  actions,
  className,
}: TimelineItemCardProps) {
  return (
    <Card className={cn("bg-white/5 border-white/10", className)}>
      <CardContent className="p-3 flex items-center gap-3">
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {time && (
          <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
        )}
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-1">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
