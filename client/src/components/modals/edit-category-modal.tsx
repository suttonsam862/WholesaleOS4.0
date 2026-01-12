import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const editCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100, "Category name must be less than 100 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type EditCategoryForm = z.infer<typeof editCategorySchema>;

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any;
}

export function EditCategoryModal({ isOpen, onClose, category }: EditCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<EditCategoryForm>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.setValue("name", category.name || "");
      form.setValue("description", category.description || "");
      form.setValue("imageUrl", category.imageUrl || "");
      setUploadedImageUrl(category.imageUrl || "");
    }
  }, [category, form]);

  const editCategoryMutation = useMutation({
    mutationFn: (data: EditCategoryForm) => 
      apiRequest("PUT", `/api/categories/${category.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditCategoryForm) => {
    editCategoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-edit-category">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
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
                      placeholder="Enter category name" 
                      {...field} 
                      data-testid="input-edit-category-name"
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
                      placeholder="Describe this category..." 
                      {...field} 
                      data-testid="textarea-edit-category-description"
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
                    data-testid="img-category-preview-edit"
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
                    data-testid="button-remove-category-image-edit"
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
                    (file as any).__uploadId = response.uploadId;
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
                      const uploadId = (result.successful[0] as any).__uploadId;
                      if (uploadId) {
                        const publicUrl = `/public-objects/${uploadId}`;
                        setUploadedImageUrl(publicUrl);
                        form.setValue("imageUrl", publicUrl);
                      }
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-edit-category">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editCategoryMutation.isPending}
                data-testid="button-save-category"
              >
                {editCategoryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}