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
