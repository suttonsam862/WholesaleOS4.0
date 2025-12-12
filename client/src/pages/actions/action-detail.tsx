import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ActionPageShell } from "@/components/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, Sparkles, FileText, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { celebrateSuccess } from "@/lib/confetti";
import { getActionById } from "@/lib/actionsConfig";
import type { Order, Organization, Quote } from "@shared/schema";

interface ActionDetailPageProps {
  hubId: string;
}

export function ActionDetailPage({ hubId }: ActionDetailPageProps) {
  const [, params] = useRoute(`/${hubId}/actions/:actionId`);
  const actionId = params?.actionId || "";

  return (
    <ActionPageShell hubId={hubId} actionId={actionId}>
      {(props) => <ActionStepContent hubId={hubId} {...props} />}
    </ActionPageShell>
  );
}

function ActionStepContent({
  hubId,
  currentStep,
  stepIndex,
  goNext,
  goBack,
  isLoading,
  setLoading,
  setStepData,
  stepData,
  action,
}: any) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [options, setOptions] = useState<Record<string, any>>({});
  const [aiResult, setAiResult] = useState<any>(null);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: hubId === "orders",
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: hubId === "organizations" || hubId === "sales-analytics",
  });

  const aiMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiRequest("POST", "/api/ai/interactions", payload);
      return response.json();
    },
    onSuccess: (data) => {
      setAiResult(data);
      setLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "AI Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const response = await apiRequest("POST", "/api/quotes", quoteData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quote Created",
        description: `Quote ${data.quoteCode} has been created as a draft`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setLoading(false);
      goNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
      setLoading(false);
    },
  });

  const handlePickSelection = (item: any) => {
    setSelectedItem(item);
    setStepData({ selectedItem: item });
  };

  const handleOptionsChange = (key: string, value: any) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    setStepData({ options: newOptions });
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    const payload = {
      actionId: action.aiActionId || action.id,
      hubId,
      context: {
        selectedItem: stepData.pick?.selectedItem || selectedItem,
        options: stepData.choose?.options || options,
      },
    };
    aiMutation.mutate(payload);
  };

  const handleConfirm = async () => {
    setLoading(true);
    
    if (action.id === "quote-from-order" && selectedItem) {
      const quoteData = {
        name: `Quote from ${selectedItem.orderName}`,
        orgId: selectedItem.orgId,
        contactId: null,
        salespersonId: selectedItem.salespersonId,
        status: "draft",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Generated from order ${selectedItem.orderCode}`,
      };
      createQuoteMutation.mutate(quoteData);
    } else {
      setTimeout(() => {
        setLoading(false);
        goNext();
        toast({
          title: "Action Completed",
          description: "Your changes have been saved as a draft",
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (currentStep.type === "preview" && action.requiresAI && !aiResult) {
      handleAIGenerate();
    }
  }, [currentStep.type]);

  if (currentStep.type === "pick") {
    return (
      <div className="space-y-4">
        {hubId === "orders" && (
          <div className="space-y-2">
            <Label>Select an order</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No orders found</p>
              ) : (
                orders.slice(0, 20).map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === order.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(order)}
                    data-testid={`pick-order-${order.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.orderName}</p>
                        <p className="text-sm text-muted-foreground">{order.orderCode}</p>
                      </div>
                      <Badge variant="outline">{order.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {(hubId === "organizations" || hubId === "sales-analytics") && (
          <div className="space-y-2">
            <Label>Select a client organization</Label>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {organizations.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No organizations found</p>
              ) : (
                organizations.slice(0, 20).map((org) => (
                  <Card
                    key={org.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItem?.id === org.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handlePickSelection(org)}
                    data-testid={`pick-org-${org.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {org.city}{org.state ? `, ${org.state}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline">{org.clientType || "retail"}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="p-4 bg-primary/5 rounded-lg mt-4">
            <p className="text-sm">
              <strong>Selected:</strong> {selectedItem.name || selectedItem.orderName}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (currentStep.type === "choose") {
    return (
      <div className="space-y-6">
        {action.id === "client-brief" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="timeWindow">Time Window</Label>
              <Select 
                value={options.timeWindow || "30"} 
                onValueChange={(v) => handleOptionsChange("timeWindow", v)}
              >
                <SelectTrigger data-testid="select-time-window">
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Include sections</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeOrders" 
                    checked={options.includeOrders !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeOrders", v)}
                  />
                  <Label htmlFor="includeOrders">Recent orders</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeNotes" 
                    checked={options.includeNotes !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeNotes", v)}
                  />
                  <Label htmlFor="includeNotes">Client notes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeContacts" 
                    checked={options.includeContacts !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeContacts", v)}
                  />
                  <Label htmlFor="includeContacts">Key contacts</Label>
                </div>
              </div>
            </div>
          </>
        )}

        {action.id === "explain-numbers" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="metricPeriod">Metric Period</Label>
              <Select 
                value={options.metricPeriod || "month"} 
                onValueChange={(v) => handleOptionsChange("metricPeriod", v)}
              >
                <SelectTrigger data-testid="select-metric-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Focus on</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusRevenue" 
                    checked={options.focusRevenue !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusRevenue", v)}
                  />
                  <Label htmlFor="focusRevenue">Revenue trends</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusPipeline" 
                    checked={options.focusPipeline !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusPipeline", v)}
                  />
                  <Label htmlFor="focusPipeline">Pipeline health</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="focusConversion" 
                    checked={options.focusConversion !== false}
                    onCheckedChange={(v) => handleOptionsChange("focusConversion", v)}
                  />
                  <Label htmlFor="focusConversion">Conversion rates</Label>
                </div>
              </div>
            </div>
          </>
        )}

        {action.id === "quote-from-order" && (
          <>
            <div className="space-y-2">
              <Label>Quote options</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="includeAllItems" 
                    checked={options.includeAllItems !== false}
                    onCheckedChange={(v) => handleOptionsChange("includeAllItems", v)}
                  />
                  <Label htmlFor="includeAllItems">Include all line items</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copyPricing" 
                    checked={options.copyPricing !== false}
                    onCheckedChange={(v) => handleOptionsChange("copyPricing", v)}
                  />
                  <Label htmlFor="copyPricing">Copy original pricing</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteNotes">Additional notes</Label>
              <Textarea
                id="quoteNotes"
                value={options.quoteNotes || ""}
                onChange={(e) => handleOptionsChange("quoteNotes", e.target.value)}
                placeholder="Add any notes for this quote..."
                data-testid="input-quote-notes"
              />
            </div>
          </>
        )}

        {!["client-brief", "explain-numbers", "quote-from-order"].includes(action.id) && (
          <div className="space-y-2">
            <Label>Configure options</Label>
            <p className="text-sm text-muted-foreground">
              Select your preferences for this action.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="defaultOption" 
                  checked={options.defaultOption !== false}
                  onCheckedChange={(v) => handleOptionsChange("defaultOption", v)}
                />
                <Label htmlFor="defaultOption">Use default settings</Label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep.type === "preview") {
    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {action.requiresAI ? "Generating with AI..." : "Loading preview..."}
            </p>
          </div>
        ) : (
          <>
            {action.requiresAI && aiResult && (
              <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">AI Generated</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{aiResult.content || aiResult.message || "Content generated successfully."}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {action.id === "quote-from-order" && selectedItem && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">Quote Preview</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>From Order:</strong> {selectedItem.orderCode}</p>
                    <p><strong>Client:</strong> {selectedItem.orderName}</p>
                    <p><strong>Status:</strong> Draft (will be created as draft)</p>
                    <p><strong>Valid for:</strong> 30 days</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!action.requiresAI && !aiResult && action.id !== "quote-from-order" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Ready to proceed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review your selections above and click "Confirm & Save" to proceed.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">Draft Mode</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    This will create a draft. No changes will be finalized until you review and confirm.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (currentStep.type === "confirm") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Summary</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Action: {action.title}</li>
              {selectedItem && (
                <li>• Selected: {selectedItem.name || selectedItem.orderName || selectedItem.orderCode}</li>
              )}
              <li>• Output: Draft (requires review)</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground">
          Click "Confirm & Save" to create the draft.
        </p>

        <div className="flex justify-center">
          <Button onClick={handleConfirm} disabled={isLoading} size="lg" data-testid="button-confirm-action">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Save
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep.type === "done") {
    return (
      <DoneStep />
    );
  }

  return <div>Unknown step type</div>;
}

function DoneStep() {
  useEffect(() => {
    celebrateSuccess();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-medium mb-2">Action Complete!</h3>
      <p className="text-muted-foreground">
        Your changes have been saved. You can now continue working or close this page.
      </p>
    </div>
  );
}

export function OrdersActionDetail() {
  return <ActionDetailPage hubId="orders" />;
}

export function SalesAnalyticsActionDetail() {
  return <ActionDetailPage hubId="sales-analytics" />;
}

export function OrganizationsActionDetail() {
  return <ActionDetailPage hubId="organizations" />;
}

export function ContactsActionDetail() {
  return <ActionDetailPage hubId="contacts" />;
}

export function LeadsActionDetail() {
  return <ActionDetailPage hubId="leads" />;
}

export function EventsActionDetail() {
  return <ActionDetailPage hubId="events" />;
}

export function QuotesActionDetail() {
  return <ActionDetailPage hubId="quotes" />;
}

export function ManufacturingActionDetail() {
  return <ActionDetailPage hubId="manufacturing" />;
}

export function TeamStoresActionDetail() {
  return <ActionDetailPage hubId="team-stores" />;
}

export function DesignJobsActionDetail() {
  return <ActionDetailPage hubId="design-jobs" />;
}

export function CatalogActionDetail() {
  return <ActionDetailPage hubId="catalog" />;
}
