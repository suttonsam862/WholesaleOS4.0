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
import { Plus, Upload, Pencil, Trash2, Link2, Copy, Check, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { hasPermission } from "@/lib/permissions";
import { FileDropZone } from "@/components/ui/file-drop-zone";
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
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAddContractorDialog, setShowAddContractorDialog] = useState(false);
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
  const [customerLinkCopied, setCustomerLinkCopied] = useState(false);

  const copyCustomerLink = () => {
    const portalLink = `${window.location.origin}/customer-event-portal/${eventId}`;
    navigator.clipboard.writeText(portalLink);
    setCustomerLinkCopied(true);
    toast({ title: "Link Copied!", description: "Customer event portal link copied to clipboard." });
    setTimeout(() => setCustomerLinkCopied(false), 2000);
  };

  const openCustomerPortal = () => {
    window.open(`/customer-event-portal/${eventId}`, '_blank', 'noopener,noreferrer');
  };

  const [newSponsor, setNewSponsor] = useState({
    name: "",
    tier: "bronze",
    amount: "",
    contactName: "",
    contactEmail: "",
    benefits: "",
  });

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [newContractor, setNewContractor] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    contractType: "flat_fee" as "flat_fee" | "per_day" | "commission",
    paymentAmount: "",
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
  const [selectedGraphicFile, setSelectedGraphicFile] = useState<File | null>(null);
  const [graphicUploading, setGraphicUploading] = useState(false);

  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);

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

  const addStaffMutation = useMutation({
    mutationFn: async (data: typeof newStaff) => {
      return apiRequest(`/api/events/${eventId}/staff`, {
        method: "POST",
        body: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "staff"] });
      setShowAddStaffDialog(false);
      setNewStaff({ name: "", email: "", phone: "", role: "" });
      toast({ title: "Staff member added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add staff member", variant: "destructive" });
    },
  });

  const addContractorMutation = useMutation({
    mutationFn: async (data: typeof newContractor) => {
      return apiRequest(`/api/events/${eventId}/contractors`, {
        method: "POST",
        body: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
          contractType: data.contractType,
          paymentAmount: data.paymentAmount || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "contractors"] });
      setShowAddContractorDialog(false);
      setNewContractor({ name: "", email: "", phone: "", role: "", contractType: "flat_fee", paymentAmount: "" });
      toast({ title: "Contractor added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add contractor", variant: "destructive" });
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
      setSelectedGraphicFile(null);
      toast({ title: "Graphic added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add graphic", variant: "destructive" });
    },
  });

  const handleGraphicFileSelect = async (file: File) => {
    setSelectedGraphicFile(file);
    setNewGraphic(prev => ({ ...prev, fileName: file.name }));
    
    setGraphicUploading(true);
    try {
      const response = await apiRequest('/api/upload/image', {
        method: 'POST',
        body: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        },
      }) as { uploadURL: string; uploadId: string; sanitizedFilename: string };
      
      await fetch(response.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      const fileUrl = `/public-objects/${response.uploadId}`;
      setNewGraphic(prev => ({ ...prev, fileUrl, fileName: response.sanitizedFilename }));
    } catch (error) {
      console.error('Error uploading graphic:', error);
      toast({ title: "Failed to upload file", variant: "destructive" });
      setSelectedGraphicFile(null);
      setNewGraphic(prev => ({ ...prev, fileName: "", fileUrl: "" }));
    } finally {
      setGraphicUploading(false);
    }
  };

  const handleDocumentFileSelect = async (file: File) => {
    setSelectedDocumentFile(file);
    setNewDocument(prev => ({ ...prev, fileName: file.name }));
    
    setDocumentUploading(true);
    try {
      const response = await apiRequest('/api/upload/file', {
        method: 'POST',
        body: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        },
      }) as { uploadURL: string; uploadId: string; sanitizedFilename: string };
      
      await fetch(response.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      const fileUrl = `/public-objects/${response.uploadId}`;
      setNewDocument(prev => ({ ...prev, fileUrl, fileName: response.sanitizedFilename }));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: "Failed to upload file", variant: "destructive" });
      setSelectedDocumentFile(null);
      setNewDocument(prev => ({ ...prev, fileName: "", fileUrl: "" }));
    } finally {
      setDocumentUploading(false);
    }
  };

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
      if (!data.startTime) {
        throw new Error("Start time is required");
      }
      return apiRequest(`/api/events/${eventId}/schedules`, {
        method: "POST",
        body: {
          title: data.title,
          description: data.description || null,
          startTime: new Date(data.startTime).toISOString(),
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
    onError: (error) => {
      toast({ title: error.message || "Failed to add schedule item", variant: "destructive" });
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

  // Editing state for Staff, Contractors, Volunteers, and Sponsors
  const [editingStaff, setEditingStaff] = useState<EventStaff | null>(null);
  const [editingContractor, setEditingContractor] = useState<EventContractor | null>(null);
  const [editingVolunteer, setEditingVolunteer] = useState<EventVolunteer | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<EventSponsor | null>(null);

  // Editing state for Graphics, Documents, Venues, and Schedules
  const [editingGraphic, setEditingGraphic] = useState<EventGraphic | null>(null);
  const [editingDocument, setEditingDocument] = useState<EventDocument | null>(null);
  const [editingVenue, setEditingVenue] = useState<EventVenue | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<EventSchedule | null>(null);

  // Editing state for Equipment, Travel, and Budget
  const [editingEquipment, setEditingEquipment] = useState<EventEquipment | null>(null);
  const [editingTravel, setEditingTravel] = useState<EventTravel | null>(null);
  const [editingBudget, setEditingBudget] = useState<EventBudget | null>(null);

  const [editingCampaign, setEditingCampaign] = useState<EventCampaign | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<EventRegistration | null>(null);
  const [editingNote, setEditingNote] = useState<EventNote | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<EventChecklist | null>(null);
  const [editingTicketTier, setEditingTicketTier] = useState<EventTicketTier | null>(null);
  const [editingExpense, setEditingExpense] = useState<EventExpense | null>(null);

  // Edit mutations
  const editStaffMutation = useMutation({
    mutationFn: async (data: EventStaff) => {
      return apiRequest(`/api/events/staff/${data.id}`, {
        method: "PUT",
        body: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "staff"] });
      setEditingStaff(null);
      toast({ title: "Staff member updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update staff member", variant: "destructive" });
    },
  });

  const editContractorMutation = useMutation({
    mutationFn: async (data: EventContractor) => {
      return apiRequest(`/api/events/contractors/${data.id}`, {
        method: "PUT",
        body: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
          contractType: data.contractType,
          paymentAmount: data.paymentAmount || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "contractors"] });
      setEditingContractor(null);
      toast({ title: "Contractor updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update contractor", variant: "destructive" });
    },
  });

  const editVolunteerMutation = useMutation({
    mutationFn: async (data: EventVolunteer) => {
      return apiRequest(`/api/events/volunteers/${data.id}`, {
        method: "PUT",
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
      setEditingVolunteer(null);
      toast({ title: "Volunteer updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update volunteer", variant: "destructive" });
    },
  });

  const editSponsorMutation = useMutation({
    mutationFn: async (data: EventSponsor) => {
      return apiRequest(`/api/events/sponsors/${data.id}`, {
        method: "PUT",
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
      setEditingSponsor(null);
      toast({ title: "Sponsor updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update sponsor", variant: "destructive" });
    },
  });

  // Edit mutations for Graphics, Documents, Venues, and Schedules
  const editGraphicMutation = useMutation({
    mutationFn: async (data: EventGraphic) => {
      return apiRequest(`/api/events/graphics/${data.id}`, {
        method: "PUT",
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
      setEditingGraphic(null);
      toast({ title: "Graphic updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update graphic", variant: "destructive" });
    },
  });

  const editDocumentMutation = useMutation({
    mutationFn: async (data: EventDocument) => {
      return apiRequest(`/api/events/documents/${data.id}`, {
        method: "PUT",
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
      setEditingDocument(null);
      toast({ title: "Document updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    },
  });

  const editVenueMutation = useMutation({
    mutationFn: async (data: EventVenue) => {
      return apiRequest(`/api/events/venues/${data.id}`, {
        method: "PUT",
        body: {
          venueName: data.venueName,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          capacity: data.capacity || null,
          rentalCost: data.rentalCost || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "venues"] });
      setEditingVenue(null);
      toast({ title: "Venue updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update venue", variant: "destructive" });
    },
  });

  const editScheduleMutation = useMutation({
    mutationFn: async (data: EventSchedule) => {
      const formatDateTime = (val: string | Date | null | undefined): string | null => {
        if (!val) return null;
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'string') return new Date(val).toISOString();
        return null;
      };
      const startTimeFormatted = formatDateTime(data.startTime);
      if (!startTimeFormatted) {
        throw new Error("Start time is required");
      }
      return apiRequest(`/api/events/schedules/${data.id}`, {
        method: "PUT",
        body: {
          title: data.title,
          description: data.description || null,
          startTime: startTimeFormatted,
          endTime: formatDateTime(data.endTime),
          location: data.location || null,
          activityType: data.activityType || null,
          speakerName: data.speakerName || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "schedules"] });
      setEditingSchedule(null);
      toast({ title: "Schedule item updated successfully" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to update schedule item", variant: "destructive" });
    },
  });

  // Edit mutations for Equipment, Travel, and Budget
  const editEquipmentMutation = useMutation({
    mutationFn: async (data: EventEquipment) => {
      return apiRequest(`/api/events/equipment/${data.id}`, {
        method: "PUT",
        body: {
          itemName: data.itemName,
          quantity: data.quantity || 1,
          category: data.category || null,
          rentalCost: data.rentalCost || null,
          status: data.status || 'reserved',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "equipment"] });
      setEditingEquipment(null);
      toast({ title: "Equipment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update equipment", variant: "destructive" });
    },
  });

  const editTravelMutation = useMutation({
    mutationFn: async (data: EventTravel) => {
      const formatDateTime = (val: string | Date | null | undefined): string | null => {
        if (!val) return null;
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'string') return new Date(val).toISOString();
        return null;
      };
      return apiRequest(`/api/events/travel/${data.id}`, {
        method: "PUT",
        body: {
          travelerName: data.travelerName,
          travelerType: data.travelerType || 'custom',
          flightArrival: formatDateTime(data.flightArrival),
          flightDeparture: formatDateTime(data.flightDeparture),
          hotelName: data.hotelName || null,
          hotelCheckIn: formatDateTime(data.hotelCheckIn),
          hotelCheckOut: formatDateTime(data.hotelCheckOut),
          totalCost: data.totalCost || null,
          notes: data.notes || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "travel"] });
      setEditingTravel(null);
      toast({ title: "Travel arrangement updated successfully" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to update travel arrangement", variant: "destructive" });
    },
  });

  const editBudgetMutation = useMutation({
    mutationFn: async (data: EventBudget) => {
      return apiRequest(`/api/events/budgets/${data.id}`, {
        method: "PUT",
        body: {
          categoryName: data.categoryName,
          budgetedAmount: data.budgetedAmount,
          actualAmount: data.actualAmount || null,
          notes: data.notes || null,
          approvalStatus: data.approvalStatus || 'pending',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "budgets"] });
      setEditingBudget(null);
      toast({ title: "Budget item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update budget item", variant: "destructive" });
    },
  });

  const editCampaignMutation = useMutation({
    mutationFn: async (data: EventCampaign) => {
      return apiRequest(`/api/events/campaigns/${data.id}`, {
        method: "PUT",
        body: {
          campaignName: data.campaignName,
          campaignType: data.campaignType || 'email',
          content: data.content || null,
          scheduledAt: data.scheduledAt || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "campaigns"] });
      setEditingCampaign(null);
      toast({ title: "Campaign updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
    },
  });

  const editRegistrationMutation = useMutation({
    mutationFn: async (data: EventRegistration) => {
      return apiRequest(`/api/events/registrations/${data.id}`, {
        method: "PUT",
        body: {
          attendeeName: data.attendeeName,
          attendeeEmail: data.attendeeEmail,
          attendeePhone: data.attendeePhone || null,
          ticketType: data.ticketType || null,
          paymentStatus: data.paymentStatus || 'pending',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
      setEditingRegistration(null);
      toast({ title: "Registration updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update registration", variant: "destructive" });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async (data: EventNote) => {
      return apiRequest(`/api/events/notes/${data.id}`, {
        method: "PUT",
        body: {
          title: data.title || null,
          content: data.content,
          noteType: data.noteType || 'general',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "notes"] });
      setEditingNote(null);
      toast({ title: "Note updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    },
  });

  const editChecklistMutation = useMutation({
    mutationFn: async (data: EventChecklist) => {
      return apiRequest(`/api/events/checklists/${data.id}`, {
        method: "PUT",
        body: {
          itemText: data.itemText,
          checklistType: data.checklistType || 'pre_event',
          notes: data.notes || null,
          isCompleted: data.isCompleted || false,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "checklists"] });
      setEditingChecklist(null);
      toast({ title: "Checklist item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update checklist item", variant: "destructive" });
    },
  });

  const editTicketTierMutation = useMutation({
    mutationFn: async (data: EventTicketTier) => {
      return apiRequest(`/api/events/ticket-tiers/${data.id}`, {
        method: "PUT",
        body: {
          tierName: data.tierName,
          price: data.price,
          capacity: data.capacity || null,
          description: data.description || null,
          isActive: data.isActive ?? true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-tiers"] });
      setEditingTicketTier(null);
      toast({ title: "Ticket tier updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update ticket tier", variant: "destructive" });
    },
  });

  const editExpenseMutation = useMutation({
    mutationFn: async (data: EventExpense) => {
      return apiRequest(`/api/events/expenses/${data.id}`, {
        method: "PUT",
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
      setEditingExpense(null);
      toast({ title: "Expense updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update expense", variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/staff/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "staff"] });
      toast({ title: "Staff member deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete staff member", variant: "destructive" });
    },
  });

  const deleteContractorMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/contractors/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "contractors"] });
      toast({ title: "Contractor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete contractor", variant: "destructive" });
    },
  });

  const deleteVolunteerMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/volunteers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "volunteers"] });
      toast({ title: "Volunteer deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete volunteer", variant: "destructive" });
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/sponsors/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "sponsors"] });
      toast({ title: "Sponsor deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete sponsor", variant: "destructive" });
    },
  });

  // Delete mutations for Graphics, Documents, Venues, and Schedules
  const deleteGraphicMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/graphics/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "graphics"] });
      toast({ title: "Graphic deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete graphic", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/documents/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "documents"] });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/venues/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "venues"] });
      toast({ title: "Venue deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete venue", variant: "destructive" });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/schedules/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "schedules"] });
      toast({ title: "Schedule item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete schedule item", variant: "destructive" });
    },
  });

  // Delete mutations for Equipment, Travel, and Budget
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/equipment/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "equipment"] });
      toast({ title: "Equipment deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete equipment", variant: "destructive" });
    },
  });

  const deleteTravelMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/travel/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "travel"] });
      toast({ title: "Travel arrangement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete travel arrangement", variant: "destructive" });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/budgets/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "budgets"] });
      toast({ title: "Budget item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete budget item", variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/campaigns/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "campaigns"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/registrations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
      toast({ title: "Registration deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete registration", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/notes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "notes"] });
      toast({ title: "Note deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/checklists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "checklists"] });
      toast({ title: "Checklist item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete checklist item", variant: "destructive" });
    },
  });

  const deleteTicketTierMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/ticket-tiers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-tiers"] });
      toast({ title: "Ticket tier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ticket tier", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/events/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  // Delete handlers with confirmation
  const handleDeleteStaff = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete staff member "${name}"?`)) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleDeleteContractor = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete contractor "${name}"?`)) {
      deleteContractorMutation.mutate(id);
    }
  };

  const handleDeleteVolunteer = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete volunteer "${name}"?`)) {
      deleteVolunteerMutation.mutate(id);
    }
  };

  const handleDeleteSponsor = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete sponsor "${name}"?`)) {
      deleteSponsorMutation.mutate(id);
    }
  };

  // Delete handlers for Graphics, Documents, Venues, and Schedules
  const handleDeleteGraphic = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete graphic "${name}"?`)) {
      deleteGraphicMutation.mutate(id);
    }
  };

  const handleDeleteDocument = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete document "${name}"?`)) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleDeleteVenue = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete venue "${name}"?`)) {
      deleteVenueMutation.mutate(id);
    }
  };

  const handleDeleteSchedule = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete schedule item "${name}"?`)) {
      deleteScheduleMutation.mutate(id);
    }
  };

  // Delete handlers for Equipment, Travel, and Budget
  const handleDeleteEquipment = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete equipment "${name}"?`)) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const handleDeleteTravel = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete travel arrangement for "${name}"?`)) {
      deleteTravelMutation.mutate(id);
    }
  };

  const handleDeleteBudget = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete budget item "${name}"?`)) {
      deleteBudgetMutation.mutate(id);
    }
  };

  const handleDeleteCampaign = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const handleDeleteRegistration = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete registration for "${name}"?`)) {
      deleteRegistrationMutation.mutate(id);
    }
  };

  const handleDeleteNote = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete note "${title || 'Untitled'}"?`)) {
      deleteNoteMutation.mutate(id);
    }
  };

  const handleDeleteChecklist = (id: number, text: string) => {
    if (window.confirm(`Are you sure you want to delete checklist item "${text}"?`)) {
      deleteChecklistMutation.mutate(id);
    }
  };

  const handleDeleteTicketTier = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ticket tier "${name}"?`)) {
      deleteTicketTierMutation.mutate(id);
    }
  };

  const handleDeleteExpense = (id: number, description: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${description}"?`)) {
      deleteExpenseMutation.mutate(id);
    }
  };

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
          <Button variant="outline" onClick={copyCustomerLink} data-testid="button-copy-customer-link">
            {customerLinkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {customerLinkCopied ? "Copied!" : "Copy Link"}
          </Button>
          <Button variant="outline" onClick={openCustomerPortal} data-testid="button-view-customer-portal">
            <ExternalLink className="h-4 w-4 mr-2" />
            Customer Portal
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
                    <DialogContent aria-describedby={undefined}>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${sponsor.amount || '0.00'}</p>
                          <StatusBadge status={sponsor.status as any}>
                            {sponsor.status === 'pending' ? 'Pending' : sponsor.status === 'confirmed' ? 'Confirmed' : 'Paid'}
                          </StatusBadge>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingSponsor(sponsor)}
                              data-testid={`button-edit-sponsor-${sponsor.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)}
                              data-testid={`button-delete-sponsor-${sponsor.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Sponsor Dialog */}
              <Dialog open={!!editingSponsor} onOpenChange={(open) => !open && setEditingSponsor(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Sponsor</DialogTitle>
                  </DialogHeader>
                  {editingSponsor && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-sponsor-name">Sponsor Name *</Label>
                        <Input 
                          id="edit-sponsor-name" 
                          value={editingSponsor.name}
                          onChange={(e) => setEditingSponsor({...editingSponsor, name: e.target.value})}
                          data-testid="input-edit-sponsor-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-sponsor-tier">Tier</Label>
                        <Select value={editingSponsor.tier || "bronze"} onValueChange={(value) => setEditingSponsor({...editingSponsor, tier: value as "platinum" | "gold" | "silver" | "bronze" | "custom"})}>
                          <SelectTrigger data-testid="select-edit-sponsor-tier">
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
                        <Label htmlFor="edit-sponsor-amount">Amount ($)</Label>
                        <Input 
                          id="edit-sponsor-amount" 
                          type="number"
                          value={editingSponsor.amount || ""}
                          onChange={(e) => setEditingSponsor({...editingSponsor, amount: e.target.value})}
                          data-testid="input-edit-sponsor-amount"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-sponsor-contact">Contact Name</Label>
                        <Input 
                          id="edit-sponsor-contact" 
                          value={editingSponsor.contactName || ""}
                          onChange={(e) => setEditingSponsor({...editingSponsor, contactName: e.target.value})}
                          data-testid="input-edit-sponsor-contact"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-sponsor-email">Contact Email</Label>
                        <Input 
                          id="edit-sponsor-email" 
                          type="email"
                          value={editingSponsor.contactEmail || ""}
                          onChange={(e) => setEditingSponsor({...editingSponsor, contactEmail: e.target.value})}
                          data-testid="input-edit-sponsor-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-sponsor-benefits">Benefits</Label>
                        <Textarea 
                          id="edit-sponsor-benefits" 
                          value={editingSponsor.benefits || ""}
                          onChange={(e) => setEditingSponsor({...editingSponsor, benefits: e.target.value})}
                          data-testid="input-edit-sponsor-benefits"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSponsor(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingSponsor && editSponsorMutation.mutate(editingSponsor)}
                      disabled={!editingSponsor?.name || editSponsorMutation.isPending}
                      data-testid="button-update-sponsor"
                    >
                      {editSponsorMutation.isPending ? "Saving..." : "Update Sponsor"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {volunteer.shirtSize && <p className="text-sm">Size: {volunteer.shirtSize}</p>}
                          <StatusBadge status={volunteer.checkedIn ? 'success' : 'outline'}>
                            {volunteer.checkedIn ? 'Checked In' : 'Not Checked In'}
                          </StatusBadge>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingVolunteer(volunteer)}
                              data-testid={`button-edit-volunteer-${volunteer.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteVolunteer(volunteer.id, volunteer.name)}
                              data-testid={`button-delete-volunteer-${volunteer.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Volunteer Dialog */}
              <Dialog open={!!editingVolunteer} onOpenChange={(open) => !open && setEditingVolunteer(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Volunteer</DialogTitle>
                  </DialogHeader>
                  {editingVolunteer && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-name">Name *</Label>
                        <Input 
                          id="edit-volunteer-name" 
                          value={editingVolunteer.name}
                          onChange={(e) => setEditingVolunteer({...editingVolunteer, name: e.target.value})}
                          data-testid="input-edit-volunteer-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-email">Email</Label>
                        <Input 
                          id="edit-volunteer-email" 
                          type="email"
                          value={editingVolunteer.email || ""}
                          onChange={(e) => setEditingVolunteer({...editingVolunteer, email: e.target.value})}
                          data-testid="input-edit-volunteer-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-phone">Phone</Label>
                        <Input 
                          id="edit-volunteer-phone" 
                          value={editingVolunteer.phone || ""}
                          onChange={(e) => setEditingVolunteer({...editingVolunteer, phone: e.target.value})}
                          data-testid="input-edit-volunteer-phone"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-role">Role</Label>
                        <Input 
                          id="edit-volunteer-role" 
                          value={editingVolunteer.role || ""}
                          onChange={(e) => setEditingVolunteer({...editingVolunteer, role: e.target.value})}
                          data-testid="input-edit-volunteer-role"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-area">Assigned Area</Label>
                        <Input 
                          id="edit-volunteer-area" 
                          value={editingVolunteer.assignedArea || ""}
                          onChange={(e) => setEditingVolunteer({...editingVolunteer, assignedArea: e.target.value})}
                          data-testid="input-edit-volunteer-area"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-volunteer-shirt">Shirt Size</Label>
                        <Select value={editingVolunteer.shirtSize || ""} onValueChange={(value) => setEditingVolunteer({...editingVolunteer, shirtSize: value})}>
                          <SelectTrigger data-testid="select-edit-volunteer-shirt">
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
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingVolunteer(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingVolunteer && editVolunteerMutation.mutate(editingVolunteer)}
                      disabled={!editingVolunteer?.name || editVolunteerMutation.isPending}
                      data-testid="button-update-volunteer"
                    >
                      {editVolunteerMutation.isPending ? "Saving..." : "Update Volunteer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Staff</h3>
                {canEdit && (
                  <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-staff">
                        <Plus className="h-4 w-4 mr-1" /> Add Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Add Staff Member</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="staff-name">Name *</Label>
                          <Input 
                            id="staff-name" 
                            value={newStaff.name}
                            onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                            placeholder="Enter staff member name"
                            data-testid="input-staff-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="staff-email">Email</Label>
                          <Input 
                            id="staff-email" 
                            type="email"
                            value={newStaff.email}
                            onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                            placeholder="email@example.com"
                            data-testid="input-staff-email"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="staff-phone">Phone</Label>
                          <Input 
                            id="staff-phone" 
                            value={newStaff.phone}
                            onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                            placeholder="(555) 123-4567"
                            data-testid="input-staff-phone"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="staff-role">Role *</Label>
                          <Input 
                            id="staff-role" 
                            value={newStaff.role}
                            onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                            placeholder="e.g., Event Director, Logistics Lead"
                            data-testid="input-staff-role"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addStaffMutation.mutate(newStaff)}
                          disabled={!newStaff.name || !newStaff.role || addStaffMutation.isPending}
                          data-testid="button-save-staff"
                        >
                          {addStaffMutation.isPending ? "Saving..." : "Save Staff"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {staff.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No staff assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`staff-${member.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-staff-name-${member.id}`}>{member.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-staff-role-${member.id}`}>{member.role}</p>
                        {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                        {member.phone && <p className="text-sm text-muted-foreground">{member.phone}</p>}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingStaff(member)}
                            data-testid={`button-edit-staff-${member.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStaff(member.id, member.name)}
                            data-testid={`button-delete-staff-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Staff Dialog */}
              <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Staff Member</DialogTitle>
                  </DialogHeader>
                  {editingStaff && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-staff-name">Name *</Label>
                        <Input 
                          id="edit-staff-name" 
                          value={editingStaff.name}
                          onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                          data-testid="input-edit-staff-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-staff-email">Email</Label>
                        <Input 
                          id="edit-staff-email" 
                          type="email"
                          value={editingStaff.email || ""}
                          onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
                          data-testid="input-edit-staff-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-staff-phone">Phone</Label>
                        <Input 
                          id="edit-staff-phone" 
                          value={editingStaff.phone || ""}
                          onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
                          data-testid="input-edit-staff-phone"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-staff-role">Role *</Label>
                        <Input 
                          id="edit-staff-role" 
                          value={editingStaff.role || ""}
                          onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                          data-testid="input-edit-staff-role"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingStaff(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingStaff && editStaffMutation.mutate(editingStaff)}
                      disabled={!editingStaff?.name || !editingStaff?.role || editStaffMutation.isPending}
                      data-testid="button-update-staff"
                    >
                      {editStaffMutation.isPending ? "Saving..." : "Update Staff"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Event Contractors</h3>
                {canEdit && (
                  <Dialog open={showAddContractorDialog} onOpenChange={setShowAddContractorDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-contractor">
                        <Plus className="h-4 w-4 mr-1" /> Add Contractor
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Add Contractor</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contractor-name">Name *</Label>
                          <Input 
                            id="contractor-name" 
                            value={newContractor.name}
                            onChange={(e) => setNewContractor({...newContractor, name: e.target.value})}
                            placeholder="Enter contractor name"
                            data-testid="input-contractor-name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contractor-email">Email</Label>
                          <Input 
                            id="contractor-email" 
                            type="email"
                            value={newContractor.email}
                            onChange={(e) => setNewContractor({...newContractor, email: e.target.value})}
                            placeholder="email@example.com"
                            data-testid="input-contractor-email"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contractor-phone">Phone</Label>
                          <Input 
                            id="contractor-phone" 
                            value={newContractor.phone}
                            onChange={(e) => setNewContractor({...newContractor, phone: e.target.value})}
                            placeholder="(555) 123-4567"
                            data-testid="input-contractor-phone"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contractor-role">Role *</Label>
                          <Input 
                            id="contractor-role" 
                            value={newContractor.role}
                            onChange={(e) => setNewContractor({...newContractor, role: e.target.value})}
                            placeholder="e.g., Clinician, Photographer, MC"
                            data-testid="input-contractor-role"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="contractor-payment-type">Payment Type</Label>
                            <Select value={newContractor.contractType} onValueChange={(value: "flat_fee" | "per_day" | "commission") => setNewContractor({...newContractor, contractType: value})}>
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
                          <div className="grid gap-2">
                            <Label htmlFor="contractor-amount">Amount ($)</Label>
                            <Input 
                              id="contractor-amount" 
                              type="number"
                              value={newContractor.paymentAmount}
                              onChange={(e) => setNewContractor({...newContractor, paymentAmount: e.target.value})}
                              placeholder="0.00"
                              data-testid="input-contractor-amount"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddContractorDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addContractorMutation.mutate(newContractor)}
                          disabled={!newContractor.name || !newContractor.role || addContractorMutation.isPending}
                          data-testid="button-save-contractor"
                        >
                          {addContractorMutation.isPending ? "Saving..." : "Save Contractor"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
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
                          {contractor.email && <p className="text-sm text-muted-foreground">{contractor.email}</p>}
                          {contractor.phone && <p className="text-sm text-muted-foreground">{contractor.phone}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={contractor.paymentStatus as any}>
                            {contractor.paymentStatus === 'unpaid' ? 'Unpaid' : 
                             contractor.paymentStatus === 'half_paid' ? 'Half Paid' : 'Paid'}
                          </StatusBadge>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingContractor(contractor)}
                                data-testid={`button-edit-contractor-${contractor.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteContractor(contractor.id, contractor.name)}
                                data-testid={`button-delete-contractor-${contractor.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {contractor.bioText && (
                        <p className="mt-2 text-sm">{contractor.bioText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Contractor Dialog */}
              <Dialog open={!!editingContractor} onOpenChange={(open) => !open && setEditingContractor(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Contractor</DialogTitle>
                  </DialogHeader>
                  {editingContractor && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-contractor-name">Name *</Label>
                        <Input 
                          id="edit-contractor-name" 
                          value={editingContractor.name}
                          onChange={(e) => setEditingContractor({...editingContractor, name: e.target.value})}
                          data-testid="input-edit-contractor-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-contractor-email">Email</Label>
                        <Input 
                          id="edit-contractor-email" 
                          type="email"
                          value={editingContractor.email || ""}
                          onChange={(e) => setEditingContractor({...editingContractor, email: e.target.value})}
                          data-testid="input-edit-contractor-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-contractor-phone">Phone</Label>
                        <Input 
                          id="edit-contractor-phone" 
                          value={editingContractor.phone || ""}
                          onChange={(e) => setEditingContractor({...editingContractor, phone: e.target.value})}
                          data-testid="input-edit-contractor-phone"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-contractor-role">Role *</Label>
                        <Input 
                          id="edit-contractor-role" 
                          value={editingContractor.role || ""}
                          onChange={(e) => setEditingContractor({...editingContractor, role: e.target.value})}
                          data-testid="input-edit-contractor-role"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-contractor-payment-type">Payment Type</Label>
                          <Select value={editingContractor.contractType || "flat_fee"} onValueChange={(value: "flat_fee" | "per_day" | "commission") => setEditingContractor({...editingContractor, contractType: value})}>
                            <SelectTrigger data-testid="select-edit-contractor-payment-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat_fee">Flat Fee</SelectItem>
                              <SelectItem value="per_day">Per Day</SelectItem>
                              <SelectItem value="commission">Commission</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-contractor-amount">Amount ($)</Label>
                          <Input 
                            id="edit-contractor-amount" 
                            type="number"
                            value={editingContractor.paymentAmount || ""}
                            onChange={(e) => setEditingContractor({...editingContractor, paymentAmount: e.target.value})}
                            data-testid="input-edit-contractor-amount"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingContractor(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingContractor && editContractorMutation.mutate(editingContractor)}
                      disabled={!editingContractor?.name || !editingContractor?.role || editContractorMutation.isPending}
                      data-testid="button-update-contractor"
                    >
                      {editContractorMutation.isPending ? "Saving..." : "Update Contractor"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Add Graphic</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Upload File *</Label>
                          <FileDropZone
                            onFileSelect={handleGraphicFileSelect}
                            accept="image/*,video/*"
                            maxSizeMB={25}
                            fileType="image"
                            selectedFile={selectedGraphicFile}
                            onClear={() => {
                              setSelectedGraphicFile(null);
                              setNewGraphic(prev => ({ ...prev, fileName: "", fileUrl: "" }));
                            }}
                            uploading={graphicUploading}
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
                            placeholder="Optional description for this graphic"
                            data-testid="input-graphic-description"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setShowAddGraphicDialog(false);
                          setSelectedGraphicFile(null);
                          setNewGraphic({ fileName: "", fileUrl: "", fileType: "image", description: "" });
                        }}>Cancel</Button>
                        <Button 
                          onClick={() => addGraphicMutation.mutate(newGraphic)}
                          disabled={!newGraphic.fileName || !newGraphic.fileUrl || graphicUploading || addGraphicMutation.isPending}
                          data-testid="button-save-graphic"
                        >
                          {graphicUploading ? "Uploading..." : addGraphicMutation.isPending ? "Saving..." : "Save Graphic"}
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground capitalize">{graphic.fileType}</p>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingGraphic(graphic)}
                                data-testid={`button-edit-graphic-${graphic.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteGraphic(graphic.id, graphic.fileName)}
                                data-testid={`button-delete-graphic-${graphic.id}`}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Graphic Dialog */}
              <Dialog open={!!editingGraphic} onOpenChange={(open) => !open && setEditingGraphic(null)}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Graphic</DialogTitle>
                  </DialogHeader>
                  {editingGraphic && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-graphic-filename">File Name</Label>
                        <Input
                          id="edit-graphic-filename"
                          value={editingGraphic.fileName}
                          onChange={(e) => setEditingGraphic({...editingGraphic, fileName: e.target.value})}
                          data-testid="input-edit-graphic-filename"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-graphic-type">File Type</Label>
                        <Select value={editingGraphic.fileType || "other"} onValueChange={(value) => setEditingGraphic({...editingGraphic, fileType: value as "flyer" | "poster" | "video" | "banner" | "social_media" | "logo" | "other"})}>
                          <SelectTrigger data-testid="select-edit-graphic-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poster">Poster</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="logo">Logo</SelectItem>
                            <SelectItem value="flyer">Flyer</SelectItem>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-graphic-description">Description</Label>
                        <Textarea
                          id="edit-graphic-description"
                          value={editingGraphic.description || ""}
                          onChange={(e) => setEditingGraphic({...editingGraphic, description: e.target.value})}
                          data-testid="input-edit-graphic-description"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingGraphic(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingGraphic && editGraphicMutation.mutate(editingGraphic)}
                      disabled={!editingGraphic?.fileName || editGraphicMutation.isPending}
                      data-testid="button-update-graphic"
                    >
                      {editGraphicMutation.isPending ? "Saving..." : "Update Graphic"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
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
                    <div key={venue.id} className="flex items-start justify-between p-4 border rounded-lg" data-testid={`venue-${venue.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-venue-name-${venue.id}`}>{venue.venueName}</p>
                        {venue.address && <p className="text-sm text-muted-foreground">{venue.address}</p>}
                        {venue.city && venue.state && <p className="text-sm text-muted-foreground">{venue.city}, {venue.state}</p>}
                        {venue.capacity && <p className="text-sm text-muted-foreground">Capacity: {venue.capacity}</p>}
                        {venue.notes && <p className="mt-2 text-sm">{venue.notes}</p>}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingVenue(venue)}
                            data-testid={`button-edit-venue-${venue.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVenue(venue.id, venue.venueName)}
                            data-testid={`button-delete-venue-${venue.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Venue Dialog */}
              <Dialog open={!!editingVenue} onOpenChange={(open) => !open && setEditingVenue(null)}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Venue</DialogTitle>
                  </DialogHeader>
                  {editingVenue && (
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-venue-name">Venue Name *</Label>
                        <Input
                          id="edit-venue-name"
                          value={editingVenue.venueName}
                          onChange={(e) => setEditingVenue({...editingVenue, venueName: e.target.value})}
                          data-testid="input-edit-venue-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-venue-address">Address</Label>
                        <Input
                          id="edit-venue-address"
                          value={editingVenue.address || ""}
                          onChange={(e) => setEditingVenue({...editingVenue, address: e.target.value})}
                          data-testid="input-edit-venue-address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-venue-city">City</Label>
                          <Input
                            id="edit-venue-city"
                            value={editingVenue.city || ""}
                            onChange={(e) => setEditingVenue({...editingVenue, city: e.target.value})}
                            data-testid="input-edit-venue-city"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-venue-state">State</Label>
                          <Input
                            id="edit-venue-state"
                            value={editingVenue.state || ""}
                            onChange={(e) => setEditingVenue({...editingVenue, state: e.target.value})}
                            data-testid="input-edit-venue-state"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-venue-capacity">Capacity</Label>
                          <Input
                            id="edit-venue-capacity"
                            type="number"
                            value={editingVenue.capacity || ""}
                            onChange={(e) => setEditingVenue({...editingVenue, capacity: e.target.value ? parseInt(e.target.value) : null})}
                            data-testid="input-edit-venue-capacity"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-venue-cost">Rental Cost ($)</Label>
                          <Input
                            id="edit-venue-cost"
                            type="number"
                            value={editingVenue.rentalCost || ""}
                            onChange={(e) => setEditingVenue({...editingVenue, rentalCost: e.target.value})}
                            data-testid="input-edit-venue-cost"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-venue-contact">Contact Name</Label>
                        <Input
                          id="edit-venue-contact"
                          value={editingVenue.contactName || ""}
                          onChange={(e) => setEditingVenue({...editingVenue, contactName: e.target.value})}
                          data-testid="input-edit-venue-contact"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-venue-email">Contact Email</Label>
                        <Input
                          id="edit-venue-email"
                          type="email"
                          value={editingVenue.contactEmail || ""}
                          onChange={(e) => setEditingVenue({...editingVenue, contactEmail: e.target.value})}
                          data-testid="input-edit-venue-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-venue-notes">Notes</Label>
                        <Textarea
                          id="edit-venue-notes"
                          value={editingVenue.notes || ""}
                          onChange={(e) => setEditingVenue({...editingVenue, notes: e.target.value})}
                          data-testid="input-edit-venue-notes"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingVenue(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingVenue && editVenueMutation.mutate(editingVenue)}
                      disabled={!editingVenue?.venueName || editVenueMutation.isPending}
                      data-testid="button-update-venue"
                    >
                      {editVenueMutation.isPending ? "Saving..." : "Update Venue"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
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
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingSchedule(schedule)}
                              data-testid={`button-edit-schedule-${schedule.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                              data-testid={`button-delete-schedule-${schedule.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {schedule.description && <p className="mt-2 text-sm">{schedule.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Schedule Dialog */}
              <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Schedule Item</DialogTitle>
                  </DialogHeader>
                  {editingSchedule && (
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-schedule-title">Title *</Label>
                        <Input
                          id="edit-schedule-title"
                          value={editingSchedule.title}
                          onChange={(e) => setEditingSchedule({...editingSchedule, title: e.target.value})}
                          data-testid="input-edit-schedule-title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-schedule-description">Description</Label>
                        <Textarea
                          id="edit-schedule-description"
                          value={editingSchedule.description || ""}
                          onChange={(e) => setEditingSchedule({...editingSchedule, description: e.target.value})}
                          data-testid="input-edit-schedule-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-schedule-start">Start Time</Label>
                          <Input
                            id="edit-schedule-start"
                            type="datetime-local"
                            value={editingSchedule.startTime ? new Date(editingSchedule.startTime).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditingSchedule({...editingSchedule, startTime: e.target.value ? new Date(e.target.value) : new Date()})}
                            data-testid="input-edit-schedule-start"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-schedule-end">End Time</Label>
                          <Input
                            id="edit-schedule-end"
                            type="datetime-local"
                            value={editingSchedule.endTime ? new Date(editingSchedule.endTime).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditingSchedule({...editingSchedule, endTime: e.target.value ? new Date(e.target.value) : null})}
                            data-testid="input-edit-schedule-end"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-schedule-location">Location</Label>
                        <Input
                          id="edit-schedule-location"
                          value={editingSchedule.location || ""}
                          onChange={(e) => setEditingSchedule({...editingSchedule, location: e.target.value})}
                          data-testid="input-edit-schedule-location"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-schedule-type">Activity Type</Label>
                        <Select value={editingSchedule.activityType || "session"} onValueChange={(value) => setEditingSchedule({...editingSchedule, activityType: value as "session" | "break" | "registration" | "ceremony" | "other"})}>
                          <SelectTrigger data-testid="select-edit-schedule-type">
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
                        <Label htmlFor="edit-schedule-speaker">Speaker Name</Label>
                        <Input
                          id="edit-schedule-speaker"
                          value={editingSchedule.speakerName || ""}
                          onChange={(e) => setEditingSchedule({...editingSchedule, speakerName: e.target.value})}
                          data-testid="input-edit-schedule-speaker"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingSchedule && editScheduleMutation.mutate(editingSchedule)}
                      disabled={!editingSchedule?.title || editScheduleMutation.isPending}
                      data-testid="button-update-schedule"
                    >
                      {editScheduleMutation.isPending ? "Saving..." : "Update Schedule Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {item.rentalCost && <p className="font-medium">${item.rentalCost}</p>}
                          <StatusBadge status={item.status as any}>
                            {item.status === 'reserved' ? 'Reserved' : item.status === 'picked_up' ? 'Picked Up' : item.status === 'returned' ? 'Returned' : item.status === 'damaged' ? 'Damaged' : 'Pending'}
                          </StatusBadge>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingEquipment(item)}
                              data-testid={`button-edit-equipment-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEquipment(item.id, item.itemName)}
                              data-testid={`button-delete-equipment-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Equipment Dialog */}
              <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && setEditingEquipment(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Equipment</DialogTitle>
                  </DialogHeader>
                  {editingEquipment && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-equipment-name">Item Name *</Label>
                        <Input 
                          id="edit-equipment-name" 
                          value={editingEquipment.itemName}
                          onChange={(e) => setEditingEquipment({...editingEquipment, itemName: e.target.value})}
                          data-testid="input-edit-equipment-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-equipment-quantity">Quantity</Label>
                        <Input 
                          id="edit-equipment-quantity" 
                          type="number"
                          value={editingEquipment.quantity || 1}
                          onChange={(e) => setEditingEquipment({...editingEquipment, quantity: parseInt(e.target.value) || 1})}
                          data-testid="input-edit-equipment-quantity"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-equipment-category">Category</Label>
                        <Select value={editingEquipment.category || "other"} onValueChange={(value) => setEditingEquipment({...editingEquipment, category: value as "audio" | "visual" | "signage" | "furniture" | "sports" | "other"})}>
                          <SelectTrigger data-testid="select-edit-equipment-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="visual">Visual</SelectItem>
                            <SelectItem value="signage">Signage</SelectItem>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-equipment-cost">Rental Cost ($)</Label>
                        <Input 
                          id="edit-equipment-cost" 
                          type="number"
                          value={editingEquipment.rentalCost || ""}
                          onChange={(e) => setEditingEquipment({...editingEquipment, rentalCost: e.target.value})}
                          data-testid="input-edit-equipment-cost"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-equipment-status">Status</Label>
                        <Select value={editingEquipment.status || "reserved"} onValueChange={(value) => setEditingEquipment({...editingEquipment, status: value as "reserved" | "picked_up" | "returned" | "damaged"})}>
                          <SelectTrigger data-testid="select-edit-equipment-status">
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
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingEquipment(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingEquipment && editEquipmentMutation.mutate(editingEquipment)}
                      disabled={!editingEquipment?.itemName || editEquipmentMutation.isPending}
                      data-testid="button-update-equipment"
                    >
                      {editEquipmentMutation.isPending ? "Saving..." : "Update Equipment"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
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
                        <div className="flex items-start gap-4">
                          <div className="text-right">
                            {item.totalCost && <p className="font-medium">${item.totalCost}</p>}
                            <StatusBadge status={item.reimbursementStatus as any}>
                              {item.reimbursementStatus === 'pending' ? 'Pending' : item.reimbursementStatus === 'approved' ? 'Approved' : 'Reimbursed'}
                            </StatusBadge>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingTravel(item)}
                                data-testid={`button-edit-travel-${item.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTravel(item.id, item.travelerName)}
                                data-testid={`button-delete-travel-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Travel Dialog */}
              <Dialog open={!!editingTravel} onOpenChange={(open) => !open && setEditingTravel(null)}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Travel Arrangement</DialogTitle>
                  </DialogHeader>
                  {editingTravel && (
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-travel-name">Traveler Name *</Label>
                        <Input id="edit-travel-name" value={editingTravel.travelerName} onChange={(e) => setEditingTravel({...editingTravel, travelerName: e.target.value})} data-testid="input-edit-travel-name" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-travel-type">Traveler Type</Label>
                        <Select value={editingTravel.travelerType || "custom"} onValueChange={(value) => setEditingTravel({...editingTravel, travelerType: value as "staff" | "contractor" | "custom"})}>
                          <SelectTrigger data-testid="select-edit-travel-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-travel-arrival">Flight Arrival</Label>
                          <Input id="edit-travel-arrival" type="datetime-local" value={editingTravel.flightArrival ? (editingTravel.flightArrival instanceof Date ? editingTravel.flightArrival.toISOString() : editingTravel.flightArrival).slice(0, 16) : ""} onChange={(e) => setEditingTravel({...editingTravel, flightArrival: e.target.value ? new Date(e.target.value) : null})} data-testid="input-edit-travel-arrival" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-travel-departure">Flight Departure</Label>
                          <Input id="edit-travel-departure" type="datetime-local" value={editingTravel.flightDeparture ? (editingTravel.flightDeparture instanceof Date ? editingTravel.flightDeparture.toISOString() : editingTravel.flightDeparture).slice(0, 16) : ""} onChange={(e) => setEditingTravel({...editingTravel, flightDeparture: e.target.value ? new Date(e.target.value) : null})} data-testid="input-edit-travel-departure" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-travel-hotel">Hotel Name</Label>
                        <Input id="edit-travel-hotel" value={editingTravel.hotelName || ""} onChange={(e) => setEditingTravel({...editingTravel, hotelName: e.target.value})} data-testid="input-edit-travel-hotel" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-travel-checkin">Check-In</Label>
                          <Input id="edit-travel-checkin" type="date" value={editingTravel.hotelCheckIn ? (editingTravel.hotelCheckIn instanceof Date ? editingTravel.hotelCheckIn.toISOString() : editingTravel.hotelCheckIn).slice(0, 10) : ""} onChange={(e) => setEditingTravel({...editingTravel, hotelCheckIn: e.target.value ? new Date(e.target.value) : null})} data-testid="input-edit-travel-checkin" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-travel-checkout">Check-Out</Label>
                          <Input id="edit-travel-checkout" type="date" value={editingTravel.hotelCheckOut ? (editingTravel.hotelCheckOut instanceof Date ? editingTravel.hotelCheckOut.toISOString() : editingTravel.hotelCheckOut).slice(0, 10) : ""} onChange={(e) => setEditingTravel({...editingTravel, hotelCheckOut: e.target.value ? new Date(e.target.value) : null})} data-testid="input-edit-travel-checkout" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-travel-cost">Total Cost ($)</Label>
                        <Input id="edit-travel-cost" type="number" value={editingTravel.totalCost || ""} onChange={(e) => setEditingTravel({...editingTravel, totalCost: e.target.value})} data-testid="input-edit-travel-cost" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-travel-notes">Notes</Label>
                        <Textarea id="edit-travel-notes" value={editingTravel.notes || ""} onChange={(e) => setEditingTravel({...editingTravel, notes: e.target.value})} data-testid="input-edit-travel-notes" />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingTravel(null)}>Cancel</Button>
                    <Button onClick={() => editingTravel && editTravelMutation.mutate(editingTravel)} disabled={!editingTravel?.travelerName || editTravelMutation.isPending} data-testid="button-update-travel">
                      {editTravelMutation.isPending ? "Saving..." : "Update Travel"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Add Document</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Upload File *</Label>
                          <FileDropZone
                            onFileSelect={handleDocumentFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                            maxSizeMB={25}
                            fileType="document"
                            selectedFile={selectedDocumentFile}
                            onClear={() => {
                              setSelectedDocumentFile(null);
                              setNewDocument(prev => ({ ...prev, fileName: "", fileUrl: "" }));
                            }}
                            uploading={documentUploading}
                          />
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
                          <Textarea 
                            id="document-notes" 
                            value={newDocument.notes} 
                            onChange={(e) => setNewDocument({...newDocument, notes: e.target.value})} 
                            placeholder="Optional notes about this document"
                            data-testid="input-document-notes" 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setShowAddDocumentDialog(false);
                          setSelectedDocumentFile(null);
                          setNewDocument({ fileName: "", fileUrl: "", documentType: "other", notes: "" });
                        }}>Cancel</Button>
                        <Button 
                          onClick={() => addDocumentMutation.mutate(newDocument)} 
                          disabled={!newDocument.fileName || !newDocument.fileUrl || documentUploading || addDocumentMutation.isPending} 
                          data-testid="button-save-document"
                        >
                          {documentUploading ? "Uploading..." : addDocumentMutation.isPending ? "Saving..." : "Save Document"}
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
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingDocument(doc)}
                              data-testid={`button-edit-document-${doc.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                              data-testid={`button-delete-document-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Document Dialog */}
              <Dialog open={!!editingDocument} onOpenChange={(open) => !open && setEditingDocument(null)}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Document</DialogTitle>
                  </DialogHeader>
                  {editingDocument && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-document-filename">File Name</Label>
                        <Input
                          id="edit-document-filename"
                          value={editingDocument.fileName}
                          onChange={(e) => setEditingDocument({...editingDocument, fileName: e.target.value})}
                          data-testid="input-edit-document-filename"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-document-type">Document Type</Label>
                        <Select value={editingDocument.documentType || "other"} onValueChange={(value) => setEditingDocument({...editingDocument, documentType: value as "contract" | "invoice" | "permit" | "insurance" | "receipt" | "other"})}>
                          <SelectTrigger data-testid="select-edit-document-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="permit">Permit</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="receipt">Receipt</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-document-notes">Notes</Label>
                        <Textarea
                          id="edit-document-notes"
                          value={editingDocument.notes || ""}
                          onChange={(e) => setEditingDocument({...editingDocument, notes: e.target.value})}
                          data-testid="input-edit-document-notes"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingDocument(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingDocument && editDocumentMutation.mutate(editingDocument)}
                      disabled={!editingDocument?.fileName || editDocumentMutation.isPending}
                      data-testid="button-update-document"
                    >
                      {editDocumentMutation.isPending ? "Saving..." : "Update Document"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <div className="flex items-center gap-4">
                        <StatusBadge status={budget.approvalStatus as any}>
                          {budget.approvalStatus === 'pending' ? 'Pending' : 
                           budget.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </StatusBadge>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingBudget(budget)}
                              data-testid={`button-edit-budget-${budget.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBudget(budget.id, budget.categoryName)}
                              data-testid={`button-delete-budget-${budget.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Edit Budget Dialog */}
              <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Budget Item</DialogTitle>
                  </DialogHeader>
                  {editingBudget && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget-category">Category Name *</Label>
                        <Input 
                          id="edit-budget-category" 
                          value={editingBudget.categoryName}
                          onChange={(e) => setEditingBudget({...editingBudget, categoryName: e.target.value})}
                          data-testid="input-edit-budget-category"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget-budgeted">Budgeted Amount ($) *</Label>
                        <Input 
                          id="edit-budget-budgeted" 
                          type="number"
                          step="0.01"
                          value={editingBudget.budgetedAmount || ""}
                          onChange={(e) => setEditingBudget({...editingBudget, budgetedAmount: e.target.value})}
                          data-testid="input-edit-budget-budgeted"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget-actual">Actual Amount ($)</Label>
                        <Input 
                          id="edit-budget-actual" 
                          type="number"
                          step="0.01"
                          value={editingBudget.actualAmount || ""}
                          onChange={(e) => setEditingBudget({...editingBudget, actualAmount: e.target.value})}
                          data-testid="input-edit-budget-actual"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget-notes">Notes</Label>
                        <Textarea 
                          id="edit-budget-notes" 
                          value={editingBudget.notes || ""}
                          onChange={(e) => setEditingBudget({...editingBudget, notes: e.target.value})}
                          data-testid="input-edit-budget-notes"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget-status">Approval Status</Label>
                        <Select value={editingBudget.approvalStatus || "pending"} onValueChange={(value) => setEditingBudget({...editingBudget, approvalStatus: value as "pending" | "approved" | "rejected"})}>
                          <SelectTrigger data-testid="select-edit-budget-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingBudget(null)}>Cancel</Button>
                    <Button 
                      onClick={() => editingBudget && editBudgetMutation.mutate(editingBudget)}
                      disabled={!editingBudget?.categoryName || !editingBudget?.budgetedAmount || editBudgetMutation.isPending}
                      data-testid="button-update-budget"
                    >
                      {editBudgetMutation.isPending ? "Saving..." : "Update Budget"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent className="max-w-lg" aria-describedby={undefined}>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-lg">${tier.price || '0.00'}</p>
                          <StatusBadge status={tier.isActive ? 'success' : 'outline'}>
                            {tier.isActive ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTicketTier(tier)}
                              data-testid={`button-edit-ticket-tier-${tier.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTicketTier(tier.id, tier.tierName)}
                              data-testid={`button-delete-ticket-tier-${tier.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingTicketTier} onOpenChange={(open) => !open && setEditingTicketTier(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Ticket Tier</DialogTitle>
                  </DialogHeader>
                  {editingTicketTier && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-tier-name">Tier Name *</Label>
                        <Input 
                          id="edit-tier-name" 
                          value={editingTicketTier.tierName}
                          onChange={(e) => setEditingTicketTier({...editingTicketTier, tierName: e.target.value})}
                          data-testid="input-edit-ticket-tier-name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-tier-price">Price ($) *</Label>
                          <Input 
                            id="edit-tier-price" 
                            type="number"
                            value={editingTicketTier.price || ""}
                            onChange={(e) => setEditingTicketTier({...editingTicketTier, price: e.target.value})}
                            data-testid="input-edit-ticket-tier-price"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-tier-capacity">Capacity</Label>
                          <Input 
                            id="edit-tier-capacity" 
                            type="number"
                            value={editingTicketTier.capacity || ""}
                            onChange={(e) => setEditingTicketTier({...editingTicketTier, capacity: parseInt(e.target.value) || null})}
                            placeholder="Unlimited"
                            data-testid="input-edit-ticket-tier-capacity"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-tier-description">Description</Label>
                        <Textarea 
                          id="edit-tier-description" 
                          value={editingTicketTier.description || ""}
                          onChange={(e) => setEditingTicketTier({...editingTicketTier, description: e.target.value})}
                          data-testid="input-edit-ticket-tier-description"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingTicketTier(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingTicketTier && editTicketTierMutation.mutate(editingTicketTier)}
                      disabled={!editingTicketTier?.tierName || !editingTicketTier?.price || editTicketTierMutation.isPending}
                      data-testid="button-update-ticket-tier"
                    >
                      {editTicketTierMutation.isPending ? "Saving..." : "Update Ticket Tier"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">${expense.amount || '0.00'}</p>
                          <StatusBadge status={expense.status as any}>
                            {expense.status === 'pending' ? 'Pending' : expense.status === 'approved' ? 'Approved' : expense.status === 'paid' ? 'Paid' : 'Reimbursed'}
                          </StatusBadge>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingExpense(expense)}
                              data-testid={`button-edit-expense-${expense.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id, expense.description)}
                              data-testid={`button-delete-expense-${expense.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                  </DialogHeader>
                  {editingExpense && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-description">Description *</Label>
                        <Input 
                          id="edit-expense-description" 
                          value={editingExpense.description}
                          onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                          data-testid="input-edit-expense-description"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-amount">Amount ($)</Label>
                        <Input 
                          id="edit-expense-amount" 
                          type="number"
                          value={editingExpense.amount || ""}
                          onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})}
                          data-testid="input-edit-expense-amount"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-category">Category</Label>
                        <Select value={editingExpense.expenseCategory || "other"} onValueChange={(value) => setEditingExpense({...editingExpense, expenseCategory: value as "venue" | "catering" | "equipment" | "staffing" | "travel" | "marketing" | "other"})}>
                          <SelectTrigger data-testid="select-edit-expense-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="venue">Venue</SelectItem>
                            <SelectItem value="catering">Catering</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="staffing">Staffing</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-vendor">Vendor</Label>
                        <Input 
                          id="edit-expense-vendor" 
                          value={editingExpense.vendor || ""}
                          onChange={(e) => setEditingExpense({...editingExpense, vendor: e.target.value})}
                          data-testid="input-edit-expense-vendor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-expense-status">Status</Label>
                        <Select value={editingExpense.status || "pending"} onValueChange={(value) => setEditingExpense({...editingExpense, status: value as "pending" | "approved" | "paid" | "reimbursed"})}>
                          <SelectTrigger data-testid="select-edit-expense-status">
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
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingExpense && editExpenseMutation.mutate(editingExpense)}
                      disabled={!editingExpense?.description || !editingExpense?.amount || editExpenseMutation.isPending}
                      data-testid="button-update-expense"
                    >
                      {editExpenseMutation.isPending ? "Saving..." : "Update Expense"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.campaignName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{campaign.campaignType}</p>
                          {campaign.scheduledAt && (
                            <p className="text-sm mt-1">Scheduled: {format(new Date(campaign.scheduledAt), "MMM d, yyyy h:mm a")}</p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCampaign(campaign)}
                              data-testid={`button-edit-campaign-${campaign.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCampaign(campaign.id, campaign.campaignName)}
                              data-testid={`button-delete-campaign-${campaign.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Campaign</DialogTitle>
                  </DialogHeader>
                  {editingCampaign && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-campaign-name">Campaign Name *</Label>
                        <Input 
                          id="edit-campaign-name" 
                          value={editingCampaign.campaignName}
                          onChange={(e) => setEditingCampaign({...editingCampaign, campaignName: e.target.value})}
                          data-testid="input-edit-campaign-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-campaign-type">Type</Label>
                        <Select value={editingCampaign.campaignType || "email"} onValueChange={(value) => setEditingCampaign({...editingCampaign, campaignType: value as "email" | "sms" | "social" | "flyer" | "other"})}>
                          <SelectTrigger data-testid="select-edit-campaign-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="flyer">Flyer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-campaign-content">Content</Label>
                        <Textarea 
                          id="edit-campaign-content" 
                          value={editingCampaign.content || ""}
                          onChange={(e) => setEditingCampaign({...editingCampaign, content: e.target.value})}
                          data-testid="input-edit-campaign-content"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingCampaign && editCampaignMutation.mutate(editingCampaign)}
                      disabled={!editingCampaign?.campaignName || editCampaignMutation.isPending}
                      data-testid="button-update-campaign"
                    >
                      {editCampaignMutation.isPending ? "Saving..." : "Update Campaign"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <div className="flex items-center gap-4">
                        <StatusBadge status={registration.paymentStatus as any}>
                          {registration.paymentStatus === 'pending' ? 'Pending' : 
                           registration.paymentStatus === 'paid' ? 'Paid' : 'Refunded'}
                        </StatusBadge>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingRegistration(registration)}
                              data-testid={`button-edit-registration-${registration.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRegistration(registration.id, registration.attendeeName)}
                              data-testid={`button-delete-registration-${registration.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingRegistration} onOpenChange={(open) => !open && setEditingRegistration(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Registration</DialogTitle>
                  </DialogHeader>
                  {editingRegistration && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-registration-name">Attendee Name *</Label>
                        <Input 
                          id="edit-registration-name" 
                          value={editingRegistration.attendeeName}
                          onChange={(e) => setEditingRegistration({...editingRegistration, attendeeName: e.target.value})}
                          data-testid="input-edit-registration-name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-registration-email">Email *</Label>
                        <Input
                          id="edit-registration-email"
                          type="email"
                          value={editingRegistration.attendeeEmail || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, attendeeEmail: e.target.value})}
                          data-testid="input-edit-registration-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-registration-phone">Phone</Label>
                        <Input 
                          id="edit-registration-phone" 
                          value={editingRegistration.attendeePhone || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, attendeePhone: e.target.value})}
                          data-testid="input-edit-registration-phone"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-registration-ticket">Ticket Type</Label>
                        <Input 
                          id="edit-registration-ticket" 
                          value={editingRegistration.ticketType || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, ticketType: e.target.value})}
                          data-testid="input-edit-registration-ticket"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-registration-status">Payment Status</Label>
                        <Select value={editingRegistration.paymentStatus || "pending"} onValueChange={(value) => setEditingRegistration({...editingRegistration, paymentStatus: value as "pending" | "paid" | "refunded"})}>
                          <SelectTrigger data-testid="select-edit-registration-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingRegistration(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingRegistration && editRegistrationMutation.mutate(editingRegistration)}
                      disabled={!editingRegistration?.attendeeName || !editingRegistration?.attendeeEmail || editRegistrationMutation.isPending}
                      data-testid="button-update-registration"
                    >
                      {editRegistrationMutation.isPending ? "Saving..." : "Update Registration"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                        <div className="flex items-center gap-2">
                          {note.createdAt && (
                            <p className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy")}</p>
                          )}
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingNote(note)}
                                data-testid={`button-edit-note-${note.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNote(note.id, note.title || '')}
                                data-testid={`button-delete-note-${note.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {note.noteType && (
                        <p className="text-xs text-muted-foreground mt-2 capitalize">Type: {note.noteType}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Note</DialogTitle>
                  </DialogHeader>
                  {editingNote && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-note-title">Title</Label>
                        <Input 
                          id="edit-note-title" 
                          value={editingNote.title || ""}
                          onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                          data-testid="input-edit-note-title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-note-content">Content *</Label>
                        <Textarea 
                          id="edit-note-content" 
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                          data-testid="input-edit-note-content"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-note-type">Type</Label>
                        <Select value={editingNote.noteType || "general"} onValueChange={(value) => setEditingNote({...editingNote, noteType: value as "general" | "urgent" | "internal" | "client_facing"})}>
                          <SelectTrigger data-testid="select-edit-note-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="client_facing">Client Facing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingNote && editNoteMutation.mutate(editingNote)}
                      disabled={!editingNote?.content || editNoteMutation.isPending}
                      data-testid="button-update-note"
                    >
                      {editNoteMutation.isPending ? "Saving..." : "Update Note"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <DialogContent aria-describedby={undefined}>
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
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingChecklist(checklist)}
                              data-testid={`button-edit-checklist-${checklist.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChecklist(checklist.id, checklist.itemText)}
                              data-testid={`button-delete-checklist-${checklist.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {checklist.notes && <p className="text-sm text-muted-foreground mt-2 ml-8">{checklist.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={!!editingChecklist} onOpenChange={(open) => !open && setEditingChecklist(null)}>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Edit Checklist Item</DialogTitle>
                  </DialogHeader>
                  {editingChecklist && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-checklist-text">Item Text *</Label>
                        <Input 
                          id="edit-checklist-text" 
                          value={editingChecklist.itemText}
                          onChange={(e) => setEditingChecklist({...editingChecklist, itemText: e.target.value})}
                          data-testid="input-edit-checklist-text"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-checklist-type">Type</Label>
                        <Select value={editingChecklist.checklistType || "pre_event"} onValueChange={(value) => setEditingChecklist({...editingChecklist, checklistType: value as "setup" | "teardown" | "pre_event" | "during_event" | "post_event"})}>
                          <SelectTrigger data-testid="select-edit-checklist-type">
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
                        <Label htmlFor="edit-checklist-notes">Notes</Label>
                        <Textarea 
                          id="edit-checklist-notes" 
                          value={editingChecklist.notes || ""}
                          onChange={(e) => setEditingChecklist({...editingChecklist, notes: e.target.value})}
                          data-testid="input-edit-checklist-notes"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingChecklist(null)}>Cancel</Button>
                    <Button
                      onClick={() => editingChecklist && editChecklistMutation.mutate(editingChecklist)}
                      disabled={!editingChecklist?.itemText || editChecklistMutation.isPending}
                      data-testid="button-update-checklist"
                    >
                      {editChecklistMutation.isPending ? "Saving..." : "Update Checklist Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
