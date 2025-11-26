import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertSalespersonSchema } from "@shared/schema";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Award, Target, DollarSign, Users, FileText } from "lucide-react";

interface SalespersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salespersonId?: number;
}

const editSchema = insertSalespersonSchema.partial().extend({
  territory: z.string().optional(),
  quotaMonthly: z.string().optional(),
  notes: z.string().optional(),
});

export function SalespersonDetailModal({ isOpen, onClose, salespersonId }: SalespersonDetailModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

  // Fetch salesperson data
  const { data: salesperson, isLoading } = useQuery({
    queryKey: ["/api/salespeople", salespersonId],
    queryFn: async () => {
      const response = await fetch(`/api/salespeople/${salespersonId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch salesperson");
      return response.json();
    },
    enabled: !!salespersonId && isOpen,
  });

  // Fetch performance data
  const { data: performance } = useQuery({
    queryKey: ["/api/salespeople", salespersonId, "performance"],
    queryFn: async () => {
      const response = await fetch(`/api/salespeople/${salespersonId}/performance`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch performance");
      return response.json();
    },
    enabled: !!salespersonId && isOpen,
  });

  // Fetch user data
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch leads assigned to this salesperson
  const { data: leads } = useQuery({
    queryKey: ["/api/leads", { salesperson: salesperson?.userId }],
    queryFn: async () => {
      const response = await fetch(`/api/leads`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      const allLeads = await response.json();
      return allLeads.filter((lead: any) => lead.ownerUserId === salesperson?.userId);
    },
    enabled: !!salesperson?.userId && isOpen,
  });

  // Fetch orders for this salesperson
  const { data: orders } = useQuery({
    queryKey: ["/api/orders", { salesperson: salesperson?.userId }],
    queryFn: async () => {
      const response = await fetch(`/api/orders`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      const allOrders = await response.json();
      return allOrders.filter((order: any) => order.salespersonId === salesperson?.userId);
    },
    enabled: !!salesperson?.userId && isOpen,
  });

  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      territory: "",
      quotaMonthly: "",
      notes: "",
      active: true,
    },
  });

  // Update form when salesperson data loads
  useState(() => {
    if (salesperson) {
      form.reset({
        territory: salesperson.territory || "",
        quotaMonthly: salesperson.quotaMonthly || "",
        notes: salesperson.notes || "",
        active: salesperson.active,
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof editSchema>) =>
      apiRequest("PUT", `/api/salespeople/${salespersonId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople", salespersonId] });
      toast({
        title: "Success",
        description: "Salesperson updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update salesperson",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof editSchema>) => {
    updateMutation.mutate(data);
  };

  const user = users?.find((u: any) => u.id === salesperson?.userId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl">{user?.name || "Salesperson"}</div>
              <div className="text-sm text-muted-foreground font-normal space-y-0.5">
                {user?.email && <div>{user.email}</div>}
                {user?.phone && <div>{user.phone}</div>}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="info" data-testid="tab-info">Information</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="commission" data-testid="tab-commission">Commission</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="territory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Territory</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CA, TX, Northeast" {...field} data-testid="input-territory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quotaMonthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Quota</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-quota" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes about this salesperson..." {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                      <p className="text-2xl font-bold">{performance?.totalLeads || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">{(performance?.conversionRate || 0).toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">${(performance?.totalOrdersValue || 0).toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quota Attainment</p>
                      <p className="text-2xl font-bold">{(performance?.quotaAttainment || 0).toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500 opacity-20" />
                  </div>
                  <Progress value={performance?.quotaAttainment || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                      <p className="text-2xl font-bold">${(performance?.averageDealSize || 0).toFixed(2)}</p>
                    </div>
                    <Award className="w-8 h-8 text-orange-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Leads</p>
                      <p className="text-2xl font-bold">{performance?.activeLeads || 0}</p>
                    </div>
                    <FileText className="w-8 h-8 text-indigo-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="space-y-2">
              {leads?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No leads assigned</p>
              ) : (
                leads?.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{lead.leadCode}</p>
                      <p className="text-sm text-muted-foreground">Created {format(new Date(lead.createdAt), "PP")}</p>
                    </div>
                    <StatusBadge status={lead.stage}>{lead.stage}</StatusBadge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="space-y-2">
              {orders?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No orders created</p>
              ) : (
                orders?.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.orderCode}</p>
                      <p className="text-sm text-muted-foreground">{order.orderName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status}>{order.status}</StatusBadge>
                      <Badge variant="outline">{order.priority}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="commission" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Commission Earned</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${(performance?.commissionEarned || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Commission Rate</span>
                    <span className="font-medium">5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Sales</span>
                    <span className="font-medium">${(performance?.totalOrdersValue || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Orders Count</span>
                    <span className="font-medium">{performance?.ordersCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}