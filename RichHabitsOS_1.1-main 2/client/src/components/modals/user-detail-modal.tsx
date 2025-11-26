import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import { format } from "date-fns";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Activity,
  Users,
  FileText,
  Package,
  Building,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
}

export function UserDetailModal({ isOpen, onClose, userId, onEdit, onDelete }: UserDetailModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Check permissions
  const canEdit = hasPermission(currentUser, "userManagement", "write");
  const canDelete = hasPermission(currentUser, "userManagement", "delete");

  // Fetch user data
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!userId && isOpen,
  });

  // Fetch user activity/stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/users", userId, "stats"],
    queryFn: async () => {
      if (!userId) return null;
      // Fetch leads, orders, etc. owned by this user
      const [leadsRes, ordersRes] = await Promise.all([
        fetch(`/api/leads`, { credentials: 'include' }),
        fetch(`/api/orders`, { credentials: 'include' })
      ]);
      
      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      
      const userLeads = leads.filter((lead: any) => lead.ownerUserId === userId);
      const userOrders = orders.filter((order: any) => order.salespersonId === userId);
      
      return {
        totalLeads: userLeads.length,
        wonLeads: userLeads.filter((lead: any) => lead.stage === 'won').length,
        totalOrders: userOrders.length,
        completedOrders: userOrders.filter((order: any) => order.status === 'completed').length,
      };
    },
    enabled: !!userId && isOpen,
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/users/${userId}`, { isActive: !user?.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "Success",
        description: `User ${user?.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "sales": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "designer": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ops": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "manufacturer": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin": return "Full system access and user management";
      case "sales": return "Manage leads, orders, and customer relationships";
      case "designer": return "Handle design jobs and creative assets";
      case "ops": return "Manage operations, manufacturing, and catalog";
      case "manufacturer": return "View and update assigned manufacturing jobs";
      default: return "Standard user access";
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground">The requested user could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="text-xl">{user.name}</div>
                <div className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                  {user.isActive ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-3 h-3" />
                      <span>Inactive</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(user.id)}
                  data-testid="button-edit-user"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate()}
                  disabled={toggleActiveMutation.isPending || user.id === currentUser?.id}
                  data-testid="button-toggle-status"
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {canDelete && user.id !== currentUser?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete?.(user.id)}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-user"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="permissions" data-testid="tab-permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Full Name</label>
                      <p className="font-medium" data-testid="text-full-name">
                        {user.name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">First Name</label>
                      <p className="font-medium" data-testid="text-first-name">
                        {user.firstName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Last Name</label>
                      <p className="font-medium" data-testid="text-last-name">
                        {user.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Email Address</label>
                      <p className="font-medium" data-testid="text-email">
                        {user.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Phone Number</label>
                      <p className="font-medium" data-testid="text-phone">
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role & Access
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Current Role</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(user.role)} data-testid="badge-current-role">
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Role Description</label>
                    <p className="text-sm mt-1" data-testid="text-role-description">
                      {getRoleDescription(user.role)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Account Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {user.isActive ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span data-testid="text-status-active">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span data-testid="text-status-inactive">Inactive</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Account History
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Created</label>
                    <p className="font-medium" data-testid="text-created-date">
                      {user.createdAt ? format(new Date(user.createdAt), "PPP 'at' pp") : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Last Updated</label>
                    <p className="font-medium" data-testid="text-updated-date">
                      {user.updatedAt ? format(new Date(user.updatedAt), "PPP 'at' pp") : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Permissions are determined by the user's role. Contact an administrator to change user permissions.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Read Permissions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Dashboard</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Organizations</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Catalog</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Write Permissions</h4>
                  <div className="space-y-2 text-sm">
                    {user.role === "admin" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span>User Management</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>System Settings</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>All Modules</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Limited write access based on role</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-total-leads">
                    {userStats?.totalLeads || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-won-leads">
                    {userStats?.wonLeads || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Won Leads</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-total-orders">
                    {userStats?.totalOrders || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-completed-orders">
                    {userStats?.completedOrders || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Password Status</label>
                    <p className="font-medium" data-testid="text-password-status">
                      {user.passwordHash ? "Password Set" : "No Password Set"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Authentication Method</label>
                    <p className="font-medium" data-testid="text-auth-method">
                      Replit Auth Integration
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Account Security</label>
                    <p className="font-medium" data-testid="text-account-security">
                      Role-based Access Control (RBAC)
                    </p>
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