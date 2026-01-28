import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Palette,
  ShoppingCart,
  Users,
  Calendar,
  FileText,
  Search,
  Plus,
  RefreshCw,
  Filter,
  Inbox,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 p-3 bg-muted rounded-full">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {action && (
              <Button onClick={action.onClick}>
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
}

// Pre-configured empty states for common scenarios

export function EmptyOrderList({ onCreateOrder }: { onCreateOrder: () => void }) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No orders yet"
      description="Create your first order to get started. Orders help you track customer requests from creation through delivery."
      action={{
        label: "Create Order",
        onClick: onCreateOrder,
        icon: Plus,
      }}
    />
  );
}

export function EmptyOrderSearch({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No orders found"
      description="No orders match your current search criteria. Try adjusting your filters or search terms."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
        icon: Filter,
      }}
    />
  );
}

export function EmptyDesignJobList({ onCreateJob }: { onCreateJob: () => void }) {
  return (
    <EmptyState
      icon={Palette}
      title="No design jobs"
      description="Design jobs are created when orders require custom artwork. Create a design job to assign work to your design team."
      action={{
        label: "Create Design Job",
        onClick: onCreateJob,
        icon: Plus,
      }}
    />
  );
}

export function EmptyDesignQueue() {
  return (
    <EmptyState
      icon={CheckCircle2}
      title="Queue is clear!"
      description="Great work! You have no design jobs assigned to you right now. Check back later for new assignments."
    />
  );
}

export function EmptyManufacturingQueue() {
  return (
    <EmptyState
      icon={Package}
      title="No orders ready for manufacturing"
      description="Orders appear here when they have approved designs and payment received. Check back when orders are ready to send to production."
    />
  );
}

export function EmptyProductionQueue() {
  return (
    <EmptyState
      icon={Building2}
      title="No orders in production"
      description="Orders that have been sent to manufacturers will appear here. You can track their progress through the production lifecycle."
    />
  );
}

export function EmptyLeadList({ onCreateLead }: { onCreateLead: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No leads yet"
      description="Start building your sales pipeline by adding new leads. Track potential customers from initial contact through conversion."
      action={{
        label: "Add Lead",
        onClick: onCreateLead,
        icon: Plus,
      }}
    />
  );
}

export function EmptyEventList({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming events"
      description="Events help you track tournaments, team seasons, and other opportunities. Create an event to start managing your pipeline."
      action={{
        label: "Create Event",
        onClick: onCreateEvent,
        icon: Plus,
      }}
    />
  );
}

export function EmptyActivityFeed() {
  return (
    <EmptyState
      icon={Clock}
      title="No activity yet"
      description="Activity will appear here as changes are made to this order, including status updates, comments, and file uploads."
    />
  );
}

export function EmptyFileSection({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No files uploaded"
      description="Upload files like size sheets, design assets, or reference materials to keep everything organized in one place."
      action={{
        label: "Upload File",
        onClick: onUpload,
        icon: Plus,
      }}
    />
  );
}

export function EmptyCommentSection({ onAddComment }: { onAddComment: () => void }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-muted-foreground mb-3">
        No comments yet. Be the first to add a comment.
      </p>
      <Button variant="outline" size="sm" onClick={onAddComment}>
        Add Comment
      </Button>
    </div>
  );
}

export function EmptyPaymentList() {
  return (
    <EmptyState
      icon={CreditCard}
      title="No payments recorded"
      description="Payments will appear here as they are received. You can record payments manually or they may be recorded automatically from payment processors."
    />
  );
}

export function EmptyInvoiceList({ onCreateInvoice }: { onCreateInvoice?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No invoices"
      description="Invoices are generated when orders are ready for payment. Create an invoice to request payment from the customer."
      action={onCreateInvoice ? {
        label: "Create Invoice",
        onClick: onCreateInvoice,
        icon: Plus,
      } : undefined}
    />
  );
}

export function EmptyDashboardQueue() {
  return (
    <EmptyState
      icon={CheckCircle2}
      title="All caught up!"
      description="No items currently need your immediate action. Check the waiting sections below or create a new order."
    />
  );
}

export function EmptySearchResults({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try using different keywords or check your spelling.`}
      action={{
        label: "Clear Search",
        onClick: onClear,
        icon: RefreshCw,
      }}
    />
  );
}

export function EmptyFilterResults({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No matches"
      description="No items match your current filter criteria. Try adjusting your filters to see more results."
      action={{
        label: "Reset Filters",
        onClick: onReset,
        icon: RefreshCw,
      }}
    />
  );
}

export function EmptySalesMetrics() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No sales data yet"
      description="Sales metrics will appear here once you start closing deals. Create leads and convert them to orders to see your performance."
    />
  );
}

// Inline empty state for smaller contexts
export function InlineEmptyState({
  message,
  action,
}: {
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
