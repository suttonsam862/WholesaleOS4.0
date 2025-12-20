import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const indicatorOpacity = useTransform(pullDistance, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, threshold], [0, 180]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      pullDistance.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    const dampedDiff = Math.min(diff * 0.5, threshold * 1.5);
    pullDistance.set(dampedDiff);
  }, [isPulling, isRefreshing, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      pullDistance.set(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
    }
  }, [isPulling, threshold, isRefreshing, onRefresh, pullDistance]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pull-to-refresh-container"
    >
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="absolute left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
            style={{
              top: 0,
              height: pullDistance,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20"
              style={{
                opacity: indicatorOpacity,
                scale: indicatorScale,
              }}
            >
              {isRefreshing ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <motion.div style={{ rotate: indicatorRotation }}>
                  <ArrowDown className="w-5 h-5 text-primary" />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{
          y: pullDistance,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
