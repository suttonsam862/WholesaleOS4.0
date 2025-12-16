import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { performLogout } from "@/lib/queryClient";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { 
  buildNavigationForUser,
  getGroupLandingForRole,
  type NavigationGroupWithPages,
  type VisiblePage
} from "@/lib/navigationRegistry";
import type { UserRole } from "@/lib/permissions";
import { 
  LayoutDashboard, 
  Target, 
  Building2, 
  Users as ContactIcon, 
  Package, 
  Palette, 
  ShoppingCart, 
  Factory, 
  Store, 
  Calendar, 
  CheckSquare, 
  Users, 
  Paintbrush, 
  Warehouse, 
  UserCog, 
  DollarSign, 
  FileText, 
  FlaskConical, 
  Shield, 
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Activity,
  Wifi,
  Map,
  GitBranch,
  Layers,
  Home,
  MoreHorizontal,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Lead {
  id: number;
  stage: 'future_lead' | 'lead' | 'hot_lead' | 'mock_up' | 'mock_up_sent' | 'team_store_or_direct_order' | 'current_clients' | 'no_answer_delete';
}

interface DesignJob {
  id: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';
}

const GROUP_ICONS: Record<string, any> = {
  "target": Target,
  "shopping-cart": ShoppingCart,
  "factory": Factory,
  "palette": Palette,
  "package": Package,
  "dollar-sign": DollarSign,
  "shield": Shield
};

const PAGE_ICONS: Record<string, any> = {
  "home": Home,
  "dashboard": LayoutDashboard,
  "leads": Target,
  "organizations": Building2,
  "contacts": ContactIcon,
  "catalog": Package,
  "designJobs": Palette,
  "orders": ShoppingCart,
  "manufacturing": Factory,
  "teamStores": Store,
  "events": Calendar,
  "tasks": CheckSquare,
  "salespeople": Users,
  "designerManagement": Paintbrush,
  "manufacturerManagement": Warehouse,
  "userManagement": UserCog,
  "finance": DollarSign,
  "quotes": FileText,
  "users": FlaskConical,
  "settings": Settings,
  "notifications": Bell
};

const ROLE_HOME_PATHS: Record<string, string> = {
  admin: "/admin/home",
  sales: "/sales/home",
  designer: "/designer/home",
  ops: "/ops/home",
  manufacturer: "/manufacturer/home",
};

const useBadgeCounts = () => {
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const { data: designJobs = [] } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  return useMemo(() => {
    const badges: Record<string, string> = {};
    
    const futureLeads = leads.filter((lead) => lead.stage === 'future_lead').length;
    if (futureLeads > 0) {
      badges["/leads"] = futureLeads.toString();
      badges["/sales-tracker"] = futureLeads.toString();
    }

    const pendingJobs = designJobs.filter((job) => 
      job.status === 'pending' || job.status === 'review'
    ).length;
    if (pendingJobs > 0) {
      badges["/design-jobs"] = pendingJobs.toString();
    }

    return badges;
  }, [leads, designJobs]);
};

function getPageIcon(page: VisiblePage): any {
  if (page.resourceKey && PAGE_ICONS[page.resourceKey]) {
    return PAGE_ICONS[page.resourceKey];
  }
  if (page.id.includes("notification")) return Bell;
  if (page.id.includes("connection")) return Wifi;
  if (page.id.includes("analytics")) return Activity;
  if (page.id.includes("map")) return Map;
  if (page.id.includes("pipeline")) return GitBranch;
  if (page.id.includes("fabric")) return Layers;
  return LayoutDashboard;
}

interface SidebarProps {
  user?: any;
  isMobile?: boolean;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ user, isMobile = false, onNavigate, isCollapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const badges = useBadgeCounts();
  const { getAllFlags, isEnabled } = useFeatureFlags();
  const enableRoleHome = isEnabled("enableRoleHome");
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const navigation = useMemo(() => {
    if (!user?.role) return [];
    const featureFlags = getAllFlags();
    return buildNavigationForUser(user.role as UserRole, location, featureFlags);
  }, [user?.role, location, getAllFlags]);

  const renderNavItem = (page: VisiblePage, isLanding: boolean = false) => {
    const Icon = getPageIcon(page);
    const badge = badges[page.path];
    const isActive = page.isActive;

    if (isCollapsed) {
      return (
        <TooltipProvider key={page.id} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={page.path}
                onClick={() => isMobile && onNavigate?.()}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                data-testid={`link-${page.id}`}
                >
                  <Icon className="w-5 h-5" />
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {page.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link
        key={page.id}
        href={page.path}
        onClick={() => isMobile && onNavigate?.()}
      >
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative overflow-hidden",
          isActive 
            ? "bg-primary/10 text-primary shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/5",
          isLanding && "font-semibold"
        )}
        data-testid={`link-${page.id}`}
        >
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
            />
          )}
          <Icon className={cn(
            "w-4 h-4 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )} />
          <span className="flex-1 truncate">{page.label}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const renderGroup = (group: NavigationGroupWithPages) => {
    const GroupIcon = GROUP_ICONS[group.icon] || LayoutDashboard;
    const isExpanded = expandedGroups[group.id] ?? false;
    const featureFlags = getAllFlags();
    const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
    
    const nonLandingPages = group.pages.filter(p => !p.isGroupLanding && !p.hideFromMoreMenu);
    const hasMorePages = nonLandingPages.length > 0;

    if (isCollapsed) {
      return (
        <div key={group.id} className="space-y-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={landingPath} onClick={() => isMobile && onNavigate?.()}>
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    location.startsWith(landingPath) || group.pages.some(p => p.isActive)
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  data-testid={`group-${group.id}`}
                  >
                    <GroupIcon className="w-5 h-5" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {group.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-1">
        <div className="flex items-center gap-1">
          <Link 
            href={landingPath} 
            onClick={() => isMobile && onNavigate?.()}
            className="flex-1"
          >
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group",
              group.pages.some(p => p.isActive)
                ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20" 
                : "text-foreground/80 hover:text-foreground hover:bg-white/5 border border-transparent"
            )}
            data-testid={`group-${group.id}`}
            >
              <GroupIcon className={cn(
                "w-5 h-5",
                group.pages.some(p => p.isActive) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="flex-1">{group.title}</span>
            </div>
          </Link>
          
          {hasMorePages && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0 transition-colors",
                isExpanded ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => toggleGroupExpansion(group.id)}
              data-testid={`expand-${group.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <MoreHorizontal className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && hasMorePages && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 pl-4 border-l border-sidebar-border/50 space-y-1 overflow-hidden"
            >
              {nonLandingPages.map(page => renderNavItem(page))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isMobile ? "w-full h-full" : isCollapsed ? "w-16 h-screen" : "w-[280px] h-screen"
    )} data-testid="sidebar">
      
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm",
        isCollapsed ? "px-3 justify-center" : "px-6"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <i className="fas fa-tshirt text-primary-foreground text-sm"></i>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Rich Habits OS
            </span>
          )}
        </div>
      </div>

      <ScrollArea className={cn("flex-1 py-4", isCollapsed ? "px-3" : "px-4")}>
        <div className="space-y-2">
          {enableRoleHome && user?.role && ROLE_HOME_PATHS[user.role] && (
            <div className={cn("pb-2 mb-2 border-b border-sidebar-border/50", isCollapsed && "flex justify-center")}>
              {isCollapsed ? (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={ROLE_HOME_PATHS[user.role]}
                        onClick={() => isMobile && onNavigate?.()}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                          location === ROLE_HOME_PATHS[user.role]
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                        data-testid="link-role-home"
                        >
                          <Home className="w-5 h-5" />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      Home
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Link
                  href={ROLE_HOME_PATHS[user.role]}
                  onClick={() => isMobile && onNavigate?.()}
                >
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    location === ROLE_HOME_PATHS[user.role]
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent"
                  )}
                  data-testid="link-role-home"
                  >
                    <Home className={cn(
                      "w-5 h-5 transition-colors",
                      location === ROLE_HOME_PATHS[user.role] ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="flex-1">Home</span>
                  </div>
                </Link>
              )}
            </div>
          )}

          {navigation.map(group => renderGroup(group))}
        </div>
      </ScrollArea>

      <div className={cn(
        "border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-9 h-9 border border-sidebar-border cursor-pointer">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "User"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => performLogout()}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-sidebar-border">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"
                }
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role || "User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => performLogout()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
