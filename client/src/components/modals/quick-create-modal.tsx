import { useState, useMemo } from "react";
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateOrganizationModal } from "./create-organization-modal";
import { CreateContactModal } from "./create-contact-modal";
import { CreateLeadModal } from "./create-lead-modal";
import { CreateOrderModal } from "./create-order-modal";
import { CreateProductModal } from "./create-product-modal";
import { usePermissions } from "@/hooks/usePermissions";
import type { Resource } from "@/lib/permissions";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createOptions: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  resource: Resource;
}> = [
  {
    id: "organization",
    name: "Organization",
    description: "Create a new organization",
    icon: "fas fa-building",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/20",
    resource: "organizations",
  },
  {
    id: "lead",
    name: "Lead",
    description: "Create a new sales lead",
    icon: "fas fa-bullseye",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500/20",
    resource: "leads",
  },
  {
    id: "order",
    name: "Order",
    description: "Create a new order",
    icon: "fas fa-shopping-cart",
    iconColor: "text-green-400",
    bgColor: "bg-green-500/20",
    resource: "orders",
  },
  {
    id: "product",
    name: "Product",
    description: "Add a new product to catalog",
    icon: "fas fa-box",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/20",
    resource: "catalog",
  },
];

export function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { canModify } = usePermissions();

  // Filter create options based on user permissions
  const filteredOptions = useMemo(() => {
    return createOptions.filter(option => canModify(option.resource));
  }, [canModify]);

  const handleCreate = (type: string) => {
    setSelectedType(type);
  };

  const handleCloseAll = () => {
    setSelectedType(null);
    onClose();
  };

  const handleCloseSubModal = () => {
    setSelectedType(null);
  };

  const isMobile = useIsMobile();

  return (
    <>
      <ResponsiveDialog open={isOpen && !selectedType} onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}>
        <ResponsiveDialogContent className="sm:max-w-md" data-testid="modal-quick-create">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center justify-between">
              Quick Create
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px]"
                  data-testid="button-close-modal"
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          
          <div className="space-y-3 mt-4 px-4 sm:px-0">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="ghost"
                  className="w-full justify-start p-4 min-h-[56px] h-auto hover:bg-muted/30"
                  onClick={() => handleCreate(option.id)}
                  data-testid={`button-create-${option.id}`}
                >
                  <div className={`w-10 h-10 ${option.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                    <i className={`${option.icon} ${option.iconColor}`}></i>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-lock text-4xl mb-3 opacity-50"></i>
                <p className="text-sm">No create actions available</p>
                <p className="text-xs mt-1">Contact your administrator for access</p>
              </div>
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <CreateOrganizationModal 
        isOpen={selectedType === "organization"}
        onClose={handleCloseSubModal}
      />
      
      <CreateContactModal 
        isOpen={selectedType === "contact"}
        onClose={handleCloseSubModal}
      />
      
      <CreateLeadModal 
        isOpen={selectedType === "lead"}
        onClose={handleCloseSubModal}
      />
      
      <CreateOrderModal 
        isOpen={selectedType === "order"}
        onClose={handleCloseSubModal}
      />
      
      <CreateProductModal 
        isOpen={selectedType === "product"}
        onClose={handleCloseSubModal}
      />
    </>
  );
}
