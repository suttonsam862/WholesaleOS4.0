import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { extractDominantColors } from "@/lib/colorExtraction";
import { createGradient, getReadableTextColorForGradient } from "@/lib/contrastUtils";

interface Order {
  id: number;
  orderCode: string;
  orgId: number;
  leadId: number | null;
  salespersonId: string | null;
  orderName: string;
  status: "new" | "waiting_sizes" | "invoiced" | "production" | "shipped" | "completed";
  designApproved: boolean;
  sizesValidated: boolean;
  depositReceived: boolean;
  estDelivery: string | null;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
}

interface Salesperson {
  userId: string;
  userName?: string;
  userEmail?: string;
}

interface DesignJob {
  id: number;
  orderId: number | null;
  assignedDesignerId: string | null;
}

interface Designer {
  id: string;
  name?: string;
  email?: string;
}

interface OrderColumnsProps {
  orders: Order[];
  organizations: Organization[];
  salespeople?: Salesperson[];
  designJobs?: DesignJob[];
  designers?: Designer[];
  groupBy: 'status' | 'designer' | 'salesperson';
  onOrderClick?: (orderId: number) => void;
}

export function OrderColumns({
  orders,
  organizations,
  salespeople = [],
  designJobs = [],
  designers = [],
  groupBy,
  onOrderClick,
}: OrderColumnsProps) {
  const [orgColors, setOrgColors] = useState<Map<number, string[]>>(new Map());

  // Extract colors from organization logos
  useEffect(() => {
    const extractColors = async () => {
      const colorMap = new Map<number, string[]>();
      
      for (const org of organizations) {
        if (org.logoUrl) {
          const colors = await extractDominantColors(org.logoUrl);
          colorMap.set(org.id, colors);
        }
      }
      
      setOrgColors(colorMap);
    };

    extractColors();
  }, [organizations]);

  // Group orders based on groupBy prop
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; orders: Order[] }>();

    // Define group configurations
    const groupConfigs: Record<typeof groupBy, { key: string; label: string }[]> = {
      status: [
        { key: 'new', label: 'New' },
        { key: 'waiting_sizes', label: 'Waiting Sizes' },
        { key: 'invoiced', label: 'Invoiced' },
        { key: 'production', label: 'Production' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'completed', label: 'Completed' },
      ],
      designer: [
        { key: 'unassigned', label: 'Unassigned' },
        ...designers.map(d => ({
          key: d.id,
          label: d.name || d.email || 'Unknown',
        })),
      ],
      salesperson: [
        { key: 'unassigned', label: 'Unassigned' },
        ...salespeople.map(sp => ({
          key: sp.userId,
          label: sp.userName || sp.userEmail || 'Unknown',
        })),
      ],
    };

    // Initialize all groups
    groupConfigs[groupBy].forEach(config => {
      groups.set(config.key, { ...config, orders: [] });
    });

    // Distribute orders into groups
    orders.forEach((order) => {
      let groupKey: string;

      switch (groupBy) {
        case 'status':
          groupKey = order.status;
          break;
        case 'designer':
          // Find design job(s) for this order
          const orderDesignJobs = designJobs.filter(dj => dj.orderId === order.id);
          if (orderDesignJobs.length > 0 && orderDesignJobs[0].assignedDesignerId) {
            groupKey = orderDesignJobs[0].assignedDesignerId;
          } else {
            groupKey = 'unassigned';
          }
          break;
        case 'salesperson':
          groupKey = order.salespersonId || 'unassigned';
          break;
        default:
          groupKey = 'unassigned';
      }

      // Get or create group for this key
      let group = groups.get(groupKey);
      if (!group) {
        // Dynamically create a group for missing IDs
        if (groupKey !== 'unassigned') {
          if (groupBy === 'designer') {
            const designer = designers.find(d => d.id === groupKey);
            group = {
              key: groupKey,
              label: designer ? (designer.name || designer.email || 'Unknown') : 'Unknown Designer',
              orders: []
            };
            groups.set(groupKey, group);
          } else if (groupBy === 'salesperson') {
            const salesperson = salespeople.find(sp => sp.userId === groupKey);
            group = {
              key: groupKey,
              label: salesperson ? (salesperson.userName || salesperson.userEmail || 'Unknown') : 'Unknown Salesperson',
              orders: []
            };
            groups.set(groupKey, group);
          }
        }
      }
      
      if (group) {
        group.orders.push(order);
      }
    });

    return Array.from(groups.values()).filter(group => group.orders.length > 0);
  }, [orders, groupBy, salespeople, designJobs, designers]);

  // Get gradient background for an order based on organization logo
  const getOrderGradient = (order: Order): { background: string; textClass: string } => {
    const colors = orgColors.get(order.orgId);
    
    if (!colors || colors.length === 0) {
      return {
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        textClass: 'text-black',
      };
    }

    const gradient = createGradient(colors, '135deg');
    const textClass = getReadableTextColorForGradient(colors);

    return { background: gradient, textClass };
  };

  const getOrganization = (orgId: number) => {
    return organizations.find(o => o.id === orgId);
  };

  const getSalesperson = (salespersonId: string | null) => {
    if (!salespersonId) return null;
    return salespeople.find(sp => sp.userId === salespersonId);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {groupedOrders.map((group) => (
        <div key={group.key} className="flex flex-col flex-shrink-0" style={{ minWidth: '280px', maxWidth: '280px' }}>
          <div className="mb-3">
            <h3 className="font-semibold text-lg">
              {group.label}
              <span className="ml-2 text-sm text-muted-foreground">({group.orders.length})</span>
            </h3>
          </div>
          <div className="space-y-3 flex-1">
            {group.orders.map((order) => {
              const { background, textClass } = getOrderGradient(order);
              const org = getOrganization(order.orgId);
              const salesperson = getSalesperson(order.salespersonId);

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ background }}
                  onClick={() => onOrderClick?.(order.id)}
                  data-testid={`card-order-${order.id}`}
                >
                  <CardContent className={`p-3 ${textClass}`}>
                    <div className="space-y-2.5">
                      {/* Organization Logo & Order Code */}
                      <div className="flex items-start justify-between gap-2">
                        {org?.logoUrl && (
                          <div className="w-10 h-10 bg-white/90 rounded-md p-1 flex-shrink-0 shadow-sm">
                            <img 
                              src={org.logoUrl} 
                              alt={org.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs font-semibold mb-0.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)' }}>
                            {order.orderCode}
                          </div>
                        </div>
                      </div>

                      {/* Order Name */}
                      <div className="font-bold text-sm line-clamp-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)' }}>
                        {order.orderName}
                      </div>

                      {/* Organization */}
                      <div className="flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-80" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                        <div className="text-xs min-w-0">
                          <div className="font-medium truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{org?.name || 'Unknown'}</div>
                          {org?.city && org?.state && (
                            <div className="opacity-80 truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{org.city}, {org.state}</div>
                          )}
                        </div>
                      </div>

                      {/* Status & Priority */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={order.status}>
                          {order.status.replace(/_/g, ' ')}
                        </StatusBadge>
                        <Badge 
                          variant={order.priority === 'high' ? 'destructive' : order.priority === 'normal' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {order.priority}
                        </Badge>
                      </div>

                      {/* Salesperson */}
                      {salesperson && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="w-3.5 h-3.5 opacity-80" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                          <span className="opacity-90 truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{salesperson.userName || salesperson.userEmail}</span>
                        </div>
                      )}

                      {/* Milestones */}
                      <div className="flex gap-2 text-xs">
                        <span className={order.designApproved ? 'opacity-100 font-medium' : 'opacity-40'} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          ✓ Design
                        </span>
                        <span className={order.sizesValidated ? 'opacity-100 font-medium' : 'opacity-40'} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          ✓ Sizes
                        </span>
                        <span className={order.depositReceived ? 'opacity-100 font-medium' : 'opacity-40'} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          ✓ Deposit
                        </span>
                      </div>

                      {/* Delivery Date */}
                      {order.estDelivery && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 opacity-80" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                          <span className="opacity-90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                            {format(new Date(order.estDelivery), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}

                      {/* View Button */}
                      <div className="pt-1.5 border-t border-white/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full ${textClass} hover:bg-black/10 h-7 text-xs`}
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrderClick?.(order.id);
                          }}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
