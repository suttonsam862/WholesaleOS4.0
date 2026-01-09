# Rich Habits ERP System

## Overview
This full-stack Enterprise Resource Planning (ERP) system for Rich Habits LLC manages the entire business workflow for custom athletic apparel manufacturing. It covers sales lead tracking, design, manufacturing, and delivery. Key capabilities include sales pipeline management, design job workflows, production tracking, financial management (invoicing, payments, QuickBooks integration), Shopify-integrated team stores, and event management. The system features role-based access control for Admin, Sales, Designer, Ops, Manufacturer, and Finance roles. The business vision is to streamline operations, enhance efficiency, and provide a comprehensive platform for managing all aspects of custom apparel manufacturing, aiming for significant market potential through robust process automation and improved customer experience.

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
- **Mobile Optimization**: App-wide responsiveness, touch-first interactions, `DataViewToggle`, `MobileDataCard`, `ResponsiveDialog`, safe area support, compact layouts, and consistent mobile patterns (44px touch targets, collapsible sections, horizontal scroll areas). Features include shimmer loading, spring physics animations, and various micro-interactions (`PressFeedback`, `PullToRefresh`, `SmoothScrollArea`). Glassmorphic spreadsheet components are used for enhanced data visualization.

### Backend Architecture
- **Runtime & Language**: Node.js with Express.js, TypeScript with ES modules.
- **API Design**: RESTful JSON APIs with Zod schema validation.
- **Authentication**: Session-based with role-based middleware.
- **Structure**: Modular route files organized by domain.
- **Security**: CSRF protection, general API rate limiting, and auth-specific rate limiting.

### Data Layer
- **ORM**: Drizzle ORM (PostgreSQL dialect).
- **Database**: PostgreSQL (Neon serverless compatible).
- **Schema**: `shared/schema.ts` for frontend/backend consistency.
- **Migrations**: Drizzle Kit.
- **Key Models**: Users (role-based), Organizations, Orders, Manufacturing records, Design jobs, Quotes.

### Shared Code
- `shared/` directory contains Drizzle and Zod schemas and type definitions for full-stack type safety.

## External Dependencies

### Database
- **PostgreSQL**: Via Neon Serverless (`@neondatabase/serverless`).

### Cloud Storage
- **Google Cloud Storage**: (`@google-cloud/storage`) for file uploads.

### Email Service
- **SendGrid**: (`@sendgrid/mail`) for transactional emails.

### Planned Integrations
- **Shopify Admin API**: For team store creation and product synchronization.
- **QuickBooks Online**: For invoice and payment workflows.
- **Printful API**: For print-on-demand fulfillment.
- **Google Gemini**: For AI-powered features.
- **Pantone Connect API**: For color matching.