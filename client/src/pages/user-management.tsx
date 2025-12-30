import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@/lib/permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreateUserModal } from "@/components/modals/create-user-modal";
import { EditUserModal } from "@/components/modals/edit-user-modal";
import { UserDetailModal } from "@/components/modals/user-detail-modal";
import { SendInvitationModal } from "@/components/modals/send-invitation-modal";
import { format } from "date-fns";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  UserCog,
  Mail,
  Phone
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  name: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
  passwordHash?: string;
  isActive?: boolean;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Check permissions
  const canRead = hasPermission(user, "userManagement", "read");
  const canWrite = hasPermission(user, "userManagement", "write");
  const canDelete = hasPermission(user, "userManagement", "delete");
  const canViewAll = hasPermission(user, "userManagement", "viewAll");

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: isAuthenticated && canRead,
  });

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.role?.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !u.isActive) return false;
        if (statusFilter === "inactive" && u.isActive) return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Get unique roles for filter
  const roles = useMemo(() => {
    const uniqueRoles = new Set(users.map(u => u.role).filter(Boolean));
    return Array.from(uniqueRoles);
  }, [users]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    const activeUsers = users.filter(u => u.isActive);
    const roleStats = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      roleStats,
    };
  }, [users]);

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Bulk activate/deactivate users
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const promises = ids.map(id =>
        apiRequest("PUT", `/api/users/${id}`, { isActive })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setSelectedUsers([]);
      toast({
        title: "Success",
        description: "Users updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update users",
        variant: "destructive",
      });
    },
  });

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredUsers.map(u => ({
      "Name": u.name || "",
      "Email": u.email || "",
      "Role": u.role || "",
      "Status": u.isActive ? "Active" : "Inactive",
      "Phone": u.phone || "",
      "Created": u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : "",
      "Last Updated": u.updatedAt ? format(new Date(u.updatedAt), "yyyy-MM-dd") : "",
    }));

    if (csvData.length === 0) {
      toast({
        title: "No data to export",
        description: "No users to export",
      });
      return;
    }

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "User data exported successfully",
    });
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId);
  };

  const confirmDeleteUser = () => {
    if (deleteUserId) {
      deleteMutation.mutate(deleteUserId);
    }
  };

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

  if (authLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view the user management page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-24">
      <div className="p-6" data-testid="user-management-page">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="heading-user-management">User Management</h1>
          <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canWrite && (
            <>
              <Button onClick={() => setIsSendInvitationModalOpen(true)} variant="outline" data-testid="button-invite-user">
                <Mail className="w-4 h-4 mr-2" />
                Invite User
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="glass-card" data-testid="card-total-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-users">
                  {userStats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="card-active-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-active-users">
                  {userStats.active}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="card-inactive-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-inactive-users">
                  {userStats.inactive}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="card-admin-users">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-admin-users">
                  {userStats.roleStats.admin || 0}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6" data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search by name, email, role, or phone..." 
                className="pl-10 min-h-[44px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]" data-testid="select-role-filter">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            {selectedUsers.length > 0 && canWrite && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-actions">
                    Bulk Actions ({selectedUsers.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    bulkUpdateMutation.mutate({ 
                      ids: selectedUsers, 
                      isActive: true 
                    });
                  }}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    bulkUpdateMutation.mutate({ 
                      ids: selectedUsers, 
                      isActive: false 
                    });
                  }}>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear Selection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List - Mobile View */}
      {isMobile ? (
        <div className="space-y-3" data-testid="users-mobile-list">
          {filteredUsers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Add your first user to start managing the team."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((u, index) => (
              <MobileDataCard
                key={u.id}
                title={u.name || "Unknown"}
                subtitle={u.email || "No email"}
                status={u.isActive ? { value: "active", label: "Active" } : { value: "inactive", label: "Inactive" }}
                metadata={[
                  { label: "Role", value: <Badge className={getRoleColor(u.role)}>{u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}</Badge> },
                  ...(u.phone ? [{ label: "Phone", value: u.phone, icon: <Phone className="h-3 w-3" /> }] : []),
                ]}
                actions={[
                  { label: "View", icon: <Eye className="h-4 w-4" />, onClick: () => handleViewUser(u.id) },
                  ...(canWrite ? [{ label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => handleEditUser(u.id) }] : []),
                  ...(canDelete ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDeleteUser(u.id), variant: "danger" as const }] : []),
                ]}
                onClick={() => handleViewUser(u.id)}
                index={index}
                data-testid={`card-user-${u.id}`}
              />
            ))
          )}
        </div>
      ) : (
      /* Users Table - Desktop View */
      <Card className="glass-card" data-testid="card-users-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  {canWrite && (
                    <th className="px-6 py-3">
                      <Checkbox 
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-muted-foreground" colSpan={canWrite ? 7 : 6}>
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Add your first user to start managing the team."}
                        </p>
                        {canWrite && !searchTerm && roleFilter === "all" && statusFilter === "all" && (
                          <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-user">
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors" data-testid={`row-user-${u.id}`}>
                      {canWrite && (
                        <td className="px-6 py-4">
                          <Checkbox 
                            checked={selectedUsers.includes(u.id)}
                            onCheckedChange={() => toggleSelection(u.id)}
                            data-testid={`checkbox-user-${u.id}`}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {u.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-name-${u.id}`}>
                              {u.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-email-${u.id}`}>
                              {u.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getRoleColor(u.role)} data-testid={`badge-role-${u.id}`}>
                          {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {u.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span data-testid={`text-email-contact-${u.id}`}>{u.email}</span>
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span data-testid={`text-phone-${u.id}`}>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {u.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${u.isActive ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-status-${u.id}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${u.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(u.id)} data-testid={`button-view-${u.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canWrite && (
                              <DropdownMenuItem onClick={() => handleEditUser(u.id)} data-testid={`button-edit-${u.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                            )}
                            {canDelete && u.id !== user?.id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser(u.id)}
                                  data-testid={`button-delete-${u.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent data-testid="dialog-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <SendInvitationModal 
        open={isSendInvitationModalOpen}
        onOpenChange={setIsSendInvitationModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          toast({
            title: "Success",
            description: "Invitation sent successfully",
          });
        }}
      />

      <CreateUserModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId || undefined}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId || undefined}
        onEdit={(userId) => {
          setSelectedUserId(userId);
          setIsDetailModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onDelete={(userId) => {
          setIsDetailModalOpen(false);
          setDeleteUserId(userId);
        }}
      />
      </div>
    </div>
  );
}