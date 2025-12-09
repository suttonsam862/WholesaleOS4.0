import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS, BOTTOM_NAVIGATION } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  LayoutDashboard, 
  Target, 
  Building2, 
  Contact, 
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
  Image,
  Box,
  Wrench,
  TrendingUp,
  Map,
  GitBranch,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Lead {
  id: number;
  stage: 'future_lead' | 'lead' | 'hot_lead' | 'mock_up' | 'mock_up_sent' | 'team_store_or_direct_order' | 'current_clients' | 'no_answer_delete';
}

interface DesignJob {
  id: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';
}

// Icon mapping for resources
const ICON_MAP: Record<string, any> = {
  "dashboard": LayoutDashboard,
  "leads": Target,
  "organizations": Building2,
  "contacts": Contact,
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
  "fabricManagement": Layers,
  "userManagement": UserCog,
  "finance": DollarSign,
  "quotes": FileText,
  "users": FlaskConical,
  "settings": Settings
};

// Navigation Groups Configuration
const NAVIGATION_GROUPS = [
  {
    title: "Overview",
    resources: ["dashboard", "tasks"],
    icon: LayoutDashboard
  },
  {
    title: "Sales & CRM",
    resources: ["leads", "organizations", "contacts", "salespeople", "quotes"],
    icon: Users
  },
  {
    title: "Production & Design",
    resources: ["designJobs", "orders", "manufacturing", "teamStores", "events"],
    icon: Factory
  },
  {
    title: "Inventory & Catalog",
    resources: ["catalog", "manufacturerManagement", "designerManagement"],
    icon: Package
  },
  {
    title: "Finance",
    resources: ["finance"],
    icon: DollarSign
  },
  {
    title: "Admin",
    resources: ["userManagement"],
    icon: Shield
  }
];

// Real-time badge logic for notification counts
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

// Role-specific workflow pages for admin quick access
const ROLE_WORKFLOW_PAGES = [
  {
    category: "Sales",
    icon: TrendingUp,
    pages: [
      { name: "Sales Analytics", href: "/sales-analytics", icon: Activity },
      { name: "Sales Tracker", href: "/sales-tracker", icon: Target },
      { name: "Sales Resources", href: "/sales-resources", icon: FileText },
    ]
  },
  {
    category: "Design",
    icon: Palette,
    pages: [
      { name: "Design Portfolio", href: "/design-portfolio", icon: Image },
      { name: "Design Resources", href: "/design-resources", icon: Palette },
    ]
  },
  {
    category: "Operations",
    icon: Wrench,
    pages: [
      { name: "Order Map", href: "/order-map", icon: Map },
      { name: "Pipeline View", href: "/pipeline", icon: GitBranch },
      { name: "Size Checker", href: "/size-checker", icon: Box },
      { name: "Capacity Dashboard", href: "/capacity-dashboard", icon: Activity },
      { name: "Order Specifications", href: "/order-specifications", icon: Wrench },
    ]
  },
  {
    category: "Admin",
    icon: Activity,
    pages: [
      { name: "System Analytics", href: "/system-analytics", icon: Activity },
      { name: "Connection Health", href: "/connection-health", icon: Wifi },
    ]
  },
];

interface SidebarProps {
  user?: any;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ user, isMobile = false, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const badges = useBadgeCounts();
  const { isPageVisible, isLoading } = usePermissions();
  
  // State for collapsible groups - default all open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Initialize open groups
  useEffect(() => {
    const initialGroups: Record<string, boolean> = {};
    NAVIGATION_GROUPS.forEach(group => {
      initialGroups[group.title] = true;
    });
    setOpenGroups(initialGroups);
  }, []);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Process navigation items into groups
  const groupedNavigation = useMemo(() => {
    if (isLoading) return [];

    const availableItems = NAVIGATION_ITEMS.filter(item => isPageVisible(item.resource));
    
    return NAVIGATION_GROUPS.map(group => {
      const groupItems = availableItems.filter(item => 
        group.resources.includes(item.resource)
      ).map(item => ({
        ...item,
        badge: badges[item.href] || null,
        iconComponent: ICON_MAP[item.resource] || LayoutDashboard
      }));

      return {
        ...group,
        items: groupItems
      };
    }).filter(group => group.items.length > 0);
  }, [isLoading, isPageVisible, badges]);

  const bottomItems = useMemo(() => {
    if (isLoading) return [];
    return BOTTOM_NAVIGATION.filter(item => {
      if (!isPageVisible(item.resource)) return false;
      if ((item as any).adminOnly && user?.role !== 'admin') return false;
      return true;
    }).map(item => ({
      ...item,
      iconComponent: ICON_MAP[item.resource] || Settings
    }));
  }, [isLoading, isPageVisible, user]);

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isMobile ? "w-full h-full" : "w-[280px] h-screen"
    )} data-testid="sidebar">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <i className="fas fa-tshirt text-primary-foreground text-sm"></i>
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Rich Habits OS
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6">
          {groupedNavigation.map((group) => (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
              >
                <span className="flex items-center gap-2">
                  {group.title}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 transition-transform duration-200 opacity-50 group-hover:opacity-100",
                  !openGroups[group.title] && "-rotate-90"
                )} />
              </button>
              
              <AnimatePresence initial={false}>
                {openGroups[group.title] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                      const Icon = item.iconComponent;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => isMobile && onNavigate?.()}
                        >
                          <div className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                            isActive 
                              ? "bg-primary/10 text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}>
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
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary border border-primary/20">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Admin Role Workflows */}
          {user?.role === 'admin' && (
            <div className="space-y-1 pt-4 border-t border-sidebar-border">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
                  <span>Role Workflows</span>
                  <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-2">
                  {ROLE_WORKFLOW_PAGES.map((section) => (
                    <div key={section.category} className="space-y-1 pl-2">
                      <div className="px-2 text-[10px] font-medium text-muted-foreground/70 uppercase">
                        {section.category}
                      </div>
                      {section.pages.map((page) => {
                        const isActive = location === page.href;
                        const Icon = page.icon;
                        
                        return (
                          <Link
                            key={page.href}
                            href={page.href}
                            onClick={() => isMobile && onNavigate?.()}
                          >
                            <div className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                              isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}>
                              <Icon className="w-4 h-4" />
                              <span>{page.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation & User Profile */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm space-y-4">
        {/* Bottom Links */}
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.iconComponent;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onNavigate?.()}
              >
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}>
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pt-4 border-t border-sidebar-border">
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
            onClick={() => window.location.href = '/api/logout'}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}