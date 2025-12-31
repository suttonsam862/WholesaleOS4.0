import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreateContactModal } from "./create-contact-modal";
import { EditContactModal } from "./edit-contact-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface Organization {
  id: number;
  name: string;
  sports: string;
  city: string;
  state: string;
  shippingAddress: string;
  notes: string;
  logoUrl: string;
  createdAt: string;
}

interface Contact {
  id: number;
  orgId: number;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  role: "customer" | "admin" | "billing" | "technical" | "executive" | "other";
  isPrimary: boolean;
  createdAt: string;
}

interface OrganizationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}

export function OrganizationDetailModal({ 
  isOpen, 
  onClose, 
  organization, 
  onEdit, 
  onDelete 
}: OrganizationDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canModify, canDelete: canDeletePermission } = usePermissions();
  
  // Contact modal states
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteContactDialogOpen, setIsDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ['/api/organizations', organization?.id, 'contacts'],
    enabled: !!organization?.id && isOpen,
    retry: false,
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (contactId: number) => apiRequest("DELETE", `/api/contacts/${contactId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organization?.id, 'contacts'] });
      setIsDeleteContactDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });
  
  // Contact management handlers
  const handleAddContact = () => {
    setIsCreateContactModalOpen(true);
  };
  
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditContactModalOpen(true);
  };
  
  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteContactDialogOpen(true);
  };
  
  const handleConfirmDeleteContact = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id);
    }
  };
  
  const handleCloseCreateContactModal = () => {
    setIsCreateContactModalOpen(false);
  };
  
  const handleCloseEditContactModal = () => {
    setIsEditContactModalOpen(false);
    setSelectedContact(null);
  };

  if (!organization) return null;

  const organizationContacts = contacts || [];
  
  // Helper function to get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'billing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'technical': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'executive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Sort contacts: primary first, then by role, then by name
  const sortedContacts = [...organizationContacts].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.name.localeCompare(b.name);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-organization-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Organization Details</span>
            <div className="flex space-x-2">
              {canModify('organizations') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(organization)}
                  data-testid="button-edit-from-detail"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit
                </Button>
              )}
              {canDeletePermission('organizations') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(organization)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid="button-delete-from-detail"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-semibold text-white">
                    {organization.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold" data-testid="text-detail-org-name">
                    {organization.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Created {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {organization.sports && (
                <div className="mb-4">
                  <Badge variant="secondary" data-testid="badge-org-sports">
                    {organization.sports}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(organization.city || organization.state) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-sm" data-testid="text-detail-org-location">
                    {organization.city && organization.state 
                      ? `${organization.city}, ${organization.state}`
                      : organization.city || organization.state || "Not specified"}
                  </p>
                </div>
              )}

              {organization.shippingAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Address</label>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-detail-org-address">
                    {organization.shippingAddress}
                  </p>
                </div>
              )}

              {organization.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-detail-org-notes">
                    {organization.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Contacts ({sortedContacts.length})</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddContact}
                  data-testid="button-add-contact"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Contact
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedContacts.length > 0 ? (
                <div className="space-y-3">
                  {sortedContacts.map((contact, index) => (
                    <div key={contact.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium" data-testid={`text-contact-name-${contact.id}`}>
                              {contact.name}
                            </p>
                            {contact.isPrimary && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200" data-testid={`badge-primary-${contact.id}`}>
                                <i className="fas fa-star mr-1"></i>
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs ${getRoleColor(contact.role)}`} data-testid={`badge-role-${contact.id}`}>
                              {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                            </Badge>
                            {contact.roleTitle && (
                              <span className="text-sm text-muted-foreground" data-testid={`text-contact-role-title-${contact.id}`}>
                                {contact.roleTitle}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-4">
                            {contact.email && (
                              <span className="text-sm text-muted-foreground" data-testid={`text-contact-email-${contact.id}`}>
                                <i className="fas fa-envelope mr-1"></i>
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="text-sm text-muted-foreground" data-testid={`text-contact-phone-${contact.id}`}>
                                <i className="fas fa-phone mr-1"></i>
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditContact(contact)}
                            data-testid={`button-edit-contact-${contact.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteContact(contact)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                      {index < sortedContacts.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
                  <p>No contacts found for this organization.</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-3"
                    onClick={handleAddContact}
                    data-testid="button-add-first-contact"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add First Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-contacts">
                    {sortedContacts.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-leads">
                    -
                  </p>
                  <p className="text-sm text-muted-foreground">Leads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600" data-testid="stat-orders">
                    -
                  </p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contact Modals */}
        <CreateContactModal
          isOpen={isCreateContactModalOpen}
          onClose={handleCloseCreateContactModal}
          preselectedOrgId={organization?.id}
        />
        
        <EditContactModal
          isOpen={isEditContactModalOpen}
          onClose={handleCloseEditContactModal}
          contact={selectedContact}
        />
        
        {/* Delete Contact Confirmation */}
        <AlertDialog open={isDeleteContactDialogOpen} onOpenChange={setIsDeleteContactDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-contact">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {contactToDelete?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-contact">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteContact}
                disabled={deleteContactMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-contact"
              >
                {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}