import { useLocation } from "wouter";
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Building2, 
  Users, 
  ShoppingCart, 
  FileText, 
  Calendar, 
  TrendingUp,
  Store,
  Flame,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const salesNavItems: NavItem[] = [
  { id: "home", label: "Sales Home", href: "/sales/home", icon: Home },
  { id: "leads", label: "Leads", href: "/leads", icon: Target },
  { id: "hot-leads", label: "Hot Leads", href: "/leads?stage=hot_lead", icon: Flame },
  { id: "organizations", label: "Organizations", href: "/organizations", icon: Building2 },
  { id: "contacts", label: "Contacts", href: "/contacts", icon: Users },
  { id: "orders", label: "Orders", href: "/orders", icon: ShoppingCart },
  { id: "quotes", label: "Quotes", href: "/quotes", icon: FileText },
  { id: "events", label: "Events", href: "/events", icon: Calendar },
  { id: "team-stores", label: "Team Stores", href: "/team-stores", icon: Store },
  { id: "analytics", label: "Sales Analytics", href: "/sales-analytics", icon: TrendingUp },
];

interface CollapsibleSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function CollapsibleSidebar({ isExpanded, onToggle }: CollapsibleSidebarProps) {
  const [location] = useLocation();

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 z-20 flex flex-col",
          "bg-background/95 backdrop-blur-xl border-r border-white/10",
          "transition-all duration-300 ease-in-out",
          isExpanded ? "w-56" : "w-14"
        )}
        data-testid="collapsible-sidebar"
      >
        <div className="flex items-center justify-end p-2 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
            data-testid="sidebar-toggle"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {salesNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href.split("?")[0] + "/");

            const linkElement = (
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 mx-2 rounded-lg cursor-pointer",
                  "transition-colors duration-200",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {isExpanded && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </a>
            );

            if (!isExpanded) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-background border border-white/10">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.id}>{linkElement}</div>;
          })}
        </nav>

        <div className="p-2 border-t border-white/10">
          {isExpanded ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Sales Navigation
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
