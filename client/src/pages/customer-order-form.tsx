/**
 * Customer Order Form Page
 * 
 * A beautiful, animated multi-step wizard for customers to fill out
 * their order details, contact information, shipping, and size selections.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'contact', label: 'Contact', icon: User },
  { id: 'sizes', label: 'Sizes', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'review', label: 'Review', icon: CheckCircle2 },
];

interface PublicOrderData {
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
  };
  organization: {
    id: number;
    name: string;
    logoUrl: string | null;
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
  trackingNumbers?: Array<{
    id: number;
    trackingNumber: string;
    carrierCompany: string;
    createdAt: string;
  }>;
}

export default function CustomerOrderForm() {
  const params = useParams();
  const orderId = parseInt(params.id || '0');
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<OrderFormData>({
    contactInfo: { name: '', email: '', phone: '' },
    shippingAddress: { name: '', address: '', city: '', state: '', zip: '', country: 'USA' },
    billingAddress: { sameAsShipping: true, name: '', address: '', city: '', state: '', zip: '', country: 'USA' },
    additionalInfo: { organizationName: '', purchaseOrderNumber: '', specialInstructions: '' },
    lineItemSizes: {},
  });

  // Fetch order data from public API
  const { data: orderData, isLoading, error } = useQuery<PublicOrderData>({
    queryKey: ['/api/public/orders', orderId, 'form-data'],
    enabled: !!orderId,
  });

  // Helper to parse shipping address string into structured fields
  const parseShippingAddress = (addressStr: string | null) => {
    if (!addressStr) return null;
    const lines = addressStr.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    
    // Expected formats:
    // 4 lines: Recipient name, Street address, City/State/ZIP, Country
    // 3 lines: Street address, City/State/ZIP, Country (no name)
    // 2 lines: Street address, City/State/ZIP (no name, no country)
    // 1 line: Just the street address
    let name = '', address = '', city = '', state = '', zip = '', country = 'USA';
    
    // Helper to parse "City, State ZIP" format
    const parseCityStateZip = (str: string) => {
      const match = str.match(/^(.+?),?\s*([A-Z]{2})?\s*(\d{5}(?:-\d{4})?)?$/i);
      if (match) {
        return {
          city: match[1]?.trim() || '',
          state: match[2] || '',
          zip: match[3] || ''
        };
      }
      return { city: str, state: '', zip: '' };
    };
    
    if (lines.length >= 4) {
      // Full format with name: Name, Address, City/State/ZIP, Country
      name = lines[0];
      address = lines[1];
      const parsed = parseCityStateZip(lines[2]);
      city = parsed.city;
      state = parsed.state;
      zip = parsed.zip;
      country = lines[3] || 'USA';
    } else if (lines.length === 3) {
      // No name: Address, City/State/ZIP, Country
      address = lines[0];
      const parsed = parseCityStateZip(lines[1]);
      city = parsed.city;
      state = parsed.state;
      zip = parsed.zip;
      country = lines[2] || 'USA';
    } else if (lines.length === 2) {
      // Just address and city/state
      address = lines[0];
      const parsed = parseCityStateZip(lines[1]);
      city = parsed.city;
      state = parsed.state;
      zip = parsed.zip;
    } else {
      // Single line - just use as address
      address = lines[0];
    }
    
    return { name, address, city, state, zip, country };
  };

  // Initialize line item sizes from fetched data
  useEffect(() => {
    if (orderData?.lineItems) {
      const initialSizes: Record<number, any> = {};
      orderData.lineItems.forEach((item: any) => {
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
          notes: '',
        };
      });
      setFormData(prev => ({ ...prev, lineItemSizes: initialSizes }));

      // Pre-fill contact info and shipping address if available
      if (orderData.order) {
        const parsedShipping = parseShippingAddress(orderData.order.shippingAddress);
        const parsedBilling = parseShippingAddress(orderData.order.billToAddress);
        
        setFormData(prev => ({
          ...prev,
          contactInfo: {
            name: orderData.order.contactName || '',
            email: orderData.order.contactEmail || '',
            phone: orderData.order.contactPhone || '',
          },
          shippingAddress: parsedShipping || prev.shippingAddress,
          billingAddress: parsedBilling 
            ? { ...parsedBilling, sameAsShipping: false }
            : prev.billingAddress,
        }));
      }
    }
  }, [orderData]);

  // Submit form
  const submitMutation = useMutation({
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
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Form Submitted!",
        description: "Thank you for completing your order form. We'll be in touch soon.",
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitMutation.mutateAsync(formData);
    setIsSubmitting(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Validation helpers
  const isContactValid = formData.contactInfo.name && formData.contactInfo.email;
  const isShippingValid = formData.shippingAddress.address && formData.shippingAddress.city;

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return isContactValid; // Contact
      case 2: return true; // Sizes (optional quantities)
      case 3: return isShippingValid; // Shipping
      case 4: return true; // Review
      default: return true;
    }
  }, [currentStep, isContactValid, isShippingValid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
          <p className="text-white/60">
            The order form you're looking for doesn't exist or has expired.
            Please contact us if you believe this is an error.
          </p>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-green-500/30 to-neon-cyan/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50"
          >
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-3">Thank You!</h1>
          <p className="text-white/60 text-lg mb-6">
            Your order form has been submitted successfully.
            Our team will review your information and be in touch shortly.
          </p>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/50">Order Reference</p>
            <p className="text-xl font-bold text-neon-blue">{orderData.order.orderCode}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {orderData.organization?.logoUrl && (
            <img 
              src={orderData.organization.logoUrl} 
              alt={orderData.organization.name} 
              className="h-16 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-1">
            {orderData.order.orderName || 'Order Form'}
          </h1>
          <p className="text-white/50">
            Order #{orderData.order.orderCode}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isComplete || isActive ? 1 : 0.4,
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                      isActive && "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50",
                      isComplete && "bg-green-500/20 border-green-500/40",
                      !isActive && !isComplete && "bg-white/5 border-white/10"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive && "text-neon-blue",
                      isComplete && "text-green-400",
                      !isActive && !isComplete && "text-white/40"
                    )} />
                    <span className={cn(
                      "text-sm font-medium hidden sm:block",
                      isActive && "text-white",
                      isComplete && "text-green-400",
                      !isActive && !isComplete && "text-white/40"
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className={cn(
                      "w-4 h-4 mx-1",
                      isComplete ? "text-green-400/50" : "text-white/20"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          className="relative"
          initial={false}
        >
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <WelcomeStep
                key="welcome"
                orderData={orderData}
                onNext={nextStep}
              />
            )}
            {currentStep === 1 && (
              <ContactStep
                key="contact"
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 2 && (
              <SizesStep
                key="sizes"
                lineItems={orderData.lineItems}
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 3 && (
              <ShippingStep
                key="shipping"
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep
                key="review"
                orderData={orderData}
                formData={formData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mt-8 pt-6 border-t border-white/10"
        >
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              currentStep === 0
                ? "opacity-0 pointer-events-none"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            )}
            data-testid="button-prev-step"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < STEPS.length - 1 && (
            <button
              onClick={nextStep}
              disabled={!canProceed}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg border transition-all font-medium",
                canProceed
                  ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50 text-white hover:from-neon-blue/30 hover:to-neon-purple/30"
                  : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
              )}
              data-testid="button-next-step"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Step Components

function WelcomeStep({ orderData, onNext }: { orderData: any; onNext: () => void }) {
  const lineItemsWithImages = orderData.lineItems?.filter((item: any) => item.imageUrl) || [];
  const trackingNumbers = orderData.trackingNumbers || [];
  
  const getTrackingUrl = (tracking: { trackingNumber: string; carrierCompany: string }) => {
    const carrierLower = (tracking.carrierCompany || '').toLowerCase();
    if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking.trackingNumber)}`;
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking.trackingNumber)}`;
    } else if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking.trackingNumber)}`;
    }
    return '';
  };

  const getCarrierName = (carrierCompany: string) => {
    const carrierLower = carrierCompany.toLowerCase();
    if (carrierLower.includes('ups')) return 'UPS';
    if (carrierLower.includes('fedex')) return 'FedEx';
    if (carrierLower.includes('usps')) return 'USPS';
    return carrierCompany;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Tracking Information - Prominent Display for Customers */}
      {trackingNumbers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 backdrop-blur"
          data-testid="customer-tracking-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center">
              <Truck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Order Has Shipped!</h2>
              <p className="text-sm text-white/60">Track your package below</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {trackingNumbers.map((tracking: any) => {
              const trackingUrl = getTrackingUrl(tracking);
              return (
                <div 
                  key={tracking.id}
                  className="p-4 rounded-xl bg-white/10 border border-white/20"
                  data-testid={`customer-tracking-${tracking.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white tracking-wider" data-testid={`customer-tracking-number-${tracking.id}`}>
                        {tracking.trackingNumber}
                      </p>
                      <p className="text-sm text-white/60">{tracking.carrierCompany}</p>
                    </div>
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors shadow-lg"
                        data-testid={`customer-track-link-${tracking.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track on {getCarrierName(tracking.carrierCompany)}
                      </a>
                    ) : (
                      <span className="text-sm text-white/50">
                        Visit {tracking.carrierCompany} to track
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neon-blue/40"
          >
            <ShoppingCart className="w-8 h-8 text-neon-blue" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Complete Your Order
          </h2>
          <p className="text-white/60">
            Please fill out the following information to finalize your order.
            This will only take a few minutes.
          </p>
        </div>

        {/* Order Preview */}
        {lineItemsWithImages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 mb-3">Items in your order</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {lineItemsWithImages.slice(0, 6).map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="aspect-square rounded-lg overflow-hidden border border-white/10"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.itemName || 'Product'} 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-neon-blue">{orderData.lineItems?.length || 0}</div>
            <div className="text-xs text-white/50">Items</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-neon-cyan">4</div>
            <div className="text-xs text-white/50">Steps</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-neon-purple">~5</div>
            <div className="text-xs text-white/50">Minutes</div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold text-lg hover:opacity-90 transition-opacity"
        data-testid="button-start"
      >
        Get Started
      </button>
    </motion.div>
  );
}

function ContactStep({ formData, setFormData }: { formData: OrderFormData; setFormData: any }) {
  const updateContact = (field: string, value: string) => {
    setFormData((prev: OrderFormData) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center">
            <User className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Contact Information</h2>
            <p className="text-sm text-white/50">How can we reach you?</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Full Name *</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={formData.contactInfo.name}
                onChange={(e) => updateContact('name', e.target.value)}
                placeholder="John Smith"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-contact-name"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/70">Email Address *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => updateContact('email', e.target.value)}
                placeholder="john@example.com"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-contact-email"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/70">Phone Number</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="tel"
                value={formData.contactInfo.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-contact-phone"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Additional Details</h2>
            <p className="text-sm text-white/50">Optional information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Organization Name</Label>
            <Input
              value={formData.additionalInfo.organizationName}
              onChange={(e) => setFormData((prev: OrderFormData) => ({
                ...prev,
                additionalInfo: { ...prev.additionalInfo, organizationName: e.target.value },
              }))}
              placeholder="Company or team name"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-testid="input-org-name"
            />
          </div>

          <div>
            <Label className="text-white/70">Purchase Order Number</Label>
            <Input
              value={formData.additionalInfo.purchaseOrderNumber}
              onChange={(e) => setFormData((prev: OrderFormData) => ({
                ...prev,
                additionalInfo: { ...prev.additionalInfo, purchaseOrderNumber: e.target.value },
              }))}
              placeholder="PO-12345"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-testid="input-po-number"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SizesStep({ lineItems, formData, setFormData }: { lineItems: any[]; formData: OrderFormData; setFormData: any }) {
  const updateSize = (itemId: number, sizeKey: string, value: number) => {
    setFormData((prev: OrderFormData) => ({
      ...prev,
      lineItemSizes: {
        ...prev.lineItemSizes,
        [itemId]: {
          ...prev.lineItemSizes[itemId],
          [sizeKey]: value,
        },
      },
    }));
  };

  const getTotalForItem = (itemId: number) => {
    const sizes = formData.lineItemSizes[itemId];
    if (!sizes) return 0;
    return SIZE_COLUMNS.reduce((sum, col) => {
      const sizeValue = sizes[col.key as keyof typeof sizes];
      return sum + (typeof sizeValue === 'number' ? sizeValue : 0);
    }, 0);
  };

  const getTotalAllItems = () => {
    return lineItems.reduce((sum: number, item: any) => sum + getTotalForItem(item.id), 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-neon-blue" />
            <span className="text-white font-medium">Size Selections</span>
          </div>
          <div className="text-sm">
            <span className="text-white/50">Total: </span>
            <span className="text-neon-cyan font-bold">{getTotalAllItems()} units</span>
          </div>
        </div>
      </div>

      {lineItems.map((item: any, index: number) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
        >
          <div className="flex items-start gap-4 mb-4">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.itemName || 'Product'} 
                className="w-20 h-20 rounded-lg object-cover border border-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <ImageIcon className="w-8 h-8 text-white/30" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium">{item.itemName || item.productName || 'Product'}</h3>
              <p className="text-sm text-white/50">{item.variantCode} {item.colorNotes && `• ${item.colorNotes}`}</p>
              <div className="mt-1 text-sm">
                <span className="text-white/40">Selected: </span>
                <span className="text-neon-cyan font-medium">{getTotalForItem(item.id)} units</span>
              </div>
            </div>
          </div>

          {/* Size Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {SIZE_COLUMNS.map((size) => {
              const value = formData.lineItemSizes[item.id]?.[size.key as keyof typeof formData.lineItemSizes[typeof item.id]] || 0;
              return (
                <div key={size.key} className="text-center">
                  <Label className="text-[10px] text-white/40">{size.label}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => updateSize(item.id, size.key, parseInt(e.target.value) || 0)}
                    className="mt-1 h-10 text-center bg-white/5 border-white/10 text-white text-sm"
                    data-testid={`input-size-${item.id}-${size.key}`}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ShippingStep({ formData, setFormData }: { formData: OrderFormData; setFormData: any }) {
  const updateShipping = (field: string, value: string) => {
    setFormData((prev: OrderFormData) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
  };

  const updateBilling = (field: string, value: any) => {
    setFormData((prev: OrderFormData) => ({
      ...prev,
      billingAddress: { ...prev.billingAddress, [field]: value },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Shipping Address */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Shipping Address</h2>
            <p className="text-sm text-white/50">Where should we send your order?</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Recipient Name</Label>
            <Input
              value={formData.shippingAddress.name}
              onChange={(e) => updateShipping('name', e.target.value)}
              placeholder="Attn: John Smith"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-testid="input-shipping-name"
            />
          </div>

          <div>
            <Label className="text-white/70">Street Address *</Label>
            <Input
              value={formData.shippingAddress.address}
              onChange={(e) => updateShipping('address', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-testid="input-shipping-address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70">City *</Label>
              <Input
                value={formData.shippingAddress.city}
                onChange={(e) => updateShipping('city', e.target.value)}
                placeholder="New York"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-shipping-city"
              />
            </div>
            <div>
              <Label className="text-white/70">State</Label>
              <Input
                value={formData.shippingAddress.state}
                onChange={(e) => updateShipping('state', e.target.value)}
                placeholder="NY"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-shipping-state"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70">ZIP Code</Label>
              <Input
                value={formData.shippingAddress.zip}
                onChange={(e) => updateShipping('zip', e.target.value)}
                placeholder="10001"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-shipping-zip"
              />
            </div>
            <div>
              <Label className="text-white/70">Country</Label>
              <Input
                value={formData.shippingAddress.country}
                onChange={(e) => updateShipping('country', e.target.value)}
                placeholder="USA"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-shipping-country"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle & Address */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Billing Address</h2>
            <p className="text-sm text-white/50">For invoicing purposes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Switch
            checked={formData.billingAddress.sameAsShipping}
            onCheckedChange={(checked) => updateBilling('sameAsShipping', checked)}
            data-testid="switch-same-as-shipping"
          />
          <Label className="text-white/70">Same as shipping address</Label>
        </div>

        {!formData.billingAddress.sameAsShipping && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <Label className="text-white/70">Billing Name</Label>
              <Input
                value={formData.billingAddress.name}
                onChange={(e) => updateBilling('name', e.target.value)}
                placeholder="Company Name"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-billing-name"
              />
            </div>

            <div>
              <Label className="text-white/70">Street Address</Label>
              <Input
                value={formData.billingAddress.address}
                onChange={(e) => updateBilling('address', e.target.value)}
                placeholder="456 Business Ave"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-billing-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">City</Label>
                <Input
                  value={formData.billingAddress.city}
                  onChange={(e) => updateBilling('city', e.target.value)}
                  placeholder="New York"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-billing-city"
                />
              </div>
              <div>
                <Label className="text-white/70">State</Label>
                <Input
                  value={formData.billingAddress.state}
                  onChange={(e) => updateBilling('state', e.target.value)}
                  placeholder="NY"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-billing-state"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">ZIP Code</Label>
                <Input
                  value={formData.billingAddress.zip}
                  onChange={(e) => updateBilling('zip', e.target.value)}
                  placeholder="10001"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-billing-zip"
                />
              </div>
              <div>
                <Label className="text-white/70">Country</Label>
                <Input
                  value={formData.billingAddress.country}
                  onChange={(e) => updateBilling('country', e.target.value)}
                  placeholder="USA"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-billing-country"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-white/50" />
          <Label className="text-white/70">Special Instructions</Label>
        </div>
        <Textarea
          value={formData.additionalInfo.specialInstructions}
          onChange={(e) => setFormData((prev: OrderFormData) => ({
            ...prev,
            additionalInfo: { ...prev.additionalInfo, specialInstructions: e.target.value },
          }))}
          placeholder="Any special delivery instructions or notes..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
          data-testid="input-special-instructions"
        />
      </div>
    </motion.div>
  );
}

function ReviewStep({ 
  orderData, 
  formData, 
  onSubmit, 
  isSubmitting 
}: { 
  orderData: any; 
  formData: OrderFormData; 
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const getTotalUnits = () => {
    return Object.values(formData.lineItemSizes).reduce((sum: number, sizes: any) => {
      return sum + SIZE_COLUMNS.reduce((s, col) => s + (sizes[col.key] || 0), 0);
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Review Your Information
        </h2>

        {/* Order Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/50">Order</div>
            <div className="text-white font-medium">{orderData.order.orderCode}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs text-white/50">Total Units</div>
            <div className="text-neon-cyan font-medium">{getTotalUnits()}</div>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact
          </h3>
          <div className="p-3 rounded-lg bg-white/5 text-sm">
            <div className="text-white">{formData.contactInfo.name}</div>
            <div className="text-white/60">{formData.contactInfo.email}</div>
            {formData.contactInfo.phone && (
              <div className="text-white/60">{formData.contactInfo.phone}</div>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipping Address
          </h3>
          <div className="p-3 rounded-lg bg-white/5 text-sm text-white/80">
            {formData.shippingAddress.name && <div>{formData.shippingAddress.name}</div>}
            <div>{formData.shippingAddress.address}</div>
            <div>
              {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zip}
            </div>
            <div>{formData.shippingAddress.country}</div>
          </div>
        </div>

        {/* Special Instructions */}
        {formData.additionalInfo.specialInstructions && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Special Instructions</h3>
            <div className="p-3 rounded-lg bg-white/5 text-sm text-white/80">
              {formData.additionalInfo.specialInstructions}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
          isSubmitting
            ? "bg-white/10 text-white/50 cursor-not-allowed"
            : "bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90"
        )}
        data-testid="button-submit"
      >
        {isSubmitting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
            Submitting...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Submit Order Form
          </>
        )}
      </button>
    </motion.div>
  );
}
