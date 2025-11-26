import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Palette, Download, Search, BookOpen, Layers, Upload, Edit, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDesignResourceSchema, type DesignResource } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const helpItems = [
  {
    question: "How do I access brand guidelines?",
    answer: "Brand guidelines for all active clients are stored in the Brand Guidelines tab. Search by client name or browse alphabetically. Each guideline includes logo files, color palettes, typography, and usage rules.",
  },
  {
    question: "Can I upload my own templates?",
    answer: "Admin users can upload templates using the 'Upload Resource' button. Supported formats: AI, PSD, SKETCH, FIGMA, PDF. Resources are automatically categorized and made searchable for the entire design team.",
  },
  {
    question: "What's the difference between Templates and Mockups?",
    answer: "Templates are starting points for new designs (logos, layouts, etc.). Mockups are presentation tools to show how designs look in real-world contexts (t-shirts, packaging, etc.).",
  },
  {
    question: "How do I find design specifications for a product?",
    answer: "Go to the Specifications tab and filter by product category or client. All print specifications, color codes, and material requirements are listed with downloadable PDFs.",
  }
];

const formSchema = insertDesignResourceSchema.omit({ id: true, uploadedBy: true, createdAt: true, updatedAt: true });

export function DesignResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<DesignResource | null>(null);
  const [deleteResourceId, setDeleteResourceId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery<{ role: string }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: resources = [], isLoading } = useQuery<DesignResource[]>({
    queryKey: ["/api/design-resources"],
  });

  const isAdmin = user?.role === 'admin';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: undefined,
      fileType: "",
      fileUrl: "",
      description: "",
      downloads: 0,
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: undefined,
      fileType: "",
      fileUrl: "",
      description: "",
      downloads: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>): Promise<any> => {
      return await apiRequest("/api/design-resources", {
        method: "POST",
        body: JSON.stringify(data),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-resources"] });
      toast({
        title: "Success",
        description: "Resource uploaded successfully",
      });
      setIsUploadOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof formSchema>> }): Promise<any> => {
      return await apiRequest(`/api/design-resources/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-resources"] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      setIsEditOpen(false);
      setEditingResource(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/design-resources/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      setDeleteResourceId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/design-resources/${id}/download`, {
        method: "POST",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    }
  };

  const handleEdit = (resource: DesignResource) => {
    setEditingResource(resource);
    editForm.reset({
      name: resource.name,
      category: resource.category,
      fileType: resource.fileType,
      fileUrl: resource.fileUrl,
      description: resource.description || "",
      downloads: resource.downloads,
    });
    setIsEditOpen(true);
  };

  const handleDownload = (resource: DesignResource) => {
    downloadMutation.mutate(resource.id);
    window.open(resource.fileUrl, '_blank');
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = Array.from(new Set(resources.map(r => r.category)));

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Templates': return <Layers className="h-5 w-5" />;
      case 'Brand Guidelines': return <BookOpen className="h-5 w-5" />;
      case 'Mockups': return <Palette className="h-5 w-5" />;
      case 'Specifications': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-design-resources">Design Resources Hub</h1>
          <p className="text-muted-foreground">Templates, brand guidelines, mockups, and specifications</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-resource">
              <Plus className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          )}
          <HelpButton pageTitle="Design Resources" helpItems={helpItems} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-resources">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground">Available files</p>
          </CardContent>
        </Card>

        <Card data-testid="card-templates">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.category === 'Templates').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card data-testid="card-brand-guidelines">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Guidelines</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.category === 'Brand Guidelines').length}
            </div>
            <p className="text-xs text-muted-foreground">Client brands</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-downloads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.reduce((acc, r) => acc + (r.downloads || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-resources"
        />
      </div>

      {/* Resources Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-resources">All Resources</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} data-testid={`tab-${category.toLowerCase().replace(' ', '-')}`}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredResources.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No resources available</p>
                {isAdmin && (
                  <Button onClick={() => setIsUploadOpen(true)} className="mt-4" data-testid="button-upload-first">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Resource
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <Card key={resource.id} data-testid={`resource-card-${resource.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getIconForCategory(resource.category)}
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                      </div>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{resource.fileType}</span>
                    </div>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.downloads} downloads
                      </span>
                      <span>Updated {new Date(resource.updatedAt as any).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => handleDownload(resource as any)}
                        data-testid={`button-download-${resource.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(resource)}
                            data-testid={`button-edit-${resource.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteResourceId(resource.id)}
                            data-testid={`button-delete-${resource.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources
                .filter(r => r.category === category)
                .map((resource) => (
                  <Card key={resource.id} data-testid={`${category.toLowerCase()}-resource-${resource.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{resource.fileType}</span>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {resource.downloads} downloads
                        </span>
                        <span>{new Date(resource.updatedAt as any).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleDownload(resource as any)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(resource)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDeleteResourceId(resource.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="upload-resource-description">
          <DialogHeader>
            <DialogTitle>Upload Design Resource</DialogTitle>
            <DialogDescription id="upload-resource-description">
              Add a new template, brand guideline, mockup, or specification
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Logo Template Pack" {...field} data-testid="input-resource-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Templates">Templates</SelectItem>
                          <SelectItem value="Brand Guidelines">Brand Guidelines</SelectItem>
                          <SelectItem value="Mockups">Mockups</SelectItem>
                          <SelectItem value="Specifications">Specifications</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. AI, PSD, PDF" {...field} data-testid="input-file-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-file-url" />
                    </FormControl>
                    <FormDescription>
                      Upload the file to cloud storage and paste the URL here
                    </FormDescription>
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
                        placeholder="Describe this resource..." 
                        {...field} 
                        value={field.value || ""}
                        data-testid="textarea-description"
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
                  onClick={() => setIsUploadOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-upload"
                >
                  {createMutation.isPending ? "Uploading..." : "Upload Resource"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-resource-description">
          <DialogHeader>
            <DialogTitle>Edit Design Resource</DialogTitle>
            <DialogDescription id="edit-resource-description">
              Update resource information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Logo Template Pack" {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Templates">Templates</SelectItem>
                          <SelectItem value="Brand Guidelines">Brand Guidelines</SelectItem>
                          <SelectItem value="Mockups">Mockups</SelectItem>
                          <SelectItem value="Specifications">Specifications</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. AI, PSD, PDF" {...field} data-testid="input-edit-file-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-edit-file-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe this resource..." 
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-edit-description"
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
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteResourceId !== null} onOpenChange={(open) => !open && setDeleteResourceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the design resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResourceId && deleteMutation.mutate(deleteResourceId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
