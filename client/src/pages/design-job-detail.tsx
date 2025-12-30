import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { EditDesignJobModal } from "@/components/modals/edit-design-job-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Archive, ArchiveRestore, FileImage, FileText, Link as LinkIcon, Download, ArrowLeft, Edit, Building2, Sparkles } from "lucide-react";
import { OrgLogo } from "@/components/ui/org-logo";
import { DesignGallery, DesignShowcase } from "@/components/ui/design-gallery";
import { extractDominantColors } from "@/lib/colorExtraction";
import { createGradient, getReadableTextColorForGradient } from "@/lib/contrastUtils";

interface DesignJob {
  id: number;
  jobCode: string;
  orgId: number;
  leadId?: number;
  orderId?: number;
  brief?: string;
  requirements?: string;
  urgency: "low" | "normal" | "high" | "rush";
  status: "pending" | "assigned" | "in_progress" | "review" | "approved" | "rejected" | "completed";
  assignedDesignerId?: string;
  renditionCount: number;
  renditionUrls?: string[];
  renditionMockupUrl?: string;
  renditionProductionUrl?: string;
  finalLink?: string;
  referenceFiles?: string[];
  deadline?: string;
  priority: "low" | "normal" | "high";
  internalNotes?: string;
  clientFeedback?: string;
  archived?: boolean;
  archivedAt?: string;
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
  logoUrls?: string[];
  designReferenceUrls?: string[];
  additionalFileUrls?: string[];
  designStyleUrl?: string;
}

interface Organization {
  id: number;
  name: string;
  logoUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
}

