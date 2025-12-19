# Rich Habits ERP System

## Overview

This is a full-stack enterprise resource planning (ERP) application for Rich Habits LLC, a custom athletic apparel manufacturing business. The system manages the complete workflow from sales leads through manufacturing and delivery, including:

- **Sales Pipeline**: Lead tracking, organization management, quotes, and order processing
- **Design Management**: Design job workflows with Kanban boards and designer assignments
- **Manufacturing**: Production tracking with status workflows, quality checkpoints, manufacturer portal, and interactive floor view
- **Finance**: Invoicing, payment tracking, and QuickBooks integration capabilities
- **Team Stores**: Shopify-integrated custom storefronts for organizations
- **Events**: Event planning and management with contractor coordination

The application uses role-based access control with distinct experiences for Admin, Sales, Designer, Ops, Manufacturer, and Finance roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript, built using Vite
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode supported)
- **State Management**: TanStack React Query for server state, local React state for UI
- **Routing**: React Router with role-based route configuration
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: dnd-kit for Kanban boards and sortable interfaces

The frontend follows a hub-based navigation pattern where each domain area (Orders, Manufacturing, etc.) has a hub landing page with quick actions and filtered views.

### Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON APIs with Zod schema validation
- **Authentication**: Session-based auth with role-based middleware
- **File Structure**: Modular route files under `server/routes/` aggregated into main router

Route modules are organized by domain:
- `auth.routes.ts` - Authentication and user management
- `orders.routes.ts` - Order CRUD and line items
- `manufacturing.routes.ts` - Production tracking and updates
- `catalog.routes.ts` - Products, variants, and categories
- Additional modules for leads, contacts, organizations, quotes, etc.

### Data Layer

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless compatible)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with migrations in `./migrations`

Key data models include:
- Users with role-based permissions
- Organizations (clients) with contacts
- Orders with line items and size breakdowns
- Manufacturing records with status workflows
- Design jobs with attachment management
- Quotes with line items and PDF generation

### Shared Code

The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Drizzle database schema and Zod validation schemas
- Type definitions derived from schema for type safety across the stack

## External Dependencies

### Database
- **PostgreSQL** via Neon Serverless (`@neondatabase/serverless`)
- Connection configured via `DATABASE_URL` environment variable

### Cloud Storage
- **Google Cloud Storage** (`@google-cloud/storage`) for file uploads
- Used for product images, logos, design files, and manufacturing attachments

### Email Service
- **SendGrid** (`@sendgrid/mail`) for transactional emails
- Used for notifications, quote delivery, and invoice sending

### Planned Integrations (referenced in specs)
- **Shopify Admin API** - Team store creation and product sync
- **QuickBooks Online** - Invoice and payment workflows
- **Printful API** - Print-on-demand fulfillment
- **Google Gemini** - AI-powered features (client summaries, design assistance)
- **Pantone Connect API** - Color matching from images

### Development Tools
- **Vite** - Build tool with React plugin and HMR
- **Vitest** - Testing framework with jsdom environment
- **TypeScript** - Type checking across the entire codebase
- **ESBuild** - Production server bundling

### Testing Infrastructure
- Unit and integration tests in `tests/` directory
- Test setup with mock data and database utilities
- Coverage reporting with v8 provider

## Recent Changes

### Authentication System Refactoring (December 2024)
Refactored the `useAuth` hook to provide a consistent interface across all components:
- Returns `{ user, isLoading, isAuthenticated, isError, error, refetch }`
- Preserves authentication through transient refetch failures (cached user data remains valid)
- Role-based redirect logic uses `getRoleHomePath()` utility from `featureFlags.ts`
- Post-login redirects to role-specific home pages (admin, sales, designer, ops, manufacturer)

### Manufacturing Control Floor (December 2024)
Added an interactive spatial floor view as an alternative to the tiles view on the manufacturer home page (`/manufacturer/home`).

**New Components** (`client/src/components/manufacturing-control-floor/`):
- `ViewSwitcher` - Toggle between tiles and floor views (persists to localStorage)
- `ProductionFloorCanvas` - Main spatial layout with horizontal zone display
- `ProductionZone` - Individual zone containers with capacity gauges
- `ProductionUnit` - Job cards with priority/status display and click-to-navigate
- `CapacityGauge` - Visual capacity indicator per zone
- `FloorMetricsHUD` - Stats bar showing active jobs, urgent, overdue
- `ExceptionPanel` - Sliding panel for urgent/overdue job alerts with escape key and click-outside-to-close

The floor view leverages existing `ZONE_CONFIGS` and `FUNNEL_STAGE_CONFIGS` from `manufacturerFunnelConfig.ts` to display jobs organized by production zone (Intake → Specs → Samples → Production → Shipping).

### Sales Map Performance and UX Improvements (December 2024)
Optimized the Sales Map (`/sales-map`) for better performance and usability:

**Performance Fixes** (`client/src/modules/sales-map/map/ClusteredMapCanvas.tsx`):
- Added `requestAnimationFrame` throttling for marker position updates during map movement
- Removed random animation delays that caused staggered re-renders
- Added `rafRef` and `isMovingRef` refs to track animation state and prevent queue buildup
- Moved heavy state updates from continuous `move` events to `moveend` events
- Proper cleanup of animation frames on unmount

