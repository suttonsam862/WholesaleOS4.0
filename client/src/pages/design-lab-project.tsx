import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Save,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Type,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  RotateCcw,
  Check,
  Square,
  Circle,
  PanelLeftClose,
  PanelRightClose,
  Clock,
  Columns,
  X,
  Timer,
  CheckCircle2,
  LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface DesignProject {
  id: number;
  projectCode: string;
  name: string;
  description?: string;
  userId: string;
  variantId?: number;
  designJobId?: number;
  orgId?: number;
  status: "draft" | "generating" | "in_progress" | "review" | "finalized" | "archived";
  currentVersionId?: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface DesignVersion {
  id: number;
  projectId: number;
  versionNumber: number;
  name?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  compositeFrontUrl?: string;
  compositeBackUrl?: string;
  layerData?: any;
  generationPrompt?: string;
  generationProvider?: string;
  generationDuration?: number;
  createdBy: string;
  createdAt: string;
}

interface DesignLayer {
  id: number;
  versionId: number;
  layerType: "base" | "generated" | "typography" | "logo" | "graphic" | "overlay";
  name: string;
  imageUrl?: string;
  position?: { x: number; y: number; width: number; height: number; rotation: number; scale: number };
  textContent?: string;
  textStyle?: { font: string; size: number; color: string; effects?: any };
  view: "front" | "back";
  zIndex: number;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  blendMode: string;
  prompt?: string;
  referenceImageUrl?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  createdAt: string;
  updatedAt: string;
}

interface SortableLayerItemProps {
  layer: DesignLayer;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onToggleVisibility: (id: number, isVisible: boolean) => void;
  onToggleLock: (id: number, isLocked: boolean) => void;
  onDelete: (id: number) => void;
}

function SortableLayerItem({ layer, isSelected, onSelect, onToggleVisibility, onToggleLock, onDelete }: SortableLayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(layer.id)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
        isSelected
          ? "bg-violet-600/30 border border-violet-500/50"
          : "hover:bg-zinc-800 border border-transparent"
      )}
      data-testid={`layer-item-${layer.id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-zinc-600" />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(layer.id, !layer.isVisible);
        }}
        className="text-zinc-400 hover:text-zinc-200"
        data-testid={`button-toggle-visibility-${layer.id}`}
      >
        {layer.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <span className="text-zinc-400">
        {getLayerTypeIcon(layer.layerType)}
      </span>
      <span className="text-sm text-zinc-200 flex-1 truncate">{layer.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock(layer.id, !layer.isLocked);
        }}
        className="text-zinc-400 hover:text-zinc-200"
        data-testid={`button-toggle-lock-${layer.id}`}
      >
        {layer.isLocked ? <Lock className="h-3 w-3 text-zinc-500" /> : <Unlock className="h-3 w-3 text-zinc-600" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(layer.id);
        }}
        className="text-zinc-400 hover:text-red-400"
        data-testid={`button-delete-layer-${layer.id}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

interface ProjectWithDetails extends DesignProject {
  currentVersion?: DesignVersion;
  layers?: DesignLayer[];
}

interface DesignJobOption {
  id: number;
  jobCode: string;
  brief?: string;
  status: string;
  orderId?: number;
}

interface ProductVariant {
  id: number;
  productId: number;
  variantCode: string;
  color?: string;
  size?: string;
  material?: string;
  imageUrl?: string;
  frontTemplateUrl?: string;
  backTemplateUrl?: string;
}

interface DesignStylePreset {
  id: number;
  name: string;
  description?: string;
  previewImageUrl?: string;
  promptSuffix?: string;
  styleConfig?: any;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

type ViewType = "front" | "back";
type RequestType = "base_generation" | "typography_iteration";

function getStatusBadgeStyles(status: DesignProject["status"]) {
  switch (status) {
    case "draft":
      return "bg-gray-800/50 text-gray-300 border-gray-700/50";
    case "generating":
      return "bg-violet-900/50 text-violet-300 border-violet-700/50 animate-pulse";
    case "in_progress":
      return "bg-blue-900/50 text-blue-300 border-blue-700/50";
    case "review":
      return "bg-yellow-900/50 text-yellow-300 border-yellow-700/50";
    case "finalized":
      return "bg-green-900/50 text-green-300 border-green-700/50";
    case "archived":
      return "bg-muted/30 text-muted-foreground border-muted/50";
    default:
      return "bg-muted/30 text-muted-foreground border-muted/50";
  }
}

function getStatusLabel(status: DesignProject["status"]) {
  switch (status) {
    case "draft": return "Draft";
    case "generating": return "Generating...";
    case "in_progress": return "In Progress";
    case "review": return "Review";
    case "finalized": return "Finalized";
    case "archived": return "Archived";
    default: return status;
  }
}

function getLayerTypeIcon(layerType: DesignLayer["layerType"]) {
  switch (layerType) {
    case "base":
      return <Square className="h-4 w-4" />;
    case "generated":
      return <Sparkles className="h-4 w-4" />;
    case "typography":
      return <Type className="h-4 w-4" />;
    case "logo":
      return <Circle className="h-4 w-4" />;
    case "graphic":
      return <ImageIcon className="h-4 w-4" />;
    case "overlay":
      return <Layers className="h-4 w-4" />;
    default:
      return <Layers className="h-4 w-4" />;
  }
}

export function DesignLabProject() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id, 10) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  const [selectedView, setSelectedView] = useState<ViewType>("front");
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [leftPanelOpen, setLeftPanelOpen] = useState(!isMobile);
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [generationPrompt, setGenerationPrompt] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("base_generation");
  
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [designTheme, setDesignTheme] = useState("");
  const [keyElements, setKeyElements] = useState("");
  const [thingsToAvoid, setThingsToAvoid] = useState("");
  
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DesignVersion | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [selectedDesignJobId, setSelectedDesignJobId] = useState<string>("");
  
  // Track selected area preset for layer creation
  const [selectedAreaPreset, setSelectedAreaPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery<ProjectWithDetails>({
    queryKey: ["/api/design-lab/projects", projectId],
    enabled: !!projectId && isAuthenticated,
    retry: false,
  });

  const { data: versions = [], isLoading: versionsLoading } = useQuery<DesignVersion[]>({
    queryKey: ["/api/design-lab/projects", projectId, "versions"],
    enabled: !!projectId && isAuthenticated,
    retry: false,
  });

  // Fetch variant data to show template images
  const { data: variant } = useQuery<ProductVariant>({
    queryKey: ["/api/variants", project?.variantId],
    enabled: !!project?.variantId && isAuthenticated,
    retry: false,
  });

  // Fetch style presets for design generation
  const { data: stylePresets = [], isLoading: presetsLoading } = useQuery<DesignStylePreset[]>({
    queryKey: ["/api/design-lab/style-presets"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get currently selected preset
  const selectedPreset = useMemo(() => {
    return stylePresets.find(p => p.id === selectedPresetId) || null;
  }, [stylePresets, selectedPresetId]);

  useEffect(() => {
    if (projectError) {
      toast({
        title: "Project Not Found",
        description: "The requested project could not be found.",
        variant: "destructive",
      });
      setLocation("/design-lab");
    }
  }, [projectError, setLocation, toast]);

  const layers = useMemo(() => {
    if (!project?.layers) return [];
    return [...project.layers]
      .filter(layer => layer.view === selectedView)
      .sort((a, b) => b.zIndex - a.zIndex);
  }, [project?.layers, selectedView]);

  const selectedLayer = useMemo(() => {
    if (!selectedLayerId || !project?.layers) return null;
    return project.layers.find(l => l.id === selectedLayerId) || null;
  }, [selectedLayerId, project?.layers]);

  const currentVersion = project?.currentVersion;

  const currentImageUrl = useMemo(() => {
    if (previewVersion) {
      // For preview, prefer composite version if available
      const compositeUrl = selectedView === "front" ? previewVersion.compositeFrontUrl : previewVersion.compositeBackUrl;
      const rawUrl = selectedView === "front" ? previewVersion.frontImageUrl : previewVersion.backImageUrl;
      return compositeUrl || rawUrl;
    }
    // First try to get composite version (design on template)
    if (currentVersion) {
      const compositeUrl = selectedView === "front" ? currentVersion.compositeFrontUrl : currentVersion.compositeBackUrl;
      if (compositeUrl) return compositeUrl;
      // Fallback to raw generated design
      const rawUrl = selectedView === "front" ? currentVersion.frontImageUrl : currentVersion.backImageUrl;
      if (rawUrl) return rawUrl;
    }
    // Fallback to variant's template images
    if (variant) {
      return selectedView === "front" ? variant.frontTemplateUrl : variant.backTemplateUrl;
    }
    return null;
  }, [currentVersion, previewVersion, selectedView, variant]);

  const originalImageUrl = useMemo(() => {
    if (!currentVersion) return null;
    // Prefer composite version (design on template) for display
    const compositeUrl = selectedView === "front" ? currentVersion.compositeFrontUrl : currentVersion.compositeBackUrl;
    if (compositeUrl) return compositeUrl;
    // Fallback to raw generated design
    return selectedView === "front" ? currentVersion.frontImageUrl : currentVersion.backImageUrl;
  }, [currentVersion, selectedView]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<DesignProject>) => {
      return apiRequest<DesignProject>(`/api/design-lab/projects/${projectId}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      setLastSaved(new Date());
      toast({
        title: "Saved",
        description: "Project saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error?.message || "Failed to save project",
        variant: "destructive",
      });
    },
  });

  const generateDesignMutation = useMutation({
    mutationFn: async (data: { 
      prompt: string; 
      requestType: RequestType;
      primaryColor: string;
      stylePresetId?: number;
      promptModifier?: string;
      designTheme?: string;
      keyElements?: string;
      thingsToAvoid?: string;
    }) => {
      const combinedPrompt = [
        data.prompt,
        data.promptModifier && `Style: ${data.promptModifier}`,
        data.designTheme && `Theme/Mood: ${data.designTheme}`,
        data.keyElements && `Include: ${data.keyElements}`,
        data.thingsToAvoid && `Avoid: ${data.thingsToAvoid}`,
        `Primary color: ${data.primaryColor}`,
      ].filter(Boolean).join('. ');

      return apiRequest<any>("/api/design-lab/generate", {
        method: "POST",
        body: {
          projectId,
          prompt: combinedPrompt,
          requestType: data.requestType,
          view: selectedView,
          style: 'modern',
          primaryColor: data.primaryColor,
          stylePresetId: data.stylePresetId,
        },
      });
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId, "versions"] });
      toast({
        title: "Generation Started",
        description: "Your design is being generated. This may take a moment.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate design",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      return apiRequest<any>(`/api/design-lab/projects/${projectId}/versions/${versionId}/restore`, {
        method: "POST",
      });
    },
    onMutate: () => {
      setIsRestoring(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId, "versions"] });
      setPreviewVersion(null);
      setComparisonMode(false);
      setHistoryPanelOpen(false);
      toast({
        title: "Version Restored",
        description: "The selected version has been restored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error?.message || "Failed to restore version",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRestoring(false);
    },
  });

  const handleRestoreVersion = (versionId: number) => {
    restoreVersionMutation.mutate(versionId);
  };

  const updateLayerMutation = useMutation({
    mutationFn: async (data: { layerId: number; updates: Partial<DesignLayer> }) => {
      return apiRequest<DesignLayer>(`/api/design-lab/layers/${data.layerId}`, {
        method: "PATCH",
        body: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update layer",
        variant: "destructive",
      });
    },
  });

  const handleUpdateLayerProperty = (layerId: number, key: string, value: any) => {
    updateLayerMutation.mutate({
      layerId,
      updates: { [key]: value },
    });
  };

  const handleUpdateLayerPosition = (layerId: number, positionKey: string, value: number) => {
    const layer = project?.layers?.find(l => l.id === layerId);
    if (!layer) return;
    
    const currentPosition = layer.position || { x: 0, y: 0, width: 100, height: 100, rotation: 0, scale: 1 };
    updateLayerMutation.mutate({
      layerId,
      updates: {
        position: {
          ...currentPosition,
          [positionKey]: value,
        },
      },
    });
  };

  // Quick area presets for easy design placement
  const QUICK_AREA_PRESETS = {
    centerChest: { x: 0.25, y: 0.15, w: 0.5, h: 0.25, label: "Center Chest" },
    leftChest: { x: 0.55, y: 0.12, w: 0.2, h: 0.15, label: "Left Chest" },
    fullFront: { x: 0.1, y: 0.1, w: 0.8, h: 0.6, label: "Full Front" },
    upperBack: { x: 0.2, y: 0.1, w: 0.6, h: 0.25, label: "Upper Back" },
  } as const;

  // Idea chips for AI prompt suggestions
  const AI_GRAPHIC_IDEA_CHIPS = ["Flames", "Lightning", "Wings", "Mascot", "Abstract", "Geometric"];
  const TEXT_STYLE_IDEA_CHIPS = ["Varsity", "Vintage", "Modern", "Athletic"];
  const FONT_STYLE_OPTIONS = ["Script", "Block", "Athletic", "Retro"] as const;

  const createLayerMutation = useMutation({
    mutationFn: async (data: { 
      layerType: DesignLayer["layerType"]; 
      name: string; 
      view: ViewType;
      position?: { x: number; y: number; width: number; height: number; rotation: number; scale: number };
      bbox?: { x: number; y: number; w: number; h: number };
    }) => {
      if (!currentVersion) throw new Error("No version available");
      return apiRequest<DesignLayer>(`/api/design-lab/versions/${currentVersion.id}/layers`, {
        method: "POST",
        body: {
          layerType: data.layerType,
          name: data.name,
          view: data.view,
          position: data.position || { x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1 },
          bbox: data.bbox,
          zIndex: (project?.layers?.length || 0) + 1,
          isVisible: true,
          isLocked: false,
          opacity: "1.0",
          blendMode: "normal",
        },
      });
    },
    onSuccess: (newLayer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      setSelectedLayerId(newLayer.id);
      toast({
        title: "Layer Created",
        description: `${newLayer.name} layer added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Create Failed",
        description: error?.message || "Failed to create layer",
        variant: "destructive",
      });
    },
  });

  const deleteLayerMutation = useMutation({
    mutationFn: async (layerId: number) => {
      return apiRequest<any>(`/api/design-lab/layers/${layerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      setSelectedLayerId(null);
      toast({
        title: "Layer Deleted",
        description: "Layer removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete layer",
        variant: "destructive",
      });
    },
  });

  const handleCreateLayer = (layerType: DesignLayer["layerType"], bboxNorm?: { x: number; y: number; w: number; h: number }) => {
    if (!currentVersion) {
      toast({
        title: "Loading",
        description: "Project is still loading, please wait...",
        variant: "default",
      });
      return;
    }
    const names: Record<DesignLayer["layerType"], string> = {
      base: "Base Layer",
      generated: "Generated Layer",
      typography: "Text Layer",
      logo: "Logo Layer",
      graphic: "Graphic Layer",
      overlay: "Overlay Layer",
    };
    
    // Reference canvas size for converting normalized coords to pixels
    // These will be recalculated when rendering based on actual template dimensions
    const canvasRefWidth = 400;
    const canvasRefHeight = 500;
    
    // Use provided bbox, selected preset, or default center chest area
    let bbox = bboxNorm;
    if (!bbox && selectedAreaPreset && QUICK_AREA_PRESETS[selectedAreaPreset as keyof typeof QUICK_AREA_PRESETS]) {
      const preset = QUICK_AREA_PRESETS[selectedAreaPreset as keyof typeof QUICK_AREA_PRESETS];
      bbox = { x: preset.x, y: preset.y, w: preset.w, h: preset.h };
    }
    bbox = bbox || { x: 0.25, y: 0.15, w: 0.5, h: 0.3 };
    
    // Convert normalized bbox to pixel position
    const position = {
      x: Math.round(bbox.x * canvasRefWidth),
      y: Math.round(bbox.y * canvasRefHeight),
      width: Math.round(bbox.w * canvasRefWidth),
      height: Math.round(bbox.h * canvasRefHeight),
      rotation: 0,
      scale: 1,
    };
    
    // Clear the preset after using it
    setSelectedAreaPreset(null);
    
    createLayerMutation.mutate({
      layerType,
      name: names[layerType],
      view: selectedView,
      position,
      bbox,
    });
  };

  const handleDeleteLayer = (layerId: number) => {
    deleteLayerMutation.mutate(layerId);
  };

  const handleToggleLayerVisibility = (layerId: number, isVisible: boolean) => {
    updateLayerMutation.mutate({
      layerId,
      updates: { isVisible },
    });
  };

  const handleToggleLayerLock = (layerId: number, isLocked: boolean) => {
    updateLayerMutation.mutate({
      layerId,
      updates: { isLocked },
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedLayers = arrayMove(layers, oldIndex, newIndex);
        reorderedLayers.forEach((layer, index) => {
          const newZIndex = reorderedLayers.length - index;
          if (layer.zIndex !== newZIndex) {
            updateLayerMutation.mutate({
              layerId: layer.id,
              updates: { zIndex: newZIndex },
            });
          }
        });
      }
    }
  };

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const handlePositionBoxMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.isLocked) return;
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePositionBoxMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedLayer || !dragStart || (!isDragging && !isResizing)) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const currentPosition = selectedLayer.position || { x: 0, y: 0, width: 100, height: 100, rotation: 0, scale: 1 };
    
    if (isDragging) {
      const newX = currentPosition.x + deltaX;
      const newY = currentPosition.y + deltaY;
      updateLayerMutation.mutate({
        layerId: selectedLayer.id,
        updates: {
          position: { ...currentPosition, x: newX, y: newY },
        },
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing && resizeHandle) {
      let newWidth = currentPosition.width;
      let newHeight = currentPosition.height;
      let newX = currentPosition.x;
      let newY = currentPosition.y;

      if (resizeHandle.includes('e')) newWidth += deltaX;
      if (resizeHandle.includes('w')) { newWidth -= deltaX; newX += deltaX; }
      if (resizeHandle.includes('s')) newHeight += deltaY;
      if (resizeHandle.includes('n')) { newHeight -= deltaY; newY += deltaY; }

      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      updateLayerMutation.mutate({
        layerId: selectedLayer.id,
        updates: {
          position: { ...currentPosition, x: newX, y: newY, width: newWidth, height: newHeight },
        },
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [selectedLayer, dragStart, isDragging, isResizing, resizeHandle, updateLayerMutation]);

  const handlePositionBoxMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handlePositionBoxMouseMove);
      window.addEventListener('mouseup', handlePositionBoxMouseUp);
      return () => {
        window.removeEventListener('mousemove', handlePositionBoxMouseMove);
        window.removeEventListener('mouseup', handlePositionBoxMouseUp);
      };
    }
  }, [isDragging, isResizing, handlePositionBoxMouseMove, handlePositionBoxMouseUp]);

  const handleReferenceImageUpload = async (file: any): Promise<{ method: "PUT"; url: string; uploadId?: string }> => {
    const response = await apiRequest<{ url: string; uploadId: string }>('/api/upload/presigned-url', {
      method: 'POST',
      body: {
        fileName: file.name,
        fileType: file.type,
        folder: 'design-lab-references',
      },
    });
    return { method: "PUT", url: response.url, uploadId: response.uploadId };
  };

  const handleReferenceUploadComplete = (result: any) => {
    if (!selectedLayer || !result.successful?.[0]) return;
    const uploadedFile = result.successful[0];
    const uploadId = uploadedFile.uploadId;
    
    if (uploadId) {
      apiRequest<{ publicUrl: string }>('/api/upload/confirm', {
        method: 'POST',
        body: { uploadId, isPublic: true },
      }).then((confirmResult) => {
        updateLayerMutation.mutate({
          layerId: selectedLayer.id,
          updates: { referenceImageUrl: confirmResult.publicUrl },
        });
      });
    }
  };

  const { data: designJobs = [], isLoading: designJobsLoading } = useQuery<DesignJobOption[]>({
    queryKey: ["/api/design-jobs"],
    enabled: finalizeDialogOpen && isAuthenticated,
  });

  const finalizeProjectMutation = useMutation({
    mutationFn: async (data: { designJobId?: number | null }) => {
      return apiRequest<ProjectWithDetails>(`/api/design-lab/projects/${projectId}/finalize`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      setFinalizeDialogOpen(false);
      setSelectedDesignJobId("");
      toast({
        title: "Design Finalized",
        description: data.designJobId 
          ? "Design finalized and attached to the design job successfully."
          : "Design finalized successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Finalize Failed",
        description: error?.message || "Failed to finalize design",
        variant: "destructive",
      });
    },
  });

  const handleFinalize = () => {
    const designJobId = selectedDesignJobId ? parseInt(selectedDesignJobId) : undefined;
    finalizeProjectMutation.mutate({ designJobId });
  };

  const handleOpenFinalizeDialog = () => {
    setSelectedDesignJobId(project?.designJobId?.toString() || "");
    setFinalizeDialogOpen(true);
  };

  const handlePreviewVersion = (version: DesignVersion) => {
    setPreviewVersion(version);
  };

  const handleExitPreview = () => {
    setPreviewVersion(null);
    setComparisonMode(false);
  };

  const handleToggleComparison = () => {
    setComparisonMode(!comparisonMode);
  };

  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await updateProjectMutation.mutateAsync({ name: project.name });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = () => {
    if (!generationPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your design.",
        variant: "destructive",
      });
      return;
    }
    generateDesignMutation.mutate({
      prompt: generationPrompt,
      requestType,
      primaryColor: selectedColor,
      stylePresetId: selectedPresetId || undefined,
      promptModifier: selectedPreset?.promptSuffix,
      designTheme,
      keyElements,
      thingsToAvoid,
    });
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(200, Math.max(25, prev + delta)));
  };

  const handleFitToScreen = () => {
    setZoomLevel(100);
  };

  if (projectLoading || authLoading) {
    return (
      <div className="h-screen bg-zinc-900 flex flex-col">
        <div className="h-14 border-b border-zinc-700 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 bg-zinc-800" />
            <Skeleton className="h-6 w-32 bg-zinc-800" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-8 bg-zinc-800" />
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="w-64 border-r border-zinc-700 p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="w-96 h-96 bg-zinc-800 rounded-lg" />
          </div>
          <div className="w-80 border-l border-zinc-700 p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const renderLayerPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Layers</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
              data-testid="button-add-layer"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-zinc-700"
              data-testid="menu-item-add-typography"
              onClick={() => handleCreateLayer("typography")}
            >
              <Type className="h-4 w-4 mr-2" />
              Typography
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-zinc-700"
              data-testid="menu-item-add-logo"
              onClick={() => handleCreateLayer("logo")}
            >
              <Circle className="h-4 w-4 mr-2" />
              Logo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-zinc-700"
              data-testid="menu-item-add-graphic"
              onClick={() => handleCreateLayer("graphic")}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Graphic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No layers yet. Generate a design or add layers manually.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
                {layers.map((layer) => (
                  <SortableLayerItem
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayerId === layer.id}
                    onSelect={setSelectedLayerId}
                    onToggleVisibility={handleToggleLayerVisibility}
                    onToggleLock={handleToggleLayerLock}
                    onDelete={handleDeleteLayer}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderPropertiesPanel = () => {
    // === EDIT LAYER MODE ===
    if (selectedLayer) {
      const getLayerTypeBadge = () => {
        const badgeConfig: Record<string, { label: string; color: string }> = {
          typography: { label: "Text", color: "bg-blue-600" },
          logo: { label: "Logo", color: "bg-emerald-600" },
          graphic: { label: "AI Graphic", color: "bg-violet-600" },
          generated: { label: "AI Graphic", color: "bg-violet-600" },
          base: { label: "Base", color: "bg-zinc-600" },
          overlay: { label: "Overlay", color: "bg-amber-600" },
        };
        const config = badgeConfig[selectedLayer.layerType] || { label: selectedLayer.layerType, color: "bg-zinc-600" };
        return (
          <Badge className={cn("text-xs", config.color)} data-testid="badge-layer-type">
            {config.label}
          </Badge>
        );
      };

      const renderTypographyEditor = () => (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Text Content</label>
            <Textarea
              placeholder="Enter your text..."
              value={selectedLayer.textContent || ""}
              onChange={(e) => handleUpdateLayerProperty(selectedLayer.id, "textContent", e.target.value)}
              className="min-h-20 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none text-sm"
              data-testid="textarea-text-content"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Font Style</label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_STYLE_OPTIONS.map((style) => (
                <Button
                  key={style}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 border-zinc-700 text-zinc-300 hover:bg-zinc-700",
                    selectedLayer.textStyle?.font === style && "border-violet-500 bg-violet-600/20 text-violet-300"
                  )}
                  onClick={() => handleUpdateLayerProperty(selectedLayer.id, "textStyle", {
                    ...selectedLayer.textStyle,
                    font: style
                  })}
                  data-testid={`button-font-style-${style.toLowerCase()}`}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Style Inspiration</label>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_STYLE_IDEA_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    const currentPrompt = selectedLayer.prompt || "";
                    const newPrompt = currentPrompt ? `${currentPrompt}, ${chip}` : chip;
                    handleUpdateLayerProperty(selectedLayer.id, "prompt", newPrompt);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-violet-600/20 hover:border-violet-500 hover:text-violet-300 transition-colors"
                  data-testid={`chip-text-style-${chip.toLowerCase()}`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-violet-600/50 text-violet-400 hover:bg-violet-600/20"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "AI text styling will be available soon!",
              });
            }}
            data-testid="button-generate-text-style"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Style with AI
          </Button>
        </div>
      );

      const renderLogoEditor = () => (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Logo Image</label>
            {selectedLayer.imageUrl ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-square rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                  <img
                    src={selectedLayer.imageUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    data-testid="img-logo-layer"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => handleUpdateLayerProperty(selectedLayer.id, "imageUrl", null)}
                    data-testid="button-remove-logo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                allowedFileTypes={['image/*']}
                onGetUploadParameters={handleReferenceImageUpload}
                onComplete={(result) => {
                  if (!selectedLayer || !result.successful?.[0]) return;
                  const uploadedFile = result.successful[0] as any;
                  const uploadId = uploadedFile.uploadId;
                  
                  if (uploadId) {
                    apiRequest<{ publicUrl: string }>('/api/upload/confirm', {
                      method: 'POST',
                      body: { uploadId, isPublic: true },
                    }).then((confirmResult) => {
                      updateLayerMutation.mutate({
                        layerId: selectedLayer.id,
                        updates: { imageUrl: confirmResult.publicUrl },
                      });
                    });
                  }
                }}
                buttonClassName="w-full h-20 bg-zinc-800 border-zinc-700 border-dashed text-zinc-300 hover:bg-zinc-700"
              >
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload Logo</span>
                </div>
              </ObjectUploader>
            )}
          </div>
          <Separator className="bg-zinc-700" />
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">AI Transforms</label>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                onClick={() => toast({ title: "Coming Soon", description: "Clean edges AI transform coming soon!" })}
                data-testid="button-ai-clean-edges"
              >
                <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
                Clean Edges
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                onClick={() => toast({ title: "Coming Soon", description: "Simplify AI transform coming soon!" })}
                data-testid="button-ai-simplify"
              >
                <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
                Simplify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                onClick={() => toast({ title: "Coming Soon", description: "Recolor AI transform coming soon!" })}
                data-testid="button-ai-recolor"
              >
                <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
                Recolor
              </Button>
            </div>
          </div>
        </div>
      );

      const renderAIGraphicEditor = () => (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Design Prompt</label>
            <Textarea
              placeholder="Describe the graphic you want to generate..."
              value={selectedLayer.prompt || ""}
              onChange={(e) => handleUpdateLayerProperty(selectedLayer.id, "prompt", e.target.value)}
              className="min-h-24 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none text-sm"
              data-testid="textarea-ai-graphic-prompt"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Idea Chips</label>
            <div className="flex flex-wrap gap-1.5">
              {AI_GRAPHIC_IDEA_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    const currentPrompt = selectedLayer.prompt || "";
                    const newPrompt = currentPrompt ? `${currentPrompt}, ${chip}` : chip;
                    handleUpdateLayerProperty(selectedLayer.id, "prompt", newPrompt);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-violet-600/20 hover:border-violet-500 hover:text-violet-300 transition-colors"
                  data-testid={`chip-ai-graphic-${chip.toLowerCase()}`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Reference Image</label>
            {selectedLayer.referenceImageUrl ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                  <img
                    src={selectedLayer.referenceImageUrl}
                    alt="Reference"
                    className="w-full h-full object-contain"
                    data-testid="img-layer-reference"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => handleUpdateLayerProperty(selectedLayer.id, "referenceImageUrl", null)}
                    data-testid="button-remove-reference"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                allowedFileTypes={['image/*']}
                onGetUploadParameters={handleReferenceImageUpload}
                onComplete={handleReferenceUploadComplete}
                buttonClassName="w-full h-9 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Reference Image
              </ObjectUploader>
            )}
          </div>
          <Button
            onClick={() => {
              if (!selectedLayer.prompt?.trim()) {
                toast({ title: "Prompt Required", description: "Please enter a description for your graphic.", variant: "destructive" });
                return;
              }
              generateDesignMutation.mutate({
                prompt: selectedLayer.prompt,
                requestType: "base_generation",
                primaryColor: selectedColor,
              });
            }}
            disabled={isGenerating || !selectedLayer.prompt?.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            data-testid="button-generate-layer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Graphic
              </>
            )}
          </Button>
        </div>
      );

      const renderCommonControls = () => (
        <div className="space-y-4">
          <Separator className="bg-zinc-700" />
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">
              Opacity: {selectedLayer.opacity}%
            </label>
            <Slider
              value={[selectedLayer.opacity]}
              max={100}
              step={1}
              onValueChange={(value) => handleUpdateLayerProperty(selectedLayer.id, "opacity", value[0])}
              className="[&_[role=slider]]:bg-violet-500"
              data-testid="slider-opacity"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-zinc-500">X</span>
                <Input
                  type="number"
                  value={selectedLayer.position?.x || 0}
                  onChange={(e) => handleUpdateLayerPosition(selectedLayer.id, "x", parseFloat(e.target.value) || 0)}
                  className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200"
                  data-testid="input-position-x"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500">Y</span>
                <Input
                  type="number"
                  value={selectedLayer.position?.y || 0}
                  onChange={(e) => handleUpdateLayerPosition(selectedLayer.id, "y", parseFloat(e.target.value) || 0)}
                  className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200"
                  data-testid="input-position-y"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-xs text-zinc-500">Width</span>
                <Input
                  type="number"
                  value={selectedLayer.position?.width || 100}
                  onChange={(e) => handleUpdateLayerPosition(selectedLayer.id, "width", parseFloat(e.target.value) || 100)}
                  className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200"
                  data-testid="input-position-width"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500">Height</span>
                <Input
                  type="number"
                  value={selectedLayer.position?.height || 100}
                  onChange={(e) => handleUpdateLayerPosition(selectedLayer.id, "height", parseFloat(e.target.value) || 100)}
                  className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200"
                  data-testid="input-position-height"
                />
              </div>
            </div>
          </div>
          <Separator className="bg-zinc-700" />
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => handleDeleteLayer(selectedLayer.id)}
            data-testid="button-delete-layer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Layer
          </Button>
        </div>
      );

      return (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-zinc-200">Edit Layer</h3>
              {getLayerTypeBadge()}
            </div>
            <p className="text-xs text-zinc-500">{selectedLayer.name}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {selectedLayer.layerType === "typography" && renderTypographyEditor()}
              {selectedLayer.layerType === "logo" && renderLogoEditor()}
              {(selectedLayer.layerType === "graphic" || selectedLayer.layerType === "generated") && renderAIGraphicEditor()}
              {renderCommonControls()}
            </div>
          </ScrollArea>
        </div>
      );
    }

    // === ADD DESIGN MODE (no layer selected) ===
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-400" />
            Add Design
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Select an area and add design elements</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            <div>
              <label className="text-xs text-zinc-400 mb-3 block font-medium">Quick Area Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(QUICK_AREA_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className={`h-10 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-violet-500 ${selectedAreaPreset === key ? "bg-violet-600/30 border-violet-500" : ""}`}
                    onClick={() => {
                      if (key === "upperBack" && selectedView !== "back") {
                        setSelectedView("back");
                      } else if (key !== "upperBack" && selectedView !== "front") {
                        setSelectedView("front");
                      }
                      setSelectedAreaPreset(key);
                      toast({
                        title: `${preset.label} Selected`,
                        description: "Now add a layer to this area",
                      });
                    }}
                    data-testid={`button-preset-area-${key}`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-700/50" />

            <div>
              <label className="text-xs text-zinc-400 mb-3 block font-medium">Add Layer</label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-blue-500"
                  onClick={() => handleCreateLayer("typography")}
                  data-testid="button-add-text-layer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Type className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Text Layer</p>
                      <p className="text-xs text-zinc-500">Add custom typography</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-emerald-500"
                  onClick={() => handleCreateLayer("logo")}
                  data-testid="button-add-logo-layer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Logo / Image Layer</p>
                      <p className="text-xs text-zinc-500">Upload logos or graphics</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14 justify-start border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-violet-500"
                  onClick={() => handleCreateLayer("graphic")}
                  data-testid="button-add-ai-graphic-layer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">AI Graphic Layer</p>
                      <p className="text-xs text-zinc-500">Generate with AI</p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {project.status === "generating" && (
              <div className="p-3 bg-violet-900/20 border border-violet-700/50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-violet-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generation in progress...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderFinalizeDialog = () => (
    <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Finalize Design
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Mark this design as finalized. You can optionally attach it to an existing design job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Design Summary</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-zinc-500 mb-1">Front</p>
                <div className="aspect-square rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                  {(currentVersion?.compositeFrontUrl || currentVersion?.frontImageUrl) ? (
                    <img
                      src={currentVersion.compositeFrontUrl || currentVersion.frontImageUrl}
                      alt="Front design"
                      className="w-full h-full object-contain"
                      data-testid="img-finalize-front"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 mb-1">Back</p>
                <div className="aspect-square rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                  {(currentVersion?.compositeBackUrl || currentVersion?.backImageUrl) ? (
                    <img
                      src={currentVersion.compositeBackUrl || currentVersion.backImageUrl}
                      alt="Back design"
                      className="w-full h-full object-contain"
                      data-testid="img-finalize-back"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-700" />

          <div>
            <label className="text-sm text-zinc-400 mb-2 block flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Attach to Design Job (Optional)
            </label>
            <Select
              value={selectedDesignJobId}
              onValueChange={setSelectedDesignJobId}
            >
              <SelectTrigger 
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                data-testid="select-design-job"
              >
                <SelectValue placeholder="Select a design job (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="none" className="text-zinc-400">
                  No design job
                </SelectItem>
                {designJobsLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  designJobs.map((job) => (
                    <SelectItem
                      key={job.id}
                      value={job.id.toString()}
                      className="text-zinc-200"
                    >
                      <span className="font-medium">{job.jobCode}</span>
                      {job.brief && (
                        <span className="text-zinc-400 text-xs ml-2 truncate">
                          {job.brief.substring(0, 30)}...
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedDesignJobId && selectedDesignJobId !== "none" && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Design will be attached to this job
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setFinalizeDialogOpen(false)}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            data-testid="button-cancel-finalize"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={finalizeProjectMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-confirm-finalize"
          >
            {finalizeProjectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalize Design
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderVersionHistoryPanel = () => (
    <Sheet open={historyPanelOpen} onOpenChange={setHistoryPanelOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] bg-zinc-900 border-zinc-700 p-0">
        <SheetHeader className="p-4 border-b border-zinc-700">
          <SheetTitle className="text-zinc-200 flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-400" />
            Version History
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {versionsLoading ? (
              [1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="w-full h-32 bg-zinc-800" />
              ))
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400">No versions yet</p>
                <p className="text-xs text-zinc-500 mt-1">Generate a design to create your first version</p>
              </div>
            ) : (
              [...versions].sort((a, b) => b.versionNumber - a.versionNumber).map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "rounded-lg border p-3 transition-all cursor-pointer",
                    currentVersion?.id === version.id
                      ? "border-violet-500 bg-violet-900/20"
                      : previewVersion?.id === version.id
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
                  )}
                  onClick={() => handlePreviewVersion(version)}
                  data-testid={`version-card-${version.id}`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded bg-zinc-700 overflow-hidden shrink-0">
                      {version.frontImageUrl ? (
                        <img
                          src={version.frontImageUrl}
                          alt={`Version ${version.versionNumber}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200">
                            v{version.versionNumber}
                          </span>
                          {version.name && (
                            <span className="text-xs text-zinc-400 truncate max-w-24">
                              {version.name}
                            </span>
                          )}
                          {currentVersion?.id === version.id && (
                            <Badge className="text-xs bg-violet-600/30 text-violet-300 border-violet-500/50">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </p>
                      {version.generationPrompt && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-1">
                          "{version.generationPrompt}"
                        </p>
                      )}
                      {version.generationDuration && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Generated in {(version.generationDuration / 1000).toFixed(1)}s
                          {version.generationProvider && (
                            <span className="ml-1 text-zinc-600">via {version.generationProvider}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {(previewVersion?.id === version.id || currentVersion?.id !== version.id) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700">
                      {previewVersion?.id === version.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComparison();
                            }}
                            className={cn(
                              "flex-1 h-8 text-xs",
                              comparisonMode
                                ? "bg-blue-600/30 border-blue-500 text-blue-300"
                                : "bg-zinc-800 border-zinc-700 text-zinc-300"
                            )}
                            data-testid={`button-compare-${version.id}`}
                          >
                            <Columns className="h-3 w-3 mr-1" />
                            {comparisonMode ? "Exit Compare" : "Compare"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExitPreview();
                            }}
                            className="h-8 px-2 bg-zinc-800 border-zinc-700 text-zinc-400"
                            data-testid={`button-exit-preview-${version.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {currentVersion?.id !== version.id && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version.id);
                          }}
                          disabled={isRestoring}
                          className="flex-1 h-8 text-xs bg-violet-600 hover:bg-violet-700"
                          data-testid={`button-restore-${version.id}`}
                        >
                          {isRestoring ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Restore
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  const renderVersionHistory = () => (
    <div className="h-20 border-t border-zinc-700 bg-zinc-900/50 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <History className="h-4 w-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-300">Version History</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryPanelOpen(true)}
          className="h-5 px-2 ml-auto text-xs text-violet-400 hover:text-violet-300"
          data-testid="button-expand-history"
        >
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {versionsLoading ? (
            [1, 2, 3].map(i => (
              <Skeleton key={i} className="w-16 h-10 bg-zinc-800 shrink-0" />
            ))
          ) : versions.length === 0 ? (
            <span className="text-xs text-zinc-500">No versions yet</span>
          ) : (
            versions.map((version) => (
              <Tooltip key={version.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handlePreviewVersion(version)}
                    className={cn(
                      "w-16 h-10 rounded border shrink-0 flex items-center justify-center text-xs transition-colors",
                      currentVersion?.id === version.id
                        ? "border-violet-500 bg-violet-900/30"
                        : previewVersion?.id === version.id
                        ? "border-blue-500 bg-blue-900/30"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    )}
                    data-testid={`version-${version.id}`}
                  >
                    v{version.versionNumber}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Version {version.versionNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                  </p>
                  {version.generationPrompt && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-48 line-clamp-2">
                      "{version.generationPrompt}"
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-screen bg-zinc-900 flex flex-col">
        <div className="h-14 border-b border-zinc-700 px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Link href="/design-lab" data-testid="link-back-to-design-lab">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-200 truncate max-w-32">{project.name}</span>
              <span className="text-xs text-zinc-500">{project.projectCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={cn("text-xs", getStatusBadgeStyles(project.status))} data-testid="badge-status">
              {getStatusLabel(project.status)}
            </Badge>
            {versions.length > 0 && project.status !== "finalized" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFinalizeDialog}
                className="h-8 w-8 p-0 text-green-400"
                data-testid="button-finalize-mobile"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-zinc-400"
              data-testid="button-save"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {renderFinalizeDialog()}

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`${selectedView} view`}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ transform: `scale(${zoomLevel / 100})` }}
                data-testid="canvas-image"
              />
            ) : (
              <div
                className="w-full h-full max-w-md max-h-md rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"
                data-testid="canvas-placeholder"
              >
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm text-zinc-500">No design yet</p>
                  <p className="text-xs text-zinc-600">Generate with AI to get started</p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-800/90 rounded-lg p-1 border border-zinc-700">
            <Button
              variant={selectedView === "front" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedView("front")}
              className={cn("h-7 px-3 text-xs", selectedView === "front" && "bg-zinc-700")}
              data-testid="button-view-front"
            >
              Front
            </Button>
            <Button
              variant={selectedView === "back" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedView("back")}
              className={cn("h-7 px-3 text-xs", selectedView === "back" && "bg-zinc-700")}
              data-testid="button-view-back"
            >
              Back
            </Button>
          </div>
        </div>

        <Tabs defaultValue="generate" className="border-t border-zinc-700 bg-zinc-900">
          <TabsList className="w-full h-12 bg-zinc-800/50 rounded-none border-b border-zinc-700">
            <TabsTrigger value="layers" className="flex-1 data-[state=active]:bg-zinc-700" data-testid="tab-layers">
              <Layers className="h-4 w-4 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex-1 data-[state=active]:bg-zinc-700" data-testid="tab-generate">
              <Sparkles className="h-4 w-4 mr-1" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-zinc-700" data-testid="tab-history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="h-48 mt-0">
            {renderLayerPanel()}
          </TabsContent>
          <TabsContent value="generate" className="h-48 mt-0">
            {renderPropertiesPanel()}
          </TabsContent>
          <TabsContent value="history" className="h-48 mt-0 p-2">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2">
                {versions.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No versions yet</p>
                ) : (
                  [...versions].sort((a, b) => b.versionNumber - a.versionNumber).map((version) => (
                    <div
                      key={version.id}
                      className={cn(
                        "rounded-lg border p-2 transition-all",
                        currentVersion?.id === version.id
                          ? "border-violet-500 bg-violet-900/30"
                          : previewVersion?.id === version.id
                          ? "border-blue-500 bg-blue-900/30"
                          : "border-zinc-700 bg-zinc-800"
                      )}
                      data-testid={`version-mobile-${version.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-zinc-700 overflow-hidden shrink-0">
                          {version.frontImageUrl ? (
                            <img
                              src={version.frontImageUrl}
                              alt={`v${version.versionNumber}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-zinc-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-zinc-200">v{version.versionNumber}</span>
                            {currentVersion?.id === version.id && (
                              <Badge className="text-[10px] px-1 py-0 bg-violet-600/30 text-violet-300 border-violet-500/50">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewVersion(version)}
                            className="h-7 w-7 p-0 text-zinc-400"
                            data-testid={`button-preview-mobile-${version.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {currentVersion?.id !== version.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreVersion(version.id)}
                              disabled={isRestoring}
                              className="h-7 w-7 p-0 text-violet-400"
                              data-testid={`button-restore-mobile-${version.id}`}
                            >
                              {isRestoring ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 flex flex-col">
      <div className="h-14 border-b border-zinc-700 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/design-lab" data-testid="link-back-to-design-lab">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6 bg-zinc-700" />
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-medium text-zinc-200" data-testid="text-project-name">{project.name}</h1>
              <p className="text-xs text-zinc-500" data-testid="text-project-code">{project.projectCode}</p>
            </div>
            <Badge className={cn("text-xs", getStatusBadgeStyles(project.status))} data-testid="badge-status">
              {getStatusLabel(project.status)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-zinc-500" data-testid="text-last-saved">
              Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            data-testid="button-save"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryPanelOpen(true)}
                className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                data-testid="button-open-history"
              >
                <Clock className="h-4 w-4 mr-2" />
                History
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View version history</p>
            </TooltipContent>
          </Tooltip>
          {versions.length > 0 && project.status !== "finalized" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenFinalizeDialog}
                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-finalize"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalize
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finalize and complete this design</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {renderFinalizeDialog()}
      {renderVersionHistoryPanel()}

      {previewVersion && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-blue-900/90 rounded-lg px-4 py-2 border border-blue-700 shadow-lg">
          <Eye className="h-4 w-4 text-blue-300" />
          <span className="text-sm text-blue-200">
            Previewing v{previewVersion.versionNumber}
            {previewVersion.name && ` - ${previewVersion.name}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleComparison}
            className={cn(
              "h-7 px-2 text-xs ml-2",
              comparisonMode
                ? "bg-blue-600/50 text-blue-200"
                : "text-blue-300 hover:text-blue-100"
            )}
            data-testid="button-toggle-comparison-mode"
          >
            <Columns className="h-3 w-3 mr-1" />
            {comparisonMode ? "Exit Compare" : "Compare"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRestoreVersion(previewVersion.id)}
            disabled={isRestoring || currentVersion?.id === previewVersion.id}
            className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700"
            data-testid="button-restore-preview"
          >
            {isRestoring ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3 mr-1" />
            )}
            Restore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitPreview}
            className="h-7 w-7 p-0 text-blue-300 hover:text-blue-100"
            data-testid="button-exit-preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {leftPanelOpen && (
          <div className="w-64 border-r border-zinc-700 bg-zinc-900/50 flex flex-col shrink-0">
            {renderLayerPanel()}
          </div>
        )}

        <div className="flex-1 flex flex-col relative">
          <div className="absolute top-3 left-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="h-8 w-8 p-0 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
              data-testid="button-toggle-left-panel"
            >
              {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-zinc-800/90 rounded-lg p-1 border border-zinc-700">
            <Button
              variant={selectedView === "front" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedView("front")}
              className={cn("h-7 px-4 text-xs", selectedView === "front" && "bg-zinc-700")}
              data-testid="button-view-front"
            >
              Front
            </Button>
            <Button
              variant={selectedView === "back" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedView("back")}
              className={cn("h-7 px-4 text-xs", selectedView === "back" && "bg-zinc-700")}
              data-testid="button-view-back"
            >
              Back
            </Button>
          </div>

          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="h-8 w-8 p-0 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
              data-testid="button-toggle-right-panel"
            >
              {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <div ref={canvasRef} className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50 relative">
            {comparisonMode && previewVersion ? (
              <div className="flex gap-6 items-center justify-center w-full h-full" data-testid="comparison-view">
                <div className="flex flex-col items-center gap-2 max-w-[45%]">
                  <div className="text-xs text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full mb-2">
                    Current (v{currentVersion?.versionNumber || "?"})
                  </div>
                  {originalImageUrl ? (
                    <img
                      src={originalImageUrl}
                      alt={`Current ${selectedView} view`}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border-2 border-violet-500/50"
                      style={{ transform: `scale(${zoomLevel / 100})`, transition: "transform 0.2s ease" }}
                      data-testid="canvas-image-current"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-violet-500/50 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-px h-32 bg-zinc-600" />
                  <div className="p-2 bg-zinc-800 rounded-full border border-zinc-600 my-2">
                    <Columns className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="w-px h-32 bg-zinc-600" />
                </div>
                <div className="flex flex-col items-center gap-2 max-w-[45%]">
                  <div className="text-xs text-blue-300 bg-blue-900/80 px-3 py-1 rounded-full mb-2">
                    Preview (v{previewVersion.versionNumber})
                  </div>
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={`Preview ${selectedView} view`}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border-2 border-blue-500/50"
                      style={{ transform: `scale(${zoomLevel / 100})`, transition: "transform 0.2s ease" }}
                      data-testid="canvas-image-preview"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-blue-500/50 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="relative"
                style={{ transform: `scale(${zoomLevel / 100})`, transition: "transform 0.2s ease" }}
                data-testid="canvas-container"
              >
                {/* Base template image */}
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt={`${selectedView} view`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    data-testid="canvas-image"
                  />
                ) : (
                  <div
                    className="w-96 h-96 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center"
                    data-testid="canvas-placeholder"
                  >
                    <div className="text-center">
                      <div className="p-4 rounded-full bg-zinc-800 mb-4 inline-block">
                        <ImageIcon className="h-8 w-8 text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-400">No template selected</p>
                      <p className="text-xs text-zinc-600 mt-1">Add layers using the panel on the right</p>
                    </div>
                  </div>
                )}

                {/* Render ALL visible layers (sorted by zIndex, lowest first) */}
                {[...layers].sort((a, b) => a.zIndex - b.zIndex).map((layer) => {
                  if (!layer.isVisible) return null;
                  const isSelected = selectedLayerId === layer.id;
                  const pos = layer.position || { x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1 };
                  const layerOpacity = typeof layer.opacity === 'string' 
                    ? parseFloat(layer.opacity) 
                    : (layer.opacity ?? 100);
                  
                  return (
                    <div
                      key={layer.id}
                      className={cn(
                        "absolute overflow-hidden",
                        isSelected && !layer.isLocked && "ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent cursor-move"
                      )}
                      style={{
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                        width: `${pos.width}px`,
                        height: `${pos.height}px`,
                        transform: `rotate(${pos.rotation || 0}deg) scale(${pos.scale || 1})`,
                        opacity: layerOpacity / 100,
                        zIndex: layer.zIndex,
                        mixBlendMode: (layer.blendMode as any) || 'normal',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayerId(layer.id);
                      }}
                      onMouseDown={(e) => {
                        if (isSelected && !layer.isLocked) {
                          handlePositionBoxMouseDown(e);
                        }
                      }}
                      data-testid={`layer-render-${layer.id}`}
                    >
                      {/* Layer content based on type */}
                      {layer.imageUrl && (
                        <img 
                          src={layer.imageUrl} 
                          alt={layer.name}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                      )}
                      
                      {/* Typography layer - show text content */}
                      {layer.layerType === 'typography' && layer.textContent && !layer.imageUrl && (
                        <div 
                          className="w-full h-full flex items-center justify-center p-2 pointer-events-none"
                          style={{
                            fontFamily: layer.textStyle?.font || 'Arial',
                            fontSize: `${layer.textStyle?.size || 24}px`,
                            color: layer.textStyle?.color || '#ffffff',
                          }}
                        >
                          {layer.textContent}
                        </div>
                      )}

                      {/* Empty layer placeholder */}
                      {!layer.imageUrl && !layer.textContent && (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800/50 border border-dashed border-zinc-600 rounded">
                          <span className="text-xs text-zinc-500">{layer.name}</span>
                        </div>
                      )}

                      {/* Selection handles for selected, unlocked layer */}
                      {isSelected && !layer.isLocked && (
                        <>
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-nw-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'nw')} />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-ne-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'ne')} />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-sw-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'sw')} />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-se-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'se')} />
                          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-w-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'w')} />
                          <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-e-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'e')} />
                          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-n-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 'n')} />
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-violet-500 border border-white rounded-sm cursor-s-resize" onMouseDown={(e) => handlePositionBoxMouseDown(e, 's')} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-800/90 rounded-lg p-1 border border-zinc-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(-25)}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-zinc-400 w-12 text-center" data-testid="text-zoom-level">{zoomLevel}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(25)}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4 bg-zinc-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToScreen}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
              data-testid="button-zoom-fit"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {rightPanelOpen && (
          <div className="w-80 border-l border-zinc-700 bg-zinc-900/50 flex flex-col shrink-0">
            {renderPropertiesPanel()}
          </div>
        )}
      </div>

      {renderVersionHistory()}
    </div>
  );
}
