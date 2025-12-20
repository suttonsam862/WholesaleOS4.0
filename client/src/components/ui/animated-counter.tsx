import { useEffect, useRef, useMemo } from "react";
import { motion, useSpring, useTransform, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
  flashOnChange?: boolean;
}

function durationToSpringConfig(duration: number) {
  const clampedDuration = Math.max(0.1, Math.min(2, duration));
  const stiffness = 100 / clampedDuration;
  const damping = 20 / Math.sqrt(clampedDuration);
  return { stiffness, damping };
}

export function AnimatedCounter({
  value,
  className,
  duration = 0.5,
  flashOnChange = true,
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const springConfig = useMemo(() => durationToSpringConfig(duration), [duration]);
  
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, prefersReducedMotion ? { stiffness: 1000, damping: 100 } : springConfig);
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const prevValue = useRef(value);
  const flashOpacity = useMotionValue(0);

  useEffect(() => {
    if (value !== prevValue.current) {
      motionValue.set(value);
      
      if (flashOnChange) {
        flashOpacity.set(1);
        const timeout = setTimeout(() => {
          flashOpacity.set(0);
        }, 150);
        return () => clearTimeout(timeout);
      }
    }
    prevValue.current = value;
  }, [value, motionValue, flashOnChange, flashOpacity]);

  return (
    <motion.span
      className={cn("relative inline-block tabular-nums", className)}
      data-testid="animated-counter"
    >
      {flashOnChange && (
        <motion.span
          className="absolute inset-0 bg-primary/20 rounded"
          style={{ opacity: flashOpacity }}
          transition={{ duration: 0.15 }}
        />
      )}
      <motion.span>{displayValue}</motion.span>
    </motion.span>
  );
}

interface AnimatedDigitProps {
  digit: number;
  className?: string;
}

function AnimatedDigit({ digit, className }: AnimatedDigitProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className={cn("relative h-[1em] w-[0.6em] overflow-hidden", className)}>
      <motion.div
        className="absolute"
        animate={{ y: -digit * 1 + "em" }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          type: "spring",
          stiffness: 200,
          damping: 25,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div key={n} className="h-[1em] leading-[1em]">
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

interface AnimatedDigitsCounterProps {
  value: number;
  className?: string;
}

export function AnimatedDigitsCounter({
  value,
  className,
}: AnimatedDigitsCounterProps) {
  const digits = value.toString().split("").map(Number);

  return (
    <div
      className={cn("inline-flex tabular-nums", className)}
      data-testid="animated-digits-counter"
    >
      {digits.map((digit, index) => (
        <AnimatedDigit key={index} digit={digit} />
      ))}
    </div>
  );
}
