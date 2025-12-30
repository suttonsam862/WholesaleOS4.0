export const queryKeys = {
  auth: {
    user: ['/api/user'] as const,
    csrf: ['/api/auth/csrf-token'] as const,
  },
  users: {
    all: ['/api/users'] as const,
    detail: (id: string) => ['/api/users', id] as const,
    me: ['/api/users/me'] as const,
  },
  orders: {
    all: ['/api/orders'] as const,
    detail: (id: number) => ['/api/orders', id] as const,
    tracking: (id: number) => ['/api/orders', id, 'tracking'] as const,
    comments: (id: number) => ['/api/orders', id, 'comments'] as const,
    forms: (id: number) => ['/api/orders', id, 'forms'] as const,
  },
  organizations: {
    all: ['/api/organizations'] as const,
    detail: (id: number) => ['/api/organizations', id] as const,
    contacts: (id: number) => ['/api/organizations', id, 'contacts'] as const,
  },
  contacts: {
    all: ['/api/contacts'] as const,
    detail: (id: number) => ['/api/contacts', id] as const,
  },
  leads: {
    all: ['/api/leads'] as const,
    detail: (id: number) => ['/api/leads', id] as const,
    pipeline: ['/api/leads/pipeline'] as const,
  },
  products: {
    all: ['/api/products'] as const,
    detail: (id: number) => ['/api/products', id] as const,
    variants: (id: number) => ['/api/products', id, 'variants'] as const,
  },
  variants: {
    all: ['/api/variants'] as const,
    detail: (id: number) => ['/api/variants', id] as const,
  },
  categories: {
    all: ['/api/categories'] as const,
    detail: (id: number) => ['/api/categories', id] as const,
  },
  designJobs: {
    all: ['/api/design-jobs'] as const,
    detail: (id: number) => ['/api/design-jobs', id] as const,
    comments: (id: number) => ['/api/design-jobs', id, 'comments'] as const,
  },
  manufacturing: {
    all: ['/api/manufacturing'] as const,
    detail: (id: number) => ['/api/manufacturing', id] as const,
    queue: ['/api/manufacturing/queue'] as const,
    floor: ['/api/manufacturing/floor'] as const,
  },
  manufacturers: {
    all: ['/api/manufacturers'] as const,
    detail: (id: number) => ['/api/manufacturers', id] as const,
  },
  finance: {
    all: ['/api/finance'] as const,
    invoices: ['/api/finance/invoices'] as const,
    payments: ['/api/finance/payments'] as const,
    commissions: ['/api/finance/commissions'] as const,
  },
  quotes: {
    all: ['/api/quotes'] as const,
    detail: (id: number) => ['/api/quotes', id] as const,
  },
  events: {
    all: ['/api/events'] as const,
    detail: (id: number) => ['/api/events', id] as const,
  },
  notifications: {
    all: ['/api/notifications'] as const,
    unread: ['/api/notifications', 'unread'] as const,
  },
  analytics: {
    sales: ['/api/analytics/sales'] as const,
    production: ['/api/analytics/production'] as const,
    system: ['/api/analytics/system'] as const,
  },
  permissions: {
    all: ['/api/permissions'] as const,
    roles: ['/api/permissions/roles'] as const,
    resources: ['/api/permissions/resources'] as const,
  },
  salesMap: {
    feed: ['/api/sales-map/feed'] as const,
  },
} as const;
