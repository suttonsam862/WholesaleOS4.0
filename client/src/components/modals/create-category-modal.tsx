import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100, "Category name must be less than 100 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCategoryModal({ isOpen, onClose }: CreateCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryForm) => 
      apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      form.reset();
      setUploadedImageUrl("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCategoryForm) => {
    createCategoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-create-category">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., T-Shirts, Hoodies, Jackets"
                      data-testid="input-category-name"
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
                      placeholder="Brief description of this category"
                      data-testid="textarea-category-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Category Image (Optional)</FormLabel>
              {uploadedImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Category preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedImageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-category-preview"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setUploadedImageUrl("");
                      form.setValue("imageUrl", "");
                    }}
                    data-testid="button-remove-category-image"
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <ObjectUploader
                  maxNumberOfFiles={1}
                  onGetUploadParameters={async (file) => {
                    const response = await apiRequest("POST", "/api/upload/image", {
                      filename: file.name,
                      size: file.size,
                      mimeType: file.type
                    }) as any;
                    return {
                      method: "PUT" as const,
                      url: response.uploadURL,
                      headers: {
                        'Content-Type': file.type
                      }
                    };
                  }}
                  onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                    if (result.successful?.[0]) {
                      const url = (result.successful[0] as any).uploadURL;
                      setUploadedImageUrl(url);
                      form.setValue("imageUrl", url);
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Category Image
                  </span>
                </ObjectUploader>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending}
                data-testid="button-submit-category"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}