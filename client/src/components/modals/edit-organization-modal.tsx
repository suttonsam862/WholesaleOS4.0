import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sports: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  brandPrimaryColor: z.string().optional(),
  brandSecondaryColor: z.string().optional(),
  brandPantoneCode: z.string().optional(),
  brandGuidelinesUrl: z.string().optional(),
});

type EditOrganizationForm = z.infer<typeof editOrganizationSchema>;

// Contact types for the form
interface Contact {
  id: number;
  orgId: number;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  role: "customer" | "admin" | "billing" | "technical" | "executive" | "other";
  isPrimary: boolean;
  createdAt: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  role: "customer" | "admin" | "billing" | "technical" | "executive" | "other";
  isPrimary: boolean;
}

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
  role: z.enum(["customer", "admin", "billing", "technical", "executive", "other"]),
  isPrimary: z.boolean(),
});

interface Organization {
  id: number;
  name: string;
  sports: string;
  city: string;
  state: string;
  shippingAddress: string;
  notes: string;
  logoUrl: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  brandPantoneCode?: string;
  brandGuidelinesUrl?: string;
  archived?: boolean;
  createdAt: string;
}

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export function EditOrganizationModal({ isOpen, onClose, organization }: EditOrganizationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Contact management state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<EditOrganizationForm>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: "",
      sports: "",
      city: "",
      state: "",
      shippingAddress: "",
      notes: "",
      brandPrimaryColor: "",
      brandSecondaryColor: "",
      brandPantoneCode: "",
      brandGuidelinesUrl: "",
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      roleTitle: "",
      role: "customer",
      isPrimary: false,
    },
  });

  // Fetch organization contacts
  const { data: contacts, refetch: refetchContacts } = useQuery<Contact[]>({
    queryKey: [`/api/organizations/${organization?.id}/contacts`],
    enabled: !!organization?.id && isOpen,
    retry: false,
  });

  // Helper function to get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'billing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'technical': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'executive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Sort contacts: primary first, then by role, then by name
  const sortedContacts = contacts ? [...contacts].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.name.localeCompare(b.name);
  }) : [];

  // Contact mutations
  const createContactMutation = useMutation({
    mutationFn: (contactData: ContactFormData) => {
      const data = {
        orgId: organization?.id,
        name: contactData.name,
        email: contactData.email || undefined,
        phone: contactData.phone || undefined,
        roleTitle: contactData.roleTitle || undefined,
        role: contactData.role,
        isPrimary: contactData.isPrimary,
      };
      return apiRequest("/api/contacts", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
      refetchContacts();
      contactForm.reset();
      setIsAddingContact(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, contactData }: { contactId: number, contactData: ContactFormData }) => {
      return apiRequest(`/api/contacts/${contactId}`, {
        method: "PUT",
        body: contactData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      refetchContacts();
      contactForm.reset();
      setEditingContact(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: number) => 
      apiRequest(`/api/contacts/${contactId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      refetchContacts();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  // Contact management functions
  const addContact = (contactData: ContactFormData) => {
    createContactMutation.mutate(contactData);
  };

  const updateContact = (contactData: ContactFormData) => {
    if (!editingContact) return;
    updateContactMutation.mutate({
      contactId: editingContact.id,
      contactData,
    });
  };

  const removeContact = (contactId: number) => {
    deleteContactMutation.mutate(contactId);
  };

  const startEditingContact = (contact: Contact) => {
    setEditingContact(contact);
    contactForm.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      roleTitle: contact.roleTitle,
      role: contact.role,
      isPrimary: contact.isPrimary,
    });
  };

  const cancelContactForm = () => {
    setIsAddingContact(false);
    setEditingContact(null);
    contactForm.reset();
  };

  // Pre-populate form when organization changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || "",
        sports: organization.sports || "",
        city: organization.city || "",
        state: organization.state || "",
        shippingAddress: organization.shippingAddress || "",
        notes: organization.notes || "",
        brandPrimaryColor: organization.brandPrimaryColor || "",
        brandSecondaryColor: organization.brandSecondaryColor || "",
        brandPantoneCode: organization.brandPantoneCode || "",
        brandGuidelinesUrl: organization.brandGuidelinesUrl || "",
      });
      setLogoUrl(organization.logoUrl || null);
    }
  }, [organization, form]);

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get presigned URL
      const uploadResponse = await apiRequest("/api/upload/image", {
        method: "POST",
        body: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        },
      });

      const { uploadURL, uploadId } = uploadResponse as any;

      // Step 2: Upload file to object storage
      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Construct the public URL
      const imageUrl = `/public-objects/${uploadId}`;
      return imageUrl;
    },
    onSuccess: (imageUrl) => {
      setLogoUrl(imageUrl);
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const archiveOrganizationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/organizations/${organization?.id}/archive`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization archived successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error("[ARCHIVE ORG] Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to archive organization",
        variant: "destructive",
      });
    },
  });

  const editOrganizationMutation = useMutation({
    mutationFn: async (data: EditOrganizationForm) => {
      console.log("[EDIT ORG] Starting organization update...");
      console.log("[EDIT ORG] Organization ID:", organization?.id);
      console.log("[EDIT ORG] Form data:", data);
      console.log("[EDIT ORG] Logo URL:", logoUrl);
      
      const payload = {
        ...data,
        logoUrl: logoUrl || undefined,
      };
      console.log("[EDIT ORG] Request payload:", JSON.stringify(payload, null, 2));
      
      try {
        const result = await apiRequest(`/api/organizations/${organization?.id}`, { 
          method: "PUT", 
          body: payload
        });
        console.log("[EDIT ORG] Update successful! Response:", result);
        return result;
      } catch (error) {
        console.error("[EDIT ORG] Update failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[EDIT ORG] onSuccess triggered with data:", data);
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organization?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("[EDIT ORG] onError triggered:", error);
      console.error("[EDIT ORG] Error message:", error.message);
      console.error("[EDIT ORG] Error stack:", error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditOrganizationForm) => {
    console.log("[EDIT ORG] handleSubmit called");
    console.log("[EDIT ORG] Organization:", organization);
    console.log("[EDIT ORG] Form data:", data);
    if (!organization) {
      console.error("[EDIT ORG] No organization provided!");
      return;
    }
    editOrganizationMutation.mutate(data);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);
    uploadLogoMutation.mutate(file, {
      onSettled: () => setIsUploadingLogo(false),
    });
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const handleClose = () => {
    form.reset();
    setLogoUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-organization">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Springfield High School"
                      data-testid="input-edit-organization-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <img 
                    src={logoUrl} 
                    alt="Organization logo" 
                    className="h-20 w-20 object-contain rounded border bg-white"
                    data-testid="img-organization-logo"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    data-testid="button-remove-logo"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                    data-testid="input-logo-upload"
                  />
                  <Label htmlFor="logo-upload">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      {isUploadingLogo ? (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload logo</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </Label>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="sports"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sports/Activities</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Football, Basketball, Baseball"
                      data-testid="input-edit-organization-sports"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="City"
                        data-testid="input-edit-organization-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="State"
                        data-testid="input-edit-organization-state"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Full shipping address including street, city, state, zip"
                      data-testid="input-edit-organization-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about this organization"
                      data-testid="input-edit-organization-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branding Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Brand Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brandPrimaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Brand Color</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="#FF5733 or rgb(255,87,51)"
                            data-testid="input-brand-primary-color"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandSecondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Brand Color</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="#3366FF or rgb(51,102,255)"
                            data-testid="input-brand-secondary-color"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="brandPantoneCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pantone Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 123C, Pantone 186 C"
                          data-testid="input-brand-pantone-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandGuidelinesUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Guidelines URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com/brand-guidelines.pdf"
                          data-testid="input-brand-guidelines-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show color preview if colors are set */}
                {(form.watch("brandPrimaryColor") || form.watch("brandSecondaryColor")) && (
                  <div className="flex items-center gap-4 pt-2">
                    <Label>Color Preview:</Label>
                    <div className="flex gap-2">
                      {form.watch("brandPrimaryColor") && (
                        <div 
                          className="w-12 h-12 rounded border"
                          style={{ backgroundColor: form.watch("brandPrimaryColor") }}
                          title="Primary Color"
                        />
                      )}
                      {form.watch("brandSecondaryColor") && (
                        <div 
                          className="w-12 h-12 rounded border"
                          style={{ backgroundColor: form.watch("brandSecondaryColor") }}
                          title="Secondary Color"
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Management Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contacts ({sortedContacts.length})</span>
                  {!isAddingContact && !editingContact && (
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsAddingContact(true)}
                      data-testid="button-add-contact-edit-org"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Contact
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Contact List */}
                {sortedContacts.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {sortedContacts.map((contact, index) => (
                      <div key={contact.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium" data-testid={`text-contact-name-${contact.id}`}>
                                {contact.name}
                              </p>
                              {contact.isPrimary && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <i className="fas fa-star mr-1"></i>
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${getRoleColor(contact.role)}`}>
                                {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                              </Badge>
                              {contact.roleTitle && (
                                <span className="text-sm text-muted-foreground">
                                  {contact.roleTitle}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-4">
                              {contact.email && (
                                <span className="text-sm text-muted-foreground">
                                  <i className="fas fa-envelope mr-1"></i>
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="text-sm text-muted-foreground">
                                  <i className="fas fa-phone mr-1"></i>
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="ghost"
                              onClick={() => startEditingContact(contact)}
                              data-testid={`button-edit-contact-${contact.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="ghost"
                              onClick={() => removeContact(contact.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              data-testid={`button-remove-contact-${contact.id}`}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                        {index < sortedContacts.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Form */}
                {(isAddingContact || editingContact) && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingContact ? 'Edit Contact' : 'Add Contact'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...contactForm}>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={contactForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Contact name"
                                      data-testid="input-contact-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={contactForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-contact-role">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="customer">Customer</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="billing">Billing</SelectItem>
                                      <SelectItem value="technical">Technical</SelectItem>
                                      <SelectItem value="executive">Executive</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={contactForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      placeholder="email@example.com"
                                      data-testid="input-contact-email"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={contactForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="(555) 123-4567"
                                      data-testid="input-contact-phone"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={contactForm.control}
                            name="roleTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role Title (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Head Coach, Athletic Director"
                                    data-testid="input-contact-role-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={contactForm.control}
                            name="isPrimary"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="rounded border border-input"
                                    data-testid="checkbox-contact-primary"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Mark as primary contact</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={cancelContactForm}
                              data-testid="button-cancel-contact"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={contactForm.handleSubmit(editingContact ? updateContact : addContact)}
                              data-testid="button-save-contact"
                            >
                              {editingContact ? 'Update Contact' : 'Add Contact'}
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {sortedContacts.length === 0 && !isAddingContact && (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
                    <p className="mb-3">No contacts found for this organization.</p>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsAddingContact(true)}
                      data-testid="button-add-first-contact"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add First Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button 
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to archive this organization? It can be restored later.")) {
                    archiveOrganizationMutation.mutate();
                  }
                }}
                disabled={archiveOrganizationMutation.isPending || organization?.archived}
                data-testid="button-archive-organization"
              >
                {archiveOrganizationMutation.isPending ? "Archiving..." : "Archive Organization"}
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel-edit-organization"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editOrganizationMutation.isPending}
                  data-testid="button-update-organization"
                >
                  {editOrganizationMutation.isPending ? "Updating..." : "Update Organization"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}