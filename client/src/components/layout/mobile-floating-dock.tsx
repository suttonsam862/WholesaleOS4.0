import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import {
  buildNavigationForUser,
  getGroupLandingForRole,
  NAVIGATION_GROUPS,
  type NavigationGroupWithPages,
} from "@/lib/navigationRegistry";
import type { UserRole } from "@/lib/permissions";
import {
  Target,
  ShoppingCart,
  Factory,
  Palette,
  Package,
  DollarSign,
  Shield,
  Search,
  MoreHorizontal,
  X,
  ChevronRight,
  Home,
  type LucideIcon,
} from "lucide-react";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "target": Target,
  "shopping-cart": ShoppingCart,
  "factory": Factory,
  "palette": Palette,
  "package": Package,
  "dollar-sign": DollarSign,
  "shield": Shield,
};

interface MobileFloatingDockProps {
  onSearchClick: () => void;
  user?: any;
}

export function MobileFloatingDock({ onSearchClick, user }: MobileFloatingDockProps) {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { getAllFlags } = useFeatureFlags();

  const navigation = useMemo(() => {
    if (!user?.role) return [];
    const featureFlags = getAllFlags();
    return buildNavigationForUser(user.role as UserRole, location, featureFlags);
  }, [user?.role, location, getAllFlags]);

  const primaryGroups = useMemo(() => {
    return navigation.slice(0, 4);
  }, [navigation]);

  const allGroups = navigation;

  const getGroupIcon = (iconName: string): LucideIcon => {
    return GROUP_ICONS[iconName] || Target;
  };

  const isGroupActive = (group: NavigationGroupWithPages): boolean => {
    return group.pages.some(p => p.isActive);
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsExpanded(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 z-50 md:hidden max-h-[70vh] overflow-hidden"
            >
              <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-neon-blue/10 flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                  <h3 className="text-sm font-semibold text-white">Navigation</h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    data-testid="button-close-nav-menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-3">
                  <div className="space-y-3">
                    {allGroups.map((group) => {
                      const GroupIcon = getGroupIcon(group.icon);
                      const featureFlags = getAllFlags();
                      const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
                      const isActive = isGroupActive(group);
                      const visiblePages = group.pages.filter(p => !p.hideFromMoreMenu);
                      
                      return (
                        <div key={group.id} className="space-y-1">
                          <Link href={landingPath} onClick={() => setIsExpanded(false)}>
                            <div
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                                isActive
                                  ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                                  : "bg-white/5 text-white hover:bg-white/10"
                              )}
                              data-testid={`mobile-nav-group-${group.id}`}
                            >
                              <div className={cn(
                                "p-2 rounded-lg",
                                isActive ? "bg-neon-blue/20" : "bg-white/10"
                              )}>
                                <GroupIcon className="w-4 h-4" />
                              </div>
                              <span className="flex-1 font-medium text-sm">{group.title}</span>
                              <ChevronRight className="w-4 h-4 text-white/40" />
                            </div>
                          </Link>
                          
                          {visiblePages.length > 1 && (
                            <div className="ml-4 pl-4 border-l border-white/10 space-y-0.5">
                              {visiblePages.map((page) => (
                                <Link 
                                  key={page.id} 
                                  href={page.path}
                                  onClick={() => setIsExpanded(false)}
                                >
                                  <div
                                    className={cn(
                                      "px-3 py-2 rounded-lg text-sm transition-all",
                                      page.isActive
                                        ? "text-neon-blue bg-neon-blue/10"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                    data-testid={`mobile-nav-page-${page.id}`}
                                  >
                                    {page.label}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsExpanded(false);
                        onSearchClick();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                      data-testid="mobile-nav-search"
                    >
                      <div className="p-2 rounded-lg bg-white/10">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">Search</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
        <div className="px-2 py-2 bg-black/80 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-neon-blue/10">
          <div className="flex items-center justify-around">
            {primaryGroups.map((group) => {
              const GroupIcon = getGroupIcon(group.icon);
              const featureFlags = getAllFlags();
              const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
              const isActive = isGroupActive(group);

              return (
                <Link key={group.id} href={landingPath}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[56px]",
                      isActive ? "text-neon-blue" : "text-muted-foreground hover:text-white"
                    )}
                    data-testid={`mobile-dock-${group.id}`}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-full transition-all",
                        isActive
                          ? "bg-neon-blue/20 shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                          : "bg-white/5"
                      )}
                    >
                      <GroupIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium truncate max-w-[56px]">
                      {group.title.split(" ")[0]}
                    </span>
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

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[56px]",
                isExpanded
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "text-muted-foreground hover:text-white"
              )}
              data-testid="mobile-dock-more"
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
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </div>
              <span className="text-[10px] font-medium">
                {isExpanded ? "Close" : "More"}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
