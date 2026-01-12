import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  ImageIcon,
  FolderOpen,
  Clock,
  Loader2,
  FileText,
  CheckCircle2,
  Play,
  Settings,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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

interface ProductVariant {
  id: number;
  name: string;
  productId: number;
  sku: string;
}

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  variantId: z.number().optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

type StatusFilter = "all" | "draft" | "in_progress" | "finalized" | "archived";

function getStatusBadgeStyles(status: DesignProject["status"]) {
  switch (status) {
    case "draft":
      return "bg-gray-900/30 text-gray-300 border-gray-800/50";
    case "generating":
      return "bg-violet-900/30 text-violet-300 border-violet-800/50 animate-pulse";
    case "in_progress":
      return "bg-blue-900/30 text-blue-300 border-blue-800/50";
    case "review":
      return "bg-yellow-900/30 text-yellow-300 border-yellow-800/50";
    case "finalized":
      return "bg-green-900/30 text-green-300 border-green-800/50";
    case "archived":
      return "bg-muted/30 text-muted-foreground border-muted/50";
    default:
      return "bg-muted/30 text-muted-foreground border-muted/50";
  }
}

function getStatusLabel(status: DesignProject["status"]) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generating":
      return "Generating...";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "finalized":
      return "Finalized";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function DesignLab() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
  }, [isAuthenticated, isLoading, toast]);

  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ projects: DesignProject[]; pagination: { page: number; limit: number; total: number; pages: number } }>({
    queryKey: ["/api/design-lab/projects"],
    retry: false,
  });
  const projects = projectsData?.projects ?? [];

  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  const variantMap = useMemo(() => {
    const map = new Map<number, ProductVariant>();
    for (const variant of variants) {
      map.set(variant.id, variant);
    }
    return map;
  }, [variants]);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      variantId: undefined,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectFormData) => {
      return apiRequest<DesignProject>("/api/design-lab/projects", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Project Created",
        description: `"${newProject.name}" has been created successfully.`,
      });
      setLocation(`/design-lab/project/${newProject.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const duplicateProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest<DesignProject>(`/api/design-lab/projects/${projectId}/duplicate`, {
        method: "POST",
        body: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects"] });
      toast({
        title: "Project Duplicated",
        description: "A copy of the project has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to duplicate project",
        variant: "destructive",
      });
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest<DesignProject>(`/api/design-lab/projects/${projectId}`, {
        method: "PATCH",
        body: { status: "archived" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-lab/projects"] });
      toast({
        title: "Project Archived",
        description: "The project has been moved to archives.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to archive project",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") {
      return projects.filter((p) => p.status !== "archived");
    }
    if (statusFilter === "in_progress") {
      return projects.filter((p) => 
        p.status === "in_progress" || p.status === "generating" || p.status === "review"
      );
    }
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  const stats = useMemo(() => {
    const total = projects.filter((p) => p.status !== "archived").length;
    const inProgress = projects.filter((p) => 
      p.status === "in_progress" || p.status === "generating" || p.status === "review"
    ).length;
    const finalized = projects.filter((p) => p.status === "finalized").length;
    return { total, inProgress, finalized };
  }, [projects]);

  const navigateToProject = (projectId: number) => {
    setLocation(`/design-lab/project/${projectId}`);
  };

  if (projectsLoading) {
    return (
      <div className={cn("p-6 max-w-6xl mx-auto", isMobile && "p-4")}>
        <div className="mb-6">
          <Link href="/design-jobs" data-testid="link-back-to-design-jobs">
            <Button variant="ghost" className="mb-4 -ml-2" data-testid="button-back-to-design-jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Design Jobs
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className={cn("grid gap-4 mb-6", isMobile ? "grid-cols-1" : "grid-cols-3")}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3")}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 max-w-6xl mx-auto", isMobile && "p-4 pb-24")}>
      <div className="mb-6">
        <Link href="/design-jobs" data-testid="link-back-to-design-jobs">
          <Button variant="ghost" className="mb-4 -ml-2" data-testid="button-back-to-design-jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Design Jobs
          </Button>
        </Link>
        
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
              <Sparkles className="h-6 w-6 text-violet-500" />
            </div>
            <h1 className={cn("text-2xl font-bold", isMobile && "text-xl")} data-testid="text-design-lab-title">
              AI Design Lab
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link href="/design-lab/admin">
                <Button
                  variant="outline"
                  className="gap-2 border-zinc-700 hover:bg-zinc-800"
                  data-testid="button-admin-settings"
                >
                  <Settings className="h-4 w-4" />
                  {!isMobile && "Admin Settings"}
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              data-testid="button-new-project"
            >
              <Plus className="h-4 w-4" />
              {!isMobile && "New Project"}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Create and manage AI-powered design projects
        </p>
      </div>

      <div className={cn("grid gap-4 mb-6", isMobile ? "grid-cols-1" : "grid-cols-3")}>
        <Card className="border-border/50" data-testid="card-stat-total">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-violet-500/10">
              <FolderOpen className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-total">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50" data-testid="card-stat-in-progress">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Play className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-in-progress">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50" data-testid="card-stat-finalized">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-finalized">{stats.finalized}</p>
              <p className="text-sm text-muted-foreground">Finalized</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="mb-6">
        <TabsList className={cn("w-full", isMobile && "flex-wrap h-auto gap-1")}>
          <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
            All
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex-1" data-testid="tab-draft">
            Draft
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1" data-testid="tab-in-progress">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="finalized" className="flex-1" data-testid="tab-finalized">
            Finalized
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-1" data-testid="tab-archived">
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredProjects.length === 0 ? (
        <Card className="border-2 border-dashed border-border" data-testid="card-empty-state">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-violet-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
              {statusFilter === "all" ? "No Projects Yet" : `No ${getStatusLabel(statusFilter as any)} Projects`}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              {statusFilter === "all" 
                ? "Create your first AI-powered design project to get started."
                : `You don't have any projects with status "${getStatusLabel(statusFilter as any)}".`
              }
            </p>
            {statusFilter === "all" && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                data-testid="button-create-first-project"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
        )}>
          {filteredProjects.map((project) => {
            const variant = project.variantId ? variantMap.get(project.variantId) : null;
            return (
              <Card
                key={project.id}
                className="border border-border/50 hover:border-violet-500/30 transition-all cursor-pointer group"
                onClick={() => navigateToProject(project.id)}
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.name}
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-6 w-6 text-violet-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground" data-testid={`text-project-code-${project.id}`}>
                          {project.projectCode}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-project-menu-${project.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToProject(project.id);
                          }}
                          data-testid={`menu-edit-${project.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateProjectMutation.mutate(project.id);
                          }}
                          data-testid={`menu-duplicate-${project.id}`}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {project.status !== "archived" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveProjectMutation.mutate(project.id);
                            }}
                            className="text-destructive focus:text-destructive"
                            data-testid={`menu-archive-${project.id}`}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full border mb-3",
                      getStatusBadgeStyles(project.status)
                    )}
                    data-testid={`badge-status-${project.id}`}
                  >
                    {getStatusLabel(project.status)}
                  </Badge>

                  {variant && (
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-variant-${project.id}`}>
                      Variant: {variant.name}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1" data-testid={`text-updated-${project.id}`}>
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </span>
                    <span data-testid={`text-created-${project.id}`}>
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" data-testid="dialog-create-project">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter project name" 
                        {...field} 
                        data-testid="input-project-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the project (optional)"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-project-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="variantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Variant</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-variant">
                          <SelectValue placeholder="Select a variant (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {variants.map((variant) => (
                          <SelectItem 
                            key={variant.id} 
                            value={variant.id.toString()}
                            data-testid={`option-variant-${variant.id}`}
                          >
                            {variant.name} ({variant.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  data-testid="button-submit-create"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Project
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
