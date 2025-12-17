import type { EntityType } from "../types";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function BuildingIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 21V7L12 2L21 7V21H15V15H9V21H3Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="7" y="8" width="3" height="3" rx="0.5" fill="white" opacity="0.8" />
      <rect x="14" y="8" width="3" height="3" rx="0.5" fill="white" opacity="0.8" />
    </svg>
  );
}

export function TargetIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function CartIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M3 6H21" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EaselIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 22M12 2L20 22M12 2V14M4 22H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="5" width="12" height="8" rx="1" fill={color} stroke={color} strokeWidth="1.5" />
      <rect x="8" y="7" width="8" height="4" rx="0.5" fill="white" opacity="0.3" />
    </svg>
  );
}

export function ClusterIcon({ size = 24, count = 0, heatLevel = 0.5, className }: IconProps & { count?: number; heatLevel?: number }) {
  const hue = 60 - heatLevel * 60;
  const color = `hsl(${hue}, 100%, 50%)`;
  const glowColor = `hsl(${hue}, 100%, 60%)`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <filter id={`glow-${heatLevel}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`grad-${heatLevel}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="70%" stopColor={glowColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle 
        cx="24" 
        cy="24" 
        r="20" 
        fill={`url(#grad-${heatLevel})`}
        filter={`url(#glow-${heatLevel})`}
      />
      <circle cx="24" cy="24" r="14" fill={color} opacity="0.8" />
      <text 
        x="24" 
        y="24" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fill="white" 
        fontSize="12" 
        fontWeight="bold"
      >
        {count > 99 ? "99+" : count}
      </text>
    </svg>
  );
}

export const ENTITY_COLORS: Record<EntityType, string> = {
  organization: "#3b82f6",
  lead: "#f59e0b",
  order: "#22c55e",
  designJob: "#a855f7",
};

export const STAGE_COLORS: Record<string, string> = {
  future_lead: "#6b7280",
  lead: "#f59e0b",
  hot_lead: "#ef4444",
  mock_up: "#8b5cf6",
  mock_up_sent: "#a855f7",
  team_store_or_direct_order: "#22c55e",
  current_clients: "#10b981",
  no_answer_delete: "#374151",
};

export function getEntityIcon(type: EntityType): typeof BuildingIcon {
  switch (type) {
    case "organization":
      return BuildingIcon;
    case "lead":
      return TargetIcon;
    case "order":
      return CartIcon;
    case "designJob":
      return EaselIcon;
  }
}
