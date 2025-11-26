import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings, Bell, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "./sidebar";
import { QuickCreateModal } from "@/components/modals/quick-create-modal";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  onOpenQuickCreate: () => void;
  onToggleMobileSidebar?: () => void;
  isMobile?: boolean;
}

interface SearchResult {
  leads: any[];
  organizations: any[];
  orders: any[];
  products: any[];
}

export function Header({ title, onOpenQuickCreate, onToggleMobileSidebar, isMobile = false }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [, setLocation] = useLocation();

  const { data: searchResults, isLoading: searchLoading } = useQuery<SearchResult>({
    queryKey: ["/api/search", searchQuery],
    enabled: searchQuery.length > 2,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      return await res.json();
    },
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowSearchResults(false), 200);
  };

  // Listen for keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "/" && !["input", "textarea"].includes((e.target as HTMLElement).tagName.toLowerCase())) {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('[data-testid="input-global-search"]')?.focus();
    } else if (e.key === "c" && !["input", "textarea"].includes((e.target as HTMLElement).tagName.toLowerCase())) {
      e.preventDefault();
      onOpenQuickCreate();
    }
  };

  // Add keyboard listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenQuickCreate]);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Try local logout first
      await apiRequest("POST", "/api/auth/local/logout", {});
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your local session.",
      });
      window.location.href = "/";
    } catch (error) {
      // Fallback to Replit Auth logout
      window.location.href = "/api/logout";
    }
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 sticky top-0 z-50" data-testid="header">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] border-r border-border">
                <Sidebar isMobile={true} />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-lg font-semibold tracking-tight text-foreground truncate" data-testid="heading-page-title">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Global Search - Hidden on mobile */}
          {!isMobile && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search..." 
                className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-muted/50 border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                data-testid="input-global-search"
              />

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.length > 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl shadow-black/20 z-50 max-h-96 overflow-auto backdrop-blur-xl p-2">
                {searchLoading ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
                ) : searchResults ? (
                  <div className="space-y-2">
                    {searchResults.leads.length > 0 && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads</div>
                        {searchResults.leads.map((lead) => (
                          <div key={lead.id} className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm text-foreground">{lead.leadCode}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.organizations.length > 0 && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organizations</div>
                        {searchResults.organizations.map((org) => (
                          <div key={org.id} className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm text-foreground">{org.name}</div>
                            <div className="text-xs text-muted-foreground">{org.city}, {org.state}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.orders.length > 0 && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders</div>
                        {searchResults.orders.map((order) => (
                          <div key={order.id} className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm text-foreground">{order.orderCode}</div>
                            <div className="text-xs text-muted-foreground">{order.orderName}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.products.length > 0 && (
                      <div>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products</div>
                        {searchResults.products.map((product) => (
                          <div key={product.id} className="px-3 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm text-foreground">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.sku}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.leads.length === 0 && 
                     searchResults.organizations.length === 0 && 
                     searchResults.orders.length === 0 && 
                     searchResults.products.length === 0 && (
                      <div className="p-8 text-sm text-muted-foreground text-center">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            </div>
          )}

          {/* Mobile Search Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Quick Create */}
          <Button 
            onClick={onOpenQuickCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-lg shadow-primary/20 transition-all duration-300"
            size={isMobile ? "sm" : "default"}
            data-testid="button-quick-create"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/notifications")}
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount.count > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
            )}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                {user.avatarUrl ? (
                  <ImageWithFallback src={user.avatarUrl} alt="User Avatar" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/profile"}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/settings"}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}