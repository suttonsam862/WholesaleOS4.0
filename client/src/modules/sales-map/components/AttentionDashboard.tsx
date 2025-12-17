import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Target, ShoppingCart, Palette, ChevronRight, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { AttentionItem, AttentionDashboardData, EntityType } from "../types";
import { cn } from "@/lib/utils";

interface AttentionDashboardProps {
  data: AttentionDashboardData | undefined;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (item: AttentionItem) => void;
}

const severityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const typeIcons: Record<EntityType, typeof Target> = {
  lead: Target,
  order: ShoppingCart,
  designJob: Palette,
  organization: Target,
};

function AttentionItemCard({ item, onClick }: { item: AttentionItem; onClick: () => void }) {
  const Icon = typeIcons[item.type] || Target;
  
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border backdrop-blur-sm text-left",
        "transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:shadow-current/10",
        severityColors[item.severity]
      )}
      data-testid={`attention-item-${item.type}-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          item.severity === "critical" ? "bg-red-500/30" :
          item.severity === "high" ? "bg-orange-500/30" :
          "bg-amber-500/30"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{item.name}</span>
            {item.severity === "critical" && (
              <Flame className="h-3 w-3 text-red-400 animate-pulse" />
            )}
          </div>
          <p className="text-xs opacity-80 mt-0.5">{item.reason}</p>
        </div>
        <ChevronRight className="h-4 w-4 opacity-50 shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

function SectionHeader({ 
  title, 
  count, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  count: number; 
  icon: typeof AlertTriangle;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("p-1.5 rounded-md", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-semibold text-sm">{title}</span>
      <Badge variant="secondary" className="ml-auto text-xs">
        {count}
      </Badge>
    </div>
  );
}

export function AttentionDashboard({
  data,
  isLoading,
  isOpen,
  onClose,
  onItemClick,
}: AttentionDashboardProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute left-4 top-20 bottom-24 w-80 z-20"
          data-testid="attention-dashboard"
        >
          <div className="h-full bg-background/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {data && data.counts.total > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    />
                  )}
                </div>
                <h2 className="font-bold">Attention Needed</h2>
                <Badge variant="destructive" className="text-xs">
                  {data?.counts.total || 0}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                data-testid="close-attention-dashboard"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {data.overdueOrders.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Overdue Orders"
                        count={data.overdueOrders.length}
                        icon={ShoppingCart}
                        color="bg-red-500/20 text-red-400"
                      />
                      <div className="space-y-2">
                        {data.overdueOrders.map((item) => (
                          <AttentionItemCard
                            key={`order-${item.id}`}
                            item={item}
                            onClick={() => onItemClick(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.hotLeads.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Hot Leads"
                        count={data.hotLeads.length}
                        icon={Target}
                        color="bg-orange-500/20 text-orange-400"
                      />
                      <div className="space-y-2">
                        {data.hotLeads.map((item) => (
                          <AttentionItemCard
                            key={`lead-${item.id}`}
                            item={item}
                            onClick={() => onItemClick(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.stalledDesignJobs.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Design Jobs"
                        count={data.stalledDesignJobs.length}
                        icon={Palette}
                        color="bg-purple-500/20 text-purple-400"
                      />
                      <div className="space-y-2">
                        {data.stalledDesignJobs.map((item) => (
                          <AttentionItemCard
                            key={`design-${item.id}`}
                            item={item}
                            onClick={() => onItemClick(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {data.counts.total === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">✨</div>
                      <p className="font-medium">All clear!</p>
                      <p className="text-sm">No items need attention right now.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Unable to load attention items</p>
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t border-white/10 bg-gradient-to-r from-amber-500/5 to-red-500/5">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <div className="font-bold text-red-400">{data?.counts.overdueOrders || 0}</div>
                  <div className="text-muted-foreground">Overdue</div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <div className="font-bold text-orange-400">{data?.counts.hotLeads || 0}</div>
                  <div className="text-muted-foreground">Hot</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <div className="font-bold text-purple-400">{data?.counts.stalledDesignJobs || 0}</div>
                  <div className="text-muted-foreground">Design</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
