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
import { Mail, Phone, MessageSquare, ArrowRight, User, Building, Calendar, TrendingUp } from "lucide-react";
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

const PIPELINE_STAGES: { value: LeadStage; label: string; description: string }[] = [
  { value: "future_lead", label: "Future Lead", description: "Potential leads for future engagement" },
  { value: "lead", label: "Lead", description: "New leads to be contacted" },
  { value: "hot_lead", label: "Hot Lead", description: "Actively engaged prospects" },
  { value: "mock_up", label: "Mock Up", description: "Mock-up creation in progress" },
  { value: "mock_up_sent", label: "Mock Up Sent/Revisions", description: "Mock-up sent, awaiting feedback" },
  { value: "team_store_or_direct_order", label: "Team Store / Direct Order", description: "Order placement phase" },
  { value: "current_clients", label: "Current Clients", description: "Active customers" },
  { value: "no_answer_delete", label: "No Answer/Archive", description: "Unresponsive or archived leads" },
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

export function SalesTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Group leads by stage
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
    if (stage === "current_clients") return <TrendingUp className="h-4 w-4" />;
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
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text" data-testid="heading-sales-tracker">Sales Tracker</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and track lead progress</p>
        </div>
        <HelpButton pageTitle="Sales Tracker" helpItems={helpItems} />
      </div>

      <Tabs value={selectedStage} onValueChange={(value) => setSelectedStage(value as LeadStage)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 h-auto bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md" data-testid="pipeline-tabs">
          {PIPELINE_STAGES.map((stage) => (
            <TabsTrigger
              key={stage.value}
              value={stage.value}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex flex-col items-center gap-1 py-3 rounded-lg transition-all"
              data-testid={`tab-${stage.value}`}
            >
              <span className="font-medium text-xs sm:text-sm">{stage.label}</span>
              <Badge variant="secondary" className="text-xs bg-white/10 text-white border-none">
                {leadsByStage[stage.value].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {PIPELINE_STAGES.map((stage) => (
          <TabsContent key={stage.value} value={stage.value} className="space-y-4" data-testid={`content-${stage.value}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{stage.label}</h2>
                <p className="text-muted-foreground text-sm">{stage.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {leadsByStage[stage.value].length} {leadsByStage[stage.value].length === 1 ? 'lead' : 'leads'}
              </div>
            </div>

            {leadsByStage[stage.value].length === 0 ? (
              <Card className="glass-card border-dashed border-2 border-white/10 bg-transparent">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No leads in this stage yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leadsByStage[stage.value].map((lead) => (
                  <Card
                    key={lead.id}
                    className="glass-card cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] transition-all duration-200 border-white/10 hover:bg-white/5"
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`lead-card-${lead.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                            {lead.leadCode}
                            {getStageIcon(stage.value)}
                          </CardTitle>
                          <CardDescription className="mt-1 text-muted-foreground">
                            Score: {lead.score}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={cn("border", getStageColor(stage.value))}>
                          {stage.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lead.organization && (
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.organization.name}</span>
                          </div>
                        )}
                        {lead.contact && (
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.contact.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        {lead.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {lead.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 hover:bg-white/10"
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
                          className="border-white/10 hover:bg-white/10"
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
                          className="border-white/10 hover:bg-white/10"
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
          </TabsContent>
        ))}
      </Tabs>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead && !communicationType} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border-white/10" data-testid="dialog-lead-detail">
          <DialogHeader>
            <DialogTitle className="text-foreground">Lead Details: {selectedLead?.leadCode}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and manage lead information and communications
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Organization</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.organization?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Contact</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.contact?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.contact?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.contact?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Score</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.score}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Source</label>
                  <p className="text-sm text-muted-foreground">{selectedLead.source || 'N/A'}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <label className="text-sm font-medium text-foreground">Notes</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedLead.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Move to Stage</label>
                <div className="flex gap-2">
                  <Select value={moveToStage} onValueChange={(value) => setMoveToStage(value as LeadStage | "")}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-move-stage">
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
                <label className="text-sm font-medium text-foreground">Communication Timeline</label>
                <div className="border border-white/10 rounded-lg max-h-48 overflow-y-auto bg-black/20">
                  {communications.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      No communications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {communications.map((comm) => (
                        <div key={comm.id} className="p-3 text-sm" data-testid={`comm-${comm.id}`}>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize border-white/10 text-foreground">{comm.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comm.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {comm.subject && <p className="font-medium mt-1 text-foreground">{comm.subject}</p>}
                          <p className="text-muted-foreground mt-1">{comm.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                  onClick={() => setCommunicationType('email')}
                  disabled={!selectedLead.contact?.email}
                  data-testid="button-log-email"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Log Email
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                  onClick={() => setCommunicationType('sms')}
                  disabled={!selectedLead.contact?.phone}
                  data-testid="button-log-sms"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Log SMS
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                  onClick={() => setCommunicationType('call')}
                  data-testid="button-log-call"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                  onClick={() => setCommunicationType('note')}
                  data-testid="button-add-note"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={!!communicationType} onOpenChange={(open) => !open && setCommunicationType(null)}>
        <DialogContent className="glass-panel border-white/10" data-testid="dialog-communication">
          <DialogHeader>
            <DialogTitle className="capitalize text-foreground">Log {communicationType}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Record a new {communicationType} communication with this lead</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {communicationType === 'email' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="input-email-subject"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body"
                    rows={5}
                    className="bg-black/20 border-white/10 text-white"
                    data-testid="textarea-email-body"
                  />
                </div>
              </>
            )}

            {communicationType === 'sms' && (
              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="SMS message"
                  rows={4}
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="textarea-sms-message"
                />
              </div>
            )}

            {communicationType === 'call' && (
              <div>
                <label className="text-sm font-medium text-foreground">Call Notes</label>
                <Textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Notes from the call"
                  rows={5}
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="textarea-call-notes"
                />
              </div>
            )}

            {communicationType === 'note' && (
              <div>
                <label className="text-sm font-medium text-foreground">Note</label>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note about this lead"
                  rows={4}
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="textarea-note"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommunicationType(null)} className="border-white/10 hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleSendCommunication}
              disabled={sendCommunicationMutation.isPending}
              data-testid="button-send-communication"
              className="bg-primary hover:bg-primary/90"
            >
              {sendCommunicationMutation.isPending ? 'Logging...' : 'Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}