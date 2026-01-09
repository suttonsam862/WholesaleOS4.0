import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { 
  MANUFACTURING_STATUS_CONFIG, 
  type ManufacturingStatus 
} from "@/lib/status-system";
import { Eye, Download, Loader2 } from "lucide-react";
import type { Order, Manufacturing } from "@shared/schema";

interface Organization {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
}

export interface EnrichedManufacturing extends Manufacturing {
  order?: Order;
  organization?: Organization;
}

interface GlassManufacturingSpreadsheetProps {
  records: EnrichedManufacturing[];
  onRecordClick: (record: EnrichedManufacturing) => void;
  onDownloadPdf?: (record: EnrichedManufacturing) => void;
  isLoading?: boolean;
}

type Priority = "urgent" | "high" | "normal" | "low";

const PRIORITY_CONFIG: Record<Priority, { color: string; glowClass: string; label: string }> = {
  urgent: { 
    color: "bg-red-500", 
    glowClass: "shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    label: "Urgent"
  },
  high: { 
    color: "bg-orange-500", 
    glowClass: "shadow-[0_0_8px_rgba(249,115,22,0.6)]",
    label: "High"
  },
  normal: { 
    color: "bg-green-500", 
    glowClass: "shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    label: "Normal"
  },
  low: { 
    color: "bg-gray-500", 
    glowClass: "",
    label: "Low"
  },
};

function getPriorityFromOrder(order?: Order): Priority {
  if (!order) return "normal";
  const priority = order.priority as string | undefined;
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "normal";
}

function getStatusGlowClass(status: ManufacturingStatus): string {
  const config = MANUFACTURING_STATUS_CONFIG[status];
  if (!config) return "";
  
  const colorMap: Record<string, string> = {
    "#f59e0b": "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    "#3b82f6": "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
    "#8b5cf6": "shadow-[0_0_12px_rgba(139,92,246,0.4)]",
    "#ec4899": "shadow-[0_0_12px_rgba(236,72,153,0.4)]",
    "#06b6d4": "shadow-[0_0_12px_rgba(6,182,212,0.4)]",
    "#10b981": "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    "#22c55e": "shadow-[0_0_12px_rgba(34,197,94,0.4)]",
  };
  
  return colorMap[config.color] || "";
}

function StatusBadge({ status }: { status: ManufacturingStatus }) {
  const config = MANUFACTURING_STATUS_CONFIG[status];
  if (!config) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
        {status}
      </span>
    );
  }

  return (
    <motion.span
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-full border transition-all duration-300",
        config.bgClass,
        config.textClass,
        config.borderClass,
        getStatusGlowClass(status)
      )}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      {config.label}
    </motion.span>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <div 
      className={cn(
        "w-3 h-3 rounded-full transition-all duration-300",
        config.color,
        config.glowClass
      )}
      title={config.label}
    />
  );
}

function ActionButton({ 
  icon: Icon, 
  onClick, 
  label,
  testId 
}: { 
  icon: typeof Eye; 
  onClick: (e: React.MouseEvent) => void; 
  label: string;
  testId: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/30 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
      data-testid={testId}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className="h-16 bg-white/5 rounded-lg animate-pulse border border-white/5"
        />
      ))}
    </div>
  );
}

export function GlassManufacturingSpreadsheet({
  records,
  onRecordClick,
  onDownloadPdf,
  isLoading = false,
}: GlassManufacturingSpreadsheetProps) {
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const orderA = MANUFACTURING_STATUS_CONFIG[a.status as ManufacturingStatus]?.order ?? 99;
      const orderB = MANUFACTURING_STATUS_CONFIG[b.status as ManufacturingStatus]?.order ?? 99;
      return orderA - orderB;
    });
  }, [records]);

  const handleRowClick = (record: EnrichedManufacturing) => {
    onRecordClick(record);
  };

  const handleViewClick = (e: React.MouseEvent, record: EnrichedManufacturing) => {
    e.stopPropagation();
    onRecordClick(record);
  };

  const handleDownloadClick = (e: React.MouseEvent, record: EnrichedManufacturing) => {
    e.stopPropagation();
    onDownloadPdf?.(record);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-[400px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-pink-900/20" />
        <div className="relative p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
            <span className="text-white/60">Loading manufacturing records...</span>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (sortedRecords.length === 0) {
    return (
      <div className="relative min-h-[200px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-pink-900/20" />
        <div className="relative p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
          <p className="text-white/40 text-center">No manufacturing records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-pink-900/20" />
      
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedRecords.map((record, index) => {
                  const isHovered = hoveredRowId === record.id;
                  const priority = getPriorityFromOrder(record.order);
                  
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleRowClick(record)}
                      onMouseEnter={() => setHoveredRowId(record.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={cn(
                        "border-b border-white/5 cursor-pointer transition-all duration-300",
                        isHovered 
                          ? "bg-white/10 shadow-[0_0_20px_rgba(0,243,255,0.15)]" 
                          : "bg-transparent hover:bg-white/5"
                      )}
                      data-testid={`row-manufacturing-${record.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                            <OrgLogo 
                              src={record.organization?.logoUrl || null}
                              orgName={record.organization?.name || "Unknown"}
                              orgId={record.organization?.id}
                              size="sm"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-mono text-neon-blue">
                              {record.order?.orderCode || `MFG-${record.id}`}
                            </div>
                            <div className="text-sm font-medium text-white/80 truncate max-w-[200px]">
                              {record.order?.orderName || "Unknown Order"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm text-white/60 truncate max-w-[180px]">
                          {record.organization?.name || "—"}
                        </div>
                        {record.organization?.city && (
                          <div className="text-xs text-white/40">
                            {record.organization.city}
                            {record.organization.state && `, ${record.organization.state}`}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/60">
                          {record.batchNumber || "Standard"}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status as ManufacturingStatus} />
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <PriorityDot priority={priority} />
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            onClick={(e) => handleViewClick(e, record)}
                            label="View Details"
                            testId={`button-view-${record.id}`}
                          />
                          {onDownloadPdf && (
                            <ActionButton
                              icon={Download}
                              onClick={(e) => handleDownloadClick(e, record)}
                              label="Download PDF"
                              testId={`button-download-${record.id}`}
                            />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              {sortedRecords.length} record{sortedRecords.length !== 1 ? "s" : ""} • Sorted by stage
            </span>
            <div className="flex items-center gap-4">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", config.color)} />
                  <span className="text-xs text-white/40">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function openManufacturingCapsule(manufacturingId: number): { manufacturingId: number } {
  return { manufacturingId };
}

export default GlassManufacturingSpreadsheet;
