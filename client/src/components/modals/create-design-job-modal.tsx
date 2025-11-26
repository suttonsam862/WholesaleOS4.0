import { useState } from "react";
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
import { DesignAttachmentManager } from "@/components/DesignAttachmentManager";
// Custom schema matching the working contact modal pattern
const createDesignJobSchema = z.object({
  orgId: z.number().min(1, "Organization is required"),
  leadId: z.number().optional(),
  orderId: z.number().optional(),
  salespersonId: z.string().optional(),
  brief: z.string().optional(),
  requirements: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "rush"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  deadline: z.string().optional(),
  internalNotes: z.string().optional(),
});

type CreateDesignJobForm = z.infer<typeof createDesignJobSchema>;

interface CreateDesignJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDesignJobModal({ isOpen, onClose }: CreateDesignJobModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for file uploads
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [designReferenceUrls, setDesignReferenceUrls] = useState<string[]>([]);
  const [additionalFileUrls, setAdditionalFileUrls] = useState<string[]>([]);
  const [designStyleUrl, setDesignStyleUrl] = useState<string>("");
  const [finalDesignUrls, setFinalDesignUrls] = useState<string[]>([]);

  // Fetch organizations for the dropdown (only when modal is open)
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: isOpen,
  });

  // Fetch leads for the dropdown (only when modal is open)
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    enabled: isOpen,
  });

  // Fetch orders for the dropdown (only when modal is open)
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isOpen,
  });

  // Fetch salespeople for assignment
  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/users/for-assignment"],
    enabled: isOpen,
  });

  const form = useForm<CreateDesignJobForm>({
    resolver: zodResolver(createDesignJobSchema),
    defaultValues: {
      orgId: undefined,
      brief: "",
      requirements: "",
      urgency: "normal",
      priority: "normal",
      deadline: "",
      internalNotes: "",
    },
  });

  const createDesignJobMutation = useMutation({
    mutationFn: (data: CreateDesignJobForm) => {
      const submitData = {
        ...data,
        logoUrls: logoUrls.length > 0 ? logoUrls : undefined,
        designReferenceUrls: designReferenceUrls.length > 0 ? designReferenceUrls : undefined,
        additionalFileUrls: additionalFileUrls.length > 0 ? additionalFileUrls : undefined,
        designStyleUrl: designStyleUrl || undefined,
        finalDesignUrls: finalDesignUrls.length > 0 ? finalDesignUrls : undefined,
      };
      return apiRequest("/api/design-jobs", { method: "POST", body: submitData });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Design job created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      setLogoUrls([]);
      setDesignReferenceUrls([]);
      setAdditionalFileUrls([]);
      setDesignStyleUrl("");
      setFinalDesignUrls([]);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create design job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateDesignJobForm) => {
    createDesignJobMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-design-job">
        <DialogHeader>
          <DialogTitle>Create New Design Job</DialogTitle>
          <DialogDescription>
            Create a new design job and assign it to your team.
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
                    options={Array.isArray(organizations) ? organizations.map((org: any) => ({
                      value: org.id.toString(),
                      label: org.name
                    })) : []}
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder="Select organization"
                    searchPlaceholder="Search organizations..."
                    testId="select-organization"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Lead (Optional)</FormLabel>
                    <SearchableSelect
                      options={[
                        { value: "", label: "No lead" },
                        ...(Array.isArray(leads) ? leads.map((lead: any) => ({
                          value: lead.id.toString(),
                          label: `${lead.organization?.name || 'Unknown Org'} - ${lead.contact?.name || 'No Contact'} (${lead.leadCode || `#${lead.id}`})`
                        })) : [])
                      ]}
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value === "" ? undefined : parseInt(value))}
                      placeholder="Select lead (optional)"
                      searchPlaceholder="Search leads..."
                      testId="select-lead"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Order (Optional)</FormLabel>
                    <SearchableSelect
                      options={[
                        { value: "", label: "No order" },
                        ...(Array.isArray(orders) ? orders.map((order: any) => ({
                          value: order.id.toString(),
                          label: order.orderName
                        })) : [])
                      ]}
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value === "" ? undefined : parseInt(value))}
                      placeholder="Select order (optional)"
                      searchPlaceholder="Search orders..."
                      testId="select-order"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salespersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Salesperson (Optional)</FormLabel>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No salesperson" },
                      ...(Array.isArray(salespeople) ? salespeople
                        .filter((user: any) => user.role === 'sales')
                        .map((user: any) => ({
                          value: user.id,
                          label: `${user.name} (${user.email})`
                        })) : [])
                    ]}
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                    placeholder="Select salesperson (optional)"
                    searchPlaceholder="Search salespeople..."
                    testId="select-salesperson"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Design Brief</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe what needs to be designed..."
                      className="min-h-[100px]"
                      data-testid="textarea-brief"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Specific requirements, dimensions, colors, etc..."
                      className="min-h-[80px]"
                      data-testid="textarea-requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="rush">Rush</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        data-testid="input-deadline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="internalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Internal notes for the design team..."
                      className="min-h-[60px]"
                      data-testid="textarea-internal-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-base font-medium mb-4">Design Attachments</h3>
              <DesignAttachmentManager
                logoUrls={logoUrls}
                designReferenceUrls={designReferenceUrls}
                additionalFileUrls={additionalFileUrls}
                designStyleUrl={designStyleUrl}
                finalDesignUrls={finalDesignUrls}
                onUpdate={(updates) => {
                  if (updates.logoUrls !== undefined) setLogoUrls(updates.logoUrls);
                  if (updates.designReferenceUrls !== undefined) setDesignReferenceUrls(updates.designReferenceUrls);
                  if (updates.additionalFileUrls !== undefined) setAdditionalFileUrls(updates.additionalFileUrls);
                  if (updates.designStyleUrl !== undefined) setDesignStyleUrl(updates.designStyleUrl || "");
                  if (updates.finalDesignUrls !== undefined) setFinalDesignUrls(updates.finalDesignUrls);
                }}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDesignJobMutation.isPending}
                data-testid="button-create"
              >
                {createDesignJobMutation.isPending ? "Creating..." : "Create Design Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}