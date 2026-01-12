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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings,
  ImageIcon,
  Layers,
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
    </div>
  );
}

export default DesignLabAdmin;
