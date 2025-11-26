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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertSalespersonSchema } from "@shared/schema";

interface CreateSalespersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createSchema = insertSalespersonSchema.extend({
  userId: z.string().min(1, "User is required"),
  territory: z.string().optional(),
  quotaMonthly: z.string().optional(),
  commissionRate: z.string().optional(),
  notes: z.string().optional(),
});

export function CreateSalespersonModal({ isOpen, onClose }: CreateSalespersonModalProps) {
  const { toast } = useToast();

  // Fetch users who can be salespeople (with sales role)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const allUsers = await response.json();
      return allUsers.filter((user: any) => user.role === 'sales');
    },
    enabled: isOpen,
    retry: false,
  });

  // Fetch existing salespeople to filter out already assigned users
  const { data: existingSalespeople } = useQuery<any[]>({
    queryKey: ["/api/salespeople"],
    retry: false,
    enabled: isOpen,
  });

  const form = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      userId: "",
      territory: "",
      quotaMonthly: "",
      commissionRate: "0.15",
      notes: "",
      active: true,
      defaultOrgScope: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createSchema>) =>
      apiRequest("POST", "/api/salespeople", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople"] });
      toast({
        title: "Success",
        description: "Salesperson created successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create salesperson",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof createSchema>) => {
    // Transform empty strings to undefined for optional numeric fields
    const submitData = {
      ...data,
      quotaMonthly: data.quotaMonthly === "" ? undefined : data.quotaMonthly,
    };
    createMutation.mutate(submitData);
  };

  // Filter out users who are already salespeople
  const availableUsers = users?.filter(
    (user: any) => !existingSalespeople || !existingSalespeople.some((sp: any) => sp.userId === user.id)
  );

  // Common territories
  const territories = [
    "Northeast",
    "Southeast", 
    "Midwest",
    "Southwest",
    "West",
    "Pacific Northwest",
    "California",
    "Texas",
    "Florida",
    "New York",
    "International",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Salesperson</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersLoading ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">Loading users...</div>
                      ) : availableUsers?.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">No available users with sales role</div>
                      ) : (
                        availableUsers?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                            <div>
                              <div>{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="territory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Territory</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-territory">
                        <SelectValue placeholder="Select or enter territory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {territories.map((territory) => (
                        <SelectItem key={territory} value={territory} data-testid={`option-territory-${territory}`}>
                          {territory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotaMonthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Quota ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field} 
                      data-testid="input-quota"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="0.15 (15%)" 
                      {...field} 
                      data-testid="input-commission-rate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultOrgScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Organization Scope (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., High School, College, Youth" 
                      {...field} 
                      data-testid="input-org-scope"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this salesperson..." 
                      {...field} 
                      data-testid="input-notes"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Salesperson"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}