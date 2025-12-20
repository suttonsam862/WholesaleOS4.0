import { ReactNode, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { List, FileText } from "lucide-react";

interface SplitViewProps {
  sidebar: ReactNode;
  content: ReactNode;
  sidebarWidth?: number;
  className?: string;
  sidebarTitle?: string;
  contentTitle?: string;
  hasSelection?: boolean;
  onMobileDetailClose?: () => void;
  mobileDetailOpen?: boolean;
}

export function SplitView({ 
  sidebar, 
  content, 
  sidebarWidth = 30, 
  className,
  sidebarTitle = "List",
  contentTitle = "Details",
  hasSelection = false,
  onMobileDetailClose,
  mobileDetailOpen = false,
}: SplitViewProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"list" | "details">("list");

  if (isMobile) {
    return (
      <>
        <div className={cn("flex flex-col h-[calc(100vh-180px)] w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl", className)}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "details")} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-white/10 bg-black/20 p-0 h-12">
              <TabsTrigger 
                value="list" 
                className="rounded-none h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center justify-center gap-2 min-h-[44px]"
                data-testid="tab-mobile-list"
              >
                <List className="h-4 w-4" />
                {sidebarTitle}
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="rounded-none h-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center justify-center gap-2 min-h-[44px]"
                data-testid="tab-mobile-details"
              >
                <FileText className="h-4 w-4" />
                {contentTitle}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 pb-24">
                  {sidebar}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="details" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hasSelection ? "has-selection" : "no-selection"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 pb-24"
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <Sheet open={mobileDetailOpen} onOpenChange={(open) => !open && onMobileDetailClose?.()}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-black/95 border-white/10 backdrop-blur-xl">
            <SheetHeader className="sr-only">
              <SheetTitle>{contentTitle}</SheetTitle>
            </SheetHeader>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
            <ScrollArea className="h-[calc(85vh-60px)]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pb-6"
              >
                {content}
              </motion.div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </>
    );
  }

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
