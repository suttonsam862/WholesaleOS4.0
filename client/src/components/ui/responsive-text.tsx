import { forwardRef, ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type TextElement = "p" | "span";
type AllTextElements = HeadingLevel | TextElement;
type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

const headingSizeMap: Record<HeadingLevel, TextSize> = {
  h1: "3xl",
  h2: "2xl",
  h3: "xl",
  h4: "lg",
  h5: "md",
  h6: "sm",
};

const sizeClasses: Record<TextSize, string> = {
  xs: "text-fluid-xs",
  sm: "text-fluid-sm",
  md: "text-fluid-base",
  lg: "text-fluid-lg",
  xl: "text-fluid-xl",
  "2xl": "text-fluid-2xl",
  "3xl": "text-fluid-3xl",
};

const headingLineHeights: Record<TextSize, string> = {
  xs: "leading-tight",
  sm: "leading-tight",
  md: "leading-snug",
  lg: "leading-snug",
  xl: "leading-tight",
  "2xl": "leading-tight",
  "3xl": "leading-none",
};

const bodyLineHeights: Record<TextSize, string> = {
  xs: "leading-relaxed",
  sm: "leading-relaxed",
  md: "leading-relaxed",
  lg: "leading-relaxed",
  xl: "leading-normal",
  "2xl": "leading-normal",
  "3xl": "leading-normal",
};

interface ResponsiveHeadingProps extends Omit<ComponentPropsWithoutRef<"h1">, "as"> {
  as?: HeadingLevel;
  size?: TextSize;
}

export const ResponsiveHeading = forwardRef<HTMLHeadingElement, ResponsiveHeadingProps>(
  ({ as = "h2", size, className, children, ...props }, ref) => {
    const Component = as as ElementType;
    const effectiveSize = size || headingSizeMap[as];

    return (
      <Component
        ref={ref}
        className={cn(
          sizeClasses[effectiveSize],
          headingLineHeights[effectiveSize],
          "font-semibold tracking-tight",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ResponsiveHeading.displayName = "ResponsiveHeading";

interface ResponsiveTextProps extends Omit<ComponentPropsWithoutRef<"p">, "as"> {
  as?: TextElement;
  size?: TextSize;
}

export const ResponsiveText = forwardRef<HTMLParagraphElement, ResponsiveTextProps>(
  ({ as = "p", size = "md", className, children, ...props }, ref) => {
    const Component = as as ElementType;

    return (
      <Component
        ref={ref}
        className={cn(
          sizeClasses[size],
          bodyLineHeights[size],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ResponsiveText.displayName = "ResponsiveText";

interface FluidTextProps extends Omit<ComponentPropsWithoutRef<"span">, "as"> {
  as?: AllTextElements;
  size?: TextSize;
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const weightClasses: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const FluidText = forwardRef<HTMLElement, FluidTextProps>(
  ({ as = "span", size = "md", weight = "normal", className, children, ...props }, ref) => {
    const Component = as as ElementType;
    const isHeading = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(as);
    const lineHeight = isHeading ? headingLineHeights[size] : bodyLineHeights[size];

    return (
      <Component
        ref={ref}
        className={cn(
          sizeClasses[size],
          lineHeight,
          weightClasses[weight],
          isHeading && "tracking-tight",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

FluidText.displayName = "FluidText";

export default { ResponsiveHeading, ResponsiveText, FluidText };
