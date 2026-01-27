# WholesaleOS v5 Master Implementation Plan

## Complete System Overhaul: Manufacturing, Catalog, 3PL & Multi-Manufacturer Network

**Version:** 5.0.0
**Date:** January 2026
**Status:** APPROVED FOR AUTONOMOUS IMPLEMENTATION
**Prepared for:** Claude Code Autonomous Run

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current System Audit](#2-current-system-audit)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 1: Database Schema & Product Families](#4-phase-1-database-schema--product-families)
5. [Phase 2: Manufacturer Portal Redesign](#5-phase-2-manufacturer-portal-redesign)
6. [Phase 3: Catalog System & Auto-Routing](#6-phase-3-catalog-system--auto-routing)
7. [Phase 4: 3PL Management System](#7-phase-4-3pl-management-system)
8. [Phase 5: Manufacturer Onboarding](#8-phase-5-manufacturer-onboarding)
9. [Phase 6: Payment Terms & Financial Controls](#9-phase-6-payment-terms--financial-controls)
10. [Component Specifications](#10-component-specifications)
11. [API Endpoint Specifications](#11-api-endpoint-specifications)
12. [Database Migration Scripts](#12-database-migration-scripts)
13. [Testing Requirements](#13-testing-requirements)
14. [Security & Safeguards](#14-security--safeguards)
15. [Deployment Strategy](#15-deployment-strategy)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Project Overview

WholesaleOS v5 represents a complete transformation of the manufacturing and fulfillment infrastructure. The system is being redesigned to support a multi-manufacturer network where different product families are routed to specialized manufacturers, consolidated at third-party logistics (3PL) centers, quality checked, and shipped to customers.

### Core Business Requirements

1. **Multi-Manufacturer Network**: Support 6+ manufacturers across different regions (Pakistan, China, Turkey, Mexico) each specializing in different product types
2. **Product Family Routing**: Automatically route orders to the correct manufacturer based on product family → category → product → variant hierarchy
3. **3PL Consolidation**: All manufactured goods ship to a central fulfillment center for QC and customer shipping
4. **Payment Terms Management**: Track open accounts with manufacturers who offer NET30/NET60 terms
5. **Easy Manufacturer Onboarding**: Streamlined flow to add new manufacturers to the network
6. **Simplified Manufacturer UX**: Replace complex 15-stage funnel with intuitive 6-stage workflow

### Product Families

| Code | Name | Items | Primary Region |
|------|------|-------|----------------|
| WRESTLING | Wrestling & Combat Gear | Singlets, Rash guards, Fight shorts, Backpacks, Robes, Tech suits | Pakistan (Hawk) |
| BASICS_TOPS | Standard Basics - Tops | Shirts, Long sleeves, Crewnecks, Hoodies | Pakistan |
| BASICS_BOTTOMS | Standard Basics - Bottoms | Gym shorts, Shorts, Sweats | China |
| WOMENS_LOUNGE | Women's Loungewear | Sweat sets, Crop tops, Loungewear hoodies | Specialized |
| SPORTS_JERSEYS | American Sports Jerseys | Football, Baseball, Volleyball, Soccer, Basketball jerseys | Sialkot, Pakistan |
| ELEVATED | Elevated Essentials | Quarter-zips, Polos, Jackets, Vests | Turkey/Mexico |

### Current Pricing Baseline

| Item | Current Cost | Sell Price | Target Margin |
|------|--------------|------------|---------------|
| Singlet | $17 | $50 | 66% |
| Shirt | $6 | $12.50 | 52% |
| Long Sleeve | $8 | $15 | 47% |
| Hoodie/Crewneck | $16 | $30 | 47% |
| Sweats/Quarterzips | $14 | $25 | 44% |
| Rash guard/Shorts | $12 | $25 | 52% |

## 1.2 Technical Stack

**Current Stack (Maintained):**
- Frontend: React 18 + Vite + TypeScript
- Routing: Wouter
- State Management: TanStack Query (React Query)
- UI Components: Radix UI + Tailwind CSS
- Backend: Express.js + TypeScript
- Database: PostgreSQL + Drizzle ORM
- Authentication: Replit Auth + Local Auth
- File Storage: Object Storage (S3-compatible)

**No Changes to Core Stack** - All implementations must use existing patterns and libraries.

## 1.3 Implementation Principles

### CRITICAL RULES FOR AUTONOMOUS IMPLEMENTATION

1. **Preserve Existing Functionality**: Never remove or modify existing working features without explicit migration path
2. **Backward Compatibility**: All database changes must include migration scripts that preserve existing data
3. **Incremental Deployment**: Each phase must be deployable independently
4. **Type Safety**: All new code must be fully TypeScript typed with no `any` types
5. **Error Handling**: Every API endpoint must have comprehensive error handling
6. **Audit Logging**: All data mutations must be logged to audit_logs table
7. **Permission Checks**: All endpoints must validate user permissions before processing
8. **Mobile Responsiveness**: All new UI must work on mobile devices (manufacturers use phones on factory floor)
9. **Test Coverage**: All new features must include test specifications
10. **Documentation**: All new APIs must be documented inline

### File Naming Conventions

```
Routes:     /server/routes/{feature}.routes.ts
Services:   /server/services/{feature}.service.ts
Pages:      /client/src/pages/{feature-name}.tsx
Components: /client/src/components/{feature}/{ComponentName}.tsx
Hooks:      /client/src/hooks/use-{feature}.ts
Types:      /shared/types/{feature}.types.ts
```

### Code Style Requirements

```typescript
// All components must use this structure:
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface ComponentNameProps {
  // Explicit prop types
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Hooks at top
  // Event handlers
  // Render
}

// All API routes must use this structure:
router.get('/endpoint',
  requireAuth,
  requirePermission('resource:action'),
  async (req, res) => {
    try {
      // Implementation
    } catch (error) {
      console.error('Error description:', error);
      res.status(500).json({ error: 'User-friendly message' });
    }
  }
);
```

---

# 2. CURRENT SYSTEM AUDIT

## 2.1 Files to REMOVE (Archive First)

These files contain unused or overly complex code that will be replaced. Before removal, move to `/archive/v4/` directory.

### Manufacturing Control Floor (Remove Entire Folder)
```
/client/src/components/manufacturing-control-floor/
├── ProductionFloorCanvas.tsx    # REMOVE - Visual factory floor layout unused
├── ProductionZone.tsx           # REMOVE - Workstation grouping unused
├── ExceptionPanel.tsx           # REMOVE - Exception handling unused
├── FloorMetricsHUD.tsx          # REMOVE - Real-time metrics unused
└── index.ts                     # REMOVE - Exports
```

**Reason for Removal**: This entire system was designed for an in-house manufacturing model. With the shift to external manufacturers, the production floor visualization is irrelevant. Manufacturers will use their own systems for floor management.

### Duplicate Manufacturer Pages (Consolidate)
```
/client/src/pages/
├── manufacturer-job-detail.tsx  # REMOVE - Merge into portal
├── manufacturer-queue.tsx       # REMOVE - Merge into portal
├── manufacturer-home.tsx        # REMOVE - Merge into portal
```

**Reason for Removal**: These create a fragmented UX. All manufacturer functionality will be consolidated into a redesigned `manufacturer-portal.tsx`.

### Unused Database Tables (Mark Deprecated, Remove in Phase 5)

```sql
-- These tables exist but have no implementation
-- Do NOT drop immediately - mark as deprecated first

-- manufacturingBatches - No routes or UI exist
-- manufacturingBatchItems - No routes or UI exist
-- productionSchedules - No routes or UI exist
-- manufacturingNotifications - Table exists but notifications never sent
```

**Migration Strategy**:
1. Add `_deprecated` suffix to table names
2. Remove all foreign key references
3. After 30 days with no issues, drop tables

## 2.2 Files to MODIFY

### Schema Changes Required
```
/shared/schema.ts
- ADD: productFamilies table
- ADD: productFamilyManufacturers table
- ADD: fulfillmentCenters table
- ADD: inboundShipments table
- ADD: outboundShipments table
- ADD: inventoryItems table
- ADD: qcInspections table
- ADD: manufacturerDocuments table
- ADD: manufacturerPayments table
- ADD: manufacturerInvoices table
- MODIFY: categories - add productFamilyId
- MODIFY: products - add productFamilyId
- MODIFY: manufacturers - add 15+ new fields
```

### Route Changes Required
```
/server/routes/
- MODIFY: manufacturing.routes.ts - Add product family awareness
- MODIFY: manufacturer-portal.routes.ts - Simplify status system
- ADD: product-families.routes.ts - New CRUD endpoints
- ADD: fulfillment.routes.ts - 3PL management
- ADD: manufacturer-onboarding.routes.ts - Onboarding flow
- ADD: manufacturer-payments.routes.ts - Payment tracking
```

### Page Changes Required
```
/client/src/pages/
- MODIFY: manufacturer-portal.tsx - Complete redesign
- MODIFY: catalog.tsx - Add product family views
- MODIFY: manufacturing.tsx - Add family-based filtering
- ADD: product-families.tsx - Family management
- ADD: fulfillment-centers.tsx - 3PL management
- ADD: fulfillment-inbound.tsx - Inbound tracking
- ADD: fulfillment-inventory.tsx - Inventory view
- ADD: fulfillment-qc.tsx - QC workflow
- ADD: manufacturer-onboarding.tsx - Onboarding wizard
- ADD: manufacturer-payments.tsx - Payment tracking
```

## 2.3 Current Pain Points (Must Address)

### Pain Point 1: Dual Status System
**Current State**: Manufacturing has 7 public statuses while manufacturerJobs has 15 internal statuses. These can desync.

**Evidence in Code**:
```typescript
// /shared/constants.ts
export const MANUFACTURER_TO_PUBLIC_STATUS_MAP = {
  'intake_pending': 'awaiting_admin_confirmation',
  'specs_lock_review': 'awaiting_admin_confirmation',
  'specs_locked': 'confirmed_awaiting_manufacturing',
  // ... 12 more mappings that can get out of sync
};
```

**Solution**: Single unified status system with role-based visibility. Manufacturers see friendly names, admins see all details.

### Pain Point 2: No Product Family Concept
**Current State**: Manufacturer routing only exists at variant level via `product_variants.default_manufacturer_id`.

**Evidence in Code**:
```typescript
// Current: Must set manufacturer on every single variant
// No way to say "all hoodies go to Manufacturer X"
```

**Solution**: Hierarchical routing: Family → Category → Product → Variant with inheritance.

### Pain Point 3: Manual Order Splitting
**Current State**: Orders with items for multiple manufacturers cannot be automatically split.

**Evidence**: No code exists for order splitting. All items in an order go to one manufacturer.

**Solution**: Auto-routing system that groups line items by resolved manufacturer and creates separate manufacturing jobs.

### Pain Point 4: No 3PL Integration
**Current State**: Once manufacturing marks "shipped", tracking ends. No visibility into fulfillment.

**Evidence**: `order_tracking_numbers` table only stores tracking number, no fulfillment center awareness.

**Solution**: Complete 3PL management system with inbound receiving, QC, inventory, and outbound shipping.

### Pain Point 5: No Payment Terms Tracking
**Current State**: No way to track open balances with manufacturers or enforce credit limits.

**Evidence**: `manufacturers` table has no financial fields.

**Solution**: Add account_balance, credit_limit, payment history, and aging reports.

### Pain Point 6: Complex Manufacturer UX
**Current State**: 15-stage funnel with technical terminology confuses manufacturers.

**Evidence in Code**:
```typescript
// manufacturer-portal.routes.ts
const MANUFACTURER_FUNNEL_STATUSES = [
  'intake_pending',
  'specs_lock_review',
  'specs_locked',
  'materials_reserved',
  'samples_in_progress',
  'samples_awaiting_approval',
  'samples_approved',
  'samples_revise',
  'bulk_cutting',
  'bulk_print_emb_sublim',
  'bulk_stitching',
  'bulk_qc',
  'packing_complete',
  'handed_to_carrier',
  'delivered_confirmed'
];
// This is overwhelming for non-technical manufacturers
```

**Solution**: 6-stage simplified flow with clear actions at each stage.

## 2.4 Code Quality Issues to Fix

### Issue 1: N+1 Query Patterns
**Location**: `/client/src/pages/manufacturing-list.tsx`
```typescript
// CURRENT (BAD): Fetches all manufacturing, then enriches client-side
const { data: manufacturing } = useQuery(['manufacturing'], fetchManufacturing);
const { data: orders } = useQuery(['orders'], fetchOrders);
const { data: orgs } = useQuery(['organizations'], fetchOrganizations);
// Then manually joins in memory
```

**Fix**: Create server-side enriched endpoints that return joined data.

### Issue 2: Inconsistent Permission Checks
**Location**: Various routes
```typescript
// SOME routes check manufacturer ownership
if (user.role === 'manufacturer') {
  const association = await getManufacturerAssociation(user.id);
  // validate ownership
}

// OTHER routes don't check ownership at all
// This is a security risk
```

**Fix**: Standardize ownership checks in middleware.

### Issue 3: Hardcoded Status Values
**Location**: Multiple files
```typescript
// Status strings are scattered throughout codebase
if (status === 'awaiting_admin_confirmation') // in routes
if (status === 'awaiting_admin_confirmation') // in components
// If we change the string, must update everywhere
```

**Fix**: Single source of truth for statuses in `/shared/constants.ts` with TypeScript enums.

---

# 3. ARCHITECTURE OVERVIEW

## 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WHOLESALEOS v5                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   SALES     │    │    OPS      │    │   ADMIN     │    │ MANUFACTURER│  │
│  │   PORTAL    │    │   PORTAL    │    │   PORTAL    │    │   PORTAL    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┼──────────────────┼──────────────────┘          │
│                            │                  │                              │
│                            ▼                  ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         REACT FRONTEND                               │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Orders   │ │ Catalog   │ │Manufacturing│ │Fulfillment│           │   │
│  │  │  Module   │ │  Module   │ │   Module   │ │  Module   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         EXPRESS API                                  │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Orders   │ │ Products  │ │Manufacturing│ │Fulfillment│           │   │
│  │  │  Routes   │ │  Routes   │ │   Routes   │ │  Routes   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      POSTGRESQL + DRIZZLE ORM                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    CORE TABLES                               │    │   │
│  │  │  orders │ products │ categories │ manufacturers │ users      │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    NEW TABLES (v5)                           │    │   │
│  │  │  product_families │ fulfillment_centers │ inbound_shipments │    │   │
│  │  │  inventory_items │ qc_inspections │ manufacturer_payments    │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SYSTEMS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ MANUFACTURER│    │ MANUFACTURER│    │ MANUFACTURER│    │ MANUFACTURER│  │
│  │   (HAWK)    │    │  (RIDDLE)   │    │   (ZAB)     │    │  (TURKEY)   │  │
│  │  Wrestling  │    │ Basics Tops │    │Sports Jersey│    │  Elevated   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         3PL FULFILLMENT CENTER                       │   │
│  │                      (Medallion / Logos Distribution)                │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │ Receiving │→│    QC     │→│ Inventory │→│ Shipping  │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            CUSTOMER                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Data Flow: Order to Delivery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORDER TO DELIVERY DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: ORDER CREATION
━━━━━━━━━━━━━━━━━━━━━━
Customer/Sales creates order with line items
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ ORDER                                               │
│ ├─ Line Item 1: Hoodie (BASICS_TOPS family)        │
│ ├─ Line Item 2: Singlet (WRESTLING family)         │
│ └─ Line Item 3: Quarter-zip (ELEVATED family)      │
└─────────────────────────────────────────────────────┘

STEP 2: MANUFACTURER RESOLUTION (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System resolves manufacturer for each line item
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ RESOLUTION CASCADE (per line item):                 │
│                                                     │
│ 1. Check variant.default_manufacturer_id            │
│    └─ If set, use this manufacturer                │
│                                                     │
│ 2. Else check product.product_family_id             │
│    └─ Get family's default_manufacturer_id          │
│                                                     │
│ 3. Else check category.product_family_id            │
│    └─ Get family's default_manufacturer_id          │
│                                                     │
│ 4. Else use system default manufacturer             │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ RESOLVED ASSIGNMENTS:                               │
│ ├─ Line Item 1 → Riddle Apparel (Pakistan)         │
│ ├─ Line Item 2 → Hawk Manufacturing (Pakistan)     │
│ └─ Line Item 3 → Last Textile (Turkey)             │
└─────────────────────────────────────────────────────┘

STEP 3: MANUFACTURING JOB CREATION (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System groups line items and creates jobs per manufacturer
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ MANUFACTURING JOBS CREATED:                         │
│                                                     │
│ Job MFG-2026-001A (Riddle Apparel)                 │
│ └─ Line Item 1: Hoodie × quantities                │
│                                                     │
│ Job MFG-2026-001B (Hawk Manufacturing)             │
│ └─ Line Item 2: Singlet × quantities               │
│                                                     │
│ Job MFG-2026-001C (Last Textile)                   │
│ └─ Line Item 3: Quarter-zip × quantities           │
│                                                     │
│ Parent Order: ORD-2026-001                         │
│ └─ Links to all 3 manufacturing jobs               │
└─────────────────────────────────────────────────────┘

STEP 4: MANUFACTURER WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each manufacturer works their job through simplified workflow
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ SIMPLIFIED 6-STAGE WORKFLOW (NEW IN v5):           │
│                                                     │
│ ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│ │   NEW   │ → │ACCEPTED │ → │ CUTTING │           │
│ └─────────┘   └─────────┘   └─────────┘           │
│                                  │                 │
│                                  ▼                 │
│ ┌─────────┐   ┌─────────┐   ┌─────────┐           │
│ │ SHIPPED │ ← │   QC    │ ← │PRODUCTION│          │
│ └─────────┘   └─────────┘   └─────────┘           │
│                                                     │
│ At SHIPPED: Manufacturer enters tracking number    │
│ System creates inbound_shipment to 3PL             │
└─────────────────────────────────────────────────────┘

STEP 5: 3PL RECEIVING (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3PL receives shipments from all manufacturers
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ INBOUND SHIPMENT TRACKING:                          │
│                                                     │
│ Shipment INB-001 (from Riddle)                     │
│ ├─ Status: IN_TRANSIT → DELIVERED → RECEIVED       │
│ ├─ Expected: Jan 15                                │
│ ├─ Received: Jan 14                                │
│ └─ Triggers: QC Inspection creation                │
│                                                     │
│ Shipment INB-002 (from Hawk)                       │
│ ├─ Status: IN_TRANSIT                              │
│ ├─ Expected: Jan 18                                │
│ └─ Tracking: FedEx 1234567890                      │
│                                                     │
│ Shipment INB-003 (from Last Textile)               │
│ ├─ Status: PENDING                                 │
│ └─ Expected: Jan 25                                │
└─────────────────────────────────────────────────────┘

STEP 6: QUALITY CONTROL (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3PL inspects received goods
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ QC INSPECTION WORKFLOW:                             │
│                                                     │
│ Inspection QC-001 (for INB-001)                    │
│ ├─ Inspector: 3PL Staff                            │
│ ├─ Status: PENDING → IN_PROGRESS → COMPLETE        │
│ │                                                   │
│ ├─ Checklist:                                      │
│ │   ☑ Quantity matches packing slip                │
│ │   ☑ No visible defects                           │
│ │   ☑ Correct sizes                                │
│ │   ☑ Correct colors                               │
│ │   ☑ Print/embroidery quality acceptable          │
│ │   ☐ Packaging intact                             │
│ │                                                   │
│ ├─ Issues Found:                                   │
│ │   └─ 2 units with minor thread loose             │
│ │                                                   │
│ ├─ Photos: [url1, url2, url3]                      │
│ │                                                   │
│ └─ Result: PASSED_WITH_NOTES                       │
│                                                     │
│ On PASS: Items added to inventory                  │
│ On FAIL: Issue ticket created, manufacturer notified│
└─────────────────────────────────────────────────────┘

STEP 7: INVENTORY UPDATE (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Passed items added to 3PL inventory
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ INVENTORY ITEMS:                                    │
│                                                     │
│ INV-001                                            │
│ ├─ Variant: Hoodie-BLK-L                           │
│ ├─ Quantity: 50                                    │
│ ├─ Location: Bin A-12-3                            │
│ ├─ Fulfillment Center: Medallion LA                │
│ ├─ Received: Jan 14, 2026                          │
│ └─ Order Reserved: ORD-2026-001                    │
│                                                     │
│ When all items for order are in inventory:         │
│ └─ Order marked READY_TO_SHIP                      │
└─────────────────────────────────────────────────────┘

STEP 8: ORDER CONSOLIDATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System checks if all order items are ready
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ ORDER CONSOLIDATION STATUS:                         │
│                                                     │
│ Order: ORD-2026-001                                │
│ ├─ Line Item 1 (Hoodie): ✓ In inventory            │
│ ├─ Line Item 2 (Singlet): ✗ In transit             │
│ └─ Line Item 3 (Quarter-zip): ✗ In production      │
│                                                     │
│ Status: AWAITING_ITEMS (2 of 3 ready)              │
│                                                     │
│ When all items ready:                              │
│ └─ Trigger: Create outbound shipment               │
└─────────────────────────────────────────────────────┘

STEP 9: OUTBOUND SHIPPING (NEW IN v5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3PL ships consolidated order to customer
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ OUTBOUND SHIPMENT:                                  │
│                                                     │
│ Shipment OUT-001                                   │
│ ├─ Order: ORD-2026-001                             │
│ ├─ Fulfillment Center: Medallion LA                │
│ ├─ Carrier: UPS                                    │
│ ├─ Tracking: 1Z999AA10123456784                    │
│ ├─ Ship Date: Jan 20, 2026                         │
│ ├─ Estimated Delivery: Jan 23, 2026               │
│ │                                                   │
│ ├─ Contents:                                       │
│ │   ├─ 50× Hoodie-BLK-L                           │
│ │   ├─ 25× Singlet-RED-M                          │
│ │   └─ 30× QuarterZip-NAV-XL                      │
│ │                                                   │
│ └─ Customer: ABC Sports Team                       │
│    └─ Address: 123 Main St, Chicago, IL            │
│                                                     │
│ Tracking email sent to customer automatically      │
└─────────────────────────────────────────────────────┘

STEP 10: DELIVERY CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order delivered, cycle complete
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ ORDER COMPLETE:                                     │
│                                                     │
│ Order: ORD-2026-001                                │
│ ├─ Status: COMPLETED                               │
│ ├─ Delivered: Jan 22, 2026                         │
│ │                                                   │
│ ├─ Manufacturing Summary:                          │
│ │   ├─ Job MFG-001A: Completed Jan 12              │
│ │   ├─ Job MFG-001B: Completed Jan 14              │
│ │   └─ Job MFG-001C: Completed Jan 18              │
│ │                                                   │
│ ├─ 3PL Summary:                                    │
│ │   ├─ All items received by Jan 19               │
│ │   ├─ QC passed Jan 19                            │
│ │   └─ Shipped Jan 20                              │
│ │                                                   │
│ └─ Financial:                                      │
│     ├─ Total Revenue: $2,500                       │
│     ├─ Manufacturing Cost: $1,050                  │
│     ├─ 3PL Cost: $45                               │
│     ├─ Shipping Cost: $85                          │
│     └─ Gross Profit: $1,320 (52.8%)               │
└─────────────────────────────────────────────────────┘
```

## 3.3 Role-Based Access Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLE-BASED ACCESS MATRIX                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ FEATURE                    │ ADMIN │ OPS │ SALES │ FINANCE │ MANUFACTURER │ │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│                                                                               │
│ PRODUCT FAMILIES                                                              │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│ View families              │  ✓    │  ✓  │   ✓   │    ✓    │      ✗       │ │
│ Create/edit families       │  ✓    │  ✗  │   ✗   │    ✗    │      ✗       │ │
│ Assign manufacturers       │  ✓    │  ✓  │   ✗   │    ✗    │      ✗       │ │
│ View family pricing        │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│                                                                               │
│ CATALOG                                                                       │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│ View products              │  ✓    │  ✓  │   ✓   │    ✓    │      ✗       │ │
│ Create/edit products       │  ✓    │  ✓  │   ✗   │    ✗    │      ✗       │ │
│ View cost data             │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│ Assign to families         │  ✓    │  ✓  │   ✗   │    ✗    │      ✗       │ │
│                                                                               │
│ MANUFACTURING                                                                 │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│ View all jobs              │  ✓    │  ✓  │   ◐   │    ✓    │      ✗       │ │
│ View own mfr jobs          │  ✓    │  ✓  │   ✗   │    ✗    │      ✓       │ │
│ Create jobs                │  ✓    │  ✓  │   ✗   │    ✗    │      ✗       │ │
│ Update job status          │  ✓    │  ✓  │   ✗   │    ✗    │      ◐       │ │
│ View job costs             │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│ Enter actual costs         │  ✓    │  ✓  │   ✗   │    ✗    │      ✓       │ │
│                                                                               │
│ 3PL / FULFILLMENT                                                             │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│ View fulfillment centers   │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│ Manage fulfillment centers │  ✓    │  ✗  │   ✗   │    ✗    │      ✗       │ │
│ View inbound shipments     │  ✓    │  ✓  │   ✗   │    ✗    │      ◐       │ │
│ View inventory             │  ✓    │  ✓  │   ◐   │    ✓    │      ✗       │ │
│ Perform QC                 │  ✓    │  ✓  │   ✗   │    ✗    │      ✗       │ │
│ View outbound shipments    │  ✓    │  ✓  │   ◐   │    ✓    │      ✗       │ │
│                                                                               │
│ MANUFACTURER MANAGEMENT                                                       │
│ ───────────────────────────┼───────┼─────┼───────┼─────────┼──────────────┤ │
│ View manufacturers         │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│ Create/edit manufacturers  │  ✓    │  ✗  │   ✗   │    ✗    │      ✗       │ │
│ View payment terms         │  ✓    │  ✓  │   ✗   │    ✓    │      ✗       │ │
│ Record payments            │  ✓    │  ✗  │   ✗   │    ✓    │      ✗       │ │
│ View own profile           │  ✓    │  ✓  │   ✗   │    ✗    │      ✓       │ │
│ Update own capabilities    │  ✓    │  ✗  │   ✗   │    ✗    │      ✓       │ │
│                                                                               │
│ LEGEND:                                                                       │
│ ✓ = Full access                                                               │
│ ◐ = Partial access (own records only, or limited fields)                     │
│ ✗ = No access                                                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.4 Status System Design

### Current Status System (REMOVE)

```
OLD MANUFACTURER FUNNEL (15 stages) - REMOVE THIS:
──────────────────────────────────────────────────
intake_pending
specs_lock_review
specs_locked
materials_reserved
samples_in_progress
samples_awaiting_approval
samples_approved
samples_revise
bulk_cutting
bulk_print_emb_sublim
bulk_stitching
bulk_qc
packing_complete
handed_to_carrier
delivered_confirmed

OLD PUBLIC STATUS (7 stages) - REMOVE THIS:
──────────────────────────────────────────────────
awaiting_admin_confirmation
confirmed_awaiting_manufacturing
cutting_sewing
printing
final_packing_press
shipped
complete
```

### New Unified Status System (IMPLEMENT)

```
NEW UNIFIED STATUS SYSTEM (6 stages):
══════════════════════════════════════════════════════════════════════════════

STATUS          │ DISPLAY NAME           │ COLOR    │ NEXT ACTIONS
════════════════╪════════════════════════╪══════════╪═══════════════════════════
NEW             │ "New Job"              │ #6366f1  │ Accept, Decline
                │                        │ (indigo) │
                │ Description: Job just  │          │ Manufacturer sees specs
                │ created, awaiting      │          │ and decides to accept
                │ manufacturer review    │          │
────────────────┼────────────────────────┼──────────┼───────────────────────────
ACCEPTED        │ "Accepted"             │ #8b5cf6  │ Start Production
                │                        │ (violet) │
                │ Description: Mfr has   │          │ Manufacturer reviews
                │ accepted, preparing    │          │ materials and schedules
                │ for production         │          │
────────────────┼────────────────────────┼──────────┼───────────────────────────
IN_PRODUCTION   │ "In Production"        │ #f59e0b  │ Mark Ready for QC
                │                        │ (amber)  │
                │ Description: Active    │          │ Cutting, sewing, printing
                │ manufacturing in       │          │ happening at factory
                │ progress               │          │
────────────────┼────────────────────────┼──────────┼───────────────────────────
QC              │ "Quality Check"        │ #3b82f6  │ Pass QC, Fail QC
                │                        │ (blue)   │
                │ Description: Mfr       │          │ Internal QC before ship
                │ performing quality     │          │ (not 3PL QC)
                │ inspection             │          │
────────────────┼────────────────────────┼──────────┼───────────────────────────
READY_TO_SHIP   │ "Ready to Ship"        │ #10b981  │ Mark Shipped
                │                        │ (emerald)│
                │ Description: QC passed │          │ Packaging complete,
                │ items packed and       │          │ awaiting carrier pickup
                │ ready for carrier      │          │
────────────────┼────────────────────────┼──────────┼───────────────────────────
SHIPPED         │ "Shipped"              │ #22c55e  │ (Terminal for Mfr)
                │                        │ (green)  │
                │ Description: Handed to │          │ Tracking entered,
                │ carrier, in transit    │          │ 3PL takes over
                │ to 3PL                 │          │
════════════════╧════════════════════════╧══════════╧═══════════════════════════

STATUS TRANSITION RULES:
────────────────────────
NEW → ACCEPTED          (Manufacturer accepts job)
NEW → DECLINED          (Manufacturer declines - reassign needed)
ACCEPTED → IN_PRODUCTION (Manufacturer starts work)
IN_PRODUCTION → QC      (Production complete, checking quality)
QC → IN_PRODUCTION      (QC failed, needs rework)
QC → READY_TO_SHIP      (QC passed)
READY_TO_SHIP → SHIPPED (Carrier picked up, tracking entered)

INVALID TRANSITIONS (BLOCK THESE):
──────────────────────────────────
NEW → IN_PRODUCTION     (Must accept first)
NEW → SHIPPED           (Cannot skip stages)
ACCEPTED → SHIPPED      (Must go through production)
SHIPPED → anything      (Terminal state for manufacturer)

DECLINED HANDLING:
──────────────────
When manufacturer declines:
1. Job status → DECLINED
2. Alert sent to ops team
3. Ops can reassign to backup manufacturer
4. New job created for backup, original marked DECLINED
```

### 3PL Status System (NEW)

```
3PL / FULFILLMENT STATUS SYSTEM:
══════════════════════════════════════════════════════════════════════════════

INBOUND SHIPMENT STATUSES:
──────────────────────────
STATUS          │ DESCRIPTION                          │ TRIGGERED BY
════════════════╪══════════════════════════════════════╪═══════════════════════
PENDING         │ Shipment expected, not yet shipped   │ Manufacturing job shipped
IN_TRANSIT      │ Carrier has package, tracking active │ Tracking shows movement
DELIVERED       │ Carrier shows delivered to 3PL       │ Carrier webhook/manual
RECEIVED        │ 3PL has physically received          │ 3PL marks received
QC_PENDING      │ Awaiting quality inspection          │ Auto after received
QC_IN_PROGRESS  │ QC inspection underway               │ Inspector starts
QC_PASSED       │ Inspection passed, add to inventory  │ Inspector marks pass
QC_FAILED       │ Inspection failed, issue created     │ Inspector marks fail
════════════════╧══════════════════════════════════════╧═══════════════════════

OUTBOUND SHIPMENT STATUSES:
───────────────────────────
STATUS          │ DESCRIPTION                          │ TRIGGERED BY
════════════════╪══════════════════════════════════════╪═══════════════════════
PENDING         │ Order ready, awaiting pick           │ All items in inventory
PICKING         │ 3PL pulling items from bins          │ Pick started
PACKING         │ Items being packed for shipment      │ Pick complete
READY           │ Packed, awaiting carrier             │ Pack complete
SHIPPED         │ Carrier has package                  │ Carrier pickup
IN_TRANSIT      │ Package in carrier network           │ Tracking shows movement
DELIVERED       │ Customer received                    │ Carrier confirms delivery
════════════════╧══════════════════════════════════════╧═══════════════════════

INVENTORY ITEM STATUSES:
────────────────────────
STATUS          │ DESCRIPTION
════════════════╪══════════════════════════════════════
AVAILABLE       │ In stock, can be allocated to orders
RESERVED        │ Allocated to specific order
PICKING         │ Being picked for order
SHIPPED         │ Left the fulfillment center
DAMAGED         │ Damaged during handling, not available
RETURNED        │ Customer return, pending inspection
════════════════╧══════════════════════════════════════
```

---

# 4. PHASE 1: DATABASE SCHEMA & PRODUCT FAMILIES

## 4.1 Overview

Phase 1 establishes the foundational database changes required for the multi-manufacturer network. This phase MUST be completed before any other phases can begin.

### Objectives
1. Create product_families table and seed with 6 initial families
2. Create product_family_manufacturers junction table
3. Add product_family_id to categories and products tables
4. Enhance manufacturers table with new fields
5. Create API endpoints for product family management
6. Build admin UI for managing product families

### Dependencies
- None (this is the foundation)

### Estimated Duration
- 2-3 weeks

## 4.2 Database Schema Changes

### 4.2.1 New Table: product_families

```sql
-- ============================================================================
-- TABLE: product_families
-- PURPOSE: Define product groupings for manufacturer routing
-- ============================================================================

CREATE TABLE product_families (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Unique identifier for programmatic access
    -- Format: UPPERCASE_UNDERSCORE (e.g., BASICS_TOPS)
    code VARCHAR(50) UNIQUE NOT NULL,

    -- Display name for UI
    -- Format: Title Case with spaces (e.g., "Standard Basics - Tops")
    name VARCHAR(100) NOT NULL,

    -- Extended description explaining what products belong in this family
    description TEXT,

    -- Default manufacturer for this family (primary)
    -- When resolving manufacturer for a product, this is used if no override exists
    default_manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,

    -- Backup manufacturer if primary is unavailable or at capacity
    backup_manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,

    -- Target cost range for products in this family (for pricing guidance)
    target_cost_min NUMERIC(10, 2),
    target_cost_max NUMERIC(10, 2),

    -- Expected lead time for this family (days from order to ship)
    lead_time_days INTEGER DEFAULT 21,

    -- Display ordering in admin UI (lower = first)
    sort_order INTEGER DEFAULT 0,

    -- Whether this family is currently active
    -- Inactive families cannot have new products assigned
    is_active BOOLEAN DEFAULT true,

    -- Optional image/icon for the family
    image_url TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_product_families_code ON product_families(code);
CREATE INDEX idx_product_families_active ON product_families(is_active);
CREATE INDEX idx_product_families_default_mfr ON product_families(default_manufacturer_id);
CREATE INDEX idx_product_families_sort ON product_families(sort_order);

-- Comments for documentation
COMMENT ON TABLE product_families IS 'Product groupings for manufacturer routing. Products inherit manufacturer from their family unless overridden.';
COMMENT ON COLUMN product_families.code IS 'Unique uppercase identifier (e.g., BASICS_TOPS). Used in code and APIs.';
COMMENT ON COLUMN product_families.default_manufacturer_id IS 'Primary manufacturer for this family. Used in resolution cascade.';
COMMENT ON COLUMN product_families.backup_manufacturer_id IS 'Fallback manufacturer if primary unavailable.';
COMMENT ON COLUMN product_families.target_cost_min IS 'Minimum expected cost per unit for pricing guidance.';
COMMENT ON COLUMN product_families.target_cost_max IS 'Maximum expected cost per unit for pricing guidance.';
```

### 4.2.2 New Table: product_family_manufacturers

```sql
-- ============================================================================
-- TABLE: product_family_manufacturers
-- PURPOSE: Junction table allowing multiple manufacturers per family with
--          detailed capability and pricing information per relationship
-- ============================================================================

CREATE TABLE product_family_manufacturers (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Foreign Keys
    product_family_id INTEGER NOT NULL REFERENCES product_families(id) ON DELETE CASCADE,
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,

    -- Priority for this manufacturer within the family
    -- 1 = primary, 2 = first backup, 3 = second backup, etc.
    priority INTEGER DEFAULT 1,

    -- Capability flags for this specific family
    -- These may differ from manufacturer's general capabilities
    can_sublimate BOOLEAN DEFAULT false,
    can_embroider BOOLEAN DEFAULT false,
    can_screen_print BOOLEAN DEFAULT false,
    can_dtg BOOLEAN DEFAULT false,
    can_cut_sew BOOLEAN DEFAULT false,
    can_heat_transfer BOOLEAN DEFAULT false,

    -- Minimum order quantity for THIS family from THIS manufacturer
    -- May differ from manufacturer's general MOQ
    moq INTEGER,

    -- Negotiated cost per unit for this family
    -- Allows different pricing per family per manufacturer
    cost_per_unit NUMERIC(10, 2),

    -- Manufacturer-specific lead time for this family (days)
    -- May differ from family's general lead time
    lead_time_days INTEGER,

    -- Payment terms specific to this relationship
    -- e.g., 'NET30', 'NET60', '50_50', 'COD', 'PREPAY'
    payment_terms VARCHAR(50),

    -- Internal notes about this relationship
    notes TEXT,

    -- Whether this assignment is currently active
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),

    -- Ensure each manufacturer appears only once per family
    UNIQUE(product_family_id, manufacturer_id)
);

-- Indexes
CREATE INDEX idx_pfm_family ON product_family_manufacturers(product_family_id);
CREATE INDEX idx_pfm_manufacturer ON product_family_manufacturers(manufacturer_id);
CREATE INDEX idx_pfm_priority ON product_family_manufacturers(priority);
CREATE INDEX idx_pfm_active ON product_family_manufacturers(is_active);

-- Comments
COMMENT ON TABLE product_family_manufacturers IS 'Junction table linking families to manufacturers with specific terms and capabilities.';
COMMENT ON COLUMN product_family_manufacturers.priority IS '1=primary, 2=first backup, etc. Lower number = higher priority.';
COMMENT ON COLUMN product_family_manufacturers.cost_per_unit IS 'Negotiated cost for this family from this manufacturer.';
COMMENT ON COLUMN product_family_manufacturers.payment_terms IS 'Payment terms: NET30, NET60, 50_50, COD, PREPAY';
```

### 4.2.3 Modify Table: categories

```sql
-- ============================================================================
-- MODIFY TABLE: categories
-- PURPOSE: Add product_family_id for family inheritance
-- ============================================================================

-- Add column
ALTER TABLE categories
ADD COLUMN product_family_id INTEGER REFERENCES product_families(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_categories_family ON categories(product_family_id);

-- Comment
COMMENT ON COLUMN categories.product_family_id IS 'Product family this category belongs to. Products in this category inherit the family unless overridden.';
```

### 4.2.4 Modify Table: products

```sql
-- ============================================================================
-- MODIFY TABLE: products
-- PURPOSE: Add optional product_family_id override
-- ============================================================================

-- Add column
ALTER TABLE products
ADD COLUMN product_family_id INTEGER REFERENCES product_families(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_products_family ON products(product_family_id);

-- Comment
COMMENT ON COLUMN products.product_family_id IS 'Optional override. If set, this product uses this family instead of inheriting from category.';
```

### 4.2.5 Modify Table: manufacturers

```sql
-- ============================================================================
-- MODIFY TABLE: manufacturers
-- PURPOSE: Add comprehensive manufacturer profile fields
-- ============================================================================

-- Geographic Information
ALTER TABLE manufacturers ADD COLUMN country VARCHAR(10);
ALTER TABLE manufacturers ADD COLUMN region VARCHAR(100);
ALTER TABLE manufacturers ADD COLUMN city VARCHAR(100);
ALTER TABLE manufacturers ADD COLUMN timezone VARCHAR(50);
ALTER TABLE manufacturers ADD COLUMN address TEXT;

-- Contact Information
ALTER TABLE manufacturers ADD COLUMN primary_contact_whatsapp VARCHAR(50);
ALTER TABLE manufacturers ADD COLUMN secondary_email VARCHAR(255);
ALTER TABLE manufacturers ADD COLUMN secondary_phone VARCHAR(50);
ALTER TABLE manufacturers ADD COLUMN website VARCHAR(255);

-- Capabilities (array of capability codes)
ALTER TABLE manufacturers ADD COLUMN capabilities TEXT[];

-- Certifications (array of certification codes)
ALTER TABLE manufacturers ADD COLUMN certifications TEXT[];

-- Financial Information
ALTER TABLE manufacturers ADD COLUMN payment_terms_default VARCHAR(50);
ALTER TABLE manufacturers ADD COLUMN account_balance NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE manufacturers ADD COLUMN credit_limit NUMERIC(12, 2);
ALTER TABLE manufacturers ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';

-- Operational Information
ALTER TABLE manufacturers ADD COLUMN has_us_warehouse BOOLEAN DEFAULT false;
ALTER TABLE manufacturers ADD COLUMN us_warehouse_address TEXT;
ALTER TABLE manufacturers ADD COLUMN avg_lead_time_days INTEGER;
ALTER TABLE manufacturers ADD COLUMN min_order_value NUMERIC(10, 2);
ALTER TABLE manufacturers ADD COLUMN max_monthly_capacity INTEGER;
ALTER TABLE manufacturers ADD COLUMN current_monthly_load INTEGER DEFAULT 0;

-- Onboarding Status
ALTER TABLE manufacturers ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE manufacturers ADD COLUMN onboarding_completed_at TIMESTAMP;
ALTER TABLE manufacturers ADD COLUMN approved_by VARCHAR REFERENCES users(id);
ALTER TABLE manufacturers ADD COLUMN approved_at TIMESTAMP;

-- Quality Metrics
ALTER TABLE manufacturers ADD COLUMN quality_score NUMERIC(3, 2);
ALTER TABLE manufacturers ADD COLUMN on_time_delivery_rate NUMERIC(5, 2);
ALTER TABLE manufacturers ADD COLUMN defect_rate NUMERIC(5, 2);
ALTER TABLE manufacturers ADD COLUMN total_orders_completed INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX idx_manufacturers_country ON manufacturers(country);
CREATE INDEX idx_manufacturers_onboarding ON manufacturers(onboarding_status);
CREATE INDEX idx_manufacturers_active ON manufacturers(lead_time_days) WHERE lead_time_days IS NOT NULL;

-- Comments
COMMENT ON COLUMN manufacturers.country IS 'ISO 2-letter country code (PK, BD, TR, CN, MX, US)';
COMMENT ON COLUMN manufacturers.capabilities IS 'Array of capability codes: sublimation, embroidery, screen_print, dtg, cut_sew, heat_transfer';
COMMENT ON COLUMN manufacturers.certifications IS 'Array of certification codes: GOTS, OEKO_TEX, WRAP, BSCI, ISO_9001';
COMMENT ON COLUMN manufacturers.payment_terms_default IS 'Default payment terms: NET30, NET60, 50_50, COD, PREPAY';
COMMENT ON COLUMN manufacturers.account_balance IS 'Current outstanding balance owed to this manufacturer';
COMMENT ON COLUMN manufacturers.credit_limit IS 'Maximum outstanding balance allowed before blocking new orders';
COMMENT ON COLUMN manufacturers.onboarding_status IS 'pending, documents_required, in_review, approved, active, suspended';
COMMENT ON COLUMN manufacturers.quality_score IS 'Aggregate quality score 0.00-5.00 based on QC results';
```

## 4.3 Seed Data

### 4.3.1 Initial Product Families

```sql
-- ============================================================================
-- SEED DATA: product_families
-- PURPOSE: Create the 6 initial product families
-- ============================================================================

INSERT INTO product_families (code, name, description, target_cost_min, target_cost_max, lead_time_days, sort_order) VALUES

-- Family 1: Wrestling & Combat Gear
(
    'WRESTLING',
    'Wrestling & Combat Gear',
    'Specialized athletic gear for wrestling and combat sports. Includes singlets, rash guards, fight shorts, backpacks, robes, and tech suits. Requires sublimation printing capability and experience with performance fabrics.',
    12.00,
    20.00,
    21,
    1
),

-- Family 2: Standard Basics - Tops
(
    'BASICS_TOPS',
    'Standard Basics - Tops',
    'High-volume basic apparel tops. Includes t-shirts, long sleeve shirts, crewneck sweatshirts, and hoodies. Price-sensitive category requiring competitive manufacturing costs.',
    5.00,
    16.00,
    21,
    2
),

-- Family 3: Standard Basics - Bottoms
(
    'BASICS_BOTTOMS',
    'Standard Basics - Bottoms',
    'High-volume basic apparel bottoms. Includes gym shorts, casual shorts, and sweatpants. Requires cut-and-sew capability with athletic fabric expertise.',
    8.00,
    14.00,
    21,
    3
),

-- Family 4: Women''s Loungewear
(
    'WOMENS_LOUNGE',
    'Women''s Loungewear',
    'Elevated women''s loungewear with "rich girl" aesthetic. Includes sweat sets, crop tops, oversized hoodies, and wide-leg pants. Requires attention to fit, fabric quality, and finishing details.',
    10.00,
    18.00,
    28,
    4
),

-- Family 5: American Sports Jerseys
(
    'SPORTS_JERSEYS',
    'American Sports Jerseys',
    'Professional-quality team jerseys for American sports. Includes football, baseball, volleyball, soccer, and basketball jerseys. Requires full sublimation capability and team uniform experience.',
    15.00,
    25.00,
    28,
    5
),

-- Family 6: Elevated Essentials
(
    'ELEVATED',
    'Elevated Essentials',
    'Higher-margin elevated apparel items. Includes quarter-zips, polos, lightweight jackets, and vests. Requires quality construction and premium finishing.',
    14.00,
    25.00,
    21,
    6
);
```

### 4.3.2 Capability and Certification Constants

```typescript
// ============================================================================
// FILE: /shared/constants/manufacturer.constants.ts
// PURPOSE: Define manufacturer capability and certification codes
// ============================================================================

/**
 * Manufacturing capability codes
 * Used in manufacturers.capabilities array and product_family_manufacturers capability flags
 */
export const MANUFACTURER_CAPABILITIES = {
  SUBLIMATION: 'sublimation',
  EMBROIDERY: 'embroidery',
  SCREEN_PRINT: 'screen_print',
  DTG: 'dtg', // Direct to Garment
  CUT_SEW: 'cut_sew',
  HEAT_TRANSFER: 'heat_transfer',
  PUFF_PRINT: 'puff_print',
  TIE_DYE: 'tie_dye',
  WOVEN_LABELS: 'woven_labels',
  HANG_TAGS: 'hang_tags',
  CUSTOM_PACKAGING: 'custom_packaging',
} as const;

export type ManufacturerCapability = typeof MANUFACTURER_CAPABILITIES[keyof typeof MANUFACTURER_CAPABILITIES];

/**
 * Certification codes
 * Used in manufacturers.certifications array
 */
export const MANUFACTURER_CERTIFICATIONS = {
  GOTS: 'GOTS', // Global Organic Textile Standard
  OEKO_TEX: 'OEKO_TEX', // OEKO-TEX Standard 100
  WRAP: 'WRAP', // Worldwide Responsible Accredited Production
  BSCI: 'BSCI', // Business Social Compliance Initiative
  SEDEX: 'SEDEX', // Supplier Ethical Data Exchange
  ISO_9001: 'ISO_9001', // Quality Management
  ISO_14001: 'ISO_14001', // Environmental Management
  SA8000: 'SA8000', // Social Accountability
  FAIR_TRADE: 'FAIR_TRADE',
  ORGANIC: 'ORGANIC',
} as const;

export type ManufacturerCertification = typeof MANUFACTURER_CERTIFICATIONS[keyof typeof MANUFACTURER_CERTIFICATIONS];

/**
 * Payment terms codes
 */
export const PAYMENT_TERMS = {
  PREPAY: 'PREPAY', // Full payment before production
  NET15: 'NET15', // Payment due in 15 days
  NET30: 'NET30', // Payment due in 30 days
  NET45: 'NET45', // Payment due in 45 days
  NET60: 'NET60', // Payment due in 60 days
  SPLIT_50_50: '50_50', // 50% deposit, 50% on delivery
  SPLIT_30_70: '30_70', // 30% deposit, 70% on delivery
  COD: 'COD', // Cash on delivery
} as const;

export type PaymentTerms = typeof PAYMENT_TERMS[keyof typeof PAYMENT_TERMS];

/**
 * Onboarding status codes
 */
export const ONBOARDING_STATUS = {
  PENDING: 'pending', // Initial creation
  DOCUMENTS_REQUIRED: 'documents_required', // Awaiting document upload
  IN_REVIEW: 'in_review', // Documents submitted, under review
  APPROVED: 'approved', // Approved, can receive jobs
  ACTIVE: 'active', // Fully active, has completed jobs
  SUSPENDED: 'suspended', // Temporarily suspended
  TERMINATED: 'terminated', // Relationship ended
} as const;

export type OnboardingStatus = typeof ONBOARDING_STATUS[keyof typeof ONBOARDING_STATUS];

/**
 * Country codes for common manufacturing regions
 */
export const MANUFACTURING_COUNTRIES = {
  PK: { code: 'PK', name: 'Pakistan', timezone: 'Asia/Karachi' },
  BD: { code: 'BD', name: 'Bangladesh', timezone: 'Asia/Dhaka' },
  CN: { code: 'CN', name: 'China', timezone: 'Asia/Shanghai' },
  TR: { code: 'TR', name: 'Turkey', timezone: 'Europe/Istanbul' },
  MX: { code: 'MX', name: 'Mexico', timezone: 'America/Mexico_City' },
  HN: { code: 'HN', name: 'Honduras', timezone: 'America/Tegucigalpa' },
  GT: { code: 'GT', name: 'Guatemala', timezone: 'America/Guatemala' },
  US: { code: 'US', name: 'United States', timezone: 'America/Los_Angeles' },
} as const;

/**
 * Display configurations for capabilities
 */
export const CAPABILITY_DISPLAY = {
  sublimation: { label: 'Sublimation Printing', icon: 'Paintbrush', color: '#8b5cf6' },
  embroidery: { label: 'Embroidery', icon: 'Scissors', color: '#f59e0b' },
  screen_print: { label: 'Screen Printing', icon: 'Layers', color: '#3b82f6' },
  dtg: { label: 'Direct to Garment (DTG)', icon: 'Printer', color: '#10b981' },
  cut_sew: { label: 'Cut & Sew', icon: 'Scissors', color: '#ec4899' },
  heat_transfer: { label: 'Heat Transfer', icon: 'Flame', color: '#ef4444' },
  puff_print: { label: 'Puff Print', icon: 'Box', color: '#6366f1' },
  tie_dye: { label: 'Tie Dye', icon: 'Palette', color: '#14b8a6' },
  woven_labels: { label: 'Woven Labels', icon: 'Tag', color: '#64748b' },
  hang_tags: { label: 'Hang Tags', icon: 'Bookmark', color: '#78716c' },
  custom_packaging: { label: 'Custom Packaging', icon: 'Package', color: '#a855f7' },
} as const;

/**
 * Display configurations for certifications
 */
export const CERTIFICATION_DISPLAY = {
  GOTS: { label: 'GOTS Certified', description: 'Global Organic Textile Standard' },
  OEKO_TEX: { label: 'OEKO-TEX', description: 'OEKO-TEX Standard 100' },
  WRAP: { label: 'WRAP Certified', description: 'Worldwide Responsible Accredited Production' },
  BSCI: { label: 'BSCI', description: 'Business Social Compliance Initiative' },
  SEDEX: { label: 'SEDEX', description: 'Supplier Ethical Data Exchange' },
  ISO_9001: { label: 'ISO 9001', description: 'Quality Management System' },
  ISO_14001: { label: 'ISO 14001', description: 'Environmental Management' },
  SA8000: { label: 'SA8000', description: 'Social Accountability' },
  FAIR_TRADE: { label: 'Fair Trade', description: 'Fair Trade Certified' },
  ORGANIC: { label: 'Organic', description: 'Organic Materials' },
} as const;
```

## 4.4 Drizzle Schema Definition

```typescript
// ============================================================================
// FILE: /shared/schema.ts (ADDITIONS)
// PURPOSE: Add Drizzle ORM schema definitions for new tables
// ============================================================================

import { pgTable, serial, varchar, text, integer, boolean, numeric, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { manufacturers } from './schema'; // existing

// ============================================================================
// TABLE: productFamilies
// ============================================================================

export const productFamilies = pgTable('product_families', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  defaultManufacturerId: integer('default_manufacturer_id').references(() => manufacturers.id, { onDelete: 'set null' }),
  backupManufacturerId: integer('backup_manufacturer_id').references(() => manufacturers.id, { onDelete: 'set null' }),
  targetCostMin: numeric('target_cost_min', { precision: 10, scale: 2 }),
  targetCostMax: numeric('target_cost_max', { precision: 10, scale: 2 }),
  leadTimeDays: integer('lead_time_days').default(21),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: index('idx_product_families_code').on(table.code),
  activeIdx: index('idx_product_families_active').on(table.isActive),
  defaultMfrIdx: index('idx_product_families_default_mfr').on(table.defaultManufacturerId),
  sortIdx: index('idx_product_families_sort').on(table.sortOrder),
}));

// ============================================================================
// TABLE: productFamilyManufacturers
// ============================================================================

export const productFamilyManufacturers = pgTable('product_family_manufacturers', {
  id: serial('id').primaryKey(),
  productFamilyId: integer('product_family_id').notNull().references(() => productFamilies.id, { onDelete: 'cascade' }),
  manufacturerId: integer('manufacturer_id').notNull().references(() => manufacturers.id, { onDelete: 'cascade' }),
  priority: integer('priority').default(1),
  canSublimate: boolean('can_sublimate').default(false),
  canEmbroider: boolean('can_embroider').default(false),
  canScreenPrint: boolean('can_screen_print').default(false),
  canDtg: boolean('can_dtg').default(false),
  canCutSew: boolean('can_cut_sew').default(false),
  canHeatTransfer: boolean('can_heat_transfer').default(false),
  moq: integer('moq'),
  costPerUnit: numeric('cost_per_unit', { precision: 10, scale: 2 }),
  leadTimeDays: integer('lead_time_days'),
  paymentTerms: varchar('payment_terms', { length: 50 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  familyIdx: index('idx_pfm_family').on(table.productFamilyId),
  manufacturerIdx: index('idx_pfm_manufacturer').on(table.manufacturerId),
  priorityIdx: index('idx_pfm_priority').on(table.priority),
  activeIdx: index('idx_pfm_active').on(table.isActive),
  uniqueFamilyMfr: unique('unique_family_manufacturer').on(table.productFamilyId, table.manufacturerId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const productFamiliesRelations = relations(productFamilies, ({ one, many }) => ({
  defaultManufacturer: one(manufacturers, {
    fields: [productFamilies.defaultManufacturerId],
    references: [manufacturers.id],
    relationName: 'defaultManufacturer',
  }),
  backupManufacturer: one(manufacturers, {
    fields: [productFamilies.backupManufacturerId],
    references: [manufacturers.id],
    relationName: 'backupManufacturer',
  }),
  familyManufacturers: many(productFamilyManufacturers),
  categories: many(categories),
  products: many(products),
}));

export const productFamilyManufacturersRelations = relations(productFamilyManufacturers, ({ one }) => ({
  productFamily: one(productFamilies, {
    fields: [productFamilyManufacturers.productFamilyId],
    references: [productFamilies.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [productFamilyManufacturers.manufacturerId],
    references: [manufacturers.id],
  }),
}));

// ============================================================================
// MODIFY EXISTING: categories
// ============================================================================

// Add to existing categories table definition:
// productFamilyId: integer('product_family_id').references(() => productFamilies.id, { onDelete: 'set null' }),

// Add to categoriesRelations:
// productFamily: one(productFamilies, {
//   fields: [categories.productFamilyId],
//   references: [productFamilies.id],
// }),

// ============================================================================
// MODIFY EXISTING: products
// ============================================================================

// Add to existing products table definition:
// productFamilyId: integer('product_family_id').references(() => productFamilies.id, { onDelete: 'set null' }),

// Add to productsRelations:
// productFamily: one(productFamilies, {
//   fields: [products.productFamilyId],
//   references: [productFamilies.id],
// }),

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProductFamily = typeof productFamilies.$inferSelect;
export type NewProductFamily = typeof productFamilies.$inferInsert;
export type ProductFamilyManufacturer = typeof productFamilyManufacturers.$inferSelect;
export type NewProductFamilyManufacturer = typeof productFamilyManufacturers.$inferInsert;
```

## 4.5 API Endpoints

### 4.5.1 Product Families Routes

```typescript
// ============================================================================
// FILE: /server/routes/product-families.routes.ts
// PURPOSE: CRUD endpoints for product families
// ============================================================================

import { Router } from 'express';
import { eq, asc, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { productFamilies, productFamilyManufacturers, manufacturers, categories, products } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { createAuditLog } from '../services/audit.service';

const router = Router();

// ============================================================================
// GET /api/product-families
// List all product families with optional filtering
// ============================================================================

router.get('/',
  requireAuth,
  requirePermission('catalog:read'),
  async (req, res) => {
    try {
      const {
        active, // 'true' | 'false' | undefined (all)
        withManufacturers, // 'true' to include manufacturer details
        withCounts, // 'true' to include category/product counts
      } = req.query;

      // Build base query
      let query = db
        .select({
          id: productFamilies.id,
          code: productFamilies.code,
          name: productFamilies.name,
          description: productFamilies.description,
          defaultManufacturerId: productFamilies.defaultManufacturerId,
          backupManufacturerId: productFamilies.backupManufacturerId,
          targetCostMin: productFamilies.targetCostMin,
          targetCostMax: productFamilies.targetCostMax,
          leadTimeDays: productFamilies.leadTimeDays,
          sortOrder: productFamilies.sortOrder,
          isActive: productFamilies.isActive,
          imageUrl: productFamilies.imageUrl,
          createdAt: productFamilies.createdAt,
          updatedAt: productFamilies.updatedAt,
        })
        .from(productFamilies);

      // Filter by active status
      if (active === 'true') {
        query = query.where(eq(productFamilies.isActive, true));
      } else if (active === 'false') {
        query = query.where(eq(productFamilies.isActive, false));
      }

      // Order by sort_order
      query = query.orderBy(asc(productFamilies.sortOrder));

      const familiesData = await query;

      // Enrich with manufacturer details if requested
      let result = familiesData;

      if (withManufacturers === 'true') {
        // Get all manufacturers for these families
        const familyIds = familiesData.map(f => f.id);

        const [defaultMfrs, backupMfrs, familyMfrs] = await Promise.all([
          // Default manufacturers
          db
            .select()
            .from(manufacturers)
            .where(sql`${manufacturers.id} IN (SELECT default_manufacturer_id FROM product_families WHERE default_manufacturer_id IS NOT NULL)`),

          // Backup manufacturers
          db
            .select()
            .from(manufacturers)
            .where(sql`${manufacturers.id} IN (SELECT backup_manufacturer_id FROM product_families WHERE backup_manufacturer_id IS NOT NULL)`),

          // All family-manufacturer relationships
          db
            .select()
            .from(productFamilyManufacturers)
            .leftJoin(manufacturers, eq(productFamilyManufacturers.manufacturerId, manufacturers.id))
            .where(sql`${productFamilyManufacturers.productFamilyId} IN (${familyIds.join(',')})`),
        ]);

        // Create lookup maps
        const defaultMfrMap = new Map(defaultMfrs.map(m => [m.id, m]));
        const backupMfrMap = new Map(backupMfrs.map(m => [m.id, m]));

        // Group family manufacturers
        const familyMfrMap = new Map<number, any[]>();
        for (const fm of familyMfrs) {
          const existing = familyMfrMap.get(fm.product_family_manufacturers.productFamilyId) || [];
          existing.push({
            ...fm.product_family_manufacturers,
            manufacturer: fm.manufacturers,
          });
          familyMfrMap.set(fm.product_family_manufacturers.productFamilyId, existing);
        }

        // Enrich results
        result = familiesData.map(family => ({
          ...family,
          defaultManufacturer: family.defaultManufacturerId ? defaultMfrMap.get(family.defaultManufacturerId) : null,
          backupManufacturer: family.backupManufacturerId ? backupMfrMap.get(family.backupManufacturerId) : null,
          manufacturers: familyMfrMap.get(family.id) || [],
        }));
      }

      if (withCounts === 'true') {
        // Get category and product counts per family
        const [categoryCounts, productCounts] = await Promise.all([
          db
            .select({
              productFamilyId: categories.productFamilyId,
              count: sql<number>`count(*)::int`,
            })
            .from(categories)
            .where(sql`${categories.productFamilyId} IS NOT NULL`)
            .groupBy(categories.productFamilyId),

          db
            .select({
              productFamilyId: products.productFamilyId,
              count: sql<number>`count(*)::int`,
            })
            .from(products)
            .where(sql`${products.productFamilyId} IS NOT NULL`)
            .groupBy(products.productFamilyId),
        ]);

        const categoryCountMap = new Map(categoryCounts.map(c => [c.productFamilyId, c.count]));
        const productCountMap = new Map(productCounts.map(p => [p.productFamilyId, p.count]));

        result = result.map(family => ({
          ...family,
          categoryCount: categoryCountMap.get(family.id) || 0,
          productCount: productCountMap.get(family.id) || 0,
        }));
      }

      res.json(result);

    } catch (error) {
      console.error('Error fetching product families:', error);
      res.status(500).json({ error: 'Failed to fetch product families' });
    }
  }
);

// ============================================================================
// GET /api/product-families/:id
// Get single product family with full details
// ============================================================================

router.get('/:id',
  requireAuth,
  requirePermission('catalog:read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get family
      const [family] = await db
        .select()
        .from(productFamilies)
        .where(eq(productFamilies.id, parseInt(id)));

      if (!family) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      // Get associated manufacturers
      const familyManufacturers = await db
        .select({
          assignment: productFamilyManufacturers,
          manufacturer: manufacturers,
        })
        .from(productFamilyManufacturers)
        .leftJoin(manufacturers, eq(productFamilyManufacturers.manufacturerId, manufacturers.id))
        .where(eq(productFamilyManufacturers.productFamilyId, family.id))
        .orderBy(asc(productFamilyManufacturers.priority));

      // Get default and backup manufacturer details
      let defaultManufacturer = null;
      let backupManufacturer = null;

      if (family.defaultManufacturerId) {
        [defaultManufacturer] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, family.defaultManufacturerId));
      }

      if (family.backupManufacturerId) {
        [backupManufacturer] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, family.backupManufacturerId));
      }

      // Get categories in this family
      const familyCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(eq(categories.productFamilyId, family.id));

      // Get products directly in this family (overrides)
      const directProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
        })
        .from(products)
        .where(eq(products.productFamilyId, family.id))
        .limit(100);

      res.json({
        ...family,
        defaultManufacturer,
        backupManufacturer,
        manufacturers: familyManufacturers.map(fm => ({
          ...fm.assignment,
          manufacturer: fm.manufacturer,
        })),
        categories: familyCategories,
        directProducts,
      });

    } catch (error) {
      console.error('Error fetching product family:', error);
      res.status(500).json({ error: 'Failed to fetch product family' });
    }
  }
);

// ============================================================================
// POST /api/product-families
// Create new product family
// ============================================================================

router.post('/',
  requireAuth,
  requirePermission('catalog:write'),
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        defaultManufacturerId,
        backupManufacturerId,
        targetCostMin,
        targetCostMax,
        leadTimeDays,
        sortOrder,
        isActive,
        imageUrl,
      } = req.body;

      // Validate required fields
      if (!code || !name) {
        return res.status(400).json({ error: 'Code and name are required' });
      }

      // Validate code format (uppercase, underscores, no spaces)
      if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
        return res.status(400).json({
          error: 'Code must be uppercase letters, numbers, and underscores, starting with a letter'
        });
      }

      // Check for duplicate code
      const [existing] = await db
        .select({ id: productFamilies.id })
        .from(productFamilies)
        .where(eq(productFamilies.code, code));

      if (existing) {
        return res.status(400).json({ error: 'A product family with this code already exists' });
      }

      // Validate manufacturers exist
      if (defaultManufacturerId) {
        const [mfr] = await db
          .select({ id: manufacturers.id })
          .from(manufacturers)
          .where(eq(manufacturers.id, defaultManufacturerId));

        if (!mfr) {
          return res.status(400).json({ error: 'Default manufacturer not found' });
        }
      }

      if (backupManufacturerId) {
        const [mfr] = await db
          .select({ id: manufacturers.id })
          .from(manufacturers)
          .where(eq(manufacturers.id, backupManufacturerId));

        if (!mfr) {
          return res.status(400).json({ error: 'Backup manufacturer not found' });
        }
      }

      // Insert
      const [newFamily] = await db
        .insert(productFamilies)
        .values({
          code,
          name,
          description,
          defaultManufacturerId,
          backupManufacturerId,
          targetCostMin,
          targetCostMax,
          leadTimeDays: leadTimeDays || 21,
          sortOrder: sortOrder || 0,
          isActive: isActive !== false,
          imageUrl,
        })
        .returning();

      // Audit log
      await createAuditLog({
        actorUserId: req.user.id,
        entity: 'product_families',
        entityId: newFamily.id,
        action: 'create',
        afterJson: JSON.stringify(newFamily),
      });

      res.status(201).json(newFamily);

    } catch (error) {
      console.error('Error creating product family:', error);
      res.status(500).json({ error: 'Failed to create product family' });
    }
  }
);

// ============================================================================
// PUT /api/product-families/:id
// Update product family
// ============================================================================

router.put('/:id',
  requireAuth,
  requirePermission('catalog:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        description,
        defaultManufacturerId,
        backupManufacturerId,
        targetCostMin,
        targetCostMax,
        leadTimeDays,
        sortOrder,
        isActive,
        imageUrl,
      } = req.body;

      // Get existing
      const [existing] = await db
        .select()
        .from(productFamilies)
        .where(eq(productFamilies.id, parseInt(id)));

      if (!existing) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      // If code is changing, validate new code
      if (code && code !== existing.code) {
        if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
          return res.status(400).json({
            error: 'Code must be uppercase letters, numbers, and underscores, starting with a letter'
          });
        }

        const [duplicate] = await db
          .select({ id: productFamilies.id })
          .from(productFamilies)
          .where(and(
            eq(productFamilies.code, code),
            sql`${productFamilies.id} != ${parseInt(id)}`
          ));

        if (duplicate) {
          return res.status(400).json({ error: 'A product family with this code already exists' });
        }
      }

      // Update
      const [updated] = await db
        .update(productFamilies)
        .set({
          code: code || existing.code,
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          defaultManufacturerId: defaultManufacturerId !== undefined ? defaultManufacturerId : existing.defaultManufacturerId,
          backupManufacturerId: backupManufacturerId !== undefined ? backupManufacturerId : existing.backupManufacturerId,
          targetCostMin: targetCostMin !== undefined ? targetCostMin : existing.targetCostMin,
          targetCostMax: targetCostMax !== undefined ? targetCostMax : existing.targetCostMax,
          leadTimeDays: leadTimeDays !== undefined ? leadTimeDays : existing.leadTimeDays,
          sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(productFamilies.id, parseInt(id)))
        .returning();

      // Audit log
      await createAuditLog({
        actorUserId: req.user.id,
        entity: 'product_families',
        entityId: updated.id,
        action: 'update',
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updated),
      });

      res.json(updated);

    } catch (error) {
      console.error('Error updating product family:', error);
      res.status(500).json({ error: 'Failed to update product family' });
    }
  }
);

// ============================================================================
// DELETE /api/product-families/:id
// Delete product family (soft delete by setting isActive=false, or hard delete if no references)
// ============================================================================

router.delete('/:id',
  requireAuth,
  requirePermission('catalog:delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { hard } = req.query; // ?hard=true for permanent delete

      // Get existing
      const [existing] = await db
        .select()
        .from(productFamilies)
        .where(eq(productFamilies.id, parseInt(id)));

      if (!existing) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      // Check for references
      const [categoryRef] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(categories)
        .where(eq(categories.productFamilyId, parseInt(id)));

      const [productRef] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.productFamilyId, parseInt(id)));

      const hasReferences = (categoryRef?.count || 0) > 0 || (productRef?.count || 0) > 0;

      if (hard === 'true') {
        if (hasReferences) {
          return res.status(400).json({
            error: 'Cannot delete: This family is referenced by categories or products. Remove references first or use soft delete.'
          });
        }

        // Hard delete
        await db
          .delete(productFamilyManufacturers)
          .where(eq(productFamilyManufacturers.productFamilyId, parseInt(id)));

        await db
          .delete(productFamilies)
          .where(eq(productFamilies.id, parseInt(id)));

        await createAuditLog({
          actorUserId: req.user.id,
          entity: 'product_families',
          entityId: parseInt(id),
          action: 'delete',
          beforeJson: JSON.stringify(existing),
        });

        res.json({ message: 'Product family permanently deleted' });

      } else {
        // Soft delete (deactivate)
        const [updated] = await db
          .update(productFamilies)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(productFamilies.id, parseInt(id)))
          .returning();

        await createAuditLog({
          actorUserId: req.user.id,
          entity: 'product_families',
          entityId: updated.id,
          action: 'deactivate',
          beforeJson: JSON.stringify(existing),
          afterJson: JSON.stringify(updated),
        });

        res.json({ message: 'Product family deactivated', family: updated });
      }

    } catch (error) {
      console.error('Error deleting product family:', error);
      res.status(500).json({ error: 'Failed to delete product family' });
    }
  }
);

// ============================================================================
// POST /api/product-families/:id/manufacturers
// Add manufacturer to product family
// ============================================================================

router.post('/:id/manufacturers',
  requireAuth,
  requirePermission('catalog:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        manufacturerId,
        priority,
        canSublimate,
        canEmbroider,
        canScreenPrint,
        canDtg,
        canCutSew,
        canHeatTransfer,
        moq,
        costPerUnit,
        leadTimeDays,
        paymentTerms,
        notes,
      } = req.body;

      // Validate family exists
      const [family] = await db
        .select({ id: productFamilies.id })
        .from(productFamilies)
        .where(eq(productFamilies.id, parseInt(id)));

      if (!family) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      // Validate manufacturer exists
      const [manufacturer] = await db
        .select({ id: manufacturers.id })
        .from(manufacturers)
        .where(eq(manufacturers.id, manufacturerId));

      if (!manufacturer) {
        return res.status(400).json({ error: 'Manufacturer not found' });
      }

      // Check if relationship already exists
      const [existingRel] = await db
        .select()
        .from(productFamilyManufacturers)
        .where(and(
          eq(productFamilyManufacturers.productFamilyId, parseInt(id)),
          eq(productFamilyManufacturers.manufacturerId, manufacturerId)
        ));

      if (existingRel) {
        return res.status(400).json({ error: 'This manufacturer is already assigned to this family' });
      }

      // Insert relationship
      const [newRel] = await db
        .insert(productFamilyManufacturers)
        .values({
          productFamilyId: parseInt(id),
          manufacturerId,
          priority: priority || 1,
          canSublimate: canSublimate || false,
          canEmbroider: canEmbroider || false,
          canScreenPrint: canScreenPrint || false,
          canDtg: canDtg || false,
          canCutSew: canCutSew || false,
          canHeatTransfer: canHeatTransfer || false,
          moq,
          costPerUnit,
          leadTimeDays,
          paymentTerms,
          notes,
          isActive: true,
        })
        .returning();

      // Audit log
      await createAuditLog({
        actorUserId: req.user.id,
        entity: 'product_family_manufacturers',
        entityId: newRel.id,
        action: 'create',
        afterJson: JSON.stringify(newRel),
      });

      res.status(201).json(newRel);

    } catch (error) {
      console.error('Error adding manufacturer to family:', error);
      res.status(500).json({ error: 'Failed to add manufacturer to family' });
    }
  }
);

// ============================================================================
// PUT /api/product-families/:id/manufacturers/:mfrId
// Update manufacturer assignment
// ============================================================================

router.put('/:id/manufacturers/:mfrId',
  requireAuth,
  requirePermission('catalog:write'),
  async (req, res) => {
    try {
      const { id, mfrId } = req.params;
      const updates = req.body;

      // Get existing relationship
      const [existing] = await db
        .select()
        .from(productFamilyManufacturers)
        .where(and(
          eq(productFamilyManufacturers.productFamilyId, parseInt(id)),
          eq(productFamilyManufacturers.manufacturerId, parseInt(mfrId))
        ));

      if (!existing) {
        return res.status(404).json({ error: 'Manufacturer assignment not found' });
      }

      // Update
      const [updated] = await db
        .update(productFamilyManufacturers)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(productFamilyManufacturers.id, existing.id))
        .returning();

      // Audit log
      await createAuditLog({
        actorUserId: req.user.id,
        entity: 'product_family_manufacturers',
        entityId: updated.id,
        action: 'update',
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updated),
      });

      res.json(updated);

    } catch (error) {
      console.error('Error updating manufacturer assignment:', error);
      res.status(500).json({ error: 'Failed to update manufacturer assignment' });
    }
  }
);

// ============================================================================
// DELETE /api/product-families/:id/manufacturers/:mfrId
// Remove manufacturer from product family
// ============================================================================

router.delete('/:id/manufacturers/:mfrId',
  requireAuth,
  requirePermission('catalog:write'),
  async (req, res) => {
    try {
      const { id, mfrId } = req.params;

      // Get existing relationship
      const [existing] = await db
        .select()
        .from(productFamilyManufacturers)
        .where(and(
          eq(productFamilyManufacturers.productFamilyId, parseInt(id)),
          eq(productFamilyManufacturers.manufacturerId, parseInt(mfrId))
        ));

      if (!existing) {
        return res.status(404).json({ error: 'Manufacturer assignment not found' });
      }

      // Delete
      await db
        .delete(productFamilyManufacturers)
        .where(eq(productFamilyManufacturers.id, existing.id));

      // Audit log
      await createAuditLog({
        actorUserId: req.user.id,
        entity: 'product_family_manufacturers',
        entityId: existing.id,
        action: 'delete',
        beforeJson: JSON.stringify(existing),
      });

      res.json({ message: 'Manufacturer removed from family' });

    } catch (error) {
      console.error('Error removing manufacturer from family:', error);
      res.status(500).json({ error: 'Failed to remove manufacturer from family' });
    }
  }
);

export default router;
```

This is the beginning of the master planning document. Due to the size requirement (100,000+ lines), I'll continue adding sections. Should I continue with the next major section (Phase 2: Manufacturer Portal Redesign)?


---

# 5. PHASE 2: MANUFACTURER PORTAL REDESIGN

## 5.1 Overview

The current manufacturer portal suffers from a complex 15-stage workflow that confuses manufacturers and causes status desync issues. This phase completely redesigns the manufacturer experience with a simplified 6-stage workflow, intuitive Kanban interface, and mobile-first design for factory floor use.

### Goals

1. **Simplify Workflow**: Replace 15 confusing stages with 6 intuitive stages
2. **Mobile-First**: Optimize for phone/tablet use on factory floor
3. **Real-Time Updates**: Live status updates without page refresh
4. **Batch Operations**: Allow manufacturers to update multiple jobs at once
5. **Photo Upload**: Easy progress photo uploads directly from device camera
6. **Clear Metrics**: Dashboard showing workload, deadlines, and payments

### The New 6-Stage Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MANUFACTURER WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐    ┌──────────┐    ┌───────────────┐    ┌──────┐             │
│   │   NEW   │───▶│ ACCEPTED │───▶│ IN_PRODUCTION │───▶│  QC  │             │
│   └─────────┘    └──────────┘    └───────────────┘    └──────┘             │
│        │              │                  │                │                 │
│        │              │                  │                │                 │
│        ▼              ▼                  ▼                ▼                 │
│   Order arrives  Manufacturer     Production has     Quality check         │
│   in queue       confirms they    started. Photos    before shipping.      │
│                  can fulfill      encouraged.        Photos required.      │
│                                                                             │
│                                                                             │
│   ┌───────────────┐    ┌─────────┐                                         │
│   │ READY_TO_SHIP │───▶│ SHIPPED │                                         │
│   └───────────────┘    └─────────┘                                         │
│          │                  │                                               │
│          ▼                  ▼                                               │
│   Passed QC, awaiting   Tracking number                                    │
│   shipping label or     entered. Job complete.                             │
│   pickup scheduling                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage Definitions

| Stage | Code | Description | Manufacturer Actions | Required Data |
|-------|------|-------------|---------------------|---------------|
| 1 | NEW | Order just arrived | Accept or Reject | None |
| 2 | ACCEPTED | Confirmed, not started | Start Production | Estimated completion date |
| 3 | IN_PRODUCTION | Being manufactured | Update progress, Upload photos | Progress % (optional) |
| 4 | QC | Quality check | Pass/Fail QC, Upload QC photos | QC photos required |
| 5 | READY_TO_SHIP | Passed QC, awaiting ship | Enter tracking, Mark shipped | Shipping method selected |
| 6 | SHIPPED | Complete | None - read only | Tracking number |

### Status Transition Rules

```typescript
// /shared/constants/manufacturer-status.ts

export const MANUFACTURER_STATUSES = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  QC: 'QC',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
} as const;

export type ManufacturerStatus = typeof MANUFACTURER_STATUSES[keyof typeof MANUFACTURER_STATUSES];

// Valid transitions - key is current status, value is array of allowed next statuses
export const VALID_TRANSITIONS: Record<ManufacturerStatus, ManufacturerStatus[]> = {
  NEW: ['ACCEPTED'],
  ACCEPTED: ['IN_PRODUCTION', 'NEW'], // Can go back to NEW if issue found
  IN_PRODUCTION: ['QC', 'ACCEPTED'], // Can go back if materials issue
  QC: ['READY_TO_SHIP', 'IN_PRODUCTION'], // Can go back if QC fails
  READY_TO_SHIP: ['SHIPPED', 'QC'], // Can go back if issue found
  SHIPPED: [], // Terminal state - no going back
};

// Check if transition is valid
export function isValidTransition(
  currentStatus: ManufacturerStatus,
  newStatus: ManufacturerStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// Get allowed next statuses
export function getAllowedTransitions(currentStatus: ManufacturerStatus): ManufacturerStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

// Status metadata for UI
export const STATUS_META: Record<ManufacturerStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  actionLabel: string;
}> = {
  NEW: {
    label: 'New Order',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'inbox',
    description: 'Awaiting your review and acceptance',
    actionLabel: 'Accept Order',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'check-circle',
    description: 'Order confirmed, ready to start production',
    actionLabel: 'Start Production',
  },
  IN_PRODUCTION: {
    label: 'In Production',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'settings',
    description: 'Currently being manufactured',
    actionLabel: 'Complete Production',
  },
  QC: {
    label: 'Quality Check',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'search',
    description: 'Performing quality inspection',
    actionLabel: 'Pass QC',
  },
  READY_TO_SHIP: {
    label: 'Ready to Ship',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'package',
    description: 'Passed QC, awaiting shipment',
    actionLabel: 'Mark Shipped',
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'truck',
    description: 'Order has been shipped',
    actionLabel: 'Complete',
  },
};
```


## 5.2 Manufacturer Dashboard

The manufacturer dashboard is the landing page after login. It provides an immediate overview of workload, upcoming deadlines, and financial status.

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MANUFACTURER DASHBOARD                                    [Hawk Mfg] ▼    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   ACTIVE JOBS   │  │  DUE THIS WEEK  │  │  PAYMENT DUE    │             │
│  │                 │  │                 │  │                 │             │
│  │      47         │  │      12         │  │   $24,350       │             │
│  │                 │  │                 │  │                 │             │
│  │ ↑ 8 from last   │  │ 3 overdue       │  │ NET30: $18,200  │             │
│  │   week          │  │                 │  │ NET60: $6,150   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  JOBS BY STATUS                                                         ││
│  │                                                                         ││
│  │  NEW        ████████████████████████  18                               ││
│  │  ACCEPTED   ████████████  10                                           ││
│  │  PRODUCTION ████████████████  14                                       ││
│  │  QC         ████  3                                                    ││
│  │  READY      ██  2                                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  URGENT ATTENTION NEEDED                                    View All ▶ ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                         ││
│  │  ⚠️  Order #4521 - Wrestling Singlets (24 units)                        ││
│  │      Due: Tomorrow | Status: IN_PRODUCTION                              ││
│  │      [View Details]                                                     ││
│  │                                                                         ││
│  │  ⚠️  Order #4518 - Rash Guards (36 units)                               ││
│  │      Due: 2 days | Status: NEW (not accepted yet!)                      ││
│  │      [Accept Now]                                                       ││
│  │                                                                         ││
│  │  ⚠️  Order #4499 - Fight Shorts (18 units)                              ││
│  │      Due: OVERDUE by 3 days | Status: QC                                ││
│  │      [Complete QC]                                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐│
│  │  QUICK ACTIONS                   │  │  RECENT ACTIVITY                 ││
│  │                                  │  │                                  ││
│  │  [📥 View New Orders (18)]       │  │  • Shipped Order #4495           ││
│  │  [🏭 Production Board]           │  │    2 hours ago                   ││
│  │  [📦 Ready to Ship (2)]          │  │                                  ││
│  │  [📄 Download Packing Slips]     │  │  • Started Order #4512           ││
│  │  [💰 View Payment History]       │  │    5 hours ago                   ││
│  │                                  │  │                                  ││
│  └──────────────────────────────────┘  │  • Accepted Order #4520          ││
│                                        │    Yesterday                     ││
│                                        │                                  ││
│                                        └──────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Component Implementation

```typescript
// /client/src/pages/manufacturer/ManufacturerDashboard.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Inbox, 
  CheckCircle, 
  Settings, 
  Search, 
  Package, 
  Truck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { STATUS_META, ManufacturerStatus } from '@shared/constants/manufacturer-status';

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  activeJobs: number;
  activeJobsChange: number;
  dueThisWeek: number;
  overdueCount: number;
  paymentDue: number;
  paymentNet30: number;
  paymentNet60: number;
  jobsByStatus: Record<ManufacturerStatus, number>;
}

interface UrgentJob {
  id: number;
  orderNumber: string;
  productName: string;
  quantity: number;
  dueDate: string;
  status: ManufacturerStatus;
  isOverdue: boolean;
  daysUntilDue: number;
}

interface RecentActivity {
  id: number;
  action: string;
  orderNumber: string;
  timestamp: string;
}

// ============================================================================
// API Hooks
// ============================================================================

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['manufacturer', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturer/dashboard/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

function useUrgentJobs() {
  return useQuery<UrgentJob[]>({
    queryKey: ['manufacturer', 'dashboard', 'urgent'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturer/dashboard/urgent', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch urgent jobs');
      return response.json();
    },
    refetchInterval: 30000,
  });
}

function useRecentActivity() {
  return useQuery<RecentActivity[]>({
    queryKey: ['manufacturer', 'dashboard', 'activity'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturer/dashboard/activity', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    refetchInterval: 60000,
  });
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  alert?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, alert }: StatCardProps) {
  return (
    <Card className={alert ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${
                trend.value > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
                {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${alert ? 'bg-red-100' : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Status Bar Component
// ============================================================================

interface StatusBarProps {
  jobsByStatus: Record<ManufacturerStatus, number>;
}

function StatusBar({ jobsByStatus }: StatusBarProps) {
  const total = Object.values(jobsByStatus).reduce((sum, count) => sum + count, 0);
  
  const statusOrder: ManufacturerStatus[] = [
    'NEW', 'ACCEPTED', 'IN_PRODUCTION', 'QC', 'READY_TO_SHIP'
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Jobs by Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusOrder.map(status => {
          const count = jobsByStatus[status] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const meta = STATUS_META[status];
          
          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-gray-500">{count}</span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Urgent Jobs Component
// ============================================================================

interface UrgentJobsListProps {
  jobs: UrgentJob[];
  isLoading: boolean;
}

function UrgentJobsList({ jobs, isLoading }: UrgentJobsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Urgent Attention Needed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            All Caught Up!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            No urgent jobs requiring attention. Great work!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Urgent Attention Needed
        </CardTitle>
        <Link href="/manufacturer/jobs?filter=urgent">
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.slice(0, 5).map(job => (
          <UrgentJobCard key={job.id} job={job} />
        ))}
      </CardContent>
    </Card>
  );
}

function UrgentJobCard({ job }: { job: UrgentJob }) {
  const meta = STATUS_META[job.status];
  
  const getDueLabel = () => {
    if (job.isOverdue) {
      return (
        <span className="text-red-600 font-medium">
          OVERDUE by {Math.abs(job.daysUntilDue)} days
        </span>
      );
    }
    if (job.daysUntilDue === 0) {
      return <span className="text-orange-600 font-medium">Due Today</span>;
    }
    if (job.daysUntilDue === 1) {
      return <span className="text-orange-600 font-medium">Due Tomorrow</span>;
    }
    return <span className="text-yellow-600">Due in {job.daysUntilDue} days</span>;
  };
  
  const getActionButton = () => {
    switch (job.status) {
      case 'NEW':
        return (
          <Link href={`/manufacturer/jobs/${job.id}`}>
            <Button size="sm" variant="default">Accept Now</Button>
          </Link>
        );
      case 'QC':
        return (
          <Link href={`/manufacturer/jobs/${job.id}`}>
            <Button size="sm" variant="default">Complete QC</Button>
          </Link>
        );
      default:
        return (
          <Link href={`/manufacturer/jobs/${job.id}`}>
            <Button size="sm" variant="outline">View Details</Button>
          </Link>
        );
    }
  };
  
  return (
    <div className={`p-4 rounded-lg border ${job.isOverdue ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${job.isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
            <span className="font-medium">Order #{job.orderNumber}</span>
            <span className="text-gray-500">-</span>
            <span>{job.productName} ({job.quantity} units)</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {getDueLabel()}
            <Badge className={`${meta.bgColor} ${meta.color}`}>
              {meta.label}
            </Badge>
          </div>
        </div>
        {getActionButton()}
      </div>
    </div>
  );
}

// ============================================================================
// Quick Actions Component
// ============================================================================

function QuickActions({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/manufacturer/jobs?status=NEW">
          <Button variant="outline" className="w-full justify-start">
            <Inbox className="w-4 h-4 mr-2" />
            View New Orders
            {stats.jobsByStatus.NEW > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {stats.jobsByStatus.NEW}
              </Badge>
            )}
          </Button>
        </Link>
        
        <Link href="/manufacturer/board">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Production Board
          </Button>
        </Link>
        
        <Link href="/manufacturer/jobs?status=READY_TO_SHIP">
          <Button variant="outline" className="w-full justify-start">
            <Package className="w-4 h-4 mr-2" />
            Ready to Ship
            {stats.jobsByStatus.READY_TO_SHIP > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {stats.jobsByStatus.READY_TO_SHIP}
              </Badge>
            )}
          </Button>
        </Link>
        
        <Link href="/manufacturer/packing-slips">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Download Packing Slips
          </Button>
        </Link>
        
        <Link href="/manufacturer/payments">
          <Button variant="outline" className="w-full justify-start">
            <DollarSign className="w-4 h-4 mr-2" />
            View Payment History
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Recent Activity Component
// ============================================================================

function RecentActivityList({ 
  activities, 
  isLoading 
}: { 
  activities: RecentActivity[]; 
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.slice(0, 5).map(activity => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div>
              <p>
                <span className="font-medium">{activity.action}</span>
                {' '}Order #{activity.orderNumber}
              </p>
              <p className="text-gray-500 text-xs">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function ManufacturerDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: urgentJobs, isLoading: urgentLoading } = useUrgentJobs();
  const { data: activities, isLoading: activityLoading } = useRecentActivity();
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back. Here's your production overview.</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Active Jobs"
              value={stats.activeJobs}
              icon={<Settings className="w-6 h-6 text-gray-600" />}
              trend={{
                value: stats.activeJobsChange,
                label: 'from last week'
              }}
            />
            <StatCard
              title="Due This Week"
              value={stats.dueThisWeek}
              subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
              icon={<Calendar className="w-6 h-6 text-gray-600" />}
              alert={stats.overdueCount > 0}
            />
            <StatCard
              title="Payment Due"
              value={formatCurrency(stats.paymentDue)}
              subtitle={`NET30: ${formatCurrency(stats.paymentNet30)} | NET60: ${formatCurrency(stats.paymentNet60)}`}
              icon={<DollarSign className="w-6 h-6 text-gray-600" />}
            />
          </>
        ) : null}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Status & Urgent */}
        <div className="lg:col-span-2 space-y-6">
          {stats && <StatusBar jobsByStatus={stats.jobsByStatus} />}
          <UrgentJobsList jobs={urgentJobs || []} isLoading={urgentLoading} />
        </div>
        
        {/* Right Column - Quick Actions & Activity */}
        <div className="space-y-6">
          {stats && <QuickActions stats={stats} />}
          <RecentActivityList 
            activities={activities || []} 
            isLoading={activityLoading} 
          />
        </div>
      </div>
    </div>
  );
}
```


## 5.3 Manufacturer Kanban Board

The Kanban board provides a visual, drag-and-drop interface for managing production workflow. This is the primary interface manufacturers use to track and update job status.

### Kanban Board Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION BOARD                                              [Filter ▼] [Search...] [⋮]          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐│
│  │    📥 NEW       │ │   ✓ ACCEPTED    │ │  🏭 PRODUCTION  │ │    🔍 QC        │ │  📦 READY      ││
│  │    (18)         │ │    (10)         │ │     (14)        │ │    (3)          │ │    (2)         ││
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├────────────────┤│
│  │                 │ │                 │ │                 │ │                 │ │                ││
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌────────────┐ ││
│  │ │ #4521       │ │ │ │ #4515       │ │ │ │ #4510       │ │ │ │ #4502       │ │ │ │ #4498      │ ││
│  │ │ Singlets    │ │ │ │ Rash Guards │ │ │ │ Fight Short │ │ │ │ Hoodies    │ │ │ │ Singlets   │ ││
│  │ │ 24 units    │ │ │ │ 18 units    │ │ │ │ 36 units    │ │ │ │ 12 units   │ │ │ │ 48 units   │ ││
│  │ │             │ │ │ │             │ │ │ │ ████░░ 60%  │ │ │ │             │ │ │ │            │ ││
│  │ │ Due: Jan 28 │ │ │ │ Due: Jan 30 │ │ │ │ Due: Feb 1  │ │ │ │ Due: Jan 27 │ │ │ │Due: Jan 26 │ ││
│  │ │ [Accept]    │ │ │ │ [Start]     │ │ │ │ [Update]    │ │ │ │ [Pass QC]   │ │ │ │[Ship]      │ ││
│  │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │ │ └────────────┘ ││
│  │                 │ │                 │ │                 │ │                 │ │                ││
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌────────────┐ ││
│  │ │ #4520       │ │ │ │ #4514       │ │ │ │ #4509       │ │ │ │ #4501       │ │ │ │ #4495      │ ││
│  │ │ Tech Suits  │ │ │ │ Singlets    │ │ │ │ Robes       │ │ │ │ Shirts     │ │ │ │ Backpacks  │ ││
│  │ │ 12 units    │ │ │ │ 48 units    │ │ │ │ 6 units     │ │ │ │ 100 units  │ │ │ │ 24 units   │ ││
│  │ │             │ │ │ │             │ │ │ │ ██████░ 85% │ │ │ │             │ │ │ │            │ ││
│  │ │ Due: Feb 2  │ │ │ │ Due: Feb 5  │ │ │ │ Due: Jan 29 │ │ │ │ Due: Jan 28 │ │ │            │ ││
│  │ │ [Accept]    │ │ │ │ [Start]     │ │ │ │ [Complete]  │ │ │ │ [Pass QC]   │ │ │            │ ││
│  │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │ │            │ ││
│  │                 │ │                 │ │                 │ │                 │ │                ││
│  │ ┌─────────────┐ │ │                 │ │ ┌─────────────┐ │ │                 │ │                ││
│  │ │ #4519       │ │ │                 │ │ │ #4508       │ │ │                 │ │                ││
│  │ │ ...         │ │ │                 │ │ │ ...         │ │ │                 │ │                ││
│  │ └─────────────┘ │ │                 │ │ └─────────────┘ │ │                 │ │                ││
│  │                 │ │                 │ │                 │ │                 │ │                ││
│  │  + 15 more      │ │                 │ │  + 11 more      │ │                 │ │                ││
│  │                 │ │                 │ │                 │ │                 │ │                ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────────┘│
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Kanban Board Component Implementation

```typescript
// /client/src/pages/manufacturer/ManufacturerKanban.tsx

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Inbox, 
  CheckCircle, 
  Settings, 
  Search as SearchIcon, 
  Package,
  GripVertical,
  Calendar,
  Clock,
  MoreVertical,
  Camera,
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MANUFACTURER_STATUSES, 
  ManufacturerStatus, 
  STATUS_META,
  isValidTransition,
  getAllowedTransitions
} from '@shared/constants/manufacturer-status';

// ============================================================================
// Types
// ============================================================================

interface ManufacturerJob {
  id: number;
  orderNumber: string;
  orderItemId: number;
  productName: string;
  variantName: string;
  quantity: number;
  status: ManufacturerStatus;
  dueDate: string;
  progressPercent: number | null;
  estimatedCompletionDate: string | null;
  notes: string | null;
  hasPhotos: boolean;
  photoCount: number;
  isOverdue: boolean;
  daysUntilDue: number;
  productFamily: string;
  decorationType: string;
  artworkUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface KanbanColumn {
  id: ManufacturerStatus;
  title: string;
  icon: React.ReactNode;
  jobs: ManufacturerJob[];
}

// ============================================================================
// API Hooks
// ============================================================================

function useManufacturerJobs(filters?: { search?: string; productFamily?: string }) {
  return useQuery<ManufacturerJob[]>({
    queryKey: ['manufacturer', 'jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.productFamily) params.set('productFamily', filters.productFamily);
      
      const response = await fetch(`/api/manufacturer/jobs?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      jobId, 
      newStatus,
      data
    }: { 
      jobId: number; 
      newStatus: ManufacturerStatus;
      data?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, ...data }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'dashboard'] });
      toast({
        title: 'Status Updated',
        description: 'Job status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Sortable Job Card Component
// ============================================================================

interface SortableJobCardProps {
  job: ManufacturerJob;
  onSelect: (job: ManufacturerJob) => void;
  onQuickAction: (job: ManufacturerJob) => void;
}

function SortableJobCard({ job, onSelect, onQuickAction }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <JobCard 
        job={job} 
        onSelect={onSelect}
        onQuickAction={onQuickAction}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ============================================================================
// Job Card Component
// ============================================================================

interface JobCardProps {
  job: ManufacturerJob;
  onSelect: (job: ManufacturerJob) => void;
  onQuickAction: (job: ManufacturerJob) => void;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
}

function JobCard({ job, onSelect, onQuickAction, dragHandleProps, isOverlay }: JobCardProps) {
  const meta = STATUS_META[job.status];
  
  const getDueBadge = () => {
    if (job.isOverdue) {
      return (
        <Badge variant="destructive" className="text-xs">
          {Math.abs(job.daysUntilDue)}d overdue
        </Badge>
      );
    }
    if (job.daysUntilDue <= 2) {
      return (
        <Badge variant="warning" className="text-xs bg-orange-100 text-orange-700">
          {job.daysUntilDue === 0 ? 'Today' : job.daysUntilDue === 1 ? 'Tomorrow' : `${job.daysUntilDue}d`}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {job.daysUntilDue}d
      </Badge>
    );
  };
  
  const getQuickActionLabel = (): string => {
    const transitions = getAllowedTransitions(job.status);
    if (transitions.length === 0) return '';
    const nextStatus = transitions[0];
    return STATUS_META[nextStatus].actionLabel;
  };
  
  return (
    <Card 
      className={`
        mb-3 cursor-pointer hover:shadow-md transition-shadow
        ${isOverlay ? 'shadow-lg rotate-3' : ''}
        ${job.isOverdue ? 'border-red-300' : ''}
      `}
      onClick={() => onSelect(job)}
    >
      <CardContent className="p-3">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {dragHandleProps && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <span className="font-mono text-sm font-medium">#{job.orderNumber}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(job); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Camera className="w-4 h-4 mr-2" />
                Upload Photo
              </DropdownMenuItem>
              <DropdownMenuItem>
                Download Packing Slip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Product Info */}
        <div className="mb-2">
          <p className="font-medium text-sm truncate">{job.productName}</p>
          {job.variantName && (
            <p className="text-xs text-gray-500 truncate">{job.variantName}</p>
          )}
          <p className="text-sm text-gray-600">{job.quantity} units</p>
        </div>
        
        {/* Progress Bar (if in production) */}
        {job.status === 'IN_PRODUCTION' && job.progressPercent !== null && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{job.progressPercent}%</span>
            </div>
            <Progress value={job.progressPercent} className="h-1.5" />
          </div>
        )}
        
        {/* Footer Row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            {getDueBadge()}
          </div>
          
          {job.hasPhotos && (
            <Badge variant="outline" className="text-xs">
              <Camera className="w-3 h-3 mr-1" />
              {job.photoCount}
            </Badge>
          )}
        </div>
        
        {/* Quick Action Button */}
        {getAllowedTransitions(job.status).length > 0 && (
          <Button
            size="sm"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(job);
            }}
          >
            {getQuickActionLabel()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Kanban Column Component
// ============================================================================

interface KanbanColumnProps {
  column: KanbanColumn;
  onSelectJob: (job: ManufacturerJob) => void;
  onQuickAction: (job: ManufacturerJob) => void;
}

function KanbanColumnComponent({ column, onSelectJob, onQuickAction }: KanbanColumnProps) {
  const meta = STATUS_META[column.id];
  const [isExpanded, setIsExpanded] = useState(true);
  const visibleJobs = column.jobs.slice(0, 10);
  const remainingCount = column.jobs.length - visibleJobs.length;
  
  return (
    <div className="flex-shrink-0 w-72 md:w-80">
      {/* Column Header */}
      <div 
        className={`rounded-t-lg px-4 py-3 ${meta.bgColor} border border-b-0`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={meta.color}>{column.icon}</span>
            <span className={`font-medium ${meta.color}`}>{column.title}</span>
            <Badge variant="secondary" className="ml-1">
              {column.jobs.length}
            </Badge>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
        </div>
      </div>
      
      {/* Column Body */}
      {isExpanded && (
        <div className="bg-gray-100 rounded-b-lg border border-t-0 p-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
          <SortableContext
            items={visibleJobs.map(j => j.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleJobs.map(job => (
              <SortableJobCard
                key={job.id}
                job={job}
                onSelect={onSelectJob}
                onQuickAction={onQuickAction}
              />
            ))}
          </SortableContext>
          
          {remainingCount > 0 && (
            <div className="text-center py-3 text-sm text-gray-500">
              + {remainingCount} more jobs
            </div>
          )}
          
          {column.jobs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No jobs in this stage</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Kanban Board Component
// ============================================================================

export default function ManufacturerKanban() {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFamilyFilter, setProductFamilyFilter] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<ManufacturerJob | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const { data: jobs, isLoading } = useManufacturerJobs({ 
    search: searchTerm, 
    productFamily: productFamilyFilter 
  });
  const updateStatus = useUpdateJobStatus();
  const { toast } = useToast();
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Organize jobs into columns
  const columns: KanbanColumn[] = [
    {
      id: 'NEW',
      title: 'New Orders',
      icon: <Inbox className="w-4 h-4" />,
      jobs: (jobs || []).filter(j => j.status === 'NEW'),
    },
    {
      id: 'ACCEPTED',
      title: 'Accepted',
      icon: <CheckCircle className="w-4 h-4" />,
      jobs: (jobs || []).filter(j => j.status === 'ACCEPTED'),
    },
    {
      id: 'IN_PRODUCTION',
      title: 'In Production',
      icon: <Settings className="w-4 h-4" />,
      jobs: (jobs || []).filter(j => j.status === 'IN_PRODUCTION'),
    },
    {
      id: 'QC',
      title: 'Quality Check',
      icon: <SearchIcon className="w-4 h-4" />,
      jobs: (jobs || []).filter(j => j.status === 'QC'),
    },
    {
      id: 'READY_TO_SHIP',
      title: 'Ready to Ship',
      icon: <Package className="w-4 h-4" />,
      jobs: (jobs || []).filter(j => j.status === 'READY_TO_SHIP'),
    },
  ];
  
  // Find active job for drag overlay
  const activeJob = activeId 
    ? jobs?.find(j => j.id === activeId) 
    : null;
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeJob = jobs?.find(j => j.id === active.id);
    if (!activeJob) return;
    
    // Determine the target column
    let targetStatus: ManufacturerStatus | null = null;
    
    // Check if dropped on a column
    const columnStatuses: ManufacturerStatus[] = ['NEW', 'ACCEPTED', 'IN_PRODUCTION', 'QC', 'READY_TO_SHIP'];
    if (columnStatuses.includes(over.id as ManufacturerStatus)) {
      targetStatus = over.id as ManufacturerStatus;
    } else {
      // Dropped on another job - find which column that job is in
      const targetJob = jobs?.find(j => j.id === over.id);
      if (targetJob) {
        targetStatus = targetJob.status;
      }
    }
    
    if (!targetStatus || targetStatus === activeJob.status) return;
    
    // Validate transition
    if (!isValidTransition(activeJob.status, targetStatus)) {
      toast({
        title: 'Invalid Transition',
        description: `Cannot move job from ${STATUS_META[activeJob.status].label} to ${STATUS_META[targetStatus].label}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Perform the status update
    updateStatus.mutate({
      jobId: activeJob.id,
      newStatus: targetStatus,
    });
  };
  
  // Handle quick action (advance to next status)
  const handleQuickAction = (job: ManufacturerJob) => {
    const transitions = getAllowedTransitions(job.status);
    if (transitions.length === 0) return;
    
    const nextStatus = transitions[0];
    
    // For certain transitions, we need additional data
    if (nextStatus === 'SHIPPED') {
      // Open dialog to enter tracking number
      setSelectedJob(job);
      return;
    }
    
    if (nextStatus === 'QC' || nextStatus === 'READY_TO_SHIP') {
      // May want to prompt for photo upload
      // For now, just advance
    }
    
    updateStatus.mutate({
      jobId: job.id,
      newStatus: nextStatus,
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Production Board</h1>
            <p className="text-sm text-gray-500">Drag jobs between columns to update status</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48 md:w-64"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setProductFamilyFilter(undefined)}>
                  All Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProductFamilyFilter('WRESTLING')}>
                  Wrestling Gear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProductFamilyFilter('BASICS_TOPS')}>
                  Basic Tops
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProductFamilyFilter('BASICS_BOTTOMS')}>
                  Basic Bottoms
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="p-4 md:p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {columns.map(column => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                onSelectJob={setSelectedJob}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeJob ? (
              <JobCard
                job={activeJob}
                onSelect={() => {}}
                onQuickAction={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Job Detail Dialog */}
      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusChange={(newStatus, data) => {
            updateStatus.mutate({
              jobId: selectedJob.id,
              newStatus,
              data,
            });
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}
```


## 5.4 Job Detail Modal

The job detail modal provides comprehensive information about a single manufacturing job, allowing manufacturers to update progress, upload photos, enter tracking information, and communicate issues.

### Job Detail Modal Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ORDER #4521 - Wrestling Singlets                                    [X]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STATUS: IN_PRODUCTION                           [▼ Change Status]     ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  ● NEW ─── ● ACCEPTED ─── ◉ PRODUCTION ─── ○ QC ─── ○ READY ─── ○ SHIP ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  ORDER DETAILS                  │  │  TIMELINE                       │  │
│  │  ─────────────────────────────  │  │  ─────────────────────────────  │  │
│  │  Product: Wrestling Singlet     │  │  Created: Jan 20, 2026          │  │
│  │  Variant: Custom - Red/Black    │  │  Accepted: Jan 21, 2026         │  │
│  │  Quantity: 24 units             │  │  Started: Jan 22, 2026          │  │
│  │  Product Family: WRESTLING      │  │  Due Date: Jan 28, 2026         │  │
│  │  Decoration: Sublimation        │  │                                 │  │
│  │                                 │  │  Days Remaining: 6              │  │
│  │  Due Date: Jan 28, 2026         │  │  On Track: ✓ Yes                │  │
│  │  Est. Completion: Jan 27, 2026  │  │                                 │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PROGRESS                                                               ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                         ││
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░  60%                        ││
│  │                                                                         ││
│  │  [─────────────────────────────────────] [Update Progress]              ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ARTWORK & FILES                                                        ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                         ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                           ││
│  │  │  [IMAGE]  │  │  [IMAGE]  │  │  [PDF]    │                           ││
│  │  │  Front    │  │  Back     │  │  Specs    │                           ││
│  │  │  Design   │  │  Design   │  │  Sheet    │                           ││
│  │  └───────────┘  └───────────┘  └───────────┘                           ││
│  │                                                                         ││
│  │  [Download All Files]                                                   ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PRODUCTION PHOTOS                                        [+ Upload]   ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                         ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            ││
│  │  │  [PHOTO]  │  │  [PHOTO]  │  │  [PHOTO]  │  │  [PHOTO]  │            ││
│  │  │  Jan 22   │  │  Jan 23   │  │  Jan 24   │  │  Jan 25   │            ││
│  │  │  Cutting  │  │  Sewing   │  │  Printing │  │  QC       │            ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘            ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  NOTES & COMMUNICATION                                                  ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                         ││
│  │  Customer Note: Please ensure the red matches PMS 485C                  ││
│  │                                                                         ││
│  │  ┌───────────────────────────────────────────────────────────────────┐  ││
│  │  │  Add a note...                                                    │  ││
│  │  └───────────────────────────────────────────────────────────────────┘  ││
│  │  [Send Note]                                                            ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────────┐│
│  │  [Complete Production & Move to QC]│  │  [Report Issue]                │││
│  └───────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Job Detail Dialog Component

```typescript
// /client/src/components/manufacturer/JobDetailDialog.tsx

import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Download, 
  Upload, 
  Camera, 
  CheckCircle,
  AlertTriangle,
  Truck,
  FileText,
  MessageSquare,
  Clock,
  Package,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  ManufacturerStatus,
  STATUS_META,
  getAllowedTransitions,
  isValidTransition,
} from '@shared/constants/manufacturer-status';

// ============================================================================
// Types
// ============================================================================

interface ManufacturerJob {
  id: number;
  orderNumber: string;
  orderItemId: number;
  productName: string;
  variantName: string;
  quantity: number;
  status: ManufacturerStatus;
  dueDate: string;
  progressPercent: number | null;
  estimatedCompletionDate: string | null;
  notes: string | null;
  customerNotes: string | null;
  hasPhotos: boolean;
  photoCount: number;
  isOverdue: boolean;
  daysUntilDue: number;
  productFamily: string;
  decorationType: string;
  artworkUrl: string | null;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
}

interface JobPhoto {
  id: number;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  stage: string;
  createdAt: string;
}

interface JobFile {
  id: number;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface JobNote {
  id: number;
  content: string;
  authorName: string;
  authorRole: 'manufacturer' | 'admin' | 'customer';
  createdAt: string;
}

interface JobDetailDialogProps {
  job: ManufacturerJob;
  onClose: () => void;
  onStatusChange: (newStatus: ManufacturerStatus, data?: Record<string, unknown>) => void;
}

// ============================================================================
// API Hooks
// ============================================================================

function useJobPhotos(jobId: number) {
  return useQuery<JobPhoto[]>({
    queryKey: ['manufacturer', 'job', jobId, 'photos'],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/photos`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
  });
}

function useJobFiles(jobId: number) {
  return useQuery<JobFile[]>({
    queryKey: ['manufacturer', 'job', jobId, 'files'],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/files`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });
}

function useJobNotes(jobId: number) {
  return useQuery<JobNote[]>({
    queryKey: ['manufacturer', 'job', jobId, 'notes'],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/notes`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
  });
}

function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, file, caption, stage }: {
      jobId: number;
      file: File;
      caption?: string;
      stage?: string;
    }) => {
      const formData = new FormData();
      formData.append('photo', file);
      if (caption) formData.append('caption', caption);
      if (stage) formData.append('stage', stage);

      const response = await fetch(`/api/manufacturer/jobs/${jobId}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload photo');
      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'job', jobId, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'jobs'] });
      toast({
        title: 'Photo Uploaded',
        description: 'Your photo has been uploaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

function useUpdateProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, progressPercent }: {
      jobId: number;
      progressPercent: number;
    }) => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ progressPercent }),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'jobs'] });
      toast({
        title: 'Progress Updated',
        description: 'Production progress has been updated.',
      });
    },
  });
}

function useAddNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, content }: {
      jobId: number;
      content: string;
    }) => {
      const response = await fetch(`/api/manufacturer/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['manufacturer', 'job', jobId, 'notes'] });
      toast({
        title: 'Note Added',
        description: 'Your note has been added.',
      });
    },
  });
}

// ============================================================================
// Status Timeline Component
// ============================================================================

function StatusTimeline({ job }: { job: ManufacturerJob }) {
  const stages: { status: ManufacturerStatus; label: string; date: string | null }[] = [
    { status: 'NEW', label: 'Created', date: job.createdAt },
    { status: 'ACCEPTED', label: 'Accepted', date: job.acceptedAt },
    { status: 'IN_PRODUCTION', label: 'Started', date: job.startedAt },
    { status: 'QC', label: 'QC', date: null },
    { status: 'READY_TO_SHIP', label: 'Ready', date: null },
    { status: 'SHIPPED', label: 'Shipped', date: job.shippedAt },
  ];

  const currentIndex = stages.findIndex(s => s.status === job.status);

  return (
    <div className="flex items-center justify-between py-4">
      {stages.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const meta = STATUS_META[stage.status];

        return (
          <React.Fragment key={stage.status}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isComplete ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? `${meta.bgColor} ${meta.color}` : ''}
                  ${!isComplete && !isCurrent ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`text-xs mt-1 ${isCurrent ? 'font-medium' : 'text-gray-500'}`}>
                {stage.label}
              </span>
              {stage.date && (
                <span className="text-xs text-gray-400">
                  {formatDate(stage.date, 'MMM d')}
                </span>
              )}
            </div>
            {index < stages.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// Photo Upload Component
// ============================================================================

interface PhotoUploadProps {
  jobId: number;
  photos: JobPhoto[];
  isLoading: boolean;
}

function PhotoUpload({ jobId, photos, isLoading }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadPhoto();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadPhoto.mutateAsync({
        jobId,
        file,
        stage: 'production',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Production Photos
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="aspect-square relative cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.caption || 'Production photo'}
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              {photo.caption && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b">
                  {photo.caption}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p>No photos yet</p>
          <p className="text-sm">Upload photos to document progress</p>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <Dialog open onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Production photo'}
              className="w-full"
            />
            {selectedPhoto.caption && (
              <p className="text-center text-gray-600">{selectedPhoto.caption}</p>
            )}
            <p className="text-center text-sm text-gray-400">
              {formatDate(selectedPhoto.createdAt, 'PPP p')}
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================================================
// Shipping Form Component
// ============================================================================

interface ShippingFormProps {
  onSubmit: (data: { trackingNumber: string; carrier: string }) => void;
  isLoading: boolean;
}

function ShippingForm({ onSubmit, isLoading }: ShippingFormProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber || !carrier) return;
    onSubmit({ trackingNumber, carrier });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Shipping Carrier</label>
        <Select value={carrier} onValueChange={setCarrier}>
          <SelectTrigger>
            <SelectValue placeholder="Select carrier..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DHL">DHL</SelectItem>
            <SelectItem value="FedEx">FedEx</SelectItem>
            <SelectItem value="UPS">UPS</SelectItem>
            <SelectItem value="USPS">USPS</SelectItem>
            <SelectItem value="Aramex">Aramex</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Tracking Number</label>
        <Input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter tracking number..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !trackingNumber || !carrier}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Truck className="w-4 h-4 mr-2" />
        )}
        Mark as Shipped
      </Button>
    </form>
  );
}

// ============================================================================
// Main Job Detail Dialog Component
// ============================================================================

export default function JobDetailDialog({ job, onClose, onStatusChange }: JobDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [progress, setProgress] = useState(job.progressPercent || 0);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const { data: photos, isLoading: photosLoading } = useJobPhotos(job.id);
  const { data: files, isLoading: filesLoading } = useJobFiles(job.id);
  const { data: notes, isLoading: notesLoading } = useJobNotes(job.id);

  const updateProgress = useUpdateProgress();
  const addNote = useAddNote();
  const { toast } = useToast();

  const allowedTransitions = getAllowedTransitions(job.status);
  const meta = STATUS_META[job.status];

  const handleProgressUpdate = () => {
    updateProgress.mutate({
      jobId: job.id,
      progressPercent: progress,
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addNote.mutate({
      jobId: job.id,
      content: noteContent,
    });
    setNoteContent('');
  };

  const handleStatusAdvance = () => {
    if (allowedTransitions.length === 0) return;
    const nextStatus = allowedTransitions[0];

    if (nextStatus === 'SHIPPED') {
      setShowShippingForm(true);
      return;
    }

    onStatusChange(nextStatus);
  };

  const handleShippingSubmit = (data: { trackingNumber: string; carrier: string }) => {
    onStatusChange('SHIPPED', data);
    setShowShippingForm(false);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono">#{job.orderNumber}</span>
                <span className="text-gray-400">-</span>
                <span>{job.productName}</span>
              </DialogTitle>
              <Badge className={`${meta.bgColor} ${meta.color}`}>
                {meta.label}
              </Badge>
            </div>
          </DialogHeader>

          {/* Status Timeline */}
          <StatusTimeline job={job} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Order Details */}
                <div className="space-y-3">
                  <h3 className="font-medium">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product:</span>
                      <span>{job.productName}</span>
                    </div>
                    {job.variantName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Variant:</span>
                        <span>{job.variantName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity:</span>
                      <span>{job.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product Family:</span>
                      <span>{job.productFamily}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Decoration:</span>
                      <span>{job.decorationType}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="font-medium">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{formatDate(job.createdAt, 'PPP')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due Date:</span>
                      <span className={job.isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(job.dueDate, 'PPP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days Remaining:</span>
                      <span className={job.isOverdue ? 'text-red-600' : ''}>
                        {job.isOverdue ? `${Math.abs(job.daysUntilDue)} overdue` : job.daysUntilDue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress (for IN_PRODUCTION status) */}
              {job.status === 'IN_PRODUCTION' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Production Progress</h3>
                  <div className="space-y-4">
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[progress]}
                        onValueChange={([value]) => setProgress(value)}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="font-mono text-lg w-16 text-right">{progress}%</span>
                      <Button
                        onClick={handleProgressUpdate}
                        disabled={progress === job.progressPercent}
                        size="sm"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Form (for READY_TO_SHIP status) */}
              {showShippingForm && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-4">Enter Shipping Details</h3>
                  <ShippingForm
                    onSubmit={handleShippingSubmit}
                    isLoading={false}
                  />
                </div>
              )}

              {/* Customer Notes */}
              {job.customerNotes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Customer Notes
                  </h3>
                  <p className="text-sm">{job.customerNotes}</p>
                </div>
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Artwork & Files</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>

              {filesLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : files && files.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {files.map(file => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.type}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>No files attached</p>
                </div>
              )}
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <PhotoUpload
                jobId={job.id}
                photos={photos || []}
                isLoading={photosLoading}
              />
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {notesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : notes && notes.length > 0 ? (
                  notes.map(note => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg ${
                        note.authorRole === 'manufacturer'
                          ? 'bg-blue-50 ml-8'
                          : note.authorRole === 'admin'
                          ? 'bg-gray-50 mr-8'
                          : 'bg-yellow-50 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{note.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(note.createdAt, 'PPP p')}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                    <p>No notes yet</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1"
                  rows={2}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || addNote.isPending}
                >
                  {addNote.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {allowedTransitions.length > 0 && !showShippingForm && (
              <Button onClick={handleStatusAdvance} className="flex-1">
                {meta.actionLabel}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Report Dialog */}
      <AlertDialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report an Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Describe the issue you're encountering with this order. Our team will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Describe the issue..." rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Submit Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```


---

## 5.5 IMPORTANT IMPLEMENTATION NOTE

**The code examples in sections 5.2-5.4 above are REFERENCE IMPLEMENTATIONS ONLY.**

Claude Code should:
1. Study the actual codebase patterns first
2. Use existing component libraries and utilities found in the project
3. Adapt implementations to match existing code style
4. Make architectural decisions based on what's already there
5. NOT copy code verbatim - use it as inspiration for the INTENT

The key requirements are the BEHAVIORS and UX FLOWS, not the specific code.

---

## 5.6 Manufacturer Portal - Behavioral Specifications

### 5.6.1 Dashboard Behavior Requirements

**MUST HAVE behaviors:**

1. **Auto-refresh data** - Dashboard should poll for updates every 30 seconds without user intervention
2. **Urgent job highlighting** - Any job within 48 hours of due date OR overdue MUST be visually distinct
3. **Payment visibility** - Manufacturer should always see their current balance owed at a glance
4. **One-click navigation** - Every metric shown should be clickable to drill into details
5. **Mobile responsive** - Factory workers use phones; dashboard must work on 375px width screens

**Stats to display:**
- Total active jobs (not shipped)
- Jobs due this week
- Number overdue
- Total payment owed to manufacturer
- Breakdown by payment terms (NET30 vs NET60)

**Status distribution visualization:**
- Show count of jobs in each of the 6 stages
- Use horizontal bar chart or progress bars
- Make each bar clickable to filter job list

**Urgent jobs section:**
- Show max 5 most urgent
- Sort by: overdue first, then by days until due ascending
- Each item shows: order number, product name, quantity, due date, current status
- Quick action button appropriate to current status

**Quick actions panel:**
- View new orders (with badge count)
- Open production board
- View ready to ship (with badge count)  
- Download packing slips
- View payment history

### 5.6.2 Kanban Board Behavior Requirements

**Core functionality:**

1. **Drag and drop** - Jobs can be dragged between columns to change status
2. **Validation on drop** - System must validate transition is allowed before updating
3. **Optimistic updates** - UI should update immediately, rollback if server rejects
4. **Invalid transition feedback** - Show toast/alert explaining why a transition was rejected

**Column configuration:**
- 5 visible columns: NEW, ACCEPTED, IN_PRODUCTION, QC, READY_TO_SHIP
- SHIPPED jobs are NOT shown on board (they're complete)
- Each column shows count of jobs
- Columns are collapsible on mobile

**Job card requirements:**
- Order number (prominent, monospace font)
- Product name (truncate if long)
- Quantity with "units" label
- Due date with visual urgency indicator
- Progress percentage (only for IN_PRODUCTION)
- Photo count indicator if photos exist
- Quick action button based on current status

**Card interactions:**
- Click card → open detail modal
- Click quick action → advance to next status (with confirmation for SHIPPED)
- Drag handle → initiate drag

**Search and filter:**
- Search by order number, product name
- Filter by product family
- Filter by due date range
- Filters persist in URL for sharing/bookmarking

**Responsive behavior:**
- Desktop: 5 columns side by side, horizontal scroll if needed
- Tablet: 3 columns visible, scroll to see rest
- Mobile: 1 column at a time, swipe or tabs to switch columns

### 5.6.3 Job Detail Modal Behavior Requirements

**Information hierarchy (top to bottom):**

1. **Header**: Order number + product name + current status badge
2. **Timeline**: Visual representation of job's journey through stages with dates
3. **Tabbed content**: Details | Files | Photos | Notes
4. **Action buttons**: Primary action + Report Issue

**Details tab content:**
- Product information (name, variant, quantity, family, decoration type)
- Timeline information (created, accepted, started, due date, days remaining)
- Progress slider (only for IN_PRODUCTION status)
- Customer notes (highlighted if present)
- Shipping form (only when transitioning to SHIPPED)

**Files tab content:**
- Grid of artwork files with thumbnails where possible
- Download individual or download all
- Show file type icons for non-image files

**Photos tab content:**
- Grid of production progress photos
- Upload button with camera capture support for mobile
- Click to view full size in lightbox
- Show upload date and caption

**Notes tab content:**
- Chronological list of notes
- Visual distinction between manufacturer notes, admin notes, customer notes
- Input field to add new note
- Real-time update when note added

**Status transitions:**
- Primary button changes based on current status
- When advancing to SHIPPED, show inline shipping form requiring carrier + tracking number
- All transitions logged with timestamp and user

**Issue reporting:**
- "Report Issue" button always visible
- Opens dialog with textarea for description
- Notifies admin team
- Optionally can pause/hold the job

### 5.6.4 Mobile-Specific Requirements

Manufacturers use phones on factory floor. Every screen must:

1. **Work on 375px width** (iPhone SE size)
2. **Have touch-friendly tap targets** (minimum 44x44px)
3. **Support camera capture** for photo uploads
4. **Work offline-ish** - show cached data if network slow, queue updates
5. **Have swipe gestures** for common actions (swipe to advance status)
6. **Avoid hover-dependent interactions** - everything must work with tap

**Mobile navigation:**
- Bottom navigation bar with: Dashboard, Board, Jobs, Profile
- Hamburger menu for secondary items

**Mobile job cards:**
- Larger text for order number
- Swipe right to advance status
- Swipe left to open details
- Pull down to refresh

### 5.6.5 Notification Requirements

Manufacturers should be notified of:
1. New job assigned to them
2. Job approaching due date (48 hours)
3. Job overdue
4. Note added by admin/customer
5. Payment received

**Notification channels:**
- In-app notification center (bell icon with badge)
- Email (configurable per notification type)
- Optional: WhatsApp/SMS integration for urgent notifications

---

## 5.7 Manufacturer Portal - API Requirements

### 5.7.1 Dashboard Endpoints

**GET /api/manufacturer/dashboard/stats**
- Returns aggregate stats for logged-in manufacturer
- Response includes: activeJobs, dueThisWeek, overdueCount, paymentDue, jobsByStatus

**GET /api/manufacturer/dashboard/urgent**
- Returns up to 10 most urgent jobs
- Sorted by overdue status, then days until due
- Includes all fields needed for job card display

**GET /api/manufacturer/dashboard/activity**
- Returns recent activity for this manufacturer
- Limit to last 50 actions
- Includes: action type, order number, timestamp

### 5.7.2 Jobs Endpoints

**GET /api/manufacturer/jobs**
- List all jobs for logged-in manufacturer
- Query params: status, productFamily, search, dueAfter, dueBefore, page, limit
- Returns paginated list with job cards data

**GET /api/manufacturer/jobs/:id**
- Full job details
- Includes: all job fields, timeline dates, customer notes

**PUT /api/manufacturer/jobs/:id/status**
- Update job status
- Body: { status, trackingNumber?, carrier?, notes? }
- Validates transition is allowed
- Creates audit log entry
- Returns updated job

**PUT /api/manufacturer/jobs/:id/progress**
- Update progress percentage
- Body: { progressPercent }
- Only valid for IN_PRODUCTION status

**GET /api/manufacturer/jobs/:id/files**
- List artwork/spec files for job

**GET /api/manufacturer/jobs/:id/photos**
- List production photos for job

**POST /api/manufacturer/jobs/:id/photos**
- Upload new photo
- Multipart form: photo file, caption, stage
- Returns created photo record

**GET /api/manufacturer/jobs/:id/notes**
- List notes for job

**POST /api/manufacturer/jobs/:id/notes**
- Add new note
- Body: { content }
- Creates note with manufacturer as author

### 5.7.3 Authentication & Authorization

- All /api/manufacturer/* endpoints require authenticated manufacturer user
- Manufacturer can ONLY see/modify jobs assigned to their manufacturer_id
- Middleware must verify: user.role === 'manufacturer' AND job.manufacturerId === user.manufacturerId

---

## 5.8 Manufacturer Portal - Database Changes

### 5.8.1 New Columns on Existing Tables

**manufacturing_jobs table (or equivalent):**
- Add: progress_percent INTEGER (0-100, nullable)
- Add: accepted_at TIMESTAMP
- Add: started_at TIMESTAMP  
- Add: qc_passed_at TIMESTAMP
- Add: ready_to_ship_at TIMESTAMP
- Add: estimated_completion_date DATE

**Existing status column:**
- Migrate from 15-stage system to 6-stage system
- Create mapping: old status → new status
- Run migration to update all existing jobs

### 5.8.2 New Tables

**manufacturer_job_photos:**
- id (PK)
- job_id (FK)
- url
- thumbnail_url
- caption
- stage (enum: cutting, sewing, printing, qc, packing, other)
- created_at
- created_by_user_id

**manufacturer_job_notes:**
- id (PK)
- job_id (FK)
- content TEXT
- author_user_id (FK)
- author_role (enum: manufacturer, admin, customer)
- created_at

**manufacturer_notifications:**
- id (PK)
- manufacturer_id (FK)
- type (enum: new_job, due_soon, overdue, note_added, payment_received)
- job_id (FK, nullable)
- title
- message
- is_read BOOLEAN
- read_at TIMESTAMP
- created_at

### 5.8.3 Status Migration Script

```sql
-- REFERENCE: Actual implementation should handle all edge cases

-- Create mapping table
CREATE TEMP TABLE status_mapping (
  old_status VARCHAR(50),
  new_status VARCHAR(20)
);

INSERT INTO status_mapping VALUES
  ('new', 'NEW'),
  ('pending', 'NEW'),
  ('needs_review', 'NEW'),
  ('confirmed', 'ACCEPTED'),
  ('accepted', 'ACCEPTED'),
  ('scheduled', 'ACCEPTED'),
  ('materials_ordered', 'ACCEPTED'),
  ('in_progress', 'IN_PRODUCTION'),
  ('cutting', 'IN_PRODUCTION'),
  ('sewing', 'IN_PRODUCTION'),
  ('printing', 'IN_PRODUCTION'),
  ('finishing', 'IN_PRODUCTION'),
  ('quality_check', 'QC'),
  ('inspection', 'QC'),
  ('ready', 'READY_TO_SHIP'),
  ('packed', 'READY_TO_SHIP'),
  ('shipped', 'SHIPPED'),
  ('delivered', 'SHIPPED');

-- Update jobs with new status values
-- (Actual implementation needs to handle the specific column name and table)
```

---

## 5.9 Manufacturer Portal - File Structure

The following files should be created or modified. Claude Code should determine exact paths based on existing project structure.

**New pages:**
- ManufacturerDashboard - Main landing page after login
- ManufacturerKanban - Production board with drag-drop
- ManufacturerJobList - Filterable/searchable job list view
- ManufacturerJobDetail - Full page job detail (for deep links)
- ManufacturerPayments - Payment history and balance
- ManufacturerSettings - Notification preferences

**New components:**
- JobCard - Reusable job card for board and list views
- JobDetailModal - Modal with tabbed content
- StatusTimeline - Visual status progression
- StatusBadge - Colored badge for status display
- PhotoUpload - Camera-enabled photo upload
- ShippingForm - Carrier + tracking input
- NotificationBell - Bell icon with dropdown

**New API routes:**
- manufacturer-dashboard.routes.ts
- manufacturer-jobs.routes.ts (may extend existing)
- manufacturer-photos.routes.ts
- manufacturer-notes.routes.ts
- manufacturer-notifications.routes.ts

**Shared constants:**
- manufacturer-status.ts - Status definitions and transitions

---

## 5.10 Manufacturer Portal - Testing Requirements

### Functional Tests

1. **Dashboard loads correctly** with real manufacturer data
2. **Stats refresh** every 30 seconds
3. **Clicking urgent job** opens job detail
4. **Kanban drag and drop** updates status correctly
5. **Invalid transitions** are rejected with explanation
6. **Photo upload** works on desktop and mobile
7. **Notes** appear in real-time after adding
8. **Shipping form** validates carrier and tracking before allowing SHIPPED status
9. **Search** filters jobs correctly
10. **Pagination** works when many jobs exist

### Mobile Tests

1. Dashboard renders correctly at 375px width
2. Kanban columns are swipeable on mobile
3. Camera capture works for photo upload
4. All buttons have adequate tap targets
5. Forms are usable with on-screen keyboard

### Permission Tests

1. Manufacturer cannot see other manufacturers' jobs
2. Manufacturer cannot update jobs not assigned to them
3. Unauthenticated requests are rejected
4. Non-manufacturer users cannot access manufacturer endpoints


---

# 6. PHASE 3: CATALOG SYSTEM & AUTO-ROUTING

## 6.1 Overview

The catalog system is the heart of the multi-manufacturer network. It must automatically route products to the correct manufacturer based on product family, handle order splitting when an order contains products from multiple families, and provide admin tools to manage the routing configuration.

### Current Problems Being Solved

1. **No product family concept** - Currently no way to group products by manufacturing capability
2. **Manual manufacturer assignment** - Admin must manually assign every job to a manufacturer
3. **No order splitting** - Multi-product orders can't be split across manufacturers
4. **No fallback logic** - If primary manufacturer is unavailable, no automatic fallback
5. **No capacity awareness** - System doesn't know if manufacturer has bandwidth

### Goals

1. **Automatic routing** - When order placed, system auto-assigns to correct manufacturer
2. **Order splitting** - Single order with multiple products can route to multiple manufacturers
3. **Fallback cascade** - If primary unavailable, try backup, then alert admin
4. **Capacity checking** - Consider manufacturer workload when routing
5. **Override capability** - Admin can manually override any automatic decision

---

## 6.2 Product Family Hierarchy

### Hierarchy Structure

```
PRODUCT FAMILY (e.g., WRESTLING)
  └── CATEGORY (e.g., Competition Wear)
        └── PRODUCT (e.g., Wrestling Singlet)
              └── VARIANT (e.g., Custom Red/Black XL)
```

### Manufacturer Resolution Cascade

When determining which manufacturer should produce a variant, the system checks in this order:

1. **Variant level** - Is there a specific manufacturer override for this variant?
2. **Product level** - Is there a specific manufacturer assigned to this product?
3. **Category level** - Is there a manufacturer assigned to this category?
4. **Family level** - Use the product family's default manufacturer

This allows broad defaults at the family level with specific overrides where needed.

### Product Family Definitions

| Code | Name | Description | Typical Lead Time | Primary Region |
|------|------|-------------|-------------------|----------------|
| WRESTLING | Wrestling & Combat | Singlets, rash guards, fight shorts, robes, tech suits, bags | 21 days | Pakistan |
| BASICS_TOPS | Basic Tops | T-shirts, long sleeves, crewnecks, hoodies | 14 days | Pakistan/China |
| BASICS_BOTTOMS | Basic Bottoms | Gym shorts, sweat pants, joggers | 14 days | China |
| WOMENS_LOUNGE | Women's Loungewear | Sweat sets, crop tops, matching sets | 21 days | Specialized |
| SPORTS_JERSEYS | American Sports | Football, baseball, volleyball, soccer, basketball jerseys | 21 days | Pakistan (Sialkot) |
| ELEVATED | Elevated Essentials | Quarter-zips, polos, jackets, vests | 28 days | Turkey/Mexico |

### Category Examples per Family

**WRESTLING:**
- Competition Wear (singlets, tech suits)
- Training Gear (rash guards, fight shorts)
- Accessories (backpacks, robes)

**BASICS_TOPS:**
- Short Sleeve (t-shirts, tanks)
- Long Sleeve (long sleeve tees, thermals)
- Outerwear (hoodies, crewnecks)

**SPORTS_JERSEYS:**
- Football (jerseys, pants)
- Baseball (jerseys, pants)
- Basketball (jerseys, shorts)
- Volleyball (jerseys)
- Soccer (jerseys, shorts)

---

## 6.3 Auto-Routing Logic

### Order Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER PROCESSING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NEW ORDER RECEIVED                                                      │
│     │                                                                       │
│     ▼                                                                       │
│  2. FOR EACH LINE ITEM:                                                     │
│     │                                                                       │
│     ├──▶ a. Identify product family                                         │
│     │                                                                       │
│     ├──▶ b. Resolve manufacturer using cascade:                             │
│     │       Variant → Product → Category → Family                           │
│     │                                                                       │
│     ├──▶ c. Check manufacturer availability:                                │
│     │       - Is manufacturer active?                                       │
│     │       - Is manufacturer accepting new orders?                         │
│     │       - Does manufacturer have capacity?                              │
│     │                                                                       │
│     ├──▶ d. If unavailable, try backup manufacturer                         │
│     │                                                                       │
│     └──▶ e. If all unavailable, flag for admin review                       │
│                                                                             │
│     │                                                                       │
│     ▼                                                                       │
│  3. GROUP LINE ITEMS BY MANUFACTURER                                        │
│     │                                                                       │
│     ▼                                                                       │
│  4. CREATE MANUFACTURING JOBS:                                              │
│     │                                                                       │
│     ├──▶ One job per manufacturer per order                                 │
│     │                                                                       │
│     ├──▶ Each job contains relevant line items                              │
│     │                                                                       │
│     └──▶ Calculate due dates based on lead times                            │
│                                                                             │
│     │                                                                       │
│     ▼                                                                       │
│  5. NOTIFY MANUFACTURERS OF NEW JOBS                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Manufacturer Availability Checks

Before assigning to a manufacturer, the system must verify:

1. **Is Active** - Manufacturer account is active and not suspended
2. **Accepting Orders** - Manufacturer has not paused new order intake
3. **Capacity Available** - Manufacturer's active job count is below their capacity limit
4. **Can Produce** - Manufacturer has capability for this decoration type
5. **Payment Terms OK** - Manufacturer's account is in good standing

### Capacity Calculation

```
Available Capacity = Max Capacity - Current Active Jobs

Where:
- Max Capacity = manufacturer.max_concurrent_jobs (configurable per manufacturer)
- Current Active Jobs = count of jobs where status NOT IN ('SHIPPED')
```

### Fallback Logic

When primary manufacturer is unavailable:

1. Check backup_manufacturer_id on product family
2. If backup available and has capacity, assign to backup
3. If backup unavailable, check product_family_manufacturers table for other capable manufacturers
4. Sort alternatives by priority, try each in order
5. If all fail, create job with status 'PENDING_ASSIGNMENT' and alert admin

### Split Order Handling

When an order contains products from multiple families:

1. Group line items by resolved manufacturer
2. Create separate manufacturing job for each manufacturer
3. Each job tracks which order_items it contains
4. Admin dashboard shows "split order" indicator
5. Order is only "complete" when all child jobs are shipped

---

## 6.4 Admin Catalog Management UI

### Product Family Management

**List View Requirements:**
- Show all product families in a table/grid
- Display: code, name, default manufacturer, backup manufacturer, product count, active toggle
- Sort by code, name, or product count
- Filter by active/inactive
- Quick toggle to activate/deactivate family

**Create/Edit Family Form:**
- Code (uppercase, no spaces, unique)
- Name (display name)
- Description
- Default manufacturer (dropdown)
- Backup manufacturer (dropdown)
- Target cost range (min/max)
- Default lead time (days)
- Image upload
- Active toggle

**Family Detail View:**
- Family information
- List of categories in this family
- List of manufacturers assigned to this family
- List of products in this family
- Statistics: total products, total variants, orders this month

### Manufacturer Assignment Interface

**Family-Manufacturer Matrix:**
- Grid showing all families × all manufacturers
- Cell shows: assigned (checkbox), priority, capabilities
- Bulk assignment: select manufacturer, assign to multiple families
- Quick capability indicators: sublimation, embroidery, screen print, DTG

**Per-Family Manufacturer Management:**
- Add manufacturer to family
- Set priority (1 = primary, 2 = first backup, etc.)
- Configure capabilities for this family
- Set MOQ and cost overrides
- Set lead time override
- Toggle active/inactive for this assignment

### Product-to-Family Assignment

**Bulk Assignment Tool:**
- Select multiple products
- Assign to family in bulk
- Option to also assign category
- Preview changes before applying

**Individual Product Override:**
- On product edit page, show inherited manufacturer
- Allow override with specific manufacturer
- Show warning when overriding family default

### Category Management

**Category List per Family:**
- Tree view showing family → categories
- Drag to reorder categories
- Add new category under family
- Edit category name and description
- Assign specific manufacturer override at category level

---

## 6.5 Order Routing Dashboard

### Pending Assignment Queue

For orders/jobs that couldn't be auto-routed:

**Queue List:**
- Show all jobs with status 'PENDING_ASSIGNMENT'
- Display: order number, product, quantity, family, reason for pending
- Sort by created date (oldest first)
- Filter by product family

**Assignment Actions:**
- Select manufacturer from dropdown
- Explain why original routing failed
- Option to add manufacturer to family for future orders
- Bulk assign multiple pending jobs at once

### Routing History/Audit

**View Recent Routing Decisions:**
- List of recent orders processed
- Show: order, manufacturer assigned, routing reason
- Flag any that were manually overridden
- Flag any that went to backup manufacturer

**Override Tracking:**
- When admin manually changes assignment
- Log: who, when, from which manufacturer, to which manufacturer, reason

### Split Order View

**Split Order Indicator:**
- On order detail page, show if order was split
- List all manufacturing jobs for this order
- Show status of each job
- Show which manufacturer has each job
- Aggregate view: order complete when all jobs shipped

---

## 6.6 Catalog API Requirements

### Product Family Endpoints

**GET /api/admin/product-families**
- List all families with counts
- Include: default manufacturer name, product count, active status

**POST /api/admin/product-families**
- Create new family
- Validate code uniqueness
- Create audit log

**GET /api/admin/product-families/:id**
- Full family details
- Include: categories, assigned manufacturers, recent orders

**PUT /api/admin/product-families/:id**
- Update family
- Validate changes
- Create audit log

**DELETE /api/admin/product-families/:id**
- Soft delete (set is_active = false)
- Prevent if products still assigned
- Create audit log

### Family-Manufacturer Assignment Endpoints

**GET /api/admin/product-families/:id/manufacturers**
- List manufacturers assigned to family
- Include: priority, capabilities, MOQ, cost

**POST /api/admin/product-families/:id/manufacturers**
- Add manufacturer to family
- Specify capabilities and priority

**PUT /api/admin/product-families/:id/manufacturers/:mfrId**
- Update assignment details

**DELETE /api/admin/product-families/:id/manufacturers/:mfrId**
- Remove manufacturer from family

### Routing Endpoints

**POST /api/internal/orders/:orderId/route**
- Trigger auto-routing for an order
- Returns routing decisions made
- Internal endpoint called by order processing

**GET /api/admin/routing/pending**
- Get orders pending manual assignment

**POST /api/admin/routing/assign**
- Manually assign job to manufacturer
- Body: { jobId, manufacturerId, reason }

**GET /api/admin/routing/history**
- Get recent routing decisions with audit trail

### Product Assignment Endpoints

**PUT /api/admin/products/:id/family**
- Assign product to family
- Body: { productFamilyId, categoryId? }

**PUT /api/admin/products/bulk-family**
- Bulk assign products to family
- Body: { productIds[], productFamilyId, categoryId? }

**PUT /api/admin/products/:id/manufacturer-override**
- Set manufacturer override at product level
- Body: { manufacturerId } or null to clear override

---

## 6.7 Catalog Database Requirements

### Product Family Tables

Refer to Phase 1 for schema, but ensure these relationships:

**product_families:**
- Has one default_manufacturer (manufacturers)
- Has one optional backup_manufacturer (manufacturers)
- Has many product_family_manufacturers
- Has many product_categories
- Has many products (through category or direct)

**product_family_manufacturers:**
- Belongs to product_family
- Belongs to manufacturer
- Stores: priority, capabilities (as boolean flags), MOQ, cost, lead time

**product_categories:**
- Belongs to product_family
- Has optional manufacturer_override_id
- Has many products

### Product Table Additions

Add to existing products table:
- product_family_id (FK, nullable for migration)
- product_category_id (FK, nullable)
- manufacturer_override_id (FK, nullable)

### Order/Job Table Additions

Add to manufacturing jobs table:
- routed_by (enum: 'auto', 'manual', 'fallback')
- routing_reason (text, why this manufacturer was chosen)
- original_manufacturer_id (FK, if rerouted, who was originally assigned)

---

## 6.8 Catalog Migration Plan

### Phase 1: Add Tables and Columns

1. Create product_families table
2. Create product_family_manufacturers table
3. Create product_categories table (if not exists)
4. Add new columns to products table
5. Add new columns to manufacturing_jobs table

### Phase 2: Seed Initial Data

1. Create the 6 default product families
2. Assign existing manufacturer (Hawk) to WRESTLING family
3. Set Hawk as default for any existing products

### Phase 3: Classify Existing Products

1. Export list of all products
2. Review and classify each into a family
3. Create categories as needed
4. Run migration to assign products to families

### Phase 4: Enable Auto-Routing

1. Deploy routing logic (but disabled)
2. Test with sample orders in staging
3. Enable for new orders
4. Monitor for issues

### Phase 5: Handle Edge Cases

1. Products without family assignment route to default manufacturer
2. Unknown products flag for admin review
3. Gradually clean up unassigned products

---

## 6.9 Catalog Testing Requirements

### Unit Tests

1. Manufacturer resolution cascade works correctly
2. Availability checks return correct results
3. Capacity calculation is accurate
4. Fallback logic tries manufacturers in priority order
5. Order splitting groups items correctly

### Integration Tests

1. New order triggers auto-routing
2. Multi-family order creates multiple jobs
3. Unavailable manufacturer triggers fallback
4. All unavailable creates pending assignment
5. Manual assignment updates job correctly
6. Admin can override auto-routed job

### Business Logic Tests

1. Changing family default manufacturer affects future orders only
2. Product-level override takes precedence over family
3. Deactivating manufacturer triggers fallback on new orders
4. Re-activating manufacturer includes them in routing again


---

# 7. PHASE 4: 3PL MANAGEMENT SYSTEM

## 7.1 Overview

The 3PL (Third-Party Logistics) system manages the flow of goods from manufacturers to a central fulfillment center, quality control inspection, inventory storage, and final shipment to customers. This is a new system that doesn't exist in the current codebase.

### Business Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            3PL WORKFLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   MANUFACTURER                   3PL CENTER                    CUSTOMER     │
│                                                                             │
│   ┌──────────┐                  ┌──────────┐                               │
│   │ Ships    │ ───────────────▶ │ Receives │                               │
│   │ to 3PL   │   Tracking #     │ Inbound  │                               │
│   └──────────┘                  └──────────┘                               │
│                                      │                                      │
│                                      ▼                                      │
│                                 ┌──────────┐                               │
│                                 │   QC     │                               │
│                                 │ Inspect  │                               │
│                                 └──────────┘                               │
│                                      │                                      │
│                          ┌──────────┴──────────┐                           │
│                          │                     │                            │
│                          ▼                     ▼                            │
│                    ┌──────────┐          ┌──────────┐                       │
│                    │  PASS    │          │  FAIL    │                       │
│                    │ → Stock  │          │ → Hold   │                       │
│                    └──────────┘          └──────────┘                       │
│                          │                     │                            │
│                          ▼                     ▼                            │
│                    ┌──────────┐          ┌──────────┐                       │
│                    │ Add to   │          │ Contact  │                       │
│                    │ Inventory│          │ Mfr/Admin│                       │
│                    └──────────┘          └──────────┘                       │
│                          │                                                  │
│                          ▼                                                  │
│                    ┌──────────┐                  ┌──────────┐              │
│                    │ Customer │ ───────────────▶ │ Receives │              │
│                    │ Order    │    Shipping      │ Package  │              │
│                    └──────────┘                  └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

**Fulfillment Center:** Physical warehouse where goods are received and shipped from. System supports multiple fulfillment centers.

**Inbound Shipment:** A shipment from a manufacturer TO the fulfillment center. Contains items from one or more manufacturing jobs.

**QC Inspection:** Quality control check performed on inbound goods. Can pass, fail, or partially pass.

**Inventory:** Stock of items at a fulfillment center ready to ship to customers.

**Outbound Shipment:** A shipment FROM the fulfillment center TO a customer or retailer.

---

## 7.2 Fulfillment Center Management

### Fulfillment Center Data Model

Each fulfillment center has:
- Name and code (e.g., "East Coast Warehouse", "FC-EAST")
- Address (full shipping address)
- Contact information
- Operating hours
- Capabilities (can receive, can ship, can store long-term)
- Default carrier preferences
- Active status

### Admin UI Requirements

**Fulfillment Center List:**
- Table showing all fulfillment centers
- Columns: name, code, location, status, current inventory count
- Quick actions: view details, edit, deactivate

**Add/Edit Fulfillment Center:**
- Form with all fields above
- Address validation
- Set as default receiving location toggle
- Configure carrier accounts

**Fulfillment Center Detail:**
- Overview statistics: items in stock, inbound pending, outbound pending
- Recent inbound shipments
- Recent outbound shipments
- Inventory levels by product

---

## 7.3 Inbound Shipment Tracking

### Inbound Shipment Lifecycle

```
EXPECTED → IN_TRANSIT → ARRIVED → INSPECTING → STOCKED (or ISSUE)
```

**EXPECTED:** Manufacturer marked job as shipped, 3PL is expecting package
**IN_TRANSIT:** Tracking shows package in transit
**ARRIVED:** Package received at fulfillment center
**INSPECTING:** QC inspection in progress
**STOCKED:** All items passed QC and added to inventory
**ISSUE:** Problem found - hold for resolution

### Creating Inbound Shipments

When manufacturer marks job as SHIPPED:
1. System creates inbound_shipment record
2. Links to fulfillment center (default or specified)
3. Links to manufacturing job(s) included
4. Records tracking number and carrier
5. Calculates expected arrival date

### Inbound Shipment UI

**Inbound List View:**
- Filter by: status, fulfillment center, manufacturer, date range
- Columns: shipment ID, manufacturer, tracking, status, expected arrival, item count
- Quick actions: view tracking, start inspection, mark arrived

**Inbound Detail View:**
- Shipment information: tracking, carrier, manufacturer, shipped date
- Expected vs actual arrival dates
- Contents: list of items expected in this shipment
- QC status for each item
- Timeline of status changes
- Link to manufacturing job(s)

**Awaiting Arrival Dashboard:**
- List of shipments expected today/tomorrow
- Overdue shipments (expected but not arrived)
- Quick mark-as-arrived buttons

---

## 7.4 QC Inspection System

### QC Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QC INSPECTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SHIPMENT ARRIVES                                                        │
│     │                                                                       │
│     ▼                                                                       │
│  2. VERIFY CONTENTS                                                         │
│     ├── Correct items received?                                             │
│     ├── Correct quantities?                                                 │
│     └── Packing slip matches?                                               │
│     │                                                                       │
│     ▼                                                                       │
│  3. INSPECT EACH ITEM TYPE                                                  │
│     ├── Visual inspection                                                   │
│     ├── Size/fit check (sample)                                             │
│     ├── Print/decoration quality                                            │
│     ├── Construction quality                                                │
│     └── Photo documentation                                                 │
│     │                                                                       │
│     ▼                                                                       │
│  4. RECORD RESULTS                                                          │
│     ├── Pass: Move to inventory                                             │
│     ├── Minor Issue: Note and pass                                          │
│     ├── Major Issue: Hold for review                                        │
│     └── Reject: Return to manufacturer                                      │
│     │                                                                       │
│     ▼                                                                       │
│  5. COMPLETE INSPECTION                                                     │
│     ├── All passed → Stock inventory                                        │
│     ├── Some issues → Partial stock + alert                                 │
│     └── Failed → Create issue ticket                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### QC Result Types

**PASS:** Item meets all quality standards, ready for inventory
**PASS_WITH_NOTES:** Minor cosmetic issue noted but acceptable
**HOLD:** Requires manager review before decision
**FAIL_REWORK:** Issue can be fixed, return to manufacturer
**FAIL_REJECT:** Unsalvageable, manufacturer credit required

### QC Inspection UI

**Start Inspection:**
- Select inbound shipment
- System shows expected contents
- Inspector verifies each line item

**Inspection Checklist:**
- Per item type checklist:
  - Quantity matches? (count and confirm)
  - Visual quality? (pass/fail)
  - Decoration quality? (pass/fail)
  - Sizing correct? (sample check)
  - Packaging acceptable? (pass/fail)
- Photo upload for each check
- Notes field for issues
- Overall pass/fail per item type

**Inspection Photos:**
- Mobile-friendly photo capture
- Automatic timestamp and inspector ID
- Categorize: overview, defect, comparison
- Required for any failed items

**Bulk Actions:**
- "Pass all" for straightforward shipments
- "Fail all" for clearly defective shipments
- Individual line item handling for mixed results

### QC Reports

**Daily QC Summary:**
- Shipments inspected today
- Pass rate percentage
- Issues found by type
- Average inspection time

**Manufacturer Quality Metrics:**
- Pass rate by manufacturer
- Common issues by manufacturer
- Trend over time
- Quality score calculation

---

## 7.5 Inventory Management

### Inventory Data Model

Each inventory record tracks:
- Fulfillment center location
- Product/variant identification
- Quantity on hand
- Quantity reserved (allocated to orders)
- Quantity available (on hand minus reserved)
- Bin/shelf location within warehouse
- Last counted date
- Cost per unit (for accounting)

### Inventory Operations

**Stock In (from QC):**
- Add passed items to inventory
- Create inventory records or increment existing
- Record the inbound shipment as source
- Log the transaction

**Reserve (for order):**
- When customer order placed, reserve inventory
- Decrements available count
- Links reservation to order
- Prevents overselling

**Pick (for fulfillment):**
- Convert reservation to pick list
- Decrements on-hand count
- Creates outbound shipment record

**Adjustment:**
- Manual count corrections
- Damage/loss recording
- Requires reason code and approval

### Inventory UI

**Inventory Overview:**
- Total items in stock across all fulfillment centers
- Breakdown by product family
- Low stock alerts
- Overstock alerts

**Inventory List:**
- Filter by: fulfillment center, product family, product, low stock
- Columns: product, variant, on hand, reserved, available, location
- Sort by any column
- Export to CSV/Excel

**Product Inventory Detail:**
- All locations where product is stocked
- Movement history (in/out transactions)
- Reorder point configuration
- Reorder quantity suggestion

**Stock Adjustment:**
- Select product and location
- Enter new quantity or adjustment (+/-)
- Select reason code (count correction, damage, sample, etc.)
- Requires approval for adjustments over threshold

### Inventory Alerts

**Low Stock Alert:**
- When available falls below reorder point
- Notification to admin
- Suggestion to create manufacturing order

**Overstock Alert:**
- When quantity exceeds max threshold
- May indicate slow-moving product

**Aging Alert:**
- Items in stock over X days without movement
- Potential dead stock identification

---

## 7.6 Outbound Shipment Management

### Outbound Shipment Lifecycle

```
PENDING → PICKING → PACKED → SHIPPED → DELIVERED
```

**PENDING:** Order placed, awaiting pick list creation
**PICKING:** Pick list generated, warehouse pulling items
**PACKED:** Items packed, awaiting carrier pickup
**SHIPPED:** Carrier has package, tracking active
**DELIVERED:** Customer received package

### Outbound Shipment Creation

When order is ready to ship:
1. System checks inventory availability
2. Creates outbound_shipment record
3. Reserves inventory for order
4. Generates pick list
5. Assigns to fulfillment center

### Outbound Shipment UI

**Orders Ready to Ship:**
- List of orders with all items in stock
- Priority sorting (expedited first, then by order date)
- Batch processing capability
- One-click "create shipment" for simple orders

**Pick List:**
- Grouped by warehouse location for efficient picking
- Shows: location, product, variant, quantity
- Checkbox to mark items picked
- Barcode scanning support (future)

**Packing Station:**
- Verify items against order
- Select box size
- Print packing slip
- Print shipping label
- Mark as packed

**Shipping Queue:**
- Packed orders awaiting pickup
- Carrier manifest generation
- End-of-day carrier scan

**Shipment Tracking:**
- All outbound shipments with status
- Carrier tracking integration
- Delivery confirmation
- Exception handling (failed delivery, return)

### Multi-Package Orders

Some orders require multiple packages:
- Heavy items split across boxes
- Different shipping speeds for different items
- Each package gets separate tracking
- Order shows "shipped" when all packages sent

---

## 7.7 3PL Integration Points

### With Manufacturing System

**Manufacturer → 3PL:**
- When job status = SHIPPED, create expected inbound
- Pull tracking number and carrier from job
- Link inbound shipment to manufacturing job(s)

**3PL → Manufacturing:**
- QC failures create feedback to manufacturer
- Quality metrics inform manufacturer rating
- Issues can trigger job rework or credit

### With Order System

**Order → 3PL:**
- Completed manufacturing jobs check inventory or create inbound expectation
- Direct fulfillment (skip 3PL) for some manufacturers
- Inventory reservation on order placement

**3PL → Order:**
- Order status updates when shipped
- Tracking information flows to customer
- Delivery confirmation closes order

### With Catalog System

**Catalog → 3PL:**
- Product information for inventory
- Variant details for proper identification
- Family/category for inventory organization

### Carrier Integrations

Future integration points:
- FedEx, UPS, USPS, DHL APIs
- Automatic rate shopping
- Label generation
- Tracking number retrieval
- Delivery confirmation webhooks

---

## 7.8 3PL API Requirements

### Fulfillment Center Endpoints

**GET /api/admin/fulfillment-centers**
- List all fulfillment centers

**POST /api/admin/fulfillment-centers**
- Create new fulfillment center

**GET /api/admin/fulfillment-centers/:id**
- Get fulfillment center details with stats

**PUT /api/admin/fulfillment-centers/:id**
- Update fulfillment center

### Inbound Shipment Endpoints

**GET /api/admin/inbound-shipments**
- List inbound shipments with filters

**POST /api/admin/inbound-shipments**
- Create manual inbound shipment (usually auto-created)

**GET /api/admin/inbound-shipments/:id**
- Get shipment details with contents

**PUT /api/admin/inbound-shipments/:id/status**
- Update shipment status (arrived, etc.)

**POST /api/admin/inbound-shipments/:id/inspection**
- Submit QC inspection results

### Inventory Endpoints

**GET /api/admin/inventory**
- List inventory with filters

**GET /api/admin/inventory/product/:productId**
- Get inventory for specific product across all locations

**POST /api/admin/inventory/adjustment**
- Submit inventory adjustment

**GET /api/admin/inventory/alerts**
- Get current inventory alerts (low stock, etc.)

### Outbound Shipment Endpoints

**GET /api/admin/outbound-shipments**
- List outbound shipments

**POST /api/admin/outbound-shipments**
- Create outbound shipment for order

**GET /api/admin/outbound-shipments/:id**
- Get shipment details

**PUT /api/admin/outbound-shipments/:id/status**
- Update shipment status

**GET /api/admin/outbound-shipments/:id/pick-list**
- Get pick list for shipment

**POST /api/admin/outbound-shipments/:id/ship**
- Mark as shipped, provide tracking

---

## 7.9 3PL Database Requirements

### New Tables

**fulfillment_centers:**
- id, code, name
- address fields (street, city, state, zip, country)
- contact fields (phone, email, contact_name)
- is_default, is_active
- capabilities (JSON or flags)
- created_at, updated_at

**inbound_shipments:**
- id, tracking_number, carrier
- manufacturer_id (FK)
- fulfillment_center_id (FK)
- status (enum)
- expected_arrival_date
- actual_arrival_date
- notes
- created_at, updated_at

**inbound_shipment_items:**
- id, inbound_shipment_id (FK)
- manufacturing_job_id (FK)
- product_id, variant_id
- expected_quantity
- received_quantity
- qc_status (enum)
- qc_notes
- qc_photos (JSON array or separate table)
- inspected_at, inspected_by_user_id

**inventory:**
- id, fulfillment_center_id (FK)
- product_id (FK), variant_id (FK)
- quantity_on_hand
- quantity_reserved
- bin_location
- cost_per_unit
- last_counted_at
- created_at, updated_at
- UNIQUE(fulfillment_center_id, variant_id)

**inventory_transactions:**
- id, inventory_id (FK)
- transaction_type (enum: stock_in, reserve, unreserve, pick, adjustment)
- quantity_change (+/-)
- reference_type (inbound_shipment, order, adjustment)
- reference_id
- reason_code
- performed_by_user_id
- created_at

**outbound_shipments:**
- id, order_id (FK)
- fulfillment_center_id (FK)
- status (enum)
- tracking_number, carrier
- weight, dimensions
- shipping_cost
- shipped_at, delivered_at
- created_at, updated_at

**outbound_shipment_items:**
- id, outbound_shipment_id (FK)
- order_item_id (FK)
- inventory_id (FK)
- quantity
- picked_at, picked_by_user_id

---

## 7.10 3PL Testing Requirements

### Inbound Flow Tests

1. Manufacturing job marked shipped creates inbound shipment
2. Inbound shipment shows in awaiting arrival list
3. Mark arrived updates status correctly
4. QC inspection can be started and completed
5. Passed items add to inventory correctly
6. Failed items create issue and don't add to inventory
7. Partial pass handles mixed results correctly

### Inventory Tests

1. Stock in increases quantity correctly
2. Reserve decreases available but not on_hand
3. Pick decreases both on_hand and reserved
4. Adjustment with approval workflow works
5. Low stock alerts trigger at correct threshold
6. Inventory transaction log is accurate

### Outbound Flow Tests

1. Order creates outbound shipment when inventory available
2. Pick list shows correct items and locations
3. Pack and ship flow completes correctly
4. Tracking number flows to order
5. Delivery confirmation updates order status
6. Multi-package orders handled correctly


---

# 8. PHASE 5: MANUFACTURER ONBOARDING

## 8.1 Overview

The manufacturer onboarding system provides a streamlined process for adding new manufacturers to the network. It handles the entire journey from initial invite through capability configuration, document collection, and final activation.

### Current Pain Points

1. **Manual setup** - Admin must manually create accounts, configure capabilities
2. **No document collection** - Business licenses, tax forms collected ad-hoc
3. **Unclear capabilities** - Manufacturer capabilities not systematically captured
4. **No approval workflow** - No formal review process before activation
5. **Missing training** - New manufacturers don't know how to use the system

### Goals

1. **Self-service application** - Manufacturers can apply through public form
2. **Invite flow** - Admin can invite specific manufacturers
3. **Document collection** - Required documents uploaded and stored
4. **Capability capture** - Systematic recording of what manufacturer can produce
5. **Approval workflow** - Multi-step review before activation
6. **Guided setup** - Tutorial/checklist for new manufacturers

---

## 8.2 Onboarding Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MANUFACTURER ONBOARDING FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ENTRY POINTS:                                                              │
│  ┌────────────────┐    ┌────────────────┐                                  │
│  │ Admin Invites  │    │ Manufacturer   │                                  │
│  │ Manufacturer   │    │ Self-Applies   │                                  │
│  └───────┬────────┘    └───────┬────────┘                                  │
│          │                     │                                            │
│          └──────────┬──────────┘                                           │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: BASIC INFORMATION                                           │   │
│  │ • Company name, contact info                                        │   │
│  │ • Location (country, address)                                       │   │
│  │ • Years in business                                                 │   │
│  │ • Company size (employees)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     │                                                       │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: CAPABILITIES                                                │   │
│  │ • Product types they can produce                                    │   │
│  │ • Decoration methods (sublimation, embroidery, etc.)                │   │
│  │ • Monthly capacity                                                  │   │
│  │ • Lead times by product type                                        │   │
│  │ • Equipment list (optional)                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     │                                                       │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: DOCUMENTATION                                               │   │
│  │ • Business registration/license                                     │   │
│  │ • Tax identification documents                                      │   │
│  │ • Quality certifications (if any)                                   │   │
│  │ • Sample products/portfolio                                         │   │
│  │ • Bank information (for payments)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     │                                                       │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: PRICING & TERMS                                             │   │
│  │ • Cost per product type                                             │   │
│  │ • Minimum order quantities                                          │   │
│  │ • Payment terms requested                                           │   │
│  │ • Shipping preferences                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     │                                                       │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: ADMIN REVIEW                                                │   │
│  │ • Admin reviews application                                         │   │
│  │ • Request additional info if needed                                 │   │
│  │ • Negotiate terms if needed                                         │   │
│  │ • Approve or reject                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     │                                                       │
│          ┌─────────┴─────────┐                                             │
│          ▼                   ▼                                              │
│  ┌───────────────┐   ┌───────────────┐                                     │
│  │   APPROVED    │   │   REJECTED    │                                     │
│  └───────────────┘   └───────────────┘                                     │
│          │                   │                                              │
│          ▼                   ▼                                              │
│  ┌───────────────┐   ┌───────────────┐                                     │
│  │ Create Mfr    │   │ Send Rejection│                                     │
│  │ Account &     │   │ Email with    │                                     │
│  │ User Login    │   │ Reason        │                                     │
│  └───────────────┘   └───────────────┘                                     │
│          │                                                                  │
│          ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 6: ACTIVATION & TRAINING                                       │   │
│  │ • Send welcome email with login                                     │   │
│  │ • Assign to product families                                        │   │
│  │ • Show guided tutorial on first login                               │   │
│  │ • Sample test order (optional)                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Application Statuses

| Status | Description | Next Actions |
|--------|-------------|--------------|
| DRAFT | Started but not submitted | Complete and submit |
| SUBMITTED | Awaiting admin review | Admin reviews |
| INFO_REQUESTED | Admin needs more information | Manufacturer provides info |
| UNDER_REVIEW | Admin actively reviewing | Admin decides |
| APPROVED | Application accepted | Create account |
| REJECTED | Application declined | None (can reapply) |
| ACTIVATED | Account created and active | Begin receiving jobs |

---

## 8.3 Admin Invite Flow

### Inviting a Manufacturer

Admin can proactively invite manufacturers they want to work with:

1. **Create Invite:**
   - Enter manufacturer company name
   - Enter primary contact email
   - Select expected product families
   - Add personal note to invite
   - Set invite expiration (default 30 days)

2. **Send Invite Email:**
   - Personalized email with admin note
   - Unique invite link
   - Explanation of partnership benefits
   - Clear call-to-action to apply

3. **Track Invite:**
   - See invite status (sent, opened, started, completed)
   - Resend invite if needed
   - Revoke invite if circumstances change

### Invite Management UI

**Pending Invites List:**
- All outstanding invites
- Status: sent, viewed, in progress
- Days until expiration
- Quick actions: resend, revoke, view application

**Invite Form:**
- Company name (required)
- Contact email (required)
- Contact name (optional)
- Product families (multi-select)
- Personal message (textarea)
- Expiration date (default +30 days)

---

## 8.4 Self-Application Flow

### Public Application Page

Manufacturers can discover and apply through:
- Public "Become a Supplier" page on website
- Direct link shared by admin
- Referral from existing manufacturer

### Application Form - Step by Step

**Step 1: Basic Information**
- Company legal name
- DBA name (if different)
- Country
- Full address
- Phone number
- Primary contact name
- Primary contact email
- Years in business
- Number of employees
- Website URL (optional)
- How did you hear about us?

**Step 2: Manufacturing Capabilities**
- Product types (multi-select from predefined list):
  - T-shirts
  - Hoodies/Sweatshirts
  - Athletic wear
  - Jerseys
  - Sublimation products
  - Cut & sew custom
  - Accessories (bags, etc.)
  
- Decoration methods (multi-select):
  - Sublimation
  - Screen printing
  - Embroidery
  - DTG (Direct to Garment)
  - Heat transfer
  - Cut & sew
  
- Monthly production capacity (units)
- Typical lead time (days)
- Minimum order quantity
- Equipment/machinery list (optional textarea)

**Step 3: Documentation Upload**
Required documents (varies by country):
- Business registration certificate
- Tax identification (EIN, VAT, etc.)
- W-9 or W-8BEN (for US payments)
- Quality certifications (ISO, etc.) - optional
- Product portfolio/samples (images)
- Bank account information for payments

Document requirements:
- PDF, JPG, PNG formats
- Max 10MB per file
- Clearly labeled
- Must be readable

**Step 4: Pricing & Terms**
- Price list by product type (can upload spreadsheet)
- Or fill in form:
  - T-shirts: $ per unit
  - Hoodies: $ per unit
  - Etc.
- Requested payment terms (NET30, NET60, prepaid)
- Preferred shipping method to US
- Estimated shipping cost per kg/shipment
- Willingness to negotiate terms

**Step 5: Review & Submit**
- Summary of all entered information
- Preview uploaded documents
- Certify information is accurate
- Accept terms and conditions
- Submit application

---

## 8.5 Admin Review Process

### Review Dashboard

**Application Queue:**
- List of pending applications
- Filter by: status, product type, country
- Sort by: submitted date, country, company name
- Priority indicator for invited vs self-applied

**Application Detail View:**
- All submitted information organized by section
- Document viewer (preview without downloading)
- Status history timeline
- Admin notes (internal, not shown to applicant)
- Action buttons based on current status

### Review Actions

**Request More Information:**
- Select which fields need clarification
- Add custom message
- Application status → INFO_REQUESTED
- Email sent to applicant with specific requests

**Add Internal Note:**
- Text note visible only to admins
- Useful for tracking review discussions
- Timestamped with admin name

**Approve Application:**
- Confirm all requirements met
- Set initial payment terms
- Select product families to assign
- Set initial credit limit
- Confirm and activate

**Reject Application:**
- Select rejection reason (from list)
- Add custom message (optional)
- Send rejection email
- Application archived

### Approval Checklist

Before approving, admin should verify:
- [ ] Company information looks legitimate
- [ ] All required documents uploaded
- [ ] Documents are readable and valid
- [ ] Capabilities match our needs
- [ ] Pricing is competitive
- [ ] Payment terms acceptable
- [ ] No red flags in application

---

## 8.6 Post-Approval Activation

### Account Creation

When application approved:
1. Create manufacturer record
2. Create user account for primary contact
3. Generate secure temporary password
4. Send welcome email with:
   - Login credentials
   - Getting started guide
   - Support contact information
   - Link to first login

### First Login Experience

New manufacturer's first login should:
1. Force password change
2. Show welcome modal with video tutorial (optional)
3. Display setup checklist:
   - [ ] Update profile picture/logo
   - [ ] Verify contact information
   - [ ] Review assigned product families
   - [ ] Confirm notification preferences
   - [ ] Complete training quiz (optional)
4. Show sample dashboard with explanations
5. Option to take guided tour

### Product Family Assignment

After activation, admin should:
1. Assign manufacturer to appropriate product families
2. Set priority level (primary, backup)
3. Configure specific capabilities per family
4. Set MOQ and lead times per family
5. Confirm pricing per family

---

## 8.7 Onboarding API Requirements

### Public Endpoints (No Auth)

**GET /api/public/onboarding/check-invite/:code**
- Validate invite code
- Return invite details if valid

**POST /api/public/onboarding/applications**
- Create new application (from invite or self-apply)
- Save draft automatically

**PUT /api/public/onboarding/applications/:id**
- Update draft application
- Validate by step

**POST /api/public/onboarding/applications/:id/submit**
- Submit completed application
- Trigger admin notification

**POST /api/public/onboarding/applications/:id/documents**
- Upload document
- Return document ID

### Admin Endpoints

**GET /api/admin/onboarding/applications**
- List all applications with filters

**GET /api/admin/onboarding/applications/:id**
- Full application details

**PUT /api/admin/onboarding/applications/:id/status**
- Change application status
- Body: { status, reason?, message? }

**POST /api/admin/onboarding/applications/:id/notes**
- Add internal note

**POST /api/admin/onboarding/applications/:id/approve**
- Approve and create manufacturer account
- Body: { creditLimit, paymentTerms, productFamilies[] }

**POST /api/admin/onboarding/applications/:id/reject**
- Reject application
- Body: { reason, message? }

**POST /api/admin/onboarding/invites**
- Create and send invite
- Body: { email, companyName, productFamilies[], message }

**GET /api/admin/onboarding/invites**
- List all invites

**DELETE /api/admin/onboarding/invites/:id**
- Revoke invite

---

## 8.8 Onboarding Database Requirements

### New Tables

**manufacturer_applications:**
- id, invite_id (FK, nullable)
- status (enum)
- company_name, dba_name
- country, address fields
- contact_name, contact_email, contact_phone
- website_url
- years_in_business, employee_count
- monthly_capacity, typical_lead_time, minimum_order_qty
- product_types (JSON array)
- decoration_methods (JSON array)
- equipment_list (text)
- pricing_data (JSON)
- requested_payment_terms
- shipping_method, shipping_cost_estimate
- terms_accepted_at
- submitted_at
- created_at, updated_at

**manufacturer_application_documents:**
- id, application_id (FK)
- document_type (enum: business_license, tax_id, w9, certification, portfolio, bank_info, other)
- file_name, file_url, file_size
- uploaded_at
- verified_at, verified_by_user_id

**manufacturer_application_notes:**
- id, application_id (FK)
- content
- author_user_id (FK)
- created_at

**manufacturer_invites:**
- id, code (unique)
- email, company_name, contact_name
- product_families (JSON array)
- personal_message
- sent_at, viewed_at
- expires_at
- revoked_at
- application_id (FK, nullable - set when application created)
- created_by_user_id (FK)

---

## 8.9 Onboarding Email Templates

### Invite Email

**Subject:** You're invited to join [Company] as a manufacturing partner

**Content:**
- Personal message from admin
- Brief overview of partnership benefits
- Clear CTA button to start application
- Expiration notice
- Support contact

### Application Received

**Subject:** We received your manufacturer application

**Content:**
- Confirmation of receipt
- What to expect next
- Typical review timeline
- Contact for questions

### Information Requested

**Subject:** Additional information needed for your application

**Content:**
- Specific items needed
- How to update application
- Deadline for response
- Contact for help

### Application Approved

**Subject:** Welcome to the [Company] manufacturing network!

**Content:**
- Congratulations message
- Login credentials
- Getting started steps
- Training resources
- Support contacts

### Application Rejected

**Subject:** Update on your manufacturer application

**Content:**
- Professional rejection message
- Reason (if provided)
- Invitation to reapply in future (if appropriate)
- General feedback (if any)

---

## 8.10 Onboarding Testing Requirements

### Invite Flow Tests

1. Admin can create invite with all fields
2. Invite email sends successfully
3. Invite link works and shows correct information
4. Expired invite shows appropriate message
5. Revoked invite cannot be used
6. Application created from invite links correctly

### Application Flow Tests

1. Self-application can be started without invite
2. Form validation works on each step
3. Draft saves automatically
4. Can navigate between steps without losing data
5. Documents upload successfully
6. Submit validates all required fields
7. Submission triggers admin notification

### Review Flow Tests

1. Admin can view all applications
2. Filtering and sorting works correctly
3. Document preview works
4. Request info changes status and sends email
5. Internal notes save correctly
6. Approve creates manufacturer and user accounts
7. Reject sends email and archives application

### Activation Tests

1. New manufacturer can log in with temporary password
2. Password change required on first login
3. Welcome experience shows correctly
4. Product family assignment works
5. Manufacturer appears in system and can receive jobs


---

# 9. PHASE 6: PAYMENT TERMS & FINANCIAL CONTROLS

## 9.1 Overview

The payment system manages financial relationships with manufacturers, including credit limits, payment terms, invoice tracking, and payment processing. This addresses the business problem of manufacturers no longer offering open accounts and needing tighter financial controls.

### Current Problems

1. **No credit tracking** - No visibility into how much is owed to each manufacturer
2. **No payment terms management** - NET30/NET60 terms not systematically tracked
3. **No aging reports** - Can't see what payments are coming due
4. **Manual payment tracking** - Payments recorded ad-hoc or not at all
5. **No cost visibility** - Hard to see true manufacturing costs per order

### Goals

1. **Credit limit management** - Set and enforce limits per manufacturer
2. **Payment terms tracking** - Support NET30, NET60, prepaid terms
3. **Invoice management** - Track invoices from manufacturers
4. **Payment recording** - Log all payments made
5. **Aging reports** - See what's due now, 30 days, 60 days, 90+ days
6. **Cost tracking** - Manufacturing cost per order/product

---

## 9.2 Manufacturer Financial Profile

### Financial Data per Manufacturer

Each manufacturer has financial settings:

**Credit Settings:**
- Credit limit (max outstanding balance)
- Current balance (amount owed)
- Available credit (limit minus balance)
- Credit hold flag (stop new orders if over limit)

**Payment Terms:**
- Default terms (NET30, NET60, COD, prepaid)
- Grace period days (extra days after due date before penalty)
- Early payment discount (% if paid within X days)

**Banking Information:**
- Bank name
- Account number (encrypted)
- Routing/SWIFT code
- Preferred payment method (wire, ACH, PayPal, etc.)

**Status:**
- Payment standing (good, warning, delinquent)
- Last payment date
- Average days to pay

### Financial Status Calculation

```
Status = GOOD:      All invoices paid on time or within grace period
Status = WARNING:   Has invoices 1-30 days past due
Status = DELINQUENT: Has invoices 30+ days past due

If DELINQUENT and balance > 0:
  - Flag account
  - Block new job assignments
  - Alert admin
```

---

## 9.3 Invoice Management

### Invoice Lifecycle

```
DRAFT → SUBMITTED → APPROVED → PARTIALLY_PAID → PAID
                        │
                        └─→ DISPUTED
```

**DRAFT:** Invoice created but not yet submitted by manufacturer
**SUBMITTED:** Manufacturer submitted invoice for review
**APPROVED:** Admin approved invoice, added to payables
**PARTIALLY_PAID:** Some payment made, balance remaining
**PAID:** Invoice fully paid
**DISPUTED:** Issue with invoice, under review

### Invoice Creation

Invoices can be created:
1. **Auto-generated:** When manufacturing job marked shipped
2. **Manually by manufacturer:** For additional charges, corrections
3. **Manually by admin:** For credits, adjustments

### Invoice Data Model

Each invoice contains:
- Invoice number (unique per manufacturer)
- Manufacturer ID
- Invoice date
- Due date (calculated from payment terms)
- Line items (jobs, additional charges)
- Subtotal, tax, total
- Currency
- Status
- Notes
- Attachments (PDF copy from manufacturer)

### Invoice Line Items

Each line item:
- Description (job number, product, quantity)
- Manufacturing job ID (if applicable)
- Quantity
- Unit cost
- Line total
- Category (manufacturing, shipping, rush fee, etc.)

---

## 9.4 Payment Processing

### Payment Recording

When payment made to manufacturer:
1. Select manufacturer
2. Enter payment amount
3. Select payment method (wire, ACH, check, PayPal)
4. Enter reference number (check #, wire confirmation)
5. Select invoices being paid (auto-apply or manual allocation)
6. Add notes if needed
7. Confirm and record

### Payment Allocation

When payment received:
- Option 1: Auto-apply to oldest invoices first
- Option 2: Manually select which invoices to pay
- Partial payments allowed
- Overpayments create credit balance

### Payment Methods

Supported payment methods:
- Wire transfer (international)
- ACH (domestic US)
- Check
- PayPal
- Credit on account

### Payment Scheduling

Future feature for scheduling payments:
- Schedule payment for future date
- Batch payments on specific days (e.g., pay all NET30 due on Fridays)
- Preview upcoming payments
- Approval workflow for large payments

---

## 9.5 Aging Reports

### Aging Buckets

Standard aging buckets:
- Current (not yet due)
- 1-30 days past due
- 31-60 days past due
- 61-90 days past due
- 90+ days past due

### Aging Report Views

**Summary View:**
- One row per manufacturer
- Columns: manufacturer name, current, 1-30, 31-60, 61-90, 90+, total
- Sort by total owed or days past due
- Filter by manufacturer, date range

**Detail View:**
- All invoices for selected manufacturer
- Show: invoice #, date, due date, days past due, amount
- Highlight overdue invoices
- Actions: view invoice, record payment

**Trend View:**
- Historical aging over time
- Chart showing how aging has changed
- Identify improving or worsening trends

### Aging Alerts

**Automatic Alerts:**
- Invoice becoming due in 7 days (reminder to pay)
- Invoice 1 day past due (first notice)
- Invoice 14 days past due (warning)
- Invoice 30 days past due (credit hold warning)
- Invoice 60+ days past due (escalation)

**Alert Recipients:**
- Admin users with finance permissions
- Email notifications
- Dashboard alerts

---

## 9.6 Cost Tracking

### Manufacturing Cost Capture

For each manufacturing job, track:
- Quoted cost (from manufacturer)
- Actual cost (from invoice)
- Cost variance (actual - quoted)
- Cost per unit (total / quantity)

### Cost Rollup

At order level:
- Total manufacturing cost (sum of all jobs)
- Shipping cost to 3PL
- 3PL fees
- Shipping cost to customer
- Total cost of goods sold

At product level:
- Average manufacturing cost
- Cost trend over time
- Cost comparison by manufacturer

### Margin Analysis

Calculate and display:
- Gross margin per order (revenue - COGS)
- Margin percentage
- Margin trend over time
- Low margin alert (below threshold)

### Cost Reports

**Cost by Manufacturer:**
- Total spent with each manufacturer
- Average cost per unit by product type
- Cost trend over time

**Cost by Product Family:**
- Manufacturing cost per family
- Compare to target cost range
- Identify over/under cost families

**Cost Variance Report:**
- Quoted vs actual by manufacturer
- Identify manufacturers who consistently under/over quote

---

## 9.7 Financial Dashboard

### Admin Finance Dashboard

**Key Metrics:**
- Total payables (all outstanding invoices)
- Due this week
- Overdue amount
- Payments made this month
- Credit utilization across manufacturers

**Charts:**
- Aging distribution (pie or bar)
- Payables trend over time
- Top 5 manufacturers by balance
- Payment history timeline

**Action Items:**
- Invoices needing approval
- Invoices due this week
- Manufacturers on credit hold
- Disputed invoices

### Manufacturer Payment View

Manufacturers see (limited view):
- Their current balance
- Recent invoices and status
- Payment history
- Expected payment dates (based on terms)

---

## 9.8 Financial API Requirements

### Invoice Endpoints

**GET /api/admin/invoices**
- List invoices with filters (manufacturer, status, date range)
- Include aging information

**POST /api/admin/invoices**
- Create manual invoice

**GET /api/admin/invoices/:id**
- Invoice detail with line items

**PUT /api/admin/invoices/:id**
- Update invoice (status, notes)

**PUT /api/admin/invoices/:id/approve**
- Approve submitted invoice

**PUT /api/admin/invoices/:id/dispute**
- Mark invoice as disputed with reason

### Payment Endpoints

**GET /api/admin/payments**
- List all payments

**POST /api/admin/payments**
- Record new payment

**GET /api/admin/payments/:id**
- Payment detail with allocations

**DELETE /api/admin/payments/:id**
- Void payment (with reason)

### Reporting Endpoints

**GET /api/admin/reports/aging**
- Aging report summary

**GET /api/admin/reports/aging/:manufacturerId**
- Detailed aging for manufacturer

**GET /api/admin/reports/costs**
- Cost analysis report

**GET /api/admin/reports/margins**
- Margin analysis report

### Manufacturer Financial Endpoints

**GET /api/admin/manufacturers/:id/financial**
- Financial profile for manufacturer

**PUT /api/admin/manufacturers/:id/financial**
- Update financial settings (credit limit, terms)

**GET /api/admin/manufacturers/:id/balance**
- Current balance and credit status

**GET /api/manufacturer/my-invoices**
- Manufacturer views their invoices

**GET /api/manufacturer/my-payments**
- Manufacturer views payment history

---

## 9.9 Financial Database Requirements

### New Tables

**manufacturer_invoices:**
- id, invoice_number, manufacturer_id (FK)
- invoice_date, due_date
- subtotal, tax_amount, total_amount
- currency (default USD)
- status (enum)
- notes, attachment_url
- submitted_at, approved_at, paid_at
- approved_by_user_id
- created_at, updated_at

**manufacturer_invoice_items:**
- id, invoice_id (FK)
- manufacturing_job_id (FK, nullable)
- description
- quantity, unit_cost, line_total
- category (enum: manufacturing, shipping, rush, adjustment, other)

**manufacturer_payments:**
- id, manufacturer_id (FK)
- payment_date, amount
- payment_method (enum)
- reference_number
- notes
- created_by_user_id
- created_at

**manufacturer_payment_allocations:**
- id, payment_id (FK), invoice_id (FK)
- amount_applied
- created_at

### Manufacturer Table Additions

Add to manufacturers table:
- credit_limit NUMERIC(12,2)
- current_balance NUMERIC(12,2) (can be computed or cached)
- payment_terms VARCHAR(20)
- payment_grace_days INTEGER
- early_payment_discount NUMERIC(5,2)
- payment_standing (enum: good, warning, delinquent)
- bank_name, bank_account_encrypted, bank_routing
- preferred_payment_method

### Manufacturing Job Table Additions

Add to manufacturing jobs:
- quoted_cost NUMERIC(10,2)
- actual_cost NUMERIC(10,2)
- invoice_id (FK, nullable)

---

## 9.10 Financial Business Rules

### Credit Limit Enforcement

```
BEFORE creating manufacturing job:
  IF manufacturer.current_balance + job.estimated_cost > manufacturer.credit_limit:
    IF manufacturer.credit_hold_enabled:
      REJECT job assignment
      ALERT admin
    ELSE:
      WARN admin but allow assignment
```

### Auto-Invoice Generation

```
WHEN job status changes to SHIPPED:
  IF auto_invoice_enabled for manufacturer:
    CREATE invoice with:
      - Line item for job (quantity × cost_per_unit)
      - Due date = today + payment_terms_days
      - Status = SUBMITTED
    NOTIFY admin of new invoice
```

### Payment Term Calculation

```
due_date = invoice_date + payment_terms_days

early_payment_deadline = invoice_date + early_payment_days

IF paid_date <= early_payment_deadline:
  amount_due = total * (1 - early_payment_discount/100)
ELSE:
  amount_due = total
```

### Balance Recalculation

```
manufacturer.current_balance = 
  SUM(invoices.total WHERE status IN ('APPROVED', 'PARTIALLY_PAID'))
  - SUM(payment_allocations.amount WHERE invoice.manufacturer_id = manufacturer.id)
```

---

## 9.11 Financial Testing Requirements

### Invoice Tests

1. Invoice auto-created when job shipped
2. Invoice due date calculated correctly from terms
3. Invoice approval workflow works
4. Invoice line items sum correctly
5. Partial payment updates invoice status
6. Full payment marks invoice as paid
7. Disputed invoice workflow works

### Payment Tests

1. Payment can be recorded with all methods
2. Auto-allocation applies to oldest invoices first
3. Manual allocation allows selecting invoices
4. Overpayment creates credit
5. Payment void reverses allocations
6. Payment history shows correctly

### Credit Tests

1. Credit limit blocks job when exceeded (if enabled)
2. Credit warning shows when approaching limit
3. Balance updates correctly with invoices and payments
4. Credit hold triggers when 60+ days past due
5. Credit status recalculates on payment

### Report Tests

1. Aging report calculates buckets correctly
2. Aging detail shows correct invoices
3. Cost report aggregates correctly
4. Margin calculation is accurate
5. Report filters work correctly


---

# 10. COMPONENT SPECIFICATIONS

## 10.1 Shared UI Components

This section describes reusable components that should be created or extended for use across the system.

### Status Badge Component

**Purpose:** Display status with consistent color coding across the application.

**Requirements:**
- Accept status code and entity type (job, invoice, shipment, etc.)
- Render appropriate color, icon, and label
- Support different sizes (sm, md, lg)
- Hover state shows full status description
- Accessible (proper contrast, screen reader text)

**Usage examples:**
- Manufacturing job status on cards and lists
- Invoice status in payment screens
- Shipment status in 3PL views
- Application status in onboarding

### Data Table Component

**Purpose:** Display tabular data with sorting, filtering, pagination.

**Requirements:**
- Column definitions (key, label, sortable, filterable, render function)
- Server-side pagination support
- Column visibility toggle
- Row selection (single and multi)
- Row actions menu
- Export to CSV
- Responsive: horizontal scroll on mobile, or card view option
- Loading skeleton state
- Empty state with customizable message

### Filter Bar Component

**Purpose:** Provide consistent filtering UI across list views.

**Requirements:**
- Support multiple filter types: select, multi-select, date range, search
- Filter state synced to URL (for bookmarking/sharing)
- Clear all filters button
- Filter count indicator
- Collapsible on mobile
- Save filter presets (future)

### Stat Card Component

**Purpose:** Display key metrics on dashboards.

**Requirements:**
- Title, value, subtitle
- Optional icon
- Optional trend indicator (up/down with percentage)
- Optional sparkline chart
- Clickable to drill down
- Loading skeleton state

### Timeline Component

**Purpose:** Display chronological history of events.

**Requirements:**
- Vertical timeline layout
- Each event: timestamp, title, description, optional icon
- Support different event types (status change, note, payment, etc.)
- Collapsible for long histories
- Load more pagination

### Photo Gallery Component

**Purpose:** Display and upload images with lightbox.

**Requirements:**
- Grid layout of thumbnails
- Click to open lightbox
- Lightbox: full image, caption, navigation, zoom
- Upload button with drag-drop support
- Camera capture on mobile
- Progress indicator during upload
- Delete option (with confirmation)

### File Upload Component

**Purpose:** Handle document and image uploads.

**Requirements:**
- Drag-drop zone
- Click to browse
- File type restrictions configurable
- Max file size validation
- Progress bar during upload
- Preview (image) or icon (document)
- Multiple file support where needed
- Accessibility: keyboard navigation, screen reader

### Confirmation Dialog Component

**Purpose:** Confirm destructive or important actions.

**Requirements:**
- Title and message
- Configurable button labels
- Destructive variant (red confirm button)
- Optional "don't show again" checkbox
- Keyboard accessible (escape to cancel, enter to confirm)

### Toast Notification Component

**Purpose:** Show temporary feedback messages.

**Requirements:**
- Success, warning, error, info variants
- Auto-dismiss with configurable duration
- Manual dismiss option
- Stack multiple toasts
- Action button support (e.g., "Undo")
- Accessible announcements

---

## 10.2 Page Layout Components

### Sidebar Navigation

**Requirements:**
- Collapsible on desktop
- Off-canvas drawer on mobile
- Active state indicator
- Nested navigation support
- Badge indicators for counts (new items, alerts)
- User menu at bottom
- Role-based menu filtering

### Page Header

**Requirements:**
- Breadcrumb navigation
- Page title
- Optional subtitle
- Action buttons area (right side)
- Optional tabs below header

### Dashboard Layout

**Requirements:**
- Grid of stat cards (responsive: 1 col mobile, 2 tablet, 4 desktop)
- Main content area below
- Optional sidebar for quick actions

### Split View Layout

**Requirements:**
- Master list on left
- Detail panel on right
- Responsive: stacked on mobile
- Adjustable split ratio
- Collapse/expand detail panel

---

## 10.3 Form Components

### Form Field Wrapper

**Requirements:**
- Label (with required indicator)
- Input element (passed as child)
- Helper text
- Error message
- Disabled state styling

### Select with Search

**Requirements:**
- Searchable dropdown
- Single or multi-select modes
- Option groups
- Custom option rendering
- Async option loading
- Clear selection button
- Keyboard navigation

### Date Picker

**Requirements:**
- Single date or date range
- Calendar popup
- Quick selections (today, yesterday, this week, etc.)
- Disabled dates support
- Time selection option
- Timezone awareness

### Currency Input

**Requirements:**
- Currency symbol prefix
- Numeric input with decimal formatting
- Thousand separators
- Max decimal places configurable
- Negative values support (optional)

### File Input

**Requirements:**
- Styled button instead of browser default
- Show selected file name
- Clear selection
- Drag-drop support
- Preview for images

---

## 10.4 Domain-Specific Components

### Job Card (Manufacturing)

**Purpose:** Display manufacturing job summary in lists and kanban.

**Sections:**
- Header: Order number, status badge
- Body: Product name, variant, quantity
- Progress: Bar (if in production)
- Footer: Due date badge, photo indicator, action button

**Interactions:**
- Click: Open detail modal
- Quick action: Advance status
- Drag handle: For kanban drag-drop

### Invoice Row

**Purpose:** Display invoice in tables and lists.

**Columns:**
- Invoice number
- Manufacturer name
- Invoice date
- Due date (with overdue highlighting)
- Amount
- Status badge
- Actions menu

### Shipment Tracker

**Purpose:** Show shipment progress visually.

**Requirements:**
- Horizontal progress bar or steps
- Current location/status highlighted
- Estimated delivery
- Tracking number with copy button
- Link to carrier tracking page

### Manufacturer Card

**Purpose:** Display manufacturer summary.

**Sections:**
- Header: Name, logo, status indicator
- Body: Location, capabilities icons
- Stats: Active jobs, avg lead time, quality score
- Actions: View details, contact

### Product Family Card

**Purpose:** Display product family summary.

**Sections:**
- Header: Name, code
- Body: Description, default manufacturer
- Stats: Product count, active jobs
- Actions: Edit, view products

---

# 11. API ENDPOINT SPECIFICATIONS

## 11.1 API Design Principles

### RESTful Conventions

- Use nouns for resources (e.g., /api/jobs, not /api/getJobs)
- Use HTTP methods appropriately:
  - GET: Retrieve resources
  - POST: Create resources
  - PUT: Update entire resource
  - PATCH: Partial update
  - DELETE: Remove resource
- Use plural nouns for collections (e.g., /api/jobs)
- Use IDs for individual resources (e.g., /api/jobs/123)
- Nest related resources logically (e.g., /api/orders/123/items)

### Request/Response Format

- Content-Type: application/json
- Use camelCase for JSON keys
- Dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Amounts as strings or numbers, document which

### Pagination

Standard pagination parameters:
- page (default 1)
- limit (default 20, max 100)
- sort (field name)
- order (asc or desc)

Response includes:
- data: array of items
- meta: { page, limit, total, totalPages }

### Error Responses

Standard error format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

### Authentication

- All /api/admin/* require authenticated admin user
- All /api/manufacturer/* require authenticated manufacturer user
- /api/public/* are public endpoints
- Auth via session cookie or Bearer token

---

## 11.2 Endpoint Summary by Module

### Manufacturing Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/manufacturer/dashboard/stats | Dashboard statistics |
| GET | /api/manufacturer/dashboard/urgent | Urgent jobs list |
| GET | /api/manufacturer/jobs | List manufacturer's jobs |
| GET | /api/manufacturer/jobs/:id | Job detail |
| PUT | /api/manufacturer/jobs/:id/status | Update job status |
| PUT | /api/manufacturer/jobs/:id/progress | Update progress |
| GET | /api/manufacturer/jobs/:id/photos | List job photos |
| POST | /api/manufacturer/jobs/:id/photos | Upload photo |
| GET | /api/manufacturer/jobs/:id/notes | List job notes |
| POST | /api/manufacturer/jobs/:id/notes | Add note |
| GET | /api/admin/manufacturing/jobs | Admin: list all jobs |
| POST | /api/admin/manufacturing/jobs/:id/assign | Admin: assign job |

### Catalog Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/product-families | List families |
| POST | /api/admin/product-families | Create family |
| GET | /api/admin/product-families/:id | Family detail |
| PUT | /api/admin/product-families/:id | Update family |
| DELETE | /api/admin/product-families/:id | Delete family |
| GET | /api/admin/product-families/:id/manufacturers | Family's manufacturers |
| POST | /api/admin/product-families/:id/manufacturers | Add manufacturer |
| PUT | /api/admin/product-families/:id/manufacturers/:mfrId | Update assignment |
| DELETE | /api/admin/product-families/:id/manufacturers/:mfrId | Remove manufacturer |
| PUT | /api/admin/products/:id/family | Assign product to family |
| POST | /api/admin/products/bulk-family | Bulk assign |

### 3PL Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/fulfillment-centers | List FCs |
| POST | /api/admin/fulfillment-centers | Create FC |
| GET | /api/admin/fulfillment-centers/:id | FC detail |
| PUT | /api/admin/fulfillment-centers/:id | Update FC |
| GET | /api/admin/inbound-shipments | List inbound |
| POST | /api/admin/inbound-shipments | Create inbound |
| GET | /api/admin/inbound-shipments/:id | Inbound detail |
| PUT | /api/admin/inbound-shipments/:id/status | Update status |
| POST | /api/admin/inbound-shipments/:id/inspection | Submit QC |
| GET | /api/admin/inventory | List inventory |
| POST | /api/admin/inventory/adjustment | Adjust stock |
| GET | /api/admin/inventory/alerts | Stock alerts |
| GET | /api/admin/outbound-shipments | List outbound |
| POST | /api/admin/outbound-shipments | Create outbound |
| PUT | /api/admin/outbound-shipments/:id/ship | Mark shipped |

### Onboarding Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/public/onboarding/check-invite/:code | Validate invite |
| POST | /api/public/onboarding/applications | Create application |
| PUT | /api/public/onboarding/applications/:id | Update application |
| POST | /api/public/onboarding/applications/:id/submit | Submit application |
| POST | /api/public/onboarding/applications/:id/documents | Upload document |
| GET | /api/admin/onboarding/applications | List applications |
| GET | /api/admin/onboarding/applications/:id | Application detail |
| PUT | /api/admin/onboarding/applications/:id/status | Change status |
| POST | /api/admin/onboarding/applications/:id/approve | Approve |
| POST | /api/admin/onboarding/applications/:id/reject | Reject |
| POST | /api/admin/onboarding/invites | Create invite |
| GET | /api/admin/onboarding/invites | List invites |
| DELETE | /api/admin/onboarding/invites/:id | Revoke invite |

### Financial Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/invoices | List invoices |
| POST | /api/admin/invoices | Create invoice |
| GET | /api/admin/invoices/:id | Invoice detail |
| PUT | /api/admin/invoices/:id | Update invoice |
| PUT | /api/admin/invoices/:id/approve | Approve invoice |
| PUT | /api/admin/invoices/:id/dispute | Dispute invoice |
| GET | /api/admin/payments | List payments |
| POST | /api/admin/payments | Record payment |
| GET | /api/admin/payments/:id | Payment detail |
| DELETE | /api/admin/payments/:id | Void payment |
| GET | /api/admin/reports/aging | Aging report |
| GET | /api/admin/reports/costs | Cost report |
| GET | /api/admin/manufacturers/:id/financial | Mfr financial profile |
| PUT | /api/admin/manufacturers/:id/financial | Update financial settings |
| GET | /api/manufacturer/my-invoices | Manufacturer's invoices |
| GET | /api/manufacturer/my-payments | Manufacturer's payments |


---

## 11.3 Enhanced Spreadsheet Styling Requirement

### CRITICAL: Existing Pattern to Replicate

The Production Page ("View All Manufacturing Records in the Productions Hub") has an **enhanced spreadsheet styling** that provides a superior user experience for viewing comprehensive data lists. This styling pattern MUST be applied across the entire application.

### Where Enhanced Spreadsheet Styling Must Be Applied

**Existing pages to upgrade:**
- All Orders list view
- All Design Jobs list view
- Any other existing comprehensive list/directory pages

**New pages requiring this styling:**
- Manufacturing Jobs list (manufacturer portal)
- Invoices list (financial module)
- Payments list (financial module)
- Inventory list (3PL module)
- Inbound Shipments list (3PL module)
- Outbound Shipments list (3PL module)
- Product Families list (catalog module)
- Manufacturer Applications list (onboarding)
- Any other new comprehensive directory views

### Implementation Direction

1. **Find the existing implementation** in the Production Page/Productions Hub
2. **Extract the spreadsheet component** and styling as a reusable component if not already
3. **Document the component's API** - what props it accepts, how to configure columns
4. **Apply consistently** across all list views mentioned above
5. **Ensure feature parity** - sorting, filtering, pagination, export should work the same everywhere

### Key Features to Maintain

Based on typical enhanced spreadsheet styling, ensure these features are present:

- **Fixed header row** - Stays visible when scrolling
- **Alternating row colors** - Easy row tracking
- **Column resizing** - User can adjust column widths
- **Column sorting** - Click header to sort
- **Column filtering** - Filter by column values
- **Row selection** - Checkbox selection for bulk actions
- **Sticky first column** - Identity column stays visible on horizontal scroll
- **Hover highlighting** - Row highlight on hover
- **Dense data display** - Efficient use of space for many records
- **Export functionality** - Export to CSV/Excel
- **Pagination controls** - Page through large datasets
- **Record count display** - "Showing 1-50 of 1,234 records"

### Visual Consistency

All enhanced spreadsheets should:
- Use the same color scheme
- Use the same fonts and sizes
- Have the same interaction patterns
- Look like they belong to the same application

### Implementation Note for Claude Code

Before implementing any list view:
1. **FIRST**: Navigate to the Production Page and examine the existing spreadsheet implementation
2. **SECOND**: Understand the component structure, props, and styling
3. **THIRD**: Either reuse that component directly or create an abstraction
4. **FOURTH**: Apply to the new list view
5. **FIFTH**: Verify visual and functional consistency with Production Page

Do NOT create a new list/table component from scratch when a working enhanced implementation already exists.


---

# 12. DATABASE MIGRATION SCRIPTS

## 12.1 Migration Strategy

### Principles

1. **Non-destructive** - Never delete existing data without backup
2. **Reversible** - Each migration should have a rollback plan
3. **Incremental** - Small, focused migrations rather than big-bang
4. **Tested** - Test migrations on copy of production data first
5. **Documented** - Each migration explains what and why

### Migration Order

Migrations should be run in this sequence due to dependencies:

1. Product families tables (no dependencies)
2. Fulfillment centers table (no dependencies)
3. Add columns to manufacturers table (no dependencies)
4. Add columns to products table (depends on product families)
5. Manufacturer onboarding tables (depends on manufacturers)
6. Financial tables (depends on manufacturers)
7. 3PL tables (depends on fulfillment centers, manufacturers)
8. Add columns to manufacturing jobs (depends on product families, 3PL)
9. Data migrations (classify products, migrate status values)

### Rollback Procedures

For each migration, document:
- How to revert schema changes
- How to restore data if needed
- Impact of rollback on application

---

## 12.2 Schema Migrations

### Migration 001: Product Families

**Purpose:** Create product_families and product_family_manufacturers tables

**Tables created:**
- product_families
- product_family_manufacturers
- product_categories

**Columns to add:**
- products.product_family_id
- products.product_category_id
- products.manufacturer_override_id

**Seed data:**
- 6 default product families (WRESTLING, BASICS_TOPS, BASICS_BOTTOMS, etc.)

### Migration 002: Manufacturer Financial Fields

**Purpose:** Add financial tracking to manufacturers

**Columns to add to manufacturers:**
- credit_limit
- current_balance
- payment_terms
- payment_grace_days
- early_payment_discount
- payment_standing
- bank_name
- bank_account_encrypted
- bank_routing
- preferred_payment_method

**Default values:**
- credit_limit: 10000.00
- payment_terms: 'NET30'
- payment_standing: 'good'

### Migration 003: Fulfillment Centers

**Purpose:** Create fulfillment center management

**Tables created:**
- fulfillment_centers

**Seed data:**
- One default fulfillment center (can be placeholder for now)

### Migration 004: Financial Tables

**Purpose:** Create invoice and payment tracking

**Tables created:**
- manufacturer_invoices
- manufacturer_invoice_items
- manufacturer_payments
- manufacturer_payment_allocations

### Migration 005: 3PL Tables

**Purpose:** Create inbound/outbound shipment and inventory tracking

**Tables created:**
- inbound_shipments
- inbound_shipment_items
- inventory
- inventory_transactions
- outbound_shipments
- outbound_shipment_items

### Migration 006: Onboarding Tables

**Purpose:** Create manufacturer application system

**Tables created:**
- manufacturer_applications
- manufacturer_application_documents
- manufacturer_application_notes
- manufacturer_invites

### Migration 007: Manufacturing Job Updates

**Purpose:** Add new fields to manufacturing jobs for enhanced tracking

**Columns to add:**
- progress_percent
- accepted_at
- started_at
- qc_passed_at
- ready_to_ship_at
- estimated_completion_date
- routed_by
- routing_reason
- original_manufacturer_id
- quoted_cost
- actual_cost
- invoice_id

### Migration 008: Job Photos and Notes

**Purpose:** Create tables for job documentation

**Tables created:**
- manufacturer_job_photos
- manufacturer_job_notes
- manufacturer_notifications

### Migration 009: Status Migration

**Purpose:** Migrate existing job statuses to new 6-stage system

**Process:**
1. Create status mapping table
2. Update all existing jobs to new status values
3. Log any jobs that don't map cleanly
4. Verify counts before and after

---

## 12.3 Data Migration Notes

### Product Classification

After schema migrations, products need to be classified into families:

1. Export all products with current data
2. Manually or semi-automatically classify each product
3. Create CSV with product_id → product_family_id mapping
4. Run import script to update products
5. Verify all products have family assignment

### Status Value Mapping

Map old 15-stage status values to new 6-stage:

| Old Status | New Status |
|------------|------------|
| new, pending, needs_review | NEW |
| confirmed, accepted, scheduled, materials_ordered | ACCEPTED |
| in_progress, cutting, sewing, printing, finishing | IN_PRODUCTION |
| quality_check, inspection | QC |
| ready, packed | READY_TO_SHIP |
| shipped, delivered | SHIPPED |

Jobs with ambiguous status should be flagged for manual review.

### Manufacturer Setup

After migrations, existing manufacturers need:
1. Financial settings configured (credit limit, terms)
2. Product family assignments
3. Capability flags set

---

# 13. TESTING REQUIREMENTS

## 13.1 Testing Strategy

### Test Types

1. **Unit Tests** - Individual functions and utilities
2. **Component Tests** - UI components in isolation
3. **Integration Tests** - API endpoints with database
4. **E2E Tests** - Full user flows through UI
5. **Manual Testing** - Exploratory and edge case testing

### Coverage Goals

- Unit tests: 80% coverage for business logic
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Manual tests: New features before release

---

## 13.2 Unit Test Requirements

### Business Logic to Test

**Manufacturer Status Transitions:**
- Test isValidTransition() for all status combinations
- Test getAllowedTransitions() returns correct options
- Test edge cases (null status, invalid status)

**Manufacturer Resolution Cascade:**
- Test variant-level override
- Test product-level override
- Test category-level override
- Test family-level default
- Test fallback when primary unavailable

**Credit Calculations:**
- Test available credit calculation
- Test balance update on invoice approval
- Test balance update on payment

**Aging Calculations:**
- Test bucket assignment (current, 1-30, etc.)
- Test days past due calculation
- Test with various date scenarios

**Inventory Calculations:**
- Test available = on_hand - reserved
- Test stock in increases correctly
- Test reserve decreases available
- Test pick decreases both

### Utility Functions to Test

- Date formatting and parsing
- Currency formatting
- Status label/color lookup
- Validation functions

---

## 13.3 Integration Test Requirements

### API Tests by Module

**Manufacturing API:**
- GET /manufacturer/jobs returns only user's jobs
- PUT /manufacturer/jobs/:id/status validates transitions
- POST /manufacturer/jobs/:id/photos uploads successfully
- Unauthorized requests are rejected

**Catalog API:**
- CRUD operations on product families work
- Manufacturer assignments create/update/delete correctly
- Product family assignment updates product correctly

**3PL API:**
- Inbound shipment lifecycle works
- QC inspection updates inventory correctly
- Outbound shipment creation reserves inventory
- Inventory adjustments log transactions

**Onboarding API:**
- Application submission works
- Document upload stores file
- Approval creates manufacturer account
- Rejection sends notification

**Financial API:**
- Invoice creation calculates due date
- Payment allocation applies correctly
- Balance recalculates on payment

### Database Integrity Tests

- Foreign key constraints are enforced
- Unique constraints prevent duplicates
- Cascade deletes work as expected
- Audit logging captures changes

---

## 13.4 E2E Test Requirements

### Critical User Flows

**Manufacturer Flow:**
1. Manufacturer logs in
2. Views dashboard with stats
3. Navigates to kanban board
4. Drags job from NEW to ACCEPTED
5. Opens job detail
6. Updates progress
7. Uploads photo
8. Advances to SHIPPED with tracking

**Admin Order Routing Flow:**
1. Order created with multiple products
2. System auto-routes to correct manufacturers
3. Admin views routing decisions
4. Admin can override if needed
5. Manufacturing jobs created correctly

**3PL Inbound Flow:**
1. Manufacturer ships job
2. Inbound shipment created automatically
3. 3PL marks arrived
4. QC inspection submitted
5. Passed items added to inventory

**Onboarding Flow:**
1. Admin creates invite
2. Manufacturer clicks invite link
3. Fills application form
4. Uploads documents
5. Submits application
6. Admin reviews and approves
7. Manufacturer account created
8. Manufacturer can log in

**Payment Flow:**
1. Invoice auto-created when job shipped
2. Admin views aging report
3. Admin records payment
4. Payment allocated to invoices
5. Invoice marked as paid
6. Manufacturer balance updated

### Edge Case Flows

- Order with unavailable manufacturer triggers fallback
- Credit limit exceeded blocks new jobs
- QC failure holds items from inventory
- Partial payment updates invoice correctly
- Application rejection sends appropriate email

---

## 13.5 Manual Test Checklist

### Before Each Release

**Manufacturing Portal:**
- [ ] Dashboard loads with correct data
- [ ] Kanban drag-drop works
- [ ] Photo upload works on mobile
- [ ] Status transitions work correctly
- [ ] Notifications appear

**Admin Portal:**
- [ ] All new pages accessible
- [ ] Product family CRUD works
- [ ] Manufacturer assignment works
- [ ] 3PL screens functional
- [ ] Financial reports generate

**Mobile Testing:**
- [ ] All pages render on 375px width
- [ ] Touch interactions work
- [ ] Camera capture works
- [ ] No horizontal scroll issues
- [ ] Forms usable with keyboard

**Performance:**
- [ ] Dashboard loads in < 3 seconds
- [ ] Large lists paginate correctly
- [ ] Search responds in < 1 second
- [ ] No memory leaks on long sessions


---

# 14. SECURITY & SAFEGUARDS

## 14.1 Authentication & Authorization

### Authentication Requirements

**Session Management:**
- Secure, httpOnly cookies for session tokens
- Session timeout after 8 hours of inactivity
- Force re-login after 24 hours regardless of activity
- Support for "remember me" extending to 30 days

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number
- Check against common password lists
- Require change on first login (for generated passwords)

**Multi-Factor Authentication (Future):**
- TOTP support (Google Authenticator, Authy)
- SMS backup codes
- Recovery codes for account recovery

### Authorization Model

**Roles:**
- superadmin: Full system access
- admin: Most admin functions, no user management
- manufacturer: Access to their manufacturer portal only
- customer: Access to customer portal only
- readonly: View-only access for reporting

**Permission Checks:**
- Every API endpoint must check user role
- Manufacturer endpoints verify manufacturer_id matches
- Admin endpoints verify admin role
- Log all permission denied attempts

### Role-Based Access Control (RBAC)

**Permission Groups:**
- catalog:read, catalog:write
- manufacturing:read, manufacturing:write
- financial:read, financial:write
- onboarding:read, onboarding:write
- 3pl:read, 3pl:write
- users:read, users:write

**Assign permissions to roles:**
- superadmin: all permissions
- admin: all except users:write
- manufacturer: manufacturing:read, manufacturing:write (own only)

---

## 14.2 Data Protection

### Sensitive Data Handling

**Encryption at Rest:**
- Bank account numbers: encrypted in database
- Tax identification numbers: encrypted
- API keys/tokens: encrypted

**Encryption in Transit:**
- All traffic over HTTPS
- TLS 1.2 minimum

**PII Handling:**
- Minimize collection of personal data
- Clear retention policies
- Deletion on request (where legal)

### Data Access Logging

**Audit Log Requirements:**
- Log all data mutations (create, update, delete)
- Log who made the change
- Log what changed (before/after for updates)
- Log when (timestamp)
- Log from where (IP address, user agent)

**Sensitive Data Access:**
- Log access to financial data
- Log access to encrypted fields
- Log exports of large datasets

### Backup & Recovery

**Backup Schedule:**
- Full database backup daily
- Transaction log backup every hour
- Retention: 30 days of backups

**Recovery Testing:**
- Test restore from backup monthly
- Document recovery procedures
- Recovery time objective: 4 hours

---

## 14.3 Input Validation

### Validation Rules

**All Inputs:**
- Validate on client (UX) AND server (security)
- Sanitize before database insertion
- Escape for output context (HTML, JSON)

**Common Validations:**
- Email: valid format, reasonable length
- Phone: valid format for country
- URL: valid format, allowed protocols (http, https)
- Dates: valid format, reasonable range
- Numbers: within expected range
- Text: max length, allowed characters

**File Uploads:**
- Validate file type (extension AND mime type)
- Validate file size
- Scan for malware (future)
- Store outside web root
- Generate random file names

### SQL Injection Prevention

- Use parameterized queries ALWAYS
- Never concatenate user input into SQL
- Use ORM (Drizzle) properly
- Review any raw SQL carefully

### XSS Prevention

- Escape all user-provided content before rendering
- Use framework's built-in escaping (React)
- Content Security Policy headers
- HttpOnly cookies

---

## 14.4 API Security

### Rate Limiting

**Limits by Endpoint Type:**
- Authentication endpoints: 5 requests/minute
- Public endpoints: 30 requests/minute
- Authenticated endpoints: 100 requests/minute
- Admin endpoints: 200 requests/minute

**Response to Limit:**
- Return 429 Too Many Requests
- Include Retry-After header
- Log excessive attempts

### Request Validation

**Required for All Requests:**
- Valid content-type header
- Request body matches content-type
- Required parameters present
- Parameters within valid ranges

**Additional for Sensitive Operations:**
- CSRF token for state-changing requests
- Re-authentication for highly sensitive operations
- Confirmation for destructive actions

### Error Handling

**Never Expose:**
- Stack traces
- Database errors
- Internal file paths
- Server configuration

**Safe Error Messages:**
- User-friendly error descriptions
- Unique error codes for debugging
- Log full error details server-side

---

## 14.5 Operational Security

### Environment Configuration

**Secrets Management:**
- Database credentials in environment variables
- API keys in environment variables
- Never commit secrets to repository
- Rotate secrets periodically

**Environment Separation:**
- Development, staging, production
- Different credentials per environment
- Production access restricted

### Monitoring & Alerting

**Monitor For:**
- Failed login attempts (possible brute force)
- Unusual data access patterns
- Error rate spikes
- Performance degradation
- Disk space usage

**Alert On:**
- Multiple failed logins from same IP
- Admin actions outside business hours
- Large data exports
- System errors

### Incident Response

**Response Plan:**
1. Detect: Monitor alerts, user reports
2. Contain: Isolate affected systems
3. Investigate: Determine scope and cause
4. Remediate: Fix vulnerability
5. Recover: Restore normal operations
6. Learn: Post-incident review

---

# 15. DEPLOYMENT STRATEGY

## 15.1 Deployment Phases

### Phase 1: Database & Infrastructure (Week 1-2)

**Tasks:**
1. Run database migrations in order
2. Seed initial data (product families, default FC)
3. Verify migrations successful
4. Update environment variables

**Rollback:**
- Revert migrations in reverse order
- Restore from pre-migration backup if needed

### Phase 2: Backend APIs (Week 2-3)

**Tasks:**
1. Deploy new API routes (disabled/feature flagged)
2. Run integration tests against staging
3. Enable APIs one module at a time
4. Monitor for errors

**Rollback:**
- Disable feature flags
- Revert to previous deployment

### Phase 3: Admin UI (Week 3-4)

**Tasks:**
1. Deploy new admin pages
2. Test in staging with real-ish data
3. Enable for internal users first
4. Gather feedback, iterate
5. Enable for all admin users

**Rollback:**
- Hide new pages via feature flag
- Point navigation back to old pages

### Phase 4: Manufacturer UI (Week 4-5)

**Tasks:**
1. Deploy new manufacturer portal
2. Test with friendly manufacturer
3. Gather feedback, iterate
4. Migrate all manufacturers to new UI

**Rollback:**
- Redirect to legacy manufacturer pages
- Communicate to manufacturers

### Phase 5: Auto-Routing & 3PL (Week 5-6)

**Tasks:**
1. Enable auto-routing for new orders
2. Monitor routing decisions
3. Enable 3PL for shipments
4. Train team on new workflows

**Rollback:**
- Disable auto-routing
- Revert to manual routing

### Phase 6: Financial System (Week 6-7)

**Tasks:**
1. Enable invoice auto-generation
2. Import existing payment data
3. Enable payment recording
4. Generate first aging reports

**Rollback:**
- Disable auto-invoicing
- Continue manual tracking temporarily

---

## 15.2 Feature Flags

### Recommended Feature Flags

- `NEW_MANUFACTURER_PORTAL` - Enable new manufacturer UI
- `AUTO_ROUTING` - Enable automatic job routing
- `3PL_INTEGRATION` - Enable 3PL shipment tracking
- `AUTO_INVOICING` - Enable automatic invoice generation
- `ONBOARDING_PUBLIC` - Enable public manufacturer application

### Feature Flag Implementation

- Store in database or configuration
- Check flag before rendering features
- Check flag before processing logic
- Allow per-user or percentage rollout

---

## 15.3 Data Migration Tasks

### Pre-Launch Tasks

1. **Classify All Products** - Assign to product families
2. **Configure Manufacturers** - Set capabilities, financial settings
3. **Set Up Fulfillment Center** - Configure default FC
4. **Migrate Status Values** - Convert to new 6-stage system
5. **Verify Data Integrity** - Run validation scripts

### Post-Launch Tasks

1. **Monitor Auto-Routing** - Verify correct assignments
2. **Review Aging Reports** - Ensure accuracy
3. **Gather User Feedback** - From manufacturers and admins
4. **Iterate on Issues** - Fix bugs and UX issues

---

## 15.4 Rollback Procedures

### Database Rollback

If schema changes cause issues:
1. Stop application
2. Run down migrations (in reverse order)
3. Restore data from backup if needed
4. Restart application with previous code version

### Application Rollback

If new code causes issues:
1. Revert to previous deployment
2. Disable feature flags for new features
3. Investigate and fix issues
4. Re-deploy when fixed

### Communication Plan

If rollback affects users:
1. Notify affected users immediately
2. Explain what happened (high level)
3. Provide workaround if available
4. Communicate expected resolution time
5. Follow up when resolved

---

## 15.5 Training & Documentation

### Admin Training

**Topics:**
- Product family management
- Manufacturer assignment
- Order routing and overrides
- 3PL workflows
- Financial system usage

**Materials:**
- Video walkthroughs
- Quick reference guides
- FAQ document

### Manufacturer Training

**Topics:**
- New dashboard overview
- Using the kanban board
- Updating job status
- Uploading photos
- Viewing payments

**Materials:**
- Welcome email with links
- In-app guided tour
- Help documentation
- Support contact

---

## 15.6 Success Metrics

### KPIs to Track

**Manufacturing Efficiency:**
- Average time from NEW to SHIPPED
- On-time delivery rate
- Jobs requiring manual routing intervention

**3PL Operations:**
- Inbound shipment accuracy
- QC pass rate by manufacturer
- Inventory accuracy

**Financial:**
- Days payable outstanding (DPO)
- Invoice processing time
- Payment accuracy

**User Adoption:**
- Manufacturer login frequency
- Feature usage rates
- Support ticket volume

### Monitoring Dashboard

Create dashboard showing:
- Real-time order flow
- Manufacturing pipeline status
- 3PL throughput
- Financial health indicators


---

# APPENDIX A: DETAILED USER FLOWS

## A.1 Order-to-Ship Complete Flow

This documents the complete journey of an order from customer placement through final delivery.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE ORDER-TO-SHIP FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: ORDER CREATION                                                    │
│  ────────────────────────                                                   │
│                                                                             │
│  1. Customer places order on storefront                                     │
│     │                                                                       │
│     ├── Order contains: Line items, quantities, customization              │
│     ├── Artwork uploaded or selected from library                          │
│     └── Payment processed                                                   │
│     │                                                                       │
│     ▼                                                                       │
│  2. Order received in WholesaleOS                                          │
│     │                                                                       │
│     ├── Order status: NEW                                                  │
│     ├── Artwork validation (if applicable)                                 │
│     └── Order confirmation sent to customer                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 2: DESIGN & APPROVAL (if custom artwork)                            │
│  ──────────────────────────────────────────────────────────                │
│                                                                             │
│  3. Design team creates/prepares artwork                                   │
│     │                                                                       │
│     ├── Design job created (if needed)                                     │
│     ├── Designer assigned                                                  │
│     └── Mockups generated                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  4. Customer approves design                                               │
│     │                                                                       │
│     ├── Proof sent to customer                                             │
│     ├── Customer reviews and approves                                      │
│     └── Design locked for production                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 3: MANUFACTURING ROUTING                                            │
│  ─────────────────────────────────                                         │
│                                                                             │
│  5. Order ready for manufacturing                                          │
│     │                                                                       │
│     ▼                                                                       │
│  6. Auto-routing system processes order                                    │
│     │                                                                       │
│     ├── FOR EACH line item:                                                │
│     │   ├── Identify product family                                        │
│     │   ├── Resolve manufacturer (cascade lookup)                          │
│     │   ├── Check manufacturer availability                                │
│     │   ├── Check capacity                                                 │
│     │   └── Assign or fallback                                             │
│     │                                                                       │
│     ├── Group items by manufacturer                                        │
│     └── Create manufacturing job(s)                                        │
│     │                                                                       │
│     ▼                                                                       │
│  7. Manufacturing jobs created                                             │
│     │                                                                       │
│     ├── Job status: NEW                                                    │
│     ├── Due date calculated                                                │
│     ├── Artwork files attached                                             │
│     └── Manufacturer notified                                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 4: MANUFACTURING                                                    │
│  ──────────────────────                                                    │
│                                                                             │
│  8. Manufacturer reviews job                                               │
│     │                                                                       │
│     ├── Views job details in portal                                        │
│     ├── Downloads artwork files                                            │
│     ├── Confirms can fulfill                                               │
│     └── Status: NEW → ACCEPTED                                             │
│     │                                                                       │
│     ▼                                                                       │
│  9. Production begins                                                      │
│     │                                                                       │
│     ├── Status: ACCEPTED → IN_PRODUCTION                                   │
│     ├── Progress updates (optional)                                        │
│     ├── Photos uploaded                                                    │
│     └── Internal QC at manufacturer                                        │
│     │                                                                       │
│     ▼                                                                       │
│  10. Production complete                                                   │
│     │                                                                       │
│     ├── Status: IN_PRODUCTION → QC                                         │
│     ├── Final QC photos uploaded                                           │
│     └── Ready for packaging                                                │
│     │                                                                       │
│     ▼                                                                       │
│  11. Packaging and shipping                                                │
│     │                                                                       │
│     ├── Status: QC → READY_TO_SHIP                                         │
│     ├── Packing slip generated                                             │
│     ├── Ship to fulfillment center                                         │
│     ├── Enter tracking number                                              │
│     └── Status: READY_TO_SHIP → SHIPPED                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 5: 3PL FULFILLMENT                                                  │
│  ────────────────────────                                                  │
│                                                                             │
│  12. Shipment in transit to 3PL                                            │
│     │                                                                       │
│     ├── Inbound shipment created automatically                             │
│     ├── Status: EXPECTED                                                   │
│     └── Tracking monitored                                                 │
│     │                                                                       │
│     ▼                                                                       │
│  13. Shipment arrives at 3PL                                               │
│     │                                                                       │
│     ├── Status: EXPECTED → ARRIVED                                         │
│     ├── Receipt logged                                                     │
│     └── Queue for inspection                                               │
│     │                                                                       │
│     ▼                                                                       │
│  14. QC inspection at 3PL                                                  │
│     │                                                                       │
│     ├── Status: ARRIVED → INSPECTING                                       │
│     ├── Verify quantities                                                  │
│     ├── Inspect quality                                                    │
│     ├── Document any issues                                                │
│     └── Pass/fail decision                                                 │
│     │                                                                       │
│     ├── IF PASS:                                                           │
│     │   ├── Status: INSPECTING → STOCKED                                   │
│     │   └── Add to inventory                                               │
│     │                                                                       │
│     └── IF FAIL:                                                           │
│         ├── Status: INSPECTING → ISSUE                                     │
│         ├── Flag for resolution                                            │
│         └── Contact manufacturer                                           │
│     │                                                                       │
│     ▼                                                                       │
│  15. Order ready for customer shipment                                     │
│     │                                                                       │
│     ├── All items in inventory (or order complete)                         │
│     ├── Create outbound shipment                                           │
│     └── Reserve inventory                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  16. Pick, pack, ship to customer                                          │
│     │                                                                       │
│     ├── Generate pick list                                                 │
│     ├── Pick items from shelves                                            │
│     ├── Pack order                                                         │
│     ├── Generate shipping label                                            │
│     ├── Ship to customer                                                   │
│     └── Update tracking                                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 6: DELIVERY & COMPLETION                                            │
│  ─────────────────────────────                                             │
│                                                                             │
│  17. Customer receives order                                               │
│     │                                                                       │
│     ├── Delivery confirmed                                                 │
│     ├── Order status: DELIVERED                                            │
│     └── Follow-up email sent                                               │
│     │                                                                       │
│     ▼                                                                       │
│  18. Order complete                                                        │
│     │                                                                       │
│     ├── All items delivered                                                │
│     ├── Order status: COMPLETE                                             │
│     └── Invoice generated (if B2B)                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 7: FINANCIALS (parallel process)                                    │
│  ──────────────────────────────────────                                    │
│                                                                             │
│  19. Manufacturer invoice                                                  │
│     │                                                                       │
│     ├── Invoice auto-generated when job shipped                            │
│     ├── Due date per payment terms                                         │
│     ├── Added to payables                                                  │
│     └── Payment scheduled                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  20. Payment to manufacturer                                               │
│     │                                                                       │
│     ├── Payment processed per terms                                        │
│     ├── Invoice marked paid                                                │
│     └── Manufacturer balance updated                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## A.2 Manufacturer Daily Workflow

This documents the typical daily workflow for a manufacturer using the portal.

### Morning Routine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MANUFACTURER MORNING WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  8:00 AM - Start of Day                                                    │
│  ─────────────────────────                                                  │
│                                                                             │
│  1. Log into WholesaleOS                                                   │
│     │                                                                       │
│     ▼                                                                       │
│  2. Review Dashboard                                                       │
│     │                                                                       │
│     ├── Check active job count                                             │
│     ├── Review jobs due this week                                          │
│     ├── Note any overdue items                                             │
│     └── Check payment status                                               │
│     │                                                                       │
│     ▼                                                                       │
│  3. Process New Orders                                                     │
│     │                                                                       │
│     ├── Go to NEW column in kanban                                         │
│     ├── For each new job:                                                  │
│     │   ├── Review requirements                                            │
│     │   ├── Download artwork                                               │
│     │   ├── Verify capability                                              │
│     │   ├── Check material availability                                    │
│     │   └── Accept or flag issue                                           │
│     │                                                                       │
│     └── Update status to ACCEPTED                                          │
│     │                                                                       │
│     ▼                                                                       │
│  4. Plan Production Schedule                                               │
│     │                                                                       │
│     ├── Review ACCEPTED jobs                                               │
│     ├── Prioritize by due date                                             │
│     ├── Assign to production lines                                         │
│     └── Start urgent items                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### During Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MANUFACTURER PRODUCTION WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Throughout Day - Production Updates                                       │
│  ────────────────────────────────────                                      │
│                                                                             │
│  1. Start Production on Job                                                │
│     │                                                                       │
│     ├── Open job in portal                                                 │
│     ├── Update status: ACCEPTED → IN_PRODUCTION                            │
│     └── Note estimated completion                                          │
│     │                                                                       │
│     ▼                                                                       │
│  2. During Production                                                      │
│     │                                                                       │
│     ├── Update progress percentage (optional)                              │
│     ├── Upload progress photos                                             │
│     │   ├── Cutting stage photo                                            │
│     │   ├── Sewing stage photo                                             │
│     │   └── Printing stage photo                                           │
│     │                                                                       │
│     └── Add notes if issues arise                                          │
│     │                                                                       │
│     ▼                                                                       │
│  3. Production Complete                                                    │
│     │                                                                       │
│     ├── Update status: IN_PRODUCTION → QC                                  │
│     ├── Perform internal quality check                                     │
│     └── Upload QC photos                                                   │
│     │                                                                       │
│     ▼                                                                       │
│  4. QC Pass                                                                │
│     │                                                                       │
│     ├── Update status: QC → READY_TO_SHIP                                  │
│     ├── Generate packing slip                                              │
│     └── Prepare for shipment                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### End of Day

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MANUFACTURER END OF DAY WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5:00 PM - End of Day                                                      │
│  ────────────────────────                                                   │
│                                                                             │
│  1. Ship Completed Orders                                                  │
│     │                                                                       │
│     ├── Review READY_TO_SHIP items                                         │
│     ├── Pack orders                                                        │
│     ├── Generate shipping labels                                           │
│     ├── Hand off to carrier                                                │
│     │                                                                       │
│     └── Update status: READY_TO_SHIP → SHIPPED                             │
│         ├── Enter tracking number                                          │
│         ├── Select carrier                                                 │
│         └── Confirm shipment                                               │
│     │                                                                       │
│     ▼                                                                       │
│  2. Review Tomorrow's Work                                                 │
│     │                                                                       │
│     ├── Check jobs due tomorrow                                            │
│     ├── Ensure materials ready                                             │
│     └── Note any concerns                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  3. Check Notifications                                                    │
│     │                                                                       │
│     ├── Review any messages from admin                                     │
│     ├── Respond to questions                                               │
│     └── Acknowledge urgent items                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## A.3 Admin Order Management Flow

This documents how admins manage orders through the system.

### Order Review Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN ORDER REVIEW FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Access Order Management                                                │
│     │                                                                       │
│     ├── Navigate to Orders section                                         │
│     ├── View order list (enhanced spreadsheet)                             │
│     └── Filter/sort as needed                                              │
│     │                                                                       │
│     ▼                                                                       │
│  2. Review New Orders                                                      │
│     │                                                                       │
│     ├── Filter by status: NEW                                              │
│     ├── For each order:                                                    │
│     │   ├── Verify order details                                           │
│     │   ├── Check artwork if custom                                        │
│     │   ├── Verify payment received                                        │
│     │   └── Approve for production                                         │
│     │                                                                       │
│     └── Orders ready for manufacturing                                     │
│     │                                                                       │
│     ▼                                                                       │
│  3. Monitor Manufacturing Progress                                         │
│     │                                                                       │
│     ├── View manufacturing jobs                                            │
│     ├── Check job statuses                                                 │
│     ├── Review any flagged issues                                          │
│     └── Intervene if needed                                                │
│     │                                                                       │
│     ▼                                                                       │
│  4. Handle Routing Exceptions                                              │
│     │                                                                       │
│     ├── View pending assignment queue                                      │
│     ├── Jobs that couldn't auto-route                                      │
│     ├── Manually assign manufacturer                                       │
│     └── Document reason for override                                       │
│     │                                                                       │
│     ▼                                                                       │
│  5. Track Shipments                                                        │
│     │                                                                       │
│     ├── Monitor inbound to 3PL                                             │
│     ├── Track outbound to customers                                        │
│     └── Handle delivery exceptions                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## A.4 Financial Management Flow

### Invoice and Payment Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FINANCIAL MANAGEMENT WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEEKLY: Invoice Review                                                    │
│  ──────────────────────                                                    │
│                                                                             │
│  1. Access Financial Dashboard                                             │
│     │                                                                       │
│     ├── View total payables                                                │
│     ├── Check aging summary                                                │
│     └── Note any warnings                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  2. Review Submitted Invoices                                              │
│     │                                                                       │
│     ├── Filter invoices by status: SUBMITTED                               │
│     ├── For each invoice:                                                  │
│     │   ├── Verify line items match jobs                                   │
│     │   ├── Check pricing accuracy                                         │
│     │   ├── Review any additional charges                                  │
│     │   └── Approve or dispute                                             │
│     │                                                                       │
│     └── Approved invoices enter payables                                   │
│     │                                                                       │
│     ▼                                                                       │
│  3. Process Payments                                                       │
│     │                                                                       │
│     ├── Review invoices due this week                                      │
│     ├── Prepare payment batch                                              │
│     ├── Process payments:                                                  │
│     │   ├── Select invoices to pay                                         │
│     │   ├── Enter payment details                                          │
│     │   └── Record payment                                                 │
│     │                                                                       │
│     └── Payments allocated to invoices                                     │
│     │                                                                       │
│     ▼                                                                       │
│  4. Generate Reports                                                       │
│     │                                                                       │
│     ├── Aging report for management                                        │
│     ├── Cost analysis by manufacturer                                      │
│     └── Margin report by product                                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  AS NEEDED: Handle Exceptions                                              │
│  ────────────────────────────                                              │
│                                                                             │
│  • Disputed invoices - work with manufacturer to resolve                   │
│  • Credit holds - review and release or escalate                           │
│  • Overdue accounts - contact manufacturer, adjust terms                   │
│  • Adjustments - process credits, corrections                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

# APPENDIX B: DETAILED WIREFRAMES

## B.1 Manufacturer Dashboard Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                            ┌─────────────────┐│
│ │ LOGO │  WholesaleOS                                              │ Hawk Mfg ▼ [⚙️] ││
│ └──────┘                                                            └─────────────────┘│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 DASHBOARD                                                          Jan 26, 2026│  │
│  │                                                                                   │  │
│  │ Good morning! Here's your production overview.                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ 📦 ACTIVE JOBS      │  │ 📅 DUE THIS WEEK    │  │ 💰 PAYMENT DUE      │           │
│  │                     │  │                     │  │                     │           │
│  │      47             │  │      12             │  │    $24,350          │           │
│  │                     │  │                     │  │                     │           │
│  │ ↑ 8 from last week  │  │ 3 overdue ⚠️        │  │ NET30: $18,200      │           │
│  │                     │  │                     │  │ NET60: $6,150       │           │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘           │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 JOBS BY STATUS                                                                │  │
│  │                                                                                   │  │
│  │ NEW          ████████████████████████████████  18                               │  │
│  │ ACCEPTED     ████████████████████  10                                           │  │
│  │ PRODUCTION   ████████████████████████████  14                                   │  │
│  │ QC           ██████  3                                                          │  │
│  │ READY        ████  2                                                            │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────┐  ┌────────────────────────────┐  │
│  │ ⚠️ URGENT ATTENTION                     View All│  │ 🚀 QUICK ACTIONS           │  │
│  │ ─────────────────────────────────────────────── │  │ ──────────────────────────  │  │
│  │                                                 │  │                            │  │
│  │ ⚠️ Order #4521 - Wrestling Singlets (24 units) │  │ [📥 View New Orders (18)]  │  │
│  │    Due: Tomorrow | IN_PRODUCTION               │  │                            │  │
│  │    [View Details]                              │  │ [🏭 Production Board]      │  │
│  │                                                 │  │                            │  │
│  │ 🔴 Order #4518 - Rash Guards (36 units)        │  │ [📦 Ready to Ship (2)]     │  │
│  │    Due: 2 days | NEW (not accepted!)           │  │                            │  │
│  │    [Accept Now]                                │  │ [📄 Packing Slips]         │  │
│  │                                                 │  │                            │  │
│  │ 🔴 Order #4499 - Fight Shorts (18 units)       │  │ [💰 Payment History]       │  │
│  │    OVERDUE by 3 days | QC                      │  │                            │  │
│  │    [Complete QC]                               │  │                            │  │
│  │                                                 │  └────────────────────────────┘  │
│  └─────────────────────────────────────────────────┘                                  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 RECENT ACTIVITY                                                               │  │
│  │                                                                                   │  │
│  │ • Shipped Order #4495 ───────────────────────────────────────────── 2 hours ago │  │
│  │ • Started Order #4512 ───────────────────────────────────────────── 5 hours ago │  │
│  │ • Accepted Order #4520 ─────────────────────────────────────────────── Yesterday │  │
│  │ • Completed QC for Order #4490 ──────────────────────────────────── 2 days ago  │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Dashboard]  [Board]  [Jobs]  [Payments]                                    [Help] [Profile] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## B.2 Manufacturer Kanban Board Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                            ┌─────────────────┐│
│ │ LOGO │  WholesaleOS                                              │ Hawk Mfg ▼ [⚙️] ││
│ └──────┘                                                            └─────────────────┘│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏭 PRODUCTION BOARD                [🔍 Search...        ] [Filter ▼] [⋮ More]   │  │
│  │                                                                                   │  │
│  │ Drag jobs between columns to update status                                       │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ 📥 NEW (18)  │ │ ✓ ACCEPTED   │ │ 🏭 PRODUCTION│ │ 🔍 QC (3)    │ │ 📦 READY (2) │ │
│  │              │ │    (10)      │ │    (14)      │ │              │ │              │ │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │
│  │ │ #4521    │ │ │ │ #4515    │ │ │ │ #4510    │ │ │ │ #4502    │ │ │ │ #4498    │ │ │
│  │ │ Singlets │ │ │ │ Rash Gds │ │ │ │ Fight Sh │ │ │ │ Hoodies  │ │ │ │ Singlets │ │ │
│  │ │ 24 units │ │ │ │ 18 units │ │ │ │ 36 units │ │ │ │ 12 units │ │ │ │ 48 units │ │ │
│  │ │          │ │ │ │          │ │ │ │ ████░ 60%│ │ │ │          │ │ │ │          │ │ │
│  │ │ ⚠️ Jan 28│ │ │ │ Jan 30   │ │ │ │ Feb 1    │ │ │ │ ⚠️ Jan 27│ │ │ │ 🔴Jan 26 │ │ │
│  │ │ [Accept] │ │ │ │ [Start]  │ │ │ │ [QC]     │ │ │ │ [Pass]   │ │ │ │ [Ship]   │ │ │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │
│  │ │ #4520    │ │ │ │ #4514    │ │ │ │ #4509    │ │ │ │ #4501    │ │ │ │ #4495    │ │ │
│  │ │ Tech Sts │ │ │ │ Singlets │ │ │ │ Robes    │ │ │ │ Shirts   │ │ │ │ Backpks  │ │ │
│  │ │ 12 units │ │ │ │ 48 units │ │ │ │ 6 units  │ │ │ │ 100 unts │ │ │ │ 24 units │ │ │
│  │ │          │ │ │ │          │ │ │ │ █████░85%│ │ │ │          │ │ │ │          │ │ │
│  │ │ Feb 2    │ │ │ │ Feb 5    │ │ │ │ Jan 29   │ │ │ │ ⚠️ Jan 28│ │ │ │          │ │ │
│  │ │ [Accept] │ │ │ │ [Start]  │ │ │ │ [QC]     │ │ │ │ [Pass]   │ │ │ │          │ │ │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ ┌──────────┐ │ │              │ │ ┌──────────┐ │ │              │ │              │ │
│  │ │ #4519    │ │ │              │ │ │ #4508    │ │ │              │ │              │ │
│  │ │ Rash Gds │ │ │              │ │ │ Shorts   │ │ │              │ │              │ │
│  │ │ 24 units │ │ │              │ │ │ 48 units │ │ │              │ │              │ │
│  │ │          │ │ │              │ │ │ ███░ 45% │ │ │              │ │              │ │
│  │ │ Feb 3    │ │ │              │ │ │ Jan 30   │ │ │              │ │              │ │
│  │ │ [Accept] │ │ │              │ │ │ [QC]     │ │ │              │ │              │ │
│  │ └──────────┘ │ │              │ │ └──────────┘ │ │              │ │              │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  │ + 15 more    │ │              │ │ + 11 more    │ │              │ │              │ │
│  │              │ │              │ │              │ │              │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Dashboard]  [Board]  [Jobs]  [Payments]                                    [Help] [Profile] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## B.3 Job Detail Modal Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                              [X] │ │
│  │  #4510 - Fight Shorts                                    ⬤ IN_PRODUCTION        │ │
│  │  ─────────────────────────────────────────────────────────────────────────────── │ │
│  │                                                                                   │ │
│  │  ●─────────●─────────◉─────────○─────────○─────────○                             │ │
│  │  NEW     ACCEPTED  PRODUCTION   QC      READY    SHIPPED                         │ │
│  │ Jan 20   Jan 21    Jan 22                                                        │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [Details] [Files] [Photos] [Notes]                                          │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────┐  ┌────────────────────────────────────────────┐ │ │
│  │  │ ORDER DETAILS               │  │ TIMELINE                                   │ │ │
│  │  │ ─────────────────────────── │  │ ──────────────────────────────────────────  │ │ │
│  │  │                             │  │                                            │ │ │
│  │  │ Product:   Fight Shorts     │  │ Created:   Jan 20, 2026                    │ │ │
│  │  │ Variant:   Custom Red/Black │  │ Accepted:  Jan 21, 2026                    │ │ │
│  │  │ Quantity:  36 units         │  │ Started:   Jan 22, 2026                    │ │ │
│  │  │ Family:    WRESTLING        │  │ Due Date:  Feb 1, 2026                     │ │ │
│  │  │ Decor:     Sublimation      │  │                                            │ │ │
│  │  │                             │  │ Days Remaining: 6                          │ │ │
│  │  │                             │  │ On Track: ✓ Yes                            │ │ │
│  │  └─────────────────────────────┘  └────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ PRODUCTION PROGRESS                                                         │ │ │
│  │  │ ───────────────────────────────────────────────────────────────────────────  │ │ │
│  │  │                                                                             │ │ │
│  │  │ ████████████████████████████████████░░░░░░░░░░░░░░░░  60%                   │ │ │
│  │  │                                                                             │ │ │
│  │  │ ├─────────────────────────────────────────────────────────────────────────┤ │ │ │
│  │  │ 0%                           50%                                      100% │ │ │
│  │  │                                                                             │ │ │
│  │  │ [─────────────────────────────────────────────────] [Update Progress]       │ │ │
│  │  │                                                                             │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ⚠️ CUSTOMER NOTES                                                           │ │ │
│  │  │ ───────────────────────────────────────────────────────────────────────────  │ │ │
│  │  │                                                                             │ │ │
│  │  │ Please ensure the red matches PMS 485C. The shorts should have the logo    │ │ │
│  │  │ on the left leg as shown in the artwork.                                    │ │ │
│  │  │                                                                             │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                                             │ │ │
│  │  │  [🏭 Complete Production & Move to QC]           [⚠️ Report Issue]          │ │ │
│  │  │                                                                             │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                   │ │
│  └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## B.4 Admin Product Family Management Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                            ┌─────────────────┐│
│ │ LOGO │  WholesaleOS Admin                                        │ Admin User ▼    ││
│ └──────┘                                                            └─────────────────┘│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ │ Dashboard                                                                           │ │
│ │ Orders                                                                              │ │
│ │ Manufacturing                                                                       │ │
│ │ ▼ Catalog                                                                          │ │
│ │   │ Products                                                                        │ │
│ │   │ Product Families ◀                                                             │ │
│ │   │ Categories                                                                      │ │
│ │ 3PL                                                                                 │ │
│ │ Manufacturers                                                                       │ │
│ │ Financial                                                                           │ │
│ │ Settings                                                                            │ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📁 PRODUCT FAMILIES                                        [+ Add Family]       │  │
│  │                                                                                   │  │
│  │ Manage product groupings for manufacturer routing                                │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ [🔍 Search families...]                              [Filter: Active ▼]         │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │  CODE          NAME                    DEFAULT MFR      PRODUCTS   STATUS  ACTIONS│  │
│  │  ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  WRESTLING     Wrestling & Combat      Hawk Mfg         45        ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  BASICS_TOPS   Standard Basics - Tops  Hawk Mfg         120       ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  BASICS_BTMS   Standard Basics - Btms  -                85        ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  WOMENS_LNG    Women's Loungewear      -                32        ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  SPORTS_JRS    American Sports Jersey  -                68        ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  ELEVATED      Elevated Essentials     -                25        ●Active  [⋮]   │  │
│  │                                                                                   │  │
│  │  ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  Showing 6 of 6 families                                                         │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## B.5 Admin Aging Report Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                            ┌─────────────────┐│
│ │ LOGO │  WholesaleOS Admin                                        │ Admin User ▼    ││
│ └──────┘                                                            └─────────────────┘│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💰 ACCOUNTS PAYABLE - AGING REPORT                           [Export CSV]       │  │
│  │                                                                                   │  │
│  │ As of January 26, 2026                                                           │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ SUMMARY                                                                          │  │
│  │ ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │  │
│  │  │ CURRENT      │ │ 1-30 DAYS    │ │ 31-60 DAYS   │ │ 61-90 DAYS   │ │ 90+    │ │  │
│  │  │              │ │              │ │              │ │              │ │        │ │  │
│  │  │  $45,230     │ │  $12,400     │ │  $8,650      │ │  $2,100      │ │ $950   │ │  │
│  │  │              │ │              │ │              │ │              │ │        │ │  │
│  │  │ 65% of total │ │ 18%          │ │ 12%          │ │ 3%           │ │ 1%     │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │  │
│  │                                                                                   │  │
│  │  Total Outstanding: $69,330                                                      │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ DETAIL BY MANUFACTURER                                                           │  │
│  │ ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  MANUFACTURER      CURRENT     1-30      31-60     61-90     90+       TOTAL     │  │
│  │  ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  Hawk Mfg         $32,100    $8,200    $5,400    $1,200     -       $46,900 ⚠️  │  │
│  │  [View Details]                                                                  │  │
│  │                                                                                   │  │
│  │  China Basics      $8,450    $3,100    $2,000      -        -       $13,550     │  │
│  │  [View Details]                                                                  │  │
│  │                                                                                   │  │
│  │  Turkey Premium    $4,680    $1,100    $1,250     $900     $950     $8,880 🔴   │  │
│  │  [View Details]                                                                  │  │
│  │                                                                                   │  │
│  │  ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  TOTALS           $45,230   $12,400    $8,650    $2,100    $950    $69,330      │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ACTIONS                                                                          │  │
│  │ ───────────────────────────────────────────────────────────────────────────────  │  │
│  │                                                                                   │  │
│  │  [💳 Record Payment]  [📧 Send Reminders]  [📊 View Trends]                      │  │
│  │                                                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```


---

# APPENDIX C: DATA MODELS & RELATIONSHIPS

## C.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            ENTITY RELATIONSHIP DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│                                                                                         │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐           │
│  │   CUSTOMERS     │         │     ORDERS      │         │  ORDER_ITEMS    │           │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤           │
│  │ id              │ 1     N │ id              │ 1     N │ id              │           │
│  │ name            │─────────│ customer_id     │─────────│ order_id        │           │
│  │ email           │         │ status          │         │ product_id      │           │
│  │ ...             │         │ total           │         │ variant_id      │           │
│  └─────────────────┘         │ created_at      │         │ quantity        │           │
│                              └─────────────────┘         │ price           │           │
│                                                          └─────────────────┘           │
│                                                                   │                     │
│                                                                   │ 1                   │
│                                                                   │                     │
│                                                                   ▼ N                   │
│                                                          ┌─────────────────┐           │
│                                                          │ MANUFACTURING   │           │
│                                                          │     JOBS        │           │
│                                                          ├─────────────────┤           │
│                              ┌───────────────────────────│ id              │           │
│                              │                           │ order_item_id   │           │
│                              │                     N   1 │ manufacturer_id │───────┐   │
│                              │              ┌────────────│ status          │       │   │
│                              │              │            │ due_date        │       │   │
│                              │              │            │ progress_pct    │       │   │
│                              │              │            └─────────────────┘       │   │
│                              │              │                     │                │   │
│                              │              │                     │ 1              │   │
│                              ▼              │                     │                │   │
│  ┌─────────────────┐  ┌─────────────────┐  │                     ▼ N              │   │
│  │ PRODUCT_FAMILIES│  │   PRODUCTS      │  │            ┌─────────────────┐       │   │
│  ├─────────────────┤  ├─────────────────┤  │            │   JOB_PHOTOS    │       │   │
│  │ id              │  │ id              │  │            ├─────────────────┤       │   │
│  │ code            │  │ name            │  │            │ id              │       │   │
│  │ name            │  │ product_family  │──┘            │ job_id          │       │   │
│  │ default_mfr_id  │  │ category_id     │               │ url             │       │   │
│  │ backup_mfr_id   │  │ mfr_override_id │               │ caption         │       │   │
│  └─────────────────┘  └─────────────────┘               └─────────────────┘       │   │
│          │                    │                                                    │   │
│          │ 1                  │                                                    │   │
│          │                    │                                                    │   │
│          ▼ N                  │                                                    │   │
│  ┌─────────────────┐         │                                                    │   │
│  │ PRODUCT_FAMILY_ │         │                                                    │   │
│  │ MANUFACTURERS   │         │                         ┌─────────────────┐       │   │
│  ├─────────────────┤         │                         │  MANUFACTURERS  │       │   │
│  │ id              │         │               ┌─────────├─────────────────┤◀──────┘   │
│  │ family_id       │         │               │         │ id              │           │
│  │ manufacturer_id │─────────┼───────────────┘         │ name            │           │
│  │ priority        │         │                         │ email           │           │
│  │ capabilities    │         │                         │ credit_limit    │           │
│  └─────────────────┘         │                         │ current_balance │           │
│                              │                         │ payment_terms   │           │
│                              │                         └─────────────────┘           │
│                              │                                  │                     │
│                              │                                  │ 1                   │
│                              │                                  │                     │
│                              │                                  ▼ N                   │
│                              │                         ┌─────────────────┐           │
│                              │                         │    INVOICES     │           │
│                              │                         ├─────────────────┤           │
│                              │                         │ id              │           │
│                              │                         │ manufacturer_id │           │
│                              │                         │ invoice_number  │           │
│                              │                         │ total_amount    │           │
│                              │                         │ due_date        │           │
│                              │                         │ status          │           │
│                              │                         └─────────────────┘           │
│                              │                                  │                     │
│                              │                                  │ 1                   │
│                              │                                  │                     │
│                              │                                  ▼ N                   │
│                              │                         ┌─────────────────┐           │
│                              │                         │ INVOICE_ITEMS   │           │
│                              │                         ├─────────────────┤           │
│                              └─────────────────────────│ id              │           │
│                                                        │ invoice_id      │           │
│                                                        │ job_id          │           │
│                                                        │ amount          │           │
│                                                        └─────────────────┘           │
│                                                                                       │
│                                                                                       │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐         │
│  │  FULFILLMENT    │         │    INBOUND      │         │   INVENTORY     │         │
│  │    CENTERS      │         │   SHIPMENTS     │         │                 │         │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤         │
│  │ id              │ 1     N │ id              │ 1     N │ id              │         │
│  │ code            │─────────│ fc_id           │─────────│ fc_id           │         │
│  │ name            │         │ manufacturer_id │         │ variant_id      │         │
│  │ address         │         │ tracking        │         │ qty_on_hand     │         │
│  └─────────────────┘         │ status          │         │ qty_reserved    │         │
│          │                   └─────────────────┘         └─────────────────┘         │
│          │ 1                          │                                              │
│          │                            │ 1                                            │
│          ▼ N                          │                                              │
│  ┌─────────────────┐                 ▼ N                                            │
│  │    OUTBOUND     │         ┌─────────────────┐                                    │
│  │   SHIPMENTS     │         │ INBOUND_ITEMS   │                                    │
│  ├─────────────────┤         ├─────────────────┤                                    │
│  │ id              │         │ id              │                                    │
│  │ fc_id           │         │ shipment_id     │                                    │
│  │ order_id        │         │ job_id          │                                    │
│  │ tracking        │         │ qty_expected    │                                    │
│  │ status          │         │ qty_received    │                                    │
│  └─────────────────┘         │ qc_status       │                                    │
│                              └─────────────────┘                                    │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## C.2 Key Relationships Explained

### Product → Manufacturer Resolution

The system determines which manufacturer should produce a product through a cascade:

```
1. Check: product.manufacturer_override_id
   └── If set, use this manufacturer

2. Check: product_category.manufacturer_override_id
   └── If set, use this manufacturer
   
3. Check: product_family.default_manufacturer_id
   └── If set, use this manufacturer
   
4. Check: product_family_manufacturers (sorted by priority)
   └── Use the first available manufacturer
   
5. Fallback: Flag for manual assignment
```

### Order → Manufacturing Job Split

When an order is processed:

```
Order with multiple items:
│
├── Item 1 (Product A, Family: WRESTLING)
│   └── Routes to: Hawk Mfg
│
├── Item 2 (Product B, Family: WRESTLING)  
│   └── Routes to: Hawk Mfg (same as Item 1)
│
├── Item 3 (Product C, Family: BASICS_TOPS)
│   └── Routes to: China Basics
│
└── Item 4 (Product D, Family: ELEVATED)
    └── Routes to: Turkey Premium

Result: 3 Manufacturing Jobs created
├── Job 1: Hawk Mfg (Items 1, 2)
├── Job 2: China Basics (Item 3)
└── Job 3: Turkey Premium (Item 4)
```

### Invoice → Payment Allocation

When payment is recorded:

```
Manufacturer has invoices:
├── Invoice #001: $1,000 (30 days old)
├── Invoice #002: $2,500 (15 days old)
└── Invoice #003: $1,500 (5 days old)

Payment received: $3,000

Auto-allocation (oldest first):
├── Invoice #001: $1,000 applied → PAID
├── Invoice #002: $2,000 applied → PARTIALLY_PAID ($500 remaining)
└── Invoice #003: $0 applied → unchanged

Manufacturer balance after: $2,000
```

---

## C.3 Status State Machines

### Manufacturing Job Status

```
                              ┌───────────────┐
                              │     NEW       │
                              │ (entry point) │
                              └───────┬───────┘
                                      │
                                      │ accept()
                                      ▼
                              ┌───────────────┐
                        ┌─────│   ACCEPTED    │
                        │     └───────┬───────┘
                        │             │
               reject() │             │ start_production()
                        │             ▼
                        │     ┌───────────────┐
                        │     │ IN_PRODUCTION │
                        │     └───────┬───────┘
                        │             │
                        │             │ complete_production()
                        │             ▼
                        │     ┌───────────────┐
                        │     │      QC       │◀───────────┐
                        │     └───────┬───────┘            │
                        │             │                     │
                        │    ┌────────┴────────┐           │
                        │    │                 │           │
                        │    │ pass_qc()       │ fail_qc() │
                        │    ▼                 └───────────┘
                        │ ┌───────────────┐
                        │ │ READY_TO_SHIP │
                        │ └───────┬───────┘
                        │         │
                        │         │ mark_shipped()
                        │         ▼
                        │ ┌───────────────┐
                        └▶│    SHIPPED    │
                          │ (terminal)    │
                          └───────────────┘
```

### Invoice Status

```
                              ┌───────────────┐
                              │     DRAFT     │
                              │ (auto-created)│
                              └───────┬───────┘
                                      │
                                      │ submit()
                                      ▼
                              ┌───────────────┐
                        ┌─────│   SUBMITTED   │─────┐
                        │     └───────────────┘     │
                        │                           │
               dispute()│                           │ approve()
                        │                           │
                        ▼                           ▼
                ┌───────────────┐          ┌───────────────┐
                │   DISPUTED    │          │   APPROVED    │
                └───────┬───────┘          └───────┬───────┘
                        │                          │
                resolve()│                         │ partial_pay()
                        │                          ▼
                        │                  ┌───────────────┐
                        │                  │PARTIALLY_PAID │
                        │                  └───────┬───────┘
                        │                          │
                        │                          │ pay_remaining()
                        │                          ▼
                        │                  ┌───────────────┐
                        └─────────────────▶│     PAID      │
                                           │ (terminal)    │
                                           └───────────────┘
```

### Inbound Shipment Status

```
                              ┌───────────────┐
                              │   EXPECTED    │
                              │(auto-created) │
                              └───────┬───────┘
                                      │
                                      │ in_transit()
                                      ▼
                              ┌───────────────┐
                              │  IN_TRANSIT   │
                              └───────┬───────┘
                                      │
                                      │ arrive()
                                      ▼
                              ┌───────────────┐
                              │    ARRIVED    │
                              └───────┬───────┘
                                      │
                                      │ start_inspection()
                                      ▼
                              ┌───────────────┐
                        ┌─────│  INSPECTING   │─────┐
                        │     └───────────────┘     │
                        │                           │
             all_fail() │                           │ all_pass()
                        │                           │
                        ▼                           ▼
                ┌───────────────┐          ┌───────────────┐
                │     ISSUE     │          │    STOCKED    │
                │(requires work)│          │  (terminal)   │
                └───────────────┘          └───────────────┘
```

---

## C.4 Audit Trail Design

### What Gets Logged

Every data mutation should create an audit record:

```
audit_logs table:
├── id (auto-increment)
├── timestamp (when)
├── actor_user_id (who)
├── actor_ip_address (from where)
├── entity_type (what kind of thing)
├── entity_id (which specific thing)
├── action (create, update, delete)
├── changes_json (what changed)
└── metadata_json (additional context)
```

### Change Tracking Format

For updates, store before and after:

```json
{
  "before": {
    "status": "ACCEPTED",
    "progress_percent": 45
  },
  "after": {
    "status": "IN_PRODUCTION",
    "progress_percent": 50
  },
  "changed_fields": ["status", "progress_percent"]
}
```

### Queryable Events

The audit log enables:
- "Who changed order #4521 status to SHIPPED?"
- "What changes were made yesterday?"
- "Show all actions by user X"
- "Show history of invoice #INV-001"
- "When was the credit limit changed for manufacturer Y?"

---

# APPENDIX D: GLOSSARY

## D.1 Business Terms

| Term | Definition |
|------|------------|
| **Product Family** | A grouping of products that share manufacturing characteristics and are typically produced by the same manufacturer |
| **MOQ** | Minimum Order Quantity - the smallest number of units a manufacturer will produce in a single order |
| **NET30/NET60** | Payment terms indicating payment is due 30 or 60 days from invoice date |
| **3PL** | Third-Party Logistics - external company that handles warehousing and shipping |
| **Inbound Shipment** | A shipment from a manufacturer TO the fulfillment center |
| **Outbound Shipment** | A shipment FROM the fulfillment center TO a customer |
| **QC** | Quality Control - inspection process to verify product quality |
| **Lead Time** | Number of days from order placement to completion |
| **Sublimation** | Printing method where ink is transferred to fabric using heat |
| **DTG** | Direct to Garment - printing method where ink is applied directly to fabric |
| **Cut & Sew** | Custom garment manufacturing from raw fabric |

## D.2 Technical Terms

| Term | Definition |
|------|------------|
| **Cascade** | A hierarchical lookup pattern where the system checks multiple levels until finding a value |
| **Feature Flag** | A configuration setting that enables or disables features without deploying new code |
| **Optimistic Update** | Updating the UI immediately before server confirmation, then rolling back if the server rejects |
| **Audit Log** | A record of all data changes for compliance and debugging |
| **Soft Delete** | Marking a record as inactive rather than permanently deleting it |
| **Idempotent** | An operation that produces the same result regardless of how many times it's executed |

## D.3 Status Definitions

### Manufacturing Job Statuses

| Status | Definition |
|--------|------------|
| **NEW** | Job has been created and is awaiting manufacturer acceptance |
| **ACCEPTED** | Manufacturer has confirmed they will fulfill this job |
| **IN_PRODUCTION** | Manufacturing has started |
| **QC** | Production complete, undergoing quality inspection |
| **READY_TO_SHIP** | QC passed, ready for shipment |
| **SHIPPED** | Has been shipped to fulfillment center or customer |

### Invoice Statuses

| Status | Definition |
|--------|------------|
| **DRAFT** | Invoice created but not yet submitted |
| **SUBMITTED** | Sent to admin for approval |
| **APPROVED** | Approved and added to payables |
| **PARTIALLY_PAID** | Some payment received, balance remaining |
| **PAID** | Fully paid |
| **DISPUTED** | Issue raised, under review |

### Inbound Shipment Statuses

| Status | Definition |
|--------|------------|
| **EXPECTED** | Shipment notification received, awaiting arrival |
| **IN_TRANSIT** | Carrier has package, tracking active |
| **ARRIVED** | Received at fulfillment center |
| **INSPECTING** | QC inspection in progress |
| **STOCKED** | All items passed QC and added to inventory |
| **ISSUE** | Problem found, requires resolution |


---

# APPENDIX E: ERROR HANDLING & EDGE CASES

## E.1 Manufacturing Error Scenarios

### Manufacturer Declines Job

**Scenario:** Manufacturer reviews job and cannot fulfill (materials unavailable, capacity full, etc.)

**Expected Behavior:**
1. Manufacturer clicks "Cannot Fulfill" with reason selection
2. System attempts to route to backup manufacturer
3. If backup available and has capacity, re-route job
4. If no backup available, create alert for admin
5. Admin manually reassigns or contacts customer

**UI Requirements:**
- Decline reason dropdown (materials, capacity, timeline, quality concerns, other)
- Optional notes field
- Confirmation dialog warning of impact
- Notification to admin

### Production Quality Issue

**Scenario:** During production, manufacturer discovers issue that will affect quality or timeline

**Expected Behavior:**
1. Manufacturer clicks "Report Issue"
2. Issue type selection (materials defect, equipment failure, design problem, etc.)
3. Impact assessment (minor delay, major delay, cannot complete)
4. Admin notified immediately
5. Job flagged with issue status
6. Communication thread created

**UI Requirements:**
- Issue type dropdown
- Severity selection (low, medium, high, critical)
- Photo upload for documenting issue
- Expected resolution timeline
- Option to request design clarification

### Manufacturer Goes Offline

**Scenario:** Manufacturer becomes unresponsive or unable to continue

**Expected Behavior:**
1. Admin can force-reassign job to another manufacturer
2. Previous manufacturer notified of reassignment
3. New manufacturer receives job with full history
4. Timeline adjusted for new manufacturer
5. Audit log records the reassignment

**Admin Actions:**
- View jobs by manufacturer
- Bulk reassign jobs
- Pause future routing to this manufacturer
- Document reason for reassignment

---

## E.2 Routing Error Scenarios

### No Manufacturer Available

**Scenario:** Product family has no available manufacturers

**Expected Behavior:**
1. System cannot auto-route the job
2. Job created with status PENDING_ASSIGNMENT
3. Admin alerted immediately
4. Dashboard shows pending assignment count
5. Admin manually selects manufacturer

**Possible Causes:**
- All assigned manufacturers over capacity
- All assigned manufacturers on hold (payment/quality issues)
- Product not assigned to any family
- Family has no manufacturers assigned

**Resolution:**
- Admin assigns manufacturer manually
- Admin adds new manufacturer to family
- Admin adjusts capacity limits
- Admin resolves payment/quality holds

### Capacity Limit Reached

**Scenario:** Preferred manufacturer at capacity limit

**Expected Behavior:**
1. System checks backup manufacturer
2. If backup available, routes to backup
3. Job flagged as "routed to backup"
4. Admin notified of capacity routing
5. Dashboard shows backup routing count

**Capacity Calculation:**
```
Available = max_concurrent_jobs - active_job_count
Where active_job_count = jobs NOT IN ('SHIPPED')
```

### Credit Limit Exceeded

**Scenario:** Job would push manufacturer over credit limit

**Expected Behavior (strict mode):**
1. Routing blocked
2. Admin alerted
3. Options: increase limit, make payment, route elsewhere

**Expected Behavior (warning mode):**
1. Routing proceeds with warning
2. Admin notified of over-limit situation
3. Manufacturing can proceed

**Configuration:**
- Per-manufacturer credit_hold_enabled flag
- Global setting for strict vs warning mode

---

## E.3 3PL Error Scenarios

### Shipment Not Received

**Scenario:** Expected shipment never arrives

**Expected Behavior:**
1. System tracks expected arrival date
2. After X days past expected, flag as potentially lost
3. Admin notified
4. Carrier tracking checked
5. Manufacturer contacted if needed

**Actions:**
- Contact carrier
- File claim if lost
- Re-manufacture if necessary
- Update order timeline

### QC Failure

**Scenario:** Inspection reveals quality issues

**Expected Behavior:**
1. Inspector documents issues with photos
2. Items flagged, not added to inventory
3. Manufacturer notified of failure
4. Options presented: rework, credit, replace
5. Issue resolution tracked

**QC Failure Types:**
- Wrong quantity (received ≠ expected)
- Quality defect (print, stitch, material)
- Wrong product (different than ordered)
- Damaged in transit
- Incomplete order

**Resolution Options:**
- Return to manufacturer for rework
- Accept with discount/credit
- Replace (new production)
- Partial accept (some items pass)

### Inventory Discrepancy

**Scenario:** Physical count doesn't match system

**Expected Behavior:**
1. Adjustment requires reason code
2. Larger adjustments require approval
3. All adjustments logged
4. Periodic reconciliation reports
5. Pattern analysis for recurring issues

**Reason Codes:**
- Count correction (cycle count)
- Damage/loss
- Sample/demo use
- Customer return
- Theft (requires investigation)
- System error

---

## E.4 Payment Error Scenarios

### Invoice Dispute

**Scenario:** Admin identifies issue with manufacturer invoice

**Expected Behavior:**
1. Admin marks invoice as "Disputed"
2. Dispute reason recorded
3. Manufacturer notified
4. Invoice removed from payment queue
5. Resolution tracked in notes

**Common Disputes:**
- Quantity mismatch
- Price disagreement
- Unauthorized charges
- Duplicate invoice
- Missing job reference

**Resolution:**
- Revised invoice from manufacturer
- Credit memo applied
- Partial payment with adjustment
- Invoice voided

### Payment Failure

**Scenario:** Wire/ACH payment fails

**Expected Behavior:**
1. Payment marked as failed
2. Allocations reversed
3. Invoices return to unpaid status
4. Admin notified
5. Retry or alternate method

**Failure Reasons:**
- Insufficient funds (our side)
- Invalid bank details
- Bank rejection
- Technical error

### Overpayment

**Scenario:** Payment exceeds invoice total

**Expected Behavior:**
1. Invoices fully paid
2. Remaining amount creates credit
3. Credit can be applied to future invoices
4. Or refund processed to manufacturer

---

## E.5 Onboarding Error Scenarios

### Application Abandoned

**Scenario:** Manufacturer starts application but doesn't complete

**Expected Behavior:**
1. Application saved as draft
2. After X days, reminder email sent
3. After Y days, marked as abandoned
4. Invite can be resent if needed

**Reminders:**
- Day 3: "Complete your application"
- Day 7: "Your application expires soon"
- Day 14: Marked as abandoned

### Document Validation Failure

**Scenario:** Uploaded documents don't meet requirements

**Expected Behavior:**
1. Admin reviews documents during approval
2. Specific issues noted
3. Application status → "Info Requested"
4. Manufacturer notified of specific needs
5. Can upload corrected documents

**Common Issues:**
- Document expired
- Document unreadable
- Wrong document type
- Missing information
- Questionable authenticity

### Duplicate Application

**Scenario:** Manufacturer already exists in system

**Expected Behavior:**
1. Check email/company during submission
2. Alert if potential duplicate found
3. Admin reviews both records
4. Merge or reject as appropriate

---

# APPENDIX F: NOTIFICATION SPECIFICATIONS

## F.1 Notification Types

### Manufacturing Notifications

| Event | Recipients | Channels | Priority |
|-------|-----------|----------|----------|
| New job assigned | Manufacturer | Email, In-app | High |
| Job approaching due date (48hr) | Manufacturer | Email, In-app | Medium |
| Job overdue | Manufacturer, Admin | Email, In-app | Critical |
| Job status changed | Admin | In-app | Low |
| Issue reported | Admin | Email, In-app | High |
| Job reassigned | Both manufacturers, Admin | Email, In-app | High |

### 3PL Notifications

| Event | Recipients | Channels | Priority |
|-------|-----------|----------|----------|
| Shipment expected | 3PL team | In-app | Low |
| Shipment arrived | Admin | In-app | Low |
| QC failed | Admin, Manufacturer | Email, In-app | High |
| Low inventory alert | Admin | Email, In-app | Medium |
| Outbound shipped | Customer | Email | Medium |

### Financial Notifications

| Event | Recipients | Channels | Priority |
|-------|-----------|----------|----------|
| Invoice submitted | Admin | In-app | Medium |
| Invoice approved | Manufacturer | Email, In-app | Medium |
| Payment received | Manufacturer | Email, In-app | High |
| Invoice overdue | Admin | Email, In-app | High |
| Credit limit warning | Admin | In-app | Medium |
| Credit hold applied | Admin, Manufacturer | Email, In-app | Critical |

### Onboarding Notifications

| Event | Recipients | Channels | Priority |
|-------|-----------|----------|----------|
| Application received | Admin | Email, In-app | Medium |
| Info requested | Applicant | Email | High |
| Application approved | Applicant | Email | High |
| Application rejected | Applicant | Email | High |
| Invite sent | Applicant | Email | High |
| Invite expiring | Applicant, Admin | Email | Medium |

---

## F.2 Notification Templates

### Email: New Job Assigned

**Subject:** New manufacturing job: Order #{orderNumber}

**Body:**
```
Hi {manufacturerName},

You have a new manufacturing job waiting for your review.

ORDER DETAILS:
Order Number: #{orderNumber}
Product: {productName}
Quantity: {quantity} units
Due Date: {dueDate}

REQUIRED ACTION:
Please log in to accept or review this job by {acceptDeadline}.

[View Job Details] (button)

Thank you for your partnership.

WholesaleOS Team
```

### Email: Job Overdue

**Subject:** ⚠️ OVERDUE: Order #{orderNumber} - Action Required

**Body:**
```
Hi {manufacturerName},

The following job is now OVERDUE and requires immediate attention:

ORDER DETAILS:
Order Number: #{orderNumber}
Product: {productName}
Original Due Date: {dueDate}
Days Overdue: {daysOverdue}
Current Status: {status}

REQUIRED ACTION:
Please update the job status or contact us immediately.

[View Job Details] (button)

If you're experiencing issues, please report them through the portal 
so we can assist.

WholesaleOS Team
```

### Email: Payment Received

**Subject:** Payment received - ${amount}

**Body:**
```
Hi {manufacturerName},

We've processed a payment to your account.

PAYMENT DETAILS:
Amount: ${amount}
Date: {paymentDate}
Reference: {referenceNumber}

INVOICES PAID:
{foreach invoice}
- Invoice #{invoiceNumber}: ${amountApplied}
{/foreach}

Current Balance: ${currentBalance}

[View Payment History] (button)

Thank you for your partnership.

WholesaleOS Team
```

### In-App Notification Format

```json
{
  "id": "notif_12345",
  "type": "job_overdue",
  "title": "Job Overdue",
  "message": "Order #4521 is overdue by 2 days",
  "priority": "critical",
  "icon": "alert-triangle",
  "action": {
    "label": "View Job",
    "url": "/manufacturer/jobs/123"
  },
  "timestamp": "2026-01-26T10:30:00Z",
  "read": false
}
```

---

## F.3 Notification Preferences

### Manufacturer Settings

Manufacturers can configure:
- Email notifications: on/off per type
- Notification digest: immediate vs daily summary
- Quiet hours: no notifications between X and Y
- Critical override: critical notifications always sent

### Admin Settings

Admins can configure:
- Which notification types to receive
- Email vs in-app preference
- Escalation contacts for critical issues

### Default Preferences

New accounts start with:
- All notifications enabled
- Email for high/critical priority
- In-app only for low/medium priority
- No quiet hours

---

## F.4 Notification Infrastructure

### Delivery Requirements

- Email: Must queue and retry on failure
- In-app: Real-time via WebSocket when user online
- Batching: Group similar notifications (e.g., multiple new jobs)
- Deduplication: Don't send same notification twice

### Tracking

Track for each notification:
- Sent timestamp
- Delivered (for email, track bounce/delivery)
- Opened/read timestamp
- Clicked (for emails with links)

### Retention

- In-app: Keep 90 days, then archive
- Email records: Keep 1 year
- User can clear read notifications


---

# APPENDIX G: IMPLEMENTATION CHECKLIST

## G.1 Pre-Implementation Checklist

Before starting implementation, ensure:

- [ ] All stakeholders have reviewed and approved this plan
- [ ] Development environment is set up
- [ ] Staging environment mirrors production
- [ ] Database backup strategy confirmed
- [ ] Test data prepared

## G.2 Phase-by-Phase Checklist

### Phase 1: Database & Schema

- [ ] Run migrations 001-008 in order
- [ ] Verify all tables created
- [ ] Seed product families
- [ ] Verify foreign key constraints
- [ ] Test rollback procedures

### Phase 2: Manufacturer Portal

- [ ] Build ManufacturerDashboard page
- [ ] Build ManufacturerKanban board
- [ ] Build JobDetailModal component
- [ ] Implement status transitions
- [ ] Add photo upload capability
- [ ] Test on mobile devices
- [ ] Verify with existing manufacturer data

### Phase 3: Catalog & Routing

- [ ] Build ProductFamily management UI
- [ ] Build manufacturer assignment interface
- [ ] Implement routing cascade logic
- [ ] Test order splitting
- [ ] Test fallback routing
- [ ] Build pending assignment queue

### Phase 4: 3PL System

- [ ] Build FulfillmentCenter management
- [ ] Build InboundShipment tracking
- [ ] Build QC inspection interface
- [ ] Build Inventory management
- [ ] Build OutboundShipment processing
- [ ] Test full inbound flow
- [ ] Test full outbound flow

### Phase 5: Onboarding

- [ ] Build public application form
- [ ] Build invite management
- [ ] Build document upload
- [ ] Build admin review interface
- [ ] Build approval workflow
- [ ] Test email notifications
- [ ] Test account creation

### Phase 6: Financial

- [ ] Build invoice management
- [ ] Build payment recording
- [ ] Build aging reports
- [ ] Implement auto-invoicing
- [ ] Test payment allocation
- [ ] Test credit limits

## G.3 Post-Implementation Checklist

After deployment:

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document any deviations from plan
- [ ] Update training materials
- [ ] Schedule post-launch review

---

# DOCUMENT END

## Document Information

| Field | Value |
|-------|-------|
| Document Title | WholesaleOS v5 Master Implementation Plan |
| Version | 1.0 |
| Last Updated | January 26, 2026 |
| Status | Ready for Implementation |
| Total Sections | 15 + 7 Appendices |
| Prepared For | Claude Code Autonomous Run |

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 26, 2026 | Claude | Initial comprehensive plan |

## Important Notes for Claude Code

1. **This document is DIRECTIONAL** - Use it as guidance, not as literal code to copy
2. **Study the existing codebase first** - Adapt implementations to existing patterns
3. **Enhanced spreadsheet styling** - Reuse existing Production Hub table component
4. **Test incrementally** - Don't build everything then test; test each piece
5. **Preserve existing functionality** - Don't break what already works
6. **Ask questions if unclear** - Better to clarify than assume

## Success Criteria

Implementation is successful when:

1. Manufacturers can log in and manage jobs through new portal
2. Orders auto-route to correct manufacturers based on product family
3. Split orders create multiple manufacturing jobs correctly
4. 3PL can receive, inspect, and ship goods
5. Financial system tracks invoices and payments
6. New manufacturers can apply and be onboarded
7. All existing functionality continues to work
8. Performance is equal or better than before

---

**END OF MASTER PLAN DOCUMENT**

