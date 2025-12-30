# Comprehensive Error List - Rich Habits ERP

**Document Version:** 1.0  
**Last Updated:** 2024-12-30  
**Status:** Active Error Remediation Tracking

This document tracks all identified errors, their status, and remediation plans for the Rich Habits ERP system.

---

## Summary

| Category | Total Issues | Fixed | Pending | Deferred |
|----------|-------------|-------|---------|----------|
| TypeScript/LSP Errors | 12 | 12 | 0 | 0 |
| Security Issues | 3 | 3 | 0 | 0 |
| Database Integrity | 8 | 0 | 0 | 8 |
| Error Handling | 4 | 0 | 0 | 4 |
| Architecture | 5 | 0 | 0 | 5 |
| Code Quality | 4 | 0 | 0 | 4 |
| UI/UX | 4 | 0 | 0 | 4 |
| **Total** | **40** | **15** | **0** | **25** |

---

## 1. TypeScript/LSP Errors (FIXED)

### 1.1 Schema Insert Schema Type Errors (12 errors - FIXED)

**Status:** ✅ FIXED  
**Location:** `shared/schema.ts`  
**Root Cause:** Drizzle-zod `createInsertSchema()` with custom refinements + `.omit()` chaining causes type inference issues with `generatedAlwaysAsIdentity()` fields.

**Solution Applied:**  
Restructured insert schemas to use `.omit()` on base schema BEFORE `.extend()` for refinements:

```typescript
// BEFORE (broken):
export const insertFabricSchema = createInsertSchema(fabrics, {
  name: z.string().min(1, "required"),
}).omit({ id: true, createdAt: true }); // Type error

// AFTER (fixed):
export const insertFabricSchema = createInsertSchema(fabrics).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "required"),
});
```

**Affected Schemas Fixed:**
1. `insertRequestSchema`
2. `insertManufacturerJobSchema`
3. `insertManufacturerEventSchema`
4. `insertSizeAdjustmentRequestSchema`
5. `insertFabricSchema`
6. `insertProductVariantFabricSchema`
7. `insertFabricSubmissionSchema`
8. `insertPantoneAssignmentSchema`
9. `insertQuickActionLogSchema`
10. `insertAiDesignSessionSchema`
11. `insertTourMerchBundleSchema`
12. `insertPrintfulSyncRecordSchema`

---

## 2. Security Issues (FIXED)

### 2.1 CSRF Protection (FIXED)

**Status:** ✅ FIXED (Already Implemented)  
**Location:** `server/routes/index.ts` line 53, `server/middleware/csrf.middleware.ts`

**Implementation:**
- Global CSRF protection middleware applied to all routes
- CSRF token endpoint at `/api/auth/csrf-token`
- Skip list for safe methods (GET, HEAD, OPTIONS) and public endpoints

### 2.2 Auth Rate Limiting (FIXED)

**Status:** ✅ FIXED (Already Implemented)  
**Location:** `server/routes/auth.routes.ts` line 21

**Implementation:**
- Login endpoint protected with `authRateLimiter`
- 5 attempts per 15 minutes per IP

### 2.3 General API Rate Limiting (FIXED)

**Status:** ✅ FIXED  
**Location:** `server/routes/index.ts` line 50

**Implementation Added:**
- Applied `apiRateLimiter` to all `/api` routes
- 100 requests per minute per IP
- Prevents general API abuse

---

## 3. Database Integrity Issues (DEFERRED - Requires Data Assessment)

⚠️ **WARNING:** These issues are DEFERRED because adding constraints to an existing database with data could cause failures if existing records violate the new constraints.

### Prerequisites Before Implementation:
1. Run data quality assessment queries
2. Identify and remediate violating records
3. Create migration scripts with rollback capability
4. Test on staging environment first

### 3.1 Missing Positive Price Constraints

**Status:** 🔶 DEFERRED  
**Risk Level:** HIGH  
**Tables Affected:** `products`, `order_line_items`, `quotes`

**Required Constraint:**
```sql
ALTER TABLE products ADD CONSTRAINT positive_base_price CHECK (base_price > 0);
ALTER TABLE quote_line_items ADD CONSTRAINT positive_unit_price CHECK (unit_price > 0);
```

