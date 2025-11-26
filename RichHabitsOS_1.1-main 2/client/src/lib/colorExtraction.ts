/**
 * Color extraction utility for extracting dominant colors from organization logos
 * Uses Canvas API and color quantization to find the 3 most prominent colors
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorBox {
  pixels: RGB[];
  volume: number;
}

// Cache for logo colors to avoid re-processing
const colorCache = new Map<string, string[]>();
// Cache for failed URLs to avoid repeated attempts
const failedUrlCache = new Set<string>();

// LocalStorage key prefix for persistent color caching
const STORAGE_PREFIX = 'extracted-colors-';

/**
 * Get colors from localStorage cache
 */
function getFromStorage(key: string): string[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array of color strings
      if (Array.isArray(parsed) && parsed.every(c => typeof c === 'string' && c.startsWith('#'))) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Save colors to localStorage cache
 */
function saveToStorage(key: string, colors: string[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(colors));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Generate a cache key from URL (use last part of path for shorter keys)
 */
function getCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use pathname and last segment for shorter, unique keys
    const path = urlObj.pathname;
    const segments = path.split('/').filter(Boolean);
    return segments.slice(-2).join('-') || path;
  } catch {
    // Fallback to simple hash if URL parsing fails
    return url.slice(-50);
  }
}

/**
 * Extract the 3 most dominant colors from an image URL
 * @param imageUrl - URL of the image to analyze
 * @returns Array of 3 hex color strings, or fallback colors if extraction fails
 */
export async function extractDominantColors(imageUrl: string | null): Promise<string[]> {
  // Default fallback gradient colors
  const fallbackColors = ['#6366f1', '#8b5cf6', '#d946ef']; // Indigo to purple gradient
  
  if (!imageUrl) {
    return fallbackColors;
  }

  // Check memory cache first
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  // Check localStorage cache
  const cacheKey = getCacheKey(imageUrl);
  const storedColors = getFromStorage(cacheKey);
  if (storedColors) {
    colorCache.set(imageUrl, storedColors);
    return storedColors;
  }

  // If this URL previously failed, return fallback immediately to avoid console spam
  if (failedUrlCache.has(imageUrl)) {
    return fallbackColors;
  }

  try {
    // Load image
    const img = await loadImage(imageUrl);
    
    // Create canvas and get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn('Could not get canvas context');
      return fallbackColors;
    }

    // Scale down for performance (max 100x100)
    const scale = Math.min(100 / img.width, 100 / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = extractPixels(imageData.data);
    
    // Apply color quantization to find 3 dominant colors
    const dominantColors = quantizeColors(pixels, 3);
    
    // Convert to hex
    const hexColors = dominantColors.map(rgb => rgbToHex(rgb));
    
    // Cache the result in memory and localStorage
    colorCache.set(imageUrl, hexColors);
    saveToStorage(cacheKey, hexColors);
    
    return hexColors;
  } catch (error) {
    // Mark this URL as failed to avoid repeated console errors
    failedUrlCache.add(imageUrl);
    // Only log the first time a URL fails to reduce console spam
    if (process.env.NODE_ENV === 'development') {
      console.debug('Failed to extract colors from image (URL may not exist):', imageUrl);
    }
    return fallbackColors;
  }
}

/**
 * Load an image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Extract RGB pixel data from ImageData, filtering out transparent pixels
 */
function extractPixels(data: Uint8ClampedArray): RGB[] {
  const pixels: RGB[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    
    // Skip fully transparent pixels
    if (a < 128) continue;
    
    // Skip very light colors (likely background)
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > 240) continue;
    
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }
  
  return pixels;
}

/**
 * Simple color quantization using median cut algorithm
 * Returns the specified number of dominant colors
 */
function quantizeColors(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length === 0) {
    return [{ r: 99, g: 102, b: 241 }]; // Default indigo
  }

  // Start with one box containing all pixels
  const boxes: ColorBox[] = [{ pixels, volume: calculateVolume(pixels) }];
  
  // Split boxes until we have numColors boxes
  while (boxes.length < numColors) {
    // Find the box with largest volume
    boxes.sort((a, b) => b.volume - a.volume);
    const boxToSplit = boxes.shift();
    
    if (!boxToSplit || boxToSplit.pixels.length < 2) {
      break; // Can't split further
    }
    
    const [box1, box2] = splitBox(boxToSplit);
    boxes.push(box1, box2);
  }
  
  // Get average color from each box
  return boxes.map(box => getAverageColor(box.pixels));
}

/**
 * Calculate color volume (range) of a set of pixels
 */
function calculateVolume(pixels: RGB[]): number {
  if (pixels.length === 0) return 0;
  
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;
  
  for (const pixel of pixels) {
    minR = Math.min(minR, pixel.r);
    maxR = Math.max(maxR, pixel.r);
    minG = Math.min(minG, pixel.g);
    maxG = Math.max(maxG, pixel.g);
    minB = Math.min(minB, pixel.b);
    maxB = Math.max(maxB, pixel.b);
  }
  
  return (maxR - minR) + (maxG - minG) + (maxB - minB);
}

/**
 * Split a color box into two boxes using median cut
 */
function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const { pixels } = box;
  
  // Find the channel with largest range
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;
  
  for (const pixel of pixels) {
    minR = Math.min(minR, pixel.r);
    maxR = Math.max(maxR, pixel.r);
    minG = Math.min(minG, pixel.g);
    maxG = Math.max(maxG, pixel.g);
    minB = Math.min(minB, pixel.b);
    maxB = Math.max(maxB, pixel.b);
  }
  
  const rRange = maxR - minR;
  const gRange = maxG - minG;
  const bRange = maxB - minB;
  
  // Sort by the channel with largest range
  let sortKey: 'r' | 'g' | 'b';
  if (rRange >= gRange && rRange >= bRange) {
    sortKey = 'r';
  } else if (gRange >= bRange) {
    sortKey = 'g';
  } else {
    sortKey = 'b';
  }
  
  pixels.sort((a, b) => a[sortKey] - b[sortKey]);
  
  // Split at median
  const median = Math.floor(pixels.length / 2);
  const pixels1 = pixels.slice(0, median);
  const pixels2 = pixels.slice(median);
  
  return [
    { pixels: pixels1, volume: calculateVolume(pixels1) },
    { pixels: pixels2, volume: calculateVolume(pixels2) },
  ];
}

/**
 * Get average color of a set of pixels
 */
function getAverageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) {
    return { r: 99, g: 102, b: 241 }; // Default indigo
  }
  
  let totalR = 0, totalG = 0, totalB = 0;
  
  for (const pixel of pixels) {
    totalR += pixel.r;
    totalG += pixel.g;
    totalB += pixel.b;
  }
  
  return {
    r: Math.round(totalR / pixels.length),
    g: Math.round(totalG / pixels.length),
    b: Math.round(totalB / pixels.length),
  };
}

/**
 * Convert RGB to hex color string
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Clear the color cache (useful for testing or memory management)
 */
export function clearColorCache(): void {
  colorCache.clear();
  failedUrlCache.clear();
}

/**
 * Clear all stored colors from localStorage
 */
export function clearStoredColors(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Preload colors for multiple images (useful for batch loading)
 */
export async function preloadColors(imageUrls: (string | null | undefined)[]): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  const validUrls = imageUrls.filter((url): url is string => !!url);
  
  await Promise.all(
    validUrls.map(async (url) => {
      const colors = await extractDominantColors(url);
      results.set(url, colors);
    })
  );
  
  return results;
}
