import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Building2,
  Image as ImageIcon,
  Ticket,
  CalendarDays,
  User,
  DollarSign,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Trophy,
} from "lucide-react";

interface EventPortalData {
  event: {
    id: number;
    eventCode: string;
    name: string;
    eventType: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    timezone: string;
    location: string | null;
    thumbnailUrl: string | null;
    logoUrl: string | null;
    brandingConfig: any;
  };
  organization: {
    id: number;
    name: string;
    logoUrl: string | null;
  } | null;
  schedules: Array<{
    id: number;
    title: string;
    description: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    activityType: string | null;
    speakerName: string | null;
  }>;
  venues: Array<{
    id: number;
    venueName: string;
    address: string | null;
    city: string | null;
    state: string | null;
    capacity: number | null;
  }>;
  sponsors: Array<{
    id: number;
    name: string;
    tier: string | null;
    logoUrl: string | null;
  }>;
  ticketTiers: Array<{
    id: number;
    name: string;
    price: string | null;
    description: string | null;
    quantityAvailable: number | null;
    quantitySold: number | null;
  }>;
  graphics: Array<{
    id: number;
    fileName: string;
    fileUrl: string | null;
    fileType: string | null;
  }>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventTypeBadge(type: string) {
  const variants: Record<string, { color: string; label: string }> = {
    'camp': { color: 'bg-green-500', label: 'Camp' },
    'clinic': { color: 'bg-blue-500', label: 'Clinic' },
    'seminar': { color: 'bg-purple-500', label: 'Seminar' },
    'small-scale': { color: 'bg-orange-500', label: 'Small Event' },
    'large-scale': { color: 'bg-red-500', label: 'Large Event' },
  };
  const variant = variants[type] || { color: 'bg-gray-500', label: type };
  return <Badge className={cn(variant.color, "text-white")}>{variant.label}</Badge>;
}

function getStatusBadge(status: string) {
  const variants: Record<string, { color: string; label: string }> = {
    'draft': { color: 'bg-gray-500', label: 'Draft' },
    'planning': { color: 'bg-yellow-500', label: 'Planning' },
    'approved': { color: 'bg-blue-500', label: 'Approved' },
    'live': { color: 'bg-green-500', label: 'Live' },
    'completed': { color: 'bg-purple-500', label: 'Completed' },
    'archived': { color: 'bg-gray-400', label: 'Archived' },
  };
  const variant = variants[status] || { color: 'bg-gray-500', label: status };
  return <Badge className={cn(variant.color, "text-white")}>{variant.label}</Badge>;
}

function getSponsorTierColor(tier: string | null): string {
  const tierColors: Record<string, string> = {
    'platinum': 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200',
    'gold': 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100',
    'silver': 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100',
    'bronze': 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100',
  };
  return tierColors[(tier || '').toLowerCase()] || 'border-gray-200 bg-white';
}

export default function CustomerEventPortal() {
  const params = useParams();
  const eventId = parseInt(params.id || '0');
  const [activeTab, setActiveTab] = useState("overview");

  const { data: portalData, isLoading, error } = useQuery<EventPortalData>({
    queryKey: ['/api/public/events', eventId, 'portal'],
    queryFn: async () => {
      const response = await fetch(`/api/public/events/${eventId}/portal-data`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      return response.json();
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-carbon/80 border-graphite">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
            <p className="text-white/60">
              The event you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, organization, schedules, venues, sponsors, ticketTiers, graphics } = portalData;
  const primaryColor = event.brandingConfig?.primaryColor || '#3b82f6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto p-4 md:p-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-carbon to-obsidian border border-graphite/50 shadow-2xl mb-8">
          {event.thumbnailUrl && (
            <div className="absolute inset-0 opacity-20">
              <img src={event.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
            </div>
          )}
          
          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
              {event.logoUrl && (
                <img
                  src={event.logoUrl}
                  alt={event.name}
                  className="w-24 h-24 rounded-xl object-contain bg-white p-2 shadow-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {getEventTypeBadge(event.eventType)}
                  {getStatusBadge(event.status)}
                  <span className="text-white/50 text-sm font-mono">{event.eventCode}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="text-event-name">
                  {event.name}
                </h1>
                {organization && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Building2 className="h-4 w-4" />
                    <span>Hosted by {organization.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-white/50">Start Date</div>
                  <div className="text-white font-medium" data-testid="text-event-start-date">
                    {formatDate(event.startDate)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-white/50">End Date</div>
                  <div className="text-white font-medium" data-testid="text-event-end-date">
                    {formatDate(event.endDate)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-white/50">Location</div>
                  <div className="text-white font-medium" data-testid="text-event-location">
                    {event.location || "TBD"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-carbon/80 border border-graphite p-1 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            {schedules.length > 0 && (
              <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-schedule">
                Schedule
              </TabsTrigger>
            )}
            {venues.length > 0 && (
              <TabsTrigger value="venues" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-venues">
                Venues
              </TabsTrigger>
            )}
            {ticketTiers.length > 0 && (
              <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-tickets">
                Tickets
              </TabsTrigger>
            )}
            {sponsors.length > 0 && (
              <TabsTrigger value="sponsors" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-sponsors">
                Sponsors
              </TabsTrigger>
            )}
            {graphics.length > 0 && (
              <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-gallery">
                Gallery
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-carbon/80 border-graphite">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-white/50">Event Type</div>
                    <div className="text-white">{event.eventType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </div>
                  <Separator className="bg-graphite" />
                  <div className="space-y-2">
                    <div className="text-sm text-white/50">Timezone</div>
                    <div className="text-white">{event.timezone}</div>
                  </div>
                  {venues.length > 0 && (
                    <>
                      <Separator className="bg-graphite" />
                      <div className="space-y-2">
                        <div className="text-sm text-white/50">Primary Venue</div>
                        <div className="text-white">{venues[0].venueName}</div>
                        {venues[0].address && (
                          <div className="text-white/60 text-sm">
                            {venues[0].address}
                            {venues[0].city && `, ${venues[0].city}`}
                            {venues[0].state && `, ${venues[0].state}`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-carbon/80 border-graphite">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{schedules.length}</div>
                      <div className="text-white/60 text-sm">Sessions</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{venues.length}</div>
                      <div className="text-white/60 text-sm">Venues</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{sponsors.length}</div>
                      <div className="text-white/60 text-sm">Sponsors</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{ticketTiers.length}</div>
                      <div className="text-white/60 text-sm">Ticket Types</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="bg-carbon/80 border-graphite">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Event Schedule
                </CardTitle>
                <CardDescription className="text-white/60">
                  All scheduled sessions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white/5 rounded-lg border border-graphite/50"
                      data-testid={`schedule-item-${session.id}`}
                    >
                      <div className="flex-shrink-0 w-full md:w-32 text-center md:text-left">
                        {session.startTime && (
                          <div className="text-primary font-semibold">
                            {formatTime(session.startTime)}
                          </div>
                        )}
                        {session.endTime && (
                          <div className="text-white/50 text-sm">
                            to {formatTime(session.endTime)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{session.title}</h4>
                        {session.description && (
                          <p className="text-white/60 text-sm mt-1">{session.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/50">
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                          )}
                          {session.speakerName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {session.speakerName}
                            </span>
                          )}
                          {session.activityType && (
                            <Badge variant="outline" className="text-white/70 border-white/20">
                              {session.activityType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venues.map((venue) => (
                <Card key={venue.id} className="bg-carbon/80 border-graphite" data-testid={`venue-card-${venue.id}`}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {venue.venueName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {venue.address && (
                      <div className="flex items-start gap-2 text-white/70">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {venue.address}
                          {venue.city && `, ${venue.city}`}
                          {venue.state && `, ${venue.state}`}
                        </span>
                      </div>
                    )}
                    {venue.capacity && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {venue.capacity.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketTiers.map((tier) => (
                <Card key={tier.id} className="bg-carbon/80 border-graphite overflow-hidden" data-testid={`ticket-tier-${tier.id}`}>
                  <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-primary" />
                        {tier.name}
                      </span>
                      {tier.price && (
                        <span className="text-2xl font-bold text-primary">${tier.price}</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tier.description && (
                      <p className="text-white/70">{tier.description}</p>
                    )}
                    {tier.quantityAvailable !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Available</span>
                        <span className="text-white font-medium">
                          {(tier.quantityAvailable - (tier.quantitySold || 0)).toLocaleString()} / {tier.quantityAvailable.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sponsors" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sponsors.map((sponsor) => (
                <Card
                  key={sponsor.id}
                  className={cn("border-2 transition-shadow hover:shadow-lg", getSponsorTierColor(sponsor.tier))}
                  data-testid={`sponsor-card-${sponsor.id}`}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px] gap-3">
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-mist flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-fog" />
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-medium text-carbon">{sponsor.name}</div>
                      {sponsor.tier && (
                        <Badge variant="outline" className="mt-1 capitalize">
                          {sponsor.tier}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card className="bg-carbon/80 border-graphite">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Event Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {graphics.map((graphic) => (
                    <div
                      key={graphic.id}
                      className="relative aspect-square bg-obsidian rounded-lg overflow-hidden group cursor-pointer"
                      data-testid={`gallery-item-${graphic.id}`}
                    >
                      {graphic.fileUrl ? (
                        <>
                          <img
                            src={graphic.fileUrl}
                            alt={graphic.fileName}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a
                              href={graphic.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white flex items-center gap-1 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Full Size
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-smoke" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center pb-8">
          <p className="text-white/40 text-sm">
            Powered by Rich Habits ERP
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
