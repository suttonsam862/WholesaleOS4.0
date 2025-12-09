import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function StatusBadge({ status, children, className, ...props }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/_/g, '-');
    
    switch (normalizedStatus) {
      case "new":
      case "unclaimed":
        return "bg-blue-900/30 text-blue-300 border-blue-800/50";
      
      case "claimed":
      case "contacted":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-800/50";
      
      case "qualified":
      case "ready-for-review":
      case "review":
        return "bg-indigo-900/30 text-indigo-300 border-indigo-800/50";
      
      case "won":
      case "finalized":
      case "completed":
      case "ready":
      case "approved":
        return "bg-green-900/30 text-green-300 border-green-800/50";
      
      case "lost":
      case "overdue":
      case "rejected":
        return "bg-red-900/30 text-red-300 border-red-800/50";
      
      case "assigned":
        return "bg-cyan-900/30 text-cyan-300 border-cyan-800/50";
      
      case "production":
      case "in-progress":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-800/50";
      
      case "shipped":
        return "bg-blue-900/30 text-blue-300 border-blue-800/50";
      
      case "waiting-sizes":
      case "invoiced":
        return "bg-purple-900/30 text-purple-300 border-purple-800/50";
      
      // Manufacturing workflow stages
      case "awaiting-admin-confirmation":
        return "bg-amber-900/30 text-amber-300 border-amber-800/50";
      
      case "confirmed":
        return "bg-blue-900/30 text-blue-300 border-blue-800/50";
      
      case "cutting":
        return "bg-purple-900/30 text-purple-300 border-purple-800/50";
      
      case "printing":
        return "bg-pink-900/30 text-pink-300 border-pink-800/50";
      
      case "packaging":
        return "bg-cyan-900/30 text-cyan-300 border-cyan-800/50";
      
      case "shipping":
        return "bg-emerald-900/30 text-emerald-300 border-emerald-800/50";
      
      case "high":
        return "bg-red-900/30 text-red-300 border-red-800/50";
      
      case "normal":
        return "bg-blue-900/30 text-blue-300 border-blue-800/50";
      
      case "low":
        return "bg-green-900/30 text-green-300 border-green-800/50";
      
      case "target":
        return "bg-emerald-900/30 text-emerald-300 border-emerald-800/50";
      
      case "unassigned":
        return "bg-gray-900/30 text-gray-300 border-gray-800/50";
      
      default:
        return "bg-muted/30 text-muted-foreground border-muted/50";
    }
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full border",
        getStatusStyles(status),
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}
