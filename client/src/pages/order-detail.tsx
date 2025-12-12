import { useEffect, useMemo } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { OrderCapsule } from "@/components/OrderCapsule";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { StageId } from "@/lib/ordersStageConfig";

export default function OrderDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/orders/:id");
  const searchString = useSearch();

  const orderId = params?.id ? parseInt(params.id, 10) : null;
  
  const searchParams = new URLSearchParams(searchString);
  const fromParam = searchParams.get("from");
  let returnTo = "/orders/list";
  if (fromParam) {
    try {
      returnTo = decodeURIComponent(fromParam);
    } catch {
      returnTo = "/orders/list";
    }
  }

  // Extract stage from the return URL for stage-aware defaults
  const stageFromUrl = useMemo((): StageId | undefined => {
    try {
      const url = new URL(returnTo, window.location.origin);
      const stageParam = url.searchParams.get("stage");
      if (stageParam) {
        return stageParam as StageId;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }, [returnTo]);

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

  const handleClose = () => {
    setLocation(returnTo);
  };

  if (!match || !orderId || isNaN(orderId)) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/orders")} data-testid="link-back-to-orders">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <OrderCapsule
      orderId={orderId}
      isOpen={true}
      onClose={handleClose}
      stage={stageFromUrl}
    />
  );
}
