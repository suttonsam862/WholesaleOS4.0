import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LineItem {
  id: number;
  lineItemId: number;
  manufacturingUpdateId: number;
  mockupImageUrl?: string;
  actualCost?: string;
  sizesConfirmed: boolean;
  manufacturerCompleted: boolean;
  notes?: string;
  lineItem: {
    id: number;
    styleName: string;
    color: string;
    sizeBreakdown: Record<string, number>;
    unitPrice: string;
    quantity: number;
  };
  order: {
    id: number;
    orderNumber: string;
    customerName: string;
    organizationName: string;
    dueDate?: string;
  };
  manufacturing: {
    id: number;
    status: string;
    priority: string;
  };
}

interface ManufacturerLineItemsResponse {
  manufacturer: {
    id: number;
    name: string;
  } | null;
  lineItems: LineItem[];
}

export function ManufacturerLineItems() {
  const { user } = useAuth();
  const [editingCosts, setEditingCosts] = useState<Record<number, string>>({});
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  // Fetch line items assigned to this manufacturer
  const { data, isLoading, error } = useQuery<ManufacturerLineItemsResponse>({
    queryKey: ['/api/manufacturer/line-items'],
  });
  
  const lineItems = data?.lineItems || [];
  const manufacturer = data?.manufacturer;

  // Update line item mutation
  const updateLineItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/manufacturer/line-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturer/line-items'] });
      toast({ title: 'Success', description: 'Line item updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update line item', variant: 'destructive' });
    },
  });

  // Group line items by order
  const groupedLineItems = lineItems?.reduce((acc, item) => {
    const orderId = item.order.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        order: item.order,
        manufacturing: item.manufacturing,
        lineItems: [],
      };
    }
    acc[orderId].lineItems.push(item);
    return acc;
  }, {} as Record<number, { order: any; manufacturing: any; lineItems: LineItem[] }>);

  const handleCostUpdate = (itemId: number) => {
    const cost = editingCosts[itemId];
    if (!cost) return;

    updateLineItemMutation.mutate({
      id: itemId,
      data: { actualCost: cost },
    });
  };

  const handleCompletionToggle = (itemId: number, completed: boolean) => {
    if (completed) {
      completedItems.add(itemId);
    } else {
      completedItems.delete(itemId);
    }
    setCompletedItems(new Set(completedItems));

    updateLineItemMutation.mutate({
      id: itemId,
      data: { 
        manufacturerCompleted: completed,
        manufacturerCompletedBy: user?.id,
        manufacturerCompletedAt: completed ? new Date().toISOString() : null,
      },
    });
  };

  const getSizeString = (sizeBreakdown: Record<string, number>) => {
    return Object.entries(sizeBreakdown)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => `${size}: ${qty}`)
      .join(', ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Error loading line items. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lineItems || lineItems.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No line items assigned to you yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Line Items</h1>
        {manufacturer && (
          <p className="text-lg font-medium text-primary mt-2" data-testid="text-manufacturer-name">
            {manufacturer.name}
          </p>
        )}
        <p className="text-muted-foreground mt-1">
          Manage and track your assigned manufacturing line items
        </p>
      </div>

      {Object.entries(groupedLineItems || {}).map(([orderId, group]) => (
        <Card key={orderId} data-testid={`card-order-${orderId}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  Order #{group.order.orderNumber}
                </CardTitle>
                <CardDescription className="mt-1">
                  {group.order.customerName} • {group.order.organizationName}
                  {group.order.dueDate && (
                    <span className="ml-2">• Due: {new Date(group.order.dueDate).toLocaleDateString()}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={cn(getPriorityColor(group.manufacturing.priority), 'text-white')}>
                  {group.manufacturing.priority} priority
                </Badge>
                <Badge className={cn(getStatusColor(group.manufacturing.status), 'text-white')}>
                  {group.manufacturing.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.lineItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "border rounded-lg p-4 space-y-4",
                  item.manufacturerCompleted && "bg-muted/50"
                )}
                data-testid={`line-item-${item.id}`}
              >
                {/* Line Item Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {item.lineItem.styleName} - {item.lineItem.color}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantity: {item.lineItem.quantity} • Unit Price: ${item.lineItem.unitPrice}
                    </p>
                  </div>
                  <Checkbox
                    checked={item.manufacturerCompleted || completedItems.has(item.id)}
                    onCheckedChange={(checked) => handleCompletionToggle(item.id, checked as boolean)}
                    data-testid={`checkbox-complete-${item.id}`}
                  />
                </div>

                {/* Image and Sizes */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Image */}
                  <div>
                    <Label>Product Image</Label>
                    {item.mockupImageUrl ? (
                      <div className="mt-2 border rounded-lg overflow-hidden" style={{ maxHeight: '200px' }}>
                        <img
                          src={item.mockupImageUrl}
                          alt={`${item.lineItem.styleName} mockup`}
                          className="w-full h-full object-contain"
                          data-testid={`img-mockup-${item.id}`}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 border rounded-lg p-8 text-center text-muted-foreground">
                        No image uploaded
                      </div>
                    )}
                  </div>

                  {/* Size Breakdown */}
                  <div>
                    <Label>Size Breakdown</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-mono" data-testid={`text-sizes-${item.id}`}>
                        {getSizeString(item.lineItem.sizeBreakdown)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cost Input */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cost-${item.id}`}>Actual Cost per Unit</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`cost-${item.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingCosts[item.id] ?? item.actualCost ?? ''}
                        onChange={(e) => setEditingCosts({ ...editingCosts, [item.id]: e.target.value })}
                        disabled={item.manufacturerCompleted}
                        data-testid={`input-cost-${item.id}`}
                      />
                      <Button
                        onClick={() => handleCostUpdate(item.id)}
                        disabled={!editingCosts[item.id] || item.manufacturerCompleted || updateLineItemMutation.isPending}
                        data-testid={`button-save-cost-${item.id}`}
                      >
                        Save
                      </Button>
                    </div>
                    {item.actualCost && !editingCosts[item.id] && (
                      <p className="text-sm text-muted-foreground">
                        Current: ${item.actualCost}
                      </p>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {item.sizesConfirmed && (
                        <Badge variant="outline" className="text-green-600">
                          <i className="fas fa-check mr-1"></i> Sizes Confirmed
                        </Badge>
                      )}
                      {item.manufacturerCompleted && (
                        <Badge variant="outline" className="text-blue-600">
                          <i className="fas fa-check-circle mr-1"></i> Completed
                        </Badge>
                      )}
                      {!item.sizesConfirmed && !item.manufacturerCompleted && (
                        <Badge variant="outline">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}