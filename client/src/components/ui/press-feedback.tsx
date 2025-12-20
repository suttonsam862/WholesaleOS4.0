import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PressFeedbackProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  intensity?: "subtle" | "medium" | "strong";
}

const intensityMap = {
  subtle: { scale: 0.98, opacity: 1 },
  medium: { scale: 0.97, opacity: 0.95 },
  strong: { scale: 0.95, opacity: 0.9 },
};

export function PressFeedback({
  children,
  className,
  disabled = false,
  intensity = "medium",
  ...props
}: PressFeedbackProps) {
  const tapAnimation = intensityMap[intensity];

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("touch-manipulation", className)}
      whileTap={tapAnimation}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      }}
      data-testid="press-feedback-wrapper"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PressFeedbackButton({
  children,
  className,
  disabled = false,
  intensity = "medium",
  onClick,
  ...props
}: PressFeedbackProps & { onClick?: () => void }) {
  const tapAnimation = intensityMap[intensity];

  return (
    <motion.button
      className={cn("touch-manipulation", className)}
      whileTap={disabled ? undefined : tapAnimation}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      }}
      onClick={onClick}
      disabled={disabled}
      data-testid="press-feedback-button"
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
