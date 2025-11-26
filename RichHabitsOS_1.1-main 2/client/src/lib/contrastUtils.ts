/**
 * Contrast calculation utilities for ensuring readable text on colored backgrounds
 * Implements WCAG 2.0 contrast ratio calculations
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color (WCAG 2.0 formula)
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Relative luminance (0-1)
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // WCAG formula
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.0)
 * @param l1 - Luminance of first color
 * @param l2 - Luminance of second color
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get readable text color (black or white) for a given background color
 * @param backgroundColor - Hex color string
 * @returns 'text-white' or 'text-black' Tailwind class
 */
export function getReadableTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'text-black';

  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

  // White text luminance
  const whiteLuminance = 1;
  const whiteContrast = calculateContrastRatio(luminance, whiteLuminance);

  // Black text luminance
  const blackLuminance = 0;
  const blackContrast = calculateContrastRatio(luminance, blackLuminance);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  // Choose the color with better contrast
  return whiteContrast > blackContrast ? 'text-white' : 'text-black';
}

/**
 * Get the average luminance from a set of colors
 * Useful for determining text color on gradient backgrounds
 */
export function getAverageLuminance(colors: string[]): number {
  const luminances = colors
    .map((color) => {
      const rgb = hexToRgb(color);
      return rgb ? calculateLuminance(rgb.r, rgb.g, rgb.b) : 0.5;
    })
    .filter((l) => l !== null);

  if (luminances.length === 0) return 0.5;

  return luminances.reduce((sum, l) => sum + l, 0) / luminances.length;
}

/**
 * Get readable text color for a gradient background
 * @param gradientColors - Array of hex color strings in the gradient
 * @returns 'text-white' or 'text-black' Tailwind class
 */
export function getReadableTextColorForGradient(gradientColors: string[]): string {
  const avgLuminance = getAverageLuminance(gradientColors);

  const whiteLuminance = 1;
  const whiteContrast = calculateContrastRatio(avgLuminance, whiteLuminance);

  const blackLuminance = 0;
  const blackContrast = calculateContrastRatio(avgLuminance, blackLuminance);

  return whiteContrast > blackContrast ? 'text-white' : 'text-black';
}

/**
 * Create a linear gradient CSS string from an array of colors
 * @param colors - Array of hex color strings
 * @param direction - Gradient direction (default: 'to right')
 * @returns CSS linear-gradient string
 */
export function createGradient(colors: string[], direction: string = 'to right'): string {
  if (colors.length === 0) {
    return 'linear-gradient(to right, #6366f1, #8b5cf6, #d946ef)';
  }

  if (colors.length === 1) {
    return colors[0];
  }

  const stops = colors.map((color, index) => {
    const position = (index / (colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(', ');

  return `linear-gradient(${direction}, ${stops})`;
}
