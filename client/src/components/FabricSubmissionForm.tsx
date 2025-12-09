import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layers, Plus, Check, Clock, X, AlertCircle } from "lucide-react";
import type { FabricSubmission } from "@shared/schema";

interface FabricSubmissionFormProps {
  manufacturingId: number;
  lineItemId: number;
  lineItemName?: string;
  onSubmitSuccess?: () => void;
}

export function FabricSubmissionForm({ 
  manufacturingId, 
  lineItemId, 
  lineItemName,
  onSubmitSuccess 
}: FabricSubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fabricName: "",
    gsm: "",
    blend: "",
    vendorName: "",
    vendorLocation: "",
    vendorCountry: "",
    fabricType: "",
    weight: "",
    stretchType: "",
    notes: "",
  });

  const { data: existingSubmissions = [], isLoading: isLoadingSubmissions } = useQuery<FabricSubmission[]>({
    queryKey: ['/api/fabric-submissions', { lineItemId }],
    queryFn: async () => {
      const response = await fetch(`/api/fabric-submissions?lineItemId=${lineItemId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!lineItemId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/fabric-submissions', {
        manufacturingId,
        lineItemId,
        fabricName: formData.fabricName,
        gsm: formData.gsm ? parseInt(formData.gsm) : null,
        blend: formData.blend || null,
        vendorName: formData.vendorName || null,
        vendorLocation: formData.vendorLocation || null,
        vendorCountry: formData.vendorCountry || null,
        fabricType: formData.fabricType || null,
        weight: formData.weight || null,
        stretchType: formData.stretchType || null,
        notes: formData.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-submissions'] });
      toast({
        title: "Fabric Submitted",
        description: "Your fabric submission has been sent for approval.",
      });
      setIsOpen(false);
      resetForm();
      onSubmitSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit fabric",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      fabricName: "",
      gsm: "",
      blend: "",
      vendorName: "",
      vendorLocation: "",
      vendorCountry: "",
      fabricType: "",
      weight: "",
      stretchType: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fabricName.trim()) {
      toast({
        title: "Validation Error",
        description: "Fabric name is required",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const latestSubmission = existingSubmissions.length > 0 ? existingSubmissions[0] : null;
  const hasApprovedSubmission = existingSubmissions.some(s => s.status === 'approved');
  const hasPendingSubmission = existingSubmissions.some(s => s.status === 'pending');

  return (
    <>
      <div className="flex flex-col gap-2">
        {latestSubmission ? (
          <div className="flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fabric:</span>
            <span className="font-medium">{latestSubmission.fabricName}</span>
            {getStatusBadge(latestSubmission.status || 'pending')}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>No fabric submitted</span>
          </div>
        )}
        
        {!hasApprovedSubmission && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className="w-fit"
            data-testid={`button-submit-fabric-${lineItemId}`}
          >
            <Plus className="w-4 h-4 mr-1" />
            {hasPendingSubmission ? 'Submit New Fabric' : 'Submit Fabric'}
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Submit Fabric Details
            </DialogTitle>
            <DialogDescription>
              Submit fabric information for {lineItemName || `Line Item #${lineItemId}`}. 
              This will be reviewed and approved by an admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fabricName">Fabric Name *</Label>
                <Input
                  id="fabricName"
                  value={formData.fabricName}
                  onChange={(e) => setFormData({ ...formData, fabricName: e.target.value })}
                  placeholder="e.g., Premium Athletic Jersey"
                  required
                  data-testid="input-fabric-name"
                />
              </div>

              <div>
                <Label htmlFor="fabricType">Fabric Type</Label>
                <Select 
                  value={formData.fabricType} 
                  onValueChange={(value) => setFormData({ ...formData, fabricType: value })}
                >
                  <SelectTrigger id="fabricType" data-testid="select-fabric-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jersey">Jersey</SelectItem>
                    <SelectItem value="Fleece">Fleece</SelectItem>
                    <SelectItem value="Mesh">Mesh</SelectItem>
                    <SelectItem value="Interlock">Interlock</SelectItem>
                    <SelectItem value="Pique">Pique</SelectItem>
                    <SelectItem value="Twill">Twill</SelectItem>
                    <SelectItem value="Dri-Fit">Dri-Fit</SelectItem>
                    <SelectItem value="Spandex">Spandex</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gsm">GSM (Weight)</Label>
                <Input
                  id="gsm"
                  type="number"
                  value={formData.gsm}
                  onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                  placeholder="e.g., 180"
                  data-testid="input-gsm"
                />
              </div>

              <div>
                <Label htmlFor="blend">Blend Composition</Label>
                <Input
                  id="blend"
                  value={formData.blend}
                  onChange={(e) => setFormData({ ...formData, blend: e.target.value })}
                  placeholder="e.g., 60% Cotton, 40% Polyester"
                  data-testid="input-blend"
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight Class</Label>
                <Select 
                  value={formData.weight} 
                  onValueChange={(value) => setFormData({ ...formData, weight: value })}
                >
                  <SelectTrigger id="weight" data-testid="select-weight">
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lightweight">Lightweight</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Heavyweight">Heavyweight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stretchType">Stretch Type</Label>
                <Select 
                  value={formData.stretchType} 
                  onValueChange={(value) => setFormData({ ...formData, stretchType: value })}
                >
                  <SelectTrigger id="stretchType" data-testid="select-stretch">
                    <SelectValue placeholder="Select stretch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None (No Stretch)</SelectItem>
                    <SelectItem value="2-way">2-Way Stretch</SelectItem>
                    <SelectItem value="4-way">4-Way Stretch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="e.g., Premium Fabrics Co."
                  data-testid="input-vendor-name"
                />
              </div>

              <div>
                <Label htmlFor="vendorLocation">Vendor Location</Label>
                <Input
                  id="vendorLocation"
                  value={formData.vendorLocation}
                  onChange={(e) => setFormData({ ...formData, vendorLocation: e.target.value })}
                  placeholder="e.g., Guangzhou"
                  data-testid="input-vendor-location"
                />
              </div>

              <div>
                <Label htmlFor="vendorCountry">Vendor Country</Label>
                <Input
                  id="vendorCountry"
                  value={formData.vendorCountry}
                  onChange={(e) => setFormData({ ...formData, vendorCountry: e.target.value })}
                  placeholder="e.g., China"
                  data-testid="input-vendor-country"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details about the fabric..."
                  rows={3}
                  data-testid="textarea-fabric-notes"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-fabric"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                data-testid="button-submit-fabric-form"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </DialogFooter>
          </form>

          {existingSubmissions.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Previous Submissions</h4>
              <div className="space-y-2">
                {existingSubmissions.map((submission) => (
                  <Card key={submission.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{submission.fabricName}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.fabricType && `${submission.fabricType} • `}
                            {submission.gsm && `${submission.gsm} GSM • `}
                            {submission.blend || 'No blend specified'}
                          </p>
                        </div>
                        {getStatusBadge(submission.status || 'pending')}
                      </div>
                      {submission.reviewNotes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Review notes: {submission.reviewNotes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FabricStatusIndicatorProps {
  lineItemId: number;
}

export function FabricStatusIndicator({ lineItemId }: FabricStatusIndicatorProps) {
  const { data: submissions = [], isLoading } = useQuery<FabricSubmission[]>({
    queryKey: ['/api/fabric-submissions', { lineItemId }],
    queryFn: async () => {
      const response = await fetch(`/api/fabric-submissions?lineItemId=${lineItemId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!lineItemId,
  });

  if (isLoading) {
    return <Badge variant="outline" className="text-xs">Loading...</Badge>;
  }

  const approvedSubmission = submissions.find(s => s.status === 'approved');
  const pendingSubmission = submissions.find(s => s.status === 'pending');

  if (approvedSubmission) {
    return (
      <Badge className="bg-green-600/20 text-green-600 border-green-600/30 text-xs">
        <Check className="w-3 h-3 mr-1" />
        Fabric: {approvedSubmission.fabricName}
      </Badge>
    );
  }

  if (pendingSubmission) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="w-3 h-3 mr-1" />
        Fabric: Pending Approval
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs text-amber-600 border-amber-600/30">
      <AlertCircle className="w-3 h-3 mr-1" />
      Fabric Required
    </Badge>
  );
}
