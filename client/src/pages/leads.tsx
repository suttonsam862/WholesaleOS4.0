import { SplitView } from "@/components/layout/split-view";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CreateLeadModal } from "@/components/modals/create-lead-modal";
import { EditLeadModal } from "@/components/modals/edit-lead-modal";
import { apiRequest } from "@/lib/queryClient";
import { Search, ArrowRight, User, Building, Mail, Phone, X, Target, Trash2, Plus, ChevronDown, Filter, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { motion, AnimatePresence } from "framer-motion";

type LeadStage = "future_lead" | "lead" | "hot_lead" | "mock_up" | "mock_up_sent" | "team_store_or_direct_order" | "current_clients" | "no_answer_delete";

interface Organization {
  id: number;
  name: string;
  logoUrl?: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Owner {
  id: string;
  name: string;
}

interface Lead {
  id: number;
  leadCode: string;
  orgId: number;
  contactId?: number;
  ownerUserId?: string;
  stage: LeadStage;
  source: string;
  notes?: string;
  score: number;
  createdAt: string;
  organization?: Organization;
  contact?: Contact;
  owner?: Owner;
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

function MobileLeadCard({ 
  lead, 
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  getStageColor,
}: { 
  lead: Lead;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStageColor: (stage: LeadStage) => string;
}) {
  return (
    <motion.div
      className={cn(
        "rounded-lg border transition-all",
        isSelected 
          ? "bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(0,243,255,0.1)]" 
          : "bg-black/20 border-white/5"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div 
        className="p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm text-foreground truncate">{lead.leadCode}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", getStageColor(lead.stage))}>
              {PIPELINE_STAGES.find(s => s.value === lead.stage)?.shortLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), 'MMM dd')}</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>
        
        {lead.organization && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <OrgLogo
              src={lead.organization.logoUrl}
              orgName={lead.organization.name}
              orgId={lead.organization.id}
              size="xs"
            />
            <span className="truncate">{lead.organization.name}</span>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-1 font-medium text-foreground">{lead.score}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="ml-1 text-foreground">{lead.owner?.name || 'Unassigned'}</span>
                </div>
              </div>
              
              {lead.contact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{lead.contact.name}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                >
                  View Details
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 border-white/10 hover:bg-white/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 border-red-500/20 text-red-500 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Leads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedStage, setSelectedStage] = useState<LeadStage>("future_lead");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [moveToStage, setMoveToStage] = useState<LeadStage | "">("");
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ["/api/leads/owners"],
    retry: false,
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

    leads
      .filter(lead => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            lead.leadCode.toLowerCase().includes(query) ||
            lead.organization?.name?.toLowerCase().includes(query) ||
            lead.contact?.name?.toLowerCase().includes(query) ||
            lead.source.toLowerCase().includes(query) ||
            lead.notes?.toLowerCase().includes(query) ||
            lead.owner?.name?.toLowerCase().includes(query);

          if (!matchesSearch) return false;
        }

        if (ownerFilter && lead.ownerUserId !== ownerFilter) return false;

        return true;
      })
      .forEach(lead => {
        if (grouped[lead.stage]) {
          grouped[lead.stage].push(lead);
        }
      });

    return grouped;
  }, [leads, searchQuery, ownerFilter]);

  const updateLeadStageMutation = useMutation({
    mutationFn: (data: { leadId: number; stage: LeadStage }) =>
      apiRequest(`/api/leads/${data.leadId}`, {
        method: "PUT",
        body: { stage: data.stage }
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Lead stage updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSelectedLead(null);
      setMoveToStage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead stage", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: number) =>
      apiRequest(`/api/leads/${leadId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Success", description: "Lead deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDeleteLeadId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" });
    },
  });

  const handleMoveLead = () => {
    if (!selectedLead || !moveToStage) return;
    updateLeadStageMutation.mutate({ leadId: selectedLead.id, stage: moveToStage as LeadStage });
  };

  const handleEditLead = (leadId: number) => {
    setEditingLeadId(leadId);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteLeadId) {
      deleteLeadMutation.mutate(deleteLeadId);
    }
  };

  const getStageColor = (stage: LeadStage) => {
    const colors: Record<LeadStage, string> = {
      future_lead: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      lead: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      hot_lead: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      mock_up: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      mock_up_sent: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      team_store_or_direct_order: "bg-green-500/10 text-green-500 border-green-500/20",
      current_clients: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
      no_answer_delete: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[stage] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderMobileLeadsList = () => (
    <div className="space-y-2 pb-4">
      {leadsByStage[selectedStage].length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No leads in this stage
        </div>
      ) : (
        leadsByStage[selectedStage].map((lead) => (
          <MobileLeadCard
            key={lead.id}
            lead={lead}
            isSelected={selectedLead?.id === lead.id}
            isExpanded={expandedLeadId === lead.id}
            onSelect={() => setSelectedLead(lead)}
            onToggleExpand={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
            onEdit={() => handleEditLead(lead.id)}
            onDelete={() => setDeleteLeadId(lead.id)}
            getStageColor={getStageColor}
          />
        ))
      )}
    </div>
  );

  const renderDesktopLeadsList = () => (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-semibold text-foreground">{PIPELINE_STAGES.find(s => s.value === selectedStage)?.label}</h3>
        <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
          {leadsByStage[selectedStage].length}
        </Badge>
      </div>
      
      {leadsByStage[selectedStage].length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No leads in this stage
        </div>
      ) : (
        leadsByStage[selectedStage].map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5",
              selectedLead?.id === lead.id 
                ? "bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(0,243,255,0.1)]" 
                : "bg-black/20 border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm text-foreground truncate">{lead.leadCode}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), 'MMM dd')}</span>
            </div>
            {lead.organization && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <OrgLogo
                  src={lead.organization.logoUrl}
                  orgName={lead.organization.name}
                  orgId={lead.organization.id}
                  size="xs"
                />
                <span className="truncate">{lead.organization.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-white/10 bg-white/5">
                Score: {lead.score}
              </Badge>
              {lead.owner && (
                <span className="text-[10px] text-muted-foreground">{lead.owner.name}</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-3 sm:gap-4 p-3 sm:p-0">
      <div className="space-y-3 sm:space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight gradient-text" data-testid="heading-leads">All Leads</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage sales pipeline leads across all stages
            </p>
          </div>
          <Button onClick={() => setIsCreateLeadOpen(true)} data-testid="button-create-lead" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.3)] w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Lead
          </Button>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors sm:hidden">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Filters & Search</span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              filtersOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="sm:block">
            <Card className="glass-card border-white/10 mt-2 sm:mt-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 h-9 sm:h-10 text-sm"
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Select value={ownerFilter || undefined} onValueChange={setOwnerFilter}>
                      <SelectTrigger data-testid="select-owner-filter" className="flex-1 sm:w-[200px] bg-black/20 border-white/10 focus:border-primary/50 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Filter by owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ownerFilter && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setOwnerFilter("")}
                        data-testid="button-clear-owner-filter"
                        title="Clear owner filter"
                        className="border-white/10 hover:bg-white/5 h-9 sm:h-10 w-9 sm:w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <ScrollArea className="w-full pb-1">
          <div className="inline-flex w-auto min-w-full h-auto bg-black/20 border border-white/10 p-1 rounded-lg">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setSelectedStage(stage.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 sm:py-2 px-2 sm:px-4 min-w-[60px] sm:min-w-[100px] transition-all duration-300 rounded-md text-xs sm:text-sm font-medium",
                  selectedStage === stage.value 
                    ? "bg-primary/20 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <span className="whitespace-nowrap">{isMobile ? stage.shortLabel : stage.label}</span>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 bg-white/5 border-white/10">
                  {leadsByStage[stage.value].length}
                </Badge>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex-1 min-h-0">
        {isMobile ? (
          <ScrollArea className="h-full">
            {selectedLead ? (
              <div className="space-y-4 sm:space-y-6 pb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedLead(null)}
                  className="mb-2"
                >
                  <ChevronDown className="w-4 h-4 mr-1 rotate-90" />
                  Back to list
                </Button>
                
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold gradient-text">
                    {selectedLead.leadCode}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStageColor(selectedLead.stage)}>
                      {PIPELINE_STAGES.find(s => s.value === selectedLead.stage)?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {format(new Date(selectedLead.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <Card className="glass-card border-white/10">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <OrgLogo
                        src={selectedLead.organization?.logoUrl}
                        orgName={selectedLead.organization?.name || 'No Organization'}
                        orgId={selectedLead.organization?.id}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedLead.organization?.name || 'No Organization'}</p>
                        <p className="text-xs text-muted-foreground">Organization</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="ml-1 text-foreground">{selectedLead.contact?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-1 text-foreground truncate">{selectedLead.contact?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/10">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Move to Stage</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex flex-col gap-2">
                      <Select value={moveToStage} onValueChange={(value) => setMoveToStage(value as LeadStage | "")}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-sm h-9">
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
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                      >
                        {updateLeadStageMutation.isPending ? "Moving..." : "Move Lead"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLead(selectedLead.id)}
                    className="flex-1 border-white/10 hover:bg-white/5"
                  >
                    Edit Lead
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteLeadId(selectedLead.id)}
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              renderMobileLeadsList()
            )}
          </ScrollArea>
        ) : (
          <SplitView
            sidebar={renderDesktopLeadsList()}
            content={
              selectedLead ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold gradient-text">
                        {selectedLead.leadCode}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStageColor(selectedLead.stage)}>
                          {PIPELINE_STAGES.find(s => s.value === selectedLead.stage)?.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {format(new Date(selectedLead.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLead(selectedLead.id)}
                        className="border-white/10 hover:bg-white/5"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteLeadId(selectedLead.id)}
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-card border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <OrgLogo
                            src={selectedLead.organization?.logoUrl}
                            orgName={selectedLead.organization?.name || 'No Organization'}
                            orgId={selectedLead.organization?.id}
                            size="md"
                            showColorRing
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedLead.organization?.name || 'No Organization'}</p>
                            <p className="text-xs text-muted-foreground">Organization</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedLead.contact?.name || 'No Contact'}</p>
                            <p className="text-xs text-muted-foreground">Contact Person</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedLead.contact?.email || 'No Email'}</p>
                            <p className="text-xs text-muted-foreground">Email Address</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{selectedLead.contact?.phone || 'No Phone'}</p>
                            <p className="text-xs text-muted-foreground">Phone Number</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lead Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Lead Score</span>
                            <span className="font-medium text-foreground">{selectedLead.score}/100</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
                              style={{ width: `${Math.min(selectedLead.score, 100)}%` }} 
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Source</p>
                            <p className="text-sm font-medium text-foreground">{selectedLead.source || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Owner</p>
                            <p className="text-sm font-medium text-foreground">{selectedLead.owner?.name || 'Unassigned'}</p>
                          </div>
                        </div>

                        {selectedLead.notes && (
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm italic text-foreground/80">{selectedLead.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pipeline Action</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-medium text-foreground">Move to Stage</label>
                          <Select value={moveToStage} onValueChange={(value) => setMoveToStage(value as LeadStage | "")}>
                            <SelectTrigger className="bg-black/20 border-white/10">
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
                        </div>
                        <Button
                          onClick={handleMoveLead}
                          disabled={!moveToStage || updateLeadStageMutation.isPending}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
                        >
                          {updateLeadStageMutation.isPending ? "Moving..." : "Move Lead"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                  <Target className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Select a lead to view details</p>
                  <p className="text-sm">Choose a lead from the list on the left</p>
                </div>
              )
            }
          />
        )}
      </div>

      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLeadId(null);
        }}
        leadId={editingLeadId}
      />

      <AlertDialog open={deleteLeadId !== null} onOpenChange={(open) => !open && setDeleteLeadId(null)}>
        <AlertDialogContent className="glass-panel border-white/10 max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This action cannot be undone. This will permanently delete the lead and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="border-white/10 hover:bg-white/5 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
