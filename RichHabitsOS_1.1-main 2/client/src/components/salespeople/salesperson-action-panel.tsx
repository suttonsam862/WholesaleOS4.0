import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Clock,
  Target,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Send
} from "lucide-react";

interface SalespersonActionPanelProps {
  entityType: "lead" | "order" | "quote";
  entityId: number;
  currentSalespersonId?: string;
  onActionComplete?: () => void;
}

interface ActionLog {
  id: number;
  action: string;
  notes: string;
  createdAt: string;
  userName: string;
}

export function SalespersonActionPanel({ 
  entityType, 
  entityId, 
  currentSalespersonId,
  onActionComplete 
}: SalespersonActionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [actionType, setActionType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [nextStage, setNextStage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Available actions based on entity type
  const getAvailableActions = () => {
    switch (entityType) {
      case "lead":
        return [
          { id: "contact_client", label: "Contact Client", icon: Phone },
          { id: "send_proposal", label: "Send Proposal", icon: FileText },
          { id: "schedule_meeting", label: "Schedule Meeting", icon: Calendar },
          { id: "advance_stage", label: "Advance to Next Stage", icon: ArrowRight },
          { id: "add_notes", label: "Add Notes", icon: MessageSquare },
          { id: "request_info", label: "Request Information", icon: AlertCircle },
          { id: "set_follow_up", label: "Set Follow-up", icon: Clock },
        ];
      case "order":
        return [
          { id: "update_status", label: "Update Order Status", icon: CheckCircle },
          { id: "contact_client", label: "Contact Client", icon: Phone },
          { id: "send_update", label: "Send Status Update", icon: Mail },
          { id: "add_notes", label: "Add Order Notes", icon: MessageSquare },
          { id: "expedite_order", label: "Expedite Order", icon: Target },
          { id: "schedule_delivery", label: "Schedule Delivery", icon: Calendar },
        ];
      case "quote":
        return [
          { id: "send_quote", label: "Send Quote", icon: Send },
          { id: "follow_up", label: "Follow Up", icon: Phone },
          { id: "revise_quote", label: "Revise Quote", icon: FileText },
          { id: "convert_order", label: "Convert to Order", icon: DollarSign },
          { id: "add_notes", label: "Add Notes", icon: MessageSquare },
          { id: "schedule_presentation", label: "Schedule Presentation", icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  // Record action mutation
  const recordActionMutation = useMutation({
    mutationFn: async (actionData: any) => {
      return apiRequest("POST", `/api/salespeople/actions`, {
        entityType,
        entityId,
        action: actionType,
        notes,
        followUpDate: followUpDate || null,
        nextStage: nextStage || null,
        ...actionData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s`, entityId] });
      toast({
        title: "Success",
        description: "Action recorded successfully",
      });
      setActionType("");
      setNotes("");
      setFollowUpDate("");
      setNextStage("");
      onActionComplete?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record action",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAction = async () => {
    if (!actionType) {
      toast({
        title: "Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Please add notes for this action",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await recordActionMutation.mutateAsync({});
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAction = availableActions.find(a => a.id === actionType);

  return (
    <Card data-testid="card-salesperson-actions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Salesperson Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Action Type</label>
          <Select value={actionType} onValueChange={setActionType} data-testid="select-action-type">
            <SelectTrigger>
              <SelectValue placeholder="Select an action..." />
            </SelectTrigger>
            <SelectContent>
              {availableActions.map((action) => (
                <SelectItem key={action.id} value={action.id}>
                  <div className="flex items-center gap-2">
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action-specific fields */}
        {actionType === "advance_stage" && entityType === "lead" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Next Stage</label>
            <Select value={nextStage} onValueChange={setNextStage} data-testid="select-next-stage">
              <SelectTrigger>
                <SelectValue placeholder="Select next stage..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="won">Won</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(actionType === "set_follow_up" || actionType === "schedule_meeting" || actionType === "schedule_delivery") && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {actionType === "schedule_meeting" ? "Meeting Date" : 
               actionType === "schedule_delivery" ? "Delivery Date" : "Follow-up Date"}
            </label>
            <Input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              data-testid="input-follow-up-date"
            />
          </div>
        )}

        {actionType === "update_status" && entityType === "order" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={nextStage} onValueChange={setNextStage} data-testid="select-order-status">
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiting_sizes">Waiting for Sizes</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="production">In Production</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes - always required */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder={`Add notes about this ${selectedAction?.label || "action"}...`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            data-testid="textarea-action-notes"
          />
        </div>

        {/* Action Description */}
        {selectedAction && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <selectedAction.icon className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{selectedAction.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {getActionDescription(actionType, entityType)}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmitAction} 
          disabled={isLoading || !actionType || !notes.trim()}
          className="w-full"
          data-testid="button-record-action"
        >
          {isLoading ? "Recording..." : `Record ${selectedAction?.label || "Action"}`}
        </Button>

        {/* Quick Action Badges */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                setActionType("contact_client");
                setNotes("Client contacted via phone");
              }}
              data-testid="badge-quick-contact"
            >
              <Phone className="w-3 h-3 mr-1" />
              Quick Contact
            </Badge>
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                setActionType("add_notes");
                setNotes("Follow-up required");
              }}
              data-testid="badge-quick-note"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Quick Note
            </Badge>
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                setActionType("set_follow_up");
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFollowUpDate(tomorrow.toISOString().slice(0, 16));
                setNotes("Scheduled follow-up for tomorrow");
              }}
              data-testid="badge-quick-followup"
            >
              <Clock className="w-3 h-3 mr-1" />
              Follow-up Tomorrow
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getActionDescription(actionType: string, entityType: string): string {
  const descriptions: Record<string, string> = {
    "contact_client": "Record a phone call, email, or meeting with the client",
    "send_proposal": "Track when a proposal or quote is sent to the client",
    "schedule_meeting": "Set up a meeting and add it to your calendar",
    "advance_stage": "Move the lead to the next stage in your sales pipeline",
    "add_notes": "Add important notes or observations about the client",
    "request_info": "Record when additional information is requested from the client",
    "set_follow_up": "Schedule a reminder for future follow-up",
    "update_status": "Change the current status of the order",
    "send_update": "Send a status update email to the client",
    "expedite_order": "Mark order as priority and notify production team",
    "schedule_delivery": "Set delivery date and coordinate logistics",
    "send_quote": "Send the quote to the client via email",
    "follow_up": "Follow up on a previously sent quote",
    "revise_quote": "Make changes to the quote based on client feedback",
    "convert_order": "Convert an accepted quote into an order",
    "schedule_presentation": "Set up a presentation or demonstration meeting",
  };

  return descriptions[actionType] || "Record this action in the system";
}