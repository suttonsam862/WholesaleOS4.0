import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react";
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
import { EditPermissionsModal } from "@/components/modals/edit-permissions-modal";
import { CreateRoleModal } from "@/components/modals/create-role-modal";

type Role = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
};

export default function PermissionManagement() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteDialogRole, setDeleteDialogRole] = useState<Role | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/permissions/roles"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/permissions/seed", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/user-permissions"] });
      toast({
        title: "Success",
        description: "Database seeded with default permissions successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed permissions",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await apiRequest(`/api/permissions/roles/${roleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setDeleteDialogRole(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      designer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      ops: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      manufacturer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    };
    return colors[roleName] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  const getUserCountByRole = (roleName: string) => {
    if (!users) return 0;
    return users.filter((user) => user.role === roleName).length;
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setDeleteDialogRole(role);
  };

  const confirmDelete = () => {
    if (deleteDialogRole) {
      deleteMutation.mutate(deleteDialogRole.id);
    }
  };

  if (rolesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!roles) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Roles</CardTitle>
            <CardDescription>
              Unable to load roles data. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Shield className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage role-based access control and create custom role templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => seedMutation.mutate()}
            variant="outline"
            disabled={seedMutation.isPending}
            data-testid="button-seed-permissions"
          >
            {seedMutation.isPending ? "Seeding..." : "Seed Database"}
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            data-testid="button-create-role"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Role
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Click on a role to view and edit its permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="table-roles">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold bg-muted">Role</th>
                  <th className="text-left p-3 font-semibold bg-muted">Description</th>
                  <th className="text-center p-3 font-semibold bg-muted">Users</th>
                  <th className="text-center p-3 font-semibold bg-muted">System Role</th>
                  <th className="text-right p-3 font-semibold bg-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b hover:bg-muted/50"
                    data-testid={`row-role-${role.name}`}
                  >
                    <td className="p-3">
                      <Badge className={getRoleColor(role.name)}>
                        {role.displayName}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {role.description || "No description"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-user-count-${role.name}`}>
                          {getUserCountByRole(role.name)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {role.isSystem ? (
                        <Badge variant="outline">System</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPermissions(role)}
                          data-testid={`button-edit-${role.name}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Permissions
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            data-testid={`button-delete-${role.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Modal */}
      {selectedRole && (
        <EditPermissionsModal
          role={selectedRole}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }}
        />
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        existingRoles={roles}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogRole} onOpenChange={() => setDeleteDialogRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteDialogRole?.displayName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
