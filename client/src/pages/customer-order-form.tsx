import { useState } from "react";
import { GlassCard, GlassButton, GlassInput } from "@/components/ui/glass";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Check, ChevronRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// Mock data for the form items
const MOCK_ITEMS = [
  { id: 1, name: "Classic T-Shirt", color: "Black", size: "L", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 2, name: "Premium Hoodie", color: "Navy", size: "M", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 3, name: "Sports Cap", color: "Red", size: "One Size", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
];

export default function CustomerOrderForm() {
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, setLocation] = useLocation();

  const handleQuantityChange = (id: number, value: string) => {
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // In a real app, this would submit the data
    setTimeout(() => {
      // Simulate redirect or reset
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="max-w-md w-full text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6 text-neon-green"
          >
            <Check className="w-12 h-12" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">Order Submitted!</h1>
          <p className="text-muted-foreground mb-8">Thank you for submitting your order details. We'll be in touch shortly.</p>
          <GlassButton onClick={() => setLocation("/")}>Return Home</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Order Details</h1>
              <p className="text-sm text-muted-foreground">Please fill in the quantities below</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <AnimatePresence>
          {MOCK_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="flex flex-col sm:flex-row gap-6 items-center sm:items-start overflow-hidden group hover:border-neon-blue/30 transition-colors">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left w-full">
                  <h3 className="text-xl font-semibold text-white mb-1">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground border border-white/5">
                      Color: {item.color}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground border border-white/5">
                      Size: {item.size}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Order Number / Qty:</label>
                    <GlassInput
                      type="text"
                      placeholder="Enter value..."
                      className="text-center sm:text-left text-lg font-medium"
                      value={quantities[item.id] || ""}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 flex justify-center"
        >
          <GlassButton
            size="lg"
            className="w-full sm:w-auto min-w-[200px] text-lg h-14 bg-neon-blue text-black hover:bg-neon-blue/90 hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] border-none"
            onClick={handleSubmit}
          >
            Submit Order Form <ChevronRight className="ml-2 w-5 h-5" />
          </GlassButton>
        </motion.div>
      </div>
    </div>
  );
}
