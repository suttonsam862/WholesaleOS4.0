import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
}

export function ResponsiveTable({ children, className, stickyFirstColumn }: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({
    showLeftShadow: false,
    showRightShadow: false,
  });

  const checkScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasHorizontalScroll = scrollWidth > clientWidth;
    
    setScrollState({
      showLeftShadow: hasHorizontalScroll && scrollLeft > 0,
      showRightShadow: hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 1,
    });
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);
  
  if (isMobile) {
    return (
      <table 
        className={cn(
          "w-full mobile-card-table",
          className
        )}
      >
        {children}
      </table>
    );
  }

  return (
    <div className="relative">
      {scrollState.showLeftShadow && <div className="scroll-shadow-left" />}
      {scrollState.showRightShadow && <div className="scroll-shadow-right" />}
      <div 
        ref={containerRef}
        className={cn(
          "responsive-table-scroll",
          stickyFirstColumn && "responsive-table-sticky"
        )}
      >
        <table 
          className={cn(
            "w-full",
            className
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  isSticky?: boolean;
}

export function ResponsiveTableCell({ 
  children, 
  label, 
  className,
  isSticky 
}: ResponsiveTableCellProps) {
  return (
    <td 
      className={cn(
        className,
        isSticky && "sticky-column"
      )}
      data-label={label}
    >
      {children}
    </td>
  );
}

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
}

export function ResponsiveTableWrapper({ 
  children, 
  className,
  stickyFirstColumn 
}: ResponsiveTableWrapperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({
    showLeftShadow: false,
    showRightShadow: false,
  });

  const checkScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasHorizontalScroll = scrollWidth > clientWidth;
    
    setScrollState({
      showLeftShadow: hasHorizontalScroll && scrollLeft > 0,
      showRightShadow: hasHorizontalScroll && scrollLeft < scrollWidth - clientWidth - 1,
    });
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  return (
    <div className={cn("relative rounded-xl border border-white/10 overflow-hidden", className)}>
      {scrollState.showLeftShadow && <div className="scroll-shadow-left" />}
      {scrollState.showRightShadow && <div className="scroll-shadow-right" />}
      <div 
        ref={containerRef}
        className={cn(
          "responsive-table-scroll",
          stickyFirstColumn && "responsive-table-sticky"
        )}
      >
        {children}
      </div>
    </div>
  );
}
