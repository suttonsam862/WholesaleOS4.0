import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

const uploadSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Valid file URL is required"),
  fileType: z.string().min(1, "File type is required"),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface SalesResource {
  id: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  downloads: number;
  createdAt: string;
}

interface User {
  id: string;
  role: string;
}

export default function SalesResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileUrl, setFileUrl] = useState<string>("");

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const isAdmin = currentUser?.role === 'admin';

  // Fetch sales resources
  const { data: resources = [], isLoading } = useQuery<SalesResource[]>({
    queryKey: ["/api/sales-resources"],
  });

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: "",
      description: "",
      fileUrl: "",
      fileType: "pdf",
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (data: UploadForm) =>
      apiRequest("POST", "/api/sales-resources", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales resource uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-resources"] });
      form.reset();
      setFileUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/sales-resources/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-resources"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // Download mutation (increments counter)
  const downloadMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/sales-resources/${id}/download`, {}),
    onSuccess: () => {
      // Invalidate cache to refresh download counts
      queryClient.invalidateQueries({ queryKey: ["/api/sales-resources"] });
    },
  });

  const handleDownload = (resource: SalesResource) => {
    // Increment download counter
    downloadMutation.mutate(resource.id);
    
    // Open file in new tab
    window.open(resource.fileUrl, '_blank');
  };

  const handleFileUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadId = (result.successful[0] as any).__uploadId;
      if (uploadId) {
        const publicUrl = `/public-objects/${uploadId}`;
        setFileUrl(publicUrl);
        form.setValue("fileUrl", publicUrl);
        toast({
          title: "File uploaded",
          description: "File uploaded successfully",
        });
      }
    }
  };

  const getUploadParameters = async (file: any) => {
    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    (file as any).__uploadId = data.uploadId;
    return {
      method: "PUT" as const,
      url: data.url,
      headers: {
        'Content-Type': file.type
      }
    };
  };

  const handleSubmit = (data: UploadForm) => {
    uploadMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading sales resources...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Resources</h1>
        <p className="text-muted-foreground mt-2">
          Access training materials, product catalogs, and sales tools
        </p>
      </div>

      {/* Upload Form (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Resource
            </CardTitle>
            <CardDescription>
              Upload sales materials for your team to access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Product Catalog Q4 2024"
                          data-testid="input-resource-name"
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of this resource"
                          data-testid="input-resource-description"
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-file-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="doc">Word Document</SelectItem>
                          <SelectItem value="ppt">PowerPoint</SelectItem>
                          <SelectItem value="xls">Excel Spreadsheet</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <ObjectUploader
                          onGetUploadParameters={getUploadParameters}
                          onComplete={handleFileUploadComplete}
                          maxNumberOfFiles={1}
                          allowedFileTypes={['*/*']}
                          maxFileSize={52428800}
                        >
                          Upload File
                        </ObjectUploader>
                      </FormControl>
                      {fileUrl && (
                        <p className="text-sm text-muted-foreground">
                          File uploaded successfully
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-resource"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Resource"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Resources List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Resources</h2>
        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sales resources available yet.
              {isAdmin && " Upload the first resource to get started!"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} data-testid={`card-resource-${resource.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText className="h-5 w-5 flex-shrink-0" />
                      <span className="line-clamp-2" data-testid={`text-resource-name-${resource.id}`}>
                        {resource.name}
                      </span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(resource.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-resource-${resource.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {resource.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Type: {resource.fileType.toUpperCase()}</span>
                    <span>{resource.downloads} downloads</span>
                  </div>
                  <Button
                    onClick={() => handleDownload(resource)}
                    className="w-full"
                    data-testid={`button-download-resource-${resource.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
