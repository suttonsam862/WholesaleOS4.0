/**
 * V6 Validation Panel Component
 * Advisory validation status display with acknowledgment support
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";

export type ValidationSeverity = "error" | "warning" | "info" | "success";
export type ValidationStatus = "valid" | "issues_found" | "pending" | "error";

interface ValidationResult {
  id: string;
  entityType: string;
  entityId: string;
  checkType: string;
  checkName: string;
  severity: ValidationSeverity;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedNote?: string;
  createdAt: string;
}

interface ValidationSummary {
  entityType: string;
  entityId: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  acknowledgedCount: number;
  validationStatus: ValidationStatus;
  lastRunAt: string;
  lastRunBy?: string;
  lastRunByName?: string;
}

const SEVERITY_CONFIG: Record<ValidationSeverity, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
}> = {
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Warning",
  },
  info: {
    icon: AlertTriangle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Info",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Pass",
  },
};

interface ValidationPanelProps {
  entityType: string;
  entityId: string;
  allowRun?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function ValidationPanel({
  entityType,
  entityId,
  allowRun = true,
  showDetails = true,
  compact = false,
  className,
}: ValidationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [acknowledgeDialog, setAcknowledgeDialog] = useState<ValidationResult | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState("");

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<ValidationSummary | null>({
    queryKey: [`/api/v6/validation/${entityType}/${entityId}/summary`],
    queryFn: async () => {
      const res = await fetch(`/api/v6/validation/${entityType}/${entityId}/summary`);
      if (!res.ok) throw new Error("Failed to fetch validation summary");
      const data = await res.json();
      return data.summary || null;
    },
  });

  // Fetch results (only when expanded)
  const { data: results = [], isLoading: resultsLoading } = useQuery<ValidationResult[]>({
    queryKey: [`/api/v6/validation/${entityType}/${entityId}/results`],
    queryFn: async () => {
      const res = await fetch(`/api/v6/validation/${entityType}/${entityId}/results`);
      if (!res.ok) throw new Error("Failed to fetch validation results");
      const data = await res.json();
      return data.results || [];
    },
    enabled: expanded && showDetails,
  });

  // Run validation mutation
  const runValidationMutation = useMutation({
    mutationFn: async () => {
      const endpoint =
        entityType === "order"
          ? `/api/v6/validation/order/${entityId}`
          : entityType === "design_job"
          ? `/api/v6/validation/design-job/${entityId}`
          : `/api/v6/validation/line-item/${entityId}`;
      const res = await apiRequest("POST", endpoint);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/validation/${entityType}/${entityId}`] });
      toast({ title: "Validation complete" });
    },
    onError: (error: Error) => {
      toast({
        title: "Validation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (data: { resultId: string; note?: string }) => {
      const res = await apiRequest("POST", `/api/v6/validation/acknowledge/${data.resultId}`, {
        note: data.note,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/validation/${entityType}/${entityId}`] });
      setAcknowledgeDialog(null);
      setAcknowledgeNote("");
      toast({ title: "Warning acknowledged" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to acknowledge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAcknowledge = (result: ValidationResult) => {
    setAcknowledgeDialog(result);
    setAcknowledgeNote("");
  };

  const confirmAcknowledge = () => {
    if (acknowledgeDialog) {
      acknowledgeMutation.mutate({
        resultId: acknowledgeDialog.id,
        note: acknowledgeNote || undefined,
      });
    }
  };

  if (summaryLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // No validation run yet
  if (!summary) {
    return (
      <div className={cn("text-center py-4", className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">No validation run yet</p>
        {allowRun && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => runValidationMutation.mutate()}
            disabled={runValidationMutation.isPending}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", runValidationMutation.isPending && "animate-spin")}
            />
            Run Validation
          </Button>
        )}
      </div>
    );
  }

  const StatusIcon =
    summary.validationStatus === "valid"
      ? CheckCircle2
      : summary.errorCount > 0
      ? XCircle
      : AlertTriangle;
  const statusColor =
    summary.validationStatus === "valid"
      ? "text-green-500"
      : summary.errorCount > 0
      ? "text-red-500"
      : "text-yellow-500";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-5 h-5", statusColor)} />
          <span className="font-medium">
            {summary.validationStatus === "valid"
              ? "All Checks Passed"
              : `${summary.failedChecks} Issue${summary.failedChecks !== 1 ? "s" : ""} Found`}
          </span>
        </div>
        {allowRun && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => runValidationMutation.mutate()}
            disabled={runValidationMutation.isPending}
          >
            <RefreshCw
              className={cn("w-4 h-4", runValidationMutation.isPending && "animate-spin")}
            />
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{summary.passedChecks} passed</span>
        </div>
        {summary.errorCount > 0 && (
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>{summary.errorCount} errors</span>
          </div>
        )}
        {summary.warningCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>{summary.warningCount} warnings</span>
          </div>
        )}
        {summary.acknowledgedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {summary.acknowledgedCount} acknowledged
          </Badge>
        )}
      </div>

      {/* Last run info */}
      <div className="text-xs text-muted-foreground">
        Last run {formatDistanceToNow(new Date(summary.lastRunAt), { addSuffix: true })}
        {summary.lastRunByName && ` by ${summary.lastRunByName}`}
      </div>

      {/* Expandable Details */}
      {showDetails && summary.failedChecks > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  View Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {resultsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              results
                .filter((r) => !r.passed)
                .map((result) => (
                  <ValidationResultItem
                    key={result.id}
                    result={result}
                    compact={compact}
                    onAcknowledge={() => handleAcknowledge(result)}
                  />
                ))
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Acknowledge Dialog */}
      <Dialog open={!!acknowledgeDialog} onOpenChange={(open) => !open && setAcknowledgeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Warning</DialogTitle>
          </DialogHeader>
          {acknowledgeDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{acknowledgeDialog.checkName}</p>
                    <p className="text-sm text-muted-foreground">{acknowledgeDialog.message}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  placeholder="Why is this warning being acknowledged?"
                  value={acknowledgeNote}
                  onChange={(e) => setAcknowledgeNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcknowledgeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAcknowledge} disabled={acknowledgeMutation.isPending}>
              {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ValidationResultItemProps {
  result: ValidationResult;
  compact?: boolean;
  onAcknowledge?: () => void;
}

function ValidationResultItem({ result, compact = false, onAcknowledge }: ValidationResultItemProps) {
  const config = SEVERITY_CONFIG[result.severity];
  const Icon = config.icon;
  const isAcknowledged = !!result.acknowledgedAt;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        config.bgColor,
        isAcknowledged && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{result.checkName}</span>
              {isAcknowledged && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  Acknowledged
                </Badge>
              )}
            </div>
            <p className={cn("text-sm text-muted-foreground", compact && "line-clamp-2")}>
              {result.message}
            </p>
            {isAcknowledged && result.acknowledgedNote && (
              <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3 mt-0.5" />
                <span>{result.acknowledgedNote}</span>
              </div>
            )}
            {isAcknowledged && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>
                  Acknowledged by {result.acknowledgedByName}{" "}
                  {formatDistanceToNow(new Date(result.acknowledgedAt!), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
        {!isAcknowledged && result.severity !== "error" && onAcknowledge && (
          <Button variant="ghost" size="sm" onClick={onAcknowledge}>
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
}

// Compact badge-style validation indicator
interface ValidationBadgeProps {
  entityType: string;
  entityId: string;
  className?: string;
}

export function ValidationBadge({ entityType, entityId, className }: ValidationBadgeProps) {
  const { data: summary, isLoading } = useQuery<ValidationSummary | null>({
    queryKey: [`/api/v6/validation/${entityType}/${entityId}/summary`],
    queryFn: async () => {
      const res = await fetch(`/api/v6/validation/${entityType}/${entityId}/summary`);
      if (!res.ok) throw new Error("Failed to fetch validation summary");
      const data = await res.json();
      return data.summary || null;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-5 w-16" />;
  }

  if (!summary) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        <Clock className="w-3 h-3 mr-1" />
        Not validated
      </Badge>
    );
  }

  if (summary.validationStatus === "valid") {
    return (
      <Badge variant="outline" className={cn("text-xs text-green-500 border-green-500/30", className)}>
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    );
  }

  const unacknowledgedIssues = summary.failedChecks - summary.acknowledgedCount;

  if (unacknowledgedIssues === 0) {
    return (
      <Badge variant="outline" className={cn("text-xs text-yellow-500 border-yellow-500/30", className)}>
        <CheckCircle2 className="w-3 h-3 mr-1" />
        All acknowledged
      </Badge>
    );
  }

  if (summary.errorCount > 0) {
    return (
      <Badge variant="outline" className={cn("text-xs text-red-500 border-red-500/30", className)}>
        <XCircle className="w-3 h-3 mr-1" />
        {summary.errorCount} error{summary.errorCount !== 1 ? "s" : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("text-xs text-yellow-500 border-yellow-500/30", className)}>
      <AlertTriangle className="w-3 h-3 mr-1" />
      {unacknowledgedIssues} warning{unacknowledgedIssues !== 1 ? "s" : ""}
    </Badge>
  );
}
