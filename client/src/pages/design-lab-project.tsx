import { useEffect, useState, useMemo } from "react";
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
  createdAt: string;
  updatedAt: string;
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

type ViewType = "front" | "back";
type StylePreset = "athletic" | "modern" | "vintage" | "bold";
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
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>("modern");
  const [requestType, setRequestType] = useState<RequestType>("base_generation");
  
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DesignVersion | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [selectedDesignJobId, setSelectedDesignJobId] = useState<string>("");

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
      return selectedView === "front" ? previewVersion.frontImageUrl : previewVersion.backImageUrl;
    }
    // First try to get from current version's generated design
    if (currentVersion) {
      const versionImage = selectedView === "front" ? currentVersion.frontImageUrl : currentVersion.backImageUrl;
      if (versionImage) return versionImage;
    }
    // Fallback to variant's template images
    if (variant) {
      return selectedView === "front" ? variant.frontTemplateUrl : variant.backTemplateUrl;
    }
    return null;
  }, [currentVersion, previewVersion, selectedView, variant]);

  const originalImageUrl = useMemo(() => {
    if (!currentVersion) return null;
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
    mutationFn: async (data: { prompt: string; style: StylePreset; requestType: RequestType }) => {
      return apiRequest<any>("/api/design-lab/generate", {
        method: "POST",
        body: {
          projectId,
          prompt: data.prompt,
          style: data.style,
          requestType: data.requestType,
          view: selectedView,
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
      style: selectedStyle,
      requestType,
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
            >
              <Type className="h-4 w-4 mr-2" />
              Typography
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-zinc-700"
              data-testid="menu-item-add-logo"
            >
              <Circle className="h-4 w-4 mr-2" />
              Logo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-200 focus:bg-zinc-700"
              data-testid="menu-item-add-graphic"
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
            layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                  selectedLayerId === layer.id
                    ? "bg-violet-600/30 border border-violet-500/50"
                    : "hover:bg-zinc-800 border border-transparent"
                )}
                data-testid={`layer-item-${layer.id}`}
              >
                <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
                {layer.isLocked && <Lock className="h-3 w-3 text-zinc-500" />}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderPropertiesPanel = () => {
    if (selectedLayer) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-200">Properties</h3>
            <p className="text-xs text-zinc-500 mt-1">{selectedLayer.name}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
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
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Size</label>
                <div className="grid grid-cols-2 gap-2">
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

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">
                  Rotation: {selectedLayer.position?.rotation || 0}°
                </label>
                <Slider
                  value={[selectedLayer.position?.rotation || 0]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={(value) => handleUpdateLayerPosition(selectedLayer.id, "rotation", value[0])}
                  className="[&_[role=slider]]:bg-violet-500"
                  data-testid="slider-rotation"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">
                  Scale: {(selectedLayer.position?.scale || 1).toFixed(2)}x
                </label>
                <Slider
                  value={[selectedLayer.position?.scale || 1]}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => handleUpdateLayerPosition(selectedLayer.id, "scale", value[0])}
                  className="[&_[role=slider]]:bg-violet-500"
                  data-testid="slider-scale"
                />
              </div>

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
                <label className="text-xs text-zinc-400 mb-2 block">Blend Mode</label>
                <Select 
                  value={selectedLayer.blendMode || "normal"}
                  onValueChange={(value) => handleUpdateLayerProperty(selectedLayer.id, "blendMode", value)}
                >
                  <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200" data-testid="select-blend-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="darken">Darken</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-zinc-700" />

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                data-testid="button-delete-layer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Layer
              </Button>
            </div>
          </ScrollArea>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            AI Generation
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Describe Your Design</label>
              <Textarea
                placeholder="A bold athletic jersey with dynamic geometric patterns, featuring team colors..."
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                className="min-h-24 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none"
                data-testid="textarea-generation-prompt"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Style Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {(["athletic", "modern", "vintage", "bold"] as StylePreset[]).map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                    className={cn(
                      "capitalize",
                      selectedStyle === style
                        ? "bg-violet-600 hover:bg-violet-700 border-violet-500"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                    )}
                    data-testid={`button-style-${style}`}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Request Type</label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200" data-testid="select-request-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="base_generation">Base Generation</SelectItem>
                  <SelectItem value="typography_iteration">Typography Iteration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !generationPrompt.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Design
                </>
              )}
            </Button>

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
                  {currentVersion?.frontImageUrl ? (
                    <img
                      src={currentVersion.frontImageUrl}
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
                  {currentVersion?.backImageUrl ? (
                    <img
                      src={currentVersion.backImageUrl}
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

          <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/50">
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
            ) : currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`${selectedView} view`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ transform: `scale(${zoomLevel / 100})`, transition: "transform 0.2s ease" }}
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
                  <p className="text-sm text-zinc-400">No design yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Use the AI panel to generate your design</p>
                </div>
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
