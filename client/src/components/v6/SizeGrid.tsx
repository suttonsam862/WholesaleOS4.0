/**
 * V6 Size Grid Component
 * Size quantity entry interface with support for youth and adult sizes
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Standard size definitions
export const YOUTH_SIZES = ["YXS", "YS", "YM", "YL"] as const;
export const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;
export const ALL_STANDARD_SIZES = [...YOUTH_SIZES, ...ADULT_SIZES] as const;

export type StandardSize = (typeof ALL_STANDARD_SIZES)[number];

export interface SizeQuantities {
  [size: string]: number;
}

export interface CustomSize {
  label: string;
  quantity: number;
}

interface SizeGridProps {
  value: SizeQuantities;
  onChange: (value: SizeQuantities) => void;
  customSizes?: CustomSize[];
  onCustomSizesChange?: (sizes: CustomSize[]) => void;
  availableSizes?: string[];
  disabled?: boolean;
  showYouthSizes?: boolean;
  showAdultSizes?: boolean;
  compact?: boolean;
  className?: string;
}

export function SizeGrid({
  value,
  onChange,
  customSizes = [],
  onCustomSizesChange,
  availableSizes,
  disabled = false,
  showYouthSizes = true,
  showAdultSizes = true,
  compact = false,
  className,
}: SizeGridProps) {
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [newCustomQuantity, setNewCustomQuantity] = useState<number>(0);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Filter sizes based on available sizes
  const youthSizes = showYouthSizes
    ? availableSizes
      ? YOUTH_SIZES.filter((s) => availableSizes.includes(s))
      : YOUTH_SIZES
    : [];

  const adultSizes = showAdultSizes
    ? availableSizes
      ? ADULT_SIZES.filter((s) => availableSizes.includes(s))
      : ADULT_SIZES
    : [];

  const handleQuantityChange = useCallback(
    (size: string, newValue: string) => {
      const numValue = parseInt(newValue, 10);
      const quantity = isNaN(numValue) || numValue < 0 ? 0 : numValue;

      onChange({
        ...value,
        [size]: quantity,
      });
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, size: string, sizes: readonly string[]) => {
      const currentIndex = sizes.indexOf(size);

      if (e.key === "Tab" && !e.shiftKey) {
        // Move to next size
        if (currentIndex < sizes.length - 1) {
          e.preventDefault();
          const nextSize = sizes[currentIndex + 1];
          inputRefs.current[nextSize]?.focus();
          inputRefs.current[nextSize]?.select();
        }
      } else if (e.key === "Tab" && e.shiftKey) {
        // Move to previous size
        if (currentIndex > 0) {
          e.preventDefault();
          const prevSize = sizes[currentIndex - 1];
          inputRefs.current[prevSize]?.focus();
          inputRefs.current[prevSize]?.select();
        }
      } else if (e.key === "Enter") {
        // Move to next row (if applicable)
        e.preventDefault();
        const nextSize = sizes[currentIndex + 1];
        if (nextSize) {
          inputRefs.current[nextSize]?.focus();
          inputRefs.current[nextSize]?.select();
        }
      }
    },
    []
  );

  const handleAddCustomSize = () => {
    if (!newCustomLabel.trim()) return;

    const newCustomSizes = [
      ...customSizes,
      { label: newCustomLabel.trim(), quantity: newCustomQuantity || 0 },
    ];
    onCustomSizesChange?.(newCustomSizes);
    setNewCustomLabel("");
    setNewCustomQuantity(0);
    setIsAddCustomOpen(false);
  };

  const handleRemoveCustomSize = (index: number) => {
    const newCustomSizes = customSizes.filter((_, i) => i !== index);
    onCustomSizesChange?.(newCustomSizes);
  };

  const handleCustomQuantityChange = (index: number, newValue: string) => {
    const numValue = parseInt(newValue, 10);
    const quantity = isNaN(numValue) || numValue < 0 ? 0 : numValue;

    const newCustomSizes = customSizes.map((size, i) =>
      i === index ? { ...size, quantity } : size
    );
    onCustomSizesChange?.(newCustomSizes);
  };

  // Calculate totals
  const standardTotal = Object.values(value).reduce((sum, qty) => sum + (qty || 0), 0);
  const customTotal = customSizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
  const totalQuantity = standardTotal + customTotal;

  const allSizes = [...youthSizes, ...adultSizes];

  const cellClasses = compact
    ? "w-12 h-8 text-xs"
    : "w-16 h-10 text-sm";

  const headerClasses = compact
    ? "text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
    : "text-xs font-medium text-muted-foreground uppercase tracking-wider";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Youth Sizes */}
      {youthSizes.length > 0 && (
        <div className="space-y-2">
          <h4 className={headerClasses}>Youth Sizes</h4>
          <div className="flex flex-wrap gap-2">
            {youthSizes.map((size) => (
              <SizeCell
                key={size}
                size={size}
                value={value[size] || 0}
                onChange={(val) => handleQuantityChange(size, val)}
                onKeyDown={(e) => handleKeyDown(e, size, allSizes)}
                disabled={disabled}
                inputRef={(el) => (inputRefs.current[size] = el)}
                className={cellClasses}
              />
            ))}
          </div>
        </div>
      )}

      {/* Adult Sizes */}
      {adultSizes.length > 0 && (
        <div className="space-y-2">
          <h4 className={headerClasses}>Adult Sizes</h4>
          <div className="flex flex-wrap gap-2">
            {adultSizes.map((size) => (
              <SizeCell
                key={size}
                size={size}
                value={value[size] || 0}
                onChange={(val) => handleQuantityChange(size, val)}
                onKeyDown={(e) => handleKeyDown(e, size, allSizes)}
                disabled={disabled}
                inputRef={(el) => (inputRefs.current[size] = el)}
                className={cellClasses}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Sizes */}
      {(customSizes.length > 0 || onCustomSizesChange) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className={headerClasses}>Custom Sizes</h4>
            {onCustomSizesChange && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddCustomOpen(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Custom Size
              </Button>
            )}
          </div>
          {customSizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customSizes.map((size, index) => (
                <div
                  key={`custom-${index}`}
                  className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1"
                >
                  <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                    {size.label}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={size.quantity || ""}
                    onChange={(e) => handleCustomQuantityChange(index, e.target.value)}
                    disabled={disabled}
                    className={cn(
                      "text-center border-muted-foreground/20 bg-background/50",
                      compact ? "w-12 h-7 text-xs" : "w-14 h-8 text-sm"
                    )}
                  />
                  {onCustomSizesChange && !disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSize(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div
        className={cn(
          "flex items-center justify-between pt-3 border-t border-border/50",
          compact ? "text-sm" : "text-base"
        )}
      >
        <span className="font-medium text-muted-foreground">Total Quantity</span>
        <span className="font-bold text-foreground">{totalQuantity} units</span>
      </div>

      {/* Add Custom Size Dialog */}
      <Dialog open={isAddCustomOpen} onOpenChange={setIsAddCustomOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Add Custom Size</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-size-label">Size Label</Label>
              <Input
                id="custom-size-label"
                placeholder="e.g., 5XL, Goalie Cut"
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-size-qty">Quantity</Label>
              <Input
                id="custom-size-qty"
                type="number"
                min={0}
                value={newCustomQuantity || ""}
                onChange={(e) =>
                  setNewCustomQuantity(parseInt(e.target.value, 10) || 0)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCustomOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomSize}
              disabled={!newCustomLabel.trim()}
            >
              Add Size
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Individual size cell component
interface SizeCellProps {
  size: string;
  value: number;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  className?: string;
}

function SizeCell({
  size,
  value,
  onChange,
  onKeyDown,
  disabled,
  inputRef,
  className,
}: SizeCellProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase">
        {size}
      </span>
      <Input
        ref={inputRef}
        type="number"
        min={0}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className={cn(
          "text-center border-muted-foreground/20 bg-background/50 focus:ring-primary/50",
          className
        )}
      />
    </div>
  );
}

// Compact read-only display of sizes
interface SizeDisplayProps {
  sizes: SizeQuantities;
  customSizes?: CustomSize[];
  maxDisplay?: number;
  className?: string;
}

export function SizeDisplay({
  sizes,
  customSizes = [],
  maxDisplay = 6,
  className,
}: SizeDisplayProps) {
  const entries = Object.entries(sizes)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => {
      const aIndex = ALL_STANDARD_SIZES.indexOf(a[0] as StandardSize);
      const bIndex = ALL_STANDARD_SIZES.indexOf(b[0] as StandardSize);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  const customEntries = customSizes.filter((s) => s.quantity > 0);
  const allEntries = [...entries, ...customEntries.map((s) => [s.label, s.quantity] as const)];

  const total = allEntries.reduce((sum, [_, qty]) => sum + (qty || 0), 0);

  if (total === 0) {
    return <span className={cn("text-muted-foreground text-sm", className)}>No sizes</span>;
  }

  const displayEntries = allEntries.slice(0, maxDisplay);
  const hasMore = allEntries.length > maxDisplay;

  return (
    <span className={cn("text-sm", className)}>
      <span className="font-medium">{total} units</span>
      <span className="text-muted-foreground">
        {" "}
        (
        {displayEntries.map(([size, qty], i) => (
          <span key={size}>
            {size}: {qty}
            {i < displayEntries.length - 1 && ", "}
          </span>
        ))}
        {hasMore && `, +${allEntries.length - maxDisplay} more`})
      </span>
    </span>
  );
}

// Expanded read-only table view
interface SizeTableProps {
  sizes: SizeQuantities;
  customSizes?: CustomSize[];
  className?: string;
}

export function SizeTable({ sizes, customSizes = [], className }: SizeTableProps) {
  const youthEntries = YOUTH_SIZES.filter((s) => sizes[s] !== undefined);
  const adultEntries = ADULT_SIZES.filter((s) => sizes[s] !== undefined);

  const total =
    Object.values(sizes).reduce((sum, qty) => sum + (qty || 0), 0) +
    customSizes.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className={cn("space-y-3", className)}>
      {youthEntries.length > 0 && (
        <div className="grid grid-cols-4 gap-1">
          {youthEntries.map((size) => (
            <div key={size} className="text-center py-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                {size}
              </div>
              <div className="text-sm font-medium">{sizes[size] || "-"}</div>
            </div>
          ))}
        </div>
      )}

      {adultEntries.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {adultEntries.map((size) => (
            <div key={size} className="text-center py-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                {size}
              </div>
              <div className="text-sm font-medium">{sizes[size] || "-"}</div>
            </div>
          ))}
        </div>
      )}

      {customSizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSizes.map((size, i) => (
            <div key={i} className="text-center py-1 px-2 bg-muted/50 rounded">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                {size.label}
              </div>
              <div className="text-sm font-medium">{size.quantity || "-"}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <span className="text-sm font-medium text-muted-foreground">Total</span>
        <span className="text-base font-bold">{total}</span>
      </div>
    </div>
  );
}
