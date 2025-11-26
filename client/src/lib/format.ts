/**
 * Number formatting utilities
 */

/**
 * Format a number with commas for thousands separators
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('en-US');
}

/**
 * Format a percentage value, rounding to specified decimals
 * @param value - The percentage value (e.g., 14.000000002)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "14%")
 */
export function formatPercentage(value: number | undefined | null, decimals: number = 0): string {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency values
 * @param value - The amount to format
 * @param showCents - Whether to show cents (default: false)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined | null, showCents: boolean = false): string {
  if (value === undefined || value === null) return '$0';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}

/**
 * Format currency in K (thousands) format
 * @param value - The amount to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "$12.5K"
 */
export function formatCurrencyK(value: number | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null) return '$0K';
  const kValue = value / 1000;
  return `$${kValue.toFixed(decimals)}K`;
}
