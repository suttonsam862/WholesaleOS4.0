import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Save, Download, FileSpreadsheet } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text" data-testid="heading-settings">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences.</p>
        </div>

        <div className="space-y-6">
        {/* Company Profile */}
        <Card className="glass-card border-white/10" data-testid="card-company-profile">
          <CardHeader>
            <CardTitle className="text-foreground">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name" className="text-foreground">Company Name</Label>
                <Input 
                  id="company-name" 
                  placeholder="Your Company Name" 
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label htmlFor="company-email" className="text-foreground">Company Email</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  placeholder="company@example.com" 
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-company-email"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company-address" className="text-foreground">Company Address</Label>
              <Textarea 
                id="company-address" 
                placeholder="Enter company address" 
                className="bg-black/20 border-white/10 text-white"
                data-testid="textarea-company-address"
              />
            </div>
            
            <Button data-testid="button-save-company" className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Company Profile
            </Button>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card className="glass-card border-white/10" data-testid="card-defaults">
          <CardHeader>
            <CardTitle className="text-foreground">Default Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default-manufacturer" className="text-foreground">Default Manufacturer</Label>
                <select 
                  id="default-manufacturer"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid="select-default-manufacturer"
                >
                  <option value="" className="bg-background text-foreground">Select manufacturer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="default-lead-time" className="text-foreground">Default Lead Time (days)</Label>
                <Input 
                  id="default-lead-time" 
                  type="number" 
                  placeholder="14" 
                  className="bg-black/20 border-white/10 text-white"
                  data-testid="input-default-lead-time"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="default-price-break" className="text-foreground">Default Price Break Rules</Label>
              <Textarea 
                id="default-price-break" 
                placeholder="Define default price break rules..." 
                className="bg-black/20 border-white/10 text-white"
                data-testid="textarea-price-break-rules"
              />
            </div>
            
            <Button data-testid="button-save-defaults" className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Defaults
            </Button>
          </CardContent>
        </Card>

        {/* Role Access Controls */}
        <Card className="glass-card border-white/10" data-testid="card-role-access">
          <CardHeader>
            <CardTitle className="text-foreground">Role Access Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { role: "Admin", description: "Full system access" },
              { role: "Sales", description: "Leads, orders, organizations" },
              { role: "Designer", description: "Design jobs and projects" },
              { role: "Operations", description: "Orders, manufacturing, catalog" },
              { role: "Manufacturer", description: "Manufacturing updates only" },
            ].map((roleInfo) => (
              <div key={roleInfo.role}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{roleInfo.role}</p>
                    <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${roleInfo.role.toLowerCase()}-dashboard`} className="text-sm text-foreground">Dashboard</Label>
                      <Switch 
                        id={`${roleInfo.role.toLowerCase()}-dashboard`} 
                        defaultChecked 
                        data-testid={`switch-${roleInfo.role.toLowerCase()}-dashboard`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${roleInfo.role.toLowerCase()}-leads`} className="text-sm text-foreground">Leads</Label>
                      <Switch 
                        id={`${roleInfo.role.toLowerCase()}-leads`} 
                        defaultChecked={roleInfo.role === "Admin" || roleInfo.role === "Sales"}
                        data-testid={`switch-${roleInfo.role.toLowerCase()}-leads`}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${roleInfo.role.toLowerCase()}-orders`} className="text-sm text-foreground">Orders</Label>
                      <Switch 
                        id={`${roleInfo.role.toLowerCase()}-orders`} 
                        defaultChecked={roleInfo.role !== "Designer"}
                        data-testid={`switch-${roleInfo.role.toLowerCase()}-orders`}
                      />
                    </div>
                  </div>
                </div>
                {roleInfo.role !== "Manufacturer" && <Separator className="mt-4 bg-white/10" />}
              </div>
            ))}
            
            <Button data-testid="button-save-permissions" className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Permissions
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="glass-card border-white/10" data-testid="card-system-settings">
          <CardHeader>
            <CardTitle className="text-foreground">System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="soft-delete-retention" className="text-foreground">Soft Delete Retention (days)</Label>
              <Input 
                id="soft-delete-retention" 
                type="number" 
                placeholder="30" 
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-soft-delete-retention"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to keep soft-deleted records before permanent deletion
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Audit Logging</p>
                <p className="text-sm text-muted-foreground">Track all user actions and changes</p>
              </div>
              <Switch defaultChecked data-testid="switch-audit-logging" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Email Notifications</p>
                <p className="text-sm text-muted-foreground">Send notifications for important events</p>
              </div>
              <Switch defaultChecked data-testid="switch-email-notifications" />
            </div>
            
            <Button data-testid="button-save-system" className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save System Settings
            </Button>
          </CardContent>
        </Card>

        {/* Backup & Export */}
        <Card className="glass-card border-white/10" data-testid="card-backup-export">
          <CardHeader>
            <CardTitle className="text-foreground">Backup & Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Database Backup</p>
                <p className="text-sm text-muted-foreground">Download a complete backup of your data</p>
              </div>
              <Button variant="outline" data-testid="button-download-backup" className="border-white/10 hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" />
                Download Backup
              </Button>
            </div>
            
            <Separator className="bg-white/10" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">CSV Export</p>
                <p className="text-sm text-muted-foreground">Export all data as CSV files in a ZIP archive</p>
              </div>
              <Button variant="outline" data-testid="button-export-csv" className="border-white/10 hover:bg-white/10">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}