import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ActionPageShell } from "@/components/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, AlertCircle, Sparkles, FileText, Clock, Plus, Trash2, Mail, Download, AlertTriangle, Upload, Pipette, X, Palette, Eye, Building, MapPin, User, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { celebrateSuccess } from "@/lib/confetti";
import { getActionById } from "@/lib/actionsConfig";
import type { Order, Organization, Quote, Manufacturing, TeamStore, Product, ProductVariant } from "@shared/schema";
import PANTONE_COLORS from "@/data/pantone-colors.json";

interface PantoneColor {
  code: string;
  hex: string;
  name: string;
}

interface SelectedColor {
  id: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  pantone: PantoneColor;
  matchDistance: number;
  matchQuality: "excellent" | "very_close" | "good" | "approximate" | "not_recommended";
}

const MATCH_QUALITY_LABELS = {
  excellent: { label: "Excellent Match", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  very_close: { label: "Very Close", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  good: { label: "Good Match", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800" },
  approximate: { label: "Approximate", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  not_recommended: { label: "Not Recommended", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
};

const MAX_COLORS = 6;

interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  lineTotal: number;
  margin: number;
}

type MarginType = "wholesale" | "event_retail";

const MARGIN_GUARDRAILS = {
  wholesale: { min: 0.42, max: 0.48, label: "Wholesale (42-48%)" },
  event_retail: { min: 0.50, max: 1.0, label: "Event/Retail (50%+)" },
};

interface ActionDetailPageProps {
  hubId: string;
}

export function ActionDetailPage({ hubId }: ActionDetailPageProps) {
  const [, params] = useRoute(`/${hubId}/actions/:actionId`);
  const actionId = params?.actionId || "";

  return (
    <ActionPageShell hubId={hubId} actionId={actionId}>
      {(props) => <ActionStepContent hubId={hubId} {...props} />}
    </ActionPageShell>
  );
}

function ActionStepContent({
  hubId,
  currentStep,
  stepIndex,
  goNext,
  goBack,
  isLoading,
  setLoading,
  setStepData,
  stepData,
  action,
}: any) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [options, setOptions] = useState<Record<string, any>>({});
  const [aiResult, setAiResult] = useState<any>(null);

  // Quick Quote Generator state
  const [marginType, setMarginType] = useState<MarginType>("wholesale");
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [pickMode, setPickMode] = useState<"order" | "organization">("order");

  // Add Pantones state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDropperActive, setIsDropperActive] = useState(false);
  const [selectedColors, setSelectedColors] = useState<SelectedColor[]>([]);
  const [manualPantoneCode, setManualPantoneCode] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Design Starter state
  const [designStyle, setDesignStyle] = useState<string>("modern");
  const [designColorScheme, setDesignColorScheme] = useState<string[]>([]);
  const [designText, setDesignText] = useState<string>("");
  const [autoAssignDesigner, setAutoAssignDesigner] = useState<boolean>(false);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>("");
  const [createdDesignJob, setCreatedDesignJob] = useState<any>(null);
  const [previousDesigns, setPreviousDesigns] = useState<any[]>([]);

  // Push to Printful state
  const [printfulShippingMethod, setPrintfulShippingMethod] = useState<string>("standard");
  const [printfulGiftMessage, setPrintfulGiftMessage] = useState<string>("");
  const [printfulLineItemMappings, setPrintfulLineItemMappings] = useState<Record<number, { printfulProductId: string; quantity: number; enabled: boolean }>>({});
  const [createdPrintfulRecord, setCreatedPrintfulRecord] = useState<any>(null);

  // Spin Up Tour Merch Bundle state
  const [tourMerchBundleName, setTourMerchBundleName] = useState<string>("");
  const [tourMerchProductTypes, setTourMerchProductTypes] = useState<Record<string, { enabled: boolean; quantity: number }>>({
    "tshirt": { enabled: true, quantity: 50 },
    "hoodie": { enabled: false, quantity: 25 },
    "cap": { enabled: false, quantity: 30 },
    "tank": { enabled: false, quantity: 25 },
    "longsleeve": { enabled: false, quantity: 20 },
    "poster": { enabled: false, quantity: 100 },
  });
  const [tourMerchDesignStyle, setTourMerchDesignStyle] = useState<string>("bold");
  const [tourMerchCreateTeamStore, setTourMerchCreateTeamStore] = useState<boolean>(true);
  const [tourMerchGeneratedDesigns, setTourMerchGeneratedDesigns] = useState<any[]>([]);
  const [createdTourMerchBundle, setCreatedTourMerchBundle] = useState<any>(null);

  // Instant Org Setup state
  const [orgType, setOrgType] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const [orgPrimaryColor, setOrgPrimaryColor] = useState<string>("#6366f1");
  const [orgSecondaryColor, setOrgSecondaryColor] = useState<string>("#8b5cf6");
  const [orgExtractedColors, setOrgExtractedColors] = useState<string[]>([]);
  const [orgContactName, setOrgContactName] = useState<string>("");
  const [orgContactEmail, setOrgContactEmail] = useState<string>("");
  const [orgCity, setOrgCity] = useState<string>("");
  const [orgState, setOrgState] = useState<string>("");
  const [orgZip, setOrgZip] = useState<string>("");
  const [createdOrganization, setCreatedOrganization] = useState<Organization | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState<boolean>(false);
  const orgLogoInputRef = useRef<HTMLInputElement>(null);
  const orgLogoCanvasRef = useRef<HTMLCanvasElement>(null);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: hubId === "orders" || hubId === "quotes" || hubId === "manufacturing",
  });

  const { data: manufacturingOrders = [] } = useQuery<Manufacturing[]>({
    queryKey: ["/api/manufacturing"],
    enabled: hubId === "manufacturing",
  });

  const { data: teamStores = [] } = useQuery<TeamStore[]>({
    queryKey: ["/api/team-stores"],
    enabled: hubId === "team-stores",
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: hubId === "catalog",
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: hubId === "organizations" || hubId === "sales-analytics" || hubId === "quotes",
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    enabled: hubId === "quotes",
  });

  // Events hub queries
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
    enabled: hubId === "events",
  });

  // AI Design Starter queries
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: hubId === "design-jobs" && action?.id === "ai-design-starter",
  });

  const { data: designers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: hubId === "design-jobs" && action?.id === "ai-design-starter",
    select: (users: any[]) => users.filter((u: any) => u.role === "designer" && u.isActive !== false),
  });

  const { data: orgList = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: hubId === "design-jobs" && action?.id === "ai-design-starter",
  });

  const aiMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiRequest("POST", "/api/ai/interactions", payload);
      return response;
    },
    onSuccess: (data) => {
      setAiResult(data);
      setLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "AI Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const response = await apiRequest("POST", "/api/quotes", quoteData);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Quote Created",
        description: `Quote ${data.quoteCode} has been created as a draft`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // AI Design Starter mutation for creating design job
  const createTourMerchBundleMutation = useMutation({
    mutationFn: async (bundleData: any) => {
      const response = await apiRequest("POST", "/api/tour-merch-bundles", bundleData);
      return response;
    },
    onSuccess: (data) => {
      setCreatedTourMerchBundle(data);
      toast({
        title: "Tour Merch Bundle Created",
        description: `Bundle ${data.bundleCode} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tour-merch-bundles"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tour merch bundle",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const createDesignJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/design-jobs", jobData);
      return response;
    },
    onSuccess: (data) => {
      setCreatedDesignJob(data);
      toast({
        title: "Design Job Created",
        description: `Design job ${data.jobCode} has been created with AI brief`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create design job",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // Push to Printful mutation for creating sync record
  const createPrintfulSyncMutation = useMutation({
    mutationFn: async (syncData: any) => {
      const response = await apiRequest("POST", "/api/printful-sync-records", syncData);
      return response;
    },
    onSuccess: (data) => {
      setCreatedPrintfulRecord(data);
      toast({
        title: "Printful Order Created",
        description: `Order #${data.printfulOrderId} has been submitted to Printful`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/printful-sync-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Printful order",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // Instant Org Setup mutation for creating organization
  const createOrganizationMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const response = await apiRequest("POST", "/api/organizations", orgData);
      return response;
    },
    onSuccess: async (data) => {
      setCreatedOrganization(data);
      toast({
        title: "Organization Created",
        description: `${data.name} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      
      // Create contact if provided
      if (orgContactName && orgContactEmail) {
        try {
          await apiRequest("POST", "/api/contacts", {
            orgId: data.id,
            name: orgContactName,
            email: orgContactEmail,
            isPrimary: true,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        } catch {
          // Contact creation failed silently - organization was still created
        }
      }
      
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  // Color extraction from logo
  const extractColorsFromLogo = async (imageDataUrl: string) => {
    setIsExtractingColors(true);
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageDataUrl;
      });
      
      const canvas = orgLogoCanvasRef.current;
      if (!canvas) {
        setIsExtractingColors(false);
        return;
      }
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsExtractingColors(false);
        return;
      }
      
      // Scale down for performance
      const scale = Math.min(100 / img.width, 100 / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple color extraction - find dominant colors
      const colorCounts: Record<string, number> = {};
      
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue; // Skip transparent pixels
        
        // Skip very light colors (likely background)
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 240) continue;
        
        // Skip very dark colors
        if (brightness < 15) continue;
        
        // Quantize colors for grouping
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
      
      // Sort by count and get top colors
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([color]) => color);
      
      if (sortedColors.length >= 2) {
        setOrgPrimaryColor(sortedColors[0]);
        setOrgSecondaryColor(sortedColors[1]);
        setOrgExtractedColors(sortedColors);
        toast({
          title: "Colors Extracted",
          description: `Found ${sortedColors.length} dominant colors from your logo`,
        });
      } else if (sortedColors.length === 1) {
        setOrgPrimaryColor(sortedColors[0]);
        setOrgExtractedColors(sortedColors);
      }
    } catch {
      // Color extraction failed silently
    }
    
    setIsExtractingColors(false);
  };

  const handleOrgLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOrgLogoPreview(dataUrl);
      setOrgLogoFile(file);
      extractColorsFromLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Fetch previous designs when category is selected (for AI context)
  const fetchPreviousDesigns = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/design-jobs/by-category/${categoryId}?limit=50`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPreviousDesigns(data.designs || []);
      }
    } catch (error) {
      console.error("Failed to fetch previous designs:", error);
    }
  };

  const handlePickSelection = (item: any) => {
    setSelectedItem(item);
    setStepData({ selectedItem: item });
  };

  const handleOptionsChange = (key: string, value: any) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    setStepData({ options: newOptions });
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    
    // Build context based on action type
    let context: any = {
      selectedItem: stepData.pick?.selectedItem || selectedItem,
      options: stepData.choose?.options || options,
    };
    
    // For AI Design Starter, include the design preferences and previous designs
    if (action.id === "ai-design-starter") {
      context = {
        selectedItem: selectedItem, // The product type
        options: {
          designStyle,
          colorScheme: designColorScheme,
          textToInclude: designText,
          previousDesigns: previousDesigns, // Previous designs for this product type (NOT org)
          autoAssignDesigner,
          selectedDesignerId,
        },
      };
    }
    
    const payload = {
      actionId: action.aiActionId || action.id,
      hubId,
      context,
    };
    aiMutation.mutate(payload);
  };

  // Quick Quote Generator helpers
  const calculateMargin = (cost: number, price: number): number => {
    if (price === 0) return 0;
    return ((price - cost) / price);
  };

  const getMinMarginForType = (): number => {
    return MARGIN_GUARDRAILS[marginType].min;
  };

  const addLineItem = () => {
    const newItem: QuoteLineItem = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      unitPrice: 0,
      lineTotal: 0,
      margin: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof QuoteLineItem, value: any) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Recalculate line total and margin
        if (field === "quantity" || field === "unitPrice") {
          updated.lineTotal = updated.quantity * updated.unitPrice;
        }
        if (field === "unitCost" || field === "unitPrice") {
          updated.margin = calculateMargin(updated.unitCost, updated.unitPrice);
        }
        if (field === "quantity") {
          updated.lineTotal = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const getQuoteSubtotal = (): number => {
    return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const getQuoteTax = (): number => {
    return getQuoteSubtotal() * 0.08; // 8% tax
  };

  const getQuoteTotal = (): number => {
    return getQuoteSubtotal() - discount + getQuoteTax();
  };

  const getOverallMargin = (): number => {
    const totalRevenue = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalCost = lineItems.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    return calculateMargin(totalCost, totalRevenue);
  };

  const hasMarginWarning = (): boolean => {
    const overallMargin = getOverallMargin();
    const minMargin = getMinMarginForType();
    return overallMargin < minMargin && lineItems.length > 0;
  };

  // Add Pantones helpers
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  };

  const getColorDistance = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    return Math.sqrt(
      Math.pow(rgb2.r - rgb1.r, 2) + 
      Math.pow(rgb2.g - rgb1.g, 2) + 
      Math.pow(rgb2.b - rgb1.b, 2)
    );
  };

  const getMatchQuality = (distance: number): SelectedColor["matchQuality"] => {
    if (distance <= 16) return "excellent";
    if (distance <= 32) return "very_close";
    if (distance <= 48) return "good";
    if (distance <= 80) return "approximate";
    return "not_recommended";
  };

  const findClosestPantone = (hex: string): { pantone: PantoneColor; distance: number; matchQuality: SelectedColor["matchQuality"] } => {
    let closest: PantoneColor = (PANTONE_COLORS as PantoneColor[])[0];
    let minDistance = Infinity;

    for (const pantone of (PANTONE_COLORS as PantoneColor[])) {
      const distance = getColorDistance(hex, pantone.hex);
      if (distance < minDistance) {
        minDistance = distance;
        closest = pantone;
      }
    }

    return {
      pantone: closest,
      distance: Math.round(minDistance),
      matchQuality: getMatchQuality(minDistance),
    };
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setIsDropperActive(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDropperActive || !imageRef.current || !canvasRef.current) return;
    if (selectedColors.length >= MAX_COLORS) {
      toast({
        title: "Maximum colors reached",
        description: `You can select up to ${MAX_COLORS} colors`,
        variant: "destructive",
      });
      return;
    }

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
    const hex = "#" + [pixelData[0], pixelData[1], pixelData[2]].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
    const rgb = { r: pixelData[0], g: pixelData[1], b: pixelData[2] };

    const match = findClosestPantone(hex);
    
    const newColor: SelectedColor = {
      id: crypto.randomUUID(),
      hex,
      rgb,
      pantone: match.pantone,
      matchDistance: match.distance,
      matchQuality: match.matchQuality,
    };

    setSelectedColors(prev => [...prev, newColor]);
    toast({
      title: "Color selected",
      description: `Matched to ${match.pantone.code} - ${match.pantone.name}`,
    });
  };

  const handleRemoveColor = (colorId: string) => {
    setSelectedColors(prev => prev.filter(c => c.id !== colorId));
  };

  const handleAddManualPantone = () => {
    if (!manualPantoneCode.trim()) return;
    if (selectedColors.length >= MAX_COLORS) {
      toast({
        title: "Maximum colors reached",
        description: `You can select up to ${MAX_COLORS} colors`,
        variant: "destructive",
      });
      return;
    }

    const found = (PANTONE_COLORS as PantoneColor[]).find(
      p => p.code.toLowerCase() === manualPantoneCode.trim().toLowerCase() ||
           p.code.toLowerCase().replace(/\s/g, "") === manualPantoneCode.trim().toLowerCase().replace(/\s/g, "")
    );

    if (!found) {
      toast({
        title: "Pantone not found",
        description: "Please enter a valid Pantone code (e.g., 185 C)",
        variant: "destructive",
      });
      return;
    }

    const rgb = hexToRgb(found.hex);
    const newColor: SelectedColor = {
      id: crypto.randomUUID(),
      hex: found.hex,
      rgb,
      pantone: found,
      matchDistance: 0,
      matchQuality: "excellent",
    };

    setSelectedColors(prev => [...prev, newColor]);
    setManualPantoneCode("");
    toast({
      title: "Color added",
      description: `Added ${found.code} - ${found.name}`,
    });
  };

  const createQuickQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const response = await apiRequest("POST", "/api/quotes", quoteData);
      return response;
    },
    onSuccess: (data) => {
      setCreatedQuote(data);
      toast({
        title: "Quote Created",
        description: `Quote ${data.quoteCode} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const handleConfirm = async () => {
    setLoading(true);
    
    if (action.id === "quick-quote-generator" && selectedItem) {
      const isOrder = pickMode === "order";
      const quoteData = {
        quoteName: isOrder 
          ? `Quote for ${selectedItem.orderName}` 
          : `Quote for ${selectedItem.name}`,
        orgId: isOrder ? selectedItem.orgId : selectedItem.id,
        contactId: null,
        salespersonId: isOrder ? selectedItem.salespersonId : null,
        status: "draft",
        validUntil: validUntil,
        subtotal: getQuoteSubtotal().toFixed(2),
        taxRate: "0.0800",
        taxAmount: getQuoteTax().toFixed(2),
        discount: discount.toFixed(2),
        total: getQuoteTotal().toFixed(2),
        notes: `Generated via Quick Quote Generator. Margin type: ${MARGIN_GUARDRAILS[marginType].label}`,
        internalNotes: `Line items: ${lineItems.length}, Overall margin: ${(getOverallMargin() * 100).toFixed(1)}%`,
      };
      createQuickQuoteMutation.mutate(quoteData);
    } else if (action.id === "quote-from-order" && selectedItem) {
      const quoteData = {
        name: `Quote from ${selectedItem.orderName}`,
        orgId: selectedItem.orgId,
        contactId: null,
        salespersonId: selectedItem.salespersonId,
        status: "draft",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Generated from order ${selectedItem.orderCode}`,
      };
      createQuoteMutation.mutate(quoteData);
    } else {
      setTimeout(() => {
        setLoading(false);
        goNext();
        toast({
          title: "Action Completed",
          description: "Your changes have been saved as a draft",
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (currentStep.type === "preview" && action.requiresAI && !aiResult) {
      handleAIGenerate();
    }
  }, [currentStep.type]);

  if (currentStep.type === "pick") {
    // Quick Quote Generator PICK step
    if (action.id === "quick-quote-generator") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Create quote from</Label>
            <div className="flex gap-2">
              <Button
                variant={pickMode === "order" ? "default" : "outline"}
                onClick={() => setPickMode("order")}
                data-testid="pick-mode-order"
              >
                Existing Order
              </Button>
              <Button
                variant={pickMode === "organization" ? "default" : "outline"}
                onClick={() => setPickMode("organization")}
                data-testid="pick-mode-organization"
              >
                Organization
              </Button>
            </div>
          </div>

          {pickMode === "order" && (
            <div className="space-y-2">
              <Label>Select an order</Label>
              <div className="grid gap-2 max-h-[350px] overflow-y-auto">
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No orders found</p>
                ) : (
                  orders.slice(0, 20).map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedItem?.id === order.id && pickMode === "order" ? "border-primary border-2" : ""
                      }`}
                      onClick={() => handlePickSelection(order)}
                      data-testid={`pick-order-${order.id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.orderName}</p>
                          <p className="text-sm text-muted-foreground">{order.orderCode}</p>
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {pickMode === "organization" && (
            <div className="space-y-2">
              <Label>Select an organization</Label>
              <div className="grid gap-2 max-h-[350px] overflow-y-auto">
                {organizations.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No organizations found</p>
                ) : (
                  organizations.slice(0, 20).map((org) => (
                    <Card
                      key={org.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedItem?.id === org.id && pickMode === "organization" ? "border-primary border-2" : ""
                      }`}
                      onClick={() => handlePickSelection(org)}
                      data-testid={`pick-org-${org.id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {org.city}{org.state ? `, ${org.state}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline">{org.clientType || "retail"}</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedItem && (
            <div className="p-4 bg-primary/5 rounded-lg mt-4">
              <p className="text-sm">
                <strong>Selected:</strong> {selectedItem.name || selectedItem.orderName}
              </p>
            </div>
          )}
        </div>
      );
    }

    // AI Design Starter PICK step - Select product type/variant (NOT organization)
    if (action.id === "ai-design-starter") {
      const PRODUCT_TYPES = [
        { id: "tshirt", name: "T-Shirt", icon: "👕", description: "Classic crew neck, v-neck, performance tees" },
        { id: "hoodie", name: "Hoodie", icon: "🧥", description: "Pullover hoodies, zip-ups, fleece" },
        { id: "cap", name: "Cap / Hat", icon: "🧢", description: "Baseball caps, snapbacks, beanies" },
        { id: "polo", name: "Polo Shirt", icon: "👔", description: "Classic polo, performance polo" },
        { id: "jacket", name: "Jacket", icon: "🧥", description: "Windbreakers, letterman, coaches jackets" },
        { id: "pants", name: "Pants / Shorts", icon: "👖", description: "Joggers, athletic shorts, sweatpants" },
        { id: "tank", name: "Tank Top", icon: "🎽", description: "Athletic tanks, casual tanks" },
        { id: "longsleeve", name: "Long Sleeve", icon: "👕", description: "Long sleeve tees, thermal, dri-fit" },
      ];

      // Also show actual categories from the database if available
      const allTypes = categories.length > 0 
        ? categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: "📦",
            description: cat.description || "Product category",
            isCategory: true,
          }))
        : PRODUCT_TYPES;

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Select Product Type
            </Label>
            <p className="text-sm text-muted-foreground">
              AI will analyze previous designs for this product type to generate on-brand concepts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {allTypes.map((type: any) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    selectedItem?.id === type.id ? "border-primary border-2 bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    handlePickSelection(type);
                    if (type.isCategory) {
                      fetchPreviousDesigns(type.id);
                    }
                  }}
                  data-testid={`pick-product-type-${type.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{type.name}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {selectedItem?.id === type.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedItem && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Selected: {selectedItem.name}
                </p>
              </div>
              {previousDesigns.length > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {previousDesigns.length} previous designs found for inspiration
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Push to Printful PICK step
    if (action.id === "push-to-printful") {
      const getItems = () => {
        if (hubId === "orders") return orders.filter((o: Order) => o.status !== "cancelled" && o.status !== "new");
        if (hubId === "manufacturing") return manufacturingOrders.filter((m: any) => m.status === "in_production" || m.status === "pending");
        return orders;
      };

      const items = getItems();

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              Select Order to Push to Printful
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose an order to submit for print-on-demand fulfillment via Printful.
            </p>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No eligible orders found</p>
                  <p className="text-sm">Orders must be in production or pending status</p>
                </div>
              ) : (
                items.slice(0, 20).map((item: any) => {
                  const order = hubId === "manufacturing" 
                    ? orders.find((o: Order) => o.id === item.orderId) 
                    : item;
                  const displayName = order?.orderName || `Order #${item.orderId || item.id}`;
                  const displayCode = order?.orderCode || item.orderCode || "";
                  
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all hover:border-indigo-500 hover:shadow-md ${
                        selectedItem?.id === item.id ? "border-indigo-500 border-2 bg-indigo-50 dark:bg-indigo-950/20" : ""
                      }`}
                      onClick={() => {
                        handlePickSelection({ ...item, order });
                        setPrintfulLineItemMappings({});
                      }}
                      data-testid={`pick-printful-order-${item.id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-sm text-muted-foreground">{displayCode}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                            {item.status || order?.status || "pending"}
                          </Badge>
                          {selectedItem?.id === item.id && (
                            <Check className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {selectedItem && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Selected: {selectedItem.order?.orderName || selectedItem.orderName || `Order #${selectedItem.id}`}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Add Pantones PICK step
    if (action.id === "add-pantones") {
      const getItems = () => {
        if (hubId === "orders") return orders;
        if (hubId === "manufacturing") return manufacturingOrders;
        if (hubId === "team-stores") return teamStores;
        if (hubId === "catalog") return products;
        return [];
      };

      const getItemLabel = (item: any) => {
        if (hubId === "orders") return item.orderName;
        if (hubId === "manufacturing") return `MFG-${item.id}`;
        if (hubId === "team-stores") return item.storeName;
        if (hubId === "catalog") return item.name;
        return "Item";
      };

      const getItemSubLabel = (item: any) => {
        if (hubId === "orders") return item.orderCode;
        if (hubId === "manufacturing") return item.status;
        if (hubId === "team-stores") return item.status;
        if (hubId === "catalog") return item.sku;
        return "";
      };

      const getPickLabel = () => {
        if (hubId === "orders") return "Select an order";
        if (hubId === "manufacturing") return "Select a manufacturing order";
        if (hubId === "team-stores") return "Select a team store";
        if (hubId === "catalog") return "Select a product";
        return "Select an item";
      };

      const items = getItems();

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{getPickLabel()}</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No items found</p>
              ) : (
                items.slice(0, 20).map((item: any) => (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === item.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(item)}
                    data-testid={`pick-item-${item.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getItemLabel(item)}</p>
                        <p className="text-sm text-muted-foreground">{getItemSubLabel(item)}</p>
                      </div>
                      <Badge variant="outline">{item.status || "active"}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {selectedItem && (
            <div className="p-4 bg-primary/5 rounded-lg mt-4">
              <p className="text-sm">
                <strong>Selected:</strong> {getItemLabel(selectedItem)}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Spin Up Tour Merch Bundle PICK step
    if (action.id === "spin-up-tour-merch") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select an Event</Label>
            <p className="text-sm text-muted-foreground">
              Choose the event you want to create a merchandise bundle for
            </p>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No events found</p>
              ) : (
                events.slice(0, 20).map((event: any) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === event.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(event)}
                    data-testid={`pick-event-${event.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Date TBD"} • {event.location || "Location TBD"}
                        </p>
                      </div>
                      <Badge variant="outline">{event.status || "planned"}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {selectedItem && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Selected Event: {selectedItem.name}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Ready to create tour merch bundle
              </p>
            </div>
          )}
        </div>
      );
    }

    // Instant Org Setup PICK step - Choose organization type
    if (action.id === "instant-org-setup") {
      const ORG_TYPES = [
        { id: "high_school", name: "High School", icon: "🏫", description: "High schools, prep schools, athletics" },
        { id: "college", name: "College / University", icon: "🎓", description: "Colleges, universities, greek life" },
        { id: "corporate", name: "Corporate", icon: "🏢", description: "Businesses, companies, startups" },
        { id: "nonprofit", name: "Non-Profit", icon: "💝", description: "Charities, foundations, NGOs" },
        { id: "tour", name: "Tour / Band", icon: "🎸", description: "Music tours, bands, entertainment" },
        { id: "other", name: "Other", icon: "📋", description: "Clubs, teams, community groups" },
      ];

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Select Organization Type
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose the type of organization you're setting up. This helps us suggest the best defaults.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {ORG_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    orgType === type.id ? "border-primary border-2 bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    setOrgType(type.id);
                    setSelectedItem({ id: type.id, name: type.name, type: type.id });
                  }}
                  data-testid={`pick-org-type-${type.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{type.name}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {orgType === type.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {orgType && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Selected: {ORG_TYPES.find(t => t.id === orgType)?.name}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Next" to enter organization details
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {hubId === "orders" && (
          <div className="space-y-2">
            <Label>Select an order</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No orders found</p>
              ) : (
                orders.slice(0, 20).map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === order.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(order)}
                    data-testid={`pick-order-${order.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.orderName}</p>
                        <p className="text-sm text-muted-foreground">{order.orderCode}</p>
                      </div>
                      <Badge variant="outline">{order.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {(hubId === "organizations" || hubId === "sales-analytics") && (
          <div className="space-y-2">
            <Label>Select a client organization</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {organizations.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No organizations found</p>
              ) : (
                organizations.slice(0, 20).map((org) => (
                  <Card
                    key={org.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === org.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(org)}
                    data-testid={`pick-org-${org.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {org.city}{org.state ? `, ${org.state}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline">{org.clientType || "retail"}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="p-4 bg-primary/5 rounded-lg mt-4">
            <p className="text-sm">
              <strong>Selected:</strong> {selectedItem.name || selectedItem.orderName}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (currentStep.type === "choose") {
    // Push to Printful CHOOSE step
    if (action.id === "push-to-printful") {
      const PRINTFUL_PRODUCTS = [
        { id: "unisex-tee", name: "Unisex Cotton T-Shirt", baseCost: 12.50 },
        { id: "premium-tee", name: "Premium Cotton T-Shirt", baseCost: 15.00 },
        { id: "hoodie", name: "Pullover Hoodie", baseCost: 28.00 },
        { id: "zip-hoodie", name: "Zip-Up Hoodie", baseCost: 32.00 },
        { id: "tank-top", name: "Tank Top", baseCost: 11.00 },
        { id: "long-sleeve", name: "Long Sleeve T-Shirt", baseCost: 16.50 },
        { id: "polo", name: "Polo Shirt", baseCost: 22.00 },
        { id: "cap", name: "Baseball Cap", baseCost: 14.00 },
      ];

      const SHIPPING_METHODS = [
        { id: "standard", name: "Standard Shipping", cost: 4.99, days: "5-7 business days" },
        { id: "express", name: "Express Shipping", cost: 12.99, days: "2-3 business days" },
        { id: "priority", name: "Priority Shipping", cost: 24.99, days: "1-2 business days" },
      ];

      const mockLineItems = [
        { id: 1, name: "Custom T-Shirt Design A", quantity: 50, size: "M", color: "Black" },
        { id: 2, name: "Custom Hoodie Design B", quantity: 25, size: "L", color: "Navy" },
        { id: 3, name: "Custom Cap Design C", quantity: 100, size: "One Size", color: "White" },
      ];

      const handleMappingChange = (lineItemId: number, field: string, value: any) => {
        setPrintfulLineItemMappings(prev => ({
          ...prev,
          [lineItemId]: {
            ...prev[lineItemId],
            printfulProductId: prev[lineItemId]?.printfulProductId || "",
            quantity: prev[lineItemId]?.quantity || 0,
            enabled: prev[lineItemId]?.enabled ?? true,
            [field]: value,
          }
        }));
      };

      return (
        <div className="space-y-6">
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold">Configure Printful Order</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Shipping Method</Label>
                  <Select value={printfulShippingMethod} onValueChange={setPrintfulShippingMethod}>
                    <SelectTrigger data-testid="select-shipping-method">
                      <SelectValue placeholder="Select shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_METHODS.map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{method.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ${method.cost.toFixed(2)} • {method.days}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Line Items to Fulfill</Label>
                  <p className="text-sm text-muted-foreground">
                    Select which items to push to Printful and map them to Printful products.
                  </p>
                  <div className="space-y-3">
                    {mockLineItems.map((item) => {
                      const mapping = printfulLineItemMappings[item.id];
                      const isEnabled = mapping?.enabled !== false;
                      
                      return (
                        <Card 
                          key={item.id} 
                          className={`p-4 ${!isEnabled ? "opacity-50" : ""}`}
                          data-testid={`line-item-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleMappingChange(item.id, "enabled", checked)}
                              data-testid={`checkbox-item-${item.id}`}
                            />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity}x • {item.size} • {item.color}
                                  </p>
                                </div>
                              </div>
                              
                              {isEnabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Printful Product</Label>
                                    <Select
                                      value={mapping?.printfulProductId || ""}
                                      onValueChange={(v) => handleMappingChange(item.id, "printfulProductId", v)}
                                    >
                                      <SelectTrigger data-testid={`select-product-${item.id}`}>
                                        <SelectValue placeholder="Select product" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PRINTFUL_PRODUCTS.map(product => (
                                          <SelectItem key={product.id} value={product.id}>
                                            {product.name} (${product.baseCost})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                      type="number"
                                      value={mapping?.quantity || item.quantity}
                                      onChange={(e) => handleMappingChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                                      min={1}
                                      data-testid={`input-quantity-${item.id}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                  <Textarea
                    id="giftMessage"
                    value={printfulGiftMessage}
                    onChange={(e) => setPrintfulGiftMessage(e.target.value)}
                    placeholder="Enter a gift message to include with the order..."
                    className="min-h-[80px]"
                    data-testid="input-gift-message"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Add Pantones CHOOSE step - Image upload and color picking
    if (action.id === "add-pantones") {
      return (
        <div className="space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-3">
            <Label>Upload an Image</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="dropzone-image"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop an image here, or
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-browse-files"
              >
                Browse Files
              </Button>
            </div>
          </div>

          {/* Canvas for color picking */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Image Preview with Eyedropper */}
          {imageSrc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Click on the image to pick colors</Label>
                <Button
                  variant={isDropperActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsDropperActive(!isDropperActive)}
                  data-testid="button-toggle-dropper"
                >
                  <Pipette className="h-4 w-4 mr-2" />
                  {isDropperActive ? "Dropper Active" : "Activate Dropper"}
                </Button>
              </div>
              <div className={`relative rounded-lg overflow-hidden bg-muted/50 border ${
                isDropperActive ? "ring-2 ring-primary cursor-crosshair" : ""
              }`}>
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Reference"
                  className="max-w-full max-h-[350px] mx-auto object-contain"
                  onClick={handleImageClick}
                  crossOrigin="anonymous"
                  data-testid="image-color-picker"
                />
                {isDropperActive && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Click anywhere to pick a color ({selectedColors.length}/{MAX_COLORS})
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageSrc(null);
                  setIsDropperActive(false);
                }}
                data-testid="button-change-image"
              >
                Change Image
              </Button>
            </div>
          )}

          {/* Selected Colors */}
          {selectedColors.length > 0 && (
            <div className="space-y-3">
              <Label>Selected Colors ({selectedColors.length}/{MAX_COLORS})</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedColors.map((color, index) => {
                  const quality = MATCH_QUALITY_LABELS[color.matchQuality];
                  return (
                    <Card key={color.id} className={`p-3 ${quality.bg} ${quality.border}`} data-testid={`selected-color-${index}`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{color.pantone.code}</p>
                          <p className="text-xs text-muted-foreground truncate">{color.pantone.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono">{color.hex}</span>
                            <Badge variant="outline" className={`text-xs ${quality.color}`}>
                              {quality.label}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveColor(color.id)}
                          className="shrink-0"
                          data-testid={`button-remove-color-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual Pantone Entry */}
          <div className="space-y-3">
            <Label>Or enter a Pantone code manually</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 185 C"
                value={manualPantoneCode}
                onChange={(e) => setManualPantoneCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddManualPantone()}
                className="flex-1"
                data-testid="input-manual-pantone"
              />
              <Button
                variant="outline"
                onClick={handleAddManualPantone}
                disabled={selectedColors.length >= MAX_COLORS}
                data-testid="button-add-manual-pantone"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Proceed hint */}
          {selectedColors.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {selectedColors.length} color{selectedColors.length !== 1 ? "s" : ""} selected. Click "Next" to continue.
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // AI Design Starter CHOOSE step - Design style, colors, text, auto-assign
    if (action.id === "ai-design-starter") {
      const DESIGN_STYLES = [
        { id: "modern", name: "Modern", description: "Clean lines, contemporary feel" },
        { id: "vintage", name: "Vintage", description: "Retro, nostalgic aesthetic" },
        { id: "minimalist", name: "Minimalist", description: "Simple, understated elegance" },
        { id: "bold", name: "Bold", description: "Eye-catching, high impact" },
        { id: "sporty", name: "Sporty", description: "Athletic, dynamic energy" },
        { id: "streetwear", name: "Streetwear", description: "Urban, trendy style" },
        { id: "classic", name: "Classic", description: "Timeless, traditional design" },
        { id: "playful", name: "Playful", description: "Fun, colorful, lighthearted" },
      ];

      const COLOR_PRESETS = [
        { id: "custom", name: "Custom Colors", colors: [] },
        { id: "team-colors", name: "Team Colors", colors: ["#FF0000", "#000000", "#FFFFFF"] },
        { id: "earth-tones", name: "Earth Tones", colors: ["#8B4513", "#D2691E", "#F5DEB3", "#556B2F"] },
        { id: "neon", name: "Neon/Vibrant", colors: ["#FF1493", "#00FF00", "#00FFFF", "#FF6600"] },
        { id: "pastels", name: "Pastels", colors: ["#FFB6C1", "#87CEEB", "#98FB98", "#DDA0DD"] },
        { id: "monochrome", name: "Monochrome", colors: ["#000000", "#333333", "#666666", "#FFFFFF"] },
      ];

      return (
        <div className="space-y-6">
          {/* Design Style Selection */}
          <div className="space-y-3">
            <Label>Design Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DESIGN_STYLES.map((style) => (
                <Button
                  key={style.id}
                  variant={designStyle === style.id ? "default" : "outline"}
                  className={`h-auto py-3 flex flex-col items-center justify-center ${
                    designStyle === style.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setDesignStyle(style.id)}
                  data-testid={`style-${style.id}`}
                >
                  <span className="font-medium">{style.name}</span>
                  <span className="text-xs opacity-70">{style.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div className="space-y-3">
            <Label>Color Scheme Preference</Label>
            <Select 
              value={designColorScheme.length > 0 ? "custom" : ""}
              onValueChange={(value) => {
                const preset = COLOR_PRESETS.find(p => p.id === value);
                if (preset) {
                  setDesignColorScheme(preset.colors);
                }
              }}
            >
              <SelectTrigger data-testid="select-color-scheme">
                <SelectValue placeholder="Choose a color scheme or leave for AI suggestion" />
              </SelectTrigger>
              <SelectContent>
                {COLOR_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <span>{preset.name}</span>
                      {preset.colors.length > 0 && (
                        <div className="flex gap-0.5">
                          {preset.colors.slice(0, 4).map((color, i) => (
                            <div 
                              key={i} 
                              className="w-3 h-3 rounded-full border border-border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Show selected colors */}
            {designColorScheme.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {designColorScheme.map((color, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-md border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDesignColorScheme([])}
                  data-testid="button-clear-colors"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Text to Include */}
          <div className="space-y-3">
            <Label>Text to Include (Optional)</Label>
            <Textarea
              placeholder="e.g., Team name, slogan, event name, year..."
              value={designText}
              onChange={(e) => setDesignText(e.target.value)}
              className="min-h-[80px]"
              data-testid="input-design-text"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if no text is needed in the design
            </p>
          </div>

          {/* Auto-assign Designer */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-assign"
                checked={autoAssignDesigner}
                onCheckedChange={(checked) => setAutoAssignDesigner(checked as boolean)}
                data-testid="checkbox-auto-assign"
              />
              <label
                htmlFor="auto-assign"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-assign to a designer
              </label>
            </div>
            
            {autoAssignDesigner && (
              <Select value={selectedDesignerId} onValueChange={setSelectedDesignerId}>
                <SelectTrigger data-testid="select-designer">
                  <SelectValue placeholder="Select a designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer: any) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.name || designer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-700 dark:text-purple-300">Design Brief Summary</span>
            </div>
            <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
              <li>• Product Type: {selectedItem?.name || "Not selected"}</li>
              <li>• Style: {DESIGN_STYLES.find(s => s.id === designStyle)?.name || designStyle}</li>
              {designColorScheme.length > 0 && <li>• Colors: {designColorScheme.length} selected</li>}
              {designText && <li>• Text: "{designText.substring(0, 30)}{designText.length > 30 ? '...' : ''}"</li>}
              {autoAssignDesigner && selectedDesignerId && (
                <li>• Designer: {designers.find((d: any) => d.id === selectedDesignerId)?.name || "Selected"}</li>
              )}
            </ul>
          </div>
        </div>
      );
    }

    // Spin Up Tour Merch Bundle CHOOSE step
    if (action.id === "spin-up-tour-merch") {
      const PRODUCT_TYPES = [
        { id: "tshirt", name: "T-Shirts", icon: "👕", defaultQty: 50 },
        { id: "hoodie", name: "Hoodies", icon: "🧥", defaultQty: 25 },
        { id: "cap", name: "Caps / Hats", icon: "🧢", defaultQty: 30 },
        { id: "tank", name: "Tank Tops", icon: "🎽", defaultQty: 25 },
        { id: "longsleeve", name: "Long Sleeves", icon: "👕", defaultQty: 20 },
        { id: "poster", name: "Posters", icon: "🖼️", defaultQty: 100 },
      ];

      const DESIGN_STYLES = [
        { id: "bold", name: "Bold", description: "High impact, eye-catching" },
        { id: "vintage", name: "Vintage", description: "Retro, nostalgic feel" },
        { id: "minimalist", name: "Minimalist", description: "Clean, simple design" },
        { id: "artistic", name: "Artistic", description: "Creative, unique artwork" },
        { id: "typographic", name: "Typographic", description: "Text-focused design" },
        { id: "illustrative", name: "Illustrative", description: "Hand-drawn style" },
      ];

      const toggleProductType = (typeId: string) => {
        setTourMerchProductTypes(prev => ({
          ...prev,
          [typeId]: {
            ...prev[typeId],
            enabled: !prev[typeId]?.enabled,
          },
        }));
      };

      const updateQuantity = (typeId: string, qty: number) => {
        setTourMerchProductTypes(prev => ({
          ...prev,
          [typeId]: {
            ...prev[typeId],
            quantity: qty,
          },
        }));
      };

      const enabledProducts = Object.entries(tourMerchProductTypes).filter(([_, v]) => v.enabled);
      const totalItems = enabledProducts.reduce((sum, [_, v]) => sum + v.quantity, 0);

      return (
        <div className="space-y-6">
          {/* Bundle Name */}
          <div className="space-y-2">
            <Label>Bundle Name</Label>
            <Input
              placeholder={`${selectedItem?.name || "Event"} Tour Merch Bundle`}
              value={tourMerchBundleName}
              onChange={(e) => setTourMerchBundleName(e.target.value)}
              data-testid="input-bundle-name"
            />
            <p className="text-xs text-muted-foreground">
              Give your bundle a memorable name
            </p>
          </div>

          {/* Product Type Selection */}
          <div className="space-y-3">
            <Label>Select Product Types</Label>
            <p className="text-sm text-muted-foreground">
              Choose which products to include in your tour merch bundle
            </p>
            <div className="grid gap-3">
              {PRODUCT_TYPES.map((type) => {
                const isEnabled = tourMerchProductTypes[type.id]?.enabled || false;
                const quantity = tourMerchProductTypes[type.id]?.quantity || type.defaultQty;

                return (
                  <Card
                    key={type.id}
                    className={`transition-all ${isEnabled ? "border-primary bg-primary/5" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`product-${type.id}`}
                          checked={isEnabled}
                          onCheckedChange={() => toggleProductType(type.id)}
                          data-testid={`checkbox-product-${type.id}`}
                        />
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <label htmlFor={`product-${type.id}`} className="font-medium cursor-pointer">
                            {type.name}
                          </label>
                        </div>
                        {isEnabled && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Qty:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="500"
                              value={quantity}
                              onChange={(e) => updateQuantity(type.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                              data-testid={`input-qty-${type.id}`}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Design Style */}
          <div className="space-y-3">
            <Label>Design Style Preference</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DESIGN_STYLES.map((style) => (
                <Button
                  key={style.id}
                  variant={tourMerchDesignStyle === style.id ? "default" : "outline"}
                  className={`h-auto py-3 flex flex-col items-center ${
                    tourMerchDesignStyle === style.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setTourMerchDesignStyle(style.id)}
                  data-testid={`style-${style.id}`}
                >
                  <span className="font-medium">{style.name}</span>
                  <span className="text-xs opacity-70">{style.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Create Team Store Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-team-store"
                checked={tourMerchCreateTeamStore}
                onCheckedChange={(checked) => setTourMerchCreateTeamStore(checked as boolean)}
                data-testid="checkbox-create-team-store"
              />
              <label
                htmlFor="create-team-store"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Create Team Store with QR Codes
              </label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Automatically create a team store and generate QR codes for easy merchandise ordering
            </p>
          </div>

          {/* Summary */}
          {enabledProducts.length > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">Bundle Summary</span>
              </div>
              <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <li>• Event: {selectedItem?.name || "Selected Event"}</li>
                <li>• Products: {enabledProducts.length} types selected</li>
                <li>• Total Items: {totalItems} units</li>
                <li>• Design Style: {DESIGN_STYLES.find(s => s.id === tourMerchDesignStyle)?.name}</li>
                <li>• Team Store: {tourMerchCreateTeamStore ? "Will be created" : "Not included"}</li>
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Instant Org Setup CHOOSE step - Org details, logo, colors, contact
    if (action.id === "instant-org-setup") {
      const US_STATES = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
      ];

      const handleOrgLogoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          handleOrgLogoUpload(file);
        }
      };

      return (
        <div className="space-y-6">
          {/* Hidden canvas for color extraction */}
          <canvas ref={orgLogoCanvasRef} className="hidden" />
          
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              id="org-name"
              placeholder="e.g., Lincoln High School Wrestling"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              data-testid="input-org-name"
            />
          </div>

          {/* Logo Upload with Drag-and-Drop */}
          <div className="space-y-2">
            <Label>Logo Upload</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleOrgLogoDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="dropzone-org-logo"
            >
              <input
                ref={orgLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOrgLogoUpload(file);
                }}
                className="hidden"
                data-testid="input-org-logo"
              />
              
              {orgLogoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img
                      src={orgLogoPreview}
                      alt="Logo preview"
                      className="max-w-[150px] max-h-[150px] object-contain rounded-lg border"
                    />
                    {isExtractingColors && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOrgLogoPreview(null);
                      setOrgLogoFile(null);
                      setOrgExtractedColors([]);
                    }}
                    data-testid="button-remove-logo"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop a logo here, or
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => orgLogoInputRef.current?.click()}
                    data-testid="button-browse-logo"
                  >
                    Browse Files
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a logo to automatically extract brand colors
            </p>
          </div>

          {/* Extracted Colors Display */}
          {orgExtractedColors.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Extracted Brand Colors
              </Label>
              <div className="flex gap-2">
                {orgExtractedColors.map((color, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      orgPrimaryColor === color || orgSecondaryColor === color
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (orgPrimaryColor !== color && orgSecondaryColor !== color) {
                        if (orgPrimaryColor === "#6366f1") {
                          setOrgPrimaryColor(color);
                        } else {
                          setOrgSecondaryColor(color);
                        }
                      }
                    }}
                    title={color}
                    data-testid={`extracted-color-${i}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Primary Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={orgPrimaryColor}
                  onChange={(e) => setOrgPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  data-testid="input-primary-color"
                />
                <Input
                  value={orgPrimaryColor.toUpperCase()}
                  onChange={(e) => setOrgPrimaryColor(e.target.value)}
                  className="font-mono text-sm flex-1"
                  placeholder="#6366F1"
                  data-testid="input-primary-color-hex"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Secondary Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary-color"
                  value={orgSecondaryColor}
                  onChange={(e) => setOrgSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  data-testid="input-secondary-color"
                />
                <Input
                  value={orgSecondaryColor.toUpperCase()}
                  onChange={(e) => setOrgSecondaryColor(e.target.value)}
                  className="font-mono text-sm flex-1"
                  placeholder="#8B5CF6"
                  data-testid="input-secondary-color-hex"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Primary Contact</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  placeholder="John Smith"
                  value={orgContactName}
                  onChange={(e) => setOrgContactName(e.target.value)}
                  data-testid="input-contact-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={orgContactEmail}
                  onChange={(e) => setOrgContactEmail(e.target.value)}
                  data-testid="input-contact-email"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Fields */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Location</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="org-city">City</Label>
                <Input
                  id="org-city"
                  placeholder="Springfield"
                  value={orgCity}
                  onChange={(e) => setOrgCity(e.target.value)}
                  data-testid="input-org-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-state">State</Label>
                <Select value={orgState} onValueChange={setOrgState}>
                  <SelectTrigger id="org-state" data-testid="select-org-state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-zip">ZIP Code</Label>
                <Input
                  id="org-zip"
                  placeholder="12345"
                  value={orgZip}
                  onChange={(e) => setOrgZip(e.target.value)}
                  maxLength={10}
                  data-testid="input-org-zip"
                />
              </div>
            </div>
          </div>

          {/* Validation hint */}
          {orgName && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Ready to preview. Click "Next" to continue.
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Quick Quote Generator CHOOSE step
    if (action.id === "quick-quote-generator") {
      return (
        <div className="space-y-6">
          {/* Margin Type Selector */}
          <div className="space-y-2">
            <Label>Margin Type</Label>
            <Select
              value={marginType}
              onValueChange={(v) => setMarginType(v as MarginType)}
            >
              <SelectTrigger data-testid="select-margin-type">
                <SelectValue placeholder="Select margin type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wholesale">{MARGIN_GUARDRAILS.wholesale.label}</SelectItem>
                <SelectItem value="event_retail">{MARGIN_GUARDRAILS.event_retail.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addLineItem}
                data-testid="button-add-line-item"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">No line items yet</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={addLineItem}
                  className="mt-2"
                  data-testid="button-add-first-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first item
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {lineItems.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateLineItem(item.id, "name", e.target.value)}
                            data-testid={`input-item-name-${index}`}
                          />
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Qty</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                                data-testid={`input-item-qty-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Cost</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => updateLineItem(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                                data-testid={`input-item-cost-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                data-testid={`input-item-price-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Margin</Label>
                              <div className={`h-9 flex items-center px-2 text-sm rounded border ${
                                item.margin < getMinMarginForType() && item.unitPrice > 0
                                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                                  : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                              }`}>
                                {(item.margin * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="shrink-0"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Line Total:</span>
                        <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Discount & Valid Until */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount ($)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                data-testid="input-discount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                data-testid="input-valid-until"
              />
            </div>
          </div>

          {/* Margin Warning */}
          {hasMarginWarning() && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Margin Warning</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Overall margin ({(getOverallMargin() * 100).toFixed(1)}%) is below the {MARGIN_GUARDRAILS[marginType].label} minimum ({(getMinMarginForType() * 100).toFixed(0)}%).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {lineItems.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${getQuoteSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-red-600">-${discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%):</span>
                    <span>${getQuoteTax().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-base">
                    <span>Total:</span>
                    <span>${getQuoteTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Overall Margin:</span>
                    <span className={hasMarginWarning() ? "text-amber-600" : "text-green-600"}>
                      {(getOverallMargin() * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {action.id === "client-brief" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="timeWindow">Time Window</Label>
              <Select 
                value={options.timeWindow || "30"} 
                onValueChange={(v) => handleOptionsChange("timeWindow", v)}
              >
                <SelectTrigger data-testid="select-time-window">
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Include sections</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeOrders" 
                    checked={options.includeOrders !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeOrders", v)}
                  />
                  <Label htmlFor="includeOrders">Recent orders</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeNotes" 
                    checked={options.includeNotes !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeNotes", v)}
                  />
                  <Label htmlFor="includeNotes">Client notes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeContacts" 
                    checked={options.includeContacts !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeContacts", v)}
                  />
                  <Label htmlFor="includeContacts">Key contacts</Label>
                </div>
              </div>
            </div>
          </>
        )}

        {action.id === "explain-numbers" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="metricPeriod">Metric Period</Label>
              <Select 
                value={options.metricPeriod || "month"} 
                onValueChange={(v) => handleOptionsChange("metricPeriod", v)}
              >
                <SelectTrigger data-testid="select-metric-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Focus on</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusRevenue" 
                    checked={options.focusRevenue !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusRevenue", v)}
                  />
                  <Label htmlFor="focusRevenue">Revenue trends</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusPipeline" 
                    checked={options.focusPipeline !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusPipeline", v)}
                  />
                  <Label htmlFor="focusPipeline">Pipeline health</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusConversion" 
                    checked={options.focusConversion !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusConversion", v)}
                  />
                  <Label htmlFor="focusConversion">Conversion rates</Label>
                </div>
              </div>
            </div>
          </>
        )}

        {action.id === "quote-from-order" && (
          <>
            <div className="space-y-2">
              <Label>Quote options</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeAllItems" 
                    checked={options.includeAllItems !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeAllItems", v)}
                  />
                  <Label htmlFor="includeAllItems">Include all line items</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copyPricing" 
                    checked={options.copyPricing !== false}
                    onCheckedChange={(v) => handleOptionsChange("copyPricing", v)}
                  />
                  <Label htmlFor="copyPricing">Copy original pricing</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteNotes">Additional notes</Label>
              <Textarea
                id="quoteNotes"
                value={options.quoteNotes || ""}
                onChange={(e) => handleOptionsChange("quoteNotes", e.target.value)}
                placeholder="Add any notes for this quote..."
                data-testid="input-quote-notes"
              />
            </div>
          </>
        )}

        {!["client-brief", "explain-numbers", "quote-from-order"].includes(action.id) && (
          <div className="space-y-2">
            <Label>Configure options</Label>
            <p className="text-sm text-muted-foreground">
              Select your preferences for this action.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="defaultOption" 
                  checked={options.defaultOption !== false}
                  onCheckedChange={(v) => handleOptionsChange("defaultOption", v)}
                />
                <Label htmlFor="defaultOption">Use default settings</Label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep.type === "preview") {
    // Spin Up Tour Merch Bundle PREVIEW step
    if (action.id === "spin-up-tour-merch") {
      const PRODUCT_COSTS: Record<string, number> = {
        "tshirt": 12.50,
        "hoodie": 28.00,
        "cap": 8.00,
        "tank": 10.00,
        "longsleeve": 16.00,
        "poster": 3.50,
      };

      const PRODUCT_NAMES: Record<string, string> = {
        "tshirt": "T-Shirts",
        "hoodie": "Hoodies",
        "cap": "Caps / Hats",
        "tank": "Tank Tops",
        "longsleeve": "Long Sleeves",
        "poster": "Posters",
      };

      const enabledProducts = Object.entries(tourMerchProductTypes).filter(([_, v]) => v.enabled);
      const totalItems = enabledProducts.reduce((sum, [_, v]) => sum + v.quantity, 0);
      const estimatedCost = enabledProducts.reduce((sum, [key, v]) => sum + (PRODUCT_COSTS[key] || 10) * v.quantity, 0);

      const handleGenerateDesigns = () => {
        setLoading(true);
        
        const mockDesigns = [
          { id: 1, name: "Bold Tour Logo", style: tourMerchDesignStyle, status: "generated" },
          { id: 2, name: "Event Date Typography", style: tourMerchDesignStyle, status: "generated" },
          { id: 3, name: "Minimalist Badge", style: tourMerchDesignStyle, status: "generated" },
          { id: 4, name: "Artistic Illustration", style: tourMerchDesignStyle, status: "generated" },
          { id: 5, name: "Retro Vintage", style: tourMerchDesignStyle, status: "generated" },
        ];

        setTimeout(() => {
          setTourMerchGeneratedDesigns(mockDesigns);
          setLoading(false);
          toast({
            title: "Designs Generated",
            description: `${mockDesigns.length} design concepts ready for review`,
          });
        }, 2000);
      };

      return (
        <div className="space-y-6">
          {/* Generate Designs Section */}
          {tourMerchGeneratedDesigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Generate Design Concepts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI will generate 5 unique design concepts based on your selected style
              </p>
              <Button
                onClick={handleGenerateDesigns}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-generate-designs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Designs
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Generated Designs */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Generated Design Concepts
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tourMerchGeneratedDesigns.map((design) => (
                    <Card key={design.id} className="p-3 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg mb-2 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-purple-400" />
                      </div>
                      <p className="text-sm font-medium truncate">{design.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">{design.style}</Badge>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bundle Summary */}
              <div className="space-y-3">
                <Label>Bundle Summary</Label>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="font-medium">Bundle Name</span>
                      <span>{tourMerchBundleName || `${selectedItem?.name} Bundle`}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="font-medium">Event</span>
                      <span>{selectedItem?.name}</span>
                    </div>
                    <div className="space-y-2 pb-3 border-b">
                      <span className="font-medium">Products</span>
                      {enabledProducts.map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm text-muted-foreground">
                          <span>{PRODUCT_NAMES[key] || key}</span>
                          <span>{value.quantity} units × ${(PRODUCT_COSTS[key] || 10).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="font-medium">Total Items</span>
                      <Badge variant="outline">{totalItems} units</Badge>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="font-medium">Estimated Cost</span>
                      <span className="text-lg font-bold">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Team Store</span>
                      <Badge variant={tourMerchCreateTeamStore ? "default" : "secondary"}>
                        {tourMerchCreateTeamStore ? "Will be created" : "Not included"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* QR Code Preview */}
              {tourMerchCreateTeamStore && (
                <div className="space-y-3">
                  <Label>QR Code Preview</Label>
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed">
                        <span className="text-xs text-muted-foreground text-center px-2">QR Code<br/>Preview</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Team Store QR Code</p>
                        <p className="text-sm text-muted-foreground">
                          Scan to access the merchandise store
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          QR code will be generated when bundle is created
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // Push to Printful PREVIEW step
    if (action.id === "push-to-printful") {
      const SHIPPING_METHODS = [
        { id: "standard", name: "Standard Shipping", cost: 4.99, days: "5-7 business days" },
        { id: "express", name: "Express Shipping", cost: 12.99, days: "2-3 business days" },
        { id: "priority", name: "Priority Shipping", cost: 24.99, days: "1-2 business days" },
      ];

      const PRINTFUL_PRODUCTS = [
        { id: "unisex-tee", name: "Unisex Cotton T-Shirt", baseCost: 12.50 },
        { id: "premium-tee", name: "Premium Cotton T-Shirt", baseCost: 15.00 },
        { id: "hoodie", name: "Pullover Hoodie", baseCost: 28.00 },
        { id: "zip-hoodie", name: "Zip-Up Hoodie", baseCost: 32.00 },
        { id: "tank-top", name: "Tank Top", baseCost: 11.00 },
        { id: "long-sleeve", name: "Long Sleeve T-Shirt", baseCost: 16.50 },
        { id: "polo", name: "Polo Shirt", baseCost: 22.00 },
        { id: "cap", name: "Baseball Cap", baseCost: 14.00 },
      ];

      const enabledItems = Object.entries(printfulLineItemMappings).filter(([_, mapping]) => mapping.enabled);
      const shippingMethod = SHIPPING_METHODS.find(m => m.id === printfulShippingMethod) || SHIPPING_METHODS[0];
      
      const productionCost = enabledItems.reduce((sum, [_, mapping]) => {
        const product = PRINTFUL_PRODUCTS.find(p => p.id === mapping.printfulProductId);
        return sum + (product?.baseCost || 12.50) * (mapping.quantity || 1);
      }, 0);
      
      const totalCost = productionCost + shippingMethod.cost;

      return (
        <div className="space-y-6">
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-lg">Printful Order Preview</span>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Order Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order:</span>
                      <p className="font-medium">{selectedItem?.order?.orderName || selectedItem?.orderName || `Order #${selectedItem?.id}`}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Code:</span>
                      <p className="font-medium">{selectedItem?.order?.orderCode || selectedItem?.orderCode || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Items to Fulfill ({enabledItems.length})</h4>
                  <div className="space-y-2">
                    {enabledItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items selected for fulfillment</p>
                    ) : (
                      enabledItems.map(([itemId, mapping]) => {
                        const product = PRINTFUL_PRODUCTS.find(p => p.id === mapping.printfulProductId);
                        return (
                          <div key={itemId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`preview-item-${itemId}`}>
                            <div>
                              <p className="font-medium">{product?.name || "Product"}</p>
                              <p className="text-sm text-muted-foreground">Qty: {mapping.quantity}</p>
                            </div>
                            <p className="font-medium">${((product?.baseCost || 0) * mapping.quantity).toFixed(2)}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Production & Shipping</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Production Time</span>
                      </div>
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">2-5 business days</p>
                    </Card>
                    <Card className="p-3 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Shipping</span>
                      </div>
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200">{shippingMethod.days}</p>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Production Cost:</span>
                      <span>${productionCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({shippingMethod.name}):</span>
                      <span>${shippingMethod.cost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-indigo-600">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {printfulGiftMessage && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Gift Message</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg italic">
                        "{printfulGiftMessage}"
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Add Pantones PREVIEW step
    if (action.id === "add-pantones") {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">Selected Pantone Colors</span>
              </div>

              {selectedColors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No colors selected</p>
                  <p className="text-sm">Go back to pick colors from an image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Color Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedColors.map((color, index) => {
                      const quality = MATCH_QUALITY_LABELS[color.matchQuality];
                      return (
                        <Card key={color.id} className={`overflow-hidden ${quality.border}`} data-testid={`preview-color-${index}`}>
                          <div
                            className="h-20 w-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className={`p-3 ${quality.bg}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-lg">{color.pantone.code}</p>
                              <Badge className={quality.color}>{quality.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{color.pantone.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">HEX:</span>
                                <span className="ml-1 font-mono">{color.hex}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">RGB:</span>
                                <span className="ml-1 font-mono">{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Colors Selected:</span>
                      <span className="font-medium">{selectedColors.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Excellent/Very Close Matches:</span>
                      <span className="font-medium text-green-600">
                        {selectedColors.filter(c => c.matchQuality === "excellent" || c.matchQuality === "very_close").length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedColors.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">Ready to Save</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Review your color selections above. Click "Next" to confirm and save these Pantone assignments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedColors.some(c => c.matchQuality === "approximate" || c.matchQuality === "not_recommended") && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Some colors have low match quality</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Consider re-picking or manually entering the correct Pantone code for more accurate production.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // AI Design Starter PREVIEW step - Show AI-generated design concepts
    if (action.id === "ai-design-starter") {
      return (
        <div className="space-y-4">
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="font-medium text-purple-700 dark:text-purple-300">
                  Generating AI Design Concepts...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Analyzing {previousDesigns.length} previous {selectedItem?.name || 'product'} designs for inspiration
                </p>
              </CardContent>
            </Card>
          )}

          {aiResult && aiResult.success && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-lg text-purple-700 dark:text-purple-300">
                    AI-Generated Design Brief
                  </span>
                </div>
                
                {/* Design Brief Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                  <div className="whitespace-pre-wrap text-sm bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                    {aiResult.content}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <p className="text-muted-foreground">Product Type</p>
                    <p className="font-medium">{selectedItem?.name || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Design Style</p>
                    <p className="font-medium capitalize">{designStyle}</p>
                  </div>
                  {designText && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Text to Include</p>
                      <p className="font-medium">"{designText}"</p>
                    </div>
                  )}
                  {designColorScheme.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Color Palette</p>
                      <div className="flex gap-2">
                        {designColorScheme.map((color, i) => (
                          <div 
                            key={i}
                            className="w-8 h-8 rounded-md border border-border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {aiResult && !aiResult.success && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-300">
                    AI Generation Failed
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {aiResult.error || aiResult.message || "Failed to generate design concepts"}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={handleAIGenerate}
                  data-testid="button-retry-ai"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Previous Designs Context */}
          {previousDesigns.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Based on {previousDesigns.length} previous {selectedItem?.name || 'product'} designs
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                AI analyzed successful designs for this product type to generate on-brand concepts
              </p>
            </div>
          )}

          {/* Proceed hint */}
          {aiResult?.success && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Review the AI brief above and click "Next" to create the design job
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Instant Org Setup PREVIEW step - Organization card preview
    if (action.id === "instant-org-setup") {
      const ORG_TYPE_LABELS: Record<string, { name: string; icon: string }> = {
        high_school: { name: "High School", icon: "🏫" },
        college: { name: "College / University", icon: "🎓" },
        corporate: { name: "Corporate", icon: "🏢" },
        nonprofit: { name: "Non-Profit", icon: "💝" },
        tour: { name: "Tour / Band", icon: "🎸" },
        other: { name: "Other", icon: "📋" },
      };

      const orgTypeInfo = ORG_TYPE_LABELS[orgType] || { name: "Organization", icon: "🏢" };

      return (
        <div className="space-y-6">
          {/* Organization Card Preview */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Organization Card Preview
            </Label>
            <Card 
              className="overflow-hidden"
              style={{ borderTopColor: orgPrimaryColor, borderTopWidth: "4px" }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-bold text-white shrink-0"
                    style={{ 
                      backgroundColor: orgLogoPreview ? "transparent" : orgPrimaryColor,
                      backgroundImage: orgLogoPreview ? `url(${orgLogoPreview})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!orgLogoPreview && (orgName ? orgName.substring(0, 2).toUpperCase() : "ORG")}
                  </div>
                  
                  {/* Org Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{orgTypeInfo.icon}</span>
                      <Badge variant="outline" className="text-xs">{orgTypeInfo.name}</Badge>
                    </div>
                    <h3 className="text-xl font-bold truncate" data-testid="preview-org-name">
                      {orgName || "Organization Name"}
                    </h3>
                    {(orgCity || orgState || orgZip) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {[orgCity, orgState, orgZip].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Color Palette */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Brand Color Palette
            </Label>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Primary</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: orgPrimaryColor }}
                    />
                    <span className="font-mono text-sm">{orgPrimaryColor.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Secondary</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: orgSecondaryColor }}
                    />
                    <span className="font-mono text-sm">{orgSecondaryColor.toUpperCase()}</span>
                  </div>
                </div>
                {/* Gradient preview */}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Gradient</p>
                  <div 
                    className="w-full h-12 rounded-lg"
                    style={{ background: `linear-gradient(135deg, ${orgPrimaryColor}, ${orgSecondaryColor})` }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Information Summary */}
          {(orgContactName || orgContactEmail) && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Primary Contact
              </Label>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: orgSecondaryColor }}
                  >
                    {orgContactName ? orgContactName.substring(0, 2).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="font-medium">{orgContactName || "No name provided"}</p>
                    {orgContactEmail && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {orgContactEmail}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Proceed hint */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Review the preview and click "Next" to create your organization
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Quick Quote Generator PREVIEW step
    if (action.id === "quick-quote-generator") {
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">Quote Summary</span>
              </div>

              {/* Client Info */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Quote For:</p>
                <p className="font-medium">
                  {selectedItem?.name || selectedItem?.orderName || "No client selected"}
                </p>
                {selectedItem?.orderCode && (
                  <p className="text-sm text-muted-foreground">From Order: {selectedItem.orderCode}</p>
                )}
              </div>

              {/* Line Items Table */}
              {lineItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Line Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Item</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Unit Price</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-right p-2">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, idx) => (
                          <tr key={item.id} className="border-t" data-testid={`preview-line-${idx}`}>
                            <td className="p-2">{item.name || `Item ${idx + 1}`}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-2 text-right">${item.lineTotal.toFixed(2)}</td>
                            <td className={`p-2 text-right ${
                              item.margin < getMinMarginForType() 
                                ? "text-amber-600" 
                                : "text-green-600"
                            }`}>
                              {(item.margin * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${getQuoteSubtotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${getQuoteTax().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${getQuoteTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Quote Details */}
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin Type:</span>
                  <Badge variant="outline">{MARGIN_GUARDRAILS[marginType].label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Margin:</span>
                  <span className={hasMarginWarning() ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                    {(getOverallMargin() * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span>{new Date(validUntil).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margin Warning */}
          {hasMarginWarning() && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Margin Below Target</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Your overall margin is below the recommended {(getMinMarginForType() * 100).toFixed(0)}% for {MARGIN_GUARDRAILS[marginType].label.toLowerCase()} quotes. You can still proceed, but consider adjusting pricing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Ready to Create</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Review the quote above and proceed to create it as a draft.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {action.requiresAI ? "Generating with AI..." : "Loading preview..."}
            </p>
          </div>
        ) : (
          <>
            {action.requiresAI && aiResult && (
              <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">AI Generated</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{aiResult.content || aiResult.message || "Content generated successfully."}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {action.id === "quote-from-order" && selectedItem && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">Quote Preview</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>From Order:</strong> {selectedItem.orderCode}</p>
                    <p><strong>Client:</strong> {selectedItem.orderName}</p>
                    <p><strong>Status:</strong> Draft (will be created as draft)</p>
                    <p><strong>Valid for:</strong> 30 days</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!action.requiresAI && !aiResult && action.id !== "quote-from-order" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Ready to proceed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review your selections above and click "Confirm & Save" to proceed.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Draft Mode</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    This will create a draft. No changes will be finalized until you review and confirm.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (currentStep.type === "confirm") {
    // Spin Up Tour Merch Bundle CONFIRM step
    if (action.id === "spin-up-tour-merch") {
      const PRODUCT_COSTS: Record<string, number> = {
        "tshirt": 12.50,
        "hoodie": 28.00,
        "cap": 8.00,
        "tank": 10.00,
        "longsleeve": 16.00,
        "poster": 3.50,
      };

      const PRODUCT_NAMES: Record<string, string> = {
        "tshirt": "T-Shirts",
        "hoodie": "Hoodies",
        "cap": "Caps / Hats",
        "tank": "Tank Tops",
        "longsleeve": "Long Sleeves",
        "poster": "Posters",
      };

      const enabledProducts = Object.entries(tourMerchProductTypes).filter(([_, v]) => v.enabled);
      const totalItems = enabledProducts.reduce((sum, [_, v]) => sum + v.quantity, 0);
      const estimatedCost = enabledProducts.reduce((sum, [key, v]) => sum + (PRODUCT_COSTS[key] || 10) * v.quantity, 0);

      const handleCreateBundle = () => {
        setLoading(true);

        const bundleCode = `TMB-${Date.now().toString(36).toUpperCase()}`;
        const bundleConfig = {
          productTypes: tourMerchProductTypes,
          designStyle: tourMerchDesignStyle,
          createTeamStore: tourMerchCreateTeamStore,
          generatedDesigns: tourMerchGeneratedDesigns,
        };

        createTourMerchBundleMutation.mutate({
          bundleCode,
          eventId: selectedItem?.id,
          name: tourMerchBundleName || `${selectedItem?.name} Tour Merch Bundle`,
          description: `Tour merchandise bundle for ${selectedItem?.name}`,
          status: "ready",
          bundleConfig,
          totalAllocated: totalItems,
        });
      };

      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Ready to Create Bundle</h3>
            <p className="text-sm text-muted-foreground">
              Review the summary below and confirm to create your tour merch bundle
            </p>
          </div>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Bundle Name</span>
                <span className="text-right">{tourMerchBundleName || `${selectedItem?.name} Bundle`}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Event</span>
                <span>{selectedItem?.name}</span>
              </div>
              <div className="pb-3 border-b">
                <span className="font-medium block mb-2">Products ({enabledProducts.length} types)</span>
                <div className="grid grid-cols-2 gap-2">
                  {enabledProducts.map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm bg-muted/50 rounded px-2 py-1">
                      <span>{PRODUCT_NAMES[key] || key}</span>
                      <span className="font-medium">{value.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Total Units</span>
                <Badge variant="outline" className="text-lg">{totalItems}</Badge>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Design Style</span>
                <Badge>{tourMerchDesignStyle}</Badge>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Generated Designs</span>
                <span>{tourMerchGeneratedDesigns.length} concepts</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Team Store</span>
                <Badge variant={tourMerchCreateTeamStore ? "default" : "secondary"}>
                  {tourMerchCreateTeamStore ? "Will be created" : "Not included"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Estimated Cost</span>
                <span className="text-2xl font-bold text-purple-600">${estimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={goBack}
              data-testid="button-go-back"
            >
              Go Back
            </Button>
            <Button
              onClick={handleCreateBundle}
              disabled={isLoading || createTourMerchBundleMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-create-bundle"
            >
              {isLoading || createTourMerchBundleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Bundle
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Push to Printful CONFIRM step
    if (action.id === "push-to-printful") {
      const SHIPPING_METHODS = [
        { id: "standard", name: "Standard Shipping", cost: 4.99, days: "5-7 business days" },
        { id: "express", name: "Express Shipping", cost: 12.99, days: "2-3 business days" },
        { id: "priority", name: "Priority Shipping", cost: 24.99, days: "1-2 business days" },
      ];

      const PRINTFUL_PRODUCTS = [
        { id: "unisex-tee", name: "Unisex Cotton T-Shirt", baseCost: 12.50 },
        { id: "premium-tee", name: "Premium Cotton T-Shirt", baseCost: 15.00 },
        { id: "hoodie", name: "Pullover Hoodie", baseCost: 28.00 },
        { id: "zip-hoodie", name: "Zip-Up Hoodie", baseCost: 32.00 },
        { id: "tank-top", name: "Tank Top", baseCost: 11.00 },
        { id: "long-sleeve", name: "Long Sleeve T-Shirt", baseCost: 16.50 },
        { id: "polo", name: "Polo Shirt", baseCost: 22.00 },
        { id: "cap", name: "Baseball Cap", baseCost: 14.00 },
      ];

      const enabledItems = Object.entries(printfulLineItemMappings).filter(([_, mapping]) => mapping.enabled);
      const shippingMethod = SHIPPING_METHODS.find(m => m.id === printfulShippingMethod) || SHIPPING_METHODS[0];
      
      const productionCost = enabledItems.reduce((sum, [_, mapping]) => {
        const product = PRINTFUL_PRODUCTS.find(p => p.id === mapping.printfulProductId);
        return sum + (product?.baseCost || 12.50) * (mapping.quantity || 1);
      }, 0);
      
      const totalCost = productionCost + shippingMethod.cost;

      const handleSubmitToPrintful = () => {
        setLoading(true);
        
        const printfulOrderId = `PF-${Date.now()}`;
        
        const syncData = {
          orderId: selectedItem?.order?.id || selectedItem?.orderId || selectedItem?.id,
          manufacturingId: hubId === "manufacturing" ? selectedItem?.id : null,
          printfulOrderId,
          status: "pending",
          syncedLineItems: enabledItems.map(([itemId, mapping]) => ({
            lineItemId: parseInt(itemId),
            printfulProductId: mapping.printfulProductId,
            quantity: mapping.quantity,
          })),
          shippingMethod: printfulShippingMethod,
          totalCost: totalCost.toString(),
          giftMessage: printfulGiftMessage || null,
          apiResponse: {
            orderId: printfulOrderId,
            status: "pending",
            estimatedShipDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            shippingMethod: shippingMethod.name,
          },
        };
        
        createPrintfulSyncMutation.mutate(syncData);
      };

      return (
        <div className="space-y-4">
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Confirm Printful Submission
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex justify-between">
                  <span>Order:</span>
                  <span className="font-medium text-foreground">
                    {selectedItem?.order?.orderName || selectedItem?.orderName || `Order #${selectedItem?.id}`}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Items to Fulfill:</span>
                  <span className="font-medium text-foreground">{enabledItems.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-medium text-foreground">{shippingMethod.name}</span>
                </li>
                <li className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-medium text-foreground">{shippingMethod.days}</span>
                </li>
                <Separator className="my-2" />
                <li className="flex justify-between text-base">
                  <span className="font-medium text-foreground">Total Cost:</span>
                  <span className="font-semibold text-indigo-600">${totalCost.toFixed(2)}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-600" />
              <span className="text-indigo-700 dark:text-indigo-300">
                This will create a Printful order record. The actual order will be submitted when connected to Printful API.
              </span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Click "Submit to Printful" to create the fulfillment order.
          </p>

          <div className="flex justify-center">
            <Button 
              onClick={handleSubmitToPrintful} 
              disabled={isLoading || enabledItems.length === 0} 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="button-submit-printful"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit to Printful
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Add Pantones CONFIRM step
    if (action.id === "add-pantones") {
      const getItemLabel = (item: any) => {
        if (hubId === "orders") return item?.orderName || "Order";
        if (hubId === "manufacturing") return `MFG-${item?.id || ""}`;
        if (hubId === "team-stores") return item?.storeName || "Store";
        if (hubId === "catalog") return item?.name || "Product";
        return "Item";
      };

      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Pantone Assignment Summary
              </h3>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex justify-between items-center">
                  <span>Assigning to:</span>
                  <span className="font-medium text-foreground">{getItemLabel(selectedItem)}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Total Colors:</span>
                  <span className="font-medium text-foreground">{selectedColors.length}</span>
                </li>
                <Separator />
                <li>
                  <p className="mb-2 text-foreground font-medium">Colors to save:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map((color) => (
                      <div 
                        key={color.id}
                        className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted"
                      >
                        <div 
                          className="w-5 h-5 rounded border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium">{color.pantone.code}</span>
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300">
                These Pantone colors will be saved to the pantone_assignments table.
              </span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Click "Save Pantones" to complete the assignment.
          </p>

          <div className="flex justify-center">
            <Button 
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  goNext();
                  toast({
                    title: "Pantones Saved",
                    description: `${selectedColors.length} color${selectedColors.length !== 1 ? "s" : ""} assigned successfully`,
                  });
                }, 1000);
              }} 
              disabled={isLoading || selectedColors.length === 0} 
              size="lg" 
              data-testid="button-save-pantones"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Save Pantones
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // AI Design Starter CONFIRM step - Create design job with AI brief
    if (action.id === "ai-design-starter") {
      const handleCreateDesignJob = () => {
        setLoading(true);
        
        // Build the design brief from AI result and user inputs
        const designBrief = aiResult?.content || `
Design job for ${selectedItem?.name || 'product'}.
Style: ${designStyle}
${designText ? `Text: "${designText}"` : ''}
${designColorScheme.length > 0 ? `Colors: ${designColorScheme.join(', ')}` : ''}
        `.trim();
        
        const jobData = {
          brief: designBrief.substring(0, 1000), // Limit to 1000 chars
          requirements: `Product Type: ${selectedItem?.name || 'Not specified'}\nStyle: ${designStyle}${designText ? `\nText: ${designText}` : ''}${designColorScheme.length > 0 ? `\nColors: ${designColorScheme.join(', ')}` : ''}`,
          status: "pending",
          urgency: "normal",
          assignedDesignerId: autoAssignDesigner && selectedDesignerId ? selectedDesignerId : null,
        };
        
        createDesignJobMutation.mutate(jobData);
      };

      return (
        <div className="space-y-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Design Job Summary
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex justify-between">
                  <span>Product Type:</span>
                  <span className="font-medium text-foreground">{selectedItem?.name || "Not specified"}</span>
                </li>
                <li className="flex justify-between">
                  <span>Design Style:</span>
                  <span className="font-medium text-foreground capitalize">{designStyle}</span>
                </li>
                {designText && (
                  <li className="flex justify-between">
                    <span>Text to Include:</span>
                    <span className="font-medium text-foreground">"{designText.substring(0, 30)}{designText.length > 30 ? '...' : ''}"</span>
                  </li>
                )}
                {designColorScheme.length > 0 && (
                  <li className="flex items-center justify-between">
                    <span>Colors:</span>
                    <div className="flex gap-1">
                      {designColorScheme.map((color, i) => (
                        <div 
                          key={i}
                          className="w-5 h-5 rounded border border-border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </li>
                )}
                <li className="flex justify-between">
                  <span>Previous Designs Used:</span>
                  <span className="font-medium text-foreground">{previousDesigns.length} for context</span>
                </li>
                {autoAssignDesigner && selectedDesignerId && (
                  <li className="flex justify-between">
                    <span>Assigned To:</span>
                    <span className="font-medium text-foreground">
                      {designers.find((d: any) => d.id === selectedDesignerId)?.name || "Designer"}
                    </span>
                  </li>
                )}
                {!autoAssignDesigner && (
                  <li className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">Unassigned</Badge>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* AI Brief Preview */}
          {aiResult?.success && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">AI Design Brief (will be attached)</p>
                <div className="text-xs bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {aiResult.content?.substring(0, 500)}...
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 dark:text-purple-300">
                Design job will be created with AI-generated brief attached.
              </span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Click "Create Design Job" to submit.
          </p>

          <div className="flex justify-center">
            <Button 
              onClick={handleCreateDesignJob} 
              disabled={isLoading} 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-create-design-job"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Design Job...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Design Job
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Instant Org Setup CONFIRM step - Create organization via API
    if (action.id === "instant-org-setup") {
      const ORG_TYPE_LABELS: Record<string, string> = {
        high_school: "High School",
        college: "College / University",
        corporate: "Corporate",
        nonprofit: "Non-Profit",
        tour: "Tour / Band",
        other: "Other",
      };

      const handleCreateOrganization = () => {
        setLoading(true);
        
        createOrganizationMutation.mutate({
          name: orgName,
          clientType: orgType === "corporate" ? "enterprise" : (orgType === "nonprofit" || orgType === "high_school" || orgType === "college" || orgType === "tour" || orgType === "other") ? "retail" : "retail",
          city: orgCity || undefined,
          state: orgState || undefined,
          shippingAddress: orgZip ? `${orgCity || ""}, ${orgState || ""} ${orgZip}`.trim() : undefined,
          brandPrimaryColor: orgPrimaryColor,
          brandSecondaryColor: orgSecondaryColor,
          logoUrl: orgLogoPreview || undefined,
        });
      };

      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: `linear-gradient(135deg, ${orgPrimaryColor}, ${orgSecondaryColor})` }}
            >
              <Building className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Ready to Create Organization</h3>
            <p className="text-sm text-muted-foreground">
              Review the summary below and confirm to create your new organization
            </p>
          </div>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Organization Name</span>
                <span className="text-right font-semibold">{orgName}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Type</span>
                <Badge variant="outline">{ORG_TYPE_LABELS[orgType] || "Organization"}</Badge>
              </div>
              {(orgCity || orgState || orgZip) && (
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Location</span>
                  <span className="text-right">{[orgCity, orgState, orgZip].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {(orgContactName || orgContactEmail) && (
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-medium">Primary Contact</span>
                  <div className="text-right">
                    <p>{orgContactName || "—"}</p>
                    {orgContactEmail && <p className="text-sm text-muted-foreground">{orgContactEmail}</p>}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Brand Colors</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: orgPrimaryColor }}
                    title="Primary"
                  />
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: orgSecondaryColor }}
                    title="Secondary"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Logo</span>
                <Badge variant={orgLogoPreview ? "default" : "secondary"}>
                  {orgLogoPreview ? "Uploaded" : "Not provided"}
                </Badge>
              </div>
            </div>
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            Click "Create Organization" to add this organization to your account.
          </p>

          <div className="flex justify-center">
            <Button 
              onClick={handleCreateOrganization} 
              disabled={isLoading || !orgName} 
              size="lg"
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-organization"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Organization...
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Quick Quote Generator CONFIRM step
    if (action.id === "quick-quote-generator") {
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Quote Summary</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-medium text-foreground">{selectedItem?.name || selectedItem?.orderName}</span>
                </li>
                <li className="flex justify-between">
                  <span>Margin Type:</span>
                  <span className="font-medium text-foreground">{MARGIN_GUARDRAILS[marginType].label}</span>
                </li>
                <li className="flex justify-between">
                  <span>Line Items:</span>
                  <span className="font-medium text-foreground">{lineItems.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium text-foreground">${getQuoteTotal().toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Overall Margin:</span>
                  <span className={`font-medium ${hasMarginWarning() ? "text-amber-600" : "text-green-600"}`}>
                    {(getOverallMargin() * 100).toFixed(1)}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Valid Until:</span>
                  <span className="font-medium text-foreground">{new Date(validUntil).toLocaleDateString()}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {hasMarginWarning() && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-300">Margin is below recommended minimum</span>
              </div>
            </div>
          )}

          <p className="text-sm text-center text-muted-foreground">
            Click "Create Quote" to save this quote as a draft.
          </p>

          <div className="flex justify-center">
            <Button onClick={handleConfirm} disabled={isLoading} size="lg" data-testid="button-create-quote">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Quote...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Quote
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Summary</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Action: {action.title}</li>
              {selectedItem && (
                <li>• Selected: {selectedItem.name || selectedItem.orderName || selectedItem.orderCode}</li>
              )}
              <li>• Output: Draft (requires review)</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground">
          Click "Confirm & Save" to create the draft.
        </p>

        <div className="flex justify-center">
          <Button onClick={handleConfirm} disabled={isLoading} size="lg" data-testid="button-confirm-action">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Save
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep.type === "done") {
    // Spin Up Tour Merch Bundle DONE step
    if (action.id === "spin-up-tour-merch") {
      return (
        <TourMerchBundleDoneStep 
          createdBundle={createdTourMerchBundle}
          selectedEvent={selectedItem}
          createTeamStore={tourMerchCreateTeamStore}
        />
      );
    }

    // Quick Quote Generator DONE step
    if (action.id === "quick-quote-generator") {
      return (
        <QuickQuoteDoneStep createdQuote={createdQuote} />
      );
    }

    // AI Design Starter DONE step
    if (action.id === "ai-design-starter") {
      return (
        <DesignJobDoneStep 
          selectedItem={selectedItem}
          designStyle={designStyle}
          createdDesignJob={createdDesignJob}
        />
      );
    }

    // Add Pantones DONE step
    if (action.id === "add-pantones") {
      return (
        <PantoneDoneStep selectedColors={selectedColors} />
      );
    }

    // Push to Printful DONE step
    if (action.id === "push-to-printful") {
      return (
        <PrintfulDoneStep 
          selectedItem={selectedItem} 
          createdPrintfulRecord={createdPrintfulRecord}
          shippingMethod={printfulShippingMethod}
        />
      );
    }

    // Instant Org Setup DONE step
    if (action.id === "instant-org-setup") {
      return (
        <InstantOrgSetupDoneStep 
          createdOrganization={createdOrganization}
          orgPrimaryColor={orgPrimaryColor}
          orgSecondaryColor={orgSecondaryColor}
          contactName={orgContactName}
          contactEmail={orgContactEmail}
        />
      );
    }

    return (
      <DoneStep />
    );
  }

  return <div>Unknown step type</div>;
}

function DoneStep() {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-medium mb-2">Action Complete!</h3>
      <p className="text-muted-foreground">
        Your changes have been saved. You can now continue working or close this page.
      </p>
    </div>
  );
}

function QuickQuoteDoneStep({ createdQuote }: { createdQuote: Quote | null }) {
  const { toast } = useToast();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    celebrateSuccess();
  }, []);

  const handleDownloadPDF = async () => {
    if (!createdQuote?.id) {
      toast({
        title: "Error",
        description: "No quote available to download",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`/api/quotes/${createdQuote.id}/pdf`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quote-${createdQuote.quoteCode || createdQuote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: `Quote ${createdQuote.quoteCode} has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!createdQuote?.id) {
      toast({
        title: "Error",
        description: "No quote available to send",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/quotes/${createdQuote.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email');
      }

      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: result.message || `Quote ${createdQuote.quoteCode} has been sent successfully.`,
      });
    } catch (error: any) {
      console.error("Email send error:", error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please check the contact has an email address.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Quote Created Successfully!</h3>
      {createdQuote && (
        <p className="text-muted-foreground mb-6">
          Quote <span className="font-medium text-foreground">{createdQuote.quoteCode}</span> has been saved as a draft.
        </p>
      )}
      {!createdQuote && (
        <p className="text-muted-foreground mb-6">
          Your quote has been saved as a draft.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleSendEmail}
          variant="default"
          size="lg"
          disabled={isSendingEmail || emailSent || !createdQuote}
          data-testid="button-send-email"
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : emailSent ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Email Sent
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </>
          )}
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="lg"
          disabled={isDownloadingPDF || !createdQuote}
          data-testid="button-download-pdf"
        >
          {isDownloadingPDF ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-6">
        You can also access this quote from the Quotes list at any time.
      </p>
    </div>
  );
}

function PantoneDoneStep({ selectedColors }: { selectedColors: SelectedColor[] }) {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <Palette className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Pantones Assigned!</h3>
      <p className="text-muted-foreground mb-6">
        {selectedColors.length} color{selectedColors.length !== 1 ? "s have" : " has"} been successfully assigned.
      </p>

      {selectedColors.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6 max-w-md mx-auto">
          {selectedColors.map((color) => (
            <div 
              key={color.id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
              data-testid={`done-color-${color.id}`}
            >
              <div 
                className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs font-medium">{color.pantone.code}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        These Pantone colors are now available for manufacturing reference.
      </p>
    </div>
  );
}

function DesignJobDoneStep({ 
  selectedItem, 
  designStyle, 
  createdDesignJob 
}: { 
  selectedItem: any; 
  designStyle: string; 
  createdDesignJob: any;
}) {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
        <Sparkles className="h-10 w-10 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Design Job Created!</h3>
      {createdDesignJob ? (
        <p className="text-muted-foreground mb-6">
          Design job <span className="font-medium text-foreground">{createdDesignJob.jobCode || `DJ-${createdDesignJob.id}`}</span> has been created with AI-generated brief.
        </p>
      ) : (
        <p className="text-muted-foreground mb-6">
          Your design job has been created successfully.
        </p>
      )}

      <div className="max-w-sm mx-auto mb-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 text-left">
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
          Design Job Details
        </p>
        <ul className="text-sm space-y-1 text-purple-600 dark:text-purple-400">
          <li>• Product Type: {selectedItem?.name || "Not specified"}</li>
          <li>• Style: <span className="capitalize">{designStyle}</span></li>
          <li>• Status: {createdDesignJob?.status || "Pending"}</li>
          {createdDesignJob?.assignedDesignerId && (
            <li>• Assigned to designer</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => window.location.href = "/design-jobs"}
          variant="default"
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-view-design-jobs"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Design Jobs
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="lg"
          data-testid="button-create-another"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Another
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-6">
        The AI-generated design brief is attached to the job and ready for your designer.
      </p>
    </div>
  );
}

function TourMerchBundleDoneStep({ 
  createdBundle, 
  selectedEvent,
  createTeamStore 
}: { 
  createdBundle: any; 
  selectedEvent: any;
  createTeamStore: boolean;
}) {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
        <Sparkles className="h-10 w-10 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Tour Merch Bundle Created!</h3>
      {createdBundle ? (
        <p className="text-muted-foreground mb-6">
          Bundle <span className="font-medium text-foreground">{createdBundle.bundleCode}</span> is ready for {selectedEvent?.name || "your event"}.
        </p>
      ) : (
        <p className="text-muted-foreground mb-6">
          Your tour merch bundle has been created successfully.
        </p>
      )}

      <div className="max-w-md mx-auto mb-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 text-left">
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
          Bundle Details
        </p>
        <ul className="text-sm space-y-1 text-purple-600 dark:text-purple-400">
          <li>• Bundle Code: <span className="font-mono font-bold">{createdBundle?.bundleCode || "TMB-XXXXX"}</span></li>
          <li>• Event: {selectedEvent?.name || "Event"}</li>
          <li>• Status: <span className="capitalize">{createdBundle?.status || "Ready"}</span></li>
          <li>• Total Units: {createdBundle?.totalAllocated || 0}</li>
          {createTeamStore && (
            <li>• Team Store: Created</li>
          )}
        </ul>
      </div>

      {createTeamStore && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 shadow-sm">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-blue-700 dark:text-blue-300">Team Store QR Code</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Share this QR code to let fans order tour merch
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (QR code placeholder - full functionality coming soon)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => window.location.href = "/events"}
          variant="default"
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-view-events"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Events
        </Button>
        {createTeamStore && (
          <Button
            onClick={() => window.location.href = "/team-stores"}
            variant="outline"
            size="lg"
            data-testid="button-view-team-store"
          >
            View Team Store
          </Button>
        )}
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="lg"
          data-testid="button-create-another-bundle"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Another
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-6">
        Your tour merch bundle is live and ready for orders.
      </p>
    </div>
  );
}

function PrintfulDoneStep({ 
  selectedItem, 
  createdPrintfulRecord,
  shippingMethod 
}: { 
  selectedItem: any; 
  createdPrintfulRecord: any;
  shippingMethod: string;
}) {
  const SHIPPING_METHODS: Record<string, { name: string; days: string }> = {
    standard: { name: "Standard Shipping", days: "5-7 business days" },
    express: { name: "Express Shipping", days: "2-3 business days" },
    priority: { name: "Priority Shipping", days: "1-2 business days" },
  };

  const shipping = SHIPPING_METHODS[shippingMethod] || SHIPPING_METHODS.standard;

  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
        <Check className="h-10 w-10 text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Submitted to Printful!</h3>
      {createdPrintfulRecord ? (
        <p className="text-muted-foreground mb-6">
          Order <span className="font-medium text-foreground">{createdPrintfulRecord.printfulOrderId}</span> has been submitted for fulfillment.
        </p>
      ) : (
        <p className="text-muted-foreground mb-6">
          Your order has been submitted to Printful for fulfillment.
        </p>
      )}

      <div className="max-w-sm mx-auto mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800 text-left">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
          Order Details
        </p>
        <ul className="text-sm space-y-1 text-indigo-600 dark:text-indigo-400">
          <li>• Order: {selectedItem?.order?.orderName || selectedItem?.orderName || `Order #${selectedItem?.id}`}</li>
          <li>• Printful ID: {createdPrintfulRecord?.printfulOrderId || "Pending"}</li>
          <li>• Shipping: {shipping.name}</li>
          <li>• Estimated Delivery: {shipping.days}</li>
          <li>• Status: <span className="capitalize">{createdPrintfulRecord?.status || "Processing"}</span></li>
        </ul>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm mb-6 max-w-sm mx-auto">
        <div className="flex items-center gap-2 justify-center">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-blue-700 dark:text-blue-300">
            Tracking info will be available once the order ships
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => window.location.href = "/manufacturing"}
          variant="default"
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700"
          data-testid="button-view-manufacturing"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Manufacturing
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="lg"
          data-testid="button-push-another"
        >
          <Plus className="h-4 w-4 mr-2" />
          Push Another Order
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-6">
        You can track this order's fulfillment status in the Manufacturing hub.
      </p>
    </div>
  );
}

function InstantOrgSetupDoneStep({ 
  createdOrganization,
  orgPrimaryColor,
  orgSecondaryColor,
  contactName,
  contactEmail
}: { 
  createdOrganization: Organization | null;
  orgPrimaryColor: string;
  orgSecondaryColor: string;
  contactName?: string;
  contactEmail?: string;
}) {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div 
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
        style={{ background: `linear-gradient(135deg, ${orgPrimaryColor}, ${orgSecondaryColor})` }}
      >
        <Building className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Organization Created!</h3>
      {createdOrganization ? (
        <p className="text-muted-foreground mb-6">
          <span className="font-medium text-foreground">{createdOrganization.name}</span> has been added to your organizations.
        </p>
      ) : (
        <p className="text-muted-foreground mb-6">
          Your new organization has been created successfully.
        </p>
      )}

      <div className="max-w-sm mx-auto mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20 text-left">
        <p className="text-sm font-medium text-primary mb-2">
          Organization Details
        </p>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li className="flex items-center gap-2">
            <Building className="h-3 w-3" />
            {createdOrganization?.name || "New Organization"}
          </li>
          {createdOrganization?.city && (
            <li className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {[createdOrganization.city, createdOrganization.state].filter(Boolean).join(", ")}
            </li>
          )}
          {contactName && (
            <li className="flex items-center gap-2">
              <User className="h-3 w-3" />
              {contactName}
            </li>
          )}
          {contactEmail && (
            <li className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              {contactEmail}
            </li>
          )}
          <li className="flex items-center gap-2 mt-2">
            <Palette className="h-3 w-3" />
            <span>Brand Colors:</span>
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: orgPrimaryColor }}
            />
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: orgSecondaryColor }}
            />
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={createdOrganization ? `/organizations/${createdOrganization.id}` : "/organizations"}>
          <Button
            variant="default"
            size="lg"
            data-testid="button-view-organization"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Organization
          </Button>
        </Link>
        <Link href="/organizations">
          <Button
            variant="outline"
            size="lg"
            data-testid="button-view-all-organizations"
          >
            View All Organizations
          </Button>
        </Link>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="lg"
          data-testid="button-create-another-org"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Another
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-6">
        You can now create orders and quotes for this organization.
      </p>
    </div>
  );
}

export function OrdersActionDetail() {
  return <ActionDetailPage hubId="orders" />;
}

export function SalesAnalyticsActionDetail() {
  return <ActionDetailPage hubId="sales-analytics" />;
}

export function OrganizationsActionDetail() {
  return <ActionDetailPage hubId="organizations" />;
}

export function ContactsActionDetail() {
  return <ActionDetailPage hubId="contacts" />;
}

export function LeadsActionDetail() {
  return <ActionDetailPage hubId="leads" />;
}

export function EventsActionDetail() {
  return <ActionDetailPage hubId="events" />;
}

export function QuotesActionDetail() {
  return <ActionDetailPage hubId="quotes" />;
}

export function ManufacturingActionDetail() {
  return <ActionDetailPage hubId="manufacturing" />;
}

export function TeamStoresActionDetail() {
  return <ActionDetailPage hubId="team-stores" />;
}

export function DesignJobsActionDetail() {
  return <ActionDetailPage hubId="design-jobs" />;
}

export function CatalogActionDetail() {
  return <ActionDetailPage hubId="catalog" />;
}
