import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FeatureFlags, getFeatureFlags, setFeatureFlag as setFeatureFlagStorage } from "@/lib/featureFlags";

interface FeatureFlagContextType {
  flags: FeatureFlags;
  setFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void;
  isEnabled: (key: keyof FeatureFlags) => boolean;
  getAllFlags: () => Record<string, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags);

  useEffect(() => {
    setFlags(getFeatureFlags());
  }, []);

  const setFlag = <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => {
    setFeatureFlagStorage(key, value);
    setFlags((prev) => ({ ...prev, [key]: value }));
  };

  const isEnabled = (key: keyof FeatureFlags): boolean => {
    return flags[key];
  };

  const getAllFlags = (): Record<string, boolean> => {
    return { ...flags };
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, setFlag, isEnabled, getAllFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }
  return context;
}
