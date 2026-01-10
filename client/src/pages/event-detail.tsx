import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { hasPermission } from "@/lib/permissions";
import type { 
  Event, EventStaff, EventContractor, EventBudget, EventCampaign, EventRegistration,
  EventSponsor, EventVolunteer, EventGraphic, EventVenue, EventSchedule, EventEquipment,
  EventTravel, EventTask, EventDocument, EventTicketTier, EventExpense, EventNote, EventChecklist
} from "@shared/schema";

const STATUS_CONFIG: Record<Event["status"], { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  planning: { label: "Planning", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  live: { label: "Live", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export default function EventDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const eventId = parseInt(id!);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    retry: false,
  });

  const { data: staff = [] } = useQuery<EventStaff[]>({
    queryKey: ["/api/events", eventId, "staff"],
    retry: false,
  });

  const { data: contractors = [] } = useQuery<EventContractor[]>({
    queryKey: ["/api/events", eventId, "contractors"],
    retry: false,
  });

  const { data: budgets = [] } = useQuery<EventBudget[]>({
    queryKey: ["/api/events", eventId, "budgets"],
    retry: false,
  });

  const { data: campaigns = [] } = useQuery<EventCampaign[]>({
    queryKey: ["/api/events", eventId, "campaigns"],
    retry: false,
  });

  const { data: registrations = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/events", eventId, "registrations"],
    retry: false,
  });

  const { data: sponsors = [] } = useQuery<EventSponsor[]>({
    queryKey: ["/api/events", eventId, "sponsors"],
    retry: false,
  });

  const { data: volunteers = [] } = useQuery<EventVolunteer[]>({
    queryKey: ["/api/events", eventId, "volunteers"],
    retry: false,
  });

  const { data: graphics = [] } = useQuery<EventGraphic[]>({
    queryKey: ["/api/events", eventId, "graphics"],
    retry: false,
  });

  const { data: venues = [] } = useQuery<EventVenue[]>({
    queryKey: ["/api/events", eventId, "venues"],
    retry: false,
  });

  const { data: schedules = [] } = useQuery<EventSchedule[]>({
    queryKey: ["/api/events", eventId, "schedules"],
    retry: false,
  });

  const { data: equipment = [] } = useQuery<EventEquipment[]>({
    queryKey: ["/api/events", eventId, "equipment"],
    retry: false,
  });

  const { data: travel = [] } = useQuery<EventTravel[]>({
    queryKey: ["/api/events", eventId, "travel"],
    retry: false,
  });

  const { data: eventTasks = [] } = useQuery<EventTask[]>({
    queryKey: ["/api/events", eventId, "tasks"],
    retry: false,
  });

  const { data: documents = [] } = useQuery<EventDocument[]>({
    queryKey: ["/api/events", eventId, "documents"],
    retry: false,
  });

  const { data: ticketTiers = [] } = useQuery<EventTicketTier[]>({
    queryKey: ["/api/events", eventId, "ticket-tiers"],
    retry: false,
  });

  const { data: expenses = [] } = useQuery<EventExpense[]>({
    queryKey: ["/api/events", eventId, "expenses"],
    retry: false,
  });

  const { data: notes = [] } = useQuery<EventNote[]>({
    queryKey: ["/api/events", eventId, "notes"],
    retry: false,
  });

  const { data: checklists = [] } = useQuery<EventChecklist[]>({
    queryKey: ["/api/events", eventId, "checklists"],
    retry: false,
  });

  const canEdit = hasPermission(user, "events", "write");
  const queryClient = useQueryClient();

  const [showAddSponsorDialog, setShowAddSponsorDialog] = useState(false);
  const [showAddVolunteerDialog, setShowAddVolunteerDialog] = useState(false);
  const [showAddGraphicDialog, setShowAddGraphicDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showAddChecklistDialog, setShowAddChecklistDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [showAddVenueDialog, setShowAddVenueDialog] = useState(false);
  const [showAddScheduleDialog, setShowAddScheduleDialog] = useState(false);
  const [showAddTravelDialog, setShowAddTravelDialog] = useState(false);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showAddTicketTierDialog, setShowAddTicketTierDialog] = useState(false);

  const [newSponsor, setNewSponsor] = useState({
    name: "",
    tier: "bronze",
    amount: "",
    contactName: "",
    contactEmail: "",
    benefits: "",
  });

  const [newVolunteer, setNewVolunteer] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    assignedArea: "",
    shirtSize: "",
  });

  const [newGraphic, setNewGraphic] = useState({
    fileName: "",
    fileUrl: "",
    fileType: "image",
    description: "",
  });

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    expenseCategory: "venue",
    vendor: "",
    status: "pending",
  });

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    noteType: "general",
  });

  const [newChecklist, setNewChecklist] = useState({
    itemText: "",
    checklistType: "pre_event",
    notes: "",
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "normal",
    status: "pending",
  });

  const [newEquipment, setNewEquipment] = useState({
    itemName: "",
    quantity: "1",
    category: "",
    rentalCost: "",
    status: "pending",
  });

  const [newVenue, setNewVenue] = useState({
    venueName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    capacity: "",
    rentalCost: "",
    contactName: "",
    contactEmail: "",
    notes: "",
  });

  const [newSchedule, setNewSchedule] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    activityType: "session",
    speakerName: "",
  });

  const [newTravel, setNewTravel] = useState({
    travelerName: "",
    travelerType: "custom",
    flightArrival: "",
    flightDeparture: "",
    hotelName: "",
    hotelCheckIn: "",
    hotelCheckOut: "",
    totalCost: "",
    notes: "",
  });

  const [newDocument, setNewDocument] = useState({
    fileName: "",
    fileUrl: "",
    documentType: "other",
    notes: "",
  });

  const [newTicketTier, setNewTicketTier] = useState({
    tierName: "",
    price: "",
    capacity: "",
    description: "",
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (data: typeof newSponsor) => {
      return apiRequest(`/api/events/${eventId}/sponsors`, {
        method: "POST",
        body: {
          name: data.name,
          tier: data.tier || null,
          amount: data.amount || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          benefits: data.benefits || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "sponsors"] });
      setShowAddSponsorDialog(false);
      setNewSponsor({ name: "", tier: "bronze", amount: "", contactName: "", contactEmail: "", benefits: "" });
      toast({ title: "Sponsor added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add sponsor", variant: "destructive" });
    },
  });

  const addVolunteerMutation = useMutation({
    mutationFn: async (data: typeof newVolunteer) => {
      return apiRequest(`/api/events/${eventId}/volunteers`, {
        method: "POST",
        body: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
          shirtSize: data.shirtSize || null,
          assignedArea: data.assignedArea || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "volunteers"] });
      setShowAddVolunteerDialog(false);
      setNewVolunteer({ name: "", email: "", phone: "", role: "", assignedArea: "", shirtSize: "" });
      toast({ title: "Volunteer added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add volunteer", variant: "destructive" });
    },
  });

  const addGraphicMutation = useMutation({
    mutationFn: async (data: typeof newGraphic) => {
      return apiRequest(`/api/events/${eventId}/graphics`, {
        method: "POST",
        body: {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileType: data.fileType || 'other',
          description: data.description || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "graphics"] });
      setShowAddGraphicDialog(false);
      setNewGraphic({ fileName: "", fileUrl: "", fileType: "image", description: "" });
      toast({ title: "Graphic added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add graphic", variant: "destructive" });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: typeof newExpense) => {
      return apiRequest(`/api/events/${eventId}/expenses`, {
        method: "POST",
        body: {
          description: data.description,
          amount: data.amount,
          expenseCategory: data.expenseCategory || 'other',
          vendor: data.vendor || null,
          status: data.status || 'pending',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "expenses"] });
      setShowAddExpenseDialog(false);
      setNewExpense({ description: "", amount: "", expenseCategory: "venue", vendor: "", status: "pending" });
      toast({ title: "Expense added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: typeof newNote) => {
      return apiRequest(`/api/events/${eventId}/notes`, {
        method: "POST",
        body: {
          title: data.title,
          content: data.content,
          noteType: data.noteType || 'general',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "notes"] });
      setShowAddNoteDialog(false);
      setNewNote({ title: "", content: "", noteType: "general" });
      toast({ title: "Note added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const addChecklistMutation = useMutation({
    mutationFn: async (data: typeof newChecklist) => {
      return apiRequest(`/api/events/${eventId}/checklists`, {
        method: "POST",
        body: {
          itemText: data.itemText,
          checklistType: data.checklistType || 'pre_event',
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "checklists"] });
      setShowAddChecklistDialog(false);
      setNewChecklist({ itemText: "", checklistType: "pre_event", notes: "" });
      toast({ title: "Checklist item added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add checklist item", variant: "destructive" });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: typeof newTask) => {
      return apiRequest(`/api/events/${eventId}/tasks`, {
        method: "POST",
        body: {
          title: data.title,
          description: data.description || null,
          assignedTo: data.assignedTo || null,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          priority: data.priority || 'normal',
          status: data.status || 'pending',
          category: 'other',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "tasks"] });
      setShowAddTaskDialog(false);
      setNewTask({ title: "", description: "", assignedTo: "", dueDate: "", priority: "normal", status: "pending" });
      toast({ title: "Task added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add task", variant: "destructive" });
    },
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (data: typeof newEquipment) => {
      return apiRequest(`/api/events/${eventId}/equipment`, {
        method: "POST",
        body: {
          itemName: data.itemName,
          quantity: data.quantity ? parseInt(data.quantity) : 1,
          category: data.category || null,
          rentalCost: data.rentalCost || null,
          status: data.status || 'reserved',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "equipment"] });
      setShowAddEquipmentDialog(false);
      setNewEquipment({ itemName: "", quantity: "1", category: "", rentalCost: "", status: "pending" });
      toast({ title: "Equipment added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add equipment", variant: "destructive" });
    },
  });

  const addVenueMutation = useMutation({
    mutationFn: async (data: typeof newVenue) => {
      return apiRequest(`/api/events/${eventId}/venues`, {
        method: "POST",
        body: {
          venueName: data.venueName,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          capacity: data.capacity ? parseInt(data.capacity) : null,
          rentalCost: data.rentalCost || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "venues"] });
      setShowAddVenueDialog(false);
      setNewVenue({ venueName: "", address: "", city: "", state: "", zipCode: "", capacity: "", rentalCost: "", contactName: "", contactEmail: "", notes: "" });
      toast({ title: "Venue added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add venue", variant: "destructive" });
    },
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (data: typeof newSchedule) => {
      return apiRequest(`/api/events/${eventId}/schedules`, {
        method: "POST",
        body: {
          title: data.title,
          description: data.description || null,
          startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
          location: data.location || null,
          activityType: data.activityType || null,
          speakerName: data.speakerName || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "schedules"] });
      setShowAddScheduleDialog(false);
      setNewSchedule({ title: "", description: "", startTime: "", endTime: "", location: "", activityType: "session", speakerName: "" });
      toast({ title: "Schedule item added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add schedule item", variant: "destructive" });
    },
  });

  const addTravelMutation = useMutation({
    mutationFn: async (data: typeof newTravel) => {
      return apiRequest(`/api/events/${eventId}/travel`, {
        method: "POST",
        body: {
          travelerName: data.travelerName,
          travelerType: data.travelerType || 'custom',
          flightArrival: data.flightArrival ? new Date(data.flightArrival).toISOString() : null,
          flightDeparture: data.flightDeparture ? new Date(data.flightDeparture).toISOString() : null,
          hotelName: data.hotelName || null,
          hotelCheckIn: data.hotelCheckIn ? new Date(data.hotelCheckIn).toISOString() : null,
          hotelCheckOut: data.hotelCheckOut ? new Date(data.hotelCheckOut).toISOString() : null,
          totalCost: data.totalCost || null,
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "travel"] });
      setShowAddTravelDialog(false);
      setNewTravel({ travelerName: "", travelerType: "custom", flightArrival: "", flightDeparture: "", hotelName: "", hotelCheckIn: "", hotelCheckOut: "", totalCost: "", notes: "" });
      toast({ title: "Travel arrangement added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add travel arrangement", variant: "destructive" });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: typeof newDocument) => {
      return apiRequest(`/api/events/${eventId}/documents`, {
        method: "POST",
        body: {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          documentType: data.documentType || 'other',
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "documents"] });
      setShowAddDocumentDialog(false);
      setNewDocument({ fileName: "", fileUrl: "", documentType: "other", notes: "" });
      toast({ title: "Document added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add document", variant: "destructive" });
    },
  });

  const addTicketTierMutation = useMutation({
    mutationFn: async (data: typeof newTicketTier) => {
      return apiRequest(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        body: {
          tierName: data.tierName,
          price: data.price,
          capacity: data.capacity ? parseInt(data.capacity) : null,
          description: data.description || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-tiers"] });
      setShowAddTicketTierDialog(false);
      setNewTicketTier({ tierName: "", price: "", capacity: "", description: "" });
      toast({ title: "Ticket tier added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add ticket tier", variant: "destructive" });
    },
  });

  if (eventLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
            <p className="text-lg text-muted-foreground">Event not found</p>
            <Button onClick={() => setLocation("/events")} className="mt-4">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold" data-testid="text-event-name">{event.name}</h1>
            <StatusBadge status={event.status as any}>{STATUS_CONFIG[event.status]?.label || event.status}</StatusBadge>
          </div>
          <p className="text-muted-foreground" data-testid="text-event-code">{event.eventCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/events")} data-testid="button-back">
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </Button>
          {canEdit && event.status === "draft" && (
            <Button onClick={() => setLocation(`/events/${eventId}/wizard`)} data-testid="button-continue-wizard">
              <i className="fas fa-magic mr-2"></i>
              Continue Wizard
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {event.logoUrl && (
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground">Event Logo</label>
              <img src={event.logoUrl} alt={`${event.name} logo`} className="mt-2 h-24 object-contain" data-testid="img-event-logo" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Event Type</label>
              <p className="mt-1 font-medium" data-testid="text-event-type">
                {event.eventType === "small-scale" ? "Small Scale" : 
                 event.eventType === "large-scale" ? "Large Scale" :
                 event.eventType === "seminar" ? "Seminar" :
                 event.eventType === "clinic" ? "Clinic" :
                 event.eventType === "camp" ? "Camp" : event.eventType}
              </p>
            </div>
            {event.location && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="mt-1" data-testid="text-event-location">{event.location}</p>
              </div>
            )}
            {event.startDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Event Dates</label>
                <p className="mt-1" data-testid="text-event-dates">
                  {format(new Date(event.startDate), "MMM d, yyyy")}
                  {event.endDate && event.endDate !== event.startDate && ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full overflow-x-auto" data-testid="tabs-event-detail">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsors" data-testid="tab-sponsors">Sponsors ({sponsors.length})</TabsTrigger>
          <TabsTrigger value="volunteers" data-testid="tab-volunteers">Volunteers ({volunteers.length})</TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="contractors" data-testid="tab-contractors">Contractors ({contractors.length})</TabsTrigger>
          <TabsTrigger value="graphics" data-testid="tab-graphics">Graphics ({graphics.length})</TabsTrigger>
          <TabsTrigger value="venues" data-testid="tab-venues">Venues ({venues.length})</TabsTrigger>
          <TabsTrigger value="schedules" data-testid="tab-schedules">Schedule ({schedules.length})</TabsTrigger>
          <TabsTrigger value="equipment" data-testid="tab-equipment">Equipment ({equipment.length})</TabsTrigger>
          <TabsTrigger value="travel" data-testid="tab-travel">Travel ({travel.length})</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks ({eventTasks.length})</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="budgets" data-testid="tab-budgets">Budget ({budgets.length})</TabsTrigger>
          <TabsTrigger value="ticket-tiers" data-testid="tab-ticket-tiers">Tickets ({ticketTiers.length})</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="registrations" data-testid="tab-registrations">Registrations ({registrations.length})</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="checklists" data-testid="tab-checklists">Checklists ({checklists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold" data-testid="text-sponsorship-value">${sponsors.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Sponsorship Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold" data-testid="text-total-staff-volunteers">{volunteers.length + staff.length}</p>
                <p className="text-sm text-muted-foreground">Total Staff/Volunteers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold" data-testid="text-total-expenses">${expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Sponsors</h3>
                {canEdit && (
                  <Dialog open={showAddSponsorDialog} onOpenChange={setShowAddSponsorDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-sponsor">
                        <Plus className="h-4 w-4 mr-1" /> Add Sponsor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Sponsor</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-name">Sponsor Name *</Label>
                          <Input 
                            id="sponsor-name" 
                            value={newSponsor.name}
                            onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                            data-testid="input-sponsor-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-tier">Tier</Label>
                          <Select value={newSponsor.tier} onValueChange={(value) => setNewSponsor({...newSponsor, tier: value})}>
                            <SelectTrigger data-testid="select-sponsor-tier">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="platinum">Platinum</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="bronze">Bronze</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-amount">Amount ($)</Label>
                          <Input 
                            id="sponsor-amount" 
                            type="number"
                            value={newSponsor.amount}
                            onChange={(e) => setNewSponsor({...newSponsor, amount: e.target.value})}
                            data-testid="input-sponsor-amount"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-contact">Contact Name</Label>
                          <Input 
                            id="sponsor-contact" 
                            value={newSponsor.contactName}
                            onChange={(e) => setNewSponsor({...newSponsor, contactName: e.target.value})}
                            data-testid="input-sponsor-contact"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-email">Contact Email</Label>
                          <Input 
                            id="sponsor-email" 
                            type="email"
                            value={newSponsor.contactEmail}
                            onChange={(e) => setNewSponsor({...newSponsor, contactEmail: e.target.value})}
                            data-testid="input-sponsor-email"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sponsor-benefits">Benefits</Label>
                          <Textarea 
                            id="sponsor-benefits" 
                            value={newSponsor.benefits}
                            onChange={(e) => setNewSponsor({...newSponsor, benefits: e.target.value})}
                            data-testid="input-sponsor-benefits"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddSponsorDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addSponsorMutation.mutate(newSponsor)}
                          disabled={!newSponsor.name || addSponsorMutation.isPending}
                          data-testid="button-save-sponsor"
                        >
                          {addSponsorMutation.isPending ? "Saving..." : "Save Sponsor"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {sponsors.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No sponsors yet</p>
              ) : (
                <div className="space-y-4">
                  {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`sponsor-${sponsor.id}`}>
                      <div className="flex items-center gap-4">
                        {sponsor.logoUrl && <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 w-12 object-contain" />}
                        <div>
                          <p className="font-medium" data-testid={`text-sponsor-name-${sponsor.id}`}>{sponsor.name}</p>
                          <p className="text-sm text-muted-foreground">{sponsor.tier} Tier</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${sponsor.amount || '0.00'}</p>
                        <StatusBadge status={sponsor.status as any}>
                          {sponsor.status === 'pending' ? 'Pending' : sponsor.status === 'confirmed' ? 'Confirmed' : 'Paid'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Volunteers</h3>
                {canEdit && (
                  <Dialog open={showAddVolunteerDialog} onOpenChange={setShowAddVolunteerDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-volunteer">
                        <Plus className="h-4 w-4 mr-1" /> Add Volunteer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Volunteer</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-name">Name *</Label>
                          <Input 
                            id="volunteer-name" 
                            value={newVolunteer.name}
                            onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                            data-testid="input-volunteer-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-email">Email</Label>
                          <Input 
                            id="volunteer-email" 
                            type="email"
                            value={newVolunteer.email}
                            onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                            data-testid="input-volunteer-email"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-phone">Phone</Label>
                          <Input 
                            id="volunteer-phone" 
                            value={newVolunteer.phone}
                            onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                            data-testid="input-volunteer-phone"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-role">Role</Label>
                          <Input 
                            id="volunteer-role" 
                            value={newVolunteer.role}
                            onChange={(e) => setNewVolunteer({...newVolunteer, role: e.target.value})}
                            data-testid="input-volunteer-role"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-area">Assigned Area</Label>
                          <Input 
                            id="volunteer-area" 
                            value={newVolunteer.assignedArea}
                            onChange={(e) => setNewVolunteer({...newVolunteer, assignedArea: e.target.value})}
                            data-testid="input-volunteer-area"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="volunteer-shirt">Shirt Size</Label>
                          <Select value={newVolunteer.shirtSize} onValueChange={(value) => setNewVolunteer({...newVolunteer, shirtSize: value})}>
                            <SelectTrigger data-testid="select-volunteer-shirt">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="XS">XS</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                              <SelectItem value="2XL">2XL</SelectItem>
                              <SelectItem value="3XL">3XL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddVolunteerDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addVolunteerMutation.mutate(newVolunteer)}
                          disabled={!newVolunteer.name || addVolunteerMutation.isPending}
                          data-testid="button-save-volunteer"
                        >
                          {addVolunteerMutation.isPending ? "Saving..." : "Save Volunteer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {volunteers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No volunteers yet</p>
              ) : (
                <div className="space-y-4">
                  {volunteers.map((volunteer) => (
                    <div key={volunteer.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`volunteer-${volunteer.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-volunteer-name-${volunteer.id}`}>{volunteer.name}</p>
                        <p className="text-sm text-muted-foreground">{volunteer.role} - {volunteer.assignedArea || 'Unassigned'}</p>
                        {volunteer.email && <p className="text-sm text-muted-foreground">{volunteer.email}</p>}
                      </div>
                      <div className="text-right">
                        {volunteer.shirtSize && <p className="text-sm">Size: {volunteer.shirtSize}</p>}
                        <StatusBadge status={volunteer.checkedIn ? 'success' : 'outline'}>
                          {volunteer.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {staff.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No staff assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`staff-${member.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-staff-role-${member.id}`}>{member.role}</p>
                        <p className="text-sm text-muted-foreground">Assigned {format(new Date(member.assignedAt!), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {contractors.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No contractors assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {contractors.map((contractor) => (
                    <div key={contractor.id} className="p-4 border rounded-lg" data-testid={`contractor-${contractor.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium" data-testid={`text-contractor-name-${contractor.id}`}>{contractor.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-contractor-role-${contractor.id}`}>{contractor.role}</p>
                        </div>
                        <StatusBadge status={contractor.paymentStatus as any}>
                          {contractor.paymentStatus === 'unpaid' ? 'Unpaid' : 
                           contractor.paymentStatus === 'half_paid' ? 'Half Paid' : 'Paid'}
                        </StatusBadge>
                      </div>
                      {contractor.bioText && (
                        <p className="mt-2 text-sm">{contractor.bioText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graphics" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Graphics</h3>
                {canEdit && (
                  <Dialog open={showAddGraphicDialog} onOpenChange={setShowAddGraphicDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-graphic">
                        <Plus className="h-4 w-4 mr-1" /> Add Graphic
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Graphic</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="graphic-name">File Name *</Label>
                          <Input 
                            id="graphic-name" 
                            value={newGraphic.fileName}
                            onChange={(e) => setNewGraphic({...newGraphic, fileName: e.target.value})}
                            data-testid="input-graphic-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="graphic-url">File URL *</Label>
                          <Input 
                            id="graphic-url" 
                            value={newGraphic.fileUrl}
                            onChange={(e) => setNewGraphic({...newGraphic, fileUrl: e.target.value})}
                            data-testid="input-graphic-url"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="graphic-type">File Type</Label>
                          <Select value={newGraphic.fileType} onValueChange={(value) => setNewGraphic({...newGraphic, fileType: value})}>
                            <SelectTrigger data-testid="select-graphic-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="logo">Logo</SelectItem>
                              <SelectItem value="flyer">Flyer</SelectItem>
                              <SelectItem value="banner">Banner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="graphic-description">Description</Label>
                          <Textarea 
                            id="graphic-description" 
                            value={newGraphic.description}
                            onChange={(e) => setNewGraphic({...newGraphic, description: e.target.value})}
                            data-testid="input-graphic-description"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddGraphicDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addGraphicMutation.mutate(newGraphic)}
                          disabled={!newGraphic.fileName || !newGraphic.fileUrl || addGraphicMutation.isPending}
                          data-testid="button-save-graphic"
                        >
                          {addGraphicMutation.isPending ? "Saving..." : "Save Graphic"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {graphics.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No graphics yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {graphics.map((graphic) => (
                    <div key={graphic.id} className="border rounded-lg overflow-hidden" data-testid={`graphic-${graphic.id}`}>
                      {graphic.fileType === 'video' ? (
                        <div className="h-32 bg-muted flex items-center justify-center">
                          <i className="fas fa-video text-2xl text-muted-foreground"></i>
                        </div>
                      ) : (
                        <img src={graphic.thumbnailUrl || graphic.fileUrl} alt={graphic.fileName} className="h-32 w-full object-cover" />
                      )}
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">{graphic.fileName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{graphic.fileType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Venues</h3>
                {canEdit && (
                  <Dialog open={showAddVenueDialog} onOpenChange={setShowAddVenueDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-venue">
                        <Plus className="h-4 w-4 mr-1" /> Add Venue
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Venue</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                        <div className="grid gap-2">
                          <Label htmlFor="venue-name">Venue Name *</Label>
                          <Input id="venue-name" value={newVenue.venueName} onChange={(e) => setNewVenue({...newVenue, venueName: e.target.value})} data-testid="input-venue-name" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="venue-address">Address</Label>
                          <Input id="venue-address" value={newVenue.address} onChange={(e) => setNewVenue({...newVenue, address: e.target.value})} data-testid="input-venue-address" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="venue-city">City</Label>
                            <Input id="venue-city" value={newVenue.city} onChange={(e) => setNewVenue({...newVenue, city: e.target.value})} data-testid="input-venue-city" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="venue-state">State</Label>
                            <Input id="venue-state" value={newVenue.state} onChange={(e) => setNewVenue({...newVenue, state: e.target.value})} data-testid="input-venue-state" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="venue-capacity">Capacity</Label>
                            <Input id="venue-capacity" type="number" value={newVenue.capacity} onChange={(e) => setNewVenue({...newVenue, capacity: e.target.value})} data-testid="input-venue-capacity" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="venue-cost">Rental Cost ($)</Label>
                            <Input id="venue-cost" type="number" value={newVenue.rentalCost} onChange={(e) => setNewVenue({...newVenue, rentalCost: e.target.value})} data-testid="input-venue-cost" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="venue-contact">Contact Name</Label>
                          <Input id="venue-contact" value={newVenue.contactName} onChange={(e) => setNewVenue({...newVenue, contactName: e.target.value})} data-testid="input-venue-contact" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="venue-email">Contact Email</Label>
                          <Input id="venue-email" type="email" value={newVenue.contactEmail} onChange={(e) => setNewVenue({...newVenue, contactEmail: e.target.value})} data-testid="input-venue-email" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddVenueDialog(false)}>Cancel</Button>
                        <Button onClick={() => addVenueMutation.mutate(newVenue)} disabled={!newVenue.venueName || addVenueMutation.isPending} data-testid="button-save-venue">
                          {addVenueMutation.isPending ? "Saving..." : "Save Venue"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {venues.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No venues yet</p>
              ) : (
                <div className="space-y-4">
                  {venues.map((venue) => (
                    <div key={venue.id} className="p-4 border rounded-lg" data-testid={`venue-${venue.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-venue-name-${venue.id}`}>{venue.venueName}</p>
                        {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
                        {venue.city && venue.state && <p className="text-sm text-muted-foreground">{venue.city}, {venue.state}</p>}
                        {venue.capacity && <p className="text-sm text-muted-foreground">Capacity: {venue.capacity}</p>}
                      </div>
                      {venue.notes && <p className="mt-2 text-sm">{venue.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Schedule</h3>
                {canEdit && (
                  <Dialog open={showAddScheduleDialog} onOpenChange={setShowAddScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-schedule">
                        <Plus className="h-4 w-4 mr-1" /> Add Schedule Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Schedule Item</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                        <div className="grid gap-2">
                          <Label htmlFor="schedule-title">Title *</Label>
                          <Input id="schedule-title" value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} data-testid="input-schedule-title" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="schedule-description">Description</Label>
                          <Textarea id="schedule-description" value={newSchedule.description} onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})} data-testid="input-schedule-description" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="schedule-start">Start Time</Label>
                            <Input id="schedule-start" type="datetime-local" value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} data-testid="input-schedule-start" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="schedule-end">End Time</Label>
                            <Input id="schedule-end" type="datetime-local" value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} data-testid="input-schedule-end" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="schedule-location">Location</Label>
                          <Input id="schedule-location" value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})} data-testid="input-schedule-location" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="schedule-type">Activity Type</Label>
                          <Select value={newSchedule.activityType} onValueChange={(value) => setNewSchedule({...newSchedule, activityType: value})}>
                            <SelectTrigger data-testid="select-schedule-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="session">Session</SelectItem>
                              <SelectItem value="break">Break</SelectItem>
                              <SelectItem value="keynote">Keynote</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="networking">Networking</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="schedule-speaker">Speaker Name</Label>
                          <Input id="schedule-speaker" value={newSchedule.speakerName} onChange={(e) => setNewSchedule({...newSchedule, speakerName: e.target.value})} data-testid="input-schedule-speaker" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddScheduleDialog(false)}>Cancel</Button>
                        <Button onClick={() => addScheduleMutation.mutate(newSchedule)} disabled={!newSchedule.title || addScheduleMutation.isPending} data-testid="button-save-schedule">
                          {addScheduleMutation.isPending ? "Saving..." : "Save Schedule Item"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {schedules.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No schedule items yet</p>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="p-4 border rounded-lg" data-testid={`schedule-${schedule.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium" data-testid={`text-schedule-title-${schedule.id}`}>{schedule.title}</p>
                          {schedule.startTime && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(schedule.startTime), "MMM d, yyyy h:mm a")}
                              {schedule.endTime && ` - ${format(new Date(schedule.endTime), "h:mm a")}`}
                            </p>
                          )}
                          {schedule.location && <p className="text-sm text-muted-foreground">Location: {schedule.location}</p>}
                        </div>
                      </div>
                      {schedule.description && <p className="mt-2 text-sm">{schedule.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Equipment</h3>
                {canEdit && (
                  <Dialog open={showAddEquipmentDialog} onOpenChange={setShowAddEquipmentDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-equipment">
                        <Plus className="h-4 w-4 mr-1" /> Add Equipment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Equipment</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-name">Item Name *</Label>
                          <Input 
                            id="equipment-name" 
                            value={newEquipment.itemName}
                            onChange={(e) => setNewEquipment({...newEquipment, itemName: e.target.value})}
                            data-testid="input-equipment-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-quantity">Quantity</Label>
                          <Input 
                            id="equipment-quantity" 
                            type="number"
                            value={newEquipment.quantity}
                            onChange={(e) => setNewEquipment({...newEquipment, quantity: e.target.value})}
                            data-testid="input-equipment-quantity"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-category">Category</Label>
                          <Input 
                            id="equipment-category" 
                            value={newEquipment.category}
                            onChange={(e) => setNewEquipment({...newEquipment, category: e.target.value})}
                            data-testid="input-equipment-category"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-cost">Rental Cost ($)</Label>
                          <Input 
                            id="equipment-cost" 
                            type="number"
                            value={newEquipment.rentalCost}
                            onChange={(e) => setNewEquipment({...newEquipment, rentalCost: e.target.value})}
                            data-testid="input-equipment-cost"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipment-status">Status</Label>
                          <Select value={newEquipment.status} onValueChange={(value) => setNewEquipment({...newEquipment, status: value})}>
                            <SelectTrigger data-testid="select-equipment-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="picked_up">Picked Up</SelectItem>
                              <SelectItem value="returned">Returned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddEquipmentDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addEquipmentMutation.mutate(newEquipment)}
                          disabled={!newEquipment.itemName || addEquipmentMutation.isPending}
                          data-testid="button-save-equipment"
                        >
                          {addEquipmentMutation.isPending ? "Saving..." : "Save Equipment"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {equipment.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No equipment yet</p>
              ) : (
                <div className="space-y-4">
                  {equipment.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`equipment-${item.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-equipment-name-${item.id}`}>{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                        {item.category && <p className="text-sm text-muted-foreground">Category: {item.category}</p>}
                      </div>
                      <div className="text-right">
                        {item.rentalCost && <p className="font-medium">${item.rentalCost}</p>}
                        <StatusBadge status={item.status as any}>
                          {item.status === 'reserved' ? 'Reserved' : item.status === 'picked_up' ? 'Picked Up' : item.status === 'returned' ? 'Returned' : item.status === 'damaged' ? 'Damaged' : 'Pending'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Travel Arrangements</h3>
                {canEdit && (
                  <Dialog open={showAddTravelDialog} onOpenChange={setShowAddTravelDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-travel">
                        <Plus className="h-4 w-4 mr-1" /> Add Travel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Travel Arrangement</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                        <div className="grid gap-2">
                          <Label htmlFor="travel-name">Traveler Name *</Label>
                          <Input id="travel-name" value={newTravel.travelerName} onChange={(e) => setNewTravel({...newTravel, travelerName: e.target.value})} data-testid="input-travel-name" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="travel-type">Traveler Type</Label>
                          <Select value={newTravel.travelerType} onValueChange={(value) => setNewTravel({...newTravel, travelerType: value})}>
                            <SelectTrigger data-testid="select-travel-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="speaker">Speaker</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="travel-arrival">Flight Arrival</Label>
                            <Input id="travel-arrival" type="datetime-local" value={newTravel.flightArrival} onChange={(e) => setNewTravel({...newTravel, flightArrival: e.target.value})} data-testid="input-travel-arrival" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="travel-departure">Flight Departure</Label>
                            <Input id="travel-departure" type="datetime-local" value={newTravel.flightDeparture} onChange={(e) => setNewTravel({...newTravel, flightDeparture: e.target.value})} data-testid="input-travel-departure" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="travel-hotel">Hotel Name</Label>
                          <Input id="travel-hotel" value={newTravel.hotelName} onChange={(e) => setNewTravel({...newTravel, hotelName: e.target.value})} data-testid="input-travel-hotel" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="travel-checkin">Check-In</Label>
                            <Input id="travel-checkin" type="date" value={newTravel.hotelCheckIn} onChange={(e) => setNewTravel({...newTravel, hotelCheckIn: e.target.value})} data-testid="input-travel-checkin" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="travel-checkout">Check-Out</Label>
                            <Input id="travel-checkout" type="date" value={newTravel.hotelCheckOut} onChange={(e) => setNewTravel({...newTravel, hotelCheckOut: e.target.value})} data-testid="input-travel-checkout" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="travel-cost">Total Cost ($)</Label>
                          <Input id="travel-cost" type="number" value={newTravel.totalCost} onChange={(e) => setNewTravel({...newTravel, totalCost: e.target.value})} data-testid="input-travel-cost" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="travel-notes">Notes</Label>
                          <Textarea id="travel-notes" value={newTravel.notes} onChange={(e) => setNewTravel({...newTravel, notes: e.target.value})} data-testid="input-travel-notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddTravelDialog(false)}>Cancel</Button>
                        <Button onClick={() => addTravelMutation.mutate(newTravel)} disabled={!newTravel.travelerName || addTravelMutation.isPending} data-testid="button-save-travel">
                          {addTravelMutation.isPending ? "Saving..." : "Save Travel"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {travel.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No travel arrangements yet</p>
              ) : (
                <div className="space-y-4">
                  {travel.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg" data-testid={`travel-${item.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium" data-testid={`text-travel-traveler-${item.id}`}>{item.travelerName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{item.travelerType}</p>
                          {item.flightArrival && (
                            <p className="text-sm text-muted-foreground">
                              Arrives: {format(new Date(item.flightArrival), "MMM d, yyyy h:mm a")}
                            </p>
                          )}
                          {item.flightDeparture && (
                            <p className="text-sm text-muted-foreground">
                              Departs: {format(new Date(item.flightDeparture), "MMM d, yyyy h:mm a")}
                            </p>
                          )}
                          {item.hotelName && <p className="text-sm text-muted-foreground">Hotel: {item.hotelName}</p>}
                        </div>
                        <div className="text-right">
                          {item.totalCost && <p className="font-medium">${item.totalCost}</p>}
                          <StatusBadge status={item.reimbursementStatus as any}>
                            {item.reimbursementStatus === 'pending' ? 'Pending' : item.reimbursementStatus === 'approved' ? 'Approved' : 'Reimbursed'}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Tasks</h3>
                {canEdit && (
                  <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-task">
                        <Plus className="h-4 w-4 mr-1" /> Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Task</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="task-title">Title *</Label>
                          <Input 
                            id="task-title" 
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                            data-testid="input-task-title"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-description">Description</Label>
                          <Textarea 
                            id="task-description" 
                            value={newTask.description}
                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                            data-testid="input-task-description"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-assigned">Assigned To</Label>
                          <Input 
                            id="task-assigned" 
                            value={newTask.assignedTo}
                            onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                            data-testid="input-task-assigned"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-due">Due Date</Label>
                          <Input 
                            id="task-due" 
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                            data-testid="input-task-due"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                            <SelectTrigger data-testid="select-task-priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-status">Status</Label>
                          <Select value={newTask.status} onValueChange={(value) => setNewTask({...newTask, status: value})}>
                            <SelectTrigger data-testid="select-task-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addTaskMutation.mutate(newTask)}
                          disabled={!newTask.title || addTaskMutation.isPending}
                          data-testid="button-save-task"
                        >
                          {addTaskMutation.isPending ? "Saving..." : "Save Task"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {eventTasks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No tasks yet</p>
              ) : (
                <div className="space-y-4">
                  {eventTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`task-${task.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-task-title-${task.id}`}>{task.title}</p>
                        {task.assignedTo && <p className="text-sm text-muted-foreground">Assigned to: {task.assignedTo}</p>}
                        {task.dueDate && (
                          <p className="text-sm text-muted-foreground">Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <StatusBadge status={task.status as any}>
                          {task.status === 'pending' ? 'Pending' : task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </StatusBadge>
                        {task.priority && (
                          <p className="text-xs text-muted-foreground capitalize mt-1">{task.priority} Priority</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Documents</h3>
                {canEdit && (
                  <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-document">
                        <Plus className="h-4 w-4 mr-1" /> Add Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Document</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="document-name">File Name *</Label>
                          <Input id="document-name" value={newDocument.fileName} onChange={(e) => setNewDocument({...newDocument, fileName: e.target.value})} data-testid="input-document-name" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="document-url">File URL *</Label>
                          <Input id="document-url" value={newDocument.fileUrl} onChange={(e) => setNewDocument({...newDocument, fileUrl: e.target.value})} data-testid="input-document-url" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="document-type">Document Type</Label>
                          <Select value={newDocument.documentType} onValueChange={(value) => setNewDocument({...newDocument, documentType: value})}>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="invoice">Invoice</SelectItem>
                              <SelectItem value="permit">Permit</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="schedule">Schedule</SelectItem>
                              <SelectItem value="map">Map</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="document-notes">Notes</Label>
                          <Textarea id="document-notes" value={newDocument.notes} onChange={(e) => setNewDocument({...newDocument, notes: e.target.value})} data-testid="input-document-notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDocumentDialog(false)}>Cancel</Button>
                        <Button onClick={() => addDocumentMutation.mutate(newDocument)} disabled={!newDocument.fileName || !newDocument.fileUrl || addDocumentMutation.isPending} data-testid="button-save-document">
                          {addDocumentMutation.isPending ? "Saving..." : "Save Document"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {documents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No documents yet</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`document-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <i className="fas fa-file text-xl text-muted-foreground"></i>
                        <div>
                          <p className="font-medium" data-testid={`text-document-name-${doc.id}`}>{doc.fileName}</p>
                          {doc.documentType && <p className="text-sm text-muted-foreground capitalize">{doc.documentType}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <Button variant="outline" size="sm" asChild data-testid={`button-download-document-${doc.id}`}>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <i className="fas fa-download mr-2"></i>
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {budgets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No budget items yet</p>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`budget-${budget.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-budget-category-${budget.id}`}>{budget.categoryName}</p>
                        <p className="text-sm text-muted-foreground">
                          Budgeted: ${budget.budgetedAmount} | Actual: ${budget.actualAmount || "0.00"}
                        </p>
                      </div>
                      <StatusBadge status={budget.approvalStatus as any}>
                        {budget.approvalStatus === 'pending' ? 'Pending' : 
                         budget.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket-tiers" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ticket Tiers</h3>
                {canEdit && (
                  <Dialog open={showAddTicketTierDialog} onOpenChange={setShowAddTicketTierDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-ticket-tier">
                        <Plus className="h-4 w-4 mr-1" /> Add Ticket Tier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Ticket Tier</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tier-name">Tier Name *</Label>
                          <Input id="tier-name" value={newTicketTier.tierName} onChange={(e) => setNewTicketTier({...newTicketTier, tierName: e.target.value})} data-testid="input-tier-name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="tier-price">Price ($) *</Label>
                            <Input id="tier-price" type="number" step="0.01" value={newTicketTier.price} onChange={(e) => setNewTicketTier({...newTicketTier, price: e.target.value})} data-testid="input-tier-price" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="tier-capacity">Capacity</Label>
                            <Input id="tier-capacity" type="number" value={newTicketTier.capacity} onChange={(e) => setNewTicketTier({...newTicketTier, capacity: e.target.value})} placeholder="Unlimited" data-testid="input-tier-capacity" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="tier-description">Description</Label>
                          <Textarea id="tier-description" value={newTicketTier.description} onChange={(e) => setNewTicketTier({...newTicketTier, description: e.target.value})} data-testid="input-tier-description" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddTicketTierDialog(false)}>Cancel</Button>
                        <Button onClick={() => addTicketTierMutation.mutate(newTicketTier)} disabled={!newTicketTier.tierName || !newTicketTier.price || addTicketTierMutation.isPending} data-testid="button-save-ticket-tier">
                          {addTicketTierMutation.isPending ? "Saving..." : "Save Ticket Tier"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {ticketTiers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No ticket tiers yet</p>
              ) : (
                <div className="space-y-4">
                  {ticketTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`ticket-tier-${tier.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-ticket-tier-name-${tier.id}`}>{tier.tierName}</p>
                        <p className="text-sm text-muted-foreground">
                          {tier.soldCount || 0} / {tier.capacity || 'Unlimited'} sold
                        </p>
                        {tier.description && <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">${tier.price || '0.00'}</p>
                        <StatusBadge status={tier.isActive ? 'success' : 'outline'}>
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Expenses</h3>
                {canEdit && (
                  <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-expense">
                        <Plus className="h-4 w-4 mr-1" /> Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="expense-description">Description *</Label>
                          <Input 
                            id="expense-description" 
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                            data-testid="input-expense-description"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="expense-amount">Amount ($)</Label>
                          <Input 
                            id="expense-amount" 
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                            data-testid="input-expense-amount"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="expense-category">Category</Label>
                          <Select value={newExpense.expenseCategory} onValueChange={(value) => setNewExpense({...newExpense, expenseCategory: value})}>
                            <SelectTrigger data-testid="select-expense-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="venue">Venue</SelectItem>
                              <SelectItem value="catering">Catering</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="travel">Travel</SelectItem>
                              <SelectItem value="supplies">Supplies</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="expense-vendor">Vendor</Label>
                          <Input 
                            id="expense-vendor" 
                            value={newExpense.vendor}
                            onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                            data-testid="input-expense-vendor"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="expense-status">Status</Label>
                          <Select value={newExpense.status} onValueChange={(value) => setNewExpense({...newExpense, status: value})}>
                            <SelectTrigger data-testid="select-expense-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="reimbursed">Reimbursed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddExpenseDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addExpenseMutation.mutate(newExpense)}
                          disabled={!newExpense.description || !newExpense.amount || addExpenseMutation.isPending}
                          data-testid="button-save-expense"
                        >
                          {addExpenseMutation.isPending ? "Saving..." : "Save Expense"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {expenses.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No expenses yet</p>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`expense-${expense.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-expense-description-${expense.id}`}>{expense.description}</p>
                        {expense.expenseCategory && <p className="text-sm text-muted-foreground capitalize">{expense.expenseCategory}</p>}
                        {expense.vendor && <p className="text-sm text-muted-foreground">Vendor: {expense.vendor}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${expense.amount || '0.00'}</p>
                        <StatusBadge status={expense.status as any}>
                          {expense.status === 'pending' ? 'Pending' : expense.status === 'approved' ? 'Approved' : expense.status === 'paid' ? 'Paid' : 'Reimbursed'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {campaigns.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No campaigns yet</p>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg" data-testid={`campaign-${campaign.id}`}>
                      <p className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.campaignName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{campaign.campaignType}</p>
                      {campaign.scheduledAt && (
                        <p className="text-sm mt-1">Scheduled: {format(new Date(campaign.scheduledAt), "MMM d, yyyy h:mm a")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {registrations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No registrations yet</p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`registration-${registration.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-registration-name-${registration.id}`}>{registration.attendeeName}</p>
                        <p className="text-sm text-muted-foreground">{registration.attendeeEmail}</p>
                        {registration.ticketType && (
                          <p className="text-sm mt-1">Ticket: {registration.ticketType}</p>
                        )}
                      </div>
                      <StatusBadge status={registration.paymentStatus as any}>
                        {registration.paymentStatus === 'pending' ? 'Pending' : 
                         registration.paymentStatus === 'paid' ? 'Paid' : 'Refunded'}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Notes</h3>
                {canEdit && (
                  <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-note">
                        <Plus className="h-4 w-4 mr-1" /> Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="note-title">Title</Label>
                          <Input 
                            id="note-title" 
                            value={newNote.title}
                            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                            data-testid="input-note-title"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="note-content">Content *</Label>
                          <Textarea 
                            id="note-content" 
                            value={newNote.content}
                            onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                            data-testid="input-note-content"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="note-type">Type</Label>
                          <Select value={newNote.noteType} onValueChange={(value) => setNewNote({...newNote, noteType: value})}>
                            <SelectTrigger data-testid="select-note-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="logistics">Logistics</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="follow_up">Follow Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddNoteDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addNoteMutation.mutate(newNote)}
                          disabled={!newNote.content || addNoteMutation.isPending}
                          data-testid="button-save-note"
                        >
                          {addNoteMutation.isPending ? "Saving..." : "Save Note"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {notes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No notes yet</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg" data-testid={`note-${note.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {note.title && <p className="font-medium" data-testid={`text-note-title-${note.id}`}>{note.title}</p>}
                          <p className="text-sm mt-1">{note.content}</p>
                        </div>
                        {note.createdAt && (
                          <p className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      {note.noteType && (
                        <p className="text-xs text-muted-foreground mt-2 capitalize">Type: {note.noteType}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Checklists</h3>
                {canEdit && (
                  <Dialog open={showAddChecklistDialog} onOpenChange={setShowAddChecklistDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-checklist">
                        <Plus className="h-4 w-4 mr-1" /> Add Checklist Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Checklist Item</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="checklist-text">Item Text *</Label>
                          <Input 
                            id="checklist-text" 
                            value={newChecklist.itemText}
                            onChange={(e) => setNewChecklist({...newChecklist, itemText: e.target.value})}
                            data-testid="input-checklist-text"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="checklist-type">Type</Label>
                          <Select value={newChecklist.checklistType} onValueChange={(value) => setNewChecklist({...newChecklist, checklistType: value})}>
                            <SelectTrigger data-testid="select-checklist-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre_event">Pre-Event</SelectItem>
                              <SelectItem value="during_event">During Event</SelectItem>
                              <SelectItem value="post_event">Post-Event</SelectItem>
                              <SelectItem value="setup">Setup</SelectItem>
                              <SelectItem value="teardown">Teardown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="checklist-notes">Notes</Label>
                          <Textarea 
                            id="checklist-notes" 
                            value={newChecklist.notes}
                            onChange={(e) => setNewChecklist({...newChecklist, notes: e.target.value})}
                            data-testid="input-checklist-notes"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddChecklistDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addChecklistMutation.mutate(newChecklist)}
                          disabled={!newChecklist.itemText || addChecklistMutation.isPending}
                          data-testid="button-save-checklist"
                        >
                          {addChecklistMutation.isPending ? "Saving..." : "Save Checklist Item"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {checklists.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No checklists yet</p>
              ) : (
                <div className="space-y-4">
                  {checklists.map((checklist) => (
                    <div key={checklist.id} className="p-4 border rounded-lg" data-testid={`checklist-${checklist.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${checklist.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {checklist.isCompleted && <i className="fas fa-check text-white text-xs"></i>}
                          </div>
                          <div>
                            <p className={`font-medium ${checklist.isCompleted ? 'line-through text-muted-foreground' : ''}`} data-testid={`text-checklist-item-${checklist.id}`}>
                              {checklist.itemText}
                            </p>
                            {checklist.checklistType && <p className="text-sm text-muted-foreground capitalize">{checklist.checklistType.replace('_', ' ')}</p>}
                          </div>
                        </div>
                      </div>
                      {checklist.notes && <p className="text-sm text-muted-foreground mt-2 ml-8">{checklist.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
