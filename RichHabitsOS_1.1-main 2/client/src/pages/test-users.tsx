import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTestMode } from "@/contexts/TestModeContext";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Eye, Shield, Lock, Unlock } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
  isActive: boolean;
}

interface Permission {
  resource: string;
  actions: string[];
}

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    { resource: "All Resources", actions: ["read", "write", "delete", "admin"] }
  ],
  sales: [
    { resource: "leads", actions: ["read", "write"] },
    { resource: "organizations", actions: ["read", "write"] },
    { resource: "contacts", actions: ["read", "write"] },
    { resource: "orders", actions: ["read", "write"] },
    { resource: "quotes", actions: ["read", "write"] },
    { resource: "catalog", actions: ["read"] },
    { resource: "design_jobs", actions: ["read", "write"] },
  ],
  designer: [
    { resource: "design_jobs", actions: ["read", "write"] },
    { resource: "orders", actions: ["read"] },
    { resource: "catalog", actions: ["read"] },
  ],
  ops: [
    { resource: "orders", actions: ["read", "write"] },
    { resource: "manufacturing", actions: ["read", "write"] },
    { resource: "catalog", actions: ["read"] },
    { resource: "design_jobs", actions: ["read"] },
  ],
  manufacturer: [
    { resource: "manufacturing", actions: ["read", "write"] },
    { resource: "orders", actions: ["read"] },
  ],
};

const roleDescriptions: Record<string, string> = {
  admin: "Full system access including user management, settings, and all operations",
  sales: "Manage leads, organizations, contacts, orders, and quotes. Create design jobs.",
  designer: "Manage design jobs and view orders. Access product catalog for reference.",
  ops: "Manage orders and manufacturing. Coordinate production and fulfillment.",
  manufacturer: "View and update manufacturing orders. Track production status.",
};

const sidebarAccess: Record<string, string[]> = {
  admin: ["Dashboard", "Leads", "Organizations", "Orders", "Design Jobs", "Manufacturing", "Catalog", "Salespeople", "Users", "Finance", "Quotes", "Settings", "Test Users"],
  sales: ["Dashboard", "Leads", "Organizations", "Orders", "Design Jobs", "Catalog", "Quotes"],
  designer: ["Dashboard", "Design Jobs", "Catalog"],
  ops: ["Dashboard", "Orders", "Manufacturing", "Catalog", "Design Jobs"],
  manufacturer: ["Dashboard", "Manufacturing"],
};

export default function TestUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { enterTestMode, isTestMode, exitTestMode } = useTestMode();
  const [, setLocation] = useLocation();

  // Use test users endpoint in development/unauthenticated mode
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/test/users"],
    retry: false,
  });

  const selectedUser = users.find(u => u.id === selectedUserId);
  const permissions = selectedUser ? rolePermissions[selectedUser.role] || [] : [];
  const roleDescription = selectedUser ? roleDescriptions[selectedUser.role] || "" : "";
  const availablePages = selectedUser ? sidebarAccess[selectedUser.role] || [] : [];

  const handleEnterTestMode = () => {
    if (selectedUser) {
      enterTestMode({
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
      });
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test User Access</h1>
        <p className="text-muted-foreground">
          Select a user to preview their permissions and interface. Enter test mode to experience the application as that user.
        </p>
      </div>

      {isTestMode && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-semibold">Test Mode Active</span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  exitTestMode();
                  setSelectedUserId("");
                }}
                data-testid="button-exit-test-mode-page"
              >
                Exit Test Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>
            Choose a user to preview their access permissions and available features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger data-testid="select-test-user">
              <SelectValue placeholder="Select a user to test..." />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[100]">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                    {user.name} - {user.role}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No users available</SelectItem>
              )}
            </SelectContent>
          </Select>

          {selectedUser && (
            <div className="space-y-4">
              <Separator />

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  User Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge>{selectedUser.role}</Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="font-medium text-right max-w-md">{roleDescription}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Resource Permissions
                </h3>
                <div className="space-y-2">
                  {permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium capitalize">{perm.resource.replace(/_/g, ' ')}</span>
                      <div className="flex gap-2">
                        {perm.actions.map(action => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Available Pages
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {availablePages.map(page => (
                    <div key={page} className="flex items-center gap-2 p-2 rounded-lg border">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{page}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleEnterTestMode}
                className="w-full"
                size="lg"
                data-testid="button-enter-test-mode"
              >
                <Eye className="h-4 w-4 mr-2" />
                Enter Test Mode as {selectedUser.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}