# Rich Habits ERP System

## Overview
This full-stack Enterprise Resource Planning (ERP) system for Rich Habits LLC, a custom athletic apparel manufacturer, manages the entire business workflow. It spans sales lead tracking, design, manufacturing, and delivery. Key capabilities include sales pipeline management, design job workflows, production tracking, financial management (invoicing, payments, QuickBooks integration), Shopify-integrated team stores, and event management. The system features role-based access control for Admin, Sales, Designer, Ops, Manufacturer, and Finance roles. The business vision is to streamline operations, enhance efficiency, and provide a comprehensive platform for managing all aspects of custom apparel manufacturing, aiming for significant market potential through robust process automation and improved customer experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build**: React with TypeScript, Vite.
- **UI & Styling**: Shadcn/ui, Radix UI, Tailwind CSS with theming (dark mode supported).
- **State Management**: TanStack React Query for server state, local React for UI.
- **Routing**: React Router with role-based configuration.
- **Forms**: React Hook Form with Zod validation.
- **Interactivity**: dnd-kit for drag & drop.
- **Navigation**: Hub-based pattern for domain areas.
- **Mobile Optimization**: App-wide responsiveness, touch-first interactions, `DataViewToggle` (table/card views, mobile defaults to cards), `MobileDataCard` (swipe-enabled), `ResponsiveDialog` (Dialog/Drawer switch), safe area support, compact mobile layouts, and consistent mobile patterns (44px touch targets, collapsible sections, horizontal scroll areas).

### Backend Architecture
- **Runtime & Language**: Node.js with Express.js, TypeScript with ES modules.
- **API Design**: RESTful JSON APIs with Zod schema validation.
- **Authentication**: Session-based with role-based middleware.
- **Structure**: Modular route files organized by domain (auth, orders, manufacturing, catalog, etc.).

### Data Layer
- **ORM**: Drizzle ORM (PostgreSQL dialect).
- **Database**: PostgreSQL (Neon serverless compatible).
- **Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Migrations**: Drizzle Kit.
- **Key Models**: Users (role-based), Organizations, Orders (line items, size breakdowns), Manufacturing records, Design jobs, Quotes.

### Shared Code
- `shared/` directory contains `schema.ts` (Drizzle, Zod schemas) and type definitions for full-stack type safety.

## External Dependencies

### Database
- **PostgreSQL**: Via Neon Serverless (`@neondatabase/serverless`).

### Cloud Storage
- **Google Cloud Storage**: (`@google-cloud/storage`) for file uploads (images, design files, attachments).

### Email Service
- **SendGrid**: (`@sendgrid/mail`) for transactional emails (notifications, quotes, invoices).

### Planned Integrations
- **Shopify Admin API**: For team store creation and product synchronization.
- **QuickBooks Online**: For invoice and payment workflows.
- **Printful API**: For print-on-demand fulfillment.
- **Google Gemini**: For AI-powered features (client summaries, design assistance).
- **Pantone Connect API**: For color matching from images.

## Recent Changes

### Error Remediation Phase 1 (December 2024)
Systematic error elimination for improved stability and security.

**TypeScript/Schema Fixes** (`shared/schema.ts`):
- Fixed 12 LSP type errors in insert schemas
- Pattern: Use `.omit()` on base schema BEFORE `.extend()` for refinements
- Affected: insertFabricSchema, insertManufacturerJobSchema, insertPantoneAssignmentSchema, and 9 others

**Security Middleware** (`server/routes/index.ts`, `server/middleware/`):
- CSRF protection globally applied to all routes
- General API rate limiter: 100 requests/minute per IP on all `/api` routes
- Auth rate limiter: 5 attempts/15 min on login endpoint
- CSRF token endpoint at `/api/auth/csrf-token`

**Documentation** (`docs/COMPREHENSIVE_ERROR_LIST.md`):
- Created comprehensive error tracking document
- 20 issues fixed, 20 documented for future phases
- Data assessment complete: 0 violations for prices/quantities/orphans - constraints safe to add
- Priority matrix for remaining work

**Query Client Improvements** (`client/src/lib/queryClient.ts`, `client/src/lib/queryKeys.ts`):
- Added `queryKeys.ts` factory pattern with 15+ resource patterns for consistent cache invalidation
- Global error handling via `QueryCache` and `MutationCache` with toast notifications
- Configured reasonable stale time (30s) and gcTime (5min)
- Added `silent` meta option to suppress toasts when needed

### Native App Quality Mobile Polish (December 2024)
Enhanced the mobile experience to feel like native iOS/Android apps with smooth loading, spring physics animations, and micro-interactions.

