# Rich Habits ERP System - Developer Guide

## Table of Contents
1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Technology Stack](#technology-stack)
4. [Project Architecture](#project-architecture)
5. [Data Model Overview](#data-model-overview)
6. [Core Business Modules](#core-business-modules)
7. [Feature Status](#feature-status)
8. [How Components Work Together](#how-components-work-together)
9. [Authentication & Authorization](#authentication--authorization)
10. [API Structure](#api-structure)
11. [Frontend Architecture](#frontend-architecture)
12. [Key Workflows](#key-workflows)
13. [Known Issues & Technical Debt](#known-issues--technical-debt)
14. [What Needs to Be Built](#what-needs-to-be-built)
15. [What Needs to Be Conceptualized](#what-needs-to-be-conceptualized)
16. [Development Guidelines](#development-guidelines)

---

## Overview

The Rich Habits ERP System is a comprehensive Enterprise Resource Planning application built for **Rich Habits LLC**, a custom athletic apparel manufacturing company. The system manages the complete business workflow from initial sales leads through design, manufacturing, and delivery.

### Key Capabilities
- **Sales Pipeline Management**: Track leads from initial contact through conversion
- **Design Workflow**: Manage design jobs with AI-powered generation capabilities
- **Manufacturing Tracking**: Full production lifecycle with status workflows
- **Order Management**: Complete order lifecycle with line items and size grids
- **Financial Management**: Invoicing, payments, commissions, and QuickBooks integration
- **Team Stores**: Shopify-integrated merchandise stores for teams
- **Event Management**: Full event planning with 10-stage wizard, contractors, budgets

### System Scale
- **90 frontend pages** organized into domain-specific hubs
- **108 database tables** defined in the schema
- **30+ route files** for modular API endpoints
- **7,300+ lines** in the storage layer
- **3,800+ lines** in the shared schema

---

## Business Context

### The Business
Rich Habits LLC manufactures custom athletic apparel - jerseys, shorts, warm-ups, etc. for schools, sports teams, and organizations. Their workflow involves:

1. **Sales** contacts potential clients (high schools, colleges, sports clubs, tours)
2. **Design** creates custom apparel designs based on client requirements
3. **Manufacturing** produces the items (often outsourced to partner manufacturers)
4. **Delivery** ships products to clients
5. **Finance** handles invoicing and payment collection

### User Roles
The system has 6 distinct user roles with different permissions:

| Role | Description | Primary Functions |
|------|-------------|-------------------|
| **Admin** | System administrators | Full access, user management, permissions |
| **Sales** | Sales representatives | Leads, quotes, orders, customer relationships |
| **Designer** | Graphic designers | Design jobs, AI Design Lab, design resources |
| **Ops** | Operations managers | Manufacturing oversight, order coordination |
| **Manufacturer** | External manufacturing partners | Job queue, status updates, specs |
| **Finance** | Financial staff | Invoices, payments, commissions, reporting |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with functional components |
| **TypeScript** | Type safety across the codebase |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (Radix UI based) |
| **TanStack Query v5** | Server state management |
| **wouter** | Lightweight routing |
| **react-hook-form** | Form management with Zod validation |
| **dnd-kit** | Drag and drop functionality |
| **framer-motion** | Animations and transitions |
| **recharts** | Charts and data visualization |
| **maplibre-gl** | Geographic mapping (Sales Map) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | HTTP server framework |
| **TypeScript** | Type safety with ES modules |
| **Drizzle ORM** | Database queries and schema |
| **Zod** | Request validation |
| **bcryptjs** | Password hashing |
| **passport** | Authentication strategies |
| **multer** | File uploads |
| **sharp** | Image processing |
| **jspdf** | PDF generation |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database (Neon serverless) |
| **@neondatabase/serverless** | PostgreSQL client |
| **drizzle-kit** | Database migrations |

### External Services
| Service | Purpose | Status |
|---------|---------|--------|
| **Google Cloud Storage** | File/image storage | Configured |
| **SendGrid** | Transactional emails | Configured |
| **OpenAI** | AI design generation | Integrated |
| **Shopify** | Team stores | Planned |
| **QuickBooks** | Financial sync | Planned |
| **Printful** | Print-on-demand | Planned |

---

## Project Architecture

### Directory Structure
```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/       # Page layouts
│   │   │   ├── modals/       # Modal dialogs
│   │   │   ├── actions/      # Quick action components
│   │   │   ├── kanban/       # Kanban board components
│   │   │   └── role-home/    # Role-specific home pages
│   │   ├── pages/            # 90 page components
│   │   │   ├── actions/      # Quick action pages per domain
│   │   │   └── finance/      # Finance sub-pages
│   │   ├── lib/              # Utilities, config, helpers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   └── modules/          # Feature modules (e.g., sales-map)
│   
├── server/                    # Backend Express application
│   ├── routes/               # 30+ route files by domain
│   │   ├── orders.routes.ts  # 85KB - Order management
│   │   ├── manufacturing.routes.ts # 100KB - Production
│   │   ├── events.routes.ts  # 68KB - Event management
│   │   ├── design-lab.routes.ts # 56KB - AI Design Lab
│   │   └── ...
│   ├── middleware/           # Auth, permissions, rate limiting
│   ├── routes.ts             # Legacy main routes (274KB)
│   ├── storage.ts            # Data access layer (7,371 lines)
│   ├── permissions.ts        # RBAC system
│   ├── objectStorage.ts      # GCS integration
│   └── replitAuth.ts         # Replit OpenID Connect auth
│   
├── shared/                    # Shared code between frontend/backend
│   └── schema.ts             # Drizzle schema (3,839 lines, 108 tables)
│   
├── migrations/               # Database migrations
├── scripts/                  # Utility scripts
├── tests/                    # Test files
└── docs/                     # Documentation
```

### Code Flow Pattern
```
User Action → React Component → TanStack Query → Express Route → Storage Layer → Database
                    ↑                                                    ↓
                    └──────────────── JSON Response ←────────────────────┘
```

---

## Data Model Overview

The database has **108 tables** organized into these major domains:

### Core Entities
| Table | Records | Purpose |
|-------|---------|---------|
| `users` | Staff accounts | Role-based system users |
| `organizations` | Client companies | Schools, clubs, teams |
| `contacts` | Client contacts | People within organizations |
| `leads` | Sales pipeline | Potential customers |
| `orders` | Customer orders | Finalized purchases |
| `orderLineItems` | Order details | Products with size grids |

### Product Catalog
| Table | Purpose |
|-------|---------|
| `categories` | Product categories (Jerseys, Shorts, etc.) |
| `products` | Product definitions with base pricing |
| `productVariants` | Color/size/material variants |
| `variantSpecifications` | Detailed variant specs |

### Design System
| Table | Purpose |
|-------|---------|
| `designJobs` | Design job tracking |
| `designJobComments` | Job comments/feedback |
| `designProjects` | AI Design Lab projects |
| `designVersions` | Version history |
| `designLayers` | Layer-based composition |
| `designTemplates` | Base product templates |
| `designGenerationRequests` | AI generation tracking |
| `designStylePresets` | AI style configurations |
| `designAiTrainingSets` | Training data for AI |

### Manufacturing
| Table | Purpose |
|-------|---------|
| `manufacturers` | Manufacturing partners |
| `manufacturing` | Production records per order |
| `manufacturingUpdates` | Status change history |
| `manufacturingUpdateLineItems` | Per-item workflow tracking |
| `manufacturingBatches` | Batch production grouping |
| `manufacturerJobs` | Manufacturer portal workflow |
| `manufacturerEvents` | Structured event log |

### Financial
| Table | Purpose |
|-------|---------|
| `quotes` | Price quotes |
| `quoteLineItems` | Quote line items |
| `invoices` | Order invoices |
| `invoicePayments` | Payment records |
| `commissions` | Sales commissions |
| `commissionPayments` | Commission payments |
| `productCogs` | Cost of goods sold |
| `financialTransactions` | General transactions |

### Events System
| Table | Purpose |
|-------|---------|
| `events` | Event records |
| `eventStages` | 10-stage wizard progress |
| `eventStaff` | Event staff assignments |
| `eventContractors` | External contractors |
| `eventMerchandise` | Inventory allocation |
| `eventBudgets` | Budget planning |
| `eventRegistrations` | Attendee tracking |
| `eventSponsors` | Sponsorship management |
| `eventTicketTiers` | Ticket pricing |
| `eventTasks` | Event task management |

### Permissions
| Table | Purpose |
|-------|---------|
| `roles` | System roles |
| `resources` | Protected resources/pages |
| `rolePermissions` | Role-to-resource permissions |
| `userPermissions` | User-specific overrides |

---

## Core Business Modules

### 1. Sales & Leads Module

**Purpose**: Track potential customers through the sales pipeline

**Lead Stages**:
1. `future_lead` - Not yet contacted
2. `lead` - Initial contact made
3. `hot_lead` - Actively interested
4. `mock_up` - Design mockup requested
5. `mock_up_sent` - Mockup delivered
6. `team_store_or_direct_order` - Ready for order
7. `current_clients` - Converted customer
8. `no_answer_delete` - Dead lead

**Key Pages**:
- `/leads` - Leads hub
- `/leads/list` - Lead list with filters
- `/pipeline-view` - Kanban pipeline view
- `/completed-leads` - Archived/converted leads
- `/order-map` - Geographic lead visualization

**Related Tables**: `leads`, `organizations`, `contacts`, `salespersons`, `communicationLogs`

### 2. Design Module

**Purpose**: Manage design jobs and AI-powered design creation

**Design Job Status Flow**:
```
pending → assigned → in_progress → review → approved/rejected → completed
```

**Key Pages**:
- `/design-jobs` - Design jobs hub
- `/design-jobs/list` - Job list
- `/design-jobs/:id` - Job detail with comments
- `/design-lab` - AI Design Lab project list
- `/design-lab/project/:id` - Full-screen design editor
- `/design-lab/admin` - Admin template/preset management
- `/design-portfolio` - Completed design showcase
- `/design-resources` - Design asset library

**AI Design Lab Features**:
- Project creation with version history
- AI design generation using OpenAI
- Layer-based editing (typography, logos, graphics)
- Front/back view toggle
- Template compositing onto product images
- Style presets for AI generation
- Admin tools for training sets

### 3. Orders Module

**Purpose**: Manage customer orders through the complete lifecycle

**Order Status Flow**:
```
new → waiting_sizes → design_created → sizes_validated → invoiced → production → shipped → completed
```

**Key Pages**:
- `/orders` - Orders hub
- `/orders/list` - Order list
- `/orders/:id` - Full-screen order detail
- `/order-specifications` - Specification viewer
- `/customer-order-form/:id` - Public size submission form
- `/customer-portal/:id` - Customer tracking portal

**Line Item Features**:
- Size grid (YXS through XXXXL)
- Auto-calculated totals
- Manufacturing notes per item
- Manufacturer assignments

### 4. Manufacturing Module

**Purpose**: Track production from start to completion

**Public Status Values** (for customer visibility):
- `awaiting_admin_confirmation`
- `confirmed`
- `materials_ordered`
- `in_production`
- `quality_check`
- `ready_to_ship`
- `shipped`
- `delivered`

**Manufacturer Status Values** (detailed internal tracking):
- `intake_pending`
- `specs_lock_review`
- `specs_locked`
- `materials_reserved`
- `samples_in_progress`
- `samples_awaiting_approval`
- `samples_approved`
- `bulk_cutting`
- `bulk_print_emb_sublim`
- `bulk_stitching`
- `bulk_qc`
- `packing_complete`
- `handed_to_carrier`
- `delivered_confirmed`

**Key Pages**:
- `/manufacturing` - Manufacturing hub
- `/manufacturing/list` - Production list
- `/manufacturing/board` - Kanban board view
- `/capacity-dashboard` - Capacity planning
- `/manufacturer-portal` - Manufacturer login area
- `/manufacturer-queue` - Manufacturer's job queue
- `/manufacturer-job-detail` - Job detail for manufacturers

**Features**:
- First piece approval workflow
- Materials checklist
- Quality checkpoints
- Finished product images
- Batch grouping

### 5. Catalog Module

**Purpose**: Manage product catalog with variants

**Key Pages**:
- `/catalog` - Catalog hub
- `/catalog/list` - Category/product list
- `/catalog/category/:categoryId` - Products in category
- `/catalog/product/:productId` - Product variants
- `/catalog/variant/:variantId/designs` - Design archive
- `/admin/catalog` - Admin category management

**Product Structure**:
```
Category
  └── Product (SKU, base price, sizes)
       └── Variant (color, material, MSRP, cost)
            ├── frontTemplateUrl
            ├── backTemplateUrl
            └── defaultManufacturer
```

### 6. Finance Module

**Purpose**: Manage invoicing, payments, and commissions

**Key Pages**:
- `/finance` - Finance hub
- `/finance/overview` - Financial dashboard
- `/finance/invoices` - Invoice management
- `/finance/payments` - Payment tracking
- `/finance/commissions` - Commission calculations
- `/finance/matching` - Financial matching tool
- `/finance/expenses` - Expense tracking

**Invoice Status Flow**:
```
draft → sent → partial → paid/overdue
```

### 7. Events Module

**Purpose**: Plan and execute events with a 10-stage wizard

**Event Types**: small-scale, large-scale, seminar, clinic, camp

**Event Status Flow**:
```
draft → planning → approved → live → completed → archived
```

**10 Stage Wizard**:
1. Overview - Basic event info
2. Branding - Theme, colors, logos
3. Staff - Internal staff assignments
4. Contractors - External hires (clinicians, photographers)
5. Merchandise - Inventory allocation
6. Budget - Financial planning
7. Marketing - Campaigns and promotions
8. Registration - Ticket tiers and attendees
9. Logistics - Venues, equipment, travel
10. Post-Event - Wrap-up and reporting

**Key Pages**:
- `/events` - Events hub
- `/events/list` - Event list
- `/event-wizard` - Event creation wizard
- `/event-detail/:id` - Event management
- `/customer-event-portal/:id` - Public event page

### 8. Team Stores Module

**Purpose**: Manage team merchandise stores

**Key Pages**:
- `/team-stores` - Team stores hub
- `/team-stores/list` - Store list

**Store Lifecycle**:
- Create store linked to order/organization
- Set open/close dates
- Track sales per line item

### 9. Quotes Module

**Purpose**: Create and send price quotes to prospects

**Quote Status Flow**:
```
draft → sent → accepted/rejected/expired
```

**Key Pages**:
- `/quotes` - Quotes hub
- `/quotes/list` - Quote list

**Features**:
- Line items with quantity/pricing
- Tax calculations
- Quote validity period
- Convert quote to order

---

## Feature Status

### ✅ Fully Complete & Working

| Feature | Notes |
|---------|-------|
| User Authentication | Replit Auth (OIDC) + local login |
| Role-Based Access Control | 6 roles with granular permissions |
| Permission Management UI | Admin can configure per-role access |
| Session Management | PostgreSQL session store |
| Rate Limiting | General + auth-specific |
| CSRF Protection | Token-based |
| Lead Management | Full CRUD, pipeline, archiving |
| Organization Management | Full CRUD with contacts |
| Contact Management | Full CRUD |
| Product Catalog | Categories, products, variants |
| Order Management | Full lifecycle with line items |
| Size Grid System | 12-size grid (YXS-XXXXL) |
| Customer Order Form | Public size submission |
| Customer Portal | Order tracking for customers |
| Design Jobs | Full workflow with comments |
| AI Design Lab | Projects, versions, layers |
| AI Design Generation | OpenAI integration |
| Template Compositing | Sharp-based image processing |
| Style Presets | Admin-managed AI presets |
| Manufacturing Tracking | Full production workflow |
| Manufacturer Portal | External manufacturer access |
| First Piece Approval | QC workflow |
| Quote Management | Full CRUD with line items |
| Invoice Management | Create, send, track |
| Payment Recording | Multiple payment methods |
| Commission Tracking | Automatic calculation |
| Notification System | In-app notifications |
| File Uploads | GCS integration |
| PDF Generation | Orders, quotes, reports |
| Mobile Responsive | Touch-first design |
| Dark Mode | Theme toggle |

### ⚠️ Partially Complete

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Events System | 80% | Some wizard stages need refinement |
| Financial Matching | 70% | Custom entry workflows |
| Team Stores | 60% | Shopify sync not connected |
| Sales Map | 70% | Some geocoding edge cases |
| Fabric Management | 80% | Approval workflow refinement |
| Communication Logs | 70% | Email/SMS integration |
| Audit Logging | 50% | Not all entities logged |

### ❌ Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Shopify Integration | High | Team store sync |
| QuickBooks Integration | High | Invoice/payment sync |
| Printful Integration | Medium | Print-on-demand |
| Pantone Connect API | Medium | Color matching |
| Email Notifications | Medium | SendGrid configured but not triggered |
| SMS Notifications | Low | Not started |
| Advanced Reporting | Medium | BI dashboard |
| Inventory Management | Medium | Real warehouse tracking |

---

## How Components Work Together

### Order Creation Flow
```
1. Lead converted to opportunity
   └── leads.stage = 'team_store_or_direct_order'

2. Quote created for pricing
   └── quotes (quoteName, org, lineItems)
   
3. Quote accepted → Order created
   └── orders (orderCode, status='new')
   └── orderLineItems (variants, prices, empty sizes)

4. Customer fills size form
   └── orderFormSubmissions
   └── orderFormLineItemSizes
   └── orders.status = 'waiting_sizes'

5. Sizes validated by staff
   └── orders.sizesValidated = true
   └── orders.status = 'sizes_validated'

6. Design job created/completed
   └── designJobs (linked to order)
   └── orders.status = 'design_created'

7. Invoice generated
   └── invoices (linked to order)
   └── orders.status = 'invoiced'

8. Manufacturing record created
   └── manufacturing (linked to order)
   └── manufacturingUpdates (status history)
   └── manufacturerJobs (manufacturer workflow)
   └── orders.status = 'production'

9. Production completed
   └── manufacturingFinishedImages
   └── orderTrackingNumbers
   └── orders.status = 'shipped'

10. Delivery confirmed
    └── orders.status = 'completed'
```

### Design Lab Flow
```
1. Project created
   └── designProjects (projectCode, userId)
   
2. Initial version auto-created
   └── designVersions (v1, empty)

3. User creates layers
   └── designLayers (typography/logo/graphic)
   └── Position, size, view (front/back)

4. AI generation requested
   └── designGenerationRequests (prompt, status='pending')
   └── OpenAI generates image
   └── Image composited onto template
   └── designVersions updated with URLs

5. User iterates
   └── New versions created
   └── Layer modifications
   └── Typography iterations

6. Project finalized
   └── designProjects.status = 'finalized'
   └── Linked to designJob if applicable
```

### Permission System Flow
```
Request → isAuthenticated middleware
  └── Verify session
  └── Load user from DB

Request → loadUserData middleware
  └── Attach user.userData to request

Request → requirePermission('resource', 'action')
  └── Check rolePermissions table
  └── Check userPermissions override
  └── Grant or deny (403)

Route handler
  └── filterDataByRole() removes sensitive fields
  └── stripFinancialData() for manufacturers
```

---

## Authentication & Authorization

### Authentication Methods

**1. Replit Auth (Primary)**
- OpenID Connect with Replit as identity provider
- Session stored in PostgreSQL (`sessions` table)
- Automatic user creation on first login
- Profile data synced from Replit

**2. Local Auth (Development)**
- Email/password authentication
- bcrypt password hashing
- Test user accounts for development
- `/local-login` page

### Authorization (RBAC)

**Database Tables**:
- `roles` - Role definitions (admin, sales, designer, ops, manufacturer, finance)
- `resources` - Pages/features that can be protected
- `rolePermissions` - Role-to-resource permissions with CRUD flags
- `userPermissions` - User-specific overrides

**Permission Flags**:
- `canView` - Can see the resource
- `canCreate` - Can create new records
- `canEdit` - Can modify existing records
- `canDelete` - Can delete records
- `pageVisible` - Shows in navigation

**Frontend Guards**:
```tsx
<PermissionGuard resource="orders" action="view">
  <OrdersPage />
</PermissionGuard>

<RoleGuard allowedRoles={["admin", "ops"]}>
  <AdminContent />
</RoleGuard>
```

**Backend Middleware**:
```typescript
router.get('/orders', 
  isAuthenticated, 
  loadUserData, 
  requirePermission('orders', 'view'),
  handler
);
```

---

## API Structure

### Route Organization

The API is split across modular route files in `server/routes/`:

| File | Size | Domain |
|------|------|--------|
| `manufacturing.routes.ts` | 100KB | Production management |
| `orders.routes.ts` | 85KB | Order management |
| `events.routes.ts` | 68KB | Event management |
| `design-lab.routes.ts` | 56KB | AI Design Lab |
| `finance.routes.ts` | 43KB | Invoices, payments |
| `catalog.routes.ts` | 39KB | Products, variants |
| `quotes.routes.ts` | 34KB | Quote management |
| `design.routes.ts` | 28KB | Design jobs |
| `sales-map.routes.ts` | 25KB | Geographic mapping |
| `manufacturer-portal.routes.ts` | 20KB | Manufacturer access |
| `analytics.routes.ts` | 17KB | System analytics |
| `permissions.routes.ts` | 16KB | RBAC management |
| `financial-matching.routes.ts` | 15KB | Financial matching |
| `users.routes.ts` | 14KB | User management |
| `auth.routes.ts` | 12KB | Authentication |
| `team-stores.routes.ts` | 12KB | Team stores |
| `tasks.routes.ts` | 12KB | Task management |
| `manufacturer.routes.ts` | 10KB | Manufacturer CRUD |
| `leads.routes.ts` | 9KB | Lead management |
| `organizations.routes.ts` | 9KB | Org management |
| `invitations.routes.ts` | 9KB | User invitations |
| `manufacturing-notes.routes.ts` | 9KB | Production notes |
| `upload.routes.ts` | 9KB | File uploads |
| `requests.routes.ts` | 8KB | Issue/change requests |
| `contacts.routes.ts` | 5KB | Contact management |
| `salespeople.routes.ts` | 5KB | Salesperson profiles |
| `config.routes.ts` | 5KB | System configuration |

### API Patterns

**List Endpoints**:
```
GET /api/orders
GET /api/orders?status=production&page=1&limit=20
```

**CRUD Endpoints**:
```
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id
DELETE /api/orders/:id
```

**Nested Resources**:
```
GET  /api/orders/:id/line-items
POST /api/orders/:id/line-items
GET  /api/design-lab/projects/:id/versions
POST /api/design-lab/projects/:id/layers
```

**Actions**:
```
POST /api/orders/:id/ship
POST /api/design-lab/generate
POST /api/manufacturing/:id/approve-first-piece
```

### Storage Layer

All database operations go through `server/storage.ts`:

```typescript
// Storage interface example
interface IStorage {
  // Users
  getUsers(): Promise<User[]>
  getUser(id: string): Promise<User | undefined>
  upsertUser(user: UpsertUser): Promise<User>
  
  // Orders
  getOrders(): Promise<Order[]>
  getOrder(id: number): Promise<Order | undefined>
  createOrder(order: InsertOrder): Promise<Order>
  updateOrder(id: number, order: Partial<Order>): Promise<Order>
  
  // ... 200+ methods
}
```

---

## Frontend Architecture

### Routing Configuration

Routes are defined in `client/src/lib/routesConfig.ts`:

```typescript
export const authenticatedRoutes: RouteConfig[] = [
  { 
    path: "/orders", 
    title: "Orders Hub", 
    component: OrdersHub, 
    requiresAuth: true, 
    requiresLayout: true, 
    resource: "orders" 
  },
  // ...
];
```

### State Management

**Server State**: TanStack Query
```typescript
const { data: orders, isLoading } = useQuery({
  queryKey: ['/api/orders'],
  // Default fetcher handles the request
});

const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/orders', 'POST', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/orders'] }),
});
```

**Local State**: React useState/useReducer
**Theme State**: next-themes
**Feature Flags**: FeatureFlagContext

### Component Patterns

**Hub Pages**: Domain landing pages with quick actions and navigation
```
/leads → LeadsHub → Quick actions, stats, links to list/actions
```

**List Pages**: Data tables with filters and CRUD
```
/leads/list → LeadsList → Table, filters, modals
```

**Detail Pages**: Full-screen editors
```
/orders/:id → OrderDetail → Tabs, line items, actions
```

**Action Pages**: Guided workflows
```
/orders/actions → OrdersActions → Quick action wizards
```

### Form Handling

```typescript
const form = useForm<InsertOrder>({
  resolver: zodResolver(insertOrderSchema),
  defaultValues: { orderName: '', status: 'new' }
});

<Form {...form}>
  <FormField 
    control={form.control} 
    name="orderName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Order Name</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

---

## Key Workflows

### User Invitation Flow
1. Admin creates invitation with email, name, role
2. System generates unique token with expiration
3. Email sent (if SendGrid configured)
4. User clicks link → `/setup-account?token=xxx`
5. User sets password, completes profile
6. User account created with assigned role

### Quote to Order Conversion
1. Create quote with line items
2. Send quote to customer
3. Customer accepts
4. Click "Convert to Order"
5. Order created with same line items
6. Quote status = 'accepted', linked to order

### Manufacturing Assignment
1. Order status reaches 'production'
2. Manufacturing record auto-created
3. Ops assigns manufacturer
4. ManufacturerJob created
5. Manufacturer sees in their portal
6. Status progresses through internal workflow
7. Public status updates for customer visibility

---

## Known Issues & Technical Debt

### Code Organization
- **server/routes.ts is 274KB**: Legacy monolithic file that should be fully migrated to modular route files
- **server/storage.ts is 7,371 lines**: Consider splitting by domain
- **shared/schema.ts is 3,839 lines**: Very large, but schema benefits from being unified

### Data Inconsistencies
- `users.active` vs `users.isActive` - duplicate boolean fields
- `manufacturing.manufacturerId` is legacy - use `orderLineItemManufacturers` junction table
- Some tables use `serial` while others use `generatedAlwaysAsIdentity()`

### Missing Features
- No soft delete cascade handling in some places
- Audit logging incomplete for many operations
- No rate limiting on some public endpoints

### Performance
- Some list queries could benefit from pagination enforcement
- Large image handling needs optimization
- No caching layer for frequently accessed data

### Testing
- Limited test coverage
- E2E tests exist but not comprehensive
- Unit tests sparse

---

## What Needs to Be Built

### High Priority

1. **Shopify Integration**
   - Connect team stores to Shopify
   - Sync products, orders, inventory
   - Handle webhooks for real-time updates

2. **QuickBooks Integration**
   - Sync invoices to QuickBooks
   - Import payments from QuickBooks
   - Reconciliation workflow

3. **Email Notification System**
   - Triggered emails for key events (order status, invoice, etc.)
   - Email templates with branding
   - Delivery tracking

4. **Full Event Wizard Implementation**
   - Complete all 10 stages with validation
   - Stage-specific forms and data persistence
   - Event duplication

### Medium Priority

5. **Advanced Reporting Dashboard**
   - Sales by period, salesperson, organization
   - Manufacturing throughput metrics
   - Financial P&L summaries

6. **Inventory Management**
   - Warehouse locations
   - Stock levels per variant
   - Low stock alerts

7. **Printful Integration**
   - Print-on-demand ordering
   - Product sync
   - Order fulfillment

8. **SMS Notifications**
   - Twilio integration
   - Opt-in management
   - Template system

### Lower Priority

9. **Pantone Color Matching**
   - API integration for color lookup
   - Image color sampling
   - Match quality scoring

10. **Mobile App / PWA**
    - Native-like experience
    - Push notifications
    - Offline capabilities

---

## What Needs to Be Conceptualized

### Business Questions

1. **Multi-tenant Architecture**
   - Should this support multiple companies (white-label)?
   - What data isolation would be needed?

2. **Subscription/Billing**
   - How would the ERP itself be monetized?
   - Feature tiers?

3. **Customer Self-Service**
   - How much can customers do themselves?
   - Reorder workflows?
   - Design history access?

4. **Manufacturer Onboarding**
   - How do new manufacturers get access?
   - What training/documentation?

### Technical Questions

1. **Data Backup & Recovery**
   - Beyond Neon's built-in features
   - Point-in-time recovery needs?

2. **Scalability**
   - Current architecture limits?
   - Database sharding strategy?
   - CDN for static assets?

3. **Real-time Features**
   - WebSocket for live updates?
   - Collaborative editing (multiple users on same order)?

4. **Analytics Infrastructure**
   - Separate analytics database?
   - Event tracking system?
   - Third-party analytics (Mixpanel, Amplitude)?

5. **API for External Systems**
   - Public API documentation?
   - API keys and rate limits?
   - Webhook system for integrations?

---

## Development Guidelines

### Running the Application
```bash
npm run dev        # Start development server (Express + Vite)
npm run build      # Build for production
npm run start      # Run production build
npm run db:push    # Push schema changes to database
npm run check      # TypeScript type checking
npm run test       # Run tests
```

### Code Style
- TypeScript strict mode
- Functional React components with hooks
- ESM imports (no CommonJS)
- Tailwind for styling (no inline styles)
- Zod for all validation
- Drizzle for database queries

### Adding a New Feature
1. Define schema in `shared/schema.ts`
2. Create insert schema with Zod validation
3. Add storage methods in `server/storage.ts`
4. Create route file in `server/routes/`
5. Register routes in `server/routes/index.ts`
6. Create frontend pages in `client/src/pages/`
7. Add route config in `client/src/lib/routesConfig.ts`
8. Add permission resource if needed
9. Test with multiple roles

### Database Migrations
```bash
npm run db:push    # Apply schema changes (dev only)
```
For production, use proper migration files via `drizzle-kit`.

### Environment Variables
Key variables needed:
- `DATABASE_URL` - PostgreSQL connection string
- `REPLIT_DEPLOYMENT` - Deployment environment
- `GOOGLE_CLOUD_*` - GCS credentials
- `SENDGRID_API_KEY` - Email service
- `OPENAI_API_KEY` - AI design generation

---

## Getting Help

- Check `replit.md` for high-level project context
- Review existing route files for API patterns
- Look at similar pages for frontend patterns
- Test with different user roles to understand permissions
- Check browser console and server logs for debugging

---

# PART 2: DEEP TECHNICAL ANALYSIS

This section provides 10x more detail on the codebase, including architectural analysis, code quality assessment, bugs, inconsistencies, and precise build status of every component.

---

## 17. Architectural Deep Dive

### 17.1 How the Request-Response Cycle Works

**Complete Flow for a Typical Request (e.g., GET /api/orders/123)**:

```
1. BROWSER
   └── User clicks order link
   └── React Router (wouter) matches /orders/:id
   └── OrderDetail component mounts
   └── useQuery({ queryKey: ['/api/orders', 123] }) fires

2. FRONTEND QUERY LAYER (client/src/lib/queryClient.ts)
   └── buildUrlFromQueryKey() → "/api/orders/123"
   └── Validates URL starts with /api
   └── fetch("/api/orders/123", { credentials: "include" })
   └── Session cookie automatically included

3. EXPRESS SERVER (server/index.ts)
   └── Request hits Express middleware chain:
       ├── express.json() - Parse body
       ├── cookieParser() - Parse cookies
       ├── session() - Load session from PostgreSQL
       ├── passport.session() - Deserialize user
       └── Rate limiter check

4. ROUTE HANDLER (server/routes/orders.routes.ts)
   └── isAuthenticated middleware
       └── Check req.isAuthenticated()
       └── If false: 401 Unauthorized
   └── loadUserData middleware
       └── Fetch full user from DB
       └── Attach to req.user.userData
   └── requirePermission('orders', 'view')
       └── Check PERMISSIONS[role].orders.read
       └── Check database rolePermissions table
       └── Check database userPermissions table
       └── If denied: 403 Forbidden
   └── Route handler executes

5. STORAGE LAYER (server/storage.ts)
   └── storage.getOrderWithLineItems(123)
   └── Drizzle ORM query with relations
   └── Returns Order & { lineItems: OrderLineItem[] }

6. DATA TRANSFORMATION
   └── filterDataByRole() - Remove fields based on role
   └── stripFinancialData() - Remove prices for manufacturers
   └── JSON.stringify response

7. BACK TO BROWSER
   └── Response received
   └── throwIfResNotOk() checks status
   └── JSON parsed
   └── TanStack Query caches result
   └── Component re-renders with data
```

### 17.2 Dual Permission Systems (Complexity/Debt)

The app has **TWO overlapping permission systems** that create confusion:

**System 1: Hardcoded PERMISSIONS Object** (`server/permissions.ts`)
```typescript
export const PERMISSIONS = {
  admin: {
    leads: { read: true, write: true, delete: true, viewAll: true },
    // ...
  },
  sales: {
    leads: { read: true, write: true, delete: false, viewAll: false },
    // ...
  }
};
```
- Defined in code, cannot be changed without deployment
- Used by `requirePermission()` middleware
- 6 roles × 26 resources = 156 permission configurations

**System 2: Database Permission Tables** (`shared/schema.ts`)
```typescript
roles, resources, rolePermissions, userPermissions
```
- Stored in database, editable via Admin UI
- Supports user-level overrides
- Has `pageVisible` flag for navigation control

**The Problem**: Both systems are checked, but they don't always agree. The code tries to merge them:
```typescript
// In loadUserData middleware
const dbPermissions = await storage.getRolePermissions(user.role);
// Merge with PERMISSIONS constant...
```

**Result**: Sometimes permissions work, sometimes they don't. Inconsistent behavior across the app.

**Recommendation**: Pick ONE system. The database approach is more flexible but requires migration of all hardcoded permissions.

### 17.3 The Storage Layer Pattern

The `server/storage.ts` file is a **Data Access Object (DAO)** pattern implementation:

**Structure**:
```typescript
export interface IStorage {
  // 200+ method signatures
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | null>;
  deleteOrder(id: number): Promise<void>;
  // ...
}

export class MemStorage implements IStorage {
  // In-memory implementation (not used)
}

export class DatabaseStorage implements IStorage {
  // Drizzle ORM implementation (active)
}

export const storage = new DatabaseStorage();
```

**What Works Well**:
- All database access is centralized
- Type-safe with Drizzle ORM
- Relations are handled consistently
- Insert schemas validate data before DB operations

**What's Problematic**:
- 7,371 lines in one file - massive cognitive load
- No domain separation (orders, leads, manufacturing all mixed)
- Some methods have complex role-based filtering built in
- 17 active TypeScript errors in the file (see Bug Analysis)

**Recommended Refactor**:
```
server/storage/
├── index.ts          # Re-exports all modules
├── users.storage.ts
├── orders.storage.ts
├── leads.storage.ts
├── manufacturing.storage.ts
├── design.storage.ts
├── events.storage.ts
└── finance.storage.ts
```

### 17.4 Frontend State Management Architecture

**Server State: TanStack Query v5**

The app uses TanStack Query for ALL server-side data. This is well-implemented:

```typescript
// Typical pattern in pages
const { data: orders, isLoading, error } = useQuery<Order[]>({
  queryKey: ['/api/orders'],
  // queryFn uses default from queryClient.ts
});

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/orders', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    toast({ title: 'Order created' });
  }
});
```

**Custom queryClient Configuration** (`client/src/lib/queryClient.ts`):
- Default queryFn handles all GET requests
- CSRF token automatically injected for mutations
- Global error handling with toast notifications
- Caches data for 30 seconds (staleTime)
- Keeps unused data for 5 minutes (gcTime)

**Client State**: Pure React hooks (useState, useReducer, useContext)

**Forms**: react-hook-form with zodResolver
```typescript
const form = useForm<InsertOrder>({
  resolver: zodResolver(insertOrderSchema),
  defaultValues: { status: 'new' }
});
```

### 17.5 The Hub-List-Detail Page Pattern

The frontend follows a consistent pattern for each domain:

```
/{domain}          → Hub page (overview, quick actions, navigation)
/{domain}/list     → List page (data table, filters, search)
/{domain}/:id      → Detail page (full editor, tabs, actions)
/{domain}/actions  → Quick action wizards
```

**Example - Orders**:
```
/orders           → OrdersHub (stage counts, quick actions)
/orders/list      → OrdersList (full table, filters)
/orders/:id       → OrderDetail (line items, manufacturing, invoices)
/orders/actions   → OrdersActions (quick create, ship, invoice wizards)
```

**Hub Page Structure**:
1. Header with title and "View All" button
2. Stage/status cards showing counts
3. Quick action buttons (ActionDeck component)
4. Role-specific content filtering

**List Page Structure**:
1. Filters (status, date, salesperson, etc.)
2. Data table with pagination
3. Row click → navigate to detail
4. Create button (if permission)

**Detail Page Structure**:
1. Header with back button, title, status badge
2. Tabbed interface (Info, Line Items, Manufacturing, etc.)
3. Action buttons (Save, Delete, Archive)
4. Related data in cards/sections

---

## 18. Code Quality Analysis

### 18.1 What's Well-Built

**1. TanStack Query Integration** (★★★★★)
- Consistent patterns across all pages
- Proper cache invalidation
- Global error handling
- Type-safe query keys

**2. Drizzle ORM Schema** (★★★★☆)
- Comprehensive type definitions
- Good use of relations
- Proper indexes on foreign keys
- Insert schemas with Zod validation

**3. shadcn/ui Component Library** (★★★★★)
- Consistent design system
- Accessible components (Radix UI base)
- Good dark mode support
- Properly themed

**4. AI Design Lab** (★★★★★)
- Well-architected with versioning
- Layer-based composition
- OpenAI integration works
- Image compositing with Sharp

**5. Manufacturing Status System** (★★★★☆)
- Dual-status approach (public vs internal)
- First-piece approval workflow
- Comprehensive update tracking

**6. CSRF Protection** (★★★★☆)
- Token-based system
- Automatic injection in mutations
- Properly validated on server

### 18.2 What's Poorly Built

**1. Legacy routes.ts** (★☆☆☆☆)
- 274KB, 7,294 lines of monolithic code
- Duplicates much of the modular route files
- Contains dead code and old patterns
- Should be deleted after full migration

**2. Permission System Duplication** (★★☆☆☆)
- Two competing systems (code vs database)
- Inconsistent behavior
- Hard to debug permission issues

**3. Error Handling** (★★☆☆☆)
- 505 try/catch blocks but inconsistent patterns
- Many routes don't differentiate error types
- Generic 500 errors hide real issues

**4. Test Coverage** (★☆☆☆☆)
- Only 2 test files exist:
  - `tests/integration/health.test.ts`
  - `tests/unit/localAuth.test.ts`
- 90+ pages with no tests
- No E2E tests

**5. Debug Logging Left in Production** (★☆☆☆☆)
- 223 console.log statements in route files
- 602 console.error statements
- Many with `[DEBUG]` prefix meant to be removed
- Example: `console.log('🔍 [DEBUG] POST /api/orders started');`

**6. Type Safety in Storage Layer** (★★☆☆☆)
- 17 TypeScript errors currently
- Type mismatches between schema and insert types
- null vs undefined inconsistencies

### 18.3 Inconsistency Catalog

**Schema Inconsistencies**:

| Issue | Location | Details |
|-------|----------|---------|
| `active` vs `isActive` | users table | Both exist: `active: boolean` AND `isActive: boolean` |
| `serial` vs `generatedAlwaysAsIdentity` | Various tables | Most use `generatedAlwaysAsIdentity()` but some legacy use `serial` |
| Status type definitions | Multiple tables | Some use string literals, others use type narrowing |
| Timestamp handling | Insert types | Some accept strings, some require Dates |

**Detailed Field Duplication in Users Table**:
```typescript
// In shared/schema.ts - users table
active: boolean("active").default(true), // Legacy field - use isActive instead
isActive: boolean("is_active").default(true),
```
This causes confusion - which field is authoritative?

**API Response Inconsistencies**:

| Issue | Details |
|-------|---------|
| Pagination | Some endpoints paginate, others return all |
| Error format | Some return `{ message }`, others `{ error }` |
| Empty responses | Some return `[]`, others `null` |
| Date format | Some ISO strings, some Date objects |

**Route Registration Inconsistencies**:

Some routes are in:
1. `server/routes.ts` (legacy monolith)
2. `server/routes/*.routes.ts` (modular files)

Sometimes both exist for the same endpoint, causing shadowing.

---

## 19. Active Bug Analysis

### 19.1 TypeScript Errors in Storage Layer

**Location**: `server/storage.ts`
**Count**: 17 active errors
**Severity**: Medium - compiles but type safety compromised

**Error Categories**:

1. **Type Narrowing Issues (Lines 1355, 1365)**
   - `geoPrecision` field expects specific literals but receives `string`
   - Fix: Add proper type casting or schema constraint

2. **Insert Type Mismatches (Lines 2489, 5969, 5997)**
   - Passing single object where array expected
   - Error: "missing properties: length, pop, push, concat..."
   - Fix: Wrap in array or fix insert call

3. **Date/String Confusion (Lines 5976, 6004)**
   - Passing string dates where Date objects expected
   - Fields: `flightArrival`, `dueDate`
   - Fix: Parse strings to Date before insert

4. **Null vs Undefined (Lines 6709-6717)**
   - Returning `null` where `undefined` expected
   - Fix: Use nullish coalescing or update return types

### 19.2 Debug Statements in Production Code

**Severity**: Low (noise) to Medium (security - may leak data)

**Locations with Heavy Debug Logging**:
```
server/routes/orders.routes.ts: 16 DEBUG statements
server/routes/events.routes.ts: 45 DEBUG statements
server/routes/catalog.routes.ts: 2 DEBUG statements
server/routes.ts: 200+ DEBUG statements
```

**Example Problematic Log**:
```typescript
console.log('🔍 [DEBUG] Request body received:', JSON.stringify(req.body, null, 2));
```
This logs entire request bodies which could contain sensitive data.

### 19.3 Potential Runtime Bugs

**1. Race Condition in Order Creation**
```typescript
// In orders.routes.ts
const orderCode = await generateOrderCode(); // May conflict
const order = await storage.createOrder({ orderCode, ... });
```
If two orders created simultaneously, code generation could collide.

**2. Missing Transaction Boundaries**
```typescript
// Creating order with line items is not atomic
const order = await storage.createOrder(orderData);
for (const item of lineItems) {
  await storage.createOrderLineItem({ orderId: order.id, ...item });
}
// If line item creation fails, orphan order exists
```

**3. Unhandled Promise Rejections**
Many async operations lack proper catch blocks:
```typescript
// Some routes do this
storage.createAuditLog({ ... }); // No await, no catch
```

**4. Session Fixation Potential**
Session is not regenerated on login:
```typescript
req.login(sessionData, (err) => {
  // Session ID stays the same
});
```

### 19.4 UI/UX Bugs

**1. Loading States Not Consistent**
- Some pages show skeleton loaders
- Some pages show blank content
- Some pages show "Loading..." text

**2. Error Boundaries Missing**
- No global error boundary for React
- Individual component errors crash entire page

**3. Form Validation Timing**
- Some forms validate on blur
- Some validate on submit only
- Inconsistent user experience

---

## 20. Precise Build Status by Module

### 20.1 Sales & Leads Module

| Component | Status | Notes |
|-----------|--------|-------|
| Lead CRUD | ✅ Complete | Full create, read, update, delete |
| Pipeline View | ✅ Complete | Kanban with drag-drop |
| Lead Stages | ✅ Complete | 8 stages with transitions |
| Lead Assignment | ✅ Complete | Assign to salesperson |
| Lead Archiving | ✅ Complete | Soft delete with archive |
| Lead Dependencies | ✅ Complete | Check orders/design jobs |
| Communication Logs | ⚠️ 70% | UI exists, email/SMS not integrated |
| Lead Scoring | ⚠️ 50% | Field exists, no auto-calculation |
| Sales Map | ⚠️ 80% | Geocoding works, some edge cases |
| Lead Import | ❌ Missing | No bulk import feature |

### 20.2 Design Module

| Component | Status | Notes |
|-----------|--------|-------|
| Design Job CRUD | ✅ Complete | Full lifecycle |
| Job Assignment | ✅ Complete | Assign to designer |
| Job Comments | ✅ Complete | With internal flag |
| Status Workflow | ✅ Complete | 7-stage workflow |
| AI Design Lab Projects | ✅ Complete | Project creation/management |
| AI Design Versions | ✅ Complete | Version history |
| AI Design Layers | ✅ Complete | Typography, logos, graphics |
| AI Generation | ✅ Complete | OpenAI integration |
| Image Compositing | ✅ Complete | Sharp-based processing |
| Style Presets | ✅ Complete | Admin-managed |
| Training Sets | ⚠️ 80% | Upload works, training not connected |
| Design Portfolio | ⚠️ 70% | Basic view, limited features |
| Design Resources | ✅ Complete | File library |

### 20.3 Orders Module

| Component | Status | Notes |
|-----------|--------|-------|
| Order CRUD | ✅ Complete | Full lifecycle |
| Line Items | ✅ Complete | Add, edit, delete |
| Size Grid | ✅ Complete | 12 sizes, auto-totals |
| Order Status | ✅ Complete | 9-stage workflow |
| Salesperson Assignment | ✅ Complete | With filtering |
| Customer Order Form | ✅ Complete | Public size submission |
| Customer Portal | ✅ Complete | Tracking page |
| Tracking Numbers | ✅ Complete | Multiple carriers |
| Order PDF | ✅ Complete | PDF generation |
| Order Cloning | ✅ Complete | Duplicate order |
| Batch Operations | ❌ Missing | No bulk status update |
| Order History | ⚠️ 60% | Audit log partial |

### 20.4 Manufacturing Module

| Component | Status | Notes |
|-----------|--------|-------|
| Manufacturing CRUD | ✅ Complete | Full lifecycle |
| Status Updates | ✅ Complete | With history |
| Dual Status System | ✅ Complete | Public + internal |
| Manufacturer Assignment | ✅ Complete | Per line item |
| First Piece Approval | ✅ Complete | QC workflow |
| Finished Images | ✅ Complete | Image uploads |
| Manufacturing Notes | ✅ Complete | Categorized notes |
| Manufacturer Portal | ✅ Complete | External access |
| Manufacturer Queue | ✅ Complete | Job management |
| Batching | ⚠️ 70% | UI exists, limited use |
| Quality Checkpoints | ⚠️ 60% | Schema exists, partial UI |
| Production Schedule | ⚠️ 40% | Schema exists, minimal UI |
| Capacity Dashboard | ⚠️ 50% | Basic metrics only |

### 20.5 Catalog Module

| Component | Status | Notes |
|-----------|--------|-------|
| Category CRUD | ✅ Complete | Full management |
| Product CRUD | ✅ Complete | Full management |
| Variant CRUD | ✅ Complete | Color, size, material |
| Variant Templates | ✅ Complete | Front/back images |
| Variant Pricing | ✅ Complete | MSRP, cost |
| Variant Specifications | ⚠️ 70% | Schema exists, partial UI |
| Fabric Management | ⚠️ 80% | Basic CRUD, approval partial |
| Fabric Submissions | ⚠️ 70% | Workflow partial |
| Default Manufacturer | ✅ Complete | Per variant |

### 20.6 Finance Module

| Component | Status | Notes |
|-----------|--------|-------|
| Invoice CRUD | ✅ Complete | Create, edit, send |
| Invoice Status | ✅ Complete | Draft→Sent→Paid |
| Invoice PDF | ✅ Complete | PDF generation |
| Payment Recording | ✅ Complete | Multiple methods |
| Commission Tracking | ⚠️ 80% | Auto-calculation partial |
| Commission Payments | ⚠️ 70% | Basic tracking |
| Financial Matching | ⚠️ 60% | UI exists, workflow partial |
| Product COGS | ⚠️ 70% | Schema exists, partial use |
| Expense Tracking | ⚠️ 50% | Basic implementation |
| QuickBooks Sync | ❌ Missing | Not implemented |
| Financial Reports | ❌ Missing | No reporting dashboard |

### 20.7 Events Module

| Component | Status | Notes |
|-----------|--------|-------|
| Event CRUD | ✅ Complete | Full lifecycle |
| Event Status | ✅ Complete | 6-stage workflow |
| 10-Stage Wizard | ⚠️ 80% | All stages exist, some partial |
| Stage 1: Overview | ✅ Complete | Basic info |
| Stage 2: Branding | ⚠️ 80% | Theme, colors, logos |
| Stage 3: Staff | ✅ Complete | Assignment |
| Stage 4: Contractors | ✅ Complete | CRUD + payments |
| Stage 5: Merchandise | ⚠️ 70% | Allocation partial |
| Stage 6: Budget | ⚠️ 70% | Basic tracking |
| Stage 7: Marketing | ⚠️ 60% | Campaign partial |
| Stage 8: Registration | ⚠️ 70% | Tickets, attendees |
| Stage 9: Logistics | ⚠️ 60% | Venues, equipment |
| Stage 10: Post-Event | ⚠️ 40% | Basic wrap-up |
| Customer Event Portal | ⚠️ 70% | Public view partial |

### 20.8 Team Stores Module

| Component | Status | Notes |
|-----------|--------|-------|
| Team Store CRUD | ✅ Complete | Basic management |
| Store Status | ✅ Complete | Open/closed dates |
| Line Item Selection | ✅ Complete | From order |
| Store Analytics | ⚠️ 40% | Basic counts |
| Shopify Sync | ❌ Missing | Not implemented |
| Store Customization | ❌ Missing | No theming |
| Order Collection | ❌ Missing | No public ordering |

### 20.9 Quotes Module

| Component | Status | Notes |
|-----------|--------|-------|
| Quote CRUD | ✅ Complete | Full lifecycle |
| Quote Status | ✅ Complete | Draft→Sent→Accepted |
| Line Items | ✅ Complete | Full management |
| Quote PDF | ✅ Complete | PDF generation |
| Quote Expiration | ✅ Complete | Validity tracking |
| Convert to Order | ✅ Complete | One-click conversion |
| Quote Versioning | ❌ Missing | No revision history |
| Quote Templates | ❌ Missing | No saved templates |

### 20.10 System Administration

| Component | Status | Notes |
|-----------|--------|-------|
| User Management | ✅ Complete | CRUD + roles |
| Role Management | ✅ Complete | 6 roles |
| Permission Management | ⚠️ 70% | UI exists, dual system issue |
| User Invitations | ✅ Complete | Email + token |
| Audit Logging | ⚠️ 50% | Some entities logged |
| System Analytics | ⚠️ 60% | Basic metrics |
| Connection Health | ⚠️ 60% | DB status check |
| Notifications | ⚠️ 70% | In-app only |

---

## 21. Integration Status

### 21.1 Currently Working Integrations

| Integration | Status | Configuration |
|-------------|--------|---------------|
| PostgreSQL (Neon) | ✅ Working | `DATABASE_URL` env var |
| Google Cloud Storage | ✅ Working | `GOOGLE_CLOUD_*` env vars |
| OpenAI API | ✅ Working | `OPENAI_API_KEY` secret |
| Replit Auth (OIDC) | ✅ Working | Automatic in Replit |
| SendGrid | ⚠️ Configured | Key set but not used |

### 21.2 Planned But Not Implemented

| Integration | Priority | Notes |
|-------------|----------|-------|
| Shopify | High | Team store sync |
| QuickBooks | High | Invoice/payment sync |
| Printful | Medium | Print-on-demand |
| Twilio | Medium | SMS notifications |
| Pantone Connect | Low | Color matching API |
| Stripe | Low | Payment processing |

### 21.3 SendGrid Status (Partially Configured)

SendGrid is configured but not triggered:
```typescript
// Package installed: @sendgrid/mail
// Environment variable: SENDGRID_API_KEY (exists)
// But no email sending code is actually called
```

The email infrastructure exists but no triggers:
- No order status emails
- No invoice emails
- No invitation emails (shown in UI but not sent)

---

## 22. Database Analysis

### 22.1 Table Count by Domain

| Domain | Tables | Notes |
|--------|--------|-------|
| Core (users, orgs, contacts) | 6 | Foundational entities |
| Leads | 3 | Leads + communication |
| Products/Catalog | 6 | Categories, products, variants |
| Orders | 8 | Orders, line items, tracking |
| Design | 14 | Jobs, AI Lab, training |
| Manufacturing | 15 | Production, batches, QC |
| Finance | 10 | Invoices, payments, commissions |
| Events | 18 | 10-stage wizard support |
| Quotes | 3 | Quotes + line items |
| Team Stores | 4 | Stores + line items |
| Permissions | 4 | RBAC system |
| System | 5 | Audit, notifications, etc. |
| External Sync | 3 | Printful, integrations |
| **TOTAL** | **108** | |

### 22.2 Index Coverage

Most tables have proper indexes on:
- Primary keys (automatic)
- Foreign keys (explicitly defined)
- Common query fields (status, userId, createdAt)

**Missing Indexes** (potential performance issues):
- `orderLineItems.variantId` - frequently joined
- `manufacturingUpdates.createdAt` - for history queries
- `designJobs.deadline` - for deadline sorting

### 22.3 Nullable Field Patterns

The schema mixes patterns:
```typescript
// Some use .notNull()
name: varchar("name").notNull(),

// Some rely on defaults
status: varchar("status").default("pending"),

// Some are explicitly nullable
notes: text("notes"), // implicitly nullable
```

**Recommendation**: Be explicit about nullability:
```typescript
notes: text("notes").nullable(), // or .notNull()
```

---

## 23. Frontend Component Analysis

### 23.1 Component Inventory

| Directory | Components | Purpose |
|-----------|------------|---------|
| `components/ui/` | 45+ | shadcn/ui primitives |
| `components/layout/` | 5 | Page layouts, sidebars |
| `components/modals/` | 20+ | Dialog components |
| `components/actions/` | 10+ | Quick action system |
| `components/kanban/` | 8 | Kanban board |
| `components/workflow/` | 6 | Status workflows |
| `components/orders/` | 15 | Order-specific |
| `components/manufacturing/` | 12 | Manufacturing UI |
| `components/design-jobs/` | 10 | Design job UI |

### 23.2 Page Count by Domain

| Domain | Pages | Hub | List | Detail | Actions |
|--------|-------|-----|------|--------|---------|
| Dashboard | 2 | ✅ | - | - | - |
| Leads | 6 | ✅ | ✅ | ✅ | ✅ |
| Orders | 8 | ✅ | ✅ | ✅ | ✅ |
| Design | 10 | ✅ | ✅ | ✅ | ✅ |
| Manufacturing | 8 | ✅ | ✅ | ✅ | ✅ |
| Catalog | 6 | ✅ | ✅ | ✅ | - |
| Quotes | 4 | ✅ | ✅ | ✅ | ✅ |
| Finance | 8 | ✅ | Multi | - | - |
| Events | 6 | ✅ | ✅ | ✅ | - |
| Team Stores | 3 | ✅ | ✅ | ✅ | - |
| Admin | 10 | Multi | Multi | - | - |
| **Total** | **90** | | | | |

### 23.3 Shared Utilities

| File | Purpose | Quality |
|------|---------|---------|
| `lib/queryClient.ts` | API client | ★★★★★ |
| `lib/utils.ts` | Tailwind merge | ★★★★★ |
| `lib/format.ts` | Date/currency formatting | ★★★★☆ |
| `lib/permissions.ts` | Frontend permission checks | ★★★☆☆ |
| `lib/routesConfig.ts` | Route definitions | ★★★★☆ |
| `lib/featureFlags.ts` | Feature toggles | ★★★☆☆ |

---

## 24. API Route Analysis

### 24.1 Route File Sizes (Lines of Code)

```
manufacturing.routes.ts    2,482 lines  ← Largest
orders.routes.ts          2,281 lines
events.routes.ts          1,543 lines
design-lab.routes.ts      1,386 lines
catalog.routes.ts         1,088 lines
finance.routes.ts         1,085 lines
quotes.routes.ts            911 lines
sales-map.routes.ts         760 lines
design.routes.ts            742 lines
manufacturer-portal.routes.ts 526 lines
analytics.routes.ts         451 lines
permissions.routes.ts       363 lines
users.routes.ts             365 lines
team-stores.routes.ts       347 lines
auth.routes.ts              340 lines
tasks.routes.ts             323 lines
```

### 24.2 Endpoint Pattern Analysis

**Standard CRUD**:
```
GET    /api/{resource}       - List all
GET    /api/{resource}/:id   - Get one
POST   /api/{resource}       - Create
PATCH  /api/{resource}/:id   - Update
DELETE /api/{resource}/:id   - Delete
```

**Nested Resources**:
```
GET    /api/orders/:id/line-items
POST   /api/orders/:id/line-items
GET    /api/events/:id/contractors
POST   /api/events/:id/contractors/:cid/payments
```

**Actions**:
```
POST   /api/orders/:id/ship
POST   /api/orders/:id/archive
POST   /api/manufacturing/:id/approve-first-piece
POST   /api/design-lab/generate
```

### 24.3 Missing API Standards

- No API versioning (no `/api/v1/`)
- No rate limiting per endpoint (only global)
- No request ID tracking for debugging
- No OpenAPI/Swagger documentation
- Inconsistent error response format

---

## 25. Security Analysis

### 25.1 What's Implemented

| Security Measure | Status | Notes |
|------------------|--------|-------|
| Authentication | ✅ | Replit OIDC + Local |
| Session Management | ✅ | PostgreSQL store |
| CSRF Protection | ✅ | Token-based |
| Role-Based Access | ✅ | 6 roles |
| Password Hashing | ✅ | bcrypt |
| HTTPS | ✅ | Replit managed |
| Input Validation | ✅ | Zod schemas |

### 25.2 Security Concerns

1. **No Rate Limiting on Auth Endpoints**
   - Login attempts not throttled
   - Brute force possible

2. **Session Not Regenerated on Login**
   - Session fixation potential
   - Should call `req.session.regenerate()`

3. **Debug Logging May Leak Data**
   - Request bodies logged
   - Could contain passwords/tokens

4. **No Content Security Policy**
   - No CSP headers set
   - XSS mitigation missing

5. **File Upload Validation**
   - Basic mime type check exists
   - No virus scanning
   - No content validation

### 25.3 Recommendations

1. Add rate limiting to `/api/auth/*` endpoints
2. Regenerate session on login
3. Remove debug logging from production
4. Add CSP headers
5. Implement file content validation

---

## 26. Performance Considerations

### 26.1 Current Bottlenecks

1. **Large Schema File**
   - 3,839 lines loaded on every import
   - 453 exports
   - Consider code splitting

2. **Unbounded List Queries**
   - Many endpoints return all records
   - No enforced pagination
   - Will degrade with scale

3. **N+1 Query Patterns**
   - Some storage methods loop with individual queries
   - Should use Drizzle relations

4. **No Caching Layer**
   - Every request hits database
   - No Redis/memory cache
   - Catalog data could be cached

### 26.2 Recommendations

1. Add pagination to all list endpoints
2. Implement Redis caching for catalog
3. Split schema imports by domain
4. Add database query logging to identify N+1

---

## 27. Testing Gap Analysis

### 27.1 Current Test Coverage

| Area | Tests | Coverage |
|------|-------|----------|
| Unit Tests | 1 file | ~1% |
| Integration Tests | 1 file | ~1% |
| E2E Tests | 0 files | 0% |
| Component Tests | 0 files | 0% |

### 27.2 Testing Infrastructure

The project has Vitest configured:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration",
  "test:coverage": "vitest run --coverage"
}
```

But almost no tests exist.

### 27.3 Recommended Test Strategy

**Priority 1 - Critical Paths**:
- Authentication flow
- Order creation with line items
- Permission checks
- Financial calculations

**Priority 2 - Business Logic**:
- Status transitions
- Commission calculations
- Size grid calculations
- Quote to order conversion

**Priority 3 - Integration**:
- OpenAI integration
- File uploads
- PDF generation

---

## 28. Deployment & Operations

### 28.1 Current Setup

- **Platform**: Replit
- **Database**: Neon PostgreSQL
- **File Storage**: Google Cloud Storage
- **SSL**: Replit managed
- **CI/CD**: Replit deployments

### 28.2 Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...

# Storage
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_CLOUD_BUCKET_NAME=...
GOOGLE_CLOUD_CLIENT_EMAIL=...
GOOGLE_CLOUD_PRIVATE_KEY=...

# Email (configured but not used)
SENDGRID_API_KEY=...

# AI
OPENAI_API_KEY=...

# Session
SESSION_SECRET=... (auto-generated if missing)
```

### 28.3 Build Process

```bash
npm run build
# 1. Vite builds React app → dist/
# 2. esbuild bundles server → dist/index.js
```

### 28.4 Monitoring Gaps

- No APM (Application Performance Monitoring)
- No error tracking (Sentry, etc.)
- No log aggregation
- No uptime monitoring
- No alerting system

---

## 29. Recommendations Summary

### 29.1 Immediate Actions (This Week)

1. **Remove debug logging** - 223+ console.log statements
2. **Fix TypeScript errors** - 17 errors in storage.ts
3. **Delete legacy routes.ts** - After verifying all endpoints migrated

### 29.2 Short Term (This Month)

1. **Consolidate permission system** - Pick database or code
2. **Add basic tests** - Auth, orders, permissions
3. **Split storage.ts** - By domain
4. **Add rate limiting** - Auth endpoints

### 29.3 Medium Term (This Quarter)

1. **Implement integrations** - Shopify, QuickBooks
2. **Add email notifications** - Use existing SendGrid
3. **Build reporting dashboard** - Financial analytics
4. **Add E2E tests** - Critical user flows

### 29.4 Long Term (This Year)

1. **API versioning** - `/api/v1/`
2. **Documentation** - OpenAPI/Swagger
3. **Caching layer** - Redis
4. **Error tracking** - Sentry
5. **Mobile app** - React Native or PWA

---

## 30. Glossary

| Term | Definition |
|------|------------|
| **Line Item** | Individual product in an order with quantity and sizes |
| **Size Grid** | 12-size breakdown (YXS-XXXXL) for each line item |
| **First Piece** | Initial production sample for approval |
| **Manufacturing Update** | Status change record with notes |
| **Manufacturer Job** | Work order for external manufacturer |
| **Design Job** | Request for design work |
| **Hub Page** | Domain landing page with overview and actions |
| **Quick Action** | Wizard-style shortcut for common tasks |
| **Capsule** | Compact card showing entity summary |
| **Stage** | Step in a workflow (lead stage, order status) |
