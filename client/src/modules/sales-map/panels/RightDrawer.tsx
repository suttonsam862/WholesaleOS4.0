import { X, Building2, Target, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MapEntity } from "../types";
import { cn } from "@/lib/utils";

interface RightDrawerProps {
  entity: MapEntity | null;
  onClose: () => void;
  isOpen: boolean;
}

const stageLabels: Record<string, string> = {
  future_lead: "Future Lead",
  lead: "Lead",
  hot_lead: "Hot Lead",
  mock_up: "Mock Up",
  mock_up_sent: "Mock Up Sent",
  team_store_or_direct_order: "Team Store / Direct",
  current_clients: "Current Client",
  no_answer_delete: "No Answer",
};

const stageColors: Record<string, string> = {
  future_lead: "bg-gray-500",
  lead: "bg-amber-500",
  hot_lead: "bg-red-500",
  mock_up: "bg-violet-500",
  mock_up_sent: "bg-purple-500",
  team_store_or_direct_order: "bg-green-500",
  current_clients: "bg-emerald-500",
  no_answer_delete: "bg-gray-400",
};

export function RightDrawer({ entity, onClose, isOpen }: RightDrawerProps) {
  return (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-lg border-l shadow-2xl transition-transform duration-300 z-20",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      data-testid="right-drawer"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {entity?.type === "organization" ? (
            <Building2 className="h-5 w-5 text-blue-500" />
          ) : (
            <Target className="h-5 w-5 text-amber-500" />
          )}
          <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {entity?.type === "organization" ? "Organization" : "Lead"} Details
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="close-drawer-button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {entity && (
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-xl font-bold" data-testid="entity-name">
                {entity.name}
              </h2>
              {entity.stage && (
                <Badge
                  className={cn("mt-2", stageColors[entity.stage])}
                  data-testid="entity-stage"
                >
                  {stageLabels[entity.stage] || entity.stage}
                </Badge>
              )}
              {entity.clientType && (
                <Badge variant="outline" className="mt-2 ml-2">
                  {entity.clientType}
                </Badge>
              )}
            </div>

            {(entity.city || entity.state) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span data-testid="entity-location">
                  {[entity.city, entity.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {entity.orderCount !== undefined && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-500">
                    {entity.orderCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
              )}
              {entity.leadCount !== undefined && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-2xl font-bold text-amber-500">
                    {entity.leadCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                {entity.type === "organization" && (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => window.open(`/organizations/list?id=${entity.id}`, "_self")}
                      data-testid="view-org-button"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      View Organization
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => window.open(`/leads/list?orgId=${entity.id}`, "_self")}
                      data-testid="view-leads-button"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      View Leads
                    </Button>
                  </>
                )}
                {entity.type === "lead" && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`/leads/list?id=${entity.id}`, "_self")}
                    data-testid="view-lead-button"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    View Lead Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
