import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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

interface Designer {
  id: string;
  name: string;
  email: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  render: (order: Order, orgs: Organization[], salespeople: Salesperson[]) => React.ReactNode;
  minWidth?: string;
}

interface SpreadsheetTableProps {
  orders: Order[];
  organizations: Organization[];
  salespeople?: Salesperson[];
  designers?: Designer[];
  groupBy: 'status' | 'designer' | 'salesperson';
  onOrderClick?: (orderId: number) => void;
  showFinancial?: boolean;
}

// Define column configurations
const baseColumns: ColumnConfig[] = [
  {
    key: 'orderCode',
    label: 'Order Code',
    render: (order) => (
      <span className="font-mono text-sm font-semibold" data-testid={`text-order-code-${order.id}`}>
        {order.orderCode}
      </span>
    ),
    minWidth: '120px',
  },
  {
    key: 'orderName',
    label: 'Order Name',
    render: (order) => (
      <span className="font-medium" data-testid={`text-order-name-${order.id}`}>
        {order.orderName}
      </span>
    ),
    minWidth: '180px',
  },
  {
    key: 'organization',
    label: 'Organization',
    render: (order, orgs) => {
      const org = orgs.find(o => o.id === order.orgId);
      return (
        <div className="flex flex-col">
          <span className="font-medium">{org?.name || 'Unknown'}</span>
          {org?.city && org?.state && (
            <span className="text-xs opacity-70">{org.city}, {org.state}</span>
          )}
        </div>
      );
    },
    minWidth: '160px',
  },
  {
    key: 'status',
    label: 'Status',
    render: (order) => (
      <StatusBadge status={order.status}>
        {order.status.replace(/_/g, ' ')}
      </StatusBadge>
    ),
    minWidth: '130px',
  },
  {
    key: 'priority',
    label: 'Priority',
    render: (order) => (
      <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'normal' ? 'default' : 'secondary'}>
        {order.priority}
      </Badge>
    ),
    minWidth: '100px',
  },
  {
    key: 'salesperson',
    label: 'Salesperson',
    render: (order, _orgs, salespeople = []) => {
      const salesperson = salespeople.find(sp => sp.userId === order.salespersonId);
      return salesperson?.userName || 'Unassigned';
    },
    minWidth: '150px',
  },
  {
    key: 'checkboxes',
    label: 'Milestones',
    render: (order) => (
      <div className="flex gap-2 text-xs">
        <span className={order.designApproved ? 'opacity-100' : 'opacity-40'} title="Design Approved">
          ✓ Design
        </span>
        <span className={order.sizesValidated ? 'opacity-100' : 'opacity-40'} title="Sizes Validated">
          ✓ Sizes
        </span>
        <span className={order.depositReceived ? 'opacity-100' : 'opacity-40'} title="Deposit Received">
          ✓ Deposit
        </span>
      </div>
    ),
    minWidth: '140px',
  },
  {
    key: 'estDelivery',
    label: 'Est. Delivery',
    render: (order) => order.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : '—',
    minWidth: '120px',
  },
  {
    key: 'createdAt',
    label: 'Created',
    render: (order) => format(new Date(order.createdAt), 'MMM d, yyyy'),
    minWidth: '120px',
  },
];

export function SpreadsheetTable({
  orders,
  organizations,
  salespeople = [],
  designers = [],
  groupBy,
  onOrderClick,
  showFinancial = false,
}: SpreadsheetTableProps) {
  const [orgColors, setOrgColors] = useState<Map<number, string[]>>(new Map());
  const [activeGroup, setActiveGroup] = useState<string>('');

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
    const groups = new Map<string, Order[]>();

    orders.forEach((order) => {
      let groupKey: string;
      let groupLabel: string;

      switch (groupBy) {
        case 'status':
          groupKey = order.status;
          groupLabel = order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'designer':
          // For now, using placeholder - will need to fetch design job assignments
          groupKey = 'unassigned';
          groupLabel = 'Unassigned';
          break;
        case 'salesperson':
          if (order.salespersonId) {
            const salesperson = salespeople.find(sp => sp.userId === order.salespersonId);
            groupKey = order.salespersonId;
            groupLabel = salesperson?.userName || 'Unknown';
          } else {
            groupKey = 'unassigned';
            groupLabel = 'Unassigned';
          }
          break;
        default:
          groupKey = 'all';
          groupLabel = 'All';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(order);
    });

    // Convert to array and sort
    return Array.from(groups.entries())
      .map(([key, orders]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        orders,
      }))
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [orders, groupBy, salespeople]);

  // Set initial active group
  useEffect(() => {
    if (groupedOrders.length > 0 && !activeGroup) {
      setActiveGroup(groupedOrders[0].key);
    }
  }, [groupedOrders, activeGroup]);

  // Get gradient background for an order based on organization logo
  const getOrderGradient = (order: Order): { background: string; textClass: string } => {
    const colors = orgColors.get(order.orgId);
    
    if (!colors || colors.length === 0) {
      return {
        background: 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
        textClass: 'text-black',
      };
    }

    const gradient = createGradient(colors, 'to right');
    const textClass = getReadableTextColorForGradient(colors);

    return { background: gradient, textClass };
  };

  if (groupedOrders.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No orders to display
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          {groupedOrders.map(group => (
            <TabsTrigger
              key={group.key}
              value={group.key}
              data-testid={`tab-${groupBy}-${group.key}`}
              className="whitespace-nowrap"
            >
              {group.label} ({group.orders.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {groupedOrders.map(group => (
          <TabsContent key={group.key} value={group.key} className="mt-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      {baseColumns.map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                          style={{ minWidth: col.minWidth }}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.orders.map((order) => {
                      const { background, textClass } = getOrderGradient(order);
                      
                      return (
                        <tr
                          key={order.id}
                          className={`border-b transition-opacity hover:opacity-90 ${textClass}`}
                          style={{ background }}
                          data-testid={`row-order-${order.id}`}
                        >
                          {baseColumns.map(col => (
                            <td key={col.key} className="px-4 py-3" style={{ minWidth: col.minWidth }}>
                              <div className={textClass}>
                                {col.render(order, organizations, salespeople)}
                              </div>
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            {onOrderClick && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOrderClick(order.id)}
                                data-testid={`button-view-order-${order.id}`}
                                className={`${textClass} hover:bg-black/10`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
