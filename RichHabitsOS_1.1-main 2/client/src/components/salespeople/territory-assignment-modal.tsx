import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  Users,
  Target,
  Settings,
  Plus,
  Minus,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface TerritoryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salespersonId?: number;
  mode: "assign" | "bulk" | "territory_management";
  selectedSalespeopleIds?: number[];
}

interface Territory {
  id: string;
  name: string;
  states: string[];
  cities: string[];
  clientTypes: string[];
  salespeople: Array<{
    id: number;
    name: string;
    workload: number;
  }>;
  totalLeads: number;
  conversionRate: number;
}

interface Salesperson {
  id: number;
  userId: string;
  userName: string;
  territory: string | null;
  maxLeadsPerWeek: number;
  autoAssignLeads: boolean;
  workloadScore: number;
  preferredClientTypes: string[];
  skills: string[];
}

export function TerritoryAssignmentModal({
  isOpen,
  onClose,
  salespersonId,
  mode,
  selectedSalespeopleIds = []
}: TerritoryAssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTerritory, setSelectedTerritory] = useState("");
  const [customTerritory, setCustomTerritory] = useState("");
  const [maxLeadsPerWeek, setMaxLeadsPerWeek] = useState(50);
  const [autoAssignLeads, setAutoAssignLeads] = useState(true);
  const [preferredClientTypes, setPreferredClientTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch existing territories
  const { data: territories = [] } = useQuery<Territory[]>({
    queryKey: ["/api/territories"],
    enabled: isOpen,
  });

  // Fetch salesperson data if editing
  const { data: salesperson } = useQuery<Salesperson>({
    queryKey: ["/api/salespeople", salespersonId],
    enabled: isOpen && !!salespersonId && mode === "assign",
  });

  // Fetch salespeople for bulk operations
  const { data: salespeople = [] } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople"],
    enabled: isOpen && (mode === "bulk" || mode === "territory_management"),
  });

  // Initialize form data
  useEffect(() => {
    if (salesperson && mode === "assign") {
      setSelectedTerritory(salesperson.territory || "");
      setMaxLeadsPerWeek(salesperson.maxLeadsPerWeek);
      setAutoAssignLeads(salesperson.autoAssignLeads);
      setPreferredClientTypes(salesperson.preferredClientTypes || []);
      setSkills(salesperson.skills || []);
    }
  }, [salesperson, mode]);

  // Territory assignment mutation
  const assignTerritoryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === "assign") {
        return apiRequest("PUT", `/api/salespeople/${salespersonId}`, data);
      } else if (mode === "bulk") {
        return Promise.all(
          selectedSalespeopleIds.map(id =>
            apiRequest("PUT", `/api/salespeople/${id}`, data)
          )
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople"] });
      queryClient.invalidateQueries({ queryKey: ["/api/territories"] });
      toast({
        title: "Success",
        description: mode === "bulk" 
          ? "Territory assignments updated successfully"
          : "Territory assigned successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update territory assignment",
        variant: "destructive",
      });
    },
  });

  // Create territory mutation
  const createTerritoryMutation = useMutation({
    mutationFn: (territoryData: any) => 
      apiRequest("POST", "/api/territories", territoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/territories"] });
      toast({
        title: "Success",
        description: "Territory created successfully",
      });
    },
  });

  const handleSubmit = async () => {
    const territory = selectedTerritory === "custom" ? customTerritory : selectedTerritory;
    
    if (!territory) {
      toast({
        title: "Error",
        description: "Please select or enter a territory",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      territory,
      maxLeadsPerWeek,
      autoAssignLeads,
      preferredClientTypes,
      skills,
      workloadScore: 0, // Reset workload when reassigning
      lastAssignedAt: null,
    };

    await assignTerritoryMutation.mutateAsync(updateData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const toggleClientType = (clientType: string) => {
    setPreferredClientTypes(prev =>
      prev.includes(clientType)
        ? prev.filter(type => type !== clientType)
        : [...prev, clientType]
    );
  };

  const clientTypes = ["retail", "wholesale", "enterprise", "government"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-territory-assignment">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {mode === "assign" && "Assign Territory"}
            {mode === "bulk" && `Bulk Territory Assignment (${selectedSalespeopleIds.length} selected)`}
            {mode === "territory_management" && "Territory Management"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Territory Selection */}
          <div className="space-y-3">
            <Label>Territory</Label>
            <Select value={selectedTerritory} onValueChange={setSelectedTerritory} data-testid="select-territory">
              <SelectTrigger>
                <SelectValue placeholder="Select a territory..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Create Custom Territory</SelectItem>
                {territories.map((territory) => (
                  <SelectItem key={territory.id} value={territory.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{territory.name}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {territory.salespeople.length} salespeople
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {territory.totalLeads} leads
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTerritory === "custom" && (
              <Input
                placeholder="Enter territory name..."
                value={customTerritory}
                onChange={(e) => setCustomTerritory(e.target.value)}
                data-testid="input-custom-territory"
              />
            )}
          </div>

          {/* Territory Analytics */}
          {selectedTerritory && selectedTerritory !== "custom" && (
            <div className="p-4 bg-muted/20 rounded-lg">
              {(() => {
                const territory = territories.find(t => t.name === selectedTerritory);
                if (!territory) return null;
                
                return (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Territory Analytics
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Leads</p>
                        <p className="font-semibold">{territory.totalLeads}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversion Rate</p>
                        <p className="font-semibold">{territory.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Salespeople</p>
                        <p className="font-semibold">{territory.salespeople.length}</p>
                      </div>
                    </div>
                    {territory.salespeople.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">Current Salespeople:</p>
                        <div className="flex flex-wrap gap-2">
                          {territory.salespeople.map(sp => (
                            <Badge key={sp.id} variant="secondary">
                              {sp.name} (Load: {sp.workload})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Assignment Settings */}
          {mode !== "territory_management" && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Assignment Settings
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Leads Per Week</Label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={maxLeadsPerWeek}
                    onChange={(e) => setMaxLeadsPerWeek(parseInt(e.target.value))}
                    data-testid="input-max-leads"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Auto-assign Leads
                    <Switch
                      checked={autoAssignLeads}
                      onCheckedChange={setAutoAssignLeads}
                      data-testid="switch-auto-assign"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically assign new leads based on workload and territory
                  </p>
                </div>
              </div>

              {/* Preferred Client Types */}
              <div className="space-y-2">
                <Label>Preferred Client Types</Label>
                <div className="flex flex-wrap gap-2">
                  {clientTypes.map(type => (
                    <Badge
                      key={type}
                      variant={preferredClientTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleClientType(type)}
                      data-testid={`badge-client-type-${type}`}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills & Specializations</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    data-testid="input-new-skill"
                  />
                  <Button type="button" onClick={addSkill} size="sm" data-testid="button-add-skill">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer">
                      {skill}
                      <Minus 
                        className="w-3 h-3 ml-1" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Assignment Notes</Label>
                <Textarea
                  placeholder="Add notes about this territory assignment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-assignment-notes"
                />
              </div>
            </div>
          )}

          {/* Warning for bulk operations */}
          {mode === "bulk" && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium">Bulk Assignment Warning</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This will update territory assignments for {selectedSalespeopleIds.length} salespeople.
                Their workload scores will be reset.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={assignTerritoryMutation.isPending}
              data-testid="button-assign-territory"
            >
              {assignTerritoryMutation.isPending ? "Assigning..." : "Assign Territory"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}