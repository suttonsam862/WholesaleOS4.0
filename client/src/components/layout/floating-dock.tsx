import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  Search,
  Map,
  GitBranch,
  BookOpen,
  Briefcase
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Expanded navigation for the dock - all key areas
const DOCK_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Design", href: "/design-jobs", icon: Palette },
  { name: "Production", href: "/manufacturing", icon: Factory },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Team Stores", href: "/team-stores", icon: Store },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Salespeople", href: "/salespeople", icon: Briefcase },
  { name: "Designers", href: "/designer-management", icon: Paintbrush },
  { name: "Manufacturers", href: "/manufacturer-management", icon: Warehouse },
  { name: "Order Map", href: "/order-map", icon: Map },
  { name: "Pipeline", href: "/pipeline", icon: GitBranch },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "Permissions", href: "/admin/permissions", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function FloatingDock({ onSearchClick }: { onSearchClick: () => void }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-end gap-4 pb-3 px-4 h-16 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-neon-blue/10">
      {DOCK_ITEMS.map((item) => (
        <DockIcon key={item.name} mouseX={mouseX} item={item} />
      ))}
      
      <div className="w-[1px] h-8 bg-white/10 mx-1 self-center" />
      
      <DockIconButton mouseX={mouseX} onClick={onSearchClick} icon={Search} name="Search" />
    </div>
  );
}

function DockIcon({ mouseX, item }: { mouseX: any, item: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isActive = location === item.href;

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href}>
            <motion.div
              ref={ref}
              style={{ width }}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center relative transition-colors",
                isActive 
                  ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
              )}
            >
              <item.icon className="w-1/2 h-1/2" />
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-neon-blue" />
              )}
            </motion.div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/80 border-white/10 text-white backdrop-blur-md">
          <p>{item.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DockIconButton({ mouseX, onClick, icon: Icon, name }: { mouseX: any, onClick: () => void, icon: any, name: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            ref={ref}
            style={{ width }}
            onClick={onClick}
            className="aspect-square rounded-full flex items-center justify-center relative bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5"
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
