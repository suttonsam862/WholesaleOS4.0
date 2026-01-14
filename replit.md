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

## Recent Changes

### AI Design Lab - Full Implementation (January 2026)
- **AI Design Lab Module**: Complete AI-powered design generation system for custom athletic apparel
  - `/design-lab` - Project list with creation, filtering, and stats
  - `/design-lab/:id` - Full-screen project editor with canvas, layer panel, and properties
  - `/design-lab/admin` - Admin template and overlay management

- **Database Schema**: 6 new tables for design data
  - `designTemplates` - Reusable base templates (admin-managed)
  - `designLockedOverlays` - Non-removable overlays for branding
  - `designProjects` - User design projects with versioning
  - `designVersions` - Version history with generation metadata
  - `designLayers` - Layer-based composition with positioning
  - `designGenerationRequests` - AI generation request tracking

- **AI Generation**: OpenAI integration via Replit AI Integrations
  - Style presets: athletic, modern, vintage, bold
  - Async generation with progress polling
  - Front/back apparel design generation
  - Base64 image storage in version records

- **Key Features**:
  - Version history with restore and comparison
  - Front/back view toggle with canvas preview
  - Layer management with visibility controls
  - Finalize workflow with design job attachment
  - Admin template and overlay CRUD

- **Security**: Role-based access with ownership validation
  - All project endpoints verify user ownership
  - Admin override for cross-user access
  - RBAC via `designJobs` resource permission

### AI Design Lab - Enhancements (January 2026)
- **Product Template Support**: Added front/back template images for product variants
  - `frontTemplateUrl` and `backTemplateUrl` fields in productVariants schema
  - Upload UI in variant edit modal for template images
  - Composite image generation overlays AI designs onto product templates

- **Image Compositing Service**: New `image-composite.service.ts` using sharp
  - Blends AI-generated designs onto product template images
  - Produces `compositeFrontUrl` and `compositeBackUrl` for realistic mockups
  - Automatic compositing during version creation

- **Typography Iteration**: Full API implementation
  - `generateTypographyIteration` service function
  - Accepts fontFamily, fontSize, textColor, focusArea parameters
  - POST /api/design-lab/generate handles both base_generation and typography_iteration

- **Layer Property Controls**: Complete editor panel
  - Position (X, Y), Size (Width, Height) inputs
  - Rotation slider (-180° to 180°)
  - Scale slider (0.1x to 3.0x)
  - Opacity slider (0% to 100%)
  - Blend mode dropdown (normal, multiply, screen, overlay, darken, lighten)

- **Design Job Linkage**: Project creation integration
  - Optional design job selector in create project dialog
  - Filters to show only pending/in_progress jobs
  - Links projects to design jobs for workflow integration

- **Focus Area Tooling**: Admin template enhancements
  - Focus area mask upload in template forms
  - Overlay position/size inputs (positionX, positionY, width, height)
  - Improved template configuration for guided AI generation

### AI Design Lab - Training & Layer System (January 2026)
- **AI Training System**: Admin tools for training AI models
  - New tables: `designAiTrainingSets`, `designAiTrainingImages`, `designStylePresets`
  - Training set management with image upload and categorization
  - Style preset creation with customizable prompt modifiers
  - Admin UI tab for managing training data and presets

- **Enhanced Generation Workflow**: Redesigned Generate tab
  - Color picker for primary design color selection
  - Style preset selector (fetches from admin-created presets)
  - Base attributes form: theme/mood, key elements, things to avoid
  - Extended prompt building with all parameters
  - Design generation now creates elements for template compositing

- **Functional Layer System**: Complete layer management
  - Create layers by type (typography, logo, graphic)
  - Drag-to-reorder layers with @dnd-kit integration
  - Editable position boxes on canvas (drag, resize)
  - Layer visibility, lock, and delete controls
  - Per-layer reference image upload
  - Per-layer AI prompts for targeted generation

- **Template-Preserving Compositing**: Improved design output
  - Generated designs are composited onto product templates
  - Frontend now displays composite URLs when available
  - Raw AI output stored separately for layer editing
  - Garment structure preserved in final output

### AI Design Lab - Template-Locked Layer Editing (January 2026)
- **Version Auto-Bootstrap**: Projects automatically create version v1
  - Backend creates initial version on project creation
  - Legacy projects get version on first fetch if missing
  - Enables immediate layer creation without generating designs first

- **Canvas Layer Rendering**: Visual representation of all layers
  - Displays layer images, text content, and placeholders
  - Proper zIndex ordering for layer stacking
  - Selection handles for the active layer
  - Position-based rendering using stored pixel coordinates

- **Context-Aware Right Panel**: Mode-based UI
  - "Add Design" mode when no layer selected (quick presets, layer type buttons)
  - "Edit Layer" mode when layer selected (type-specific editors)
  - Smooth transitions between modes

- **Quick Area Presets**: One-click region selection
  - Center Chest (0.25, 0.15, 0.5, 0.25)
  - Left Chest (0.55, 0.12, 0.2, 0.15)
  - Full Front (0.1, 0.1, 0.8, 0.6)
  - Upper Back (0.2, 0.1, 0.6, 0.25) - auto-switches to back view
  - Selected preset applied when creating new layers

- **Layer-Specific Editors**:
  - Typography: Text input field for content
  - Logo: Image upload interface
  - Graphic/Generated: AI prompt input with idea chips

- **Normalized Bbox Storage**: Template-independent placement
  - Layers store both pixel position and normalized (0-1) bbox
  - Allows consistent placement across different template sizes
  - Position calculated from bbox using reference canvas dimensions