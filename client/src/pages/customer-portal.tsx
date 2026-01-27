/**
 * Customer Portal Page
 * 
 * Comprehensive customer-facing dashboard with order status, 
 * items view, size distribution, tracking, design requests, 
 * documents, messaging, and payment capabilities.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  FileText,
  Upload,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ShoppingCart,
  Truck,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  Factory,
  Palette,
  MessageSquare,
  Download,
  Send,
  PenTool,
  Eye,
  Calendar,
  DollarSign,
  FileDown,
  Activity,
  Loader2,
  ClipboardList,
  Scissors,
  Printer,
  PackageCheck,
  CircleCheck,
  Circle,
  CircleDot,
  Ruler,
  Edit3,
} from "lucide-react";

const SIZE_COLUMNS = [
  { key: "yxs", label: "YXS" },
  { key: "ys", label: "YS" },
  { key: "ym", label: "YM" },
  { key: "yl", label: "YL" },
  { key: "xs", label: "XS" },
  { key: "s", label: "S" },
  { key: "m", label: "M" },
  { key: "l", label: "L" },
  { key: "xl", label: "XL" },
  { key: "xxl", label: "2XL" },
  { key: "xxxl", label: "3XL" },
  { key: "xxxxl", label: "4XL" },
];

// Order status stages for timeline
const ORDER_STAGES = [
  { key: 'new', label: 'Order Placed', icon: ShoppingCart },
  { key: 'waiting_sizes', label: 'Awaiting Sizes', icon: ClipboardList },
  { key: 'invoiced', label: 'Invoiced', icon: FileText },
  { key: 'production', label: 'In Production', icon: Factory },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

// Manufacturing status stages
const MANUFACTURING_STAGES = [
  { key: 'awaiting_admin_confirmation', label: 'Pending Confirmation', icon: Clock },
  { key: 'confirmed_awaiting_manufacturing', label: 'Confirmed', icon: Check },
  { key: 'cutting_sewing', label: 'Cutting & Sewing', icon: Scissors },
  { key: 'printing', label: 'Printing', icon: Printer },
  { key: 'final_packing_press', label: 'Final Packing', icon: PackageCheck },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'complete', label: 'Complete', icon: CircleCheck },
];

interface CustomerPortalData {
  order: {
    id: number;
    orderCode: string;
    orderName: string;
    status: string;
    estDelivery: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    shippingAddress: string | null;
    billToAddress: string | null;
    createdAt: string | null;
  };
  organization: {
    id: number;
    name: string;
    logoUrl: string | null;
    brandPrimaryColor: string | null;
    brandSecondaryColor: string | null;
    brandPantoneCode: string | null;
  } | null;
  lineItems: Array<{
    id: number;
    orderId: number;
    variantId: number;
    itemName: string | null;
    colorNotes: string | null;
    imageUrl: string | null;
    yxs: number;
    ys: number;
    ym: number;
    yl: number;
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
    xxxxl: number;
    qtyTotal: number | null;
    notes: string | null;
    productName: string | null;
    variantCode: string | null;
    variantColor: string | null;
  }>;
  trackingNumbers: Array<{
    id: number;
    trackingNumber: string;
    carrierCompany: string;
    createdAt: string;
  }>;
  manufacturing: {
    id: number;
    status: string;
    startDate: string | null;
    estCompletion: string | null;
    actualCompletion: string | null;
  } | null;
  designJobs: Array<{
    id: number;
    jobCode: string;
    status: string;
    brief: string | null;
    renditionUrls: string[] | null;
    finalDesignUrls: string[] | null;
    createdAt: string | null;
  }>;
  comments: Array<{
    id: number;
    message: string;
    isFromCustomer: boolean;
    createdAt: string;
  }>;
  documents: Array<{
    id: number;
    name: string;
    url: string;
    type: string;
    createdAt: string;
  }>;
  activityLog: Array<{
    id: number;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

interface OrderFormData {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress: {
    sameAsShipping: boolean;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  additionalInfo: {
    organizationName: string;
    purchaseOrderNumber: string;
    specialInstructions: string;
  };
  lineItemSizes: Record<number, {
    yxs: number; ys: number; ym: number; yl: number;
    xs: number; s: number; m: number; l: number;
    xl: number; xxl: number; xxxl: number; xxxxl: number;
    notes: string;
  }>;
}

export default function CustomerPortal() {
  const params = useParams();
  const orderId = parseInt(params.id || '0');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showFormWizard, setShowFormWizard] = useState(false);
  const [showSizeAdjustmentModal, setShowSizeAdjustmentModal] = useState(false);
  const [sizeAdjustmentRequest, setSizeAdjustmentRequest] = useState("");
  const [currentFormStep, setCurrentFormStep] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [designRequestBrief, setDesignRequestBrief] = useState("");
  
  const [formData, setFormData] = useState<OrderFormData>({
    contactInfo: { name: '', email: '', phone: '' },
    shippingAddress: { name: '', address: '', city: '', state: '', zip: '', country: 'USA' },
    billingAddress: { sameAsShipping: true, name: '', address: '', city: '', state: '', zip: '', country: 'USA' },
    additionalInfo: { organizationName: '', purchaseOrderNumber: '', specialInstructions: '' },
    lineItemSizes: {},
  });

  // Fetch comprehensive portal data
  const { data: portalData, isLoading, error, refetch } = useQuery<CustomerPortalData>({
    queryKey: ['/api/public/orders', orderId, 'portal'],
    queryFn: async () => {
      const response = await fetch(`/api/public/orders/${orderId}/portal-data`);
      if (!response.ok) throw new Error('Failed to fetch portal data');
      return response.json();
    },
    enabled: !!orderId,
  });

  // Fetch form submission status
  const { data: formStatus } = useQuery<{
    hasSubmission: boolean;
    submissionCount: number;
    latestStatus: string | null;
    lastSubmittedAt: string | null;
    contactName: string | null;
  }>({
    queryKey: ['/api/public/orders', orderId, 'form-status'],
    queryFn: async () => {
      const response = await fetch(`/api/public/orders/${orderId}/form-status`);
      if (!response.ok) throw new Error('Failed to fetch form status');
      return response.json();
    },
    enabled: !!orderId,
  });

  // Initialize form data from fetched data
  useEffect(() => {
    if (portalData?.lineItems) {
      const initialSizes: Record<number, any> = {};
      portalData.lineItems.forEach((item: any) => {
        initialSizes[item.id] = {
          yxs: item.yxs || 0,
          ys: item.ys || 0,
          ym: item.ym || 0,
          yl: item.yl || 0,
          xs: item.xs || 0,
          s: item.s || 0,
          m: item.m || 0,
          l: item.l || 0,
          xl: item.xl || 0,
          xxl: item.xxl || 0,
          xxxl: item.xxxl || 0,
          xxxxl: item.xxxxl || 0,
          notes: item.notes || '',
        };
      });
      setFormData(prev => ({ ...prev, lineItemSizes: initialSizes }));

      if (portalData.order) {
        setFormData(prev => ({
          ...prev,
          contactInfo: {
            name: portalData.order.contactName || '',
            email: portalData.order.contactEmail || '',
            phone: portalData.order.contactPhone || '',
          },
        }));
      }
    }
  }, [portalData]);

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await fetch(`/api/public/orders/${orderId}/submit-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactInfo: data.contactInfo,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          additionalInfo: data.additionalInfo,
          lineItemSizes: Object.entries(data.lineItemSizes).map(([id, sizes]) => ({
            lineItemId: parseInt(id),
            ...sizes,
          })),
        }),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Form Submitted!", description: "Your information has been saved successfully." });
      setShowFormWizard(false);
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit form. Please try again.", variant: "destructive" });
    },
  });

  // Submit comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/public/orders/${orderId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to submit comment');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Message Sent!", description: "We'll respond as soon as possible." });
      setNewComment("");
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    },
  });

  // Submit design request mutation
  const submitDesignRequestMutation = useMutation({
    mutationFn: async (brief: string) => {
      const response = await fetch(`/api/public/orders/${orderId}/design-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });
      if (!response.ok) throw new Error('Failed to submit design request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Design Request Submitted!", description: "Our design team will review your request." });
      setDesignRequestBrief("");
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit design request.", variant: "destructive" });
    },
  });

  // Submit size adjustment request mutation
  const submitSizeAdjustmentMutation = useMutation({
    mutationFn: async (requestMessage: string) => {
      const response = await fetch(`/api/public/orders/${orderId}/size-adjustment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestMessage }),
      });
      if (!response.ok) throw new Error('Failed to submit size adjustment request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Size Adjustment Request Submitted!", description: "Our team will review your request and get back to you." });
      setSizeAdjustmentRequest("");
      setShowSizeAdjustmentModal(false);
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit size adjustment request.", variant: "destructive" });
    },
  });

  // Helper functions
  const getTrackingUrl = (tracking: { trackingNumber: string; carrierCompany: string }) => {
    const carrierLower = (tracking.carrierCompany || '').toLowerCase();
    if (carrierLower.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking.trackingNumber)}`;
    if (carrierLower.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking.trackingNumber)}`;
    if (carrierLower.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking.trackingNumber)}`;
    return '';
  };

  const getOrderStageIndex = (status: string) => ORDER_STAGES.findIndex(s => s.key === status);
  const getManufacturingStageIndex = (status: string) => MANUFACTURING_STAGES.findIndex(s => s.key === status);

  const getTotalUnits = () => {
    if (!portalData?.lineItems) return 0;
    return portalData.lineItems.reduce((sum, item) => {
      return sum + SIZE_COLUMNS.reduce((s, col) => s + (item[col.key as keyof typeof item] as number || 0), 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
          <p className="text-white/60">The order you're looking for doesn't exist or has expired.</p>
        </motion.div>
      </div>
    );
  }

  const orderStageIndex = getOrderStageIndex(portalData.order.status);
  const manufacturingStageIndex = portalData.manufacturing ? getManufacturingStageIndex(portalData.manufacturing.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-carbon to-obsidian">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-neon-blue tracking-widest uppercase">Rich Habits Custom Order Portal</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {portalData.organization?.logoUrl && (
                <img src={portalData.organization.logoUrl} alt={portalData.organization.name} className="h-16 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{portalData.order.orderName || 'Your Order'}</h1>
                <p className="text-white/50">Order #{portalData.order.orderCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn(
                "px-3 py-1 text-sm font-medium",
                portalData.order.status === 'completed' && "border-green-500 text-green-400",
                portalData.order.status === 'shipped' && "border-blue-500 text-blue-400",
                portalData.order.status === 'production' && "border-amber-500 text-amber-400",
                !['completed', 'shipped', 'production'].includes(portalData.order.status) && "border-white/30 text-white/70"
              )}>
                {ORDER_STAGES.find(s => s.key === portalData.order.status)?.label || portalData.order.status}
              </Badge>
              <Button
                variant="outline"
                onClick={() => window.open(`/api/public/orders/${orderId}/pdf`, '_blank')}
                className="border-white/30 text-white/70 hover:bg-white/10"
                data-testid="button-download-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              {portalData.order.status === 'waiting_sizes' && (
                <Button onClick={() => setShowFormWizard(true)} className="bg-neon-blue hover:bg-neon-blue/90" data-testid="button-fill-form">
                  <PenTool className="w-4 h-4 mr-2" />
                  Fill Out Form
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tracking Banner - Show when shipped */}
        {portalData.trackingNumbers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50"
            data-testid="tracking-banner"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Your Order Has Shipped!</p>
                  <p className="text-sm text-white/60">{portalData.trackingNumbers.length} package(s)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {portalData.trackingNumbers.map((tracking) => {
                  const url = getTrackingUrl(tracking);
                  return url ? (
                    <a key={tracking.id} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                      data-testid={`track-link-${tracking.id}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Track {tracking.carrierCompany}
                    </a>
                  ) : (
                    <span key={tracking.id} className="text-sm text-white/60">{tracking.trackingNumber}</span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-overview">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-items">
              <Package className="w-4 h-4 mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger value="sizes" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-sizes">
              <ClipboardList className="w-4 h-4 mr-2" />
              Sizes
            </TabsTrigger>
            <TabsTrigger value="design" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-design">
              <Palette className="w-4 h-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-white rounded-lg" data-testid="tab-payment">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Order Progress Timeline */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-neon-blue" />
                  Order Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  {ORDER_STAGES.slice(0, -1).map((stage, index) => {
                    const Icon = stage.icon;
                    const isComplete = index < orderStageIndex;
                    const isCurrent = index === orderStageIndex;
                    return (
                      <div key={stage.key} className="flex items-center flex-1">
                        <div className={cn(
                          "flex flex-col items-center",
                          isComplete && "text-green-400",
                          isCurrent && "text-neon-blue",
                          !isComplete && !isCurrent && "text-white/30"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2",
                            isComplete && "bg-green-500/20 border-green-500",
                            isCurrent && "bg-neon-blue/20 border-neon-blue",
                            !isComplete && !isCurrent && "bg-white/5 border-white/20"
                          )}>
                            {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <span className="text-xs mt-2 text-center max-w-[80px]">{stage.label}</span>
                        </div>
                        {index < ORDER_STAGES.length - 2 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-2",
                            index < orderStageIndex ? "bg-green-500" : "bg-white/20"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Manufacturing Progress (if in production) */}
            {portalData.manufacturing && ['production', 'shipped'].includes(portalData.order.status) && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Factory className="w-5 h-5 text-amber-400" />
                    Manufacturing Progress
                  </CardTitle>
                  <CardDescription className="text-white/50">
                    {portalData.manufacturing.estCompletion && (
                      <>Estimated completion: {new Date(portalData.manufacturing.estCompletion).toLocaleDateString()}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {MANUFACTURING_STAGES.map((stage, index) => {
                      const Icon = stage.icon;
                      const isComplete = index < manufacturingStageIndex;
                      const isCurrent = index === manufacturingStageIndex;
                      return (
                        <div key={stage.key} className="flex items-center flex-1">
                          <div className={cn(
                            "flex flex-col items-center",
                            isComplete && "text-green-400",
                            isCurrent && "text-amber-400",
                            !isComplete && !isCurrent && "text-white/30"
                          )}>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border",
                              isComplete && "bg-green-500/20 border-green-500",
                              isCurrent && "bg-amber-500/20 border-amber-500",
                              !isComplete && !isCurrent && "bg-white/5 border-white/20"
                            )}>
                              {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className="text-[10px] mt-1 text-center max-w-[60px] hidden md:block">{stage.label}</span>
                          </div>
                          {index < MANUFACTURING_STAGES.length - 1 && (
                            <div className={cn(
                              "flex-1 h-0.5 mx-1",
                              index < manufacturingStageIndex ? "bg-green-500" : "bg-white/20"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <Package className="w-6 h-6 text-neon-blue mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{portalData.lineItems.length}</div>
                  <div className="text-xs text-white/50">Items</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <ClipboardList className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{getTotalUnits()}</div>
                  <div className="text-xs text-white/50">Total Units</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <Palette className="w-6 h-6 text-neon-purple mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{portalData.designJobs?.length || 0}</div>
                  <div className="text-xs text-white/50">Design Jobs</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <Truck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{portalData.trackingNumbers.length}</div>
                  <div className="text-xs text-white/50">Shipments</div>
                </CardContent>
              </Card>
            </div>

            {/* Form Status Card */}
            <Card className={cn(
              "border-2",
              formStatus?.hasSubmission 
                ? "bg-emerald-500/10 border-emerald-500/50" 
                : "bg-amber-500/10 border-amber-500/50"
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      formStatus?.hasSubmission ? "bg-emerald-500/20" : "bg-amber-500/20"
                    )}>
                      {formStatus?.hasSubmission ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <FileText className="w-7 h-7 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {formStatus?.hasSubmission ? "Order Form Completed" : "Complete Your Order Form"}
                      </h3>
                      {formStatus?.hasSubmission ? (
                        <div className="text-sm text-white/70">
                          <span>Submitted by </span>
                          <span className="font-medium text-white">{formStatus.contactName || 'Unknown'}</span>
                          {formStatus.lastSubmittedAt && (
                            <span> on {new Date(formStatus.lastSubmittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-white/60">
                          Please fill out your contact info, shipping address, and size quantities
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formStatus?.hasSubmission ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowFormWizard(true)}
                          className="border-white/30 text-white/70 hover:bg-white/10"
                          data-testid="button-update-form"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Update Form
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowSizeAdjustmentModal(true)}
                          className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                          data-testid="button-request-size-adjustment"
                        >
                          <Ruler className="w-4 h-4 mr-2" />
                          Request Size Adjustment
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setShowFormWizard(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                        data-testid="button-fill-form-card"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Fill Out Form
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Info & Contact */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/50">Order Code</span>
                    <span className="text-white font-medium">{portalData.order.orderCode}</span>
                  </div>
                  {portalData.order.estDelivery && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Est. Delivery</span>
                      <span className="text-white">{new Date(portalData.order.estDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  {portalData.organization && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Organization</span>
                      <span className="text-white">{portalData.organization.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Contact & Shipping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {portalData.order.contactName && (
                    <div className="flex items-center gap-2 text-white/80">
                      <User className="w-4 h-4 text-white/50" />
                      {portalData.order.contactName}
                    </div>
                  )}
                  {portalData.order.contactEmail && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="w-4 h-4 text-white/50" />
                      {portalData.order.contactEmail}
                    </div>
                  )}
                  {portalData.order.shippingAddress && (
                    <div className="flex items-start gap-2 text-white/80">
                      <MapPin className="w-4 h-4 text-white/50 mt-0.5" />
                      <span className="text-sm">{portalData.order.shippingAddress}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Order Items</CardTitle>
                <CardDescription className="text-white/50">
                  View all items in your order with details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portalData.lineItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10" data-testid={`item-card-${item.id}`}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName || 'Product'} className="w-24 h-24 object-cover rounded-lg" />
                      ) : (
                        <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.itemName || item.productName || 'Unnamed Item'}</h3>
                        {item.variantCode && <p className="text-sm text-white/50">SKU: {item.variantCode}</p>}
                        {item.variantColor && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: item.variantColor }} />
                            <span className="text-sm text-white/70">{item.variantColor}</span>
                          </div>
                        )}
                        {item.colorNotes && (
                          <div className="mt-2 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-neon-purple" />
                            <span className="text-sm text-white/70">{item.colorNotes}</span>
                          </div>
                        )}
                        {item.qtyTotal && (
                          <Badge variant="outline" className="mt-2 border-white/20 text-white/70">
                            {item.qtyTotal} units
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pantone/Brand Colors */}
            {portalData.organization?.brandPantoneCode && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-neon-purple" />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {portalData.organization.brandPrimaryColor && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-white/20" style={{ backgroundColor: portalData.organization.brandPrimaryColor }} />
                        <div>
                          <div className="text-sm text-white/50">Primary</div>
                          <div className="text-white font-mono text-sm">{portalData.organization.brandPrimaryColor}</div>
                        </div>
                      </div>
                    )}
                    {portalData.organization.brandSecondaryColor && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-white/20" style={{ backgroundColor: portalData.organization.brandSecondaryColor }} />
                        <div>
                          <div className="text-sm text-white/50">Secondary</div>
                          <div className="text-white font-mono text-sm">{portalData.organization.brandSecondaryColor}</div>
                        </div>
                      </div>
                    )}
                    {portalData.organization.brandPantoneCode && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">PMS</span>
                        </div>
                        <div>
                          <div className="text-sm text-white/50">Pantone</div>
                          <div className="text-white font-mono text-sm">{portalData.organization.brandPantoneCode}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sizes Tab */}
          <TabsContent value="sizes" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Size Distribution</CardTitle>
                  <CardDescription className="text-white/50">View submitted sizes for all items</CardDescription>
                </div>
                {portalData.order.status === 'waiting_sizes' && (
                  <Button onClick={() => setShowFormWizard(true)} variant="outline" className="border-neon-blue text-neon-blue hover:bg-neon-blue/10">
                    <PenTool className="w-4 h-4 mr-2" />
                    Update Sizes
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-white/50 font-medium">Item</th>
                        {SIZE_COLUMNS.map(col => (
                          <th key={col.key} className="text-center p-2 text-white/50 font-medium text-xs">{col.label}</th>
                        ))}
                        <th className="text-center p-3 text-white/50 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portalData.lineItems.map((item) => {
                        const total = SIZE_COLUMNS.reduce((sum, col) => sum + (item[col.key as keyof typeof item] as number || 0), 0);
                        return (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`size-row-${item.id}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                )}
                                <span className="text-white text-sm">{item.itemName || item.productName || 'Item'}</span>
                              </div>
                            </td>
                            {SIZE_COLUMNS.map(col => {
                              const value = item[col.key as keyof typeof item] as number || 0;
                              return (
                                <td key={col.key} className="text-center p-2">
                                  <span className={cn("text-sm", value > 0 ? "text-white" : "text-white/20")}>
                                    {value}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="text-center p-3">
                              <Badge variant="outline" className="border-neon-cyan text-neon-cyan">{total}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/20">
                        <td className="p-3 text-white font-semibold">Totals</td>
                        {SIZE_COLUMNS.map(col => {
                          const total = portalData.lineItems.reduce((sum, item) => sum + (item[col.key as keyof typeof item] as number || 0), 0);
                          return (
                            <td key={col.key} className="text-center p-2">
                              <span className={cn("text-sm font-medium", total > 0 ? "text-neon-blue" : "text-white/20")}>
                                {total}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center p-3">
                          <Badge className="bg-neon-blue text-white">{getTotalUnits()}</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            {/* Submit Design Request */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-neon-purple" />
                  Request New Design
                </CardTitle>
                <CardDescription className="text-white/50">
                  Submit a design request for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={designRequestBrief}
                    onChange={(e) => setDesignRequestBrief(e.target.value)}
                    placeholder="Describe what you need... Include details about colors, style, placement, and any specific requirements."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px]"
                    data-testid="input-design-request"
                  />
                  <Button
                    onClick={() => submitDesignRequestMutation.mutate(designRequestBrief)}
                    disabled={!designRequestBrief.trim() || submitDesignRequestMutation.isPending}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                    data-testid="button-submit-design-request"
                  >
                    {submitDesignRequestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Design Jobs */}
            {portalData.designJobs && portalData.designJobs.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Design Work</CardTitle>
                  <CardDescription className="text-white/50">Current design jobs for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portalData.designJobs.map((job) => (
                      <div key={job.id} className="p-4 rounded-lg bg-white/5 border border-white/10" data-testid={`design-job-${job.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{job.jobCode}</span>
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                job.status === 'completed' && "border-green-500 text-green-400",
                                job.status === 'approved' && "border-green-500 text-green-400",
                                job.status === 'in_progress' && "border-amber-500 text-amber-400",
                                !['completed', 'approved', 'in_progress'].includes(job.status) && "border-white/30 text-white/70"
                              )}>
                                {job.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            {job.brief && <p className="text-sm text-white/60 mt-1">{job.brief}</p>}
                          </div>
                        </div>
                        {/* Show design previews */}
                        {(job.finalDesignUrls?.length || job.renditionUrls?.length) ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(job.finalDesignUrls || job.renditionUrls || []).slice(0, 4).map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={url} alt={`Design ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/20 hover:border-neon-purple transition-colors" />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-neon-blue" />
                  Messages
                </CardTitle>
                <CardDescription className="text-white/50">
                  Leave a message or question about your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Message History */}
                {portalData.comments && portalData.comments.length > 0 && (
                  <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                    {portalData.comments.map((comment) => (
                      <div key={comment.id} className={cn(
                        "p-3 rounded-lg",
                        comment.isFromCustomer ? "bg-neon-blue/10 border border-neon-blue/30 ml-8" : "bg-white/5 border border-white/10 mr-8"
                      )} data-testid={`comment-${comment.id}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/50">
                            {comment.isFromCustomer ? 'You' : 'Team'}
                          </span>
                          <span className="text-xs text-white/30">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Message Form */}
                <div className="space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message or question..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                    data-testid="input-new-comment"
                  />
                  <Button
                    onClick={() => submitCommentMutation.mutate(newComment)}
                    disabled={!newComment.trim() || submitCommentMutation.isPending}
                    className="bg-neon-blue hover:bg-neon-blue/90"
                    data-testid="button-send-message"
                  >
                    {submitCommentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-10 h-10 text-neon-purple" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3" data-testid="text-payment-coming-soon">
                    Payment Portal Coming Soon
                  </h3>
                  <p className="text-white/60 max-w-md mx-auto mb-6">
                    We're working on integrating a seamless payment experience. Soon you'll be able to view invoices and make payments directly from this portal.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">QuickBooks integration in progress</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Wizard Modal */}
        <AnimatePresence>
          {showFormWizard && (
            <FormWizardModal
              formData={formData}
              setFormData={setFormData}
              lineItems={portalData.lineItems}
              onClose={() => setShowFormWizard(false)}
              onSubmit={() => submitFormMutation.mutate(formData)}
              isSubmitting={submitFormMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Size Adjustment Request Modal */}
        <AnimatePresence>
          {showSizeAdjustmentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSizeAdjustmentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-obsidian border border-white/10 rounded-xl w-full max-w-lg"
              >
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-neon-purple" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Request Size Adjustment</h2>
                      <p className="text-sm text-white/50">Describe the size changes you need</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Textarea
                    value={sizeAdjustmentRequest}
                    onChange={(e) => setSizeAdjustmentRequest(e.target.value)}
                    placeholder="Please describe the size adjustments you need. For example: 'I need to change 2 Medium to Large for item Jersey #123' or 'Please add 3 more XL sizes to my order'"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[150px]"
                    data-testid="input-size-adjustment-request"
                  />
                  <p className="text-xs text-white/40 mt-2">
                    Note: Size adjustments are subject to availability and may affect your order timeline.
                  </p>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSizeAdjustmentModal(false)}
                    className="text-white/70 hover:text-white"
                    data-testid="button-cancel-size-adjustment"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => submitSizeAdjustmentMutation.mutate(sizeAdjustmentRequest)}
                    disabled={!sizeAdjustmentRequest.trim() || submitSizeAdjustmentMutation.isPending}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                    data-testid="button-submit-size-adjustment"
                  >
                    {submitSizeAdjustmentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Request
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Form Wizard Modal Component
function FormWizardModal({
  formData,
  setFormData,
  lineItems,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  formData: OrderFormData;
  setFormData: React.Dispatch<React.SetStateAction<OrderFormData>>;
  lineItems: any[];
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [step, setStep] = useState(0);
  const steps = ['Contact', 'Sizes', 'Shipping', 'Review'];

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, [field]: value } }));
  };

  const updateShipping = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, shippingAddress: { ...prev.shippingAddress, [field]: value } }));
  };

  const updateSize = (itemId: number, size: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      lineItemSizes: {
        ...prev.lineItemSizes,
        [itemId]: { ...prev.lineItemSizes[itemId], [size]: value },
      },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-obsidian border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Complete Your Order</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          {/* Progress */}
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className={cn(
                "flex-1 h-1 rounded-full",
                i <= step ? "bg-neon-blue" : "bg-white/20"
              )} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <span key={s} className={cn("text-xs", i === step ? "text-white" : "text-white/40")}>{s}</span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-white/70">Full Name *</Label>
                <Input value={formData.contactInfo.name} onChange={e => updateContact('name', e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-contact-name" />
              </div>
              <div>
                <Label className="text-white/70">Email *</Label>
                <Input value={formData.contactInfo.email} onChange={e => updateContact('email', e.target.value)}
                  type="email" className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-contact-email" />
              </div>
              <div>
                <Label className="text-white/70">Phone</Label>
                <Input value={formData.contactInfo.phone} onChange={e => updateContact('phone', e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-contact-phone" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {lineItems.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div>
                      <div className="text-white font-medium">{item.itemName || item.productName || 'Item'}</div>
                      {item.variantColor && <div className="text-sm text-white/50">{item.variantColor}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZE_COLUMNS.map(col => (
                      <div key={col.key} className="text-center">
                        <label className="text-xs text-white/50 block mb-1">{col.label}</label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.lineItemSizes[item.id]?.[col.key as keyof typeof formData.lineItemSizes[number]] || 0}
                          onChange={e => updateSize(item.id, col.key, parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/10 text-white text-center p-1 h-8 text-sm"
                          data-testid={`input-size-${item.id}-${col.key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-white/70">Recipient Name</Label>
                <Input value={formData.shippingAddress.name} onChange={e => updateShipping('name', e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-name" />
              </div>
              <div>
                <Label className="text-white/70">Street Address *</Label>
                <Input value={formData.shippingAddress.address} onChange={e => updateShipping('address', e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">City *</Label>
                  <Input value={formData.shippingAddress.city} onChange={e => updateShipping('city', e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-city" />
                </div>
                <div>
                  <Label className="text-white/70">State *</Label>
                  <Input value={formData.shippingAddress.state} onChange={e => updateShipping('state', e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-state" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">ZIP Code *</Label>
                  <Input value={formData.shippingAddress.zip} onChange={e => updateShipping('zip', e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-zip" />
                </div>
                <div>
                  <Label className="text-white/70">Country</Label>
                  <Input value={formData.shippingAddress.country} onChange={e => updateShipping('country', e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white" data-testid="input-shipping-country" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-white font-medium mb-2">Contact</h3>
                <div className="text-sm text-white/70">
                  <div>{formData.contactInfo.name}</div>
                  <div>{formData.contactInfo.email}</div>
                  {formData.contactInfo.phone && <div>{formData.contactInfo.phone}</div>}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-white font-medium mb-2">Shipping Address</h3>
                <div className="text-sm text-white/70">
                  {formData.shippingAddress.name && <div>{formData.shippingAddress.name}</div>}
                  <div>{formData.shippingAddress.address}</div>
                  <div>{formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zip}</div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="text-white font-medium mb-2">Sizes Summary</h3>
                <div className="text-sm text-white/70">
                  {lineItems.map(item => {
                    const sizes = formData.lineItemSizes[item.id] || {};
                    const total = SIZE_COLUMNS.reduce((sum, col) => sum + (Number(sizes[col.key as keyof typeof sizes]) || 0), 0);
                    return total > 0 ? (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>{item.itemName || item.productName || 'Item'}</span>
                        <span className="text-neon-cyan">{total} units</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-between">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose}
            className="text-white/70 hover:text-white" data-testid="button-wizard-back">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-neon-blue hover:bg-neon-blue/90" data-testid="button-wizard-next">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-neon-blue to-neon-purple" data-testid="button-wizard-submit">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
