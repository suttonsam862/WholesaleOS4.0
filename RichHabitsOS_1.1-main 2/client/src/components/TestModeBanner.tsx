import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTestMode } from "@/contexts/TestModeContext";
import { AlertCircle, X } from "lucide-react";

export function TestModeBanner() {
  const { isTestMode, testUser, exitTestMode } = useTestMode();

  if (!isTestMode || !testUser) {
    return null;
  }

  return (
    <Alert 
      className="fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 bg-yellow-50 dark:bg-yellow-950 border-yellow-400 dark:border-yellow-600"
      data-testid="test-mode-banner"
    >
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-yellow-800 dark:text-yellow-200">
            Testing Mode Active
          </span>
          <span className="text-yellow-700 dark:text-yellow-300">
            Viewing as: <strong>{testUser.name}</strong> ({testUser.role})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={exitTestMode}
          className="h-auto py-1 px-2 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
          data-testid="button-exit-test-mode"
        >
          <X className="h-4 w-4 mr-1" />
          Exit Test Mode
        </Button>
      </AlertDescription>
    </Alert>
  );
}
