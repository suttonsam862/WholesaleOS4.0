import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
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
  User,
  LogOut,
  Building2,
  Package,
  Store,
  Calendar,
  Briefcase,
  Paintbrush,
  Warehouse,
  Map,
  GitBranch,
  Shield,
  Users,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Full navigation items matching sidebar and dock
const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Design Jobs", href: "/design-jobs", icon: Palette },
  { name: "Manufacturing", href: "/manufacturing", icon: Factory },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Team Stores", href: "/team-stores", icon: Store },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Salespeople", href: "/salespeople", icon: Briefcase },
  { name: "Designer Management", href: "/designer-management", icon: Paintbrush },
  { name: "Manufacturer Management", href: "/manufacturer-management", icon: Warehouse },
  { name: "Order Map", href: "/order-map", icon: Map },
  { name: "Pipeline", href: "/pipeline", icon: GitBranch },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "User Management", href: "/user-management", icon: Users },
  { name: "Permissions", href: "/admin/permissions", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const handleLogout = async () => {
    try {
      // Use the local logout endpoint
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        window.location.href = '/';
      } else {
        // Fallback to regular logout
        window.location.href = '/api/logout';
      }
    } catch {
      window.location.href = '/api/logout';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden bg-transparent border-none shadow-2xl max-w-2xl">
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)]">
          <Command className="bg-transparent">
            <div className="flex items-center border-b border-white/10 px-4" cmdk-input-wrapper="">
              <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-neon-blue" />
              <Command.Input 
                placeholder="Type a command or search..."
                className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-white"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden py-2 px-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              
              <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {NAV_ITEMS.map((item) => (
                  <CommandItem key={item.href} onSelect={() => runCommand(() => setLocation(item.href))}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </Command.Group>

              <Command.Group heading="Account" className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-2">
                <CommandItem onSelect={() => runCommand(() => setLocation("/notifications"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(handleLogout)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </CommandItem>
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-neon-blue/10 aria-selected:text-neon-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
    >
      {children}
    </Command.Item>
  );
}
