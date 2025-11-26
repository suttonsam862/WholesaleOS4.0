import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type Role = {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
};

type CreateRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingRoles: Role[];
};

export function CreateRoleModal({ isOpen, onClose, existingRoles }: CreateRoleModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [copyFromRoleId, setCopyFromRoleId] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        name: name.toLowerCase().replace(/\s+/g, "_"),
        displayName,
        description: description || null,
        isSystem: false,
      };

      if (copyFromRoleId && copyFromRoleId !== "none") {
        data.copyFromRoleId = parseInt(copyFromRoleId);
      }

      return await apiRequest("/api/permissions/roles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setDescription("");
    setCopyFromRoleId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a custom role template with specific permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              placeholder="e.g., customer_service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-role-name"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="e.g., Customer Service"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              data-testid="input-display-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyFrom">Copy Permissions From (Optional)</Label>
            <Select value={copyFromRoleId} onValueChange={setCopyFromRoleId}>
              <SelectTrigger data-testid="select-copy-from">
                <SelectValue placeholder="Select a role to copy from" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (start from scratch)</SelectItem>
                {existingRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Copy all permissions from an existing role as a starting point
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name || !displayName}
              data-testid="button-create-role"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
