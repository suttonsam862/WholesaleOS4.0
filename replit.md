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