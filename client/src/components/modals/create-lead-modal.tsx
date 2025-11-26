import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GlassInput, GlassTextarea, GlassButton, GlassCard } from "@/components/ui/glass";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  User, 
  Users, 
  Megaphone, 
  BarChart3, 
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  Flame,
  Zap,
  Clock,
  Mail,
  Store,
  UserCheck,
  XCircle
} from "lucide-react";

const createLeadSchema = z.object({
  orgId: z.number().min(1, "Organization is required"),
  contactId: z.number().optional(),
  ownerUserId: z.string().optional(),
  stage: z.enum(["future_lead", "lead", "hot_lead", "mock_up", "mock_up_sent", "team_store_or_direct_order", "current_clients", "no_answer_delete"]),
  source: z.string().min(1, "Source is required"),
  notes: z.string().optional(),
  score: z.number().min(0).max(100).default(50),
});

type CreateLeadForm = z.infer<typeof createLeadSchema>;

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGES = [
  { value: "future_lead", label: "Future Lead", icon: Clock, color: "text-gray-400", bgColor: "bg-gray-500/10" },
  { value: "lead", label: "Lead", icon: Target, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { value: "hot_lead", label: "Hot Lead", icon: Flame, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { value: "mock_up", label: "Mock Up", icon: FileText, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { value: "mock_up_sent", label: "Mock Up Sent", icon: Mail, color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  { value: "team_store_or_direct_order", label: "Team Store / Order", icon: Store, color: "text-green-400", bgColor: "bg-green-500/10" },
  { value: "current_clients", label: "Current Client", icon: UserCheck, color: "text-neon-blue", bgColor: "bg-neon-blue/10" },
  { value: "no_answer_delete", label: "No Answer/Archive", icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10" },
];

const SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "trade_show", label: "Trade Show" },
  { value: "cold_call", label: "Cold Call" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "other", label: "Other" },
];

export function CreateLeadModal({ isOpen, onClose }: CreateLeadModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateLeadForm>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      stage: "future_lead",
      source: "website",
      notes: "",
      score: 50,
    },
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/users/for-assignment"],
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: CreateLeadForm) => 
      apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      setStep(1);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateLeadForm) => {
    createLeadMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onClose();
  };

  const nextStep = () => {
    if (step === 1 && !form.getValues("orgId")) {
      form.setError("orgId", { message: "Please select an organization" });
      return;
    }
    if (step === 2 && !form.getValues("source")) {
      form.setError("source", { message: "Please select a source" });
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const selectedStage = STAGES.find(s => s.value === form.watch("stage"));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-black/90 backdrop-blur-xl border-white/10 p-0 overflow-hidden" data-testid="modal-create-lead">
        {/* Header with Progress */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Lead</h2>
                <p className="text-sm text-muted-foreground">
                  Step {step} of 3 — {step === 1 ? "Select Organization" : step === 2 ? "Lead Details" : "Review & Create"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  s === step
                    ? "bg-neon-blue scale-y-125 shadow-[0_0_10px_#00f3ff]"
                    : s < step
                    ? "bg-neon-blue/50"
                    : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Organization & Contact */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="orgId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-neon-blue" />
                            Organization
                          </FormLabel>
                          <SearchableSelect
                            options={organizations?.map((org: any) => ({
                              value: org.id.toString(),
                              label: org.name
                            })) || []}
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

                    <FormField
                      control={form.control}
                      name="contactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-neon-purple" />
                            Contact (Optional)
                          </FormLabel>
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
                            testId="select-contact"
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
                          <FormLabel className="text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-neon-green" />
                            Assigned Salesperson
                          </FormLabel>
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
                            testId="select-owner-create"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 2: Lead Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-neon-blue" />
                            Lead Source
                          </FormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SOURCES.map((source) => (
                              <button
                                key={source.value}
                                type="button"
                                onClick={() => field.onChange(source.value)}
                                className={cn(
                                  "p-3 rounded-xl border transition-all text-sm font-medium",
                                  field.value === source.value
                                    ? "bg-neon-blue/20 border-neon-blue/50 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {source.label}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neon-purple" />
                            Lead Stage
                          </FormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {STAGES.map((stage) => {
                              const Icon = stage.icon;
                              return (
                                <button
                                  key={stage.value}
                                  type="button"
                                  onClick={() => field.onChange(stage.value)}
                                  className={cn(
                                    "p-3 rounded-xl border transition-all flex flex-col items-center gap-2",
                                    field.value === stage.value
                                      ? `${stage.bgColor} border-current ${stage.color} shadow-lg`
                                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                  )}
                                >
                                  <Icon className="w-5 h-5" />
                                  <span className="text-xs font-medium text-center">{stage.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-neon-yellow" />
                              Lead Score
                            </span>
                            <span className="text-2xl font-bold text-neon-blue">{field.value}</span>
                          </FormLabel>
                          <div className="relative pt-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-blue"
                              data-testid="input-lead-score"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Cold</span>
                              <span>Warm</span>
                              <span>Hot</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 3: Notes & Review */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-neon-blue" />
                            Notes (Optional)
                          </FormLabel>
                          <FormControl>
                            <GlassTextarea
                              {...field}
                              placeholder="Add any additional notes about this lead..."
                              rows={4}
                              data-testid="input-lead-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Summary Card */}
                    <GlassCard variant="neon" className="p-4">
                      <h3 className="text-sm font-medium text-white/70 mb-4">Lead Summary</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Organization</span>
                          <span className="text-white font-medium">
                            {organizations.find((o: any) => o.id === form.getValues("orgId"))?.name || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Contact</span>
                          <span className="text-white font-medium">
                            {contacts.find((c: any) => c.id === form.getValues("contactId"))?.name || "None"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Source</span>
                          <span className="text-white font-medium capitalize">
                            {form.getValues("source")?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Stage</span>
                          {selectedStage && (
                            <span className={cn("flex items-center gap-2 font-medium", selectedStage.color)}>
                              <selectedStage.icon className="w-4 h-4" />
                              {selectedStage.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Score</span>
                          <span className="text-neon-blue font-bold">{form.getValues("score")}/100</span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 flex justify-between">
              <div>
                {step > 1 && (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </GlassButton>
                )}
              </div>
              <div className="flex gap-3">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  data-testid="button-cancel-lead"
                >
                  Cancel
                </GlassButton>
                {step < 3 ? (
                  <GlassButton
                    type="button"
                    onClick={nextStep}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </GlassButton>
                ) : (
                  <GlassButton
                    type="submit"
                    isLoading={createLeadMutation.isPending}
                    data-testid="button-submit-lead"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Create Lead
                  </GlassButton>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
