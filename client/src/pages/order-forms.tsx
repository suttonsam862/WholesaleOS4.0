import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassButton, GlassInput } from "@/components/ui/glass";
import { Plus, Search, FileText, User, ShoppingCart, ArrowRight, Copy, Check, Mail, Link2, ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface Order {
  id: number;
  orderNumber: string;
  orgId: number;
  organization?: { name: string };
  lineItems?: Array<{
    id: number;
    productName: string;
    imageUrl?: string;
    quantity: number;
  }>;
  createdAt: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  orgId: number;
}

export default function OrderForms() {
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch orders from API
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch contacts from API
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Filter orders by search
  const filteredOrders = orders.filter(order => 
    order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.organization?.name?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Filter contacts by search (and optionally by selected order's organization)
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearch.toLowerCase());
    
    // If order is selected, prioritize contacts from same organization
    return matchesSearch;
  });

  // Sort contacts: same org first
  const sortedContacts = selectedOrder 
    ? [...filteredContacts].sort((a, b) => {
        if (a.orgId === selectedOrder.orgId && b.orgId !== selectedOrder.orgId) return -1;
        if (b.orgId === selectedOrder.orgId && a.orgId !== selectedOrder.orgId) return 1;
        return 0;
      })
    : filteredContacts;

  const handleCreateClick = () => {
    setIsCreating(true);
    setStep(1);
    setSelectedOrder(null);
    setSelectedContact(null);
    setOrderSearch("");
    setContactSearch("");
    setCopied(false);
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setStep(2);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setStep(3);
  };

  // Generate form link - now uses customer portal
  const getFormLink = () => {
    if (!selectedOrder) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer-portal/${selectedOrder.id}`;
  };

  const handleCopyLink = async () => {
    const link = getFormLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "The customer portal link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleEmailLink = () => {
    if (!selectedContact || !selectedOrder) return;
    
    const link = getFormLink();
    const subject = encodeURIComponent(`Rich Habits Custom Order Portal: ${selectedOrder.orderNumber}`);
    const body = encodeURIComponent(
      `Hi ${selectedContact.name},\n\n` +
      `Please access your Rich Habits Custom Order Portal using the link below to view your order details, submit sizes, and track your order:\n\n` +
      `${link}\n\n` +
      `Order Number: ${selectedOrder.orderNumber}\n` +
      `Items: ${selectedOrder.lineItems?.length || 0}\n\n` +
      `Thank you for choosing Rich Habits!`
    );
    
    const mailtoLink = `mailto:${selectedContact.email || ""}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handlePreview = () => {
    if (selectedOrder) {
      setLocation(`/customer-portal/${selectedOrder.id}`);
    }
  };

  const handleReset = () => {
    setIsCreating(false);
    setStep(1);
    setSelectedOrder(null);
    setSelectedContact(null);
    setOrderSearch("");
    setContactSearch("");
    setCopied(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Forms</h1>
          <p className="text-muted-foreground">Create and share simple order forms with your customers.</p>
        </div>
        <GlassButton onClick={handleCreateClick} icon={<Plus className="w-4 h-4" />}>
          Create Order Form
        </GlassButton>
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="max-w-3xl mx-auto p-0 overflow-hidden">
              {/* Header with Progress */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {step === 1 && "Select an Order"}
                        {step === 2 && "Select a Contact"}
                        {step === 3 && "Share Your Form"}
                      </h2>
                      <p className="text-sm text-muted-foreground">Step {step} of 3</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-300",
                        s === step
                          ? "bg-neon-blue scale-y-125 shadow-[0_0_10px_#00f3ff]"
                          : s < step
                          ? "bg-neon-blue/50"
                          : "bg-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Select Order */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <GlassInput 
                        icon={<Search className="w-4 h-4" />} 
                        placeholder="Search orders by number or organization..." 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                      
                      {ordersLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading orders...
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No orders found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                          {filteredOrders.slice(0, 20).map((order) => (
                            <div
                              key={order.id}
                              onClick={() => handleOrderSelect(order)}
                              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all hover:border-neon-blue/50 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                                    <ShoppingCart className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white">{order.orderNumber}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.organization?.name || "Unknown Organization"} • {order.lineItems?.length || 0} items
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-blue opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                              
                              {/* Line item preview */}
                              {order.lineItems && order.lineItems.length > 0 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                  {order.lineItems.slice(0, 4).map((item) => (
                                    <div key={item.id} className="flex-shrink-0">
                                      {item.imageUrl ? (
                                        <ImageWithFallback
                                          src={item.imageUrl}
                                          alt={item.productName}
                                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {order.lineItems.length > 4 && (
                                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-muted-foreground">
                                      +{order.lineItems.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Select Contact */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <GlassInput 
                        icon={<Search className="w-4 h-4" />} 
                        placeholder="Search contacts..." 
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                      />
                      
                      {contactsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading contacts...
                        </div>
                      ) : sortedContacts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No contacts found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                          {sortedContacts.slice(0, 20).map((contact) => {
                            const isSameOrg = selectedOrder && contact.orgId === selectedOrder.orgId;
                            return (
                              <div
                                key={contact.id}
                                onClick={() => handleContactSelect(contact)}
                                className={cn(
                                  "p-4 rounded-xl border cursor-pointer transition-all group",
                                  isSameOrg 
                                    ? "bg-neon-blue/5 border-neon-blue/20 hover:border-neon-blue/50"
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-12 h-12 rounded-full flex items-center justify-center",
                                      isSameOrg ? "bg-neon-blue/20 text-neon-blue" : "bg-neon-purple/10 text-neon-purple"
                                    )}>
                                      <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-white">{contact.name}</p>
                                        {isSameOrg && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue">
                                            Same Org
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{contact.email || "No email"}</p>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-blue opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <GlassButton variant="ghost" onClick={() => setStep(1)} className="w-full mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                      </GlassButton>
                    </motion.div>
                  )}

                  {/* Step 3: Share Form */}
                  {step === 3 && selectedOrder && selectedContact && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Success Header */}
                      <div className="text-center py-4">
                        <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-neon-green">
                          <Check className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Form Ready!</h3>
                        <p className="text-muted-foreground">
                          Share this link with <strong className="text-white">{selectedContact.name}</strong>
                        </p>
                      </div>

                      {/* Summary Card */}
                      <GlassCard variant="neon" className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Order</span>
                            <span className="text-white font-medium">{selectedOrder.orderNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Organization</span>
                            <span className="text-white font-medium">{selectedOrder.organization?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Items</span>
                            <span className="text-white font-medium">{selectedOrder.lineItems?.length || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Recipient</span>
                            <span className="text-white font-medium">{selectedContact.name}</span>
                          </div>
                        </div>
                      </GlassCard>

                      {/* Link Display */}
                      <div className="relative">
                        <GlassInput
                          value={getFormLink()}
                          readOnly
                          className="pr-24 font-mono text-sm"
                        />
                        <GlassButton
                          size="sm"
                          variant={copied ? "primary" : "secondary"}
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={handleCopyLink}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                        </GlassButton>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <GlassButton
                          variant="secondary"
                          onClick={handleCopyLink}
                          className="w-full"
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Copy Link
                        </GlassButton>
                        <GlassButton
                          variant="secondary"
                          onClick={handleEmailLink}
                          className="w-full"
                          disabled={!selectedContact.email}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email Link
                        </GlassButton>
                        <GlassButton
                          onClick={handlePreview}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </GlassButton>
                      </div>

                      <GlassButton variant="ghost" onClick={() => setStep(2)} className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </GlassButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Card */}
              <GlassCard 
                className="flex flex-col items-center justify-center py-12 text-center border-dashed border-white/20 bg-transparent hover:bg-white/5 cursor-pointer transition-all group min-h-[200px]" 
                onClick={handleCreateClick}
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-neon-blue/10">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-neon-blue transition-colors" />
                </div>
                <h3 className="text-lg font-medium text-white">Create New Form</h3>
                <p className="text-sm text-muted-foreground mt-2">Generate a shareable link for customers</p>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
