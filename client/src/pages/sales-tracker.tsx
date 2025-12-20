import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Mail, Phone, MessageSquare, ArrowRight, User, Building, Calendar, TrendingUp, ChevronDown, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type LeadStage = "future_lead" | "lead" | "hot_lead" | "mock_up" | "mock_up_sent" | "team_store_or_direct_order" | "current_clients" | "no_answer_delete";

interface Lead {
  id: number;
  leadCode: string;
  orgId: number;
  organization?: {
    id: number;
    name: string;
  };
  contactId?: number;
  contact?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  stage: LeadStage;
  score: number;
  source: string;
  notes?: string;
  ownerUserId?: string;
  owner?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Communication {
  id: number;
  leadId: number;
  type: 'email' | 'sms' | 'call' | 'note';
  subject?: string;
  message: string;
  timestamp: string;
  status?: string;
}

const PIPELINE_STAGES: { value: LeadStage; label: string; shortLabel: string; description: string }[] = [
  { value: "future_lead", label: "Future Lead", shortLabel: "Future", description: "Potential leads for future engagement" },
  { value: "lead", label: "Lead", shortLabel: "Lead", description: "New leads to be contacted" },
  { value: "hot_lead", label: "Hot Lead", shortLabel: "Hot", description: "Actively engaged prospects" },
  { value: "mock_up", label: "Mock Up", shortLabel: "Mock", description: "Mock-up creation in progress" },
  { value: "mock_up_sent", label: "Mock Up Sent/Revisions", shortLabel: "Sent", description: "Mock-up sent, awaiting feedback" },
  { value: "team_store_or_direct_order", label: "Team Store / Direct Order", shortLabel: "Order", description: "Order placement phase" },
  { value: "current_clients", label: "Current Clients", shortLabel: "Clients", description: "Active customers" },
  { value: "no_answer_delete", label: "No Answer/Archive", shortLabel: "Archive", description: "Unresponsive or archived leads" },
];

const helpItems = [
  {
    question: "How do I move a lead through the pipeline?",
    answer: "Click on a lead card to open the detail view, then use the 'Move to Stage' dropdown to advance or change the lead's stage.",
  },
  {
    question: "What happens when I archive a lead?",
    answer: "Moving a lead to 'No Answer/Archive' stage automatically archives it. Archived leads can be viewed in the archived leads section.",
  },
  {
    question: "How do I communicate with leads?",
    answer: "Click on a lead card to see communication options. You can log emails, SMS, or phone calls directly from the lead detail view.",
  },
  {
    question: "Can I see all my communications with a lead?",
    answer: "Yes, when you select a lead, the communication timeline shows all past interactions including emails, SMS, calls, and notes.",
  }
];

function CollapsibleSection({ 
  title, 
  defaultOpen = true, 
  children,
  icon: Icon,
  badge
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  icon?: React.ElementType;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-3">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
          <span className="text-sm sm:text-base font-semibold text-foreground">{title}</span>
          {badge}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-in slide-in-from-top-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SalesTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedStage, setSelectedStage] = useState<LeadStage>("future_lead");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [communicationType, setCommunicationType] = useState<'email' | 'sms' | 'call' | 'note' | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [moveToStage, setMoveToStage] = useState<LeadStage | "">("");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: communications = [] } = useQuery<Communication[]>({
    queryKey: ["/api/communications/lead", selectedLead?.id],
    queryFn: selectedLead ? async () => {
      const res = await fetch(`/api/communications/lead/${selectedLead.id}`);
      if (!res.ok) return [];
      return res.json();
    } : undefined,
    enabled: !!selectedLead,
  });

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      future_lead: [],
      lead: [],
      hot_lead: [],
      mock_up: [],
      mock_up_sent: [],
      team_store_or_direct_order: [],
      current_clients: [],
      no_answer_delete: [],
    };
    
    leads.forEach(lead => {
      if (grouped[lead.stage as LeadStage]) {
        grouped[lead.stage as LeadStage].push(lead);
      }
    });
    
    return grouped;
  }, [leads]);

  const updateLeadStageMutation = useMutation({
    mutationFn: (data: { leadId: number; stage: LeadStage }) =>
      apiRequest(`/api/leads/${data.leadId}`, { 
        method: "PUT",
        body: { stage: data.stage }
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Lead stage updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
      setMoveToStage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead stage", variant: "destructive" });
    },
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: (data: { leadId: number; type: string; subject?: string; message: string }) =>
      apiRequest("/api/communications", { method: "POST", body: data }),
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: "Communication logged successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/communications/lead", variables.leadId] });
      setCommunicationType(null);
      setEmailSubject("");
      setEmailBody("");
      setSmsMessage("");
      setCallNotes("");
      setNoteContent("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log communication", variant: "destructive" });
    },
  });

  const handleMoveLead = () => {
    if (!selectedLead || !moveToStage) return;
    updateLeadStageMutation.mutate({ leadId: selectedLead.id, stage: moveToStage as LeadStage });
  };

  const handleSendCommunication = () => {
    if (!selectedLead) return;

    switch (communicationType) {
      case 'email':
        if (!emailSubject || !emailBody) {
          toast({ title: "Error", description: "Please fill in all email fields", variant: "destructive" });
          return;
        }
        sendCommunicationMutation.mutate({
          leadId: selectedLead.id,
          type: 'email',
          subject: emailSubject,
          message: emailBody
        });
        break;
      case 'sms':
        if (!smsMessage) {
          toast({ title: "Error", description: "Please enter SMS message", variant: "destructive" });
          return;
        }
        sendCommunicationMutation.mutate({
          leadId: selectedLead.id,
          type: 'sms',
          message: smsMessage
        });
        break;
      case 'call':
        if (!callNotes) {
          toast({ title: "Error", description: "Please enter call notes", variant: "destructive" });
          return;
        }
        sendCommunicationMutation.mutate({
          leadId: selectedLead.id,
          type: 'call',
          message: callNotes
        });
        break;
      case 'note':
        if (!noteContent) {
          toast({ title: "Error", description: "Please enter note content", variant: "destructive" });
          return;
        }
        sendCommunicationMutation.mutate({
          leadId: selectedLead.id,
          type: 'note',
          message: noteContent
        });
        break;
    }
  };

  const getStageColor = (stage: LeadStage) => {
    const colors: Record<LeadStage, string> = {
      future_lead: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      lead: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      hot_lead: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      mock_up: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      mock_up_sent: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      team_store_or_direct_order: "bg-green-500/20 text-green-400 border-green-500/30",
      current_clients: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
      no_answer_delete: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[stage] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStageIcon = (stage: LeadStage) => {
    if (stage === "current_clients") return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight gradient-text" data-testid="heading-sales-tracker">Sales Tracker</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage your sales pipeline and track lead progress</p>
        </div>
        <HelpButton pageTitle="Sales Tracker" helpItems={helpItems} />
      </div>

      <Tabs value={selectedStage} onValueChange={(value) => setSelectedStage(value as LeadStage)} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full h-auto bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md" data-testid="pipeline-tabs">
            {PIPELINE_STAGES.map((stage) => (
              <TabsTrigger
                key={stage.value}
                value={stage.value}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex flex-col items-center gap-1 py-2 sm:py-3 px-2 sm:px-3 min-w-[70px] sm:min-w-[100px] rounded-lg transition-all"
                data-testid={`tab-${stage.value}`}
              >
                <span className="font-medium text-[10px] sm:text-sm whitespace-nowrap">{isMobile ? stage.shortLabel : stage.label}</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs bg-white/10 text-white border-none px-1.5">
                  {leadsByStage[stage.value].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {PIPELINE_STAGES.map((stage) => (
          <TabsContent key={stage.value} value={stage.value} className="space-y-4" data-testid={`content-${stage.value}`}>
            <CollapsibleSection 
              title={stage.label} 
              icon={Filter}
              defaultOpen={true}
              badge={
                <Badge variant="secondary" className="text-xs bg-white/10 text-white border-none ml-2">
                  {leadsByStage[stage.value].length} {leadsByStage[stage.value].length === 1 ? 'lead' : 'leads'}
                </Badge>
              }
            >
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">{stage.description}</p>

              {leadsByStage[stage.value].length === 0 ? (
                <Card className="glass-card border-dashed border-2 border-white/10 bg-transparent">
                  <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm">
                    No leads in this stage yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {leadsByStage[stage.value].map((lead) => (
                    <Card
                      key={lead.id}
                      className="glass-card cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] transition-all duration-200 border-white/10 hover:bg-white/5"
                      onClick={() => setSelectedLead(lead)}
                      data-testid={`lead-card-${lead.id}`}
                    >
                      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg flex items-center gap-2 text-foreground truncate">
                              {lead.leadCode}
                              {getStageIcon(stage.value)}
                            </CardTitle>
                            <CardDescription className="mt-1 text-muted-foreground text-xs sm:text-sm">
                              Score: {lead.score}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={cn("border text-[10px] sm:text-xs shrink-0", getStageColor(stage.value))}>
                            {isMobile ? stage.shortLabel : stage.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-6 pt-0">
                        <div className="space-y-1.5 sm:space-y-2">
                          {lead.organization && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80">
                              <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                              <span className="truncate">{lead.organization.name}</span>
                            </div>
                          )}
                          {lead.contact && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                              <span className="truncate">{lead.contact.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          {lead.notes && !isMobile && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {lead.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 hover:bg-white/10 h-7 sm:h-8 px-2 sm:px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                              setCommunicationType('email');
                            }}
                            disabled={!lead.contact?.email}
                            data-testid={`button-email-${lead.id}`}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 hover:bg-white/10 h-7 sm:h-8 px-2 sm:px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                              setCommunicationType('sms');
                            }}
                            disabled={!lead.contact?.phone}
                            data-testid={`button-sms-${lead.id}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 hover:bg-white/10 h-7 sm:h-8 px-2 sm:px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                              setCommunicationType('call');
                            }}
                            data-testid={`button-call-${lead.id}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedLead && !communicationType} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border-white/10" data-testid="dialog-lead-detail">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base sm:text-lg">Lead Details: {selectedLead?.leadCode}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              View and manage lead information and communications
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Organization</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLead.organization?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Contact</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLead.contact?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Email</label>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedLead.contact?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Phone</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLead.contact?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Score</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLead.score}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Source</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLead.source || 'N/A'}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground">Notes</label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedLead.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Move to Stage</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={moveToStage} onValueChange={(value) => setMoveToStage(value as LeadStage | "")}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm" data-testid="select-move-stage">
                      <SelectValue placeholder="Select new stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.filter(s => s.value !== selectedLead.stage).map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleMoveLead} 
                    disabled={!moveToStage || updateLeadStageMutation.isPending}
                    data-testid="button-move-lead"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Communication Timeline</label>
                <div className="border border-white/10 rounded-lg max-h-32 sm:max-h-48 overflow-y-auto bg-black/20">
                  {communications.length === 0 ? (
                    <div className="p-4 text-xs sm:text-sm text-center text-muted-foreground">
                      No communications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {communications.map((comm) => (
                        <div key={comm.id} className="p-2 sm:p-3 text-xs sm:text-sm" data-testid={`comm-${comm.id}`}>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize border-white/10 text-foreground text-[10px] sm:text-xs">{comm.type}</Badge>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {format(new Date(comm.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {comm.subject && <p className="font-medium mt-1 text-foreground text-xs sm:text-sm">{comm.subject}</p>}
                          <p className="text-muted-foreground mt-1 line-clamp-2">{comm.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-xs sm:text-sm"
                  onClick={() => setCommunicationType('email')}
                  disabled={!selectedLead.contact?.email}
                  data-testid="button-log-email"
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isMobile ? 'Email' : 'Log Email'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-xs sm:text-sm"
                  onClick={() => setCommunicationType('sms')}
                  disabled={!selectedLead.contact?.phone}
                  data-testid="button-log-sms"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isMobile ? 'SMS' : 'Log SMS'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-xs sm:text-sm"
                  onClick={() => setCommunicationType('call')}
                  data-testid="button-log-call"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isMobile ? 'Call' : 'Log Call'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-xs sm:text-sm"
                  onClick={() => setCommunicationType('note')}
                  data-testid="button-add-note"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isMobile ? 'Note' : 'Add Note'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={communicationType === 'email'} onOpenChange={(open) => !open && setCommunicationType(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md glass-panel border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Email</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              Record email communication with {selectedLead?.contact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Body</label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email content"
                rows={4}
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCommunicationType(null)} className="border-white/10 w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSendCommunication} 
              disabled={sendCommunicationMutation.isPending}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Log Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={communicationType === 'sms'} onOpenChange={(open) => !open && setCommunicationType(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md glass-panel border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log SMS</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              Record SMS communication with {selectedLead?.contact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Message</label>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="SMS message"
                rows={3}
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCommunicationType(null)} className="border-white/10 w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSendCommunication} 
              disabled={sendCommunicationMutation.isPending}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Log SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={communicationType === 'call'} onOpenChange={(open) => !open && setCommunicationType(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md glass-panel border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Call</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              Record call notes with {selectedLead?.contact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Call Notes</label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Summary of the call"
                rows={4}
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCommunicationType(null)} className="border-white/10 w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSendCommunication} 
              disabled={sendCommunicationMutation.isPending}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={communicationType === 'note'} onOpenChange={(open) => !open && setCommunicationType(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md glass-panel border-white/10">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Note</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
              Add a note about {selectedLead?.contact?.name || selectedLead?.organization?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Note Content</label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Your note"
                rows={4}
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCommunicationType(null)} className="border-white/10 w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSendCommunication} 
              disabled={sendCommunicationMutation.isPending}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
