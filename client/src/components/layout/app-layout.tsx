import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { QuickCreateModal } from "@/components/modals/quick-create-modal";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { BackgroundMesh } from "@/components/ui/background-mesh";
import { FloatingDock } from "./floating-dock";
import { MobileFloatingDock } from "./mobile-floating-dock";
import { CommandPalette } from "./command-palette";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleOpenQuickCreate = () => {
    setIsQuickCreateOpen(true);
  };

  const handleCloseQuickCreate = () => {
    setIsQuickCreateOpen(false);
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden relative" data-testid="app-layout">
      <BackgroundMesh />
      
      {/* Mobile Sidebar as Sheet */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-r border-white/10 bg-background/80 backdrop-blur-xl">
            <Sidebar 
              user={user} 
              isMobile={true}
              onNavigate={handleCloseMobileSidebar}
            />
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        <Header 
          title={title} 
          onOpenQuickCreate={handleOpenQuickCreate}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pb-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full p-4 md:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Desktop Floating Dock */}
      {!isMobile && (
        <FloatingDock onSearchClick={() => setIsCommandPaletteOpen(true)} user={user} />
      )}

      {/* Mobile Floating Dock */}
      {isMobile && (
        <MobileFloatingDock onSearchClick={() => setIsCommandPaletteOpen(true)} user={user} />
      )}

      <CommandPalette open={isCommandPaletteOpen} setOpen={setIsCommandPaletteOpen} />

      <QuickCreateModal 
        isOpen={isQuickCreateOpen}
        onClose={handleCloseQuickCreate}
      />
    </div>
  );
}