**Data Assessment Query (Run First):**
```sql
SELECT id, name, base_price FROM products WHERE base_price IS NOT NULL AND base_price <= 0;
SELECT id, unit_price FROM quote_line_items WHERE unit_price IS NOT NULL AND unit_price <= 0;
```

### 3.2 Missing Quantity Constraints

**Status:** 🔶 DEFERRED  
**Risk Level:** HIGH  
**Tables Affected:** `order_line_items`, `order_form_line_item_sizes`

**Required Constraint:**
```sql
ALTER TABLE order_line_items ADD CONSTRAINT positive_quantities 
  CHECK (s >= 0 AND m >= 0 AND l >= 0 AND xl >= 0 AND xxl >= 0);
```

**Data Assessment Query (Run First):**
```sql
SELECT id FROM order_line_items 
WHERE s < 0 OR m < 0 OR l < 0 OR xl < 0 OR xxl < 0;
```

### 3.3 Missing Date Validation Constraints

**Status:** 🔶 DEFERRED  
**Risk Level:** MEDIUM  
**Tables Affected:** `quotes`, `events`

**Required Constraint:**
```sql
ALTER TABLE quotes ADD CONSTRAINT future_valid_until CHECK (valid_until >= created_at);
```

### 3.4 Cascade Delete Configurations

**Status:** 🔶 DEFERRED  
**Risk Level:** HIGH  

**Relationships Needing Review:**
| Parent Table | Child Table | Current Behavior | Recommended |
|-------------|-------------|------------------|-------------|
| orders | orderLineItems | None (orphan risk) | CASCADE |
| orders | customerComments | None | CASCADE |
| organizations | contacts | None | SET NULL |
| leads | designJobs | None | SET NULL |
| teamStores | teamStoreLineItems | None | CASCADE |

**Assessment Required:** Document downstream dependencies before changing cascade behavior.

### 3.5-3.8 Additional Data Integrity Gaps

**Status:** 🔶 DEFERRED

- Email uniqueness enforcement for `users.email`
- Organization name length constraints
- Order code unique index verification
- Manufacturing batch status state machine validation

---

## 4. Error Handling Issues (DEFERRED - Requires Large Refactor)

### 4.1 Inconsistent Async Error Handling

**Status:** 🔶 DEFERRED  
**Impact:** HIGH - Potential unhandled promise rejections can crash server  
**Effort:** LARGE - 300+ route handlers affected

**Current State:**
- `asyncHandler` utility exists at `server/middleware/errorHandler.middleware.ts`
- **0 routes** currently use the asyncHandler wrapper
- 300+ async route handlers use inconsistent error patterns

**Pattern Analysis:**
| Pattern | Count | Risk |
|---------|-------|------|
| `asyncHandler(async (req, res) => {...})` | 0 | LOW (correct) |
| `try/catch with next(error)` | ~50 | LOW |
| `try/catch with res.status().json()` | ~200 | MEDIUM |
| No error handling | ~50 | HIGH |

**Recommended Fix:**
Wrap all async route handlers with `asyncHandler`:

```typescript
// Import the utility
import { asyncHandler } from '../middleware/errorHandler.middleware';

// Wrap handlers
app.get('/api/orders', asyncHandler(async (req, res) => {
  const orders = await storage.getOrders();
  res.json(orders);
}));
```

**Implementation Plan:**
1. Create a migration script to wrap high-risk routes first
2. Prioritize routes without any try/catch
3. Test each module after refactoring

### 4.2 Global Error Handler Not Registered

**Status:** 🔶 NEEDS VERIFICATION  
**Location:** `server/index.ts`

Verify `globalErrorHandler` is registered as the LAST middleware.

### 4.3 Process Error Handlers

**Status:** 🔶 NEEDS VERIFICATION  
**Location:** `server/middleware/errorHandler.middleware.ts`

Verify `setupProcessErrorHandlers()` is called at server startup.

### 4.4 Query Client Error Handling

**Status:** 🔶 DEFERRED  
**Location:** `client/src/lib/queryClient.ts`

