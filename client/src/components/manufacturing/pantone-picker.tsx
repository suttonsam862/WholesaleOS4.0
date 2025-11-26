import { useState, useRef } from "react";
import { GlassCard, GlassButton, GlassInput } from "@/components/ui/glass";
import { Upload, Pipette, Search, Check, RefreshCw, ChevronDown, Image as ImageIcon, Layers } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import PANTONE_COLORS from "@/data/pantone-colors.json";

interface PantoneColor {
  code: string;
  hex: string;
  name: string;
}

interface PantonePickerProps {
  onSelect: (pantone: PantoneColor) => void;
  initialImage?: string;
  lineItemImages?: string[]; // Array of images from line items
  onAttachToCard?: (pantone: PantoneColor) => void; // Callback for attaching to manufacturing card
}

// Distance bucket thresholds
const DISTANCE_BUCKETS = [
  { label: "Exact Match", max: 16, color: "text-neon-green", bgColor: "bg-neon-green/10" },
  { label: "Very Close", max: 32, color: "text-neon-blue", bgColor: "bg-neon-blue/10" },
  { label: "Close", max: 48, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  { label: "Similar", max: 80, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  { label: "Approximate", max: Infinity, color: "text-muted-foreground", bgColor: "bg-white/5" },
];

export function PantonePicker({ onSelect, initialImage, lineItemImages = [], onAttachToCard }: PantonePickerProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isDropperActive, setIsDropperActive] = useState(false);
  const [matchedPantones, setMatchedPantones] = useState<(PantoneColor & { distance: number })[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Helper to calculate color distance (Euclidean distance in RGB)
  const getColorDistance = (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);

    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);

    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  };

  // Get bucket for a distance
  const getBucket = (distance: number) => {
    return DISTANCE_BUCKETS.find(bucket => distance <= bucket.max) || DISTANCE_BUCKETS[DISTANCE_BUCKETS.length - 1];
  };

  // Group matches by distance bucket
  const groupedMatches = matchedPantones.reduce((acc, match) => {
    const bucket = getBucket(match.distance);
    const bucketIndex = DISTANCE_BUCKETS.indexOf(bucket);
    if (!acc[bucketIndex]) acc[bucketIndex] = [];
    acc[bucketIndex].push(match);
    return acc;
  }, {} as Record<number, (PantoneColor & { distance: number })[]>);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setPickedColor(null);
        setMatchedPantones([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLineItemImageSelect = (imageUrl: string) => {
    setImageSrc(imageUrl);
    setPickedColor(null);
    setMatchedPantones([]);
    setShowImageSelector(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDropperActive || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw image to canvas to get pixel data
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.drawImage(imageRef.current, 0, 0);

    // Map display coordinates to natural coordinates
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    const pixelData = ctx.getImageData(Math.round(x * scaleX), Math.round(y * scaleY), 1, 1).data;
    const hex = "#" + [pixelData[0], pixelData[1], pixelData[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

    setPickedColor(hex);
    setIsDropperActive(false);
    findMatches(hex);
  };

  const findMatches = (hex: string) => {
    // Calculate distance for all pantones and sort
    const withDistances = (PANTONE_COLORS as PantoneColor[]).map(pantone => ({
      ...pantone,
      distance: getColorDistance(hex, pantone.hex)
    }));
    
    const sorted = withDistances.sort((a, b) => a.distance - b.distance);
    setMatchedPantones(sorted.slice(0, 24)); // Top 24 matches
    setSelectedBucket(null);
  };

  // Filter by search query
  const filteredBySearch = searchQuery 
    ? matchedPantones.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : matchedPantones;

  // Filter by selected bucket
  const displayedMatches = selectedBucket !== null
    ? filteredBySearch.filter(p => getBucket(p.distance) === DISTANCE_BUCKETS[selectedBucket])
    : filteredBySearch;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image Area */}
        <div className="space-y-4">
          {/* Image Source Selector */}
          {lineItemImages.length > 0 && (
            <div className="relative">
              <GlassButton
                variant="secondary"
                className="w-full justify-between"
                onClick={() => setShowImageSelector(!showImageSelector)}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Select from Line Item Images
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showImageSelector && "rotate-180")} />
              </GlassButton>
              
              <AnimatePresence>
                {showImageSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 z-10 p-3 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-xl"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {lineItemImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => handleLineItemImageSelect(img)}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                            imageSrc === img ? "border-neon-blue" : "border-transparent hover:border-white/20"
                          )}
                        >
                          <ImageWithFallback src={img} alt={`Line item ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/10 min-h-[300px] flex items-center justify-center group">
            {imageSrc ? (
              <>
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Reference"
                  className={cn(
                    "max-w-full max-h-[400px] object-contain transition-all",
                    isDropperActive && "cursor-crosshair ring-2 ring-neon-blue ring-offset-2 ring-offset-black"
                  )}
                  onClick={handleImageClick}
                  crossOrigin="anonymous"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <GlassButton
                    size="sm"
                    variant={isDropperActive ? "primary" : "secondary"}
                    onClick={() => setIsDropperActive(!isDropperActive)}
                    className="backdrop-blur-md"
                  >
                    <Pipette className="w-4 h-4 mr-2" />
                    {isDropperActive ? "Click to Pick" : "Dropper"}
                  </GlassButton>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setImageSrc(null);
                      setPickedColor(null);
                      setMatchedPantones([]);
                    }}
                    className="backdrop-blur-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </GlassButton>
                </div>

                {/* Dropper active indicator */}
                {isDropperActive && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-sm font-medium animate-pulse">
                    Click anywhere on the image to pick a color
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Upload an image to pick a color</p>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <span className="px-4 py-2 rounded-xl bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue/20 transition-colors inline-flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Select Image
                  </span>
                </label>
              </div>
            )}
          </div>

          {pickedColor && (
            <GlassCard variant="neon" className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: pickedColor }}
                />
                <div>
                  <p className="text-sm text-muted-foreground">Selected Color</p>
                  <p className="text-2xl font-mono font-bold text-white">{pickedColor}</p>
                </div>
              </div>
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(pickedColor);
                }}
              >
                Copy
              </GlassButton>
            </GlassCard>
          )}
        </div>

        {/* Right: Pantone Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-neon-blue" />
              Pantone Matches
            </h3>
            {matchedPantones.length > 0 && (
              <span className="text-sm text-muted-foreground">{matchedPantones.length} matches</span>
            )}
          </div>

          {matchedPantones.length > 0 && (
            <>
              {/* Search and Filter */}
              <div className="space-y-3">
                <GlassInput
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Distance Bucket Filters */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBucket(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedBucket === null
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    All
                  </button>
                  {DISTANCE_BUCKETS.slice(0, 4).map((bucket, i) => {
                    const count = groupedMatches[i]?.length || 0;
                    if (count === 0) return null;
                    return (
                      <button
                        key={bucket.label}
                        onClick={() => setSelectedBucket(i)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                          selectedBucket === i
                            ? `${bucket.bgColor} border-current ${bucket.color}`
                            : "bg-transparent border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", bucket.bgColor.replace("/10", ""))} />
                        {bucket.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {displayedMatches.map((pantone, index) => {
                  const bucket = getBucket(pantone.distance);
                  return (
                    <motion.div
                      key={pantone.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group"
                    >
                      <GlassCard 
                        className="p-0 overflow-hidden hover:border-neon-blue/50 transition-all cursor-pointer h-full"
                        onClick={() => onSelect(pantone)}
                      >
                        <div
                          className="h-16 w-full transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundColor: pantone.hex }}
                        />
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-white text-sm truncate">{pantone.code}</h4>
                              <p className="text-xs text-muted-foreground truncate">{pantone.name}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap",
                              bucket.bgColor,
                              bucket.color
                            )}>
                              {index === 0 && selectedBucket === null ? "Best" : bucket.label}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/50">{pantone.hex}</span>
                            {onAttachToCard && (
                              <GlassButton
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAttachToCard(pantone);
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Attach
                              </GlassButton>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {matchedPantones.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border border-dashed border-white/10 rounded-xl min-h-[300px]">
              <Pipette className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-center">
                {imageSrc 
                  ? "Use the dropper tool to pick a color from the image"
                  : "Upload an image to find matching Pantone colors"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
