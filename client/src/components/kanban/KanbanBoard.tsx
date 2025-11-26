import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderCard } from "@/components/kanban/OrderCard";
import { DndContext, DragOverlay, DragEndEvent, DragStartEvent, DragOverEvent, closestCorners } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";

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

interface KanbanBoardProps {
  orders: Order[];
  organizations: Organization[];
  onOrderSelect: (orderId: number) => void;
  onOrderDelete: (orderId: number) => void;
  onOrderStatusUpdate: (orderId: number, newStatus: Order["status"]) => Promise<void>;
  isUpdatingStatus?: boolean;
  canDragOrders?: boolean;
  // Admin-only props
  isAdmin?: boolean;
  salespeople?: Salesperson[];
  selectedOrders?: number[];
  onOrderSelectionChange?: (orderId: number, selected: boolean) => void;
  onBulkReassign?: (orderIds: number[], salespersonId: string) => void;
}

const ORDER_STATUSES = [
  { key: "new", label: "New", color: "blue" },
  { key: "waiting_sizes", label: "Waiting Sizes", color: "yellow" },
  { key: "invoiced", label: "Invoiced", color: "purple" },
  { key: "production", label: "Production", color: "orange" },
  { key: "shipped", label: "Shipped", color: "indigo" },
  { key: "completed", label: "Completed", color: "green" },
] as const;

// DroppableColumn component for each kanban column
function DroppableColumn({ 
  status, 
  children, 
  isOver 
}: { 
  status: string; 
  children: React.ReactNode; 
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors duration-200 ${
        isOver ? 'bg-blue-50 dark:bg-blue-950/30' : ''
      }`}
      data-testid={`kanban-drop-zone-${status}`}
    >
      {children}
    </div>
  );
}

export function KanbanBoard({ 
  orders, 
  organizations, 
  onOrderSelect, 
  onOrderDelete, 
  onOrderStatusUpdate,
  isUpdatingStatus = false,
  canDragOrders = true,
  isAdmin = false,
  salespeople = [],
  selectedOrders = [],
  onOrderSelectionChange,
  onBulkReassign
}: KanbanBoardProps) {
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
  // Find the active order being dragged
  const activeOrder = activeId ? orders.find(order => order.id.toString() === activeId) : null;

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = [];
      }
      acc[order.status].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    // Sort orders within each column by priority (high first) then by created date
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => {
        // Priority sort: high > normal > low
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    return grouped;
  }, [orders]);

  // Drag event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);

    if (!over || !active) return;

    const orderId = parseInt(active.id as string);
    const newStatus = over.id as Order["status"];
    
    // Find the order being moved
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    try {
      // Call the status update function passed from parent
      await onOrderStatusUpdate(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
      // The parent component should handle error display via toast
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
    <div className="flex-1 overflow-x-auto" data-testid="kanban-board">
      <div className="flex gap-4 min-w-max p-2">
        {ORDER_STATUSES.map((status) => {
          const statusOrders = ordersByStatus[status.key] || [];
          
          return (
            <div 
              key={status.key} 
              className="flex-shrink-0 w-80" 
              data-testid={`kanban-column-${status.key}`}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {status.label}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <StatusBadge 
                        status={status.key} 
                        data-testid={`badge-column-status-${status.key}`}
                      >
                        {statusOrders.length}
                      </StatusBadge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <DroppableColumn 
                    status={status.key} 
                    isOver={overId === status.key}
                  >
                    <div 
                      className="space-y-3 min-h-[600px] max-h-[calc(100vh-200px)] overflow-y-auto"
                      data-testid={`kanban-column-content-${status.key}`}
                    >
                      {statusOrders.length === 0 ? (
                        <div 
                          className="flex flex-col items-center justify-center py-8 text-muted-foreground"
                          data-testid={`kanban-empty-state-${status.key}`}
                        >
                          <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                            <i className="fas fa-inbox text-lg"></i>
                          </div>
                          <p className="text-sm">No orders</p>
                        </div>
                      ) : (
                        statusOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            organization={organizations.find(org => org.id === order.orgId)}
                            onSelect={onOrderSelect}
                            onDelete={onOrderDelete}
                            isDragging={activeId === order.id.toString()}
                            isDisabled={isUpdatingStatus}
                            canDrag={canDragOrders}
                            isAdmin={isAdmin}
                            salespeople={salespeople}
                            isSelected={selectedOrders.includes(order.id)}
                            onSelectionChange={onOrderSelectionChange}
                            onReassign={onBulkReassign}
                          />
                        ))
                      )}
                    </div>
                  </DroppableColumn>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
    
    <DragOverlay>
      {activeOrder ? (
        <div className="opacity-90 transform rotate-2 shadow-lg">
          <OrderCard
            order={activeOrder}
            organization={organizations.find(org => org.id === activeOrder.orgId)}
            onSelect={() => {}}
            onDelete={() => {}}
            isDragging={true}
            isDisabled={false}
          />
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}