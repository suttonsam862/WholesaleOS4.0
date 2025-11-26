/**
 * Data Capsule Component
 * 
 * A unified modal for viewing and managing Orders, Design Jobs, and Manufacturing
 * with a consistent glass design, 5-block progress indicator, and role-based modules.
 */

import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  OrderStatus,
  DesignJobStatus,
  ManufacturingStatus,
  VelocityIndicator,
  ORDER_STATUS_CONFIG,
  DESIGN_JOB_STATUS_CONFIG,
  MANUFACTURING_STATUS_CONFIG,
  VELOCITY_CONFIG,
  calculateVelocity,
  calculateProgressBlocks,
  calculateETA,
  getStatusLabel,
  getStatusClasses,
} from "@/lib/status-system";

import {
  Package,
  Palette,
  Factory,
  MessageSquare,
  Clock,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scissors,
  Printer,
  PackageCheck,
  Eye,
  ExternalLink,
  Copy,
  ChevronRight,
  X,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface DataCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

interface CapsuleData {
  order: any;
  organization: any;
  lineItems: any[];
  designJobs: any[];
  manufacturing: any;
  manufacturingUpdates: any[];
  comments: any[];
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ProgressBar({ blocks }: { blocks: ReturnType<typeof calculateProgressBlocks> }) {
  return (
    <div className="flex items-center gap-1">
      {blocks.map((block, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            className={cn(
              "relative h-8 w-16 rounded-md border flex items-center justify-center text-xs font-medium transition-all duration-300",
              block.filled
                ? block.current
                  ? "bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 border-neon-blue/50 text-white"
                  : "bg-green-500/20 border-green-500/40 text-green-400"
                : "bg-white/5 border-white/10 text-white/40"
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {block.current && (
              <motion.div
                className="absolute inset-0 rounded-md bg-neon-blue/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <span className="relative z-10">{block.label}</span>
          </motion.div>
          {index < blocks.length - 1 && (
            <ChevronRight className={cn(
              "w-4 h-4 mx-0.5",
              block.filled ? "text-green-400/60" : "text-white/20"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

function VelocityIndicatorBadge({ velocity }: { velocity: VelocityIndicator }) {
  const config = VELOCITY_CONFIG[velocity];
  return (
    <motion.div
      className={cn(
        "px-3 py-1.5 rounded-full border text-sm font-medium",
        config.bgClass,
        config.borderClass,
        config.textClass,
        config.glowClass
      )}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
    >
      {config.label}
    </motion.div>
  );
}

function ManufacturingStageIndicator({ status }: { status: ManufacturingStatus | null }) {
  const stages = [
    { key: 'awaiting_admin_confirmation', label: 'Queue', icon: Clock },
    { key: 'confirmed_awaiting_manufacturing', label: 'Confirmed', icon: PackageCheck },
    { key: 'cutting_sewing', label: 'Cut/Sew', icon: Scissors },
    { key: 'printing', label: 'Print', icon: Printer },
    { key: 'final_packing_press', label: 'Pack', icon: Package },
    { key: 'shipped', label: 'Ship', icon: Truck },
    { key: 'complete', label: 'Done', icon: CheckCircle2 },
  ];

  const currentIndex = stages.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isComplete = currentIndex >= index;
        const isCurrent = currentIndex === index;
        
        return (
          <div key={stage.key} className="flex items-center">
            <motion.div
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px]",
                isComplete ? "opacity-100" : "opacity-40"
              )}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: isComplete ? 1 : 0.4 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isCurrent
                  ? "bg-neon-blue/30 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,186,255,0.4)]"
                  : isComplete
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-white/5 border-white/20 text-white/40"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                isCurrent ? "text-neon-blue" : isComplete ? "text-green-400" : "text-white/40"
              )}>
                {stage.label}
              </span>
            </motion.div>
            {index < stages.length - 1 && (
              <div className={cn(
                "w-6 h-0.5 mx-1",
                currentIndex > index ? "bg-green-500/50" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModuleTab({ 
  label, 
  icon: Icon, 
  active, 
  onClick, 
  badge 
}: { 
  label: string; 
  icon: any; 
  active: boolean; 
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
        active
          ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50 text-white"
          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-xs rounded-full bg-neon-blue/30 text-neon-blue">
          {badge}
        </span>
      )}
    </button>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/40 mb-0.5">{label}</div>
        <div className="text-sm text-white truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataCapsule({ isOpen, onClose, orderId }: DataCapsuleProps) {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<'overview' | 'design' | 'manufacturing' | 'communication'>('overview');

  // Fetch order data
  const { data: order } = useQuery<any>({
    queryKey: ["/api/orders", orderId],
    enabled: isOpen && !!orderId,
  });

  // Fetch organization
  const { data: organization } = useQuery<any>({
    queryKey: ["/api/organizations", order?.orgId],
    enabled: isOpen && !!order?.orgId,
  });

  // Fetch line items
  const { data: lineItems = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/line-items`],
    enabled: isOpen && !!orderId,
  });

  // Fetch design jobs
  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/design-jobs"],
    enabled: isOpen && !!orderId,
    select: (data) => data.filter((job: any) => job.orderId === orderId),
  });

  // Fetch manufacturing
  const { data: manufacturingData = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    enabled: isOpen && !!orderId,
    select: (data) => data.filter((m: any) => m.orderId === orderId),
  });

  const manufacturing = manufacturingData[0] || null;

  // Calculate velocity
  const velocity = useMemo(() => {
    if (!order) return 'grey' as VelocityIndicator;
    return calculateVelocity(
      order.updatedAt,
      order.estDelivery,
      order.status
    );
  }, [order]);

  // Calculate progress blocks
  const progressBlocks = useMemo(() => {
    if (!order) return [];
    
    const orderStatus = order.status as OrderStatus;
    const designStatus = designJobs[0]?.status as DesignJobStatus | null || null;
    const mfgStatus = manufacturing?.status as ManufacturingStatus | null || null;
    
    return calculateProgressBlocks(orderStatus, designStatus, mfgStatus);
  }, [order, designJobs, manufacturing]);

  // Role-based module visibility
  const visibleModules = useMemo(() => {
    const modules: Array<'overview' | 'design' | 'manufacturing' | 'communication'> = ['overview'];
    
    if (user?.role === 'admin' || user?.role === 'designer' || user?.role === 'ops') {
      modules.push('design');
    }
    if (user?.role === 'admin' || user?.role === 'ops' || user?.role === 'manufacturer') {
      modules.push('manufacturing');
    }
    modules.push('communication');
    
    return modules;
  }, [user?.role]);

  if (!orderId || !order) return null;

  const orderStatusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />
          
          {/* Velocity glow effect */}
          <div 
            className="absolute inset-0 opacity-20 rounded-2xl"
            style={{
              boxShadow: `inset 0 0 60px ${VELOCITY_CONFIG[velocity].color}20`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col max-h-[90vh]">
            
            {/* ========== HEADER ========== */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Order ID and Status */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">
                      {order.orderCode}
                    </h2>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium border",
                      orderStatusConfig?.bgClass,
                      orderStatusConfig?.textClass,
                      orderStatusConfig?.borderClass
                    )}>
                      {orderStatusConfig?.label || order.status}
                    </div>
                    <VelocityIndicatorBadge velocity={velocity} />
                  </div>
                  <p className="text-white/60">{order.orderName}</p>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress blocks */}
              <div className="mb-4">
                <ProgressBar blocks={progressBlocks} />
              </div>

              {/* Key metrics row */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" />
                  <span>ETA: </span>
                  <span className={cn(
                    "font-medium",
                    velocity === 'red' ? "text-red-400" : 
                    velocity === 'yellow' ? "text-yellow-400" : "text-white"
                  )}>
                    {calculateETA(order.estDelivery)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Building2 className="w-4 h-4" />
                  <span>{organization?.name || 'No organization'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Package className="w-4 h-4" />
                  <span>{lineItems.length} line items</span>
                </div>
              </div>
            </div>

            {/* ========== MODULE TABS ========== */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
              {visibleModules.includes('overview') && (
                <ModuleTab
                  label="Overview"
                  icon={Package}
                  active={activeModule === 'overview'}
                  onClick={() => setActiveModule('overview')}
                />
              )}
              {visibleModules.includes('design') && (
                <ModuleTab
                  label="Design"
                  icon={Palette}
                  active={activeModule === 'design'}
                  onClick={() => setActiveModule('design')}
                  badge={designJobs.length}
                />
              )}
              {visibleModules.includes('manufacturing') && (
                <ModuleTab
                  label="Manufacturing"
                  icon={Factory}
                  active={activeModule === 'manufacturing'}
                  onClick={() => setActiveModule('manufacturing')}
                />
              )}
              {visibleModules.includes('communication') && (
                <ModuleTab
                  label="Communication"
                  icon={MessageSquare}
                  active={activeModule === 'communication'}
                  onClick={() => setActiveModule('communication')}
                />
              )}
            </div>

            {/* ========== MODULE CONTENT ========== */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeModule === 'overview' && (
                  <OverviewModule
                    key="overview"
                    order={order}
                    organization={organization}
                    lineItems={lineItems}
                  />
                )}
                {activeModule === 'design' && (
                  <DesignModule
                    key="design"
                    designJobs={designJobs}
                    order={order}
                  />
                )}
                {activeModule === 'manufacturing' && (
                  <ManufacturingModule
                    key="manufacturing"
                    manufacturing={manufacturing}
                    order={order}
                  />
                )}
                {activeModule === 'communication' && (
                  <CommunicationModule
                    key="communication"
                    orderId={orderId}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* ========== FOOTER ========== */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-white/40">
                Last updated: {order.updatedAt ? format(new Date(order.updatedAt), 'MMM d, yyyy h:mm a') : 'Never'}
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open Full View
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// MODULE COMPONENTS
// =============================================================================

function OverviewModule({ order, organization, lineItems }: { order: any; organization: any; lineItems: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-2 gap-6"
    >
      {/* Order Details */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-blue" />
          Order Details
        </h3>
        <div className="space-y-1">
          <InfoRow label="Order Name" value={order.orderName} icon={FileText} />
          <InfoRow label="Priority" value={order.priority} icon={AlertTriangle} />
          <InfoRow label="Tracking" value={order.trackingNumber} icon={Truck} />
          <InfoRow 
            label="Estimated Delivery" 
            value={order.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : null} 
            icon={Calendar} 
          />
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neon-purple" />
          Customer
        </h3>
        <div className="space-y-1">
          <InfoRow label="Organization" value={organization?.name} icon={Building2} />
          <InfoRow label="Contact" value={order.contactName} icon={User} />
          <InfoRow label="Email" value={order.contactEmail} icon={Mail} />
          <InfoRow label="Phone" value={order.contactPhone} icon={Phone} />
        </div>
      </div>

      {/* Line Items Summary */}
      <div className="col-span-2 p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-cyan" />
          Line Items ({lineItems.length})
        </h3>
        {lineItems.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lineItems.map((item: any) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-white">{item.itemName || 'Unnamed Item'}</div>
                    <div className="text-xs text-white/40">{item.colorNotes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{item.qtyTotal} units</div>
                  <div className="text-xs text-white/40">${item.lineTotal}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No line items yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DesignModule({ designJobs, order }: { designJobs: any[]; order: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Design Jobs</h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm",
          order.designApproved 
            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
        )}>
          {order.designApproved ? 'Design Approved' : 'Pending Approval'}
        </div>
      </div>

      {designJobs.length > 0 ? (
        <div className="space-y-3">
          {designJobs.map((job: any) => {
            const statusConfig = DESIGN_JOB_STATUS_CONFIG[job.status as DesignJobStatus];
            return (
              <div 
                key={job.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{job.title || `Job #${job.id}`}</div>
                    <div className="text-sm text-white/40">{job.description}</div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    statusConfig?.bgClass,
                    statusConfig?.textClass,
                    statusConfig?.borderClass,
                    "border"
                  )}>
                    {statusConfig?.label || job.status}
                  </div>
                </div>
                {job.assignedToId && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <User className="w-4 h-4" />
                    <span>Assigned to designer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Palette className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No design jobs created yet</p>
        </div>
      )}
    </motion.div>
  );
}

function ManufacturingModule({ manufacturing, order }: { manufacturing: any; order: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {manufacturing ? (
        <>
          {/* Manufacturing Stage Indicator */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Production Stage</h3>
            <ManufacturingStageIndicator status={manufacturing.status as ManufacturingStatus} />
          </div>

          {/* Manufacturing Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neon-blue" />
                Schedule
              </h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Start Date" 
                  value={manufacturing.startDate ? format(new Date(manufacturing.startDate), 'MMM d, yyyy') : null}
                  icon={Calendar}
                />
                <InfoRow 
                  label="Est. Completion" 
                  value={manufacturing.estCompletion ? format(new Date(manufacturing.estCompletion), 'MMM d, yyyy') : null}
                  icon={Clock}
                />
                <InfoRow 
                  label="Batch Number" 
                  value={manufacturing.batchNumber}
                  icon={Package}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon-purple" />
                Notes
              </h3>
              <div className="space-y-2">
                {manufacturing.productionNotes && (
                  <div className="text-sm text-white/60 p-2 rounded bg-white/5">
                    {manufacturing.productionNotes}
                  </div>
                )}
                {manufacturing.qualityNotes && (
                  <div className="text-sm text-white/60 p-2 rounded bg-white/5">
                    <span className="text-neon-cyan text-xs uppercase font-medium">QC: </span>
                    {manufacturing.qualityNotes}
                  </div>
                )}
                {!manufacturing.productionNotes && !manufacturing.qualityNotes && (
                  <div className="text-sm text-white/40 italic">No notes added</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-4">Manufacturing record not yet created</p>
          <p className="text-sm">Order must be approved and ready for production</p>
        </div>
      )}
    </motion.div>
  );
}

function CommunicationModule({ orderId }: { orderId: number }) {
  // Fetch comments for this order
  const { data: comments = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/comments`],
    enabled: !!orderId,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-white">Activity & Comments</h3>
      
      {comments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment: any) => (
            <div 
              key={comment.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-neon-blue" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{comment.userName || 'Unknown'}</div>
                  <div className="text-xs text-white/40">
                    {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : ''}
                  </div>
                </div>
              </div>
              <div className="text-sm text-white/80 pl-10">{comment.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No comments yet</p>
        </div>
      )}
    </motion.div>
  );
}

export default DataCapsule;
