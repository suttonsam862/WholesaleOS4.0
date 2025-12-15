import { useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import {
  buildNavigationForUser,
  getGroupLandingForRole,
  getDefaultLandingForRole,
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
  Settings,
  Search,
  MoreHorizontal,
  ChevronRight,
  X,
  Home,
  type LucideIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "target": Target,
  "shopping-cart": ShoppingCart,
  "factory": Factory,
  "palette": Palette,
  "package": Package,
  "dollar-sign": DollarSign,
  "shield": Shield,
};

function getShortTitle(fullTitle: string): string {
  const firstWord = fullTitle.split(" ")[0];
  if (firstWord === "Sales") return "Sales";
  if (firstWord === "Orders") return "Orders";
  if (firstWord === "Production") return "Production";
  if (firstWord === "Design") return "Design";
  if (firstWord === "Catalog") return "Catalog";
  if (firstWord === "Finance") return "Finance";
  if (firstWord === "Admin") return "Admin";
  return firstWord;
}

interface FloatingDockProps {
  onSearchClick: () => void;
  user?: any;
}

export function FloatingDock({ onSearchClick, user }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);
  const [location] = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { getAllFlags } = useFeatureFlags();

  const navigation = useMemo(() => {
    if (!user?.role) return [];
    const featureFlags = getAllFlags();
    return buildNavigationForUser(user.role as UserRole, location, featureFlags);
  }, [user?.role, location, getAllFlags]);

  const getGroupIcon = (iconName: string): LucideIcon => {
    return GROUP_ICONS[iconName] || Target;
  };

  const isGroupActive = (group: NavigationGroupWithPages): boolean => {
    return group.pages.some(p => p.isActive);
  };

  const featureFlags = getAllFlags();
  const homePath = user?.role ? getDefaultLandingForRole(user.role as UserRole, featureFlags) : "/";
  const isHomeActive = location === homePath || location === "/" || 
    (user?.role && location === `/${user.role}/home`);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 hidden md:flex items-center justify-center gap-2 py-3 px-4 bg-black/60 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-neon-blue/10"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      data-testid="floating-dock"
    >
      <DockGroupItem
        mouseX={mouseX}
        href={homePath}
        icon={Home}
        label="Home"
        isActive={isHomeActive}
        testId="dock-home"
      />
      
      <div className="w-[1px] h-8 bg-white/10 mx-1 self-center" />
      
      {navigation.map((group) => {
        const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
        const Icon = getGroupIcon(group.icon);
        const isActive = isGroupActive(group);
        const shortTitle = getShortTitle(group.title);
        
        return (
          <DockGroupItem
            key={group.id}
            mouseX={mouseX}
            href={landingPath}
            icon={Icon}
            label={shortTitle}
            isActive={isActive}
            testId={`dock-group-${group.id}`}
          />
        );
      })}
      
      <div className="w-[1px] h-8 bg-white/10 mx-1 self-center" />
      
      <DockGroupItem
        mouseX={mouseX}
        href="/settings"
        icon={Settings}
        label="Settings"
        isActive={location === "/settings" || location.startsWith("/settings/")}
        testId="dock-settings"
      />
      
      <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <PopoverTrigger asChild>
          <div>
            <DockIconButton
              mouseX={mouseX}
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              icon={MoreHorizontal}
              name="More"
              isActive={isMoreOpen}
              testId="dock-more"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="end" 
          sideOffset={12}
          className="w-[400px] max-h-[70vh] p-0 bg-black/95 backdrop-blur-xl border-white/10"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">All Navigation</h3>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              data-testid="button-close-more-menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <ScrollArea className="max-h-[calc(70vh-60px)]">
            <div className="p-3 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <Link href={homePath} onClick={() => setIsMoreOpen(false)}>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      isHomeActive
                        ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                    data-testid="more-home"
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-xs font-medium">Home</span>
                  </div>
                </Link>
                
                {navigation.map((group) => {
                  const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
                  const Icon = getGroupIcon(group.icon);
                  const isActive = isGroupActive(group);
                  const shortTitle = getShortTitle(group.title);
                  
                  return (
                    <Link 
                      key={group.id} 
                      href={landingPath}
                      onClick={() => setIsMoreOpen(false)}
                    >
                      <div
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                          isActive
                            ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                            : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                        data-testid={`more-group-${group.id}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{shortTitle}</span>
                      </div>
                    </Link>
                  );
                })}
                
                <Link href="/settings" onClick={() => setIsMoreOpen(false)}>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      location === "/settings" || location.startsWith("/settings/")
                        ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                    data-testid="more-settings"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-xs font-medium">Settings</span>
                  </div>
                </Link>
              </div>
              
              <div className="border-t border-white/10 pt-4 space-y-3">
                {navigation.map((group) => {
                  const Icon = getGroupIcon(group.icon);
                  const visiblePages = group.pages.filter(p => !p.hideFromMoreMenu);
                  const landingPath = getGroupLandingForRole(group, user?.role as UserRole, featureFlags);
                  
                  if (visiblePages.length <= 1) return null;
                  
                  return (
                    <div key={group.id} className="space-y-1">
                      <Link 
                        href={landingPath}
                        onClick={() => setIsMoreOpen(false)}
                      >
                        <div className="flex items-center gap-2 px-2 py-1.5 text-white/50 hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {group.title}
                          </span>
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </div>
                      </Link>
                      
                      <div className="ml-6 space-y-0.5">
                        {visiblePages.map((page) => (
                          <Link
                            key={page.id}
                            href={page.path}
                            onClick={() => setIsMoreOpen(false)}
                          >
                            <div
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm transition-all",
                                page.isActive
                                  ? "text-neon-blue bg-neon-blue/10"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              )}
                              data-testid={`more-page-${page.id}`}
                            >
                              {page.label}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      <DockIconButton 
        mouseX={mouseX} 
        onClick={onSearchClick} 
        icon={Search} 
        name="Search"
        testId="dock-search"
      />
    </div>
  );
}

interface DockGroupItemProps {
  mouseX: any;
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  testId: string;
}

function DockGroupItem({ mouseX, href, icon: Icon, label, isActive, testId }: DockGroupItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 64, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            <motion.div
              ref={ref}
              style={{ width }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl relative transition-colors cursor-pointer",
                isActive 
                  ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
              )}
              data-testid={testId}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate px-1">{label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-neon-blue" />
              )}
            </motion.div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/80 border-white/10 text-white backdrop-blur-md">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface DockIconButtonProps {
  mouseX: any;
  onClick: () => void;
  icon: LucideIcon;
  name: string;
  isActive?: boolean;
  testId?: string;
}

function DockIconButton({ mouseX, onClick, icon: Icon, name, isActive, testId }: DockIconButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            ref={ref}
            style={{ width }}
            onClick={onClick}
            className={cn(
              "aspect-square rounded-full flex items-center justify-center relative transition-colors",
              isActive
                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
            )}
            data-testid={testId}
          >
            <Icon className="w-1/2 h-1/2" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/80 border-white/10 text-white backdrop-blur-md">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
