import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  
  return (
    <table 
      className={cn(
        "w-full",
        isMobile && "mobile-card-table",
        className
      )}
    >
      {children}
    </table>
  );
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function ResponsiveTableCell({ children, label, className }: ResponsiveTableCellProps) {
  return (
    <td 
      className={className}
      data-label={label}
    >
      {children}
    </td>
  );
}