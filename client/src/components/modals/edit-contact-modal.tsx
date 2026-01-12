import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const editContactSchema = z.object({
  orgId: z.number().min(1, "Organization is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
  imageUrl: z.string().optional(),
});

type EditContactForm = z.infer<typeof editContactSchema>;

interface Contact {
  id: number;
  orgId: number;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  imageUrl?: string;
  createdAt: string;
}

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export function EditContactModal({ isOpen, onClose, contact }: EditContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<EditContactForm>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      orgId: contact?.orgId || undefined,
      name: contact?.name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      roleTitle: contact?.roleTitle || "",
      imageUrl: contact?.imageUrl || "",
    },
  });

  // Reset form when contact changes
  useEffect(() => {
    if (contact && isOpen) {
      form.reset({
        orgId: contact.orgId,
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        roleTitle: contact.roleTitle || "",
        imageUrl: contact.imageUrl || "",
      });
      setUploadedImageUrl(contact.imageUrl || "");
    }
  }, [contact, isOpen, form]);

  // Fetch organizations for the dropdown
  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const updateContactMutation = useMutation({
    mutationFn: (data: EditContactForm) => 
      apiRequest("PUT", `/api/contacts/${contact?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditContactForm) => {
    updateContactMutation.mutate(data);
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-edit-contact">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orgId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-contact-organization">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations.map((org: any) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., John Smith"
                      data-testid="input-edit-contact-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="e.g., john@school.edu"
                      data-testid="input-edit-contact-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., (555) 123-4567"
                      data-testid="input-edit-contact-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role/Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Athletic Director, Coach"
                      data-testid="input-edit-contact-role"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Profile Image (Optional)</FormLabel>
              {uploadedImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Contact profile" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedImageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-contact-preview-edit"
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
                    data-testid="button-remove-contact-image-edit"
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
                    Upload Profile Image
                  </span>
                </ObjectUploader>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-edit-contact"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateContactMutation.isPending}
                data-testid="button-submit-edit-contact"
              >
                {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}