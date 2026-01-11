import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GlassCard, GlassInput, GlassTextarea, GlassButton } from "@/components/ui/glass";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DesignAttachmentManager } from "@/components/DesignAttachmentManager";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Palette, Building2, FileText, Users, Calendar, AlertTriangle, 
  ArrowRight, ArrowLeft, Check, Loader2, Zap, Clock, Flag,
  MessageSquare, StickyNote, Image
} from "lucide-react";

const editDesignJobSchema = z.object({
  orgId: z.number().min(1, "Organization is required"),
  leadId: z.number().optional(),
  orderId: z.number().optional(),
  salespersonId: z.string().optional(),
  brief: z.string().optional(),
  requirements: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "rush"]).optional(),
  status: z.enum(["pending", "assigned", "in_progress", "review", "approved", "rejected", "completed"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  deadline: z.string().optional(),
  internalNotes: z.string().optional(),
  clientFeedback: z.string().optional(),
});

type EditDesignJobForm = z.infer<typeof editDesignJobSchema>;

const URGENCY_OPTIONS = [
  { value: "low", label: "Low", icon: Clock, color: "text-muted-foreground" },
  { value: "normal", label: "Normal", icon: Clock, color: "text-neon-blue" },
  { value: "high", label: "High", icon: AlertTriangle, color: "text-neon-yellow" },
  { value: "rush", label: "Rush", icon: Zap, color: "text-neon-pink" },
] as const;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-gray-500" },
  { value: "assigned", label: "Assigned", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-neon-blue" },
  { value: "review", label: "Review", color: "bg-neon-purple" },
  { value: "approved", label: "Approved", color: "bg-neon-green" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "completed", label: "Completed", color: "bg-neon-green" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-muted-foreground" },
  { value: "normal", label: "Normal", color: "bg-neon-blue" },
  { value: "high", label: "High", color: "bg-neon-pink" },
] as const;

interface EditDesignJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  designJobId: number | null;
}

