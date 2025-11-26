import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CogsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CogsManagementModal({ isOpen, onClose }: CogsManagementModalProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: productVariants = [] } = useQuery<any[]>({
    queryKey: ['/api/product-variants'],
    enabled: isOpen,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
    enabled: isOpen,
  });

  const { data: cogsData = [] } = useQuery<any[]>({
    queryKey: ['/api/product-cogs'],
    enabled: isOpen,
  });

  const createOrUpdateCogsMutation = useMutation({
    mutationFn: async ({ variantId, unitCost }: { variantId: number; unitCost: string }) => {
      const existing = cogsData.find((c: any) => c.variantId === variantId);
      if (existing) {
        return apiRequest("PUT", `/api/product-cogs/${existing.id}`, { unitCost });
      } else {
        return apiRequest("POST", "/api/product-cogs", { variantId, unitCost });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-cogs"] });
      toast({
        title: "Success",
        description: "COGS updated successfully",
      });
      setEditingId(null);
      setEditValue("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update COGS",
        variant: "destructive",
      });
    },
  });

  const handleSave = (variantId: number) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid cost amount",
        variant: "destructive",
      });
      return;
    }
    
    createOrUpdateCogsMutation.mutate({
      variantId,
      unitCost: value.toFixed(2),
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || num === null || num === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Cost of Goods Sold (COGS) Management</DialogTitle>
          <DialogDescription>
            Set the unit cost for each product variant to track profit margins
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No product variants found
                  </TableCell>
                </TableRow>
              ) : (
                productVariants.map((variant: any) => {
                  const product = products.find((p: any) => p.id === variant.productId);
                  const cogs = cogsData.find((c: any) => c.variantId === variant.id);
                  const isEditing = editingId === variant.id;

                  return (
                    <TableRow key={variant.id} data-testid={`cogs-row-${variant.id}`}>
                      <TableCell className="font-medium">{product?.name}</TableCell>
                      <TableCell>{variant.variantCode}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product?.sku}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32 ml-auto"
                            data-testid={`input-cogs-${variant.id}`}
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSave(variant.id);
                              }
                            }}
                          />
                        ) : (
                          <span className={cogs ? "font-medium" : "text-muted-foreground"}>
                            {cogs ? formatCurrency(cogs.unitCost) : "Not set"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(variant.id)}
                              disabled={createOrUpdateCogsMutation.isPending}
                              data-testid={`button-save-${variant.id}`}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setEditValue("");
                              }}
                              data-testid={`button-cancel-${variant.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(variant.id);
                              setEditValue(cogs?.unitCost || "0");
                            }}
                            data-testid={`button-edit-${variant.id}`}
                          >
                            {cogs ? "Edit" : "Set Cost"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
