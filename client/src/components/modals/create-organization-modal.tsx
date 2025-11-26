import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GlassCard, GlassInput, GlassTextarea, GlassButton } from "@/components/ui/glass";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Building2, MapPin, FileText, Users, ArrowRight, ArrowLeft, 
  Check, Plus, Trash2, Edit2, Mail, Phone, Star, User, Briefcase
} from "lucide-react";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sports: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface ContactFormData {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  role: "customer" | "admin" | "billing" | "technical" | "executive" | "other";
  isPrimary: boolean;
}

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", icon: User, color: "neon-green" },
  { value: "admin", label: "Admin", icon: Briefcase, color: "neon-blue" },
  { value: "billing", label: "Billing", icon: FileText, color: "neon-yellow" },
  { value: "technical", label: "Technical", icon: Building2, color: "neon-purple" },
  { value: "executive", label: "Executive", icon: Star, color: "neon-pink" },
  { value: "other", label: "Other", icon: Users, color: "white" },
] as const;

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({ isOpen, onClose }: CreateOrganizationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<ContactFormData[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactFormData | null>(null);
  
  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState<ContactFormData["role"]>("customer");
  const [contactRoleTitle, setContactRoleTitle] = useState("");
  const [contactIsPrimary, setContactIsPrimary] = useState(false);

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      sports: "",
      city: "",
      state: "",
      shippingAddress: "",
      notes: "",
    },
  });

  const resetContactForm = () => {
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactRole("customer");
    setContactRoleTitle("");
    setContactIsPrimary(false);
    setIsAddingContact(false);
    setEditingContact(null);
  };

  const addContact = () => {
    if (!contactName.trim()) {
      toast({ title: "Error", description: "Contact name is required", variant: "destructive" });
      return;
    }

    const newContact: ContactFormData = {
      id: Date.now().toString(),
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      roleTitle: contactRoleTitle,
      role: contactRole,
      isPrimary: contactIsPrimary,
    };

    if (newContact.isPrimary) {
      setContacts(prev => [...prev.map(c => ({ ...c, isPrimary: false })), newContact]);
    } else {
      setContacts(prev => [...prev, newContact]);
    }
    resetContactForm();
  };

  const updateContact = () => {
    if (!editingContact || !contactName.trim()) return;

    const updatedContact: ContactFormData = {
      ...editingContact,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      roleTitle: contactRoleTitle,
      role: contactRole,
      isPrimary: contactIsPrimary,
    };

    if (contactIsPrimary) {
      setContacts(prev => prev.map(c => 
        c.id === editingContact.id ? updatedContact : { ...c, isPrimary: false }
      ));
    } else {
      setContacts(prev => prev.map(c => 
        c.id === editingContact.id ? updatedContact : c
      ));
    }
    resetContactForm();
  };

  const startEditingContact = (contact: ContactFormData) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email);
    setContactPhone(contact.phone);
    setContactRole(contact.role);
    setContactRoleTitle(contact.roleTitle);
    setContactIsPrimary(contact.isPrimary);
    setIsAddingContact(true);
  };

  const removeContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationForm) => {
      const organization = await apiRequest("/api/organizations", {
        method: "POST",
        body: data
      });

      if (contacts.length > 0) {
        for (const contact of contacts) {
          await apiRequest("/api/contacts", {
            method: "POST",
            body: {
              orgId: organization.id,
              name: contact.name,
              email: contact.email || undefined,
              phone: contact.phone || undefined,
              roleTitle: contact.roleTitle || undefined,
              role: contact.role,
              isPrimary: contact.isPrimary,
            }
          });
        }
      }

      return organization;
    },
    onSuccess: () => {
      const contactCount = contacts.length;
      toast({
        title: "Success",
        description: `Organization created${contactCount > 0 ? ` with ${contactCount} contact${contactCount > 1 ? 's' : ''}` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setContacts([]);
    setStep(1);
    resetContactForm();
    onClose();
  };

  const onSubmit = () => {
    const data = form.getValues();
    createOrganizationMutation.mutate(data);
  };

  const canProceedToStep2 = form.watch("name")?.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none"
        data-testid="modal-create-organization"
      >
        <GlassCard className="p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {step === 1 && "Organization Details"}
                    {step === 2 && "Add Contacts"}
                    {step === 3 && "Review & Create"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Step {step} of 3</p>
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
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    s === step
                      ? "bg-neon-purple shadow-[0_0_10px_#bc13fe]"
                      : s < step
                      ? "bg-neon-purple/50"
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
              {/* Step 1: Organization Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <GlassInput
                    icon={<Building2 className="w-4 h-4" />}
                    label="Organization Name *"
                    placeholder="e.g., Springfield High School"
                    value={form.watch("name") || ""}
                    onChange={(e) => form.setValue("name", e.target.value)}
                    data-testid="input-organization-name"
                  />

                  <GlassInput
                    label="Sports/Activities"
                    placeholder="e.g., Football, Basketball, Baseball"
                    value={form.watch("sports") || ""}
                    onChange={(e) => form.setValue("sports", e.target.value)}
                    data-testid="input-organization-sports"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <GlassInput
                      icon={<MapPin className="w-4 h-4" />}
                      label="City"
                      placeholder="City"
                      value={form.watch("city") || ""}
                      onChange={(e) => form.setValue("city", e.target.value)}
                      data-testid="input-organization-city"
                    />
                    <GlassInput
                      label="State"
                      placeholder="State"
                      value={form.watch("state") || ""}
                      onChange={(e) => form.setValue("state", e.target.value)}
                      data-testid="input-organization-state"
                    />
                  </div>

                  <GlassTextarea
                    label="Shipping Address"
                    placeholder="Full shipping address..."
                    value={form.watch("shippingAddress") || ""}
                    onChange={(e) => form.setValue("shippingAddress", e.target.value)}
                    data-testid="input-organization-address"
                  />

                  <GlassTextarea
                    label="Notes"
                    placeholder="Additional notes about this organization..."
                    value={form.watch("notes") || ""}
                    onChange={(e) => form.setValue("notes", e.target.value)}
                    data-testid="input-organization-notes"
                  />
                </motion.div>
              )}

              {/* Step 2: Add Contacts */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Existing Contacts */}
                  {contacts.length > 0 && !isAddingContact && (
                    <div className="space-y-3">
                      {contacts.map((contact) => {
                        const roleOption = ROLE_OPTIONS.find(r => r.value === contact.role);
                        const RoleIcon = roleOption?.icon || User;
                        return (
                          <GlassCard key={contact.id} variant="dark" className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  `bg-${roleOption?.color || 'white'}/10`
                                )}>
                                  <RoleIcon className={cn("w-5 h-5", `text-${roleOption?.color || 'white'}`)} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{contact.name}</span>
                                    {contact.isPrimary && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue flex items-center gap-1">
                                        <Star className="w-3 h-3" /> Primary
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="capitalize">{contact.role}</span>
                                    {contact.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {contact.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditingContact(contact)}
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => removeContact(contact.id)}
                                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Contact Form */}
                  {isAddingContact ? (
                    <GlassCard variant="neon" className="p-4 space-y-4">
                      <h3 className="font-medium text-white">
                        {editingContact ? "Edit Contact" : "Add Contact"}
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                          icon={<User className="w-4 h-4" />}
                          label="Name *"
                          placeholder="Contact name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          data-testid="input-contact-name"
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Role</label>
                          <div className="grid grid-cols-3 gap-2">
                            {ROLE_OPTIONS.slice(0, 6).map((role) => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => setContactRole(role.value as ContactFormData["role"])}
                                className={cn(
                                  "p-2 rounded-lg border text-xs font-medium transition-all",
                                  contactRole === role.value
                                    ? "bg-neon-purple/20 border-neon-purple/50 text-white"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                                )}
                              >
                                {role.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                          icon={<Mail className="w-4 h-4" />}
                          label="Email"
                          type="email"
                          placeholder="email@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          data-testid="input-contact-email"
                        />
                        <GlassInput
                          icon={<Phone className="w-4 h-4" />}
                          label="Phone"
                          placeholder="(555) 123-4567"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          data-testid="input-contact-phone"
                        />
                      </div>

                      <GlassInput
                        icon={<Briefcase className="w-4 h-4" />}
                        label="Role Title"
                        placeholder="e.g., Head Coach, Athletic Director"
                        value={contactRoleTitle}
                        onChange={(e) => setContactRoleTitle(e.target.value)}
                        data-testid="input-contact-role-title"
                      />

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactIsPrimary}
                          onChange={(e) => setContactIsPrimary(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5"
                          data-testid="checkbox-contact-primary"
                        />
                        <span className="text-sm text-white/80">Mark as primary contact</span>
                      </label>

                      <div className="flex justify-end gap-2">
                        <GlassButton variant="ghost" onClick={resetContactForm}>
                          Cancel
                        </GlassButton>
                        <GlassButton onClick={editingContact ? updateContact : addContact}>
                          {editingContact ? "Update" : "Add"} Contact
                        </GlassButton>
                      </div>
                    </GlassCard>
                  ) : (
                    <button
                      onClick={() => setIsAddingContact(true)}
                      className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-neon-purple/50 transition-colors group"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-white transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-purple/10 transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-medium">Add Contact</span>
                        <span className="text-sm">Optional: Add contacts for this organization</span>
                      </div>
                    </button>
                  )}
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-neon-green" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Ready to Create</h3>
                    <p className="text-muted-foreground">Review the details below</p>
                  </div>

                  <GlassCard variant="neon" className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Organization</span>
                        <span className="text-white font-medium">{form.watch("name")}</span>
                      </div>
                      {form.watch("sports") && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Sports</span>
                          <span className="text-white">{form.watch("sports")}</span>
                        </div>
                      )}
                      {(form.watch("city") || form.watch("state")) && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Location</span>
                          <span className="text-white">
                            {[form.watch("city"), form.watch("state")].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Contacts</span>
                        <span className="text-white">{contacts.length}</span>
                      </div>
                    </div>
                  </GlassCard>

                  {contacts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Contacts</h4>
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-white">{contact.name}</span>
                            {contact.isPrimary && (
                              <span className="ml-2 text-xs text-neon-blue">(Primary)</span>
                            )}
                          </div>
                        </div>
                      ))}
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
            
            {step < 3 ? (
              <GlassButton 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !canProceedToStep2}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlassButton>
            ) : (
              <GlassButton
                onClick={onSubmit}
                disabled={createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
