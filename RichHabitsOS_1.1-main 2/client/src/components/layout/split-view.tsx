import { ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SplitViewProps {
  sidebar: ReactNode;
  content: ReactNode;
  sidebarWidth?: number;
  className?: string;
}

export function SplitView({ sidebar, content, sidebarWidth = 30, className }: SplitViewProps) {
  return (
    <div className={cn("h-[calc(100vh-180px)] w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl", className)}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={sidebarWidth} minSize={20} maxSize={40} className="bg-black/20">
          <ScrollArea className="h-full pb-20">
            <div className="p-4 pb-24">
              {sidebar}
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-white/5 hover:bg-neon-blue/50 transition-colors" />
        
        <ResizablePanel defaultSize={100 - sidebarWidth}>
          <ScrollArea className="h-full pb-20">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 pb-24"
            >
              {content}
            </motion.div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
