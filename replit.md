# Wholesale Management System

## Overview
A comprehensive wholesale management platform designed to streamline wholesale operations, enhance collaboration, and provide valuable insights for various user roles. The platform offers robust order management, automated manufacturing workflows, granular permission controls, task management, and real-time communication tracking. The business vision is to establish a central hub for efficient wholesale trade, improving operational efficiency and driving data-driven decision-making to increase market potential.

## User Preferences
- Keep the task system simple and user-friendly
- Allow both admins and individual users to create and manage tasks
- Show task descriptions clearly
- Tasks should be accessible on all user pages
- Manufacturing workflow should be streamlined - no re-entry of data
- Don't block manufacturing for missing manufacturer assignments

## System Architecture

### UI/UX Decisions
- Role-specific dashboards (Admin, Sales, Designer, Ops, Manufacturer, Finance) with organized landing pages, quick-action cards, and status cards.
- Modular modal system for CRUD operations.
- Kanban boards for workflow management, including drag-and-drop for design jobs and tasks.
- Transparent organization logos on order cards.
- Responsive design with mobile support and PWA support.
- Spreadsheet-style view for orders with dynamic grouping and WCAG 2.0 compliant text contrast.
- Consistent styling with glass-card elements and SplitView layouts for detail views.

### Technical Implementations
- **Database Schema**: Comprehensive schema including Users, Organizations, Leads, Products, Orders, Design Jobs, Manufacturing, Invoices, Quotes, Events, Contacts, Permissions, Salespeople, Tasks, and Manufacturing Update Line Items. New tables for `manufacturer_jobs` and `manufacturer_events`.
- **API Structure**: Authentication, resource-specific CRUD for all entities, user-specific permission overrides, communication logging, lead archiving, sales analytics, task management, manufacturing updates with auto-populated line items and image uploads, operational tools, and dynamic configuration endpoint for manufacturing stages. Includes endpoints for role-specific home pages and manufacturer portal jobs.
- **Frontend Components**: Reusable `LandingHub` component, `ObjectUploader` for Google Cloud Storage integration, `ImageViewer`, `DesignAttachmentManager`, `WorkflowTile`, `QueueWidget`, `RoleHomeLayout`, `DataCapsule` for quick views, and components for financial matching.
- **Routing System**: Centralized routing configuration with automatic permission enforcement using `AppShell`, `PermissionGuard` (resource-based), and `RoleGuard` (role-based) components. Supports feature flag gating for gradual deployment of new features.

### Feature Specifications
- **Manufacturing Workflow**: Auto-population of line items, image upload via GCS, automatic and manual image sync, warnings for missing manufacturer assignments, inline editing, smart line item name fallback, line item refresh, support for various design file uploads, server-side PDF generation, and a 7-stage workflow system with role-based transitions and dynamic configuration. Includes tracking number and carrier synchronization.
- **Manufacturer Portal**: A dedicated portal with a fine-grained 15-status internal workflow (intake_pending to delivered_confirmed) organized into 5 zones, mapping to the 7-stage public workflow. Features a Kanban board, job event history, and secure RBAC with manufacturer ownership validation. Includes a Hub → Queue → Detail navigation pattern.
- **Task Management**: Full CRUD operations with role-based permissions and analytics.
- **Design Jobs Attachment System**: Schema enhancement for attachment URLs, `DesignAttachmentManager` for categorized uploads, kanban board for status, and role-based filtering. Supports PSD files up to 100MB.
- **Security & Permissions**: Database-first permission system with dual-layer architecture (role permissions + user overrides), permission translation layer, `viewAll` security, custom role support, permission seeding, cache invalidation, and user-specific permission overrides.
- **Order Management**: Enhanced external form submission for automatic organization/contact matching or creation. Full order editing in detail modal for organization, contact info, salesperson assignment, and shipping/billing addresses.
- **Financial Matching**: A tab within the Finance page displaying all orders, with search, match status, organization, year filters, and multiple sorting options. Modal-based workflow shows inflows (invoice payments) and outflows (commissions, costs), allowing users to assign unlinked transactions and view financial summaries.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Google Cloud Storage (GCS)**: For secure image and file uploads.
- **Twilio**: For SMS communication.
- **Outlook/SendGrid**: For email communication.
- **WebSocket**: For real-time notifications.