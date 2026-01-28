import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CreateOrderModalV6Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (orderId: number) => void;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  organization?: string;
}

interface FormData {
  customerId: number | null;
  orderName: string;
  description: string;
  eventDate: Date | undefined;
  dueDate: Date | undefined;
  isRush: boolean;
  rushReason: string;
  priority: "low" | "normal" | "high";
  notes: string;
  // New customer fields (if creating new)
  newCustomerName: string;
  newCustomerEmail: string;
  newCustomerPhone: string;
  newCustomerOrganization: string;
}

const initialFormData: FormData = {
  customerId: null,
  orderName: "",
  description: "",
  eventDate: undefined,
  dueDate: undefined,
  isRush: false,
  rushReason: "",
  priority: "normal",
  notes: "",
  newCustomerName: "",
  newCustomerEmail: "",
  newCustomerPhone: "",
  newCustomerOrganization: "",
};

export function CreateOrderModalV6({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrderModalV6Props) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers for dropdown
  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers", customerSearch],
    enabled: open && customerMode === "existing",
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let customerId = data.customerId;

      // If creating new customer, do that first
      if (customerMode === "new") {
        const customerRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.newCustomerName,
            email: data.newCustomerEmail,
            phone: data.newCustomerPhone,
            organization: data.newCustomerOrganization,
          }),
        });
        if (!customerRes.ok) {
          throw new Error("Failed to create customer");
        }
        const newCustomer = await customerRes.json();
        customerId = newCustomer.id;
      }

      // Create the order
      const orderRes = await fetch("/api/v6/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          orderName: data.orderName,
          description: data.description,
          eventDate: data.eventDate?.toISOString(),
          dueDate: data.dueDate?.toISOString(),
          isRush: data.isRush,
          rushReason: data.rushReason,
          priority: data.priority,
          notes: data.notes,
          status: "DRAFT",
        }),
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.message || "Failed to create order");
      }

      return orderRes.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v6/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Order created",
        description: `Order ${order.orderNumber || order.id} has been created successfully.`,
      });
      handleClose();
      onSuccess?.(order.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (customerMode === "existing" && !formData.customerId) {
      newErrors.customerId = "Please select a customer";
    }

    if (customerMode === "new") {
      if (!formData.newCustomerName.trim()) {
        newErrors.newCustomerName = "Customer name is required";
      }
      if (!formData.newCustomerEmail.trim()) {
        newErrors.newCustomerEmail = "Customer email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newCustomerEmail)) {
        newErrors.newCustomerEmail = "Invalid email format";
      }
    }

    if (!formData.orderName.trim()) {
      newErrors.orderName = "Order name is required";
    }

    if (formData.isRush && !formData.rushReason.trim()) {
      newErrors.rushReason = "Rush reason is required for rush orders";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createOrderMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCustomerMode("existing");
    setCustomerSearch("");
    setErrors({});
    onOpenChange(false);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="font-medium">Customer</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={customerMode === "existing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCustomerMode("existing")}
                >
                  Existing
                </Button>
                <Button
                  type="button"
                  variant={customerMode === "new" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCustomerMode("new")}
                >
                  New Customer
                </Button>
              </div>
            </div>

            {customerMode === "existing" ? (
              <div className="space-y-2">
                <Select
                  value={formData.customerId?.toString() || ""}
                  onValueChange={(val) => updateField("customerId", parseInt(val))}
                >
                  <SelectTrigger className={cn(errors.customerId && "border-red-500")}>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCustomers ? (
                      <div className="p-2 text-center text-muted-foreground">
                        Loading...
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        No customers found
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          <div>
                            <span className="font-medium">{customer.name}</span>
                            {customer.organization && (
                              <span className="text-muted-foreground ml-2">
                                ({customer.organization})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.customerId}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="newCustomerName">Name *</Label>
                  <Input
                    id="newCustomerName"
                    value={formData.newCustomerName}
                    onChange={(e) => updateField("newCustomerName", e.target.value)}
                    className={cn(errors.newCustomerName && "border-red-500")}
                    placeholder="John Smith"
                  />
                  {errors.newCustomerName && (
                    <p className="text-sm text-red-500">{errors.newCustomerName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerEmail">Email *</Label>
                  <Input
                    id="newCustomerEmail"
                    type="email"
                    value={formData.newCustomerEmail}
                    onChange={(e) => updateField("newCustomerEmail", e.target.value)}
                    className={cn(errors.newCustomerEmail && "border-red-500")}
                    placeholder="john@example.com"
                  />
                  {errors.newCustomerEmail && (
                    <p className="text-sm text-red-500">{errors.newCustomerEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerPhone">Phone</Label>
                  <Input
                    id="newCustomerPhone"
                    value={formData.newCustomerPhone}
                    onChange={(e) => updateField("newCustomerPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerOrganization">Organization</Label>
                  <Input
                    id="newCustomerOrganization"
                    value={formData.newCustomerOrganization}
                    onChange={(e) => updateField("newCustomerOrganization", e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Order Details</h3>

            <div className="space-y-2">
              <Label htmlFor="orderName">Order Name *</Label>
              <Input
                id="orderName"
                value={formData.orderName}
                onChange={(e) => updateField("orderName", e.target.value)}
                className={cn(errors.orderName && "border-red-500")}
                placeholder="e.g., Spring Tournament Jerseys"
              />
              {errors.orderName && (
                <p className="text-sm text-red-500">{errors.orderName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of the order..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.eventDate
                        ? format(formData.eventDate, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.eventDate}
                      onSelect={(date) => updateField("eventDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate
                        ? format(formData.dueDate, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => updateField("dueDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Priority & Rush */}
          <div className="space-y-4">
            <h3 className="font-medium">Priority</h3>

            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label>Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => updateField("priority", val as FormData["priority"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="isRush"
                  checked={formData.isRush}
                  onCheckedChange={(checked) => updateField("isRush", checked)}
                />
                <Label htmlFor="isRush" className="text-red-600 font-medium">
                  Rush Order
                </Label>
              </div>
            </div>

            {formData.isRush && (
              <div className="space-y-2">
                <Label htmlFor="rushReason">Rush Reason *</Label>
                <Textarea
                  id="rushReason"
                  value={formData.rushReason}
                  onChange={(e) => updateField("rushReason", e.target.value)}
                  className={cn(errors.rushReason && "border-red-500")}
                  placeholder="Why is this order a rush? (e.g., Event date moved up)"
                  rows={2}
                />
                {errors.rushReason && (
                  <p className="text-sm text-red-500">{errors.rushReason}</p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Internal notes visible to staff only..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateOrderModalV6;
