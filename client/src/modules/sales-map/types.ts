export interface MapEntity {
  id: number;
  type: 'organization' | 'lead';
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
}

export interface MapFeedResponse {
  organizations: MapEntity[];
  leads: MapEntity[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface MapFilters {
  stages?: string[];
  clientTypes?: string[];
  showOrganizations: boolean;
  showLeads: boolean;
  myItemsOnly: boolean;
}

export type MapMode = 'view' | 'find_leads' | 'work_queue';
