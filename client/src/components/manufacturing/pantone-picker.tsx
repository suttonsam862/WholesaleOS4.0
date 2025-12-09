import { useState, useRef, useEffect } from "react";
import { GlassCard, GlassButton, GlassInput } from "@/components/ui/glass";
import { Upload, Pipette, Search, Check, RefreshCw, ChevronDown, Image as ImageIcon, Layers, ArrowLeft, ArrowRight, CheckCircle, Tag, Sparkles, X } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PANTONE_COLORS from "@/data/pantone-colors.json";

export interface PantoneColor {
  code: string;
  hex: string;
  name: string;
}

export interface PantoneAssignment {
  pantoneCode: string;
  pantoneName: string;
  pantoneType: "C" | "TCX" | "TPX" | "U";
  hexValue: string;
  rgbR: number;
  rgbG: number;
  rgbB: number;
  usageLocation: "main_body" | "side_panel" | "trim" | "numbers" | "text" | "logo" | "other";
  usageNotes?: string;
  matchQuality: "excellent" | "very_close" | "good" | "approximate" | "not_recommended";
  matchDistance: number;
  sampledFromImageUrl?: string;
}

interface PantonePickerProps {
  onSelect?: (pantone: PantoneColor) => void;
  onAssign?: (assignment: PantoneAssignment) => void;
  initialImage?: string;
  lineItemImages?: string[];
  onAttachToCard?: (pantone: PantoneColor) => void;
  brandPalette?: { hex: string; name: string }[];
  mode?: "simple" | "wizard";
}

type Step = "choose_image" | "pick_color" | "confirm_match";

const USAGE_LOCATIONS = [
  { value: "main_body", label: "Main Body", description: "Primary garment color" },
  { value: "side_panel", label: "Side Panel", description: "Side panel accents" },
  { value: "trim", label: "Trim", description: "Collar, cuffs, edges" },
  { value: "numbers", label: "Numbers", description: "Jersey numbers" },
  { value: "text", label: "Text/Lettering", description: "Names and text" },
  { value: "logo", label: "Logo", description: "Logo colors" },
  { value: "other", label: "Other", description: "Other usage" },
] as const;

