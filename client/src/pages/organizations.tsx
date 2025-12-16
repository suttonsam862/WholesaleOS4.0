import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Palette, 
  Building2,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Trophy,
  Map as MapIcon,
  FileText
} from "lucide-react";
import type { Organization, InsertOrganization } from "@shared/schema";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { OrgColorPalette } from "@/components/ui/org-branded-card";
import { extractDominantColors } from "@/lib/colorExtraction";
import { createGradient, getReadableTextColorForGradient } from "@/lib/contrastUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const CLIENT_TYPE_OPTIONS = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "enterprise", label: "Enterprise" },
  { value: "government", label: "Government" },
];

export default function Organizations() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteOrgId, setDeleteOrgId] = useState<number | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  
  // Color extraction state for org cards
  const [orgColors, setOrgColors] = useState<Map<number, string[]>>(new Map());
  
  // Logo and color extraction states for modals
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  // Form states - matching actual schema
  const [formData, setFormData] = useState<Partial<InsertOrganization>>({
    name: "",
    sports: "",
    city: "",
    state: "",
    shippingAddress: "",
    notes: "",
    logoUrl: "",
    territory: "",
    clientType: undefined,
    brandPrimaryColor: "",
    brandSecondaryColor: "",
    brandPantoneCode: "",
  });

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

  // Fetch organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  // Extract colors from organization logos
  useEffect(() => {
    const extractColors = async () => {
      const colorMap = new Map<number, string[]>();
      for (const org of organizations) {
        if (org.logoUrl) {
          const colors = await extractDominantColors(org.logoUrl);
          colorMap.set(org.id, colors);
        }
      }
      setOrgColors(colorMap);
    };
    if (organizations.length > 0) {
      extractColors();
    }
  }, [organizations]);

  // Extract colors when a logo is uploaded
  const extractColorsFromLogo = useCallback(async (logoUrl: string) => {
    if (!logoUrl) {
      setExtractedColors([]);
      return;
    }
    
    setIsExtractingColors(true);
    try {
      const colors = await extractDominantColors(logoUrl);
      setExtractedColors(colors);
      
      // Auto-populate brand colors
      if (colors.length >= 2) {
        setFormData(prev => ({
          ...prev,
          brandPrimaryColor: colors[0],
          brandSecondaryColor: colors[1],
        }));
      } else if (colors.length === 1) {
        setFormData(prev => ({
          ...prev,
          brandPrimaryColor: colors[0],
        }));
      }
      
      toast({
        title: "Colors Extracted",
        description: `Found ${colors.length} brand colors from the logo`,
      });
    } catch {
      // Color extraction failed silently
    } finally {
      setIsExtractingColors(false);
    }
  }, [toast]);

  // Get gradient style for an organization card
  const getOrgCardStyle = (org: Organization): { background: string; textClass: string } => {
    // First check for stored brand colors
    if (org.brandPrimaryColor && org.brandSecondaryColor) {
      const gradient = createGradient([org.brandPrimaryColor, org.brandSecondaryColor], '135deg');
      const textClass = getReadableTextColorForGradient([org.brandPrimaryColor, org.brandSecondaryColor]);
      return { background: gradient, textClass };
    }
    
    // Fall back to extracted colors
    const colors = orgColors.get(org.id);
    if (!colors || colors.length === 0) {
      return {
        background: '',
        textClass: 'text-foreground',
      };
    }
    const gradient = createGradient(colors, '135deg');
    const textClass = getReadableTextColorForGradient(colors);
    return { background: gradient, textClass };
  };

  // Filter and search organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter(org => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          org.name.toLowerCase().includes(query) ||
          org.notes?.toLowerCase().includes(query) ||
          org.city?.toLowerCase().includes(query) ||
          org.state?.toLowerCase().includes(query) ||
          org.sports?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Client type filter
      if (clientTypeFilter && clientTypeFilter !== " " && org.clientType !== clientTypeFilter) return false;

      return true;
    });
  }, [organizations, searchQuery, clientTypeFilter]);

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: (data: Partial<InsertOrganization>) => {
      return apiRequest("/api/organizations", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      handleCloseCreateModal();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertOrganization> }) => {
      return apiRequest(`/api/organizations/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      handleCloseEditModal();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  // Delete organization mutation
  const deleteOrgMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/organizations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setDeleteOrgId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    },
  });

  const resetFormState = () => {
    setFormData({
      name: "",
      sports: "",
      city: "",
      state: "",
      shippingAddress: "",
      notes: "",
      logoUrl: "",
      territory: "",
      clientType: undefined,
      brandPrimaryColor: "",
      brandSecondaryColor: "",
      brandPantoneCode: "",
    });
    setUploadedLogoUrl("");
    setExtractedColors([]);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetFormState();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingOrg(null);
    resetFormState();
  };

  const handleCreateOrg = () => {
    createOrgMutation.mutate({
      ...formData,
      logoUrl: uploadedLogoUrl || formData.logoUrl,
    });
  };

  const handleUpdateOrg = () => {
    if (!editingOrg) return;
    updateOrgMutation.mutate({
      id: editingOrg.id,
      data: {
        ...formData,
        logoUrl: uploadedLogoUrl || formData.logoUrl,
      },
    });
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      sports: org.sports || "",
      city: org.city || "",
      state: org.state || "",
      shippingAddress: org.shippingAddress || "",
      notes: org.notes || "",
      logoUrl: org.logoUrl || "",
      territory: org.territory || "",
      clientType: org.clientType || undefined,
      brandPrimaryColor: org.brandPrimaryColor || "",
      brandSecondaryColor: org.brandSecondaryColor || "",
      brandPantoneCode: org.brandPantoneCode || "",
    });
    setUploadedLogoUrl(org.logoUrl || "");
    
    // If org has a logo, extract colors
    if (org.logoUrl) {
      extractColorsFromLogo(org.logoUrl);
    } else if (org.brandPrimaryColor) {
      // If no logo but has stored colors, use those
      const colors = [org.brandPrimaryColor];
      if (org.brandSecondaryColor) colors.push(org.brandSecondaryColor);
      setExtractedColors(colors);
    }
    
    setIsEditModalOpen(true);
  };

  const handleLogoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful?.[0]) {
      const url = (result.successful[0] as any).uploadURL?.split('?')[0] || (result.successful[0] as any).uploadURL;
      setUploadedLogoUrl(url);
      setFormData(prev => ({ ...prev, logoUrl: url }));
      extractColorsFromLogo(url);
    }
  };

  const handleRemoveLogo = () => {
    setUploadedLogoUrl("");
    setFormData(prev => ({ ...prev, logoUrl: "", brandPrimaryColor: "", brandSecondaryColor: "" }));
    setExtractedColors([]);
  };

  // Logo Upload Section Component
  const LogoUploadSection = ({ showExtractedColors = true }: { showExtractedColors?: boolean }) => (
    <div className="space-y-4">
      <Label className="text-foreground">Organization Logo</Label>
      
      {uploadedLogoUrl ? (
        <div className="space-y-4">
          {/* Logo Preview */}
          <div className="relative inline-block">
            <div 
              className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg"
              style={extractedColors.length >= 2 ? {
                background: `linear-gradient(135deg, ${extractedColors[0]}, ${extractedColors[1]})`,
                padding: '3px',
              } : undefined}
            >
              <img 
                src={uploadedLogoUrl} 
                alt="Organization logo" 
                className="w-full h-full object-contain bg-white rounded-lg"
                onError={(e) => {
                  console.error('Failed to load logo:', uploadedLogoUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full shadow-lg"
              onClick={handleRemoveLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Extracted Colors Display */}
          {showExtractedColors && extractedColors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Extracted Brand Colors</span>
                {isExtractingColors && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                {extractedColors.map((color, idx) => (
                  <div 
                    key={idx}
                    className="group relative"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-md cursor-pointer transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Color Input Fields */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="primaryColor" className="text-sm text-muted-foreground">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-8 h-8 rounded-md border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: formData.brandPrimaryColor || '#6366f1' }}
                />
                <Input
                  id="primaryColor"
                  value={formData.brandPrimaryColor || ""}
                  onChange={(e) => setFormData({ ...formData, brandPrimaryColor: e.target.value })}
                  placeholder="#000000"
                  className="bg-black/20 border-white/10 text-white font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondaryColor" className="text-sm text-muted-foreground">Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-8 h-8 rounded-md border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: formData.brandSecondaryColor || '#8b5cf6' }}
                />
                <Input
                  id="secondaryColor"
                  value={formData.brandSecondaryColor || ""}
                  onChange={(e) => setFormData({ ...formData, brandSecondaryColor: e.target.value })}
                  placeholder="#000000"
                  className="bg-black/20 border-white/10 text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5242880}
            allowedFileTypes={['image/*']}
            onGetUploadParameters={async (file) => {
              const response = await apiRequest("/api/upload/image", {
                method: "POST",
                body: {
                  filename: file.name,
                  size: file.size,
                  mimeType: file.type
                }
              }) as any;
              return {
                method: "PUT" as const,
                url: response.uploadURL,
                headers: {
                  'Content-Type': file.type
                }
              };
            }}
            onComplete={handleLogoUploadComplete}
            buttonClassName="w-full h-32 border-2 border-dashed border-white/20 hover:border-primary/50 bg-black/20 hover:bg-black/30 transition-all"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">Upload Logo</span>
              <span className="text-xs">PNG, JPG, SVG up to 5MB</span>
            </div>
          </ObjectUploader>
          
          {/* Or enter URL manually */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or enter URL</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={formData.logoUrl || ""}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="bg-black/20 border-white/10 text-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/10 hover:bg-white/10"
              onClick={() => {
                if (formData.logoUrl) {
                  setUploadedLogoUrl(formData.logoUrl);
                  extractColorsFromLogo(formData.logoUrl);
                }
              }}
              disabled={!formData.logoUrl}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading || orgsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Organizations</h1>
          <p className="text-muted-foreground">Manage companies and organizations</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          data-testid="button-create-org"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 text-white"
                data-testid="input-search-orgs"
              />
            </div>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-client-type-filter">
                <SelectValue placeholder="Filter by client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Types</SelectItem>
                {CLIENT_TYPE_OPTIONS.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs.map(org => {
          const { background, textClass } = getOrgCardStyle(org);
          const hasGradient = background !== '';
          const colors = org.brandPrimaryColor && org.brandSecondaryColor 
            ? [org.brandPrimaryColor, org.brandSecondaryColor]
            : orgColors.get(org.id) || [];
          
          return (
            <Card 
              key={org.id} 
              className={cn(
                "overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                hasGradient ? "border-0" : "glass-card border-white/10 hover:border-primary/50"
              )} 
              style={hasGradient ? { background } : undefined}
              data-testid={`card-org-${org.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  {/* Organization Logo */}
                  <OrgLogo
                    src={org.logoUrl}
                    orgName={org.name}
                    orgId={org.id}
                    size="lg"
                    showColorRing={!hasGradient}
                    className="shadow-lg"
                    fallbackColors={colors}
                  />
                  <div>
                    <CardTitle 
                      className={cn(
                        "text-lg font-semibold",
                        hasGradient ? textClass : "text-foreground"
                      )}
                      style={hasGradient ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : undefined}
                    >
                      {org.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {org.clientType && (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            hasGradient ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {org.clientType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 p-0",
                      hasGradient ? "hover:bg-white/20 text-white" : "hover:bg-white/10"
                    )}
                    onClick={() => openEditModal(org)}
                    data-testid={`button-edit-org-${org.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 p-0",
                      hasGradient ? "hover:bg-white/20 text-white" : "text-destructive hover:bg-destructive/10"
                    )}
                    onClick={() => setDeleteOrgId(org.id)}
                    data-testid={`button-delete-org-${org.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={cn("space-y-4", hasGradient && textClass)}>
                {/* Color Palette Display */}
                {colors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Palette className={cn("h-4 w-4", hasGradient ? "opacity-80" : "text-muted-foreground")} />
                    <OrgColorPalette colors={colors} size="sm" />
                    <span className={cn("text-xs", hasGradient ? "opacity-80" : "text-muted-foreground")}>
                      Brand Colors
                    </span>
                  </div>
                )}
                
                {org.notes && (
                  <p className={cn(
                    "text-sm line-clamp-2",
                    hasGradient ? "opacity-90" : "text-muted-foreground"
                  )}>
                    {org.notes}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {org.sports && (
                    <div className={cn(
                      "flex items-center gap-2",
                      hasGradient ? "opacity-90" : "text-muted-foreground"
                    )}>
                      <Trophy className="h-4 w-4" />
                      <span>{org.sports}</span>
                    </div>
                  )}
                  {(org.city || org.state) && (
                    <div className={cn(
                      "flex items-center gap-2",
                      hasGradient ? "opacity-90" : "text-muted-foreground"
                    )}>
                      <MapPin className="h-4 w-4" />
                      <span>{[org.city, org.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {org.territory && (
                    <div className={cn(
                      "flex items-center gap-2",
                      hasGradient ? "opacity-90" : "text-muted-foreground"
                    )}>
                      <MapIcon className="h-4 w-4" />
                      <span>{org.territory}</span>
                    </div>
                  )}
                  {org.shippingAddress && (
                    <div className={cn(
                      "flex items-center gap-2",
                      hasGradient ? "opacity-90" : "text-muted-foreground"
                    )}>
                      <FileText className="h-4 w-4" />
                      <span className="line-clamp-1">{org.shippingAddress}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredOrgs.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No organizations found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && handleCloseCreateModal()}>
        <DialogContent className="glass-panel border-white/10 max-w-2xl max-h-[90vh]" data-testid="dialog-create-org">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Organization</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add a new company or organization with logo and brand colors</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <LogoUploadSection />
              
              <div className="border-t border-white/10 pt-4" />
              
              <div>
                <Label htmlFor="name" className="text-foreground">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization name"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-org-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sports" className="text-foreground">Sports</Label>
                  <Input
                    id="sports"
                    value={formData.sports || ""}
                    onChange={(e) => setFormData({ ...formData, sports: e.target.value })}
                    placeholder="Football, Basketball, etc."
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-org-sports"
                  />
                </div>
                <div>
                  <Label htmlFor="clientType" className="text-foreground">Client Type</Label>
                  <Select
                    value={formData.clientType || ""}
                    onValueChange={(value) => setFormData({ ...formData, clientType: value as any })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-org-client-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-foreground">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-org-city"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-foreground">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-org-state"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="territory" className="text-foreground">Territory</Label>
                <Input
                  id="territory"
                  value={formData.territory || ""}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  placeholder="Sales territory"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-org-territory"
                />
              </div>
              
              <div>
                <Label htmlFor="shippingAddress" className="text-foreground">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress || ""}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  placeholder="Full shipping address"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-org-shipping"
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the organization"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-org-notes"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseCreateModal}
              data-testid="button-cancel-create"
              className="border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={!formData.name || createOrgMutation.isPending}
              data-testid="button-submit-create"
              className="bg-primary hover:bg-primary/90"
            >
              {createOrgMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add Organization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCloseEditModal()}>
        <DialogContent className="glass-panel border-white/10 max-w-2xl max-h-[90vh]" data-testid="dialog-edit-org">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Organization</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update organization details, logo, and brand colors</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <LogoUploadSection />
              
              <div className="border-t border-white/10 pt-4" />
              
              <div>
                <Label htmlFor="edit-name" className="text-foreground">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization name"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-edit-org-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-sports" className="text-foreground">Sports</Label>
                  <Input
                    id="edit-sports"
                    value={formData.sports || ""}
                    onChange={(e) => setFormData({ ...formData, sports: e.target.value })}
                    placeholder="Football, Basketball, etc."
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-edit-org-sports"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-clientType" className="text-foreground">Client Type</Label>
                  <Select
                    value={formData.clientType || ""}
                    onValueChange={(value) => setFormData({ ...formData, clientType: value as any })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-edit-org-client-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-city" className="text-foreground">City</Label>
                  <Input
                    id="edit-city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-edit-org-city"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state" className="text-foreground">State</Label>
                  <Input
                    id="edit-state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-edit-org-state"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-territory" className="text-foreground">Territory</Label>
                <Input
                  id="edit-territory"
                  value={formData.territory || ""}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  placeholder="Sales territory"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-edit-org-territory"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-shippingAddress" className="text-foreground">Shipping Address</Label>
                <Textarea
                  id="edit-shippingAddress"
                  value={formData.shippingAddress || ""}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  placeholder="Full shipping address"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-edit-org-shipping"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-notes" className="text-foreground">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the organization"
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-edit-org-notes"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              data-testid="button-cancel-edit"
              className="border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateOrg}
              disabled={!formData.name || updateOrgMutation.isPending}
              data-testid="button-submit-edit"
              className="bg-primary hover:bg-primary/90"
            >
              {updateOrgMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Organization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent data-testid="dialog-delete-org" className="glass-panel border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Organization</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete" className="border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrgId && deleteOrgMutation.mutate(deleteOrgId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
