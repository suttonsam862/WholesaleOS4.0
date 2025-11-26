import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { useLocation } from "wouter";

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
  id: number;
  userId: string;
  territory: string | null;
  quotaMonthly: string | null;
  active: boolean;
  notes: string | null;
  userName?: string;
  userEmail?: string;
}

interface OrderCardProps {
  order: Order;
  organization?: Organization;
  onSelect: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  isDragging?: boolean;
  isDisabled?: boolean;
  canDrag?: boolean;
  // Admin-only props
  isAdmin?: boolean;
  salespeople?: Salesperson[];
  isSelected?: boolean;
  onSelectionChange?: (orderId: number, selected: boolean) => void;
  onReassign?: (orderIds: number[], salespersonId: string) => void;
}

export function OrderCard({ 
  order, 
  organization, 
  onSelect, 
  onDelete, 
  isDragging = false, 
  isDisabled = false,
  canDrag = true,
  isAdmin = false,
  salespeople = [],
  isSelected = false,
  onSelectionChange,
  onReassign
}: OrderCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Draggable functionality
  const { attributes, listeners, setNodeRef, transform, isDragging: dragKitIsDragging } = useDraggable({
    id: order.id.toString(),
    disabled: isDisabled || !canDrag,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleClone = () => {
    toast({
      title: "Clone Order",
      description: "This feature is coming soon",
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this order?")) {
      onDelete(order.id);
    }
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(order.id, checked);
  };

  const handleReassign = (salespersonId: string) => {
    const salesperson = salespeople.find(sp => sp.userId === salespersonId);
    if (confirm(`Reassign order ${order.orderCode} to ${salesperson?.userName || salesperson?.userEmail}?`)) {
      onReassign?.([order.id], salespersonId);
    }
  };

  // Calculate urgency based on delivery date
  const getUrgencyColor = () => {
    if (!order.estDelivery) return "";
    
    const deliveryDate = new Date(order.estDelivery);
    const now = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDelivery <= 3) return "border-l-red-500";
    if (daysUntilDelivery <= 7) return "border-l-yellow-500";
    return "border-l-green-500";
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`border-l-4 transition-all duration-200 relative overflow-hidden ${getUrgencyColor()} ${
        isDragging || dragKitIsDragging 
          ? 'opacity-50 shadow-2xl cursor-grabbing' 
          : isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : canDrag 
              ? 'cursor-pointer hover:shadow-md cursor-grab'
              : 'cursor-pointer hover:shadow-md'
      }`}
      onClick={() => !isDisabled && !isDragging && onSelect(order.id)}
      data-testid={`kanban-order-card-${order.id}`}
      {...(canDrag ? attributes : {})}
    >
      {/* Transparent organization logo/branding background */}
      {organization?.logoUrl ? (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${organization.logoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          data-logo-url={organization.logoUrl}
        />
      ) : organization?.name ? (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center"
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-full h-full flex items-center justify-center">
            <span className="text-[120px] font-bold text-white drop-shadow-lg">
              {organization.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      ) : null}
      
      <CardContent className="p-4 relative z-10">
        {/* Admin Checkbox */}
        {isAdmin && (
          <div className="flex items-center justify-between mb-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelectionChange}
              onClick={(e) => e.stopPropagation()}
              data-testid={`checkbox-kanban-order-${order.id}`}
            />
            <span className="text-xs text-muted-foreground">
              {isSelected ? "Selected" : ""}
            </span>
          </div>
        )}

        {/* Header with order code and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 
              className="font-mono text-sm font-semibold text-primary mb-1"
              data-testid={`kanban-order-code-${order.id}`}
            >
              {order.orderCode}
            </h4>
            <p 
              className="text-sm font-medium text-foreground line-clamp-2"
              data-testid={`kanban-order-name-${order.id}`}
            >
              {order.orderName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Drag handle */}
            <div 
              {...listeners}
              className={`flex items-center justify-center w-6 h-6 rounded hover:bg-muted/60 transition-colors ${
                isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab'
              }`}
              data-testid={`kanban-drag-handle-${order.id}`}
              title="Drag to move between columns"
            >
              <i className="fas fa-grip-vertical text-xs text-muted-foreground"></i>
            </div>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 hover:bg-muted"
                data-testid={`kanban-order-actions-${order.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="fas fa-ellipsis-h text-xs"></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(order.id); }}>
                <i className="fas fa-eye mr-2"></i>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(order.id); }}>
                <i className="fas fa-edit mr-2"></i>
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleClone(); }}>
                <i className="fas fa-copy mr-2"></i>
                Clone Order
              </DropdownMenuItem>
              
              {/* Admin-only reassignment options */}
              {isAdmin && order.salespersonId && (
                <>
                  <DropdownMenuSeparator />
                  {salespeople.filter(sp => sp.active && sp.userId !== order.salespersonId).map((salesperson) => (
                    <DropdownMenuItem
                      key={salesperson.userId}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleReassign(salesperson.userId); 
                      }}
                      disabled={isDisabled}
                      data-testid={`button-kanban-reassign-${order.id}-${salesperson.userId}`}
                    >
                      {isDisabled ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-user-arrow-right mr-2"></i>
                      )}
                      Reassign to {salesperson.userName || salesperson.userEmail}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >
                <i className="fas fa-trash mr-2"></i>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-center gap-2 mb-3" data-testid={`kanban-order-org-${order.id}`}>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-white">ORG</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground truncate">
            {organization?.name || `Org #${order.orgId}`}
          </span>
        </div>

        {/* Priority and Status indicators */}
        <div className="flex items-center justify-between mb-3">
          <StatusBadge 
            status={order.priority}
            data-testid={`kanban-order-priority-${order.id}`}
          >
            {order.priority}
          </StatusBadge>
          
          {/* Progress indicators */}
          <div className="flex items-center gap-1">
            {order.designApproved && (
              <div 
                className="w-2 h-2 bg-green-500 rounded-full" 
                title="Design Approved"
                data-testid={`kanban-order-design-approved-${order.id}`}
              />
            )}
            {order.sizesValidated && (
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full" 
                title="Sizes Validated"
                data-testid={`kanban-order-sizes-validated-${order.id}`}
              />
            )}
            {order.depositReceived && (
              <div 
                className="w-2 h-2 bg-yellow-500 rounded-full" 
                title="Deposit Received"
                data-testid={`kanban-order-deposit-received-${order.id}`}
              />
            )}
          </div>
        </div>

        {/* Salesperson section - prominent display */}
        {order.salespersonId && (
          <div className="mb-3 p-2 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-xs text-primary"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Salesperson</div>
                  <div className="text-sm font-medium text-foreground truncate" data-testid={`kanban-order-salesperson-${order.id}`}>
                    {(() => {
                      const salesperson = salespeople.find(sp => sp.userId === order.salespersonId);
                      return salesperson?.userName || salesperson?.userEmail || order.salespersonId;
                    })()}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-primary/20 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/team-management');
                  }}
                  title="View salesperson profile"
                  data-testid={`button-view-salesperson-${order.id}`}
                >
                  <i className="fas fa-external-link-alt text-xs text-primary"></i>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Delivery date and creation date */}
        <div className="space-y-2">
          {order.estDelivery && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <i className="fas fa-calendar-alt"></i>
              <span data-testid={`kanban-order-delivery-${order.id}`}>
                Due: {format(new Date(order.estDelivery), "MMM d, yyyy")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <i className="fas fa-clock"></i>
            <span data-testid={`kanban-order-created-${order.id}`}>
              {format(new Date(order.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}