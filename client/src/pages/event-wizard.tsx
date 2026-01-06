import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Event, type InsertEvent, type EventStaff, type EventContractor, type User } from "@shared/schema";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Progress } from "@/components/ui/progress";
import { Trash2, UserPlus, Users } from "lucide-react";

const STAGE_NAMES = [
  "Basic Info",
  "Staff Assignment",
  "Contractors",
  "Contractor Payments",
  "Merchandise",
  "Inventory",
  "Budget",
  "Campaigns",
  "Registrations",
  "Review & Launch",
];

// Stage 1: Basic Info Schema (omit createdBy as it's auto-populated from auth)
const stage1Schema = z.object({
  name: z.string().min(1, "Event name is required"),
  eventType: z.enum(["small-scale", "large-scale", "seminar", "clinic", "camp"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
});

type Stage1Data = z.infer<typeof stage1Schema>;

// Staff form schema
const staffFormSchema = z.object({
  userId: z.string().min(1, "Please select a staff member"),
  role: z.string().min(1, "Please select a role"),
});

// Contractor form schema
const contractorFormSchema = z.object({
  name: z.string().min(1, "Contractor name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contractType: z.enum(["flat_fee", "per_day", "commission"]),
  paymentAmount: z.string().optional(),
});

export default function EventWizard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const eventId = id === "new" ? null : parseInt(id!);
  const [currentStage, setCurrentStage] = useState(1);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Check for stored stage on mount (after event creation redirect)
  useEffect(() => {
    if (eventId) {
      const storedStage = sessionStorage.getItem(`event-wizard-${eventId}-stage`);
      if (storedStage) {
        setCurrentStage(parseInt(storedStage));
        sessionStorage.removeItem(`event-wizard-${eventId}-stage`);
      }
    }
  }, [eventId]);

  // Fetch existing event if editing
  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: eventId !== null,
    retry: false,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users/for-assignment"],
    retry: false,
  });

  const { data: variants = [] } = useQuery<any[]>({
    queryKey: ["/api/product-variants"],
    retry: false,
  });

  // Staff and Contractor data - enable for stages 2-10 to keep data fresh
  const { data: eventStaff = [] } = useQuery<(EventStaff & { user?: User })[]>({
    queryKey: ["/api/events", eventId, "staff"],
    enabled: eventId !== null && currentStage >= 2,
    retry: false,
  });

  const { data: eventContractors = [] } = useQuery<EventContractor[]>({
    queryKey: ["/api/events", eventId, "contractors"],
    enabled: eventId !== null && currentStage >= 3,
    retry: false,
  });

  // Dialog states
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAddContractorDialog, setShowAddContractorDialog] = useState(false);
  const [staffFormData, setStaffFormData] = useState({ userId: "", role: "" });
  const [contractorFormData, setContractorFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    contractType: "flat_fee" as "flat_fee" | "per_day" | "commission",
    paymentAmount: "",
  });

  // Staff mutations
  const addStaffMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const validated = staffFormSchema.parse(data);
      return apiRequest(`/api/events/${eventId}/staff`, {
        method: "POST",
        body: validated,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "staff"] });
      setShowAddStaffDialog(false);
      setStaffFormData({ userId: "", role: "" });
      toast({ title: "Staff member added", description: "The staff member has been assigned to this event." });
    },
    onError: (error) => {
      const message = error instanceof z.ZodError 
        ? error.errors[0]?.message || "Validation failed"
        : "Failed to add staff member";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      return apiRequest(`/api/events/staff/${staffId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "staff"] });
      toast({ title: "Staff removed", description: "The staff member has been removed from this event." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove staff member", variant: "destructive" });
    },
  });

  // Contractor mutations
  const addContractorMutation = useMutation({
    mutationFn: async (data: typeof contractorFormData) => {
      const validated = contractorFormSchema.parse(data);
      return apiRequest(`/api/events/${eventId}/contractors`, {
        method: "POST",
        body: {
          name: validated.name,
          role: validated.role,
          email: validated.email || null,
          phone: validated.phone || null,
          contractType: validated.contractType,
          paymentAmount: validated.paymentAmount ? parseFloat(validated.paymentAmount) : null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "contractors"] });
      setShowAddContractorDialog(false);
      setContractorFormData({ name: "", role: "", email: "", phone: "", contractType: "flat_fee", paymentAmount: "" });
      toast({ title: "Contractor added", description: "The contractor has been added to this event." });
    },
    onError: (error) => {
      const message = error instanceof z.ZodError 
        ? error.errors[0]?.message || "Validation failed"
        : "Failed to add contractor";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteContractorMutation = useMutation({
    mutationFn: async (contractorId: number) => {
      return apiRequest(`/api/events/contractors/${contractorId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "contractors"] });
      toast({ title: "Contractor removed", description: "The contractor has been removed from this event." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove contractor", variant: "destructive" });
    },
  });

  // Form for Stage 1
  const form = useForm<Stage1Data>({
    resolver: zodResolver(stage1Schema),
    defaultValues: {
      name: event?.name || "",
      eventType: event?.eventType || "small-scale",
      startDate: event?.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
      endDate: event?.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
      location: event?.location || "",
      timezone: event?.timezone || "America/New_York",
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: Partial<InsertEvent>) => {
      if (!user?.id) {
        throw new Error("User must be authenticated to create an event");
      }
      
      // Convert date strings to ISO timestamp strings for the server
      const cleanData = {
        ...data,
        createdBy: user.id,
        startDate: data.startDate && data.startDate !== "" ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate && data.endDate !== "" ? new Date(data.endDate).toISOString() : null,
      };
      return apiRequest("/api/events", {
        method: "POST",
        body: cleanData,
      });
    },
    onSuccess: (newEvent: Event) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event created", description: "Your event has been created successfully." });
      // Store that we should advance to stage 2 after redirect
      sessionStorage.setItem(`event-wizard-${newEvent.id}-stage`, "2");
      // Redirect to wizard with the new event ID
      setLocation(`/events/${newEvent.id}/wizard`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    },
  });

  // Update event mutation (auto-save)
  const updateEventMutation = useMutation({
    mutationFn: async (data: Partial<InsertEvent>) => {
      setSaveStatus("saving");
      // Convert date strings to ISO timestamp strings for the server
      const cleanData = {
        ...data,
        startDate: data.startDate && data.startDate !== "" ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate && data.endDate !== "" ? new Date(data.endDate).toISOString() : null,
      };
      return apiRequest(`/api/events/${eventId}`, {
        method: "PUT",
        body: cleanData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      setSaveStatus("error");
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    },
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!eventId || currentStage !== 1) return;

    const interval = setInterval(() => {
      const values = form.getValues();
      if (values.name) {
        updateEventMutation.mutate(values);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId, currentStage]);

  // Save on stage navigation
  const handleNextStage = useCallback(async () => {
    if (currentStage === 1) {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();
      
      if (!eventId) {
        // Create new event
        createEventMutation.mutate(values);
      } else {
        // Update and move to next stage
        await updateEventMutation.mutateAsync(values);
        setCurrentStage((prev) => Math.min(prev + 1, 10));
      }
    } else {
      setCurrentStage((prev) => Math.min(prev + 1, 10));
    }
  }, [currentStage, eventId, form, createEventMutation, updateEventMutation]);

  const handlePreviousStage = () => {
    setCurrentStage((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    toast({ title: "Event Launched!", description: "Your event has been successfully launched." });
    setLocation(`/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  const progress = (currentStage / 10) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-wizard-title">Event Creation Wizard</h1>
            <p className="text-muted-foreground mt-1">Step {currentStage} of 10: {STAGE_NAMES[currentStage - 1]}</p>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus !== "idle" && (
              <span className={`text-sm ${saveStatus === "saved" ? "text-green-600" : saveStatus === "error" ? "text-red-600" : "text-muted-foreground"}`} data-testid="text-save-status">
                {saveStatus === "saving" && <><i className="fas fa-spinner fa-spin mr-1"></i>Saving...</>}
                {saveStatus === "saved" && <><i className="fas fa-check mr-1"></i>Saved</>}
                {saveStatus === "error" && <><i className="fas fa-exclamation-triangle mr-1"></i>Error</>}
              </span>
            )}
            <Button variant="outline" onClick={() => setLocation(`/events/${eventId || ""}`)} data-testid="button-exit-wizard">
              Exit Wizard
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" data-testid="progress-wizard" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {STAGE_NAMES.map((name, index) => (
              <span key={index} className={currentStage === index + 1 ? "font-semibold text-foreground" : ""}>
                {index + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Stage Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card data-testid={`stage-${currentStage}`}>
              <CardHeader>
                <CardTitle className="text-2xl">{STAGE_NAMES[currentStage - 1]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stage 1: Basic Info */}
                {currentStage === 1 && (
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter event name" data-testid="input-event-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-event-type">
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small-scale">Small Scale</SelectItem>
                                <SelectItem value="large-scale">Large Scale</SelectItem>
                                <SelectItem value="seminar">Seminar</SelectItem>
                                <SelectItem value="clinic">Clinic</SelectItem>
                                <SelectItem value="camp">Camp</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-start-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-end-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue/Location</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter event location" data-testid="input-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                )}

                {/* Stage 2: Staff Assignment */}
                {currentStage === 2 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Assign internal staff members to this event with specific roles.</p>
                    
                    {eventStaff.length > 0 && (
                      <div className="space-y-2">
                        {eventStaff.map((staff) => (
                          <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50" data-testid={`staff-item-${staff.id}`}>
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{users.find(u => u.id === staff.userId)?.firstName || staff.userId}</p>
                                <p className="text-sm text-muted-foreground">{staff.role}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteStaffMutation.mutate(staff.id)}
                              disabled={deleteStaffMutation.isPending}
                              data-testid={`button-delete-staff-${staff.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {eventStaff.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No staff assigned yet</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setShowAddStaffDialog(true)}
                      data-testid="button-add-staff"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
                )}

                {/* Stage 3: Contractors */}
                {currentStage === 3 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Add external contractors (clinicians, photographers, MCs, etc.) for your event.</p>
                    
                    {eventContractors.length > 0 && (
                      <div className="space-y-2">
                        {eventContractors.map((contractor) => (
                          <div key={contractor.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50" data-testid={`contractor-item-${contractor.id}`}>
                            <div>
                              <p className="font-medium">{contractor.name}</p>
                              <p className="text-sm text-muted-foreground">{contractor.role}</p>
                              {contractor.paymentAmount && (
                                <p className="text-sm text-green-600">
                                  ${Number(contractor.paymentAmount).toFixed(2)} ({contractor.contractType.replace("_", " ")})
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteContractorMutation.mutate(contractor.id)}
                              disabled={deleteContractorMutation.isPending}
                              data-testid={`button-delete-contractor-${contractor.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {eventContractors.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                        <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No contractors added yet</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setShowAddContractorDialog(true)}
                      data-testid="button-add-contractor"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Contractor
                    </Button>
                  </div>
                )}

                {/* Stage 4: Contractor Payments */}
                {currentStage === 4 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Schedule and track contractor payment schedules.</p>
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-dollar-sign text-4xl mb-2"></i>
                      <p>No contractors added yet. Add contractors in the previous stage.</p>
                    </div>
                  </div>
                )}

                {/* Stage 5: Merchandise Allocation */}
                {currentStage === 5 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Allocate inventory items to this event for sales.</p>
                    <Button variant="outline" className="w-full" data-testid="button-add-merchandise">
                      <i className="fas fa-plus mr-2"></i>
                      Allocate Merchandise
                    </Button>
                  </div>
                )}

                {/* Stage 6: Inventory Movements */}
                {currentStage === 6 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Track merchandise transfers between warehouse and event site.</p>
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-truck text-4xl mb-2"></i>
                      <p>No inventory movements yet.</p>
                    </div>
                  </div>
                )}

                {/* Stage 7: Budget Planning */}
                {currentStage === 7 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Plan and track your event budget by category.</p>
                    <Button variant="outline" className="w-full" data-testid="button-add-budget">
                      <i className="fas fa-plus mr-2"></i>
                      Add Budget Category
                    </Button>
                  </div>
                )}

                {/* Stage 8: Marketing Campaigns */}
                {currentStage === 8 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Create marketing campaigns to promote your event.</p>
                    <Button variant="outline" className="w-full" data-testid="button-add-campaign">
                      <i className="fas fa-plus mr-2"></i>
                      Create Campaign
                    </Button>
                  </div>
                )}

                {/* Stage 9: Registrations */}
                {currentStage === 9 && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Set up attendee registration and ticketing.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <i className="fas fa-ticket-alt text-3xl text-primary mb-2"></i>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Registrations</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <i className="fas fa-dollar-sign text-3xl text-green-600 mb-2"></i>
                          <p className="text-2xl font-bold">$0</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <i className="fas fa-check-circle text-3xl text-blue-600 mb-2"></i>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Checked In</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Stage 10: Review & Launch */}
                {currentStage === 10 && (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-muted p-6">
                      <h3 className="font-semibold mb-4">Event Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Event Name:</span>
                          <p className="font-medium">{event?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium">
                            {event?.eventType === "small-scale" ? "Small Scale" : 
                             event?.eventType === "large-scale" ? "Large Scale" :
                             event?.eventType === "seminar" ? "Seminar" :
                             event?.eventType === "clinic" ? "Clinic" :
                             event?.eventType === "camp" ? "Camp" : event?.eventType}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{event?.location || "Not set"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dates:</span>
                          <p className="font-medium">
                            {event?.startDate ? new Date(event.startDate).toLocaleDateString() : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-primary p-6 text-center">
                      <i className="fas fa-rocket text-4xl text-primary mb-3"></i>
                      <h3 className="text-lg font-semibold mb-2">Ready to Launch?</h3>
                      <p className="text-muted-foreground mb-4">
                        Review all the information above. Once you launch, the event will be visible to your team and attendees.
                      </p>
                      <Button size="lg" onClick={handleComplete} data-testid="button-launch-event">
                        <i className="fas fa-rocket mr-2"></i>
                        Launch Event
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousStage}
            disabled={currentStage === 1}
            data-testid="button-previous-stage"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </Button>
          {currentStage < 10 && (
            <Button 
              onClick={handleNextStage} 
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
              data-testid="button-next-stage"
            >
              {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {createEventMutation.isPending ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  Next
                  <i className="fas fa-arrow-right ml-2"></i>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Staff Member</label>
              <Select
                value={staffFormData.userId}
                onValueChange={(value) => setStaffFormData(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger data-testid="select-staff-user">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role at Event</label>
              <Select
                value={staffFormData.role}
                onValueChange={(value) => setStaffFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger data-testid="select-staff-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Event Director">Event Director</SelectItem>
                  <SelectItem value="Logistics Lead">Logistics Lead</SelectItem>
                  <SelectItem value="Sales Lead">Sales Lead</SelectItem>
                  <SelectItem value="Setup Crew">Setup Crew</SelectItem>
                  <SelectItem value="Registration">Registration</SelectItem>
                  <SelectItem value="Merchandise">Merchandise</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                  <SelectItem value="Support Staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addStaffMutation.mutate(staffFormData)}
              disabled={!staffFormData.userId || !staffFormData.role || addStaffMutation.isPending}
              data-testid="button-confirm-add-staff"
            >
              {addStaffMutation.isPending ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contractor Dialog */}
      <Dialog open={showAddContractorDialog} onOpenChange={setShowAddContractorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="Contractor name"
                value={contractorFormData.name}
                onChange={(e) => setContractorFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-contractor-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Select
                value={contractorFormData.role}
                onValueChange={(value) => setContractorFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger data-testid="select-contractor-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clinician">Clinician</SelectItem>
                  <SelectItem value="MC">MC / Host</SelectItem>
                  <SelectItem value="Photographer">Photographer</SelectItem>
                  <SelectItem value="Videographer">Videographer</SelectItem>
                  <SelectItem value="Referee">Referee</SelectItem>
                  <SelectItem value="Trainer">Trainer / Coach</SelectItem>
                  <SelectItem value="DJ">DJ</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={contractorFormData.email}
                  onChange={(e) => setContractorFormData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-contractor-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contractorFormData.phone}
                  onChange={(e) => setContractorFormData(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-contractor-phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Type</label>
                <Select
                  value={contractorFormData.contractType}
                  onValueChange={(value: "flat_fee" | "per_day" | "commission") => 
                    setContractorFormData(prev => ({ ...prev, contractType: value }))
                  }
                >
                  <SelectTrigger data-testid="select-contractor-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_fee">Flat Fee</SelectItem>
                    <SelectItem value="per_day">Per Day</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={contractorFormData.paymentAmount}
                  onChange={(e) => setContractorFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  data-testid="input-contractor-amount"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContractorDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addContractorMutation.mutate(contractorFormData)}
              disabled={!contractorFormData.name || !contractorFormData.role || addContractorMutation.isPending}
              data-testid="button-confirm-add-contractor"
            >
              {addContractorMutation.isPending ? "Adding..." : "Add Contractor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
