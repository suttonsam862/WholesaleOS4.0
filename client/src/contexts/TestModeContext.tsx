import { createContext, useContext, useState, useEffect } from "react";

interface TestUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
}

interface TestModeContextType {
  isTestMode: boolean;
  testUser: TestUser | null;
  enterTestMode: (user: TestUser) => void;
  exitTestMode: () => void;
}

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  const [testUser, setTestUser] = useState<TestUser | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const savedTestUser = localStorage.getItem("testModeUser");
    if (savedTestUser) {
      try {
        const user = JSON.parse(savedTestUser);
        setTestUser(user);
        setIsTestMode(true);
      } catch (error) {
        console.error("Failed to parse test mode user:", error);
        localStorage.removeItem("testModeUser");
      }
    }
  }, []);

  const enterTestMode = (user: TestUser) => {
    setTestUser(user);
    setIsTestMode(true);
    localStorage.setItem("testModeUser", JSON.stringify(user));
  };

  const exitTestMode = () => {
    setTestUser(null);
    setIsTestMode(false);
    localStorage.removeItem("testModeUser");
  };

  return (
    <TestModeContext.Provider value={{ isTestMode, testUser, enterTestMode, exitTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode() {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error("useTestMode must be used within a TestModeProvider");
  }
  return context;
}
