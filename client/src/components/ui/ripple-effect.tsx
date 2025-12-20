import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
  disabled?: boolean;
}

export function RippleEffect({
  children,
  className,
  color = "rgba(255, 255, 255, 0.3)",
  duration = 600,
  disabled = false,
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (disabled) return;

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const newRipple: Ripple = {
        id: Date.now(),
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);
    },
    [disabled, duration]
  );

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
      data-testid="ripple-effect-container"
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration / 1000,
              ease: "easeOut",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  rippleDuration?: number;
}

export function RippleButton({
  children,
  className,
  rippleColor = "rgba(255, 255, 255, 0.3)",
  rippleDuration = 600,
  disabled,
  ...props
}: RippleButtonProps) {
  return (
    <RippleEffect
      color={rippleColor}
      duration={rippleDuration}
      disabled={disabled}
      className="inline-block"
    >
      <button
        className={className}
        disabled={disabled}
        data-testid="ripple-button"
        {...props}
      >
        {children}
      </button>
    </RippleEffect>
  );
}
