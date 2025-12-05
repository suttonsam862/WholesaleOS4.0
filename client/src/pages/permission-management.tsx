import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Plus,
  Save,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  PenLine,
  Trash2,
  FilePlus,
  Users,
  LayoutGrid,
  Settings,
  Zap,
  AlertCircle,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
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
import { CreateRoleModal } from "@/components/modals/create-role-modal";

type Role = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
};

type Resource = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  resourceType: "page" | "modal" | "button" | "feature";
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
  [roleId: number]: {
    [resourceId: number]: {
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      pageVisible: boolean;
    };
  };
};

type PermissionType = "canView" | "canCreate" | "canEdit" | "canDelete" | "pageVisible";

const PERMISSION_ICONS: Record<PermissionType, typeof Eye> = {
  canView: Eye,
  canCreate: FilePlus,
  canEdit: PenLine,
  canDelete: Trash2,
  pageVisible: LayoutGrid,
};

const PERMISSION_LABELS: Record<PermissionType, string> = {
  canView: "View",
  canCreate: "Create",
  canEdit: "Edit",
  canDelete: "Delete",
  pageVisible: "Visible",
};

const PERMISSION_DESCRIPTIONS: Record<PermissionType, string> = {
  canView: "Can view this resource",
  canCreate: "Can create new items",
  canEdit: "Can edit existing items",
  canDelete: "Can delete items",
  pageVisible: "Resource visible in navigation",
};

const RESOURCE_TYPE_CONFIG = {
  page: { label: "Pages", icon: LayoutGrid, color: "bg-blue-500" },
  feature: { label: "Features", icon: Zap, color: "bg-purple-500" },
  modal: { label: "Modals", icon: Settings, color: "bg-orange-500" },
  button: { label: "Buttons", icon: Settings, color: "bg-gray-500" },
};

