import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Package,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import {
  FUNNEL_STAGE_CONFIGS,
  ZONE_CONFIGS,
  getStageConfig,
  getZoneConfig,
  type ManufacturerFunnelStatus,
  type ManufacturerZone,
} from "@/lib/manufacturerFunnelConfig";

interface ManufacturerJob {
  id: number;
  manufacturingId: number;
  orderId: number;
  manufacturerId: number | null;
  manufacturerStatus: string;
  publicStatus: string;
  requiredDeliveryDate: string | null;
  promisedShipDate: string | null;
  eventDate: string | null;
  sampleRequired: boolean;
  specsLocked: boolean;
  printMethod: string | null;
  priority: string;
  specialInstructions: string | null;
  internalNotes: string | null;
  createdAt: string;
  manufacturing?: any;
  order?: any;
  manufacturer?: any;
}

function useQueryParams() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  return {
    zone: searchParams.get("zone") as ManufacturerZone | null,
    status: searchParams.get("status") as ManufacturerFunnelStatus | null,
    priority: searchParams.get("priority"),
  };
}

export default function ManufacturerQueue() {
  const params = useQueryParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>(params.priority || "all");

  const { data: jobs = [], isLoading } = useQuery<ManufacturerJob[]>({
    queryKey: ["/api/manufacturer-portal/jobs"],
  });

  const activeZone = params.zone ? getZoneConfig(params.zone) : null;
  const activeStatus = params.status ? getStageConfig(params.status) : null;

  const pageTitle = activeStatus?.label || activeZone?.label || "All Jobs";
  const pageDescription = activeStatus?.description || activeZone?.description || "All manufacturer jobs";

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (params.zone) {
      const zoneStatuses = FUNNEL_STAGE_CONFIGS
        .filter((c) => c.zone === params.zone)
        .map((c) => c.value);
      result = result.filter((job) => zoneStatuses.includes(job.manufacturerStatus as ManufacturerFunnelStatus));
    }

    if (params.status) {
      result = result.filter((job) => job.manufacturerStatus === params.status);
    }

    if (priorityFilter !== "all") {
      result = result.filter((job) => job.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.order?.orderCode?.toLowerCase().includes(query) ||
          job.order?.orderName?.toLowerCase().includes(query) ||
          job.order?.organization?.name?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
    });
  }, [jobs, params.zone, params.status, priorityFilter, searchQuery]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    const relevantStatuses = params.zone 
      ? FUNNEL_STAGE_CONFIGS.filter((c) => c.zone === params.zone)
      : FUNNEL_STAGE_CONFIGS;

    for (const config of relevantStatuses) {
      counts[config.value] = jobs.filter((j) => j.manufacturerStatus === config.value).length;
    }
    
    return counts;
  }, [jobs, params.zone]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/manufacturer/home">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">{pageTitle}</h1>
              <p className="text-white/60 text-sm">{pageDescription}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20" data-testid="badge-job-count">
            {filteredJobs.length} jobs
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search by order code, name, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              data-testid="input-search"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white" data-testid="select-priority">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {params.zone && (
            <Select 
              value={params.status || "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  window.location.href = `/manufacturer-portal/queue?zone=${params.zone}`;
                } else {
                  window.location.href = `/manufacturer-portal/queue?status=${value}`;
                }
              }}
            >
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white" data-testid="select-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All in {activeZone?.label}</SelectItem>
                {FUNNEL_STAGE_CONFIGS.filter((c) => c.zone === params.zone).map((config) => (
                  <SelectItem key={config.value} value={config.value}>
                    {config.label} ({stageCounts[config.value] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {params.zone && (
          <div className="flex gap-2 flex-wrap">
            {FUNNEL_STAGE_CONFIGS.filter((c) => c.zone === params.zone).map((config) => {
              const Icon = config.icon;
              const count = stageCounts[config.value] || 0;
              const isActive = params.status === config.value;
              
              return (
                <Link key={config.value} href={`/manufacturer-portal/queue?status=${config.value}`}>
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all px-3 py-1.5",
                      isActive 
                        ? "bg-white/20 text-white border-white/40"
                        : "text-white/60 border-white/20 hover:border-white/40 hover:text-white"
                    )}
                    style={{ borderColor: isActive ? config.color : undefined }}
                    data-testid={`badge-status-${config.value}`}
                  >
                    <Icon className="w-3 h-3 mr-1.5" style={{ color: config.color }} />
                    {config.label}
                    <span className="ml-1.5 opacity-70">({count})</span>
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-380px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-medium text-white/80">No jobs found</h3>
                <p className="text-white/40 text-sm mt-1">
                  {searchQuery ? "Try adjusting your search" : "No jobs in this queue"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job) => {
                const stageConfig = getStageConfig(job.manufacturerStatus as ManufacturerFunnelStatus);
                const StageIcon = stageConfig?.icon || Package;
                const isUrgent = job.priority === "urgent" || job.priority === "high";
                const isOverdue = job.requiredDeliveryDate && new Date(job.requiredDeliveryDate) < new Date();

                return (
                  <Link key={job.id} href={`/manufacturer-portal/job/${job.id}`}>
                    <Card 
                      className={cn(
                        "bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group",
                        isOverdue && "border-red-500/50"
                      )}
                      data-testid={`card-job-${job.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {job.order?.organization?.logoUrl ? (
                              <OrgLogo 
                                src={job.order.organization.logoUrl} 
                                orgName={job.order.organization.name}
                                size="sm"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${stageConfig?.color}20` }}
                              >
                                <StageIcon className="w-5 h-5" style={{ color: stageConfig?.color }} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white truncate" data-testid={`text-order-code-${job.id}`}>
                                {job.order?.orderCode || `Job #${job.id}`}
                              </span>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs" data-testid={`badge-priority-${job.id}`}>
                                  {job.priority}
                                </Badge>
                              )}
                              {isOverdue && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/60 mt-0.5">
                              <span className="truncate">
                                {job.order?.organization?.name || job.order?.orderName || "Unknown"}
                              </span>
                              {job.requiredDeliveryDate && (
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(job.requiredDeliveryDate), "MMM d")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="text-xs border-white/20"
                              style={{ color: stageConfig?.color, borderColor: `${stageConfig?.color}50` }}
                              data-testid={`badge-status-${job.id}`}
                            >
                              <StageIcon className="w-3 h-3 mr-1" />
                              {stageConfig?.label || job.manufacturerStatus}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
