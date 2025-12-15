export interface FeatureFlags {
  enableRoleHome: boolean;
  enableNewNavigation: boolean;
  salesMapEnabled: boolean;
}

const defaultFlags: FeatureFlags = {
  enableRoleHome: true,  // Enabled by default for workflow-first navigation
  enableNewNavigation: false,
  salesMapEnabled: true,  // Enabled by default for testing - production will use user flag
};

export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") {
    return defaultFlags;
  }

  const stored = localStorage.getItem("featureFlags");
  if (stored) {
    try {
      return { ...defaultFlags, ...JSON.parse(stored) };
    } catch {
      return defaultFlags;
    }
  }

  return defaultFlags;
}

export function setFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): void {
  const current = getFeatureFlags();
  const updated = { ...current, [key]: value };
  localStorage.setItem("featureFlags", JSON.stringify(updated));
}

export function isFeatureEnabled(key: keyof FeatureFlags): boolean {
  return getFeatureFlags()[key];
}

export function getRoleHomePath(role?: string): string {
  if (!role) return "/";
  
  const roleHomePaths: Record<string, string> = {
    admin: "/admin/home",
    sales: "/sales/home",
    designer: "/designer/home",
    ops: "/ops/home",
    manufacturer: "/manufacturer/home",
  };
  
  return roleHomePaths[role] || "/";
}

export function getRoleDashboardPath(role?: string): string {
  if (!role) return "/";
  
  const roleDashboardPaths: Record<string, string> = {
    admin: "/admin/dashboard",
    sales: "/sales/dashboard",
    designer: "/designer/dashboard",
    ops: "/ops/dashboard",
    manufacturer: "/manufacturer/dashboard",
  };
  
  return roleDashboardPaths[role] || "/";
}

export function getDefaultLandingPath(role?: string, enableRoleHome?: boolean): string {
  if (enableRoleHome) {
    return getRoleHomePath(role);
  }
  return "/";
}
