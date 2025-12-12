/**
 * Pantone Color Matching Service
 * 
 * Provides RGB to Pantone color conversion and matching functionality
 * for manufacturing and design workflows.
 */

export interface PantoneColor {
  code: string;
  hex: string;
  name: string;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorMatchResult {
  pantone: PantoneColor;
  distance: number;
  matchQuality: "exact" | "good" | "approximate" | "poor";
  rgb: RGBColor;
  hex: string;
}

export interface PantoneSearchResult {
  matches: PantoneColor[];
  query: string;
}

const PANTONE_DATABASE: PantoneColor[] = [
  {"code": "100 C", "hex": "#F6EB61", "name": "Yellow"},
  {"code": "101 C", "hex": "#F7EA48", "name": "Bright Yellow"},
  {"code": "102 C", "hex": "#FCE300", "name": "Lemon Yellow"},
  {"code": "103 C", "hex": "#C5A900", "name": "Old Gold"},
  {"code": "104 C", "hex": "#AF9800", "name": "Golden Brown"},
  {"code": "105 C", "hex": "#897A27", "name": "Olive"},
  {"code": "109 C", "hex": "#FFD100", "name": "Golden Yellow"},
  {"code": "116 C", "hex": "#FFCD00", "name": "Mustard Yellow"},
  {"code": "123 C", "hex": "#FFC72C", "name": "Sunglow"},
  {"code": "130 C", "hex": "#F2A900", "name": "Tangerine Yellow"},
  {"code": "137 C", "hex": "#FFA300", "name": "Orange Peel"},
  {"code": "144 C", "hex": "#ED8B00", "name": "Pumpkin"},
  {"code": "151 C", "hex": "#FF8200", "name": "Orange"},
  {"code": "158 C", "hex": "#E57200", "name": "Tiger Orange"},
  {"code": "165 C", "hex": "#FF6720", "name": "Bright Orange"},
  {"code": "172 C", "hex": "#FA4616", "name": "Red Orange"},
  {"code": "179 C", "hex": "#E03C31", "name": "Vermillion Red"},
  {"code": "185 C", "hex": "#E4002B", "name": "Red"},
  {"code": "186 C", "hex": "#C8102E", "name": "True Red"},
  {"code": "192 C", "hex": "#E84E6C", "name": "Rose"},
  {"code": "199 C", "hex": "#D50032", "name": "Cardinal Red"},
  {"code": "206 C", "hex": "#D62598", "name": "Magenta"},
  {"code": "213 C", "hex": "#E21776", "name": "Pink"},
  {"code": "220 C", "hex": "#A50050", "name": "Burgundy"},
  {"code": "227 C", "hex": "#AD1457", "name": "Raspberry"},
  {"code": "234 C", "hex": "#AA0061", "name": "Deep Rose"},
  {"code": "241 C", "hex": "#AD1AAC", "name": "Purple"},
  {"code": "248 C", "hex": "#782F89", "name": "Violet"},
  {"code": "255 C", "hex": "#692F7F", "name": "Deep Purple"},
  {"code": "262 C", "hex": "#5C2D91", "name": "Royal Purple"},
  {"code": "269 C", "hex": "#6B2D5B", "name": "Plum"},
  {"code": "276 C", "hex": "#2E294E", "name": "Midnight"},
  {"code": "283 C", "hex": "#92C1E9", "name": "Sky Blue"},
  {"code": "290 C", "hex": "#C4D8E2", "name": "Powder Blue"},
  {"code": "297 C", "hex": "#00A3E0", "name": "Cyan"},
  {"code": "300 C", "hex": "#0050A0", "name": "Royal Blue"},
  {"code": "306 C", "hex": "#00B5E2", "name": "Turquoise"},
  {"code": "313 C", "hex": "#0093B2", "name": "Teal"},
  {"code": "320 C", "hex": "#009CA6", "name": "Peacock"},
  {"code": "327 C", "hex": "#008C82", "name": "Deep Teal"},
  {"code": "334 C", "hex": "#009775", "name": "Emerald"},
  {"code": "341 C", "hex": "#007A53", "name": "Green"},
  {"code": "348 C", "hex": "#00843D", "name": "Kelly Green"},
  {"code": "355 C", "hex": "#009639", "name": "Bright Green"},
  {"code": "362 C", "hex": "#4BA82E", "name": "Leaf Green"},
  {"code": "369 C", "hex": "#64A70B", "name": "Lime Green"},
  {"code": "376 C", "hex": "#84BD00", "name": "Yellow Green"},
  {"code": "383 C", "hex": "#A6A400", "name": "Olive Green"},
  {"code": "390 C", "hex": "#B5BD00", "name": "Chartreuse"},
  {"code": "397 C", "hex": "#C4C600", "name": "Lemon Lime"},
  {"code": "401 C", "hex": "#A49B8F", "name": "Warm Gray"},
  {"code": "408 C", "hex": "#857874", "name": "Medium Gray"},
  {"code": "415 C", "hex": "#6E7377", "name": "Cool Gray"},
  {"code": "420 C", "hex": "#C7C8C9", "name": "Silver"},
  {"code": "421 C", "hex": "#B1B3B6", "name": "Light Gray"},
  {"code": "422 C", "hex": "#9D9FA2", "name": "Gray"},
  {"code": "423 C", "hex": "#898C8E", "name": "Steel Gray"},
  {"code": "424 C", "hex": "#707372", "name": "Dark Gray"},
  {"code": "425 C", "hex": "#545454", "name": "Charcoal"},
  {"code": "426 C", "hex": "#25282A", "name": "Black"},
  {"code": "427 C", "hex": "#D0D3D4", "name": "Pearl Gray"},
  {"code": "428 C", "hex": "#C1C6C8", "name": "Platinum"},
  {"code": "429 C", "hex": "#A7AAAD", "name": "Pewter"},
  {"code": "430 C", "hex": "#858F93", "name": "Slate"},
  {"code": "431 C", "hex": "#5A6269", "name": "Graphite"},
  {"code": "432 C", "hex": "#333E48", "name": "Gunmetal"},
  {"code": "433 C", "hex": "#1E252B", "name": "Onyx"},
  {"code": "468 C", "hex": "#DDCBA4", "name": "Champagne"},
  {"code": "475 C", "hex": "#F1B091", "name": "Peach"},
  {"code": "482 C", "hex": "#C17E61", "name": "Terra Cotta"},
  {"code": "483 C", "hex": "#8A391B", "name": "Rust"},
  {"code": "4625 C", "hex": "#4F2C1D", "name": "Chocolate Brown"},
  {"code": "4695 C", "hex": "#3A2421", "name": "Coffee"},
  {"code": "470 C", "hex": "#99623B", "name": "Copper"},
  {"code": "471 C", "hex": "#6D4F47", "name": "Brown"},
  {"code": "476 C", "hex": "#503C3C", "name": "Dark Brown"},
  {"code": "478 C", "hex": "#3C2415", "name": "Espresso"},
  {"code": "485 C", "hex": "#DA291C", "name": "Scarlet"},
  {"code": "White", "hex": "#FFFFFF", "name": "White"},
  {"code": "Black C", "hex": "#2D2926", "name": "Process Black"},
];

export class PantoneService {
  private pantoneDatabase: PantoneColor[];

