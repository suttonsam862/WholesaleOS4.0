import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasPermission } from "@/lib/permissions";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

const STATUS_CONFIG: Record<Event["status"], { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  planning: { label: "Planning", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  live: { label: "Live", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

const EVENT_TYPE_CONFIG: Record<Event["eventType"], { label: string; icon: string }> = {
  "small-scale": { label: "Small Scale", icon: "fas fa-users" },
  "large-scale": { label: "Large Scale", icon: "fas fa-university" },
  "seminar": { label: "Seminar", icon: "fas fa-chalkboard-teacher" },
  "clinic": { label: "Clinic", icon: "fas fa-clipboard-check" },
  "camp": { label: "Camp", icon: "fas fa-campground" },
};

export default function Events() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Check permissions
  const canWrite = hasPermission(user, "events", "write");
  const canDelete = hasPermission(user, "events", "delete");

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!event.name.toLowerCase().includes(searchLower) &&
            !event.eventCode.toLowerCase().includes(searchLower) &&
            !(event.location?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && event.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && event.eventType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [events, searchTerm, statusFilter, typeFilter]);

  // Show loading state
  if (eventsLoading || isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Events</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your events</p>
        </div>
        {canWrite && (
          <Link href="/events/new/wizard">
            <Button data-testid="button-create-event" className="gap-2">
              <i className="fas fa-plus"></i>
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search events by name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-events"
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="small-scale">Small Scale</SelectItem>
                <SelectItem value="large-scale">Large Scale</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="camp">Camp</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <i className="fas fa-th-large"></i>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <i className="fas fa-list"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground" data-testid="text-results-count">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <i className="fas fa-calendar-alt text-4xl mb-4"></i>
              <p>No events found</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-event-${event.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate" data-testid={`text-event-name-${event.id}`}>
                          {event.name}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-event-code-${event.id}`}>
                          {event.eventCode}
                        </p>
                      </div>
                      <StatusBadge status={event.status}>
                        {STATUS_CONFIG[event.status].label}
                      </StatusBadge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <i className={`${EVENT_TYPE_CONFIG[event.eventType].icon} text-muted-foreground`}></i>
                      <span data-testid={`text-event-type-${event.id}`}>{EVENT_TYPE_CONFIG[event.eventType].label}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-map-marker-alt text-muted-foreground"></i>
                        <span className="truncate" data-testid={`text-event-location-${event.id}`}>{event.location}</span>
                      </div>
                    )}
                    {event.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-calendar text-muted-foreground"></i>
                        <span data-testid={`text-event-date-${event.id}`}>
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                          {event.endDate && event.endDate !== event.startDate && ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <i className="fas fa-calendar-alt text-4xl mb-4 block"></i>
                        No events found
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/50" data-testid={`row-event-${event.id}`}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium" data-testid={`text-event-name-${event.id}`}>{event.name}</div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-event-code-${event.id}`}>{event.eventCode}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <i className={`${EVENT_TYPE_CONFIG[event.eventType].icon} text-sm`}></i>
                            <span data-testid={`text-event-type-${event.id}`}>{EVENT_TYPE_CONFIG[event.eventType].label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={event.status}>
                        {STATUS_CONFIG[event.status].label}
                      </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm" data-testid={`text-event-location-${event.id}`}>{event.location || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm" data-testid={`text-event-date-${event.id}`}>
                            {event.startDate ? format(new Date(event.startDate), "MMM d, yyyy") : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-event-${event.id}`}>
                              <i className="fas fa-eye mr-2"></i>
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
