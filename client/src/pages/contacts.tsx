import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { canModify } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Search, Mail, Phone, Building2, User, Star, Edit, X, Trash2 } from "lucide-react";
import type { Contact, Organization } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";

export default function Contacts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

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

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  // Fetch organizations for filter dropdown
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  // Check permissions
  const canWrite = canModify(user, "contacts");

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Contact> }) => {
      return await apiRequest(`/api/contacts/${data.id}`, {
        method: "PUT",
        body: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      setIsDetailModalOpen(false);
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/contacts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      setIsDetailModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  // Handle opening contact detail modal
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setEditForm(contact);
    setIsEditing(false);
    setIsDetailModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (selectedContact && editForm) {
      updateContactMutation.mutate({
        id: selectedContact.id,
        updates: editForm,
      });
    }
  };

  // Handle delete contact
  const handleDeleteContact = () => {
    if (selectedContact && confirm(`Are you sure you want to delete ${selectedContact.name}? This action cannot be undone.`)) {
      deleteContactMutation.mutate(selectedContact.id);
    }
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!contact.name.toLowerCase().includes(searchLower) &&
            !(contact.email?.toLowerCase().includes(searchLower)) &&
            !(contact.phone?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== "all" && contact.role !== roleFilter) {
        return false;
      }

      // Organization filter
      if (orgFilter !== "all" && contact.orgId?.toString() !== orgFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, searchTerm, roleFilter, orgFilter]);

  // Get organization name by ID
  const getOrgName = (orgId: number | null) => {
    if (!orgId) return "No Organization";
    const org = organizations.find(o => o.id === orgId);
    return org?.name || "Unknown Organization";
  };
  
  // Get organization by ID for logo access
  const getOrg = (orgId: number | null) => {
    if (!orgId) return null;
    return organizations.find(o => o.id === orgId) || null;
  };

  // Role badges with colors
  const getRoleBadge = (role: string | null) => {
    const roleConfig: Record<string, { label: string; color: string }> = {
      customer: { label: "Customer", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      admin: { label: "Admin", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      billing: { label: "Billing", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      technical: { label: "Technical", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
      executive: { label: "Executive", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      other: { label: "Other", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    };

    const config = roleConfig[role || "other"] || roleConfig.other;
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.color)}>
        {config.label}
      </span>
    );
  };

  // Show loading state
  if (contactsLoading || isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage contacts across all organizations</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white min-h-[44px]"
                  data-testid="input-search-contacts"
                />
              </div>
            </div>
            <ScrollArea className="w-full md:hidden">
              <div className="flex gap-2 pb-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10 text-white min-h-[44px] shrink-0" data-testid="select-role-filter-mobile">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white min-h-[44px] shrink-0" data-testid="select-org-filter-mobile">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="hidden md:flex gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 bg-black/20 border-white/10 text-white min-h-[44px]" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-64 bg-black/20 border-white/10 text-white min-h-[44px]" data-testid="select-org-filter">
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-white/10 bg-transparent">
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== "all" || orgFilter !== "all" 
                ? "No contacts match your filters" 
                : "No contacts found"}
            </p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredContacts.map((contact, index) => {
            const org = getOrg(contact.orgId);
            return (
              <MobileDataCard
                key={contact.id}
                title={
                  <div className="flex items-center gap-2">
                    {contact.name}
                    {contact.isPrimary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                }
                subtitle={contact.roleTitle || org?.name || "No Organization"}
                status={contact.role ? { value: contact.role, label: contact.role.charAt(0).toUpperCase() + contact.role.slice(1) } : undefined}
                metadata={[
                  ...(contact.email ? [{ label: "Email", value: contact.email, icon: <Mail className="h-3 w-3" /> }] : []),
                  ...(contact.phone ? [{ label: "Phone", value: contact.phone, icon: <Phone className="h-3 w-3" /> }] : []),
                ]}
                actions={[
                  { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => { handleContactClick(contact); setIsEditing(true); } },
                  { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => { setSelectedContact(contact); handleDeleteContact(); }, variant: "danger" },
                ]}
                onClick={() => handleContactClick(contact)}
                index={index}
                data-testid={`card-contact-${contact.id}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card 
              key={contact.id} 
              className="glass-card hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] transition-all duration-200 cursor-pointer border-white/10 hover:bg-white/5" 
              data-testid={`card-contact-${contact.id}`}
              onClick={() => handleContactClick(contact)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground" data-testid={`text-contact-name-${contact.id}`}>
                          {contact.name}
                        </h3>
                        {contact.isPrimary && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" data-testid={`icon-primary-${contact.id}`} />
                        )}
                      </div>
                      {contact.roleTitle && (
                        <p className="text-sm text-muted-foreground">{contact.roleTitle}</p>
                      )}
                    </div>
                    {getRoleBadge(contact.role)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {(() => {
                        const org = getOrg(contact.orgId);
                        return org ? (
                          <>
                            <OrgLogo
                              src={org.logoUrl}
                              orgName={org.name}
                              orgId={org.id}
                              size="xs"
                            />
                            <span className="text-muted-foreground">{org.name}</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">No Organization</span>
                          </>
                        );
                      })()}
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="text-primary hover:underline"
                          data-testid={`link-email-${contact.id}`}
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${contact.phone}`} 
                          className="text-primary hover:underline"
                          data-testid={`link-phone-${contact.id}`}
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl glass-panel border-white/10" data-testid="dialog-contact-detail">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-foreground" data-testid="text-modal-title">
                  {isEditing ? "Edit Contact" : "Contact Details"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedContact && !isEditing && `View information for ${selectedContact.name}`}
                  {isEditing && "Update contact information"}
                </DialogDescription>
              </div>
              {canWrite && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-contact"
                  className="border-white/10 hover:bg-white/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4 mt-4">
              {!isEditing ? (
                // View Mode
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="mt-1 text-sm text-foreground" data-testid="text-contact-detail-name">{selectedContact.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <div className="mt-1">{getRoleBadge(selectedContact.role)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="mt-1 text-sm" data-testid="text-contact-detail-email">
                        {selectedContact.email ? (
                          <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                            {selectedContact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="mt-1 text-sm" data-testid="text-contact-detail-phone">
                        {selectedContact.phone ? (
                          <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                            {selectedContact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                      <p className="mt-1 text-sm text-foreground" data-testid="text-contact-detail-org">
                        {getOrgName(selectedContact.orgId)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                      <p className="mt-1 text-sm text-foreground" data-testid="text-contact-detail-title">
                        {selectedContact.roleTitle || <span className="text-muted-foreground">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Primary Contact</Label>
                    <p className="mt-1 text-sm" data-testid="text-contact-detail-primary">
                      {selectedContact.isPrimary ? (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-yellow-500" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-foreground">No</span>
                      )}
                    </p>
                  </div>

                  {canWrite && (
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteContact}
                        disabled={deleteContactMutation.isPending}
                        data-testid="button-delete-contact"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteContactMutation.isPending ? "Deleting..." : "Delete Contact"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                // Edit Mode
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-foreground">Name *</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-black/20 border-white/10 text-white"
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-role" className="text-foreground">Role</Label>
                      <Select 
                        value={editForm.role || "other"} 
                        onValueChange={(value) => setEditForm({ ...editForm, role: value as any })}
                      >
                        <SelectTrigger id="edit-role" className="bg-black/20 border-white/10 text-white" data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email" className="text-foreground">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-black/20 border-white/10 text-white"
                        data-testid="input-edit-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone" className="text-foreground">Phone</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editForm.phone || ""}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="bg-black/20 border-white/10 text-white"
                        data-testid="input-edit-phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-org" className="text-foreground">Organization</Label>
                      <Select 
                        value={editForm.orgId?.toString() || ""} 
                        onValueChange={(value) => setEditForm({ ...editForm, orgId: value ? parseInt(value) : null })}
                      >
                        <SelectTrigger id="edit-org" className="bg-black/20 border-white/10 text-white" data-testid="select-edit-org">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Organization</SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-title" className="text-foreground">Job Title</Label>
                      <Input
                        id="edit-title"
                        value={editForm.roleTitle || ""}
                        onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                        className="bg-black/20 border-white/10 text-white"
                        data-testid="input-edit-title"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <Button 
                      onClick={handleSaveEdit} 
                      disabled={!editForm.name || updateContactMutation.isPending}
                      data-testid="button-save-contact"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(selectedContact);
                      }}
                      data-testid="button-cancel-edit"
                      className="border-white/10 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}