export function EditDesignJobModal({ isOpen, onClose, designJobId }: EditDesignJobModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [designReferenceUrls, setDesignReferenceUrls] = useState<string[]>([]);
  const [additionalFileUrls, setAdditionalFileUrls] = useState<string[]>([]);
  const [designStyleUrl, setDesignStyleUrl] = useState<string>("");
  const [finalDesignUrls, setFinalDesignUrls] = useState<string[]>([]);

  const { data: designJob, isLoading: designJobLoading } = useQuery({
    queryKey: ["/api/design-jobs", designJobId],
    enabled: isOpen && !!designJobId,
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: isOpen,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isOpen,
  });

  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/users/for-assignment"],
    enabled: isOpen,
  });

  const form = useForm<EditDesignJobForm>({
    resolver: zodResolver(editDesignJobSchema),
    defaultValues: {
      orgId: undefined,
      brief: "",
      requirements: "",
      urgency: "normal",
      status: "pending",
      priority: "normal",
      deadline: "",
      internalNotes: "",
      clientFeedback: "",
    },
  });

  useEffect(() => {
    if (designJob && typeof designJob === 'object' && 'orgId' in designJob) {
      const job = designJob as any;
      form.reset({
        orgId: job.orgId,
        leadId: job.leadId || undefined,
        orderId: job.orderId || undefined,
        salespersonId: job.salespersonId || undefined,
        brief: job.brief || "",
        requirements: job.requirements || "",
        urgency: job.urgency || "normal",
        status: job.status || "pending",
        priority: job.priority || "normal",
        deadline: job.deadline || "",
        internalNotes: job.internalNotes || "",
        clientFeedback: job.clientFeedback || "",
      });
      
      setLogoUrls(job.logoUrls || []);
      setDesignReferenceUrls(job.designReferenceUrls || []);
      setAdditionalFileUrls(job.additionalFileUrls || []);
      setDesignStyleUrl(job.designStyleUrl || "");
      setFinalDesignUrls(job.finalDesignUrls || []);
    }
  }, [designJob, form]);

  const updateDesignJobMutation = useMutation({
    mutationFn: (data: EditDesignJobForm) => {
      const cleanedData: any = {
        ...data,
        logoUrls: logoUrls,
        designReferenceUrls: designReferenceUrls,
        additionalFileUrls: additionalFileUrls,
        designStyleUrl: designStyleUrl || undefined,
        finalDesignUrls: finalDesignUrls,
        leadId: data.leadId || undefined,
        orderId: data.orderId || undefined,
        salespersonId: data.salespersonId || undefined,
        deadline: data.deadline || undefined,
      };
      
      return apiRequest(`/api/design-jobs/${designJobId}`, {
        method: 'PUT',
        body: cleanedData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Design job updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs", designJobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update design job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = () => {
    const data = form.getValues();
    updateDesignJobMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    setLogoUrls([]);
    setDesignReferenceUrls([]);
    setAdditionalFileUrls([]);
    setDesignStyleUrl("");
    setFinalDesignUrls([]);
    onClose();
  };

  if (designJobLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none">
          <GlassCard className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
              <p className="text-muted-foreground">Loading design job...</p>
            </div>
          </GlassCard>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedOrg = Array.isArray(organizations) 
    ? organizations.find((o: any) => o.id === form.watch("orgId"))
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none"
        data-testid="modal-edit-design-job"
      >
        <GlassCard className="p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neon-pink/20 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-neon-pink" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {step === 1 && "Basic Info"}
                    {step === 2 && "Details & Status"}
                    {step === 3 && "Attachments"}
                    {step === 4 && "Review & Update"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Step {step} of 4</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-muted-foreground hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <motion.div
                  key={s}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    s === step
                      ? "bg-neon-pink shadow-[0_0_10px_#ff00ff]"
                      : s < step
                      ? "bg-neon-pink/50"
                      : "bg-white/10"
                  )}
                  initial={false}
                  animate={{ scaleY: s === step ? 1.5 : 1 }}
                />
              ))}
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Organization Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Organization *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                      {Array.isArray(organizations) && organizations.map((org: any) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => form.setValue("orgId", org.id)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            form.watch("orgId") === org.id
                              ? "bg-neon-pink/20 border-neon-pink/50 text-white"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                          )}
                        >
                          <Building2 className="w-4 h-4 mb-1" />
                          <span className="text-sm font-medium line-clamp-1">{org.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Related Lead (Optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Related Lead (Optional)</label>
                    <select
                      value={form.watch("leadId") || ""}
                      onChange={(e) => form.setValue("leadId", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-pink/50 outline-none"
                    >
                      <option value="">No lead</option>
                      {Array.isArray(leads) && leads.map((lead: any) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.organization?.name || 'Unknown'} - {lead.leadCode || `#${lead.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Order (Optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Related Order (Optional)</label>
                    <select
                      value={form.watch("orderId") || ""}
                      onChange={(e) => form.setValue("orderId", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-pink/50 outline-none"
                    >
                      <option value="">No order</option>
                      {Array.isArray(orders) && orders.map((order: any) => (
                        <option key={order.id} value={order.id}>
                          {order.orderName || order.orderCode || `Order #${order.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salesperson Assignment */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Assign Salesperson</label>
                    <select
                      value={form.watch("salespersonId") || ""}
                      onChange={(e) => form.setValue("salespersonId", e.target.value || undefined)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-pink/50 outline-none"
                    >
                      <option value="">No salesperson</option>
                      {Array.isArray(salespeople) && salespeople
                        .filter((u: any) => u.role === 'sales')
                        .map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details & Status */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <GlassTextarea
                    icon={<FileText className="w-4 h-4" />}
                    label="Brief"
                    placeholder="Describe the design project..."
                    value={form.watch("brief") || ""}
                    onChange={(e) => form.setValue("brief", e.target.value)}
                    data-testid="input-brief"
                  />

                  <GlassTextarea
                    label="Requirements"
                    placeholder="Specific requirements and constraints..."
                    value={form.watch("requirements") || ""}
                    onChange={(e) => form.setValue("requirements", e.target.value)}
                    data-testid="input-requirements"
                  />

                  {/* Urgency Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Urgency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {URGENCY_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => form.setValue("urgency", option.value as any)}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col items-center gap-1 transition-all",
                              form.watch("urgency") === option.value
                                ? "bg-neon-pink/20 border-neon-pink/50"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                          >
                            <Icon className={cn("w-5 h-5", option.color)} />
                            <span className="text-xs text-white">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Status</label>
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => form.setValue("status", option.value as any)}
                          className={cn(
                            "p-2 rounded-xl border flex items-center gap-2 transition-all",
                            form.watch("status") === option.value
                              ? "bg-neon-pink/20 border-neon-pink/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", option.color)} />
                          <span className="text-xs text-white truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRIORITY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => form.setValue("priority", option.value as any)}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                            form.watch("priority") === option.value
                              ? "bg-neon-pink/20 border-neon-pink/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <Flag className={cn("w-4 h-4", option.color)} />
                          <span className="text-sm text-white">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <GlassInput
                    icon={<Calendar className="w-4 h-4" />}
                    label="Deadline"
                    type="date"
                    value={form.watch("deadline") || ""}
                    onChange={(e) => form.setValue("deadline", e.target.value)}
                    data-testid="input-deadline"
                  />
                </motion.div>
              )}

              {/* Step 3: Attachments */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Image className="w-5 h-5 text-neon-pink" />
                    <h3 className="text-lg font-medium text-white">Design Attachments</h3>
                  </div>

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

                  <div className="pt-4 space-y-4">
                    <GlassTextarea
                      icon={<StickyNote className="w-4 h-4" />}
                      label="Internal Notes"
                      placeholder="Internal notes for the team..."
                      value={form.watch("internalNotes") || ""}
                      onChange={(e) => form.setValue("internalNotes", e.target.value)}
                      data-testid="input-internal-notes"
                    />

                    <GlassTextarea
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="Client Feedback"
                      placeholder="Add client feedback or comments..."
                      value={form.watch("clientFeedback") || ""}
                      onChange={(e) => form.setValue("clientFeedback", e.target.value)}
                      data-testid="input-client-feedback"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-neon-green" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Ready to Update</h3>
                    <p className="text-muted-foreground">Review the changes below</p>
                  </div>

                  <GlassCard variant="neon" className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Organization</span>
                        <span className="text-white font-medium">{selectedOrg?.name || "Not selected"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-white capitalize">{form.watch("status")?.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Urgency</span>
                        <span className="text-white capitalize">{form.watch("urgency")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Priority</span>
                        <span className="text-white capitalize">{form.watch("priority")}</span>
                      </div>
                      {form.watch("deadline") && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Deadline</span>
                          <span className="text-white">{form.watch("deadline")}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Attachments</span>
                        <span className="text-white">
                          {logoUrls.length + designReferenceUrls.length + additionalFileUrls.length + finalDesignUrls.length} files
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {form.watch("brief") && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Brief</h4>
                      <p className="text-white text-sm bg-white/5 p-3 rounded-lg line-clamp-3">
                        {form.watch("brief")}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex justify-between">
            {step > 1 ? (
              <GlassButton variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </GlassButton>
            ) : (
              <GlassButton variant="ghost" onClick={handleClose}>
                Cancel
              </GlassButton>
            )}
            
            {step < 4 ? (
              <GlassButton onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlassButton>
            ) : (
              <GlassButton
                onClick={onSubmit}
                disabled={updateDesignJobMutation.isPending}
                data-testid="button-update-design-job"
              >
                {updateDesignJobMutation.isPending ? "Updating..." : "Update Design Job"}
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
