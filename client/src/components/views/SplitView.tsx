import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SplitViewProps<T> {
  items: T[];
  selectedItem: T | null;
  onSelectItem: (item: T) => void;
  renderListItem: (item: T, isSelected: boolean) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string | number;
  listTitle?: string;
  detailTitle?: string;
  emptyListMessage?: string;
  emptyDetailMessage?: string;
  listWidth?: string;
  className?: string;
}

export function SplitView<T>({
  items,
  selectedItem,
  onSelectItem,
  renderListItem,
  renderDetail,
  getItemKey,
  listTitle,
  detailTitle,
  emptyListMessage = "No items",
  emptyDetailMessage = "Select an item to view details",
  listWidth = "w-1/3",
  className,
}: SplitViewProps<T>) {
  return (
    <div className={cn("flex gap-4 h-[calc(100vh-200px)]", className)}>
      <Card className={cn("glass-card border-white/10 flex flex-col", listWidth)}>
        {listTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">{listTitle}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {emptyListMessage}
                </div>
              ) : (
                items.map((item) => {
                  const isSelected = selectedItem && getItemKey(selectedItem) === getItemKey(item);
                  return (
                    <motion.div
                      key={getItemKey(item)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => onSelectItem(item)}
                      className={cn(
                        "cursor-pointer rounded-lg transition-colors",
                        isSelected && "bg-primary/20 ring-1 ring-primary"
                      )}
                      data-testid={`list-item-${getItemKey(item)}`}
                    >
                      {renderListItem(item, !!isSelected)}
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/10 flex-1 flex flex-col">
        {detailTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">{detailTitle}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex-1 p-4 pt-0 overflow-auto">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={getItemKey(selectedItem)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                {renderDetail(selectedItem)}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full text-muted-foreground"
              >
                {emptyDetailMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
