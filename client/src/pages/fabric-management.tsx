import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Layers, 
  Search, 
  Check, 
  X, 
  Clock, 
  Filter, 
  Package,
  User,
  Building2,
  MapPin,
  Ruler,
  Blend,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";
import type { FabricSubmission, Fabric } from "@shared/schema";

interface SubmissionWithDetails extends FabricSubmission {
  submitterName?: string;
  manufacturingOrderCode?: string;
  lineItemName?: string;
}

export default function FabricManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("submissions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: submissions = [], isLoading: isLoadingSubmissions, refetch: refetchSubmissions } = useQuery<SubmissionWithDetails[]>({
    queryKey: ['/api/fabric-submissions'],
  });

  const { data: fabrics = [], isLoading: isLoadingFabrics, refetch: refetchFabrics } = useQuery<Fabric[]>({
    queryKey: ['/api/fabrics'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }: { id: number; action: 'approve' | 'reject'; reviewNotes?: string }) => {
      return apiRequest('POST', `/api/fabric-submissions/${id}/review`, {
        action,
        reviewNotes
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fabrics'] });
      toast({
        title: variables.action === 'approve' ? "Fabric Approved" : "Fabric Rejected",
        description: variables.action === 'approve' 
          ? "The fabric has been approved and added to the library."
          : "The fabric submission has been rejected.",
      });
      setIsReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review submission",
        variant: "destructive",
      });
    },
  });

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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.fabricName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.fabricType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredFabrics = fabrics.filter(fabric => {
    return fabric.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fabric.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fabric.fabricType?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const openReviewModal = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setReviewNotes("");
    setIsReviewModalOpen(true);
  };

  const handleReview = (action: 'approve' | 'reject') => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({
      id: selectedSubmission.id,
      action,
      reviewNotes
    });
  };

  return (
    <div className="space-y-6" data-testid="fabric-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Fabric Management</h1>
          <p className="text-muted-foreground">
            Review fabric submissions and manage the fabric library
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            refetchSubmissions();
            refetchFabrics();
          }}
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-submissions">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-approved">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fabric Library</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-library-count">{fabrics.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" data-testid="tab-submissions">
            Submissions
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">
            Fabric Library
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          {activeTab === "submissions" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="submissions" className="space-y-4">
          {isLoadingSubmissions ? (
            <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No fabric submissions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSubmissions.map((submission) => (
                <Card 
                  key={submission.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    submission.status === 'pending' ? 'border-amber-200 dark:border-amber-800' : ''
                  }`}
                  onClick={() => openReviewModal(submission)}
                  data-testid={`card-submission-${submission.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{submission.fabricName}</h3>
                          {getStatusBadge(submission.status || 'pending')}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {submission.fabricType && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Package className="w-4 h-4" />
                              <span>{submission.fabricType}</span>
                            </div>
                          )}
                          {submission.gsm && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Ruler className="w-4 h-4" />
                              <span>{submission.gsm} GSM</span>
                            </div>
                          )}
                          {submission.blend && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Blend className="w-4 h-4" />
                              <span>{submission.blend}</span>
                            </div>
                          )}
                          {submission.vendorName && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              <span>{submission.vendorName}</span>
                            </div>
                          )}
                        </div>

                        {submission.vendorLocation && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {submission.vendorLocation}
                              {submission.vendorCountry && `, ${submission.vendorCountry}`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                          <span>
                            Submitted: {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                          {submission.reviewedAt && (
                            <span>
                              Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {submission.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                              handleReview('approve');
                            }}
                            data-testid={`button-quick-approve-${submission.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReviewModal(submission);
                            }}
                            data-testid={`button-quick-reject-${submission.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {isLoadingFabrics ? (
            <div className="text-center py-8 text-muted-foreground">Loading fabric library...</div>
          ) : filteredFabrics.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No fabrics in library</p>
                <p className="text-sm">Approved fabric submissions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFabrics.map((fabric) => (
                <Card key={fabric.id} data-testid={`card-fabric-${fabric.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{fabric.name}</CardTitle>
                      {fabric.isApproved && (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" /> Approved
                        </Badge>
                      )}
                    </div>
                    {fabric.fabricType && (
                      <CardDescription>{fabric.fabricType}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {fabric.gsm && (
                        <div>
                          <span className="text-muted-foreground">GSM:</span> {fabric.gsm}
                        </div>
                      )}
                      {fabric.weight && (
                        <div>
                          <span className="text-muted-foreground">Weight:</span> {fabric.weight}
                        </div>
                      )}
                      {fabric.blend && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Blend:</span> {fabric.blend}
                        </div>
                      )}
                      {fabric.stretchType && (
                        <div>
                          <span className="text-muted-foreground">Stretch:</span> {fabric.stretchType}
                        </div>
                      )}
                    </div>
                    
                    {fabric.vendorName && (
                      <Separator className="my-2" />
                    )}
                    
                    {fabric.vendorName && (
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{fabric.vendorName}</span>
                        </div>
                        {fabric.vendorLocation && (
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {fabric.vendorLocation}
                              {fabric.vendorCountry && `, ${fabric.vendorCountry}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Review Fabric Submission
            </DialogTitle>
            <DialogDescription>
              Review the fabric details and approve or reject the submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedSubmission.fabricName}</h3>
                {getStatusBadge(selectedSubmission.status || 'pending')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Fabric Type</Label>
                    <p className="font-medium">{selectedSubmission.fabricType || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">GSM (Weight)</Label>
                    <p className="font-medium">{selectedSubmission.gsm || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Blend</Label>
                    <p className="font-medium">{selectedSubmission.blend || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Weight Class</Label>
                    <p className="font-medium">{selectedSubmission.weight || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Stretch Type</Label>
                    <p className="font-medium">{selectedSubmission.stretchType || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vendor</Label>
                    <p className="font-medium">{selectedSubmission.vendorName || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">
                      {selectedSubmission.vendorLocation || 'Not specified'}
                      {selectedSubmission.vendorCountry && `, ${selectedSubmission.vendorCountry}`}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <Label className="text-muted-foreground">Submission Notes</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-md mt-1">
                    {selectedSubmission.notes}
                  </p>
                </div>
              )}

              {selectedSubmission.status === 'pending' && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={3}
                      className="mt-1"
                      data-testid="textarea-review-notes"
                    />
                  </div>
                </>
              )}

              {selectedSubmission.reviewNotes && selectedSubmission.status !== 'pending' && (
                <div>
                  <Label className="text-muted-foreground">Review Notes</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-md mt-1">
                    {selectedSubmission.reviewNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReviewModalOpen(false)}
              data-testid="button-close-review"
            >
              Close
            </Button>
            {selectedSubmission?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => handleReview('reject')}
                  disabled={reviewMutation.isPending}
                  data-testid="button-reject"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview('approve')}
                  disabled={reviewMutation.isPending}
                  data-testid="button-approve"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