**Cluster Visualization Improvements**:
- Changed cluster colors from heat-based yellow gradient to **dominant entity type** colors
- Added **pie-chart style conic gradient** showing entity type breakdown visually
- Enlarged entity breakdown indicators below clusters with icons and counts
- Entity colors: Organizations (blue), Leads (amber), Orders (green), Design Jobs (purple)

**Orders Panel Enhancements** (`client/src/modules/sales-map/panels/OrdersPanel.tsx`):
- Added tabbed interface with "Recent Orders" and "Needs Attention" tabs
- "Needs Attention" tab shows items requiring action:
  - Overdue orders (sorted by days overdue)
  - Stalled design jobs (overdue or high urgency)
  - Hot leads needing attention
- Items sorted by severity (critical > high > medium > low) then by days overdue
- Severity indicators with color-coded dots
- Fallback navigation for items without coordinates (opens entity detail page)

**Default Filter Changes** (`client/src/modules/sales-map/SalesMapShell.tsx`):
- Changed `showOrders` filter default from `false` to `true` so orders are visible on the map by default

### Footer Content Protection System (December 2024)
Fixed systemic issue where content was hidden under the permanent footer across the application:

**Global Layout Changes**:
- **AppLayout** (`client/src/components/layout/app-layout.tsx`): Already had proper `pb-28 md:pb-32` padding on main content area to protect all pages using AppLayout
- **SalesMapShell** (`client/src/modules/sales-map/SalesMapShell.tsx`): 
  - Changed container height from `h-screen` to `height: calc(100vh - 5rem)` to reserve 80px for the fixed footer
  - Moved Attention button container from `bottom-24` to `bottom-32` (128px from footer)
  - Moved OrdersPanel from `bottom-4` to `bottom-24` (96px from footer)

**Solution Architecture**:
- All content-bearing pages use either AppLayout (with padding) or explicitly calculate available height
- Floating panels are positioned with sufficient bottom margin to stay above the fixed footer (z-50)
- Footer height (~80px including padding) is accounted for in all layout calculations
- Ensures NO content is ever hidden under the footer across all pages, routes, and subpages

### Finance Auto-Matching System (December 2024)
Implemented an enhanced semi-automatic financial entry system with intelligent suggestions across all finance modals.

**New API Endpoints** (`server/routes/finance.routes.ts`):
- `GET /api/finance/suggestions/invoice` - Invoice amount suggestions based on order totals and outstanding balances
- `GET /api/finance/suggestions/commission/:salespersonId` - Commission calculation with period breakdown
- `GET /api/finance/suggestions/payment/:invoiceId` - Payment suggestions with outstanding balance and patterns
- `GET /api/finance/suggestions/expense/:orderId` - Expense suggestions for COGS, shipping, and commissions

**Reusable Components** (`client/src/components/shared/AmountSuggestionPanel.tsx`):
- `AmountSuggestionPanel` - Generic suggestion panel with confidence indicators (high/medium/low) and auto-fill
- `CommissionBreakdown` - Commission calculator showing sales, rate, paid amounts, and order breakdown
- `PaymentSuggestionPanel` - Payment summary with invoice totals, quick amounts, and preferred method

**Finance Page Enhancements** (`client/src/pages/finance.tsx`):
- Invoice modal: Smart amount suggestions based on order totals and outstanding balances
- Commission modal: Auto-calculation with CommissionBreakdown component
- Payment modal: PaymentSuggestionPanel with invoice summary and quick amounts
- Expense modal: Order linking with auto-categorization (COGS, shipping, commission)
- Anomaly detection section: Highlights unmatched orders, overdue invoices, pending commissions
- Quick action buttons: View Unmatched, Send Reminders (placeholder), Process Commissions

**Financial Matching Modal** (`client/src/components/modals/financial-matching-modal.tsx`):
- Confidence scoring for suggested matches (high/medium/low based on amount proximity)
- Smart suggestions section showing potential inflow/outflow matches
- "Match All High Confidence" button for batch matching

**Technical Details**:
- `safeParseFloat()` helper prevents NaN values from invalid line item data
- Input validation on invoice suggestions endpoint with proper error handling
- Confidence levels: High (within 1%), Medium (within 5%), Low (within 10%)
- All suggestion panels include data-testid attributes for testing

### Team Store Revenue Integration (December 2024)
Added team store revenue tracking that integrates with the finance invoice and payment systems.

**Schema Changes** (`shared/schema.ts`):
- Added `totalRevenue` field to team stores table (decimal with precision 12, scale 2)
- Added `revenueSource` field to invoices table (enum: "order" | "team_store" | "other")
- Added `teamStoreId` field to invoices table (foreign key to team stores)

**Backend Enhancements** (`server/routes/finance.routes.ts`):
- `GET /api/invoices` now supports `revenueSource` query parameter for filtering
- `PATCH /api/team-stores/:id/revenue` endpoint to update team store total revenue
- Invoice suggestions endpoint includes team store context when teamStoreId provided
- Server-side filtering at database level for performance

**Finance UI Improvements** (`client/src/pages/finance.tsx`):
- Revenue source filter dropdown on Invoices tab (All Sources, Regular Orders, Team Stores, Other)
- Revenue source badges on invoice cards (purple for team stores)
- Revenue source field in Create Invoice modal

**Team Store Management** (`client/src/components/modals/team-store-detail-modal.tsx`):
- Total Revenue input field with currency formatting
- Revenue persists when saving team store changes