import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { User, Bell, Laptop, Link, Shield, Factory } from "lucide-react";

const settingsCards: HubCardConfig[] = [
  {
    id: "account",
    label: "Account Settings",
    description: "Manage your profile and account preferences",
    icon: User,
    ...hubColors.blue,
    count: 0,
    href: "/settings/account",
  },
  {
    id: "notifications",
    label: "Notification Preferences",
    description: "Configure email and in-app notifications",
    icon: Bell,
    ...hubColors.green,
    count: 0,
    href: "/settings/notifications",
  },
  {
    id: "system",
    label: "System Settings",
    description: "Application defaults and system configuration",
    icon: Laptop,
    ...hubColors.purple,
    count: 0,
    href: "/settings/system",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connect external services and APIs",
    icon: Link,
    ...hubColors.orange,
    count: 0,
    href: "/settings/integrations",
  },
  {
    id: "permissions",
    label: "Permissions",
    description: "Manage user roles and access controls",
    icon: Shield,
    ...hubColors.amber,
    count: 0,
    href: "/admin/permissions",
  },
  {
    id: "manufacturing-categories",
    label: "Manufacturing Categories",
    description: "Configure note categories for manufacturing",
    icon: Factory,
    ...hubColors.cyan,
    count: 0,
    href: "/settings/manufacturing-categories",
  },
];

export default function SettingsHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  return (
    <LandingHub
      title="Settings"
      subtitle="Manage your application settings and preferences"
      cards={settingsCards}
      viewAllHref="/settings/account"
      viewAllLabel="Account Settings"
      isLoading={isLoading}
      tip="Use these settings to customize your experience and manage system-wide configurations."
      testIdPrefix="settings"
    />
  );
}
