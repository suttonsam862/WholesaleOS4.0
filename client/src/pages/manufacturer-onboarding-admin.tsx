import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MoreHorizontal,
  Plus,
  Send,
  XCircle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  AlertCircle,
  Building,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface ManufacturerInvite {
  id: number;
  inviteCode: string;
  companyName: string;
  contactEmail: string;
  contactName?: string;
  status: "pending" | "sent" | "opened" | "started" | "completed" | "expired" | "revoked";
  sentAt?: string;
  expiresAt?: string;
  createdAt: string;
  invitedByName?: string;
}

interface ManufacturerApplication {
  id: number;
  applicationCode: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: "draft" | "submitted" | "under_review" | "info_requested" | "approved" | "rejected";
  currentStep: number;
  country: string;
  submittedAt?: string;
  createdAt: string;
  reviewedByName?: string;
}

interface OnboardingStats {
  invitesByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  pendingReviewCount: number;
}

function getInviteStatusBadge(status: ManufacturerInvite["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "sent":
      return <Badge variant="default">Sent</Badge>;
    case "opened":
      return <Badge className="bg-blue-500">Opened</Badge>;
    case "started":
      return <Badge className="bg-yellow-500">Started</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Completed</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired</Badge>;
    case "revoked":
      return <Badge variant="destructive">Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getApplicationStatusBadge(status: ManufacturerApplication["status"]) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "submitted":
      return <Badge className="bg-blue-500">Submitted</Badge>;
    case "under_review":
      return <Badge className="bg-yellow-500">Under Review</Badge>;
    case "info_requested":
      return <Badge className="bg-orange-500">Info Requested</Badge>;
    case "approved":
      return <Badge className="bg-green-500">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ManufacturerOnboardingAdmin() {
  const [activeTab, setActiveTab] = useState("invites");
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ManufacturerApplication | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "request-info" | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // New invite form state
  const [newInvite, setNewInvite] = useState({
    companyName: "",
    contactEmail: "",
    contactName: "",
    expectedProductFamilies: "",
    personalNote: "",
    expiresInDays: 30,
  });

  // Fetch stats
  const { data: stats } = useQuery<OnboardingStats>({
    queryKey: ["/api/admin/manufacturer-onboarding/stats"],
  });

  // Fetch invites
  const { data: invites = [], isLoading: invitesLoading } = useQuery<ManufacturerInvite[]>({
    queryKey: ["/api/admin/manufacturer-invites"],
  });

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ManufacturerApplication[]>({
    queryKey: ["/api/admin/manufacturer-applications"],
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (data: typeof newInvite) => {
      const response = await fetch("/api/admin/manufacturer-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create invite");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-onboarding/stats"] });
      setCreateInviteOpen(false);
      setNewInvite({
        companyName: "",
        contactEmail: "",
        contactName: "",
        expectedProductFamilies: "",
        personalNote: "",
        expiresInDays: 30,
      });
      toast({
        title: "Invite created",
        description: `Invite sent to ${data.contactEmail}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invite",
        variant: "destructive",
      });
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/manufacturer-invites/${id}/resend`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to resend invite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-invites"] });
      toast({ title: "Invite resent" });
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/manufacturer-invites/${id}/revoke`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to revoke invite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-onboarding/stats"] });
      toast({ title: "Invite revoked" });
    },
  });

  // Application action mutation
  const applicationActionMutation = useMutation({
    mutationFn: async ({ id, action, message }: { id: number; action: string; message?: string }) => {
      const response = await fetch(`/api/admin/manufacturer-applications/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          action === "approve"
            ? { reviewNotes: message }
            : action === "reject"
            ? { rejectionReason: message }
            : { message }
        ),
      });
      if (!response.ok) throw new Error(`Failed to ${action} application`);
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturer-onboarding/stats"] });
      setActionDialogOpen(false);
      setActionType(null);
      setActionMessage("");
      setViewApplicationOpen(false);
      toast({
        title: `Application ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"}`,
      });
    },
  });

  const handleCreateInvite = () => {
    createInviteMutation.mutate(newInvite);
  };

  const handleApplicationAction = () => {
    if (!selectedApplication || !actionType) return;
    applicationActionMutation.mutate({
      id: selectedApplication.id,
      action: actionType,
      message: actionMessage,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manufacturer Onboarding</h1>
          <p className="text-muted-foreground">Manage manufacturer invites and applications</p>
        </div>
        <Dialog open={createInviteOpen} onOpenChange={setCreateInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Manufacturer Invite</DialogTitle>
              <DialogDescription>
                Send an invitation to a manufacturer to apply for partnership.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={newInvite.companyName}
                  onChange={(e) => setNewInvite({ ...newInvite, companyName: e.target.value })}
                  placeholder="Acme Manufacturing"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={newInvite.contactEmail}
                    onChange={(e) => setNewInvite({ ...newInvite, contactEmail: e.target.value })}
                    placeholder="contact@acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={newInvite.contactName}
                    onChange={(e) => setNewInvite({ ...newInvite, contactName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expected Product Families</Label>
                <Input
                  value={newInvite.expectedProductFamilies}
                  onChange={(e) => setNewInvite({ ...newInvite, expectedProductFamilies: e.target.value })}
                  placeholder="e.g., Jerseys, Hoodies, Polos"
                />
              </div>
              <div className="space-y-2">
                <Label>Personal Note</Label>
                <Textarea
                  value={newInvite.personalNote}
                  onChange={(e) => setNewInvite({ ...newInvite, personalNote: e.target.value })}
                  placeholder="Optional message to include in the invite email"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires In (days)</Label>
                <Input
                  type="number"
                  value={newInvite.expiresInDays}
                  onChange={(e) => setNewInvite({ ...newInvite, expiresInDays: parseInt(e.target.value) || 30 })}
                  min={1}
                  max={90}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvite}
                disabled={!newInvite.companyName || !newInvite.contactEmail || createInviteMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats?.pendingReviewCount || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Invites</p>
                <p className="text-2xl font-bold">
                  {(stats?.invitesByStatus?.sent || 0) + (stats?.invitesByStatus?.opened || 0)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats?.applicationsByStatus?.approved || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invites">
            <Mail className="w-4 h-4 mr-2" />
            Invites ({invites.length})
          </TabsTrigger>
          <TabsTrigger value="applications">
            <FileText className="w-4 h-4 mr-2" />
            Applications ({applications.length})
            {(stats?.pendingReviewCount || 0) > 0 && (
              <Badge className="ml-2 bg-yellow-500">{stats?.pendingReviewCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Invites</CardTitle>
              <CardDescription>Track and manage invitations sent to potential manufacturers</CardDescription>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invites yet. Click "New Invite" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.companyName}</TableCell>
                        <TableCell>
                          <div>
                            <div>{invite.contactName || "-"}</div>
                            <div className="text-sm text-muted-foreground">{invite.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                        <TableCell>
                          {invite.sentAt ? format(new Date(invite.sentAt), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {invite.expiresAt ? format(new Date(invite.expiresAt), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>{invite.invitedByName || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => resendInviteMutation.mutate(invite.id)}
                                disabled={invite.status === "completed" || invite.status === "revoked"}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => revokeInviteMutation.mutate(invite.id)}
                                disabled={invite.status === "completed" || invite.status === "revoked"}
                                className="text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Applications</CardTitle>
              <CardDescription>Review and process manufacturer partnership applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications received yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.companyName}</TableCell>
                        <TableCell>
                          <div>
                            <div>{application.contactName}</div>
                            <div className="text-sm text-muted-foreground">{application.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{application.country}</TableCell>
                        <TableCell>{getApplicationStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${
                                  step <= application.currentStep ? "bg-primary" : "bg-gray-200"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              Step {application.currentStep}/4
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.submittedAt
                            ? format(new Date(application.submittedAt), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedApplication(application);
                              setViewApplicationOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Dialog */}
      <Dialog open={viewApplicationOpen} onOpenChange={setViewApplicationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application: {selectedApplication?.companyName}</DialogTitle>
            <DialogDescription>
              Review the manufacturer application details
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span className="font-medium">{selectedApplication.companyName}</span>
                </div>
                {getApplicationStatusBadge(selectedApplication.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p>{selectedApplication.contactName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p>{selectedApplication.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p>{selectedApplication.country}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Application Code</Label>
                  <p className="font-mono">{selectedApplication.applicationCode}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Application Progress</Label>
                <div className="flex items-center gap-2 mt-2">
                  {["Basic Info", "Capabilities", "Documents", "Pricing"].map((label, i) => (
                    <div
                      key={i}
                      className={`flex-1 p-2 rounded text-center text-sm ${
                        i + 1 <= selectedApplication.currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {selectedApplication.status === "submitted" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setActionType("request-info");
                      setActionDialogOpen(true);
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Request Info
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => {
                      setActionType("reject");
                      setActionDialogOpen(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setActionType("approve");
                      setActionDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Application"
                : actionType === "reject"
                ? "Reject Application"
                : "Request Information"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will create a manufacturer account for this company."
                : actionType === "reject"
                ? "Please provide a reason for rejection."
                : "What additional information do you need?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {actionType === "approve"
                  ? "Notes (optional)"
                  : actionType === "reject"
                  ? "Rejection Reason *"
                  : "Message *"}
              </Label>
              <Textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Any notes about this approval..."
                    : actionType === "reject"
                    ? "Please explain why the application is being rejected..."
                    : "What additional information or documents do you need?"
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplicationAction}
              disabled={
                (actionType !== "approve" && !actionMessage) ||
                applicationActionMutation.isPending
              }
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {actionType === "approve"
                ? "Approve & Create Account"
                : actionType === "reject"
                ? "Reject Application"
                : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
