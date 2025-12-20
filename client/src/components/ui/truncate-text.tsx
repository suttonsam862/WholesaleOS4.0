import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TruncateTextProps {
  lines?: 1 | 2 | 3 | 4 | 5;
  expandable?: boolean;
  children: string;
  className?: string;
}

const lineClampClasses: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
};

export function TruncateText({
  lines = 3,
  expandable = false,
  children,
  className,
}: TruncateTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current && measureRef.current) {
        const clampedHeight = textRef.current.scrollHeight;
        const fullHeight = measureRef.current.scrollHeight;
        setIsTruncated(fullHeight > clampedHeight || textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children, lines]);

  const handleToggle = () => {
    if (expandable && isTruncated) {
      setIsExpanded(!isExpanded);
    }
  };

  const showToggle = expandable && isTruncated;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none whitespace-pre-wrap"
        style={{ visibility: "hidden" }}
        aria-hidden="true"
      >
        {children}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isExpanded ? "expanded" : "collapsed"}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={textRef}
            className={cn(
              "overflow-hidden transition-colors",
              !isExpanded && lineClampClasses[lines],
              showToggle && "cursor-pointer hover:text-muted-foreground/80"
            )}
            onClick={handleToggle}
            animate={{
              height: "auto",
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            data-testid="truncate-text-content"
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showToggle && (
        <motion.button
          type="button"
          onClick={handleToggle}
          className={cn(
            "inline-flex items-center gap-1 mt-1 text-sm font-medium",
            "text-primary hover:text-primary/80 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          data-testid="truncate-text-toggle"
        >
          {isExpanded ? (
            <>
              Show less
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

export default TruncateText;
