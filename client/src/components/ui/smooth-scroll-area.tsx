import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface SmoothScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  showGradients?: boolean;
}

export function SmoothScrollArea({
  children,
  className,
  showGradients = true,
}: SmoothScrollAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ atTop: true, atBottom: true });
  const overscrollY = useMotionValue(0);
  const springOverscroll = useSpring(overscrollY, {
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  });

  const topGradientOpacity = useTransform(
    springOverscroll,
    [-50, 0],
    [0.8, scrollState.atTop ? 0 : 0.6]
  );
  const bottomGradientOpacity = useTransform(
    springOverscroll,
    [0, 50],
    [scrollState.atBottom ? 0 : 0.6, 0.8]
  );

  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const atTop = scrollTop <= 1;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    
    setScrollState({ atTop, atBottom });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition]);

  const handleTouchStart = useRef({ y: 0, scrollTop: 0 });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;
    
    handleTouchStart.current = {
      y: e.touches[0].clientY,
      scrollTop: container.scrollTop,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const currentY = e.touches[0].clientY;
    const diff = currentY - handleTouchStart.current.y;

    const atTop = scrollTop <= 0 && diff > 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && diff < 0;

    if (atTop) {
      overscrollY.set(Math.min(diff * 0.3, 50));
    } else if (atBottom) {
      overscrollY.set(Math.max(diff * 0.3, -50));
    }
  }, [overscrollY]);

  const onTouchEnd = useCallback(() => {
    overscrollY.set(0);
  }, [overscrollY]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {showGradients && (
        <>
          <motion.div
            className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10"
            style={{ opacity: topGradientOpacity }}
            data-testid="scroll-gradient-top"
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"
            style={{ opacity: bottomGradientOpacity }}
            data-testid="scroll-gradient-bottom"
          />
        </>
      )}

      <motion.div
        ref={containerRef}
        className="h-full w-full overflow-auto overscroll-y-contain scroll-smooth"
        style={{
          y: springOverscroll,
          WebkitOverflowScrolling: "touch",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        data-testid="smooth-scroll-viewport"
      >
        {children}
      </motion.div>
    </div>
  );
}
