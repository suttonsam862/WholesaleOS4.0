# Wholesale Management System

## Overview
A comprehensive wholesale management platform designed to streamline wholesale operations, enhance collaboration, and provide valuable insights for various user roles. The platform offers robust order management, automated manufacturing workflows, granular permission controls, task management, and real-time communication tracking. The business vision is to establish a central hub for efficient wholesale trade, improving operational efficiency and driving data-driven decision-making to increase market potential.

## Recent Changes
- **Order Management Enhancement (2025-12-03)**: Enhanced external form submission to automatically match or create organization/contact records. Form submissions now: (1) match existing organizations by fuzzy case-insensitive name, (2) match contacts by email (primary) or name+org (fallback), (3) create new org/contact if no match found, (4) update order with submitted contact info and shipping/billing addresses. Also added full order editing in detail modal for organization, contact info (name/email/phone), salesperson assignment (admin only), and shipping/billing addresses.
- **Bug Fixes (2025-12-03)**: Fixed critical line item save bug where edits weren't persisting - now excludes computed database columns (qtyTotal, lineTotal) from update mutations. Fixed size grid display from grid-cols-11 to grid-cols-12 with responsive sizing to properly show double-digit quantities.
- **UX Enhancement (2025-12-02)**: Improved tracking visibility and PWA support. Added prominent tracking cards with clickable carrier hotlinks (UPS, FedEx, USPS) for salespeople in order details and customers on order forms. Enhanced manufacturing modal with always-visible tracking section for easy editing. Added salesperson full name display in orders split view. Cleaned up Documents & Links section with visual button-like cards. Added PWA support with manifest.json and iOS meta tags for home screen installation.
- **Feature Update (2025-11-30)**: Enhanced Financial Matching tab on Finance page. Now shows ALL orders in the database (no year restriction). Added organization filter, year filter, and sorting options (newest/oldest, net cash flow, order code). Users can match any order with invoices, commissions, and expense payments through the FinancialMatchingModal.
- **Feature Update (2025-11-26)**: Added DataCapsule quick view integration to Manufacturing page. Clicking the Eye icon on manufacturing records opens the DataCapsule modal showing the related order details. DataCapsule provides a glass-morphism styled view with collapsible line items, beautiful image gallery with lightbox, and callback to open the full detail modal.
- **Bug Fix (2025-11-26)**: Fixed critical line item refresh bug by passing user parameter to `getManufacturingRecord()` function in manufacturing routes.
- **Enhancement (2025-11-26)**: Enhanced DataCapsule component with collapsible line items, image gallery with lightbox, and onOpenFullView callback for seamless modal switching.
- **Finance Fix (2025-11-26)**: Fixed Finance page to fetch real revenue data from `/api/financial/overview` endpoint displaying totalRevenue, totalPaid, pendingCommissions, and paidCommissions metrics.
- **Feature Update (2025-11-14)**: Changed manufacturer role access control to grant system-wide visibility. Manufacturer role users now see ALL manufacturing records and updates across the entire system (matching admin-level visibility), rather than being restricted to only records assigned to their associated manufacturers. Updated `getManufacturing`, `getManufacturingRecord`, `getArchivedManufacturing`, and `getManufacturingUpdates` functions in `server/storage.ts` to remove manufacturer-scoped filtering.

## User Preferences
- Keep the task system simple and user-friendly
- Allow both admins and individual users to create and manage tasks
- Show task descriptions clearly
- Tasks should be accessible on all user pages
- Manufacturing workflow should be streamlined - no re-entry of data
- Don't block manufacturing for missing manufacturer assignments

## System Architecture

### UI/UX Decisions
- Role-specific dashboards (Admin, Sales, Designer, Ops, Manufacturer, Finance).
- Modular modal system for CRUD operations.
- Kanban boards for workflow management, including drag-and-drop for design jobs and tasks.
- Transparent organization logos on order cards.
- Responsive design with mobile support.
- Spreadsheet-style view for orders with dynamic grouping and WCAG 2.0 compliant text contrast.

### Technical Implementations
- **Database Schema**: Comprehensive schema including Users, Organizations, Leads, Products, Orders, Design Jobs, Manufacturing, Invoices, Quotes, Events, Contacts, Permissions, Salespeople, Tasks, and Manufacturing Update Line Items.
- **API Structure**: Authentication, resource-specific CRUD for all entities, user-specific permission overrides, communication logging, lead archiving, sales analytics, task management, manufacturing updates with auto-populated line items and image uploads, operational tools, and dynamic configuration endpoint for manufacturing stages.
- **Frontend Components**: Task Management UI, Manufacturing Detail Modal, `ObjectUploader` for Google Cloud Storage integration, organized attachment display for design jobs, `ImageViewer` for full-screen previews, and `DesignAttachmentManager` for attachment handling.

### Feature Specifications
- **Manufacturing Workflow**: Auto-population of line items, image upload via GCS, automatic and manual image sync, warnings for missing manufacturer assignments, inline editing, smart line item name fallback, line item refresh, support for various design file uploads, server-side PDF generation, and a 7-stage workflow system with role-based transitions and dynamic configuration. Includes tracking number and carrier synchronization.
- **Task Management**: Full CRUD operations with role-based permissions and analytics.
- **Design Jobs Attachment System**: Schema enhancement for attachment URLs, `DesignAttachmentManager` for categorized uploads, kanban board for status, and role-based filtering.
- **Security & Permissions**: Database-first permission system with dual-layer architecture (role permissions + user overrides), permission translation layer, `viewAll` security, custom role support, permission seeding, cache invalidation, and user-specific permission overrides. Includes financial data filtering and manufacturer-scoped data access.
- **Communication Logging**: Real-time tracking of lead interactions.
- **Organization Management**: Organization logo upload with real-time preview.
- **Spreadsheet Orders View**: Dynamic grouping, gradient row backgrounds based on organization logos, tab-based interface, and comprehensive column display.
- **Financial Matching**: Tab within Finance page showing ALL orders from the entire database (no year restriction). Features search, match status filter, organization filter, year filter, and multiple sorting options. Modal-based workflow displays inflows (invoice payments) and outflows (commissions, costs) in two columns. Users can assign unlinked transactions to orders, view auto-assigned transactions, and track complete financial flows at the order level. Includes financial summary cards showing total inflows, outflows, and net cash flow.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Google Cloud Storage (GCS)**: For secure image and file uploads.
- **Twilio**: For SMS communication.
- **Outlook/SendGrid**: For email communication.
- **WebSocket**: For real-time notifications.