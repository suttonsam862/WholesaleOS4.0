import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { PERMISSIONS, hasPermission as hasStaticPermission, Resource, Permission } from "@/lib/permissions";

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

type Role = {
  id: number;
  name: string;
};

type ResourceType = {
  id: number;
  name: string;
  displayName: string;
};

type PermissionsData = {
  permissions: RolePermission[];
  roles: Role[];
  resources: ResourceType[];
};

// Translation function matching server-side logic
function translatePermissionToDb(permission: Permission, dbPermissions: RolePermission): boolean {
  switch (permission) {
    case 'read':
      return dbPermissions.canView;
    case 'write':
      return dbPermissions.canCreate || dbPermissions.canEdit;
    case 'delete':
      return dbPermissions.canDelete;
    case 'viewAll':
      // viewAll maps directly to pageVisible
      // pageVisible controls whether user can see ALL records (not just their own)
      return dbPermissions.pageVisible;
    default:
      return false;
  }
}

export function usePermissions() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<PermissionsData>({
    queryKey: ["/api/permissions/user-permissions"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const hasPermission = (resource: Resource | string, permission: Permission): boolean => {
    if (!user) return false;

    // Database-first approach
    if (data && data.permissions && data.resources && data.roles) {
      const role = data.roles.find((r) => r.name === user.role);
      const res = data.resources.find((r) => r.name === resource);
      
      // If role or resource not found in database and it's a known system resource, use static fallback
      if (!role || !res) {
        if (user.role in PERMISSIONS && resource in PERMISSIONS.admin) {
          console.warn(`Using static fallback for resource ${resource}. Database may need seeding.`);
          return hasStaticPermission(user, resource as Resource, permission);
        }
        // Custom role or resource, no fallback available
        return false;
      }

      const perm = data.permissions.find(
        (p) => p.roleId === role.id && p.resourceId === res.id
      );
      
      if (!perm) {
        // No permission record found - deny access by default
        // Custom roles must have explicit permissions set
        return false;
      }

      // Use consistent translation logic
      return translatePermissionToDb(permission, perm);
    }

    // Database not loaded yet, use static permissions only for known system roles
    if (user.role in PERMISSIONS && resource in PERMISSIONS.admin) {
      return hasStaticPermission(user, resource as Resource, permission);
    }
    
    // Custom role without database loaded - deny
    return false;
  };

  const canAccess = (resource: Resource): boolean => {
    return hasPermission(resource, "read");
  };

  const canModify = (resource: Resource): boolean => {
    return hasPermission(resource, "write");
  };

  const canDelete = (resource: Resource): boolean => {
    return hasPermission(resource, "delete");
  };

  const canViewAll = (resource: Resource): boolean => {
    return hasPermission(resource, "viewAll");
  };

  const isPageVisible = (resource: Resource): boolean => {
    if (!user) return false;

    // If we have database permissions, check pageVisible
    if (data && data.permissions && data.resources && data.roles) {
      const role = data.roles.find((r) => r.name === user.role);
      if (!role) {
        // Fallback to checking canAccess
        return canAccess(resource);
      }

      const res = data.resources.find((r) => r.name === resource);
      if (!res) {
        // Fallback to checking canAccess
        return canAccess(resource);
      }

      const perm = data.permissions.find(
        (p) => p.roleId === role.id && p.resourceId === res.id
      );
      
      if (!perm) {
        // Fallback to checking canAccess
        return canAccess(resource);
      }

      return perm.pageVisible;
    }

    // Fallback to checking canAccess if database permissions not loaded
    return canAccess(resource);
  };

  return {
    hasPermission,
    canAccess,
    canModify,
    canDelete,
    canViewAll,
    isPageVisible,
    isLoading,
    error,
  };
}
