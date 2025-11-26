import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Role = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
};

type Resource = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
};

type RolePermission = {
  id: number;
  roleId: number;
  resourceId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  pageVisible: boolean;
};

type PermissionState = {
  [resourceId: number]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    pageVisible: boolean;
  };
};

type EditPermissionsModalProps = {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
};

export function EditPermissionsModal({ role, isOpen, onClose }: EditPermissionsModalProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/permissions/resources"],
    enabled: isOpen,
  });

  const { data: roleData, isLoading: roleLoading } = useQuery<{ permissions: RolePermission[] }>({
    queryKey: ["/api/permissions/roles", role.id],
    enabled: isOpen,
  });

  useEffect(() => {
    if (roleData?.permissions && resources) {
      const newState: PermissionState = {};
      
      // Initialize all resources
      resources.forEach((resource) => {
        const existing = roleData.permissions.find((p) => p.resourceId === resource.id);
        newState[resource.id] = existing
          ? {
              canView: existing.canView,
              canCreate: existing.canCreate,
              canEdit: existing.canEdit,
              canDelete: existing.canDelete,
              pageVisible: existing.pageVisible,
            }
          : {
              canView: false,
              canCreate: false,
              canEdit: false,
              canDelete: false,
              pageVisible: false,
            };
      });
      
      setPermissions(newState);
      setHasChanges(false);
    }
  }, [roleData, resources]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(permissions).map(([resourceId, perms]) => ({
        roleId: role.id,
        resourceId: parseInt(resourceId),
        permissions: perms,
      }));

      return await apiRequest("/api/permissions/bulk-update", {
        method: "POST",
        body: { updates },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles", role.id] });
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      setHasChanges(false);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (
    resourceId: number,
    permType: "canView" | "canCreate" | "canEdit" | "canDelete" | "pageVisible",
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        [permType]: value,
      },
    }));
    setHasChanges(true);
  };

  const handlePageVisibilityToggle = (resourceId: number) => {
    const currentValue = permissions[resourceId]?.pageVisible || false;
    handlePermissionChange(resourceId, "pageVisible", !currentValue);
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  const isLoading = resourcesLoading || roleLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions - {role.displayName}</DialogTitle>
          <DialogDescription>
            Configure page visibility and action permissions for this role
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="visibility" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visibility">Page Visibility</TabsTrigger>
              <TabsTrigger value="actions">Action Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="visibility" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which pages and resources are visible to this role. Page visibility determines whether users with this role can see the page in navigation menus.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {resources?.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                    data-testid={`visibility-item-${resource.name}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageVisibilityToggle(resource.id)}
                      className="p-0 h-auto"
                      data-testid={`button-toggle-${resource.name}`}
                    >
                      {permissions[resource.id]?.pageVisible ? (
                        <Eye className="h-5 w-5 text-primary" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="font-medium">{resource.displayName}</div>
                      {resource.description && (
                        <div className="text-xs text-muted-foreground">
                          {resource.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure Create, Read, Update, and Delete (CRUD) permissions for each resource. These control what actions users can perform.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold bg-muted">Resource</th>
                      <th className="text-center p-3 font-semibold bg-muted">View</th>
                      <th className="text-center p-3 font-semibold bg-muted">Create</th>
                      <th className="text-center p-3 font-semibold bg-muted">Edit</th>
                      <th className="text-center p-3 font-semibold bg-muted">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources?.map((resource) => (
                      <tr
                        key={resource.id}
                        className="border-b hover:bg-muted/50"
                        data-testid={`action-row-${resource.name}`}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-semibold">{resource.displayName}</div>
                            {resource.description && (
                              <div className="text-sm text-muted-foreground">
                                {resource.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={permissions[resource.id]?.canView || false}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(resource.id, "canView", !!checked)
                            }
                            data-testid={`checkbox-${resource.name}-view`}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={permissions[resource.id]?.canCreate || false}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(resource.id, "canCreate", !!checked)
                            }
                            data-testid={`checkbox-${resource.name}-create`}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={permissions[resource.id]?.canEdit || false}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(resource.id, "canEdit", !!checked)
                            }
                            data-testid={`checkbox-${resource.name}-edit`}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={permissions[resource.id]?.canDelete || false}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(resource.id, "canDelete", !!checked)
                            }
                            data-testid={`checkbox-${resource.name}-delete`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            data-testid="button-save-permissions"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