  constructor(customDatabase?: PantoneColor[]) {
    this.pantoneDatabase = customDatabase || PANTONE_DATABASE;
  }

  hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  rgbToHex(rgb: RGBColor): string {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }

  rgbToHsl(rgb: RGBColor): HSLColor {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  getColorDistance(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    return Math.sqrt(
      Math.pow(rgb2.r - rgb1.r, 2) +
      Math.pow(rgb2.g - rgb1.g, 2) +
      Math.pow(rgb2.b - rgb1.b, 2)
    );
  }

  getMatchQuality(distance: number): ColorMatchResult["matchQuality"] {
    if (distance < 10) return "exact";
    if (distance < 30) return "good";
    if (distance < 60) return "approximate";
    return "poor";
  }

  findClosestPantone(hex: string): ColorMatchResult {
    let closest = this.pantoneDatabase[0];
    let minDistance = Infinity;

    for (const pantone of this.pantoneDatabase) {
      const distance = this.getColorDistance(hex, pantone.hex);
      if (distance < minDistance) {
        minDistance = distance;
        closest = pantone;
      }
    }

    const rgb = this.hexToRgb(hex);

    return {
      pantone: closest,
      distance: minDistance,
      matchQuality: this.getMatchQuality(minDistance),
      rgb,
      hex: hex.toUpperCase(),
    };
  }

  rgbToPantone(rgb: RGBColor): ColorMatchResult {
    const hex = this.rgbToHex(rgb);
    return this.findClosestPantone(hex);
  }

  searchByCode(query: string): PantoneSearchResult {
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");
    
    const matches = this.pantoneDatabase.filter(p => 
      p.code.toLowerCase().includes(normalizedQuery) ||
      p.code.toLowerCase().replace(/\s+/g, "") === normalizedQuery.replace(/\s+/g, "")
    );

    return {
      matches,
      query: normalizedQuery,
    };
  }

  searchByName(query: string): PantoneSearchResult {
    const normalizedQuery = query.trim().toLowerCase();
    
    const matches = this.pantoneDatabase.filter(p =>
      p.name.toLowerCase().includes(normalizedQuery)
    );

    return {
      matches,
      query: normalizedQuery,
    };
  }

  getPantoneByCode(code: string): PantoneColor | null {
    const normalizedCode = code.trim().toLowerCase().replace(/\s+/g, "");
    return this.pantoneDatabase.find(
      p => p.code.toLowerCase().replace(/\s+/g, "") === normalizedCode
    ) || null;
  }

  findNearestColors(hex: string, count: number = 5): ColorMatchResult[] {
    const results: { pantone: PantoneColor; distance: number }[] = [];

    for (const pantone of this.pantoneDatabase) {
      const distance = this.getColorDistance(hex, pantone.hex);
      results.push({ pantone, distance });
    }

    results.sort((a, b) => a.distance - b.distance);

    const rgb = this.hexToRgb(hex);
    return results.slice(0, count).map(result => ({
      pantone: result.pantone,
      distance: result.distance,
      matchQuality: this.getMatchQuality(result.distance),
      rgb,
      hex: hex.toUpperCase(),
    }));
  }

  getColorsByFamily(family: string): PantoneColor[] {
    const familyLower = family.toLowerCase();
    return this.pantoneDatabase.filter(p => {
      const nameLower = p.name.toLowerCase();
      return nameLower.includes(familyLower) ||
        (familyLower === "red" && (nameLower.includes("red") || nameLower.includes("scarlet") || nameLower.includes("vermillion"))) ||
        (familyLower === "blue" && (nameLower.includes("blue") || nameLower.includes("cyan") || nameLower.includes("sky"))) ||
        (familyLower === "green" && (nameLower.includes("green") || nameLower.includes("emerald") || nameLower.includes("lime"))) ||
        (familyLower === "yellow" && (nameLower.includes("yellow") || nameLower.includes("gold") || nameLower.includes("lemon"))) ||
        (familyLower === "purple" && (nameLower.includes("purple") || nameLower.includes("violet") || nameLower.includes("plum"))) ||
        (familyLower === "orange" && (nameLower.includes("orange") || nameLower.includes("tangerine") || nameLower.includes("pumpkin"))) ||
        (familyLower === "gray" && (nameLower.includes("gray") || nameLower.includes("grey") || nameLower.includes("silver"))) ||
        (familyLower === "brown" && (nameLower.includes("brown") || nameLower.includes("coffee") || nameLower.includes("chocolate")));
    });
  }

  getAllColors(): PantoneColor[] {
    return [...this.pantoneDatabase];
  }

  getColorCount(): number {
    return this.pantoneDatabase.length;
  }

  validatePantoneCode(code: string): boolean {
    return this.getPantoneByCode(code) !== null;
  }

  getComplementaryColor(hex: string): ColorMatchResult {
    const rgb = this.hexToRgb(hex);
    const complementRgb: RGBColor = {
      r: 255 - rgb.r,
      g: 255 - rgb.g,
      b: 255 - rgb.b,
    };
    return this.rgbToPantone(complementRgb);
  }

  analyzeImageColors(pixelData: Uint8ClampedArray, width: number, height: number): ColorMatchResult[] {
    const colorCounts: Map<string, { rgb: RGBColor; count: number }> = new Map();
    const sampleStep = Math.max(1, Math.floor((width * height) / 10000));

    for (let i = 0; i < pixelData.length; i += 4 * sampleStep) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3];

      if (a < 128) continue;

      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;
      const key = `${quantizedR},${quantizedG},${quantizedB}`;

      const existing = colorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(key, { rgb: { r: quantizedR, g: quantizedG, b: quantizedB }, count: 1 });
      }
    }

    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    return sortedColors.map(([_, { rgb }]) => this.rgbToPantone(rgb));
  }
}

export const pantoneService = new PantoneService();
