import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertTriangle,
  FileEdit,
  AlertCircle,
  CheckCircle,
  Package,
  Calendar,
  DollarSign,
  Truck,
  Palette,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type RequestType = "issue" | "change";

interface IssueCategory {
  value: string;
  label: string;
  icon: typeof AlertTriangle;
  description: string;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    value: "quality",
    label: "Quality Issue",
    icon: AlertTriangle,
    description: "Product defect, wrong color, damaged items",
  },
  {
    value: "shipping",
    label: "Shipping Problem",
    icon: Truck,
    description: "Delayed, lost, or incorrect delivery",
  },
  {
    value: "quantity",
    label: "Quantity Discrepancy",
    icon: Package,
    description: "Missing items or wrong quantities",
  },
  {
    value: "billing",
    label: "Billing Issue",
    icon: DollarSign,
    description: "Invoice errors or payment problems",
  },
  {
    value: "other",
    label: "Other Issue",
    icon: HelpCircle,
    description: "Any other type of issue",
  },
];

const CHANGE_CATEGORIES: IssueCategory[] = [
  {
    value: "sizes",
    label: "Size Changes",
    icon: Package,
    description: "Modify size quantities for line items",
  },
  {
    value: "design",
    label: "Design Changes",
    icon: Palette,
    description: "Artwork, color, or design modifications",
  },
  {
    value: "delivery",
    label: "Delivery Changes",
    icon: Calendar,
    description: "Change delivery date or address",
  },
  {
    value: "cancel",
    label: "Cancel Items",
    icon: AlertCircle,
    description: "Remove line items from order",
  },
  {
    value: "add",
    label: "Add Items",
    icon: Package,
    description: "Add new line items to order",
  },
  {
    value: "other",
    label: "Other Change",
    icon: HelpCircle,
    description: "Any other type of change request",
  },
];

type Priority = "low" | "normal" | "high" | "urgent";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

interface IssueRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestType: RequestType;
  entityType: "order" | "lead" | "manufacturing";
  entityId: number;
  entityCode?: string;
  onSuccess?: () => void;
}

export function IssueRequestModal({
  isOpen,
  onClose,
  requestType,
  entityType,
  entityId,
  entityCode,
  onSuccess,
}: IssueRequestModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const categories = requestType === "issue" ? ISSUE_CATEGORIES : CHANGE_CATEGORIES;
  const title = requestType === "issue" ? "Report an Issue" : "Request a Change";
  const TitleIcon = requestType === "issue" ? AlertTriangle : FileEdit;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const data = {
        type: requestType,
        category,
        priority,
        subject,
        description,
        entityType,
        entityId,
        entityCode,
        submittedBy: user?.id,
        submittedByName: user?.name,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      
      const response = await apiRequest("/api/requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: requestType === "issue" ? "Issue Reported" : "Change Requested",
        description: "Your request has been submitted to the operations team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setCategory("");
    setPriority("normal");
    setSubject("");
    setDescription("");
    onClose();
  };

  const handleSubmit = () => {
    if (!category) {
      toast({
        title: "Category Required",
        description: "Please select a category for your request.",
        variant: "destructive",
      });
      return;
    }
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your request.",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your request in detail.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const selectedCategory = categories.find((c) => c.value === category);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg" data-testid="modal-issue-request">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              requestType === "issue" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
            )}>
              <TitleIcon className="w-4 h-4" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-muted-foreground">
              {entityType === "order" ? "Order" : entityType === "lead" ? "Lead" : "Manufacturing"}:
            </span>
            <Badge variant="outline">{entityCode || `#${entityId}`}</Badge>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                    data-testid={`category-${cat.value}`}
                  >
                    <Icon className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-white" : "text-muted-foreground"
                      )}>
                        {cat.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCategory.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    priority === p.value
                      ? "border-primary bg-primary/10 text-white"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                  data-testid={`priority-${p.value}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={requestType === "issue" ? "Brief description of the issue" : "What needs to be changed?"}
              data-testid="input-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={requestType === "issue" 
                ? "Provide detailed information about the issue, including any relevant order numbers, line items, or customer communications..."
                : "Describe the change you're requesting and the reason for it..."
              }
              className="min-h-[120px] resize-none"
              data-testid="input-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className={cn(
              requestType === "issue" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
            )}
            data-testid="button-submit"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface IssueRequestTriggerProps {
  entityType: "order" | "lead" | "manufacturing";
  entityId: number;
  entityCode?: string;
  variant?: "buttons" | "dropdown";
  className?: string;
}

export function IssueRequestTrigger({
  entityType,
  entityId,
  entityCode,
  variant = "buttons",
  className,
}: IssueRequestTriggerProps) {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIssueModal(true)}
          className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
          data-testid="button-report-issue"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Report Issue
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChangeModal(true)}
          className="gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-blue-500/30"
          data-testid="button-request-change"
        >
          <FileEdit className="w-3.5 h-3.5" />
          Request Change
        </Button>
      </div>

      <IssueRequestModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        requestType="issue"
        entityType={entityType}
        entityId={entityId}
        entityCode={entityCode}
      />

      <IssueRequestModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        requestType="change"
        entityType={entityType}
        entityId={entityId}
        entityCode={entityCode}
      />
    </>
  );
}