const MATCH_QUALITY_LABELS = {
  excellent: { label: "Excellent Match", badge: "Perfect for production", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  very_close: { label: "Very Close", badge: "Highly recommended", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  good: { label: "Good Match", badge: "Acceptable for most uses", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
  approximate: { label: "Approximate", badge: "Noticeable difference", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  not_recommended: { label: "Not Recommended", badge: "Significant variance", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
};

const DISTANCE_THRESHOLDS = {
  excellent: 16,
  very_close: 32,
  good: 48,
  approximate: 80,
  not_recommended: Infinity,
};

export function PantonePicker({ 
  onSelect, 
  onAssign,
  initialImage, 
  lineItemImages = [], 
  onAttachToCard,
  brandPalette = [],
  mode = "wizard"
}: PantonePickerProps) {
  const [step, setStep] = useState<Step>(initialImage ? "pick_color" : "choose_image");
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isDropperActive, setIsDropperActive] = useState(false);
  const [matchedPantones, setMatchedPantones] = useState<(PantoneColor & { distance: number; matchQuality: keyof typeof MATCH_QUALITY_LABELS })[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPantone, setSelectedPantone] = useState<(PantoneColor & { distance: number; matchQuality: keyof typeof MATCH_QUALITY_LABELS }) | null>(null);
  const [usageLocation, setUsageLocation] = useState<PantoneAssignment["usageLocation"]>("main_body");
  const [usageNotes, setUsageNotes] = useState("");
  const [pantoneType, setPantoneType] = useState<"C" | "TCX">("C");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (initialImage && !imageSrc) {
      setImageSrc(initialImage);
      setStep("pick_color");
    }
  }, [initialImage]);

  const getColorDistance = (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);
    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  };

  const getMatchQuality = (distance: number): keyof typeof MATCH_QUALITY_LABELS => {
    if (distance <= DISTANCE_THRESHOLDS.excellent) return "excellent";
    if (distance <= DISTANCE_THRESHOLDS.very_close) return "very_close";
    if (distance <= DISTANCE_THRESHOLDS.good) return "good";
    if (distance <= DISTANCE_THRESHOLDS.approximate) return "approximate";
    return "not_recommended";
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setPickedColor(null);
        setMatchedPantones([]);
        setStep("pick_color");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLineItemImageSelect = (imageUrl: string) => {
    setImageSrc(imageUrl);
    setPickedColor(null);
    setMatchedPantones([]);
    setShowImageSelector(false);
    setStep("pick_color");
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDropperActive || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.drawImage(imageRef.current, 0, 0);

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    const pixelData = ctx.getImageData(Math.round(x * scaleX), Math.round(y * scaleY), 1, 1).data;
    const hex = "#" + [pixelData[0], pixelData[1], pixelData[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

    setPickedColor(hex);
    setIsDropperActive(false);
    findMatches(hex);
    setStep("confirm_match");
  };

  const findMatches = (hex: string) => {
    const withDistances = (PANTONE_COLORS as PantoneColor[]).map(pantone => {
      const distance = getColorDistance(hex, pantone.hex);
      return {
        ...pantone,
        distance,
        matchQuality: getMatchQuality(distance),
      };
    });
    
    const sorted = withDistances.sort((a, b) => a.distance - b.distance);
    setMatchedPantones(sorted.slice(0, 24));
    if (sorted.length > 0) {
      setSelectedPantone(sorted[0]);
    }
  };

  const handleConfirmAssignment = () => {
    if (!selectedPantone || !pickedColor) return;
    
    const rgb = hexToRgb(selectedPantone.hex);
    const assignment: PantoneAssignment = {
      pantoneCode: selectedPantone.code,
      pantoneName: selectedPantone.name,
      pantoneType,
      hexValue: selectedPantone.hex,
      rgbR: rgb.r,
      rgbG: rgb.g,
      rgbB: rgb.b,
      usageLocation,
      usageNotes: usageNotes || undefined,
      matchQuality: selectedPantone.matchQuality,
      matchDistance: Math.round(selectedPantone.distance),
      sampledFromImageUrl: imageSrc || undefined,
    };
    
    if (onAssign) {
      onAssign(assignment);
    }
    if (onSelect) {
      onSelect(selectedPantone);
    }
  };

  const filteredMatches = searchQuery 
    ? matchedPantones.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : matchedPantones;

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { key: "choose_image", label: "1. Choose Image" },
        { key: "pick_color", label: "2. Pick Color" },
        { key: "confirm_match", label: "3. Confirm Match" },
      ].map((s, i) => (
        <div key={s.key} className="flex items-center">
          <button
            onClick={() => {
              if (s.key === "choose_image") {
                setStep("choose_image");
                setImageSrc(null);
                setPickedColor(null);
                setMatchedPantones([]);
                setSelectedPantone(null);
                setSearchQuery("");
                setUsageLocation("main_body");
                setUsageNotes("");
                setIsDropperActive(false);
                setShowImageSelector(false);
              }
              else if (s.key === "pick_color" && imageSrc) setStep("pick_color");
              else if (s.key === "confirm_match" && pickedColor) setStep("confirm_match");
            }}
            disabled={
              (s.key === "pick_color" && !imageSrc) ||
              (s.key === "confirm_match" && !pickedColor)
            }
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              step === s.key
                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50"
                : s.key === "choose_image" || (s.key === "pick_color" && imageSrc) || (s.key === "confirm_match" && pickedColor)
                  ? "bg-white/5 text-white/70 border border-white/10 hover:border-white/20"
                  : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
            )}
            data-testid={`step-${s.key}`}
          >
            {(step === "confirm_match" && s.key === "choose_image") || 
             (step === "confirm_match" && s.key === "pick_color" && pickedColor) ||
             (step !== "choose_image" && s.key === "choose_image" && imageSrc) ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                step === s.key ? "bg-neon-blue text-white" : "bg-white/10"
              )}>
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{s.label.split(". ")[1]}</span>
          </button>
          {i < 2 && (
            <div className={cn(
              "w-8 h-px mx-2",
              (i === 0 && imageSrc) || (i === 1 && pickedColor)
                ? "bg-neon-blue/50"
                : "bg-white/10"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  if (mode === "simple") {
    return <SimplePantonePicker 
      onSelect={onSelect} 
      initialImage={initialImage} 
      lineItemImages={lineItemImages}
      onAttachToCard={onAttachToCard}
    />;
  }

  return (
    <div className="space-y-6">
      {stepIndicator}

      <AnimatePresence mode="wait">
        {step === "choose_image" && (
          <motion.div
            key="choose_image"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Choose an Image</h3>
              <p className="text-muted-foreground">Select an image to sample colors from</p>
            </div>

            {lineItemImages.length > 0 && (
              <GlassCard className="p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-blue" />
                  Line Item Images
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {lineItemImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => handleLineItemImageSelect(img)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-neon-blue transition-all hover:scale-105"
                      data-testid={`line-item-image-${i}`}
                    >
                      <ImageWithFallback src={img} alt={`Line item ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {brandPalette.length > 0 && (
              <GlassCard className="p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-purple" />
                  Brand Palette
                </h4>
                <div className="flex flex-wrap gap-2">
                  {brandPalette.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPickedColor(color.hex);
                        findMatches(color.hex);
                        setStep("confirm_match");
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-neon-purple/50 transition-all"
                      data-testid={`brand-color-${i}`}
                    >
                      <div
                        className="w-6 h-6 rounded-md border border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm text-white">{color.name}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center">
              <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue/20 transition-colors font-medium">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  data-testid="input-image-upload"
                />
                <Upload className="w-5 h-5" />
                Upload Custom Image
              </label>
            </div>
          </motion.div>
        )}

        {step === "pick_color" && (
          <motion.div
            key="pick_color"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Pick a Color</h3>
              <p className="text-muted-foreground">Click anywhere on the image to sample a color</p>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black/20 border border-white/10 min-h-[300px] flex items-center justify-center">
              {imageSrc && (
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
                    data-testid="image-picker-canvas"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <GlassButton
                      size="sm"
                      variant={isDropperActive ? "primary" : "secondary"}
                      onClick={() => setIsDropperActive(!isDropperActive)}
                      className="backdrop-blur-md"
                      data-testid="button-dropper-toggle"
                    >
                      <Pipette className="w-4 h-4 mr-2" />
                      {isDropperActive ? "Click to Pick" : "Dropper"}
                    </GlassButton>
                  </div>

                  {isDropperActive && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-sm font-medium animate-pulse">
                      Click anywhere on the image to pick a color
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setStep("choose_image");
                  setImageSrc(null);
                  setPickedColor(null);
                  setMatchedPantones([]);
                  setSelectedPantone(null);
                  setSearchQuery("");
                  setUsageLocation("main_body");
                  setUsageNotes("");
                  setIsDropperActive(false);
                  setShowImageSelector(false);
                }}
                data-testid="button-back-to-images"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Image
              </GlassButton>

              {!isDropperActive && (
                <GlassButton
                  variant="primary"
                  onClick={() => setIsDropperActive(true)}
                  data-testid="button-activate-dropper"
                >
                  <Pipette className="w-4 h-4 mr-2" />
                  Activate Dropper
                </GlassButton>
              )}
            </div>
          </motion.div>
        )}

        {step === "confirm_match" && (
          <motion.div
            key="confirm_match"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Confirm Pantone Match</h3>
              <p className="text-muted-foreground">Select the best matching Pantone color and assign usage</p>
            </div>

            {pickedColor && (
              <GlassCard variant="neon" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg"
                      style={{ backgroundColor: pickedColor }}
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Sampled Color</p>
                      <p className="text-xl font-mono font-bold text-white">{pickedColor}</p>
                    </div>
                  </div>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={() => setStep("pick_color")}
                    data-testid="button-repick-color"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pick Again
                  </GlassButton>
                </div>
              </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Pantone Matches</h4>
                  <div className="flex gap-2">
                    <Select value={pantoneType} onValueChange={(v) => setPantoneType(v as "C" | "TCX")}>
                      <SelectTrigger className="w-24 h-8 text-xs bg-white/5 border-white/10" data-testid="select-pantone-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">Coated (C)</SelectItem>
                        <SelectItem value="TCX">Textile (TCX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <GlassInput
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-pantone-search"
                />

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {filteredMatches.map((pantone, index) => {
                    const quality = MATCH_QUALITY_LABELS[pantone.matchQuality];
                    const isSelected = selectedPantone?.code === pantone.code;
                    return (
                      <motion.button
                        key={pantone.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => setSelectedPantone(pantone)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          isSelected
                            ? "bg-neon-blue/10 border-neon-blue/50"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                        data-testid={`pantone-match-${pantone.code.replace(/\s/g, "-")}`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-white/20 flex-shrink-0"
                          style={{ backgroundColor: pantone.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{pantone.code}</span>
                            {index === 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/50 text-emerald-400">
                                Best Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{pantone.name}</p>
                          <div className={cn(
                            "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px]",
                            quality.bgColor,
                            quality.color
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", quality.color.replace("text-", "bg-"))} />
                            {quality.badge}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-neon-blue flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {selectedPantone && (
                  <>
                    <GlassCard className="p-4">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-blue" />
                        Selected Pantone
                      </h4>
                      <div className="flex items-start gap-4">
                        <div
                          className="w-20 h-20 rounded-xl border-2 border-white/20 shadow-lg flex-shrink-0"
                          style={{ backgroundColor: selectedPantone.hex }}
                        />
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-white">{selectedPantone.code}</p>
                          <p className="text-sm text-muted-foreground">{selectedPantone.name}</p>
                          <p className="text-xs font-mono text-white/50 mt-1">{selectedPantone.hex}</p>
                          <div className={cn(
                            "inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-medium",
                            MATCH_QUALITY_LABELS[selectedPantone.matchQuality].bgColor,
                            MATCH_QUALITY_LABELS[selectedPantone.matchQuality].color,
                            MATCH_QUALITY_LABELS[selectedPantone.matchQuality].borderColor,
                            "border"
                          )}>
                            <Sparkles className="w-3 h-3" />
                            {MATCH_QUALITY_LABELS[selectedPantone.matchQuality].label}
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="p-4">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-neon-purple" />
                        Usage Location
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {USAGE_LOCATIONS.map((loc) => (
                          <button
                            key={loc.value}
                            onClick={() => setUsageLocation(loc.value)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              usageLocation === loc.value
                                ? "bg-neon-purple/10 border-neon-purple/50"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                            data-testid={`usage-${loc.value}`}
                          >
                            <p className={cn(
                              "font-medium text-sm",
                              usageLocation === loc.value ? "text-neon-purple" : "text-white"
                            )}>
                              {loc.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{loc.description}</p>
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        Notes (optional)
                      </label>
                      <Textarea
                        value={usageNotes}
                        onChange={(e) => setUsageNotes(e.target.value)}
                        placeholder="Add any specific notes about this color usage..."
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-usage-notes"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <GlassButton
                variant="secondary"
                onClick={() => setStep("pick_color")}
                data-testid="button-back-to-pick"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Pick Different Color
              </GlassButton>

              <GlassButton
                variant="primary"
                onClick={handleConfirmAssignment}
                disabled={!selectedPantone}
                data-testid="button-confirm-assignment"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Assignment
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimplePantonePicker({ 
  onSelect, 
  initialImage, 
  lineItemImages = [], 
  onAttachToCard 
}: Pick<PantonePickerProps, 'onSelect' | 'initialImage' | 'lineItemImages' | 'onAttachToCard'>) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isDropperActive, setIsDropperActive] = useState(false);
  const [matchedPantones, setMatchedPantones] = useState<(PantoneColor & { distance: number })[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getColorDistance = (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);
    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  };

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

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.drawImage(imageRef.current, 0, 0);

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    const pixelData = ctx.getImageData(Math.round(x * scaleX), Math.round(y * scaleY), 1, 1).data;
    const hex = "#" + [pixelData[0], pixelData[1], pixelData[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

    setPickedColor(hex);
    setIsDropperActive(false);
    findMatches(hex);
  };

  const findMatches = (hex: string) => {
    const withDistances = (PANTONE_COLORS as PantoneColor[]).map(pantone => ({
      ...pantone,
      distance: getColorDistance(hex, pantone.hex)
    }));
    const sorted = withDistances.sort((a, b) => a.distance - b.distance);
    setMatchedPantones(sorted.slice(0, 24));
  };

  const filteredBySearch = searchQuery 
    ? matchedPantones.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : matchedPantones;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
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
              <GlassInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredBySearch.map((pantone, index) => (
                  <motion.div
                    key={pantone.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <GlassCard 
                      className="p-0 overflow-hidden hover:border-neon-blue/50 transition-all cursor-pointer h-full"
                      onClick={() => onSelect?.(pantone)}
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
                          {index === 0 && (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">
                              Best
                            </Badge>
                          )}
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
                ))}
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
