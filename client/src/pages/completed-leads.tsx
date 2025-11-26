import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Organization {
  id: number;
  name: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
}

interface User {
  id: string;
  name: string;
}

interface ArchivedLead {
  id: number;
  leadId: number;
  archivedAt: string;
  archivedBy: string;
  reason?: string;
  lead?: {
    id: number;
    leadCode: string;
    orgId: number;
    contactId?: number;
    ownerUserId?: string;
    stage: "unclaimed" | "claimed" | "contacted" | "qualified" | "won" | "lost";
    source: string;
    notes?: string;
    score: number;
    createdAt: string;
    organization?: Organization;
    contact?: Contact;
    owner?: User;
  };
}

export default function CompletedLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: archivedLeads = [], isLoading } = useQuery<ArchivedLead[]>({
    queryKey: ["/api/leads/archived"],
    retry: false,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (leadId: number) =>
      apiRequest("/api/leads/unarchive", { method: "POST", body: { leadId } }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead unarchived successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unarchive lead",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = archivedLeads.filter(archived => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const lead = archived.lead;
    if (!lead) return false;
    
    return (
      lead.leadCode.toLowerCase().includes(query) ||
      lead.organization?.name?.toLowerCase().includes(query) ||
      lead.contact?.name?.toLowerCase().includes(query) ||
      lead.source.toLowerCase().includes(query) ||
      lead.notes?.toLowerCase().includes(query) ||
      lead.owner?.name?.toLowerCase().includes(query)
    );
  });

  const handleUnarchive = (leadId: number) => {
    unarchiveMutation.mutate(leadId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold" data-testid="heading-completed-leads">
          Completed Leads
        </h1>
      </div>

      <Card className="mb-4 sm:mb-6" data-testid="card-search">
        <CardContent className="p-3 sm:p-4">
          <Input
            placeholder="Search archived leads by code, organization, contact, source, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-archived"
          />
        </CardContent>
      </Card>

      <Card data-testid="card-archived-leads-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full mobile-card-table">
              <thead className="bg-muted/20">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Lead Code</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Stage</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Archived Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads && filteredLeads.length > 0 ? (
                  filteredLeads.map((archived) => {
                    const lead = archived.lead;
                    if (!lead) return null;
                    
                    return (
                      <tr 
                        key={archived.id} 
                        className="hover:bg-muted/10 transition-colors" 
                        data-testid={`row-archived-${archived.id}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-primary" data-testid={`text-lead-code-${archived.id}`}>
                            {lead.leadCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">ORG</span>
                            </div>
                            <span className="font-medium" data-testid={`text-organization-${archived.id}`}>
                              {lead.organization?.name || `Organization #${lead.orgId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-sm" data-testid={`text-contact-${archived.id}`}>
                              {lead.contact?.name || (lead.contactId ? `Contact #${lead.contactId}` : "No contact")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.contact?.email || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.stage} data-testid={`badge-stage-${archived.id}`}>
                            {lead.stage}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm" data-testid={`text-owner-${archived.id}`}>
                            {lead.owner?.name || "Unassigned"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(archived.archivedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleUnarchive(lead.id)}
                            disabled={unarchiveMutation.isPending}
                            className="h-8 px-3"
                            data-testid={`button-unarchive-${archived.id}`}
                            title="Restore this lead"
                          >
                            <i className="fas fa-undo mr-2"></i>
                            Unarchive
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-muted-foreground" colSpan={7}>
                      {searchQuery ? 
                        "No archived leads match your search." :
                        "No archived leads found."
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
