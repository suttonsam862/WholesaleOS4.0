import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  ShoppingCart,
  Palette,
  Factory,
  CheckSquare,
  DollarSign,
  Settings,
  Search,
  MoreHorizontal,
  X,
  Building2,
  Contact,
  Users,
  Calendar,
  FileText,
} from "lucide-react";

// Primary navigation items (shown in main bar)
const PRIMARY_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Design", href: "/design-jobs", icon: Palette },
  { name: "More", href: null, icon: MoreHorizontal }, // Triggers expanded menu
];

// Secondary navigation items (shown in expanded menu)
const SECONDARY_ITEMS = [
  { name: "Production", href: "/manufacturing", icon: Factory },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Contacts", href: "/contacts", icon: Contact },
  { name: "Team", href: "/salespeople", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface MobileFloatingDockProps {
  onSearchClick: () => void;
}

export function MobileFloatingDock({ onSearchClick }: MobileFloatingDockProps) {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemClick = (item: typeof PRIMARY_ITEMS[0]) => {
    if (item.href === null) {
      setIsExpanded(!isExpanded);
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Expanded menu overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsExpanded(false)}
            />

            {/* Expanded menu */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-neon-blue/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white/70">More Options</h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SECONDARY_ITEMS.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.name} href={item.href}>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsExpanded(false)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                            isActive
                              ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{item.name}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                  {/* Search button in expanded menu */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsExpanded(false);
                      onSearchClick();
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-xs font-medium">Search</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main mobile dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
        <div className="mx-2 mb-2 px-2 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-neon-blue/10">
          <div className="flex items-center justify-around">
            {PRIMARY_ITEMS.map((item) => {
              const isActive = item.href !== null && location === item.href;
              const isMoreButton = item.href === null;

              if (isMoreButton) {
                return (
                  <motion.button
                    key={item.name}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all min-w-[60px]",
                      isExpanded
                        ? "bg-neon-blue/20 text-neon-blue"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-full transition-all",
                        isExpanded
                          ? "bg-neon-blue/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                          : "bg-white/5"
                      )}
                    >
                      {isExpanded ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <item.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium">
                      {isExpanded ? "Close" : item.name}
                    </span>
                  </motion.button>
                );
              }

              return (
                <Link key={item.name} href={item.href!}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all min-w-[60px]",
                      isActive ? "text-neon-blue" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-full transition-all",
                        isActive
                          ? "bg-neon-blue/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                          : "bg-white/5"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-dock-indicator"
                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-neon-blue"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
