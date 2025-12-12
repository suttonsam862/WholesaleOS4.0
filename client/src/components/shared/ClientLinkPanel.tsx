import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Link2,
  Send,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface MissingField {
  field: string;
  label: string;
  required?: boolean;
}

interface ClientLinkPanelProps {
  entityType: "order" | "lead";
  entityId: number;
  entityCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  onPreview?: () => void;
  className?: string;
}

interface FormStatus {
  hasSubmission: boolean;
  submissionDate?: string;
  submissionId?: number;
  lastViewed?: string;
  viewCount?: number;
}

export function ClientLinkPanel({
  entityType,
  entityId,
  entityCode,
  contactEmail,
  contactPhone,
  contactName,
  onPreview,
  className,
}: ClientLinkPanelProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const portalPath = entityType === "order" 
    ? `/customer-portal/${entityId}` 
    : `/customer-order-form/${entityId}`;
  
  const portalLink = typeof window !== "undefined" 
    ? `${window.location.origin}${portalPath}` 
    : portalPath;

  const { data: formStatus, isLoading: statusLoading } = useQuery<FormStatus>({
    queryKey: ["/api/public/orders", entityId, "form-status"],
    queryFn: async () => {
      if (entityType !== "order") return { hasSubmission: false };
      const res = await fetch(`/api/public/orders/${entityId}/form-status`);
      if (!res.ok) return { hasSubmission: false };
      return res.json();
    },
    enabled: entityType === "order",
    retry: false,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Customer portal link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleEmailLink = () => {
    if (!contactEmail) {
      toast({
        title: "No email address",
        description: "Please add a contact email to send the link.",
        variant: "destructive",
      });
      return;
    }

    const subject = encodeURIComponent(
      `Your ${entityType === "order" ? "Order" : "Quote"} Portal: ${entityCode || `#${entityId}`}`
    );
    const body = encodeURIComponent(
      `Hi${contactName ? ` ${contactName}` : ""},\n\n` +
      `Please access your portal using the link below to view details and submit any required information:\n\n` +
      `${portalLink}\n\n` +
      `If you have any questions, please don't hesitate to reach out.\n\n` +
      `Best regards`
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    
    toast({
      title: "Opening email client",
      description: "Email draft with portal link is being prepared.",
    });
  };

  const handleSMSLink = () => {
    if (!contactPhone) {
      toast({
        title: "No phone number",
        description: "Please add a contact phone number to send SMS.",
        variant: "destructive",
      });
      return;
    }

    const message = encodeURIComponent(
      `Your portal link: ${portalLink}`
    );
    window.location.href = `sms:${contactPhone}?body=${message}`;
    
    toast({
      title: "Opening SMS app",
      description: "SMS with portal link is being prepared.",
    });
  };

  const missingFields: MissingField[] = [];
  if (!contactEmail && !contactPhone) {
    missingFields.push({ field: "contact", label: "Contact email or phone", required: true });
  }

  const hasResponse = formStatus?.hasSubmission;
  const linkStatus = hasResponse 
    ? "responded" 
    : formStatus?.viewCount && formStatus.viewCount > 0 
      ? "viewed" 
      : "pending";

  return (
    <Card className={cn("border-white/10 bg-white/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Customer Portal Link
          </CardTitle>
          {statusLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                linkStatus === "responded" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
                linkStatus === "viewed" && "border-amber-500/50 text-amber-400 bg-amber-500/10",
                linkStatus === "pending" && "border-muted-foreground/50 text-muted-foreground"
              )}
              data-testid="status-link"
            >
              {linkStatus === "responded" && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {linkStatus === "viewed" && <Eye className="w-3 h-3 mr-1" />}
              {linkStatus === "pending" && <Clock className="w-3 h-3 mr-1" />}
              {linkStatus === "responded" ? "Responded" : linkStatus === "viewed" ? "Viewed" : "Not Sent"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground truncate font-mono">
            {portalLink}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
          {onPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPreview}
                  className="shrink-0"
                  data-testid="button-preview-portal"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview portal</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex-1 gap-2"
                data-testid="button-send-link"
              >
                <Send className="w-4 h-4" />
                {hasResponse ? "Resend Link" : "Send Link"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={handleEmailLink}
                disabled={!contactEmail}
                className="gap-2"
                data-testid="option-send-email"
              >
                <Mail className="w-4 h-4" />
                Send via Email
                {!contactEmail && (
                  <AlertCircle className="w-3 h-3 text-muted-foreground ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSMSLink}
                disabled={!contactPhone}
                className="gap-2"
                data-testid="option-send-sms"
              >
                <MessageSquare className="w-4 h-4" />
                Send via SMS
                {!contactPhone && (
                  <AlertCircle className="w-3 h-3 text-muted-foreground ml-auto" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasResponse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/public/orders", entityId] })}
                  data-testid="button-refresh-status"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh status</TooltipContent>
            </Tooltip>
          )}
        </div>

        {formStatus?.hasSubmission && formStatus.submissionDate && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Customer responded {formatDistanceToNow(new Date(formStatus.submissionDate), { addSuffix: true })}
          </div>
        )}

        {missingFields.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">Missing Information</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {missingFields.map((field) => (
                    <li key={field.field}>
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
