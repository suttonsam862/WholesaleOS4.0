import { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  FileText,
  Contact
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { performLogout } from "@/lib/queryClient";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Design Jobs", href: "/design-jobs", icon: Palette },
  { name: "Manufacturing", href: "/manufacturing", icon: Factory },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Contacts", href: "/contacts", icon: Contact },
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

interface SearchResult {
  leads: any[];
  organizations: any[];
  orders: any[];
  products: any[];
}

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery<SearchResult>({
    queryKey: ["/api/search", searchQuery],
    enabled: searchQuery.length > 2 && open,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      if (!res.ok) return { leads: [], organizations: [], orders: [], products: [] };
      return await res.json();
    },
  });

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

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

  const handleLogout = () => {
    performLogout();
  };

  const hasResults = searchResults && (
    searchResults.leads.length > 0 ||
    searchResults.organizations.length > 0 ||
    searchResults.orders.length > 0 ||
    searchResults.products.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden bg-transparent border-none shadow-2xl max-w-2xl">
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)]">
          <Command className="bg-transparent" shouldFilter={!hasResults}>
            <div className="flex items-center border-b border-white/10 px-4" cmdk-input-wrapper="">
              <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-neon-blue" />
              <Command.Input 
                placeholder="Type a command or search..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-white"
                data-testid="command-palette-input"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden py-2 px-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {searchResults && searchResults.orders.length > 0 && (
                <Command.Group heading="Orders" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {searchResults.orders.map((order) => (
                    <CommandItem 
                      key={`order-${order.id}`} 
                      value={`order ${order.orderCode} ${order.orderName}`}
                      onSelect={() => runCommand(() => setLocation(`/orders/${order.id}`))}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{order.orderCode}</span>
                        <span className="text-xs text-muted-foreground">{order.orderName}</span>
                      </div>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}

              {searchResults && searchResults.organizations.length > 0 && (
                <Command.Group heading="Organizations" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {searchResults.organizations.map((org) => (
                    <CommandItem 
                      key={`org-${org.id}`} 
                      value={`organization ${org.name} ${org.city || ''}`}
                      onSelect={() => runCommand(() => setLocation(`/organizations?selected=${org.id}`))}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{org.name}</span>
                        {org.city && <span className="text-xs text-muted-foreground">{org.city}, {org.state}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}

              {searchResults && searchResults.leads.length > 0 && (
                <Command.Group heading="Leads" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {searchResults.leads.map((lead) => (
                    <CommandItem 
                      key={`lead-${lead.id}`} 
                      value={`lead ${lead.leadCode}`}
                      onSelect={() => runCommand(() => setLocation(`/leads?selected=${lead.id}`))}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      <span>{lead.leadCode}</span>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}

              {searchResults && searchResults.products.length > 0 && (
                <Command.Group heading="Products" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {searchResults.products.map((product) => (
                    <CommandItem 
                      key={`product-${product.id}`} 
                      value={`product ${product.name} ${product.sku || ''}`}
                      onSelect={() => runCommand(() => setLocation(`/catalog?selected=${product.id}`))}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        {product.sku && <span className="text-xs text-muted-foreground">{product.sku}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </Command.Group>
              )}
              
              <Command.Group heading="Pages" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {NAV_ITEMS.map((item) => (
                  <CommandItem 
                    key={item.href} 
                    value={`page ${item.name}`}
                    onSelect={() => runCommand(() => setLocation(item.href))}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </Command.Group>

              <Command.Group heading="Account" className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-2">
                <CommandItem value="notifications" onSelect={() => runCommand(() => setLocation("/notifications"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </CommandItem>
                <CommandItem value="logout log out sign out" onSelect={() => runCommand(handleLogout)}>
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

function CommandItem({ children, onSelect, value }: { children: React.ReactNode, onSelect: () => void, value: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-neon-blue/10 aria-selected:text-neon-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors text-white"
      data-testid={`command-item-${value.split(' ')[0]}`}
    >
      {children}
    </Command.Item>
  );
}
