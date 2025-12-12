import { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, ChevronRight, ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HubLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Breadcrumb[];
  quickActions?: QuickAction[];
  children: ReactNode;
  className?: string;
}

export function HubLayout({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  quickActions,
  children,
  className,
}: HubLayoutProps) {
  return (
    <div className={cn("p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80", className)} data-testid={`hub-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/">
            <button className="hover:text-white transition-colors" data-testid="breadcrumb-home">
              <Home className="w-4 h-4" />
            </button>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3" />
              {crumb.href ? (
                <Link href={crumb.href}>
                  <button className="hover:text-white transition-colors" data-testid={`breadcrumb-${crumb.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {crumb.label}
                  </button>
                </Link>
              ) : (
                <span className="text-white font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text" data-testid="text-hub-title">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {quickActions && quickActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-quick-actions"
              >
                Quick Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {quickActions.map((action) => (
                action.href ? (
                  <Link key={action.id} href={action.href}>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      data-testid={`quick-action-${action.id}`}
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  </Link>
                ) : (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={action.onClick}
                    className="cursor-pointer"
                    data-testid={`quick-action-${action.id}`}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

      {children}
    </div>
  );
}