- No global error handling for failed queries
- Missing query key factory pattern
- Default stale time may cause excessive refetching

---

## 5. Architecture Issues (DEFERRED)

### 5.1 Routing Duplication

**Status:** 🔶 DEFERRED  
**Impact:** Technical debt, maintenance burden

**Duplicate Page Patterns Found:**
- `/orders` (old) + `/orders-hub` (new) + `/orders-list` (new)
- Similar duplication for: leads, organizations, catalog, design-jobs, manufacturing

**Recommendation:** Audit and consolidate duplicate routes after confirming new pages are complete.

### 5.2 Permission System Fragmentation

**Status:** 🔶 DEFERRED  
**Locations:**
- `server/permissions.ts` (static)
- Database tables: roles, resources, rolePermissions
- `client/src/lib/permissions.ts` (static frontend copy)

**Issue:** Three separate permission implementations with no single source of truth.

### 5.3-5.5 Additional Architecture Issues

- Massive component files (OrderCapsule.tsx, orders.tsx, manufacturing.tsx)
- Duplicate business logic in modal components
- Missing shared form hooks and validation schemas

---

## 6. Code Quality Issues (DEFERRED)

### 6.1 Oversized Components

**Files Requiring Breakdown:**
- `client/src/components/OrderCapsule.tsx` (~800+ lines)
- `client/src/pages/orders.tsx` (~500+ lines)
- `client/src/pages/manufacturing.tsx` (~500+ lines)

### 6.2 Duplicate Modal Logic

**Location:** `client/src/components/modals/`

Same validation and data fetching patterns duplicated across 30+ modals.

### 6.3 Missing Shared Utilities

**Should Exist:**
- `useResourceForm<T>` hook
- `ResourceFormModal<T>` wrapper
- Centralized query key factory

### 6.4 Query Client Configuration

**Location:** `client/src/lib/queryClient.ts`

- No query key constants/factory
- Missing optimistic update helpers
- Missing mutation error recovery patterns

---

## 7. UI/UX Issues (DEFERRED)

### 7.1 Design System Inconsistencies

- 15+ badge variants with different color schemes
- Mixed spacing patterns (Tailwind classes inconsistent)
- Hardcoded colors vs theme colors mixed

### 7.2 Mobile Responsiveness

- Horizontal scroll on some modals
- SpreadsheetTable.tsx breaks on narrow screens
- Fixed-width components using `w-[500px]` instead of `max-w-[500px]`

### 7.3 Accessibility Gaps

- Missing aria-labels on icon-only buttons
- Color-only status indicators
- Keyboard navigation breaks in complex modals

### 7.4 Loading States

- Error boundaries exist but no loading boundaries
- Inconsistent loading indicators across pages

---

## Implementation Priority Matrix

| Priority | Category | Items | Effort | Risk |
|----------|----------|-------|--------|------|
| ✅ DONE | TypeScript | 12 schema errors | LOW | LOW |
| ✅ DONE | Security | CSRF, Rate Limiting | LOW | LOW |
| 🔶 HIGH | Error Handling | asyncHandler adoption | MEDIUM | MEDIUM |
| 🔶 MEDIUM | Database | Data assessment queries | LOW | LOW |
| 🔶 MEDIUM | Database | Constraint implementation | MEDIUM | HIGH |
| 🔶 LOW | Architecture | Route consolidation | HIGH | MEDIUM |
| 🔶 LOW | Code Quality | Component refactoring | HIGH | LOW |
| 🔶 LOW | UI/UX | Accessibility fixes | MEDIUM | LOW |

---

## Next Steps

### Immediate (This Sprint)
1. ✅ Complete TypeScript error fixes
2. ✅ Verify security middleware is active
3. Run data quality assessment queries (Section 3)
4. Document any data violations found

### Short-term (Next Sprint)
1. Apply `asyncHandler` to highest-risk routes
2. Verify global error handler registration
3. Create data remediation scripts for constraint violations

### Medium-term (Future Sprints)
1. Add database constraints after data cleanup
2. Consolidate duplicate routes
3. Begin component refactoring

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-30 | 1.0 | Initial document - 15 issues fixed, 25 documented for future |
