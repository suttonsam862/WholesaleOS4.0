import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AutoSizeTextProps {
  children: string;
  minFontSize?: number;
  maxFontSize?: number;
  step?: number;
  className?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function AutoSizeText({
  children,
  minFontSize = 12,
  maxFontSize = 48,
  step = 1,
  className,
  as: Component = "span",
}: AutoSizeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isCalculating, setIsCalculating] = useState(true);

  const calculateFontSize = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    
    if (!container || !text) return;

    setIsCalculating(true);
    let currentSize = maxFontSize;
    text.style.fontSize = `${currentSize}px`;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    while (currentSize > minFontSize) {
      text.style.fontSize = `${currentSize}px`;
      
      const textWidth = text.scrollWidth;
      const textHeight = text.scrollHeight;

      if (textWidth <= containerWidth && textHeight <= containerHeight) {
        break;
      }

      currentSize -= step;
    }

    setFontSize(Math.max(currentSize, minFontSize));
    setIsCalculating(false);
  }, [children, minFontSize, maxFontSize, step]);

  useEffect(() => {
    calculateFontSize();
  }, [calculateFontSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateFontSize();
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [calculateFontSize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      data-testid="auto-size-text-container"
    >
      <Component
        ref={textRef as any}
        className={cn(
          "inline-block whitespace-nowrap transition-[font-size] duration-150 ease-out",
          isCalculating && "opacity-0"
        )}
        style={{ fontSize: `${fontSize}px` }}
        data-testid="auto-size-text-content"
      >
        {children}
      </Component>
    </div>
  );
}

interface AutoSizeMultilineTextProps {
  children: string;
  minFontSize?: number;
  maxFontSize?: number;
  step?: number;
  maxLines?: number;
  className?: string;
}

export function AutoSizeMultilineText({
  children,
  minFontSize = 12,
  maxFontSize = 24,
  step = 1,
  maxLines = 3,
  className,
}: AutoSizeMultilineTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isCalculating, setIsCalculating] = useState(true);

  const calculateFontSize = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    
    if (!container || !text) return;

    setIsCalculating(true);
    let currentSize = maxFontSize;

    const containerHeight = container.clientHeight;

    while (currentSize > minFontSize) {
      text.style.fontSize = `${currentSize}px`;
      const lineHeight = currentSize * 1.5;
      text.style.lineHeight = `${lineHeight}px`;
      
      const maxHeight = lineHeight * maxLines;
      const textHeight = text.scrollHeight;

      if (textHeight <= Math.min(containerHeight, maxHeight)) {
        break;
      }

      currentSize -= step;
    }

    setFontSize(Math.max(currentSize, minFontSize));
    setIsCalculating(false);
  }, [children, minFontSize, maxFontSize, step, maxLines]);

  useEffect(() => {
    calculateFontSize();
  }, [calculateFontSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateFontSize();
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [calculateFontSize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      data-testid="auto-size-multiline-container"
    >
      <p
        ref={textRef}
        className={cn(
          "transition-[font-size] duration-150 ease-out",
          isCalculating && "opacity-0"
        )}
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.5}px`,
        }}
        data-testid="auto-size-multiline-content"
      >
        {children}
      </p>
    </div>
  );
}

export default AutoSizeText;
