import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import {
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type FirstPieceStatus = "pending" | "awaiting_approval" | "approved" | "rejected";

interface FirstPieceApprovalPanelProps {
  manufacturingId: number;
  firstPieceStatus: FirstPieceStatus;
  firstPieceImageUrls?: string[];
  firstPieceUploadedAt?: string;
  firstPieceUploadedBy?: string;
  firstPieceApprovedAt?: string;
  firstPieceApprovedBy?: string;
  firstPieceRejectionNotes?: string;
  canUpload?: boolean;
  canApprove?: boolean;
  onUpdate?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<FirstPieceStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: {
    label: "Pending Upload",
    icon: Clock,
    color: "text-muted-foreground border-muted-foreground/50",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/50 bg-amber-500/10",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-400 border-red-500/50 bg-red-500/10",
  },
};

export function FirstPieceApprovalPanel({
  manufacturingId,
  firstPieceStatus = "pending",
  firstPieceImageUrls = [],
  firstPieceUploadedAt,
  firstPieceUploadedBy,
  firstPieceApprovedAt,
  firstPieceApprovedBy,
  firstPieceRejectionNotes,
  canUpload = false,
  canApprove = false,
  onUpdate,
  className,
}: FirstPieceApprovalPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const statusConfig = STATUS_CONFIG[firstPieceStatus];
  const StatusIcon = statusConfig.icon;

  const uploadMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await apiRequest(`/api/manufacturing/${manufacturingId}/first-piece/upload`, {
        method: "POST",
        body: JSON.stringify({ imageUrls }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing", manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/manufacturing/${manufacturingId}/first-piece/approve`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing", manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (rejectionNotes: string) => {
      const response = await apiRequest(`/api/manufacturing/${manufacturingId}/first-piece/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionNotes }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing", manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/manufacturing/${manufacturingId}/first-piece/reset`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing", manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Sample Approved",
          description: "First piece has been approved. Bulk production can proceed.",
        });
        setShowApprovalDialog(false);
      },
    });
  };

  const handleReject = () => {
    if (!rejectionNotes.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide rejection reason.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate(rejectionNotes, {
      onSuccess: () => {
        toast({
          title: "Sample Rejected",
          description: "First piece has been rejected with feedback.",
        });
        setShowRejectionDialog(false);
        setRejectionNotes("");
      },
    });
  };

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Reset Complete",
          description: "First piece approval has been reset.",
        });
      },
    });
  };

  return (
    <>
      <Card className={cn("border-white/10 bg-white/5", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              First Piece Approval
            </CardTitle>
            <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {firstPieceStatus === "rejected" && firstPieceRejectionNotes && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Rejection Reason</p>
                  <p className="text-sm text-muted-foreground mt-1">{firstPieceRejectionNotes}</p>
                </div>
              </div>
            </div>
          )}

          {firstPieceImageUrls.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sample Images</Label>
              <div className="grid grid-cols-3 gap-2">
                {firstPieceImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFullScreenImage(url)}
                    className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
                    data-testid={`first-piece-image-${idx}`}
                  >
                    <img
                      src={url}
                      alt={`Sample ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {firstPieceUploadedAt && (
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(firstPieceUploadedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          )}

          {firstPieceStatus === "approved" && firstPieceApprovedAt && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Approved {formatDistanceToNow(new Date(firstPieceApprovedAt), { addSuffix: true })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canApprove && firstPieceStatus === "awaiting_approval" && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowApprovalDialog(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-approve-samples"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectionDialog(true)}
                  className="gap-1.5 text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                  data-testid="button-reject-samples"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </>
            )}

            {canApprove && (firstPieceStatus === "approved" || firstPieceStatus === "rejected") && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={resetMutation.isPending}
                className="gap-1.5"
                data-testid="button-reset-approval"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Upload section for manufacturers */}
          {canUpload && (firstPieceStatus === "pending" || firstPieceStatus === "rejected") && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Upload Sample Images</Label>
              <ObjectUploader
                allowedFileTypes={["image/*"]}
                maxNumberOfFiles={5}
                maxFileSize={10 * 1024 * 1024}
                onGetUploadParameters={async (file: File) => {
                  const response = await fetch("/api/upload/image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      filename: file.name,
                      size: file.size,
                      mimeType: file.type,
                    }),
                  });
                  if (!response.ok) throw new Error("Failed to get upload URL");
                  const data = await response.json();
                  (file as any).__uploadId = data.uploadId;
                  return {
                    method: "PUT" as const,
                    url: data.uploadURL,
                    headers: { "Content-Type": file.type },
                  };
                }}
                onComplete={(result) => {
                  const uploadedUrls: string[] = [];
                  result.successful?.forEach((file: any) => {
                    const uploadId = file.__uploadId;
                    if (uploadId) {
                      uploadedUrls.push(`/public-objects/${uploadId}`);
                    }
                  });
                  if (uploadedUrls.length > 0) {
                    uploadMutation.mutate(uploadedUrls, {
                      onSuccess: () => {
                        toast({
                          title: "Samples Uploaded",
                          description: "Images submitted for approval.",
                        });
                      },
                    });
                  }
                }}
              >
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Sample Photos
                </Button>
              </ObjectUploader>
              <p className="text-xs text-muted-foreground">
                Upload photos of the first piece sample for quality approval before bulk production.
              </p>
            </div>
          )}

          {firstPieceStatus === "pending" && !canUpload && (
            <p className="text-sm text-muted-foreground">
              Waiting for manufacturer to upload sample images for approval.
            </p>
          )}

          {firstPieceStatus === "awaiting_approval" && !canApprove && (
            <p className="text-sm text-muted-foreground">
              Samples submitted. Awaiting approval from operations team.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Approve First Piece Sample</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Approving this sample will allow bulk production to proceed. 
              Please confirm the sample meets quality standards.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Reject First Piece Sample</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide feedback on why this sample is being rejected.
            </p>
            <div className="space-y-2">
              <Label htmlFor="rejection-notes">Rejection Reason</Label>
              <Textarea
                id="rejection-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Describe what needs to be corrected..."
                className="min-h-[100px]"
                data-testid="input-rejection-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionNotes.trim()}
              variant="destructive"
              data-testid="button-confirm-rejection"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Sample"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fullScreenImage && (
        <Dialog open={!!fullScreenImage} onOpenChange={() => setFullScreenImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <img
              src={fullScreenImage}
              alt="Full size sample"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
