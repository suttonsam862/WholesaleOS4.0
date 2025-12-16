import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { format } from "date-fns";

interface ExceptionJob {
  id: number;
  orderCode: string;
  clientName?: string;
  type: "urgent" | "overdue";
  requiredDeliveryDate?: string | null;
  priority?: string;
}

interface ExceptionPanelProps {
  exceptions: ExceptionJob[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ExceptionPanel({ exceptions, isOpen, onClose, className }: ExceptionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const urgentJobs = exceptions.filter((e) => e.type === "urgent");
  const overdueJobs = exceptions.filter((e) => e.type === "overdue");

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "fixed z-50 overflow-hidden flex flex-col bg-card border rounded-xl shadow-2xl",
              "right-2 left-2 bottom-2 top-auto max-h-[70vh]",
              "md:right-4 md:left-auto md:top-20 md:bottom-auto md:w-80 md:max-h-[calc(100vh-120px)]",
              className
            )}
            data-testid="exception-panel"
          >
            <div className="p-4 border-b bg-red-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-foreground">Exceptions</h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                  {exceptions.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-exceptions">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {overdueJobs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-400">Overdue ({overdueJobs.length})</span>
                    </div>
                    <div className="space-y-2">
                      {overdueJobs.map((job) => (
                        <Link key={job.id} href={`/manufacturer-portal/job/${job.id}`}>
                          <div
                            className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors"
                            data-testid={`exception-overdue-${job.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{job.orderCode}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {job.clientName && (
                              <p className="text-xs text-muted-foreground mt-0.5">{job.clientName}</p>
                            )}
                            {job.requiredDeliveryDate && (
                              <p className="text-xs text-red-400 mt-1">
                                Due: {format(new Date(job.requiredDeliveryDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {urgentJobs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-400">Urgent ({urgentJobs.length})</span>
                    </div>
                    <div className="space-y-2">
                      {urgentJobs.map((job) => (
                        <Link key={job.id} href={`/manufacturer-portal/job/${job.id}`}>
                          <div
                            className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-colors"
                            data-testid={`exception-urgent-${job.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{job.orderCode}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {job.clientName && (
                              <p className="text-xs text-muted-foreground mt-0.5">{job.clientName}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {exceptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No exceptions to display</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
