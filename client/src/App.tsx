import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TestModeProvider } from "@/contexts/TestModeContext";
import { TestModeBanner } from "@/components/TestModeBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { AppShell } from "@/components/AppShell";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider>
          <TestModeProvider>
            <TooltipProvider>
              <TestModeBanner />
              <Toaster />
              <AppShell />
            </TooltipProvider>
          </TestModeProvider>
        </FeatureFlagProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
