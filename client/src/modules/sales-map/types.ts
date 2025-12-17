export type EntityType = 'organization' | 'lead' | 'order' | 'designJob';

export interface MapEntity {
  id: number;
  type: EntityType;
  name: string;
  lat: number;
  lng: number;
  status?: string;
  stage?: string;
  clientType?: string;
  city?: string;
  state?: string;
  orderCount?: number;
  leadCount?: number;
  ownerUserId?: string;
  logoUrl?: string;
  urgency?: 'low' | 'normal' | 'high' | 'rush';
  priority?: 'low' | 'normal' | 'high';
  deadline?: string;
  estDelivery?: string;
  needsAttention?: boolean;
  attentionReason?: string;
}

export interface MapFeedResponse {
  organizations: MapEntity[];
  leads: MapEntity[];
  orders: MapEntity[];
  designJobs: MapEntity[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface AttentionItem {
  id: number;
  type: EntityType;
  name: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lat?: number;
  lng?: number;
  daysOverdue?: number;
  deadline?: string;
}

export interface AttentionDashboardData {
  overdueOrders: AttentionItem[];
  hotLeads: AttentionItem[];
  stalledDesignJobs: AttentionItem[];
  urgentOrders: AttentionItem[];
  counts: {
    overdueOrders: number;
    hotLeads: number;
    stalledDesignJobs: number;
    urgentOrders: number;
    total: number;
  };
}

export interface MapFilters {
  stages?: string[];
  clientTypes?: string[];
  showOrganizations: boolean;
  showLeads: boolean;
  showOrders: boolean;
  showDesignJobs: boolean;
  myItemsOnly: boolean;
  showAttentionOnly: boolean;
}

export type MapMode = 'view' | 'find_leads' | 'work_queue' | 'attention';

export interface ClusterProperties {
  cluster: boolean;
  cluster_id?: number;
  point_count?: number;
  point_count_abbreviated?: string;
  entityTypes?: Record<EntityType, number>;
  hasAttention?: boolean;
  heatLevel?: number;
}