**Loading & Skeleton System** (`client/src/components/ui/skeleton.tsx`):
- Shimmer animations with gradient sweep (like Instagram)
- Content-aware skeleton variants: SkeletonCard, SkeletonList, SkeletonTable, SkeletonChart, SkeletonAvatar, SkeletonText
- LoadingContainer wrapper with smooth crossfade transitions
- Spring physics for content appearance

**Animation System**:
- Spring timing functions via CSS variables: `--spring-bounce`, `--spring-smooth`, `--spring-snappy`
- Page transitions with AnimatePresence and spring physics
- Stagger animations for lists and grids (`StaggerContainer`, `StaggerItem`, `StaggerGrid`)
- Modal/popup spring animations with backdrop blur transitions

**Typography System** (`client/src/components/ui/responsive-text.tsx`, `truncate-text.tsx`):
- Fluid typography with CSS clamp(): `--text-fluid-xs` through `--text-fluid-3xl`
- TruncateText with expandable tap-to-show-more functionality
- ResponsiveHeading and ResponsiveText components
- AutoSizeText for automatic font scaling to fit container

**Micro-Interactions** (`client/src/components/ui/`):
- `PressFeedback` - Scale-down effect on touch (0.97 scale)
- `PullToRefresh` - Touch gesture refresh with animated indicator
- `SmoothScrollArea` - Momentum scrolling with edge gradients
- `AnimatedCounter` - Spring-animated number transitions
- `RippleEffect` - Material Design ripple on tap

**Sales Map Mobile Optimization** (`client/src/modules/sales-map/`):
- Full-screen map with floating glass morphism controls
- Bottom sheet for mobile filters (TopHUD converted)
- Bottom drawer for entity details (RightDrawer converted)
- Collapsible bottom bar for orders panel
- Larger touch targets (1.4x marker size on mobile)
- Haptic-style visual feedback on marker tap

**Global Mobile Polish**:
- All buttons have :active scale transform (0.97)
- Overscroll behavior utilities
- 44-48px minimum touch targets throughout
- Spring physics on all modal/popup transitions
- No layout shifts during page transitions

### React Query Cache Invalidation Fix (December 2024)
Fixed cache invalidation "drift" across all CRUD operations by standardizing query key patterns.

**Problem**: Template string query keys like `` [`/api/orders/${orderId}`] `` created single-string keys that didn't match hierarchical cache invalidation patterns, causing stale data after create/edit/delete operations.

**Solution**: Converted all query keys to array segment format for proper prefix-based invalidation:
- `['/api/orders', orderId]` instead of `` [`/api/orders/${orderId}`] ``
- `['/api/orders', orderId, 'line-items']` instead of `` [`/api/orders/${orderId}/line-items`] ``

**Files Updated**:
- `OrderCapsule.tsx` - 16 query key fixes
- `order-detail-modal.tsx` - 16 fixes
- `manufacturing-detail-modal.tsx` - 1 fix
- `edit-organization-modal.tsx`, `organization-detail-modal.tsx` - 4 fixes
- `DataCapsule.tsx` - 2 fixes
- `product-variants.tsx`, `category-products.tsx`, `customer-order-form.tsx`, `variant-design-archive.tsx` - 4 fixes
- `salesperson-action-panel.tsx`, `salesperson-workflow-dashboard.tsx` - 4 fixes

**Best Practice**: Always use array segment format for React Query keys to ensure cache invalidation works correctly with prefix matching.

### Manufacturer Role UX Simplification (January 2026)
Simplified the manufacturing pages for non-technical manufacturer role users.

**Query Errors Fixed** (`client/src/pages/manufacturer-home.tsx`):
- Removed unused `/api/manufacturing` query that caused 403 errors for manufacturer role users
- Manufacturer pages now only use `/api/manufacturer-portal/*` endpoints which are scoped to their permissions

**Navigation Improvements** (`client/src/pages/manufacturer-queue.tsx`, `manufacturer-job-detail.tsx`):
- All back buttons now consistently navigate to `/manufacturer/home`
- Removed confusing navigation to `/manufacturer-portal` which was a different view
- Clear, consistent navigation flow: Home → Queue → Job Detail → Home

**Large CTAs for Non-Tech Users** (`client/src/pages/manufacturer-job-detail.tsx`):
- Action buttons now 64px tall with full color backgrounds
- Grid layout (1-2 columns) for clear visibility
- Larger icons (w-6 h-6) and text (text-lg font-semibold)
- Active state with scale transform for touch feedback
- Improved "Job Complete" state with green success styling

**Type Fixes** (`server/routes/manufacturer-portal.routes.ts`):
- Fixed userId type from number to string for manufacturer associations
- Fixed printMethod null vs undefined type mismatch

**Removed Unnecessary Cache Invalidations**:
- Cleaned up `/api/manufacturing` cache invalidations from manufacturer-portal.tsx and manufacturer-job-detail.tsx
- These were attempting to invalidate endpoints that manufacturer role cannot access