import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for editing lead
const editLeadSchema = z.object({
  orgId: z.number().min(1, "Organization is required"),
  contactId: z.number().optional(),
  ownerUserId: z.string().optional(), // Salesperson assignment
  stage: z.enum(["future_lead", "lead", "hot_lead", "mock_up", "mock_up_sent", "team_store_or_direct_order", "current_clients", "no_answer_delete"]),
  source: z.string().min(1, "Source is required"),
  notes: z.string().optional(),
  score: z.number().min(0).max(100),
});

type EditLeadForm = z.infer<typeof editLeadSchema>;

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number | null;
}

export function EditLeadModal({ isOpen, onClose, leadId }: EditLeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lead data for editing
  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["/api/leads", leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isOpen && !!leadId,
  });

  // Fetch organizations for the dropdown
  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    enabled: isOpen,
  });

  // Fetch contacts for the dropdown
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: isOpen,
  });

  // Fetch salespeople for owner assignment
  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/users/for-assignment"],
    enabled: isOpen,
  });

  const form = useForm<EditLeadForm>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      orgId: undefined,
      contactId: undefined,
      ownerUserId: undefined,
      stage: "future_lead",
      source: "",
      notes: "",
      score: 50,
    },
  });

  // Update form when lead data loads
  useEffect(() => {
    if (lead && typeof lead === 'object' && 'orgId' in lead) {
      const leadData = lead as any; // Type assertion for now
      form.reset({
        orgId: leadData.orgId,
        contactId: leadData.contactId || undefined,
        ownerUserId: leadData.ownerUserId || undefined,
        stage: leadData.stage || "future_lead",
        source: leadData.source || "",
        notes: leadData.notes || "",
        score: leadData.score || 50,
      });
    }
  }, [lead, form]);

  const updateLeadMutation = useMutation({
    mutationFn: (data: EditLeadForm) => 
      apiRequest("PUT", `/api/leads/${leadId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditLeadForm) => {
    updateLeadMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (leadLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" data-testid="modal-edit-lead">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Loading lead data...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-edit-lead">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead details and manage its progress.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orgId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization *</FormLabel>
                  <SearchableSelect
                    options={organizations?.map((org: any) => ({
                      value: org.id.toString(),
                      label: org.name
                    })) || []}
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder="Select organization"
                    searchPlaceholder="Search organizations..."
                    testId="select-organization-edit"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No contact" },
                      ...(contacts?.map((contact: any) => ({
                        value: contact.id.toString(),
                        label: contact.name
                      })) || [])
                    ]}
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(value === "" ? undefined : parseInt(value))}
                    placeholder="Select contact (optional)"
                    searchPlaceholder="Search contacts..."
                    testId="select-contact-edit"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Salesperson</FormLabel>
                  <SearchableSelect
                    options={[
                      { value: "", label: "Unassigned" },
                      ...(salespeople?.filter((user: any) => user.role === 'sales' || user.role === 'admin').map((user: any) => ({
                        value: user.id,
                        label: user.name
                      })) || [])
                    ]}
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                    placeholder="Assign to salesperson (optional)"
                    searchPlaceholder="Search salespeople..."
                    testId="select-owner-edit"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stage-edit">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="future_lead">Future Lead</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="hot_lead">Hot Lead</SelectItem>
                      <SelectItem value="mock_up">Mock Up</SelectItem>
                      <SelectItem value="mock_up_sent">Mock Up Sent/Revisions</SelectItem>
                      <SelectItem value="team_store_or_direct_order">Team Store / Direct Order</SelectItem>
                      <SelectItem value="current_clients">Current Clients</SelectItem>
                      <SelectItem value="no_answer_delete">No Answer/Archive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., website, referral, trade show"
                      data-testid="input-source-edit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score (0-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-score-edit"
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
                      placeholder="Additional notes about this lead..."
                      rows={3}
                      data-testid="textarea-notes-edit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateLeadMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateLeadMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}