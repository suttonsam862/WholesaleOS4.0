import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  ImageIcon,
  Layers,
  Brain,
  FolderOpen,
  Upload,
  ChevronDown,
  Palette,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface DesignTemplate {
  id: number;
  name: string;
  templateType: "front" | "back" | "sleeve" | "custom";
  baseImageUrl: string;
  variantId?: number;
  focusAreaMask?: any;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface DesignLockedOverlay {
  id: number;
  name: string;
  overlayImageUrl: string;
  position?: any;
  templateType: "front" | "back" | "sleeve" | "custom";
  zIndex: number;
  variantId?: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrainingImage {
  id: number;
  imageUrl: string;
  caption?: string;
  metadata?: any;
  createdAt: string;
}

interface TrainingSet {
  id: number;
  name: string;
  description?: string;
  category: "typography" | "logo" | "graphic" | "pattern" | "general";
  status: "active" | "inactive" | "processing";
  imageCount: number;
  images?: TrainingImage[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface StylePreset {
  id: number;
  name: string;
  description?: string;
  promptModifier: string;
  thumbnailUrl?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  templateType: z.enum(["front", "back", "sleeve", "custom"]),
  baseImageUrl: z.string().min(1, "Base image URL is required"),
  focusAreaMask: z.string().optional(),
  variantId: z.number().optional(),
  isActive: z.boolean().optional(),
});

const overlaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  templateType: z.enum(["front", "back", "sleeve", "custom"]),
  overlayImageUrl: z.string().min(1, "Overlay image URL is required"),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  zIndex: z.number().int().optional(),
  variantId: z.number().optional(),
  isActive: z.boolean().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type OverlayFormData = z.infer<typeof overlaySchema>;

const trainingSetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(["typography", "logo", "graphic", "pattern", "general"]),
});

const stylePresetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  promptModifier: z.string().min(1, "Prompt modifier is required"),
  thumbnailUrl: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

type TrainingSetFormData = z.infer<typeof trainingSetSchema>;
type StylePresetFormData = z.infer<typeof stylePresetSchema>;

export function DesignLabAdmin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("templates");
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
  const [editingOverlay, setEditingOverlay] = useState<DesignLockedOverlay | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [deleteOverlayId, setDeleteOverlayId] = useState<number | null>(null);

  const [isTrainingSetDialogOpen, setIsTrainingSetDialogOpen] = useState(false);
  const [isStylePresetDialogOpen, setIsStylePresetDialogOpen] = useState(false);
  const [editingTrainingSet, setEditingTrainingSet] = useState<TrainingSet | null>(null);
  const [editingStylePreset, setEditingStylePreset] = useState<StylePreset | null>(null);
  const [deleteTrainingSetId, setDeleteTrainingSetId] = useState<number | null>(null);
  const [deleteStylePresetId, setDeleteStylePresetId] = useState<number | null>(null);
  const [deleteTrainingImageId, setDeleteTrainingImageId] = useState<number | null>(null);
  const [selectedTrainingSetId, setSelectedTrainingSetId] = useState<number | null>(null);
  const [isStylePresetsOpen, setIsStylePresetsOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    if (!isLoading && user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive",
      });
      setLocation("/design-lab");
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const { data: templates = [], isLoading: templatesLoading } = useQuery<DesignTemplate[]>({
    queryKey: ["/api/design-lab/templates"],
    retry: false,
  });

  const { data: overlays = [], isLoading: overlaysLoading } = useQuery<DesignLockedOverlay[]>({
    queryKey: ["/api/design-lab/overlays"],
    retry: false,
  });

  const { data: trainingSets = [], isLoading: trainingSetsLoading } = useQuery<TrainingSet[]>({
    queryKey: ["/api/design-lab/admin/training-sets"],
    retry: false,
  });

  const { data: selectedTrainingSet, isLoading: trainingSetDetailLoading } = useQuery<TrainingSet>({
    queryKey: ["/api/design-lab/admin/training-sets", selectedTrainingSetId],
    enabled: selectedTrainingSetId !== null,
    retry: false,
  });

  const { data: stylePresets = [], isLoading: stylePresetsLoading } = useQuery<StylePreset[]>({
    queryKey: ["/api/design-lab/style-presets"],
    retry: false,
  });

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      templateType: "front",
      baseImageUrl: "",
      focusAreaMask: "",
      isActive: true,
    },
  });

  const overlayForm = useForm<OverlayFormData>({
    resolver: zodResolver(overlaySchema),
    defaultValues: {
      name: "",
      templateType: "front",
      overlayImageUrl: "",
      positionX: 0,
      positionY: 0,
      width: 100,
      height: 100,
      zIndex: 100,
      isActive: true,
    },
  });

  const trainingSetForm = useForm<TrainingSetFormData>({
    resolver: zodResolver(trainingSetSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "general",
    },
  });

  const stylePresetForm = useForm<StylePresetFormData>({
    resolver: zodResolver(stylePresetSchema),
    defaultValues: {
      name: "",
      description: "",
      promptModifier: "",
      thumbnailUrl: "",
      category: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiRequest<DesignTemplate>("/api/design-lab/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/templates"] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
      toast({ title: "Template created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create template",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TemplateFormData> }) => {
      return apiRequest<DesignTemplate>(`/api/design-lab/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({ title: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update template",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/design-lab/templates/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/templates"] });
      setDeleteTemplateId(null);
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createOverlayMutation = useMutation({
    mutationFn: async (data: OverlayFormData) => {
      return apiRequest<DesignLockedOverlay>("/api/design-lab/overlays", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/overlays"] });
      setIsOverlayDialogOpen(false);
      overlayForm.reset();
      toast({ title: "Overlay created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create overlay",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateOverlayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<OverlayFormData> }) => {
      return apiRequest<DesignLockedOverlay>(`/api/design-lab/overlays/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/overlays"] });
      setIsOverlayDialogOpen(false);
      setEditingOverlay(null);
      overlayForm.reset();
      toast({ title: "Overlay updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update overlay",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteOverlayMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/design-lab/overlays/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/overlays"] });
      setDeleteOverlayId(null);
      toast({ title: "Overlay deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete overlay",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createTrainingSetMutation = useMutation({
    mutationFn: async (data: TrainingSetFormData) => {
      return apiRequest<TrainingSet>("/api/design-lab/admin/training-sets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets"] });
      setIsTrainingSetDialogOpen(false);
      trainingSetForm.reset();
      toast({ title: "Training set created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create training set",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateTrainingSetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TrainingSetFormData> }) => {
      return apiRequest<TrainingSet>(`/api/design-lab/admin/training-sets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets"] });
      setIsTrainingSetDialogOpen(false);
      setEditingTrainingSet(null);
      trainingSetForm.reset();
      toast({ title: "Training set updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update training set",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteTrainingSetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/design-lab/admin/training-sets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets"] });
      setDeleteTrainingSetId(null);
      toast({ title: "Training set deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete training set",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const addTrainingImageMutation = useMutation({
    mutationFn: async ({ setId, imageUrl, caption, metadata }: { setId: number; imageUrl: string; caption?: string; metadata?: any }) => {
      return apiRequest(`/api/design-lab/admin/training-sets/${setId}/images`, {
        method: "POST",
        body: JSON.stringify({ imageUrl, caption, metadata }),
      });
    },
    onSuccess: () => {
      if (selectedTrainingSetId) {
        queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets", selectedTrainingSetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets"] });
      toast({ title: "Image added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add image",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteTrainingImageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/design-lab/admin/training-images/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      if (selectedTrainingSetId) {
        queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets", selectedTrainingSetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/admin/training-sets"] });
      setDeleteTrainingImageId(null);
      toast({ title: "Image deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete image",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createStylePresetMutation = useMutation({
    mutationFn: async (data: StylePresetFormData) => {
      return apiRequest<StylePreset>("/api/design-lab/admin/style-presets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/style-presets"] });
      setIsStylePresetDialogOpen(false);
      stylePresetForm.reset();
      toast({ title: "Style preset created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create style preset",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateStylePresetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StylePresetFormData> }) => {
      return apiRequest<StylePreset>(`/api/design-lab/admin/style-presets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/style-presets"] });
      setIsStylePresetDialogOpen(false);
      setEditingStylePreset(null);
      stylePresetForm.reset();
      toast({ title: "Style preset updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update style preset",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteStylePresetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/design-lab/admin/style-presets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/style-presets"] });
      setDeleteStylePresetId(null);
      toast({ title: "Style preset deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete style preset",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    templateForm.reset({
      name: "",
      templateType: "front",
      baseImageUrl: "",
      focusAreaMask: "",
      isActive: true,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: DesignTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      templateType: template.templateType,
      baseImageUrl: template.baseImageUrl,
      focusAreaMask: template.focusAreaMask,
      variantId: template.variantId,
      isActive: template.isActive,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleTemplateSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleOpenCreateOverlay = () => {
    setEditingOverlay(null);
    overlayForm.reset({
      name: "",
      templateType: "front",
      overlayImageUrl: "",
      positionX: 0,
      positionY: 0,
      width: 100,
      height: 100,
      zIndex: 100,
      isActive: true,
    });
    setIsOverlayDialogOpen(true);
  };

  const handleEditOverlay = (overlay: DesignLockedOverlay) => {
    setEditingOverlay(overlay);
    overlayForm.reset({
      name: overlay.name,
      templateType: overlay.templateType,
      overlayImageUrl: overlay.overlayImageUrl,
      positionX: overlay.position?.x ?? 0,
      positionY: overlay.position?.y ?? 0,
      width: overlay.position?.width ?? 100,
      height: overlay.position?.height ?? 100,
      zIndex: overlay.zIndex,
      variantId: overlay.variantId,
      isActive: overlay.isActive,
    });
    setIsOverlayDialogOpen(true);
  };

  const handleOverlaySubmit = (data: OverlayFormData) => {
    if (editingOverlay) {
      updateOverlayMutation.mutate({ id: editingOverlay.id, data });
    } else {
      createOverlayMutation.mutate(data);
    }
  };

  const handleOpenCreateTrainingSet = () => {
    setEditingTrainingSet(null);
    trainingSetForm.reset({
      name: "",
      description: "",
      category: "general",
    });
    setIsTrainingSetDialogOpen(true);
  };

  const handleEditTrainingSet = (set: TrainingSet) => {
    setEditingTrainingSet(set);
    trainingSetForm.reset({
      name: set.name,
      description: set.description || "",
      category: set.category,
    });
    setIsTrainingSetDialogOpen(true);
  };

  const handleTrainingSetSubmit = (data: TrainingSetFormData) => {
    if (editingTrainingSet) {
      updateTrainingSetMutation.mutate({ id: editingTrainingSet.id, data });
    } else {
      createTrainingSetMutation.mutate(data);
    }
  };

  const handleOpenCreateStylePreset = () => {
    setEditingStylePreset(null);
    stylePresetForm.reset({
      name: "",
      description: "",
      promptModifier: "",
      thumbnailUrl: "",
      category: "",
      sortOrder: 0,
      isActive: true,
    });
    setIsStylePresetDialogOpen(true);
  };

  const handleEditStylePreset = (preset: StylePreset) => {
    setEditingStylePreset(preset);
    stylePresetForm.reset({
      name: preset.name,
      description: preset.description || "",
      promptModifier: preset.promptModifier,
      thumbnailUrl: preset.thumbnailUrl || "",
      category: preset.category || "",
      sortOrder: preset.sortOrder,
      isActive: preset.isActive,
    });
    setIsStylePresetDialogOpen(true);
  };

  const handleStylePresetSubmit = (data: StylePresetFormData) => {
    if (editingStylePreset) {
      updateStylePresetMutation.mutate({ id: editingStylePreset.id, data });
    } else {
      createStylePresetMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/design-lab">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-violet-400" />
                <h1 className="text-xl font-semibold text-zinc-100">Design Lab Admin</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900/50 border border-zinc-800/50 mb-6">
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              data-testid="tab-templates"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="overlays"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              data-testid="tab-overlays"
            >
              <Layers className="h-4 w-4 mr-2" />
              Locked Overlays
            </TabsTrigger>
            <TabsTrigger
              value="training"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              data-testid="tab-training"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Training
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-100">Design Templates</CardTitle>
                <Button onClick={handleOpenCreateTemplate} className="bg-violet-600 hover:bg-violet-700" data-testid="button-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found. Create your first template to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Preview</TableHead>
                        <TableHead className="text-zinc-400">Name</TableHead>
                        <TableHead className="text-zinc-400">Type</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id} className="border-zinc-800" data-testid={`row-template-${template.id}`}>
                          <TableCell>
                            <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden">
                              {template.baseImageUrl ? (
                                <img
                                  src={template.baseImageUrl}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-zinc-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-200 font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 capitalize">
                              {template.templateType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                template.isActive
                                  ? "bg-green-900/30 text-green-300 border-green-800/50"
                                  : "bg-zinc-900/30 text-zinc-400 border-zinc-800/50"
                              )}
                            >
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {format(new Date(template.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                                className="text-zinc-400 hover:text-zinc-200"
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTemplateId(template.id)}
                                className="text-zinc-400 hover:text-red-400"
                                data-testid={`button-delete-template-${template.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overlays">
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-100">Locked Overlays</CardTitle>
                <Button onClick={handleOpenCreateOverlay} className="bg-violet-600 hover:bg-violet-700" data-testid="button-create-overlay">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Overlay
                </Button>
              </CardHeader>
              <CardContent>
                {overlaysLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                    ))}
                  </div>
                ) : overlays.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No overlays found. Create your first overlay to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Preview</TableHead>
                        <TableHead className="text-zinc-400">Name</TableHead>
                        <TableHead className="text-zinc-400">Type</TableHead>
                        <TableHead className="text-zinc-400">Z-Index</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overlays.map((overlay) => (
                        <TableRow key={overlay.id} className="border-zinc-800" data-testid={`row-overlay-${overlay.id}`}>
                          <TableCell>
                            <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden">
                              {overlay.overlayImageUrl ? (
                                <img
                                  src={overlay.overlayImageUrl}
                                  alt={overlay.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Layers className="h-6 w-6 text-zinc-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-200 font-medium">{overlay.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-300 capitalize">
                              {overlay.templateType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400">{overlay.zIndex}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                overlay.isActive
                                  ? "bg-green-900/30 text-green-300 border-green-800/50"
                                  : "bg-zinc-900/30 text-zinc-400 border-zinc-800/50"
                              )}
                            >
                              {overlay.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {format(new Date(overlay.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditOverlay(overlay)}
                                className="text-zinc-400 hover:text-zinc-200"
                                data-testid={`button-edit-overlay-${overlay.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteOverlayId(overlay.id)}
                                className="text-zinc-400 hover:text-red-400"
                                data-testid={`button-delete-overlay-${overlay.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <div className="space-y-6">
              {selectedTrainingSetId ? (
                <Card className="bg-zinc-900/50 border-zinc-800/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTrainingSetId(null)}
                        className="text-zinc-400 hover:text-zinc-200"
                        data-testid="button-back-to-training-sets"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <CardTitle className="text-zinc-100">
                          {selectedTrainingSet?.name || "Training Set"}
                        </CardTitle>
                        <p className="text-sm text-zinc-400 mt-1">
                          {selectedTrainingSet?.images?.length || 0} images
                        </p>
                      </div>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={10}
                      allowedFileTypes={['image/*']}
                      onGetUploadParameters={async (file) => {
                        const response = await apiRequest<{
                          method: "PUT";
                          url: string;
                          uploadId: string;
                        }>("/api/upload-parameters", {
                          method: "POST",
                          body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                          }),
                        });
                        (file as any).__uploadId = response.uploadId;
                        return response;
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0 && selectedTrainingSetId) {
                          result.successful.forEach((file: any) => {
                            const uploadId = file.__uploadId;
                            if (uploadId) {
                              const publicUrl = `/public-objects/${uploadId}`;
                              addTrainingImageMutation.mutate({
                                setId: selectedTrainingSetId,
                                imageUrl: publicUrl,
                              });
                            }
                          });
                        }
                      }}
                      buttonClassName="bg-violet-600 hover:bg-violet-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </ObjectUploader>
                  </CardHeader>
                  <CardContent>
                    {trainingSetDetailLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} className="aspect-square bg-zinc-800 rounded-lg" />
                        ))}
                      </div>
                    ) : !selectedTrainingSet?.images?.length ? (
                      <div className="text-center py-12 text-zinc-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No images in this training set. Upload some images to get started.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {selectedTrainingSet.images.map((image) => (
                          <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800" data-testid={`training-image-${image.id}`}>
                            <img
                              src={image.imageUrl}
                              alt={image.caption || "Training image"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTrainingImageId(image.id)}
                                className="text-white hover:text-red-400 hover:bg-red-900/30"
                                data-testid={`button-delete-training-image-${image.id}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-xs text-white truncate">{image.caption}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-zinc-900/50 border-zinc-800/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-zinc-100">Training Sets</CardTitle>
                      <Button onClick={handleOpenCreateTrainingSet} className="bg-violet-600 hover:bg-violet-700" data-testid="button-create-training-set">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Training Set
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {trainingSetsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                          ))}
                        </div>
                      ) : trainingSets.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No training sets found. Create your first training set to get started.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800">
                              <TableHead className="text-zinc-400">Name</TableHead>
                              <TableHead className="text-zinc-400">Description</TableHead>
                              <TableHead className="text-zinc-400">Category</TableHead>
                              <TableHead className="text-zinc-400">Status</TableHead>
                              <TableHead className="text-zinc-400">Images</TableHead>
                              <TableHead className="text-zinc-400">Created</TableHead>
                              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trainingSets.map((set) => (
                              <TableRow
                                key={set.id}
                                className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                                onClick={() => setSelectedTrainingSetId(set.id)}
                                data-testid={`row-training-set-${set.id}`}
                              >
                                <TableCell className="text-zinc-200 font-medium">{set.name}</TableCell>
                                <TableCell className="text-zinc-400 max-w-xs truncate">{set.description || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 capitalize">
                                    {set.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      set.status === "active"
                                        ? "bg-green-900/30 text-green-300 border-green-800/50"
                                        : set.status === "processing"
                                        ? "bg-yellow-900/30 text-yellow-300 border-yellow-800/50"
                                        : "bg-zinc-900/30 text-zinc-400 border-zinc-800/50"
                                    )}
                                  >
                                    {set.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400">{set.imageCount}</TableCell>
                                <TableCell className="text-zinc-400">
                                  {format(new Date(set.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditTrainingSet(set)}
                                      className="text-zinc-400 hover:text-zinc-200"
                                      data-testid={`button-edit-training-set-${set.id}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteTrainingSetId(set.id)}
                                      className="text-zinc-400 hover:text-red-400"
                                      data-testid={`button-delete-training-set-${set.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Collapsible open={isStylePresetsOpen} onOpenChange={setIsStylePresetsOpen}>
                    <Card className="bg-zinc-900/50 border-zinc-800/50">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-2 hover:text-zinc-200 transition-colors" data-testid="toggle-style-presets">
                          <ChevronDown className={cn("h-5 w-5 text-zinc-400 transition-transform", isStylePresetsOpen && "rotate-180")} />
                          <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-violet-400" />
                            <CardTitle className="text-zinc-100">Style Presets</CardTitle>
                          </div>
                        </CollapsibleTrigger>
                        <Button onClick={handleOpenCreateStylePreset} className="bg-violet-600 hover:bg-violet-700" data-testid="button-create-style-preset">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Preset
                        </Button>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent>
                          {stylePresetsLoading ? (
                            <div className="space-y-4">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                              ))}
                            </div>
                          ) : stylePresets.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No style presets found. Create your first preset to get started.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {stylePresets.map((preset) => (
                                <div
                                  key={preset.id}
                                  className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-violet-500/50 transition-colors"
                                  data-testid={`card-style-preset-${preset.id}`}
                                >
                                  <div className="flex items-start gap-4">
                                    {preset.thumbnailUrl ? (
                                      <img
                                        src={preset.thumbnailUrl}
                                        alt={preset.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-lg bg-zinc-700 flex items-center justify-center">
                                        <Palette className="h-8 w-8 text-zinc-500" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-zinc-100 font-medium truncate">{preset.name}</h3>
                                        <Badge
                                          className={cn(
                                            "ml-2",
                                            preset.isActive
                                              ? "bg-green-900/30 text-green-300 border-green-800/50"
                                              : "bg-zinc-900/30 text-zinc-400 border-zinc-800/50"
                                          )}
                                        >
                                          {preset.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
                                        {preset.promptModifier}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditStylePreset(preset)}
                                          className="text-zinc-400 hover:text-zinc-200 h-8 px-2"
                                          data-testid={`button-edit-style-preset-${preset.id}`}
                                        >
                                          <Pencil className="h-3 w-3 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeleteStylePresetId(preset.id)}
                                          className="text-zinc-400 hover:text-red-400 h-8 px-2"
                                          data-testid={`button-delete-style-preset-${preset.id}`}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-4">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="Template name"
                        data-testid="input-template-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="select-template-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="front">Front</SelectItem>
                        <SelectItem value="back">Back</SelectItem>
                        <SelectItem value="sleeve">Sleeve</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="baseImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Base Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="https://..."
                        data-testid="input-template-image-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="focusAreaMask"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Focus Area Mask (optional)</FormLabel>
                    <p className="text-xs text-zinc-400 mb-2">Upload a mask image defining the design focus area</p>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value && (
                          <div className="text-sm text-zinc-400">
                            <p>Current: {field.value.split('/').pop()}</p>
                          </div>
                        )}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          allowedFileTypes={['image/*']}
                          onGetUploadParameters={async (file) => {
                            const response = await apiRequest<{
                              method: "PUT";
                              url: string;
                              uploadId: string;
                            }>("/api/upload-parameters", {
                              method: "POST",
                              body: JSON.stringify({
                                fileName: file.name,
                                fileType: file.type,
                              }),
                            });
                            (file as any).__uploadId = response.uploadId;
                            return response;
                          }}
                          onComplete={(result) => {
                            if (result.successful && result.successful.length > 0) {
                              const file = result.successful[0] as any;
                              const uploadId = file.__uploadId;
                              if (uploadId) {
                                const publicUrl = `/public-objects/${uploadId}`;
                                field.onChange(publicUrl);
                              }
                            }
                          }}
                          buttonClassName="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                        >
                          Upload Mask Image
                        </ObjectUploader>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTemplateDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300"
                  data-testid="button-cancel-template"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingOverlay ? "Edit Overlay" : "Create Overlay"}
            </DialogTitle>
          </DialogHeader>
          <Form {...overlayForm}>
            <form onSubmit={overlayForm.handleSubmit(handleOverlaySubmit)} className="space-y-4">
              <FormField
                control={overlayForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="Overlay name"
                        data-testid="input-overlay-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={overlayForm.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="select-overlay-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="front">Front</SelectItem>
                        <SelectItem value="back">Back</SelectItem>
                        <SelectItem value="sleeve">Sleeve</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={overlayForm.control}
                name="overlayImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Overlay Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="https://..."
                        data-testid="input-overlay-image-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={overlayForm.control}
                  name="positionX"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Position X</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-overlay-position-x"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={overlayForm.control}
                  name="positionY"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Position Y</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-overlay-position-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={overlayForm.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Width</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="100"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 100)}
                          data-testid="input-overlay-width"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={overlayForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Height</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="100"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 100)}
                          data-testid="input-overlay-height"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={overlayForm.control}
                name="zIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Z-Index</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="100"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                        data-testid="input-overlay-zindex"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOverlayDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300"
                  data-testid="button-cancel-overlay"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={createOverlayMutation.isPending || updateOverlayMutation.isPending}
                  data-testid="button-save-overlay"
                >
                  {(createOverlayMutation.isPending || updateOverlayMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingOverlay ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTemplateId !== null} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Template</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this template? This action will deactivate the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300" data-testid="button-cancel-delete-template">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-template"
            >
              {deleteTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOverlayId !== null} onOpenChange={(open) => !open && setDeleteOverlayId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Overlay</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this overlay? This action will deactivate the overlay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300" data-testid="button-cancel-delete-overlay">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOverlayId && deleteOverlayMutation.mutate(deleteOverlayId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-overlay"
            >
              {deleteOverlayMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isTrainingSetDialogOpen} onOpenChange={setIsTrainingSetDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingTrainingSet ? "Edit Training Set" : "Create Training Set"}
            </DialogTitle>
          </DialogHeader>
          <Form {...trainingSetForm}>
            <form onSubmit={trainingSetForm.handleSubmit(handleTrainingSetSubmit)} className="space-y-4">
              <FormField
                control={trainingSetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="Training set name"
                        data-testid="input-training-set-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={trainingSetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[80px]"
                        placeholder="Optional description..."
                        data-testid="input-training-set-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={trainingSetForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100" data-testid="select-training-set-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="typography">Typography</SelectItem>
                        <SelectItem value="logo">Logo</SelectItem>
                        <SelectItem value="graphic">Graphic</SelectItem>
                        <SelectItem value="pattern">Pattern</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTrainingSetDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300"
                  data-testid="button-cancel-training-set"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={createTrainingSetMutation.isPending || updateTrainingSetMutation.isPending}
                  data-testid="button-save-training-set"
                >
                  {(createTrainingSetMutation.isPending || updateTrainingSetMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingTrainingSet ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStylePresetDialogOpen} onOpenChange={setIsStylePresetDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingStylePreset ? "Edit Style Preset" : "Create Style Preset"}
            </DialogTitle>
          </DialogHeader>
          <Form {...stylePresetForm}>
            <form onSubmit={stylePresetForm.handleSubmit(handleStylePresetSubmit)} className="space-y-4">
              <FormField
                control={stylePresetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="Style preset name"
                        data-testid="input-style-preset-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stylePresetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        placeholder="Optional description..."
                        data-testid="input-style-preset-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stylePresetForm.control}
                name="promptModifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Prompt Modifier *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]"
                        placeholder="Enter the prompt modifier text that will be applied to AI generations..."
                        data-testid="input-style-preset-prompt-modifier"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stylePresetForm.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Thumbnail URL</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value && (
                          <div className="flex items-center gap-2">
                            <img src={field.value} alt="Thumbnail" className="w-12 h-12 rounded object-cover" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange("")}
                              className="text-zinc-400 hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          allowedFileTypes={['image/*']}
                          onGetUploadParameters={async (file) => {
                            const response = await apiRequest<{
                              method: "PUT";
                              url: string;
                              uploadId: string;
                            }>("/api/upload-parameters", {
                              method: "POST",
                              body: JSON.stringify({
                                fileName: file.name,
                                fileType: file.type,
                              }),
                            });
                            (file as any).__uploadId = response.uploadId;
                            return response;
                          }}
                          onComplete={(result) => {
                            if (result.successful && result.successful.length > 0) {
                              const file = result.successful[0] as any;
                              const uploadId = file.__uploadId;
                              if (uploadId) {
                                const publicUrl = `/public-objects/${uploadId}`;
                                field.onChange(publicUrl);
                              }
                            }
                          }}
                          buttonClassName="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Thumbnail
                        </ObjectUploader>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stylePresetForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="e.g., sports, minimal"
                          data-testid="input-style-preset-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stylePresetForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-style-preset-sort-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStylePresetDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300"
                  data-testid="button-cancel-style-preset"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={createStylePresetMutation.isPending || updateStylePresetMutation.isPending}
                  data-testid="button-save-style-preset"
                >
                  {(createStylePresetMutation.isPending || updateStylePresetMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingStylePreset ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTrainingSetId !== null} onOpenChange={(open) => !open && setDeleteTrainingSetId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Training Set</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this training set? This will also remove all associated training images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300" data-testid="button-cancel-delete-training-set">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTrainingSetId && deleteTrainingSetMutation.mutate(deleteTrainingSetId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-training-set"
            >
              {deleteTrainingSetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTrainingImageId !== null} onOpenChange={(open) => !open && setDeleteTrainingImageId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Training Image</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this training image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300" data-testid="button-cancel-delete-training-image">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTrainingImageId && deleteTrainingImageMutation.mutate(deleteTrainingImageId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-training-image"
            >
              {deleteTrainingImageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStylePresetId !== null} onOpenChange={(open) => !open && setDeleteStylePresetId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Style Preset</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this style preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300" data-testid="button-cancel-delete-style-preset">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStylePresetId && deleteStylePresetMutation.mutate(deleteStylePresetId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-style-preset"
            >
              {deleteStylePresetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DesignLabAdmin;