export default function PermissionManagement() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [originalPermissions, setOriginalPermissions] = useState<PermissionState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["page", "feature"]));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteDialogRole, setDeleteDialogRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<"matrix" | "roles">("matrix");

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/permissions/roles"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/permissions/resources"],
  });

  const { data: allPermissions, isLoading: permissionsLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/permissions"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    if (roles && resources && allPermissions) {
      const newState: PermissionState = {};

      roles.forEach((role) => {
        newState[role.id] = {};
        resources.forEach((resource) => {
          const existing = allPermissions.find(
            (p) => p.roleId === role.id && p.resourceId === resource.id
          );
          newState[role.id][resource.id] = existing
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
      });

      setPermissions(newState);
      setOriginalPermissions(JSON.parse(JSON.stringify(newState)));
    }
  }, [roles, resources, allPermissions]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/permissions/seed", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/user-permissions"] });
      toast({ title: "Success", description: "Database seeded with default permissions" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed permissions",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: any[] = [];
      Object.entries(permissions).forEach(([roleId, resourcePerms]) => {
        Object.entries(resourcePerms).forEach(([resourceId, perms]) => {
          const original = originalPermissions[parseInt(roleId)]?.[parseInt(resourceId)];
          if (JSON.stringify(perms) !== JSON.stringify(original)) {
            updates.push({
              roleId: parseInt(roleId),
              resourceId: parseInt(resourceId),
              permissions: perms,
            });
          }
        });
      });
      if (updates.length === 0) {
        return { message: "No changes to save", updated: 0 };
      }
      return await apiRequest("/api/permissions/bulk-update", {
        method: "POST",
        body: { updates },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/user-permissions"] });
      const count = data?.updated || 0;
      toast({
        title: "Success",
        description: count > 0 ? `${count} permission${count === 1 ? "" : "s"} saved successfully` : "No changes to save",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save permissions",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await apiRequest(`/api/permissions/roles/${roleId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Success", description: "Role deleted successfully" });
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

  const handlePermissionChange = (
    roleId: number,
    resourceId: number,
    permType: PermissionType,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [resourceId]: {
          ...prev[roleId][resourceId],
          [permType]: value,
        },
      },
    }));
  };

  const handleBulkToggleResource = (resourceId: number, permType: PermissionType) => {
    if (!roles) return;
    const allEnabled = roles.every((role) => permissions[role.id]?.[resourceId]?.[permType]);
    setPermissions((prev) => {
      const newState = { ...prev };
      roles.forEach((role) => {
        if (!newState[role.id]) newState[role.id] = {};
        if (!newState[role.id][resourceId])
          newState[role.id][resourceId] = {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            pageVisible: false,
          };
        newState[role.id][resourceId][permType] = !allEnabled;
      });
      return newState;
    });
  };

  const handleBulkToggleRole = (roleId: number, permType: PermissionType) => {
    if (!resources) return;
    const allEnabled = resources.every((res) => permissions[roleId]?.[res.id]?.[permType]);
    setPermissions((prev) => {
      const newState = { ...prev };
      if (!newState[roleId]) newState[roleId] = {};
      resources.forEach((resource) => {
        if (!newState[roleId][resource.id])
          newState[roleId][resource.id] = {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            pageVisible: false,
          };
        newState[roleId][resource.id][permType] = !allEnabled;
      });
      return newState;
    });
  };

  const handleResetChanges = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
  };

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const groupedResources = useMemo(() => {
    if (!resources) return {};
    const grouped: Record<string, Resource[]> = {};
    resources.forEach((resource) => {
      const type = resource.resourceType || "page";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(resource);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    return grouped;
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    let filtered = resources;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.displayName.toLowerCase().includes(query) ||
          r.name.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
      );
    }
    if (selectedResourceType !== "all") {
      filtered = filtered.filter((r) => r.resourceType === selectedResourceType);
    }
    return filtered;
  }, [resources, searchQuery, selectedResourceType]);

  const getUserCountByRole = (roleName: string) => {
    if (!users) return 0;
    return users.filter((user) => user.role === roleName).length;
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      designer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      ops: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      manufacturer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    };
    return colors[roleName] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  };

  const { changedCount, changedCells } = useMemo(() => {
    if (!roles || !resources) return { changedCount: 0, changedCells: new Set<string>() };
    let count = 0;
    const cells = new Set<string>();
    roles.forEach((role) => {
      resources.forEach((resource) => {
        const current = permissions[role.id]?.[resource.id];
        const original = originalPermissions[role.id]?.[resource.id];
        if (current && original && JSON.stringify(current) !== JSON.stringify(original)) {
          count++;
          cells.add(`${role.id}-${resource.id}`);
        }
      });
    });
    return { changedCount: count, changedCells: cells };
  }, [permissions, originalPermissions, roles, resources]);

  const hasActualChanges = changedCount > 0;

  const isLoading = rolesLoading || resourcesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!roles || !resources) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Permissions
            </CardTitle>
            <CardDescription>
              Unable to load roles or resources. Please try refreshing the page or seed the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Seeding..." : "Seed Database"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Shield className="h-8 w-8 text-primary" />
              Permission Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure role-based access control with a visual permission matrix
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              data-testid="button-seed-permissions"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${seedMutation.isPending ? "animate-spin" : ""}`} />
              {seedMutation.isPending ? "Seeding..." : "Sync Defaults"}
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-role">
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roles.length}</p>
                  <p className="text-sm text-muted-foreground">Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resources.length}</p>
                  <p className="text-sm text-muted-foreground">Resources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allPermissions?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasActualChanges ? "bg-amber-500/10" : "bg-slate-500/10"}`}>
                  <AlertCircle className={`h-5 w-5 ${hasActualChanges ? "text-amber-500" : "text-slate-500"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{changedCount}</p>
                  <p className="text-sm text-muted-foreground">Unsaved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "matrix" | "roles")}>
          <TabsList className="mb-4">
            <TabsTrigger value="matrix" data-testid="tab-matrix">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Permission Matrix
            </TabsTrigger>
            <TabsTrigger value="roles" data-testid="tab-roles">
              <Users className="h-4 w-4 mr-2" />
              Role Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-resources"
                      />
                    </div>
                  </div>
                  <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                    <SelectTrigger className="w-[200px]" data-testid="select-resource-type">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="page">Pages</SelectItem>
                      <SelectItem value="feature">Features</SelectItem>
                      <SelectItem value="modal">Modals</SelectItem>
                      <SelectItem value="button">Buttons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Permission Matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Permission Matrix</CardTitle>
                <CardDescription>
                  Click checkboxes to toggle permissions. Use row/column headers for bulk operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <ScrollArea className="h-[600px]">
                    <div className="min-w-max">
                    {/* Header Row */}
                    <div className="sticky top-0 z-20 bg-background border-b">
                      <div className="flex">
                        <div className="w-64 min-w-64 p-3 font-semibold bg-muted/50 border-r">
                          Resource
                        </div>
                        {roles.map((role) => (
                          <div
                            key={role.id}
                            className="flex-1 min-w-[140px] p-2 text-center bg-muted/50 border-r last:border-r-0"
                          >
                            <Badge className={`${getRoleColor(role.name)} mb-1`}>
                              {role.displayName}
                            </Badge>
                            <div className="flex justify-center gap-1 mt-1">
                              {(["canView", "canCreate", "canEdit", "canDelete", "pageVisible"] as PermissionType[]).map(
                                (permType) => {
                                  const Icon = PERMISSION_ICONS[permType];
                                  return (
                                    <Tooltip key={permType}>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleBulkToggleRole(role.id, permType)}
                                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                          data-testid={`bulk-toggle-role-${role.name}-${permType}`}
                                        >
                                          <Icon className="h-3 w-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Toggle all {PERMISSION_LABELS[permType]} for {role.displayName}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resource Groups */}
                    {Object.entries(groupedResources).map(([groupType, groupResources]) => {
                      const config = RESOURCE_TYPE_CONFIG[groupType as keyof typeof RESOURCE_TYPE_CONFIG] || {
                        label: groupType,
                        icon: Settings,
                        color: "bg-gray-500",
                      };
                      const TypeIcon = config.icon;
                      const isExpanded = expandedGroups.has(groupType);
                      const filteredGroupResources = groupResources.filter((r) =>
                        filteredResources.some((fr) => fr.id === r.id)
                      );

                      if (filteredGroupResources.length === 0) return null;

                      return (
                        <Collapsible
                          key={groupType}
                          open={isExpanded}
                          onOpenChange={() => toggleGroupExpansion(groupType)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 transition-colors border-b cursor-pointer">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div className={`p-1 rounded ${config.color}`}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-semibold">{config.label}</span>
                              <Badge variant="secondary" className="ml-2">
                                {filteredGroupResources.length}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {filteredGroupResources.map((resource) => {
                              const isResourceChanged = roles?.some((role) => 
                                changedCells.has(`${role.id}-${resource.id}`)
                              ) || false;

                              return (
                                <div
                                  key={resource.id}
                                  className={`flex border-b last:border-b-0 ${isResourceChanged ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                                  data-testid={`row-resource-${resource.name}`}
                                >
                                  <div className="w-64 min-w-64 p-3 border-r">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <p className="font-medium text-sm">{resource.displayName}</p>
                                        {resource.description && (
                                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {resource.description}
                                          </p>
                                        )}
                                      </div>
                                      {isResourceChanged && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>Unsaved changes</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      {(["canView", "canCreate", "canEdit", "canDelete", "pageVisible"] as PermissionType[]).map(
                                        (permType) => {
                                          const Icon = PERMISSION_ICONS[permType];
                                          return (
                                            <Tooltip key={permType}>
                                              <TooltipTrigger asChild>
                                                <button
                                                  onClick={() => handleBulkToggleResource(resource.id, permType)}
                                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                                  data-testid={`bulk-toggle-resource-${resource.name}-${permType}`}
                                                >
                                                  <Icon className="h-3 w-3" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Toggle {PERMISSION_LABELS[permType]} for all roles</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                  {roles.map((role) => (
                                    <div
                                      key={role.id}
                                      className="flex-1 min-w-[140px] p-2 border-r last:border-r-0 flex items-center justify-center"
                                    >
                                      <div className="flex gap-1">
                                        {(["canView", "canCreate", "canEdit", "canDelete", "pageVisible"] as PermissionType[]).map(
                                          (permType) => {
                                            const isEnabled = permissions[role.id]?.[resource.id]?.[permType] || false;
                                            const Icon = PERMISSION_ICONS[permType];
                                            return (
                                              <Tooltip key={permType}>
                                                <TooltipTrigger asChild>
                                                  <button
                                                    onClick={() =>
                                                      handlePermissionChange(role.id, resource.id, permType, !isEnabled)
                                                    }
                                                    className={`p-1.5 rounded transition-all ${
                                                      isEnabled
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                    }`}
                                                    data-testid={`perm-${role.name}-${resource.name}-${permType}`}
                                                  >
                                                    <Icon className="h-3 w-3" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>
                                                    {PERMISSION_LABELS[permType]}: {isEnabled ? "Enabled" : "Disabled"}
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles Overview</CardTitle>
                <CardDescription>Manage system and custom roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" data-testid="table-roles">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold bg-muted">Role</th>
                        <th className="text-left p-3 font-semibold bg-muted">Description</th>
                        <th className="text-center p-3 font-semibold bg-muted">Users</th>
                        <th className="text-center p-3 font-semibold bg-muted">Type</th>
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
                            <Badge className={getRoleColor(role.name)}>{role.displayName}</Badge>
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
                              {!role.isSystem && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteDialogRole(role)}
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
          </TabsContent>
        </Tabs>

        {/* Floating Save Bar */}
        {hasActualChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">
                  {changedCount} unsaved {changedCount === 1 ? "change" : "changes"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetChanges}
                  disabled={updateMutation.isPending}
                  data-testid="button-reset-changes"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-all"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          </div>
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
                Are you sure you want to delete the role "{deleteDialogRole?.displayName}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDialogRole && deleteMutation.mutate(deleteDialogRole.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
