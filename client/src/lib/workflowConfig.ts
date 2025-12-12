import { LucideIcon } from "lucide-react";

export interface WorkflowStage {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  color: string;
  route: string;
}

export interface SubAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface TileBadge {
  count: number;
  label: string;
  variant?: "default" | "warning" | "success";
}

export interface WorkflowTileConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  primaryAction: { label: string; href: string };
  subActions?: SubAction[];
  badge?: TileBadge;
  visibleToRoles?: string[];
}

export interface QueueColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

export interface WorkflowQueueConfig {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  queryKey: string[];
  filter?: (data: any[]) => any[];
  columns: QueueColumn[];
  rowAction: {
    label?: string;
    href: string | ((row: any) => string);
  };
  emptyState?: {
    message: string;
    icon?: LucideIcon;
  };
  maxRows?: number;
  viewAllHref?: string;
  visibleToRoles?: string[];
}

export interface DomainWorkflowConfig {
  domain: string;
  title: string;
  description: string;
  hubRoute: string;
  stages: WorkflowStage[];
  tiles: WorkflowTileConfig[];
  queues?: WorkflowQueueConfig[];
  roleDefaults?: Record<string, { defaultStage?: string; defaultTile?: string }>;
}

export function filterTilesByRole(tiles: WorkflowTileConfig[], role: string): WorkflowTileConfig[] {
  return tiles.filter(tile => {
    if (!tile.visibleToRoles || tile.visibleToRoles.length === 0) return true;
    return tile.visibleToRoles.includes(role);
  });
}

export function filterQueuesByRole(queues: WorkflowQueueConfig[], role: string): WorkflowQueueConfig[] {
  return queues.filter(queue => {
    if (!queue.visibleToRoles || queue.visibleToRoles.length === 0) return true;
    return queue.visibleToRoles.includes(role);
  });
}