export default function DesignJobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // Fetch design job data
  const { data: designJob, isLoading: jobLoading } = useQuery<DesignJob>({
    queryKey: ["/api/design-jobs", id],
    retry: false,
    enabled: !!id,
  });

  // Fetch organizations for display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  // State for extracted org colors
  const [orgColors, setOrgColors] = useState<string[]>([]);

  // Get current organization
  const currentOrg = organizations.find(org => org.id === designJob?.orgId);

  // Extract colors from organization logo
  useEffect(() => {
    if (currentOrg?.logoUrl) {
      extractDominantColors(currentOrg.logoUrl).then(setOrgColors);
    }
  }, [currentOrg?.logoUrl]);

  // Create organization lookup map
  const orgLookup = organizations.reduce((acc, org) => {
    acc[org.id] = org.name;
    return acc;
  }, {} as Record<number, string>);

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (archive: boolean) => {
      const endpoint = archive ? `/api/design-jobs/${id}/archive` : `/api/design-jobs/${id}/unarchive`;
      return apiRequest(endpoint, { method: "PUT" });
    },
    onSuccess: (data, archive) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs/archived"] });
      toast({
        title: "Success",
        description: archive ? "Design job archived successfully" : "Design job unarchived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update archive status",
        variant: "destructive",
      });
    },
  });

  const handleArchiveToggle = () => {
    const isArchiving = !designJob?.archived;
    const confirmMessage = isArchiving 
      ? `Archive design job "${designJob?.jobCode}"? It will be moved to the archived section.`
      : `Unarchive design job "${designJob?.jobCode}"? It will be restored to active jobs.`;
    
    if (confirm(confirmMessage)) {
      archiveMutation.mutate(isArchiving);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "pending";
      case "assigned": return "in_progress";
      case "in_progress": return "in_progress";
      case "review": return "review";
      case "approved": return "ready";
      case "rejected": return "rejected";
      case "completed": return "ready";
      default: return "pending";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low": return "ready";
      case "normal": return "pending";
      case "high": return "review";
      case "rush": return "rejected";
      default: return "pending";
    }
  };

  const extractFileName = (url: string): string => {
    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      return decodeURIComponent(fileName);
    } catch {
      return url;
    }
  };

  if (isLoading || jobLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!designJob) {
    return (
      <div className="p-3 sm:p-6 min-h-screen bg-gradient-to-br from-background to-background/80">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm border border-white/10">
            <i className="fas fa-exclamation-triangle text-2xl text-muted-foreground"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Design Job Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The design job you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation("/design-jobs")} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Design Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 min-h-screen bg-gradient-to-br from-background to-background/80 pb-24">
      {/* Organization Branded Header */}
      <div 
        className="rounded-2xl p-6 mb-8 relative overflow-hidden"
        style={orgColors.length > 0 ? { 
          background: createGradient(orgColors, '135deg'),
        } : undefined}
      >
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Organization Logo */}
            {currentOrg && (
              <OrgLogo
                src={currentOrg.logoUrl}
                orgName={currentOrg.name}
                orgId={currentOrg.id}
                size="xl"
                className="shadow-xl"
              />
            )}
            <div>
              <h1 
                className={`text-3xl sm:text-4xl font-bold tracking-tight mb-1 ${orgColors.length > 0 ? getReadableTextColorForGradient(orgColors) : 'gradient-text'}`}
                style={orgColors.length > 0 ? { textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : undefined}
                data-testid="heading-design-job-detail"
              >
                {designJob.jobCode}
              </h1>
              <p className={`text-lg flex items-center gap-2 ${orgColors.length > 0 ? getReadableTextColorForGradient(orgColors) + ' opacity-90' : 'text-muted-foreground'}`}
                style={orgColors.length > 0 ? { textShadow: '0 1px 2px rgba(0,0,0,0.3)' } : undefined}
              >
                <Building2 className="w-4 h-4" />
                {orgLookup[designJob.orgId] || `Organization ${designJob.orgId}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setLocation("/design-jobs")}
              data-testid="button-back"
              className={orgColors.length > 0 ? "bg-white/20 border-white/30 text-white hover:bg-white/30" : "glass-card border-white/10 hover:bg-white/5"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              data-testid="button-edit-job"
              className={orgColors.length > 0 ? "bg-white/90 text-black hover:bg-white" : "bg-primary hover:bg-primary/90"}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={designJob.archived ? "default" : "secondary"}
              onClick={handleArchiveToggle}
              disabled={archiveMutation.isPending}
              data-testid="button-archive-job"
              className={orgColors.length > 0 
                ? "bg-white/20 border-white/30 text-white hover:bg-white/30" 
                : designJob.archived ? "bg-primary hover:bg-primary/90" : "glass-card border-white/10 hover:bg-white/5"}
            >
              {designJob.archived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Details */}
        <Card data-testid="card-job-details" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <StatusBadge status={getStatusColor(designJob.status)}>
                    {designJob.status.replace("_", " ")}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Urgency</label>
                <div className="mt-1">
                  <StatusBadge status={getUrgencyColor(designJob.urgency)}>
                    {designJob.urgency}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <p className="mt-1 text-sm capitalize text-foreground">{designJob.priority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Renditions</label>
                <p className="mt-1 text-sm text-foreground">{designJob.renditionCount || 0}</p>
              </div>
            </div>

            {designJob.deadline && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                <p className="mt-1 text-sm text-foreground">{formatDate(designJob.deadline)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1 text-sm text-foreground">{formatDate(designJob.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="mt-1 text-sm text-foreground">{formatDate(designJob.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brief & Requirements */}
        <Card data-testid="card-brief-requirements" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Brief & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {designJob.brief && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brief</label>
                <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{designJob.brief}</p>
              </div>
            )}

            {designJob.requirements && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requirements</label>
                <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{designJob.requirements}</p>
              </div>
            )}

            {designJob.internalNotes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{designJob.internalNotes}</p>
              </div>
            )}

            {designJob.clientFeedback && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client Feedback</label>
                <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{designJob.clientFeedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renditions & Files */}
        {(designJob.renditionUrls?.length || designJob.renditionMockupUrl || designJob.renditionProductionUrl || designJob.finalLink) && (
          <Card data-testid="card-renditions" className="lg:col-span-2 glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Renditions & Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {designJob.renditionUrls && designJob.renditionUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rendition URLs</label>
                  <div className="mt-1 space-y-1">
                    {designJob.renditionUrls.map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:text-primary/80 underline"
                      >
                        Rendition {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {designJob.renditionMockupUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mockup</label>
                    <a 
                      href={designJob.renditionMockupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-sm text-primary hover:text-primary/80 underline"
                    >
                      View Mockup
                    </a>
                  </div>
                )}

                {designJob.renditionProductionUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Production File</label>
                    <a 
                      href={designJob.renditionProductionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-sm text-primary hover:text-primary/80 underline"
                    >
                      Download Production
                    </a>
                  </div>
                )}

                {designJob.finalLink && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Final Link</label>
                    <a 
                      href={designJob.finalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-sm text-primary hover:text-primary/80 underline"
                    >
                      View Final
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments - Artistic Gallery View */}
        <Card data-testid="card-attachments" className="lg:col-span-2 glass-card border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Design Assets Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Featured Design Showcase - Show first logo or final design prominently */}
            {(designJob.logoUrls?.[0] || designJob.renditionMockupUrl) && (
              <DesignShowcase
                primaryImage={designJob.renditionMockupUrl || designJob.logoUrls?.[0]}
                title={designJob.renditionMockupUrl ? "Design Mockup" : "Primary Logo"}
                subtitle={`${designJob.jobCode} - ${orgLookup[designJob.orgId] || 'Organization'}`}
              />
            )}

            {/* Logos Gallery */}
            <DesignGallery
              title="Organization Logos"
              files={designJob.logoUrls || []}
              category="logos"
              emptyMessage="No logos uploaded yet"
            />

            {/* Design References Gallery */}
            <DesignGallery
              title="Design References"
              files={designJob.designReferenceUrls || []}
              category="references"
              emptyMessage="No reference images uploaded"
            />

            {/* Additional Files */}
            <DesignGallery
              title="Additional Files"
              files={designJob.additionalFileUrls || []}
              category="additional"
              emptyMessage="No additional files"
            />

            {/* Design Style */}
            {designJob.designStyleUrl && (
              <DesignGallery
                title="Style Reference"
                files={[designJob.designStyleUrl]}
                category="designs"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Design Job Modal */}
      <EditDesignJobModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        designJobId={designJob.id}
      />
    </div>
  );
}