import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { hasPermission } from "@/lib/permissions";
import type { Event, EventStaff, EventContractor, EventBudget, EventCampaign, EventRegistration } from "@shared/schema";

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

  // Fetch event data
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

  const canEdit = hasPermission(user, "events", "write");

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
      {/* Header */}
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

      {/* Event Info Card */}
      <Card>
        <CardContent className="pt-6">
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

      {/* Tabs */}
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-event-detail">
          <TabsTrigger value="staff" data-testid="tab-staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="contractors" data-testid="tab-contractors">Contractors ({contractors.length})</TabsTrigger>
          <TabsTrigger value="budgets" data-testid="tab-budgets">Budget ({budgets.length})</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="registrations" data-testid="tab-registrations">Registrations ({registrations.length})</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
