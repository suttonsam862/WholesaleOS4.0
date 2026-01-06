# Audit Plan for WholesaleOS

This document defines the tasks to fix all issues identified in the comprehensive audit. Each task should be implemented sequentially, according to the given order.

## 0. Program Control Layer
- [ ] Define “Done” and create `DEFINITION_OF_DONE.md`.
- [ ] Create `RBAC_MATRIX.md`, `ORDER_STATUS_SPEC.md`, `API_CONTRACTS.md`, `DB_SCHEMA_SPEC.md`, `NOTIFICATIONS_SPEC.md`, `TEST_PLAN.md`, `RUNBOOK.md`.

## 1. Product Workflow Canonicalization
- [ ] Implement canonical order lifecycle with statuses: Order Placed → Awaiting Sizes → Design Created → Sizes Confirmed → Invoice Sent/Paid → In Production → Production Completed → Shipped/Delivered → Completed. Write details in `ORDER_STATUS_SPEC.md`.
- [ ] Implement customer portal workflow: invites, profile creation, order tracking; define actions per stage.
- [ ] Implement design workflow: design job creation, revisions, approval gating.
- [ ] Implement production/manufacturing workflow: job creation, updates, QC, completion rules.
- [ ] Implement payment workflow: invoice creation, payment milestones, reconciliation.
- [ ] Implement shipping/delivery workflow: shipments, tracking, delivered statuses.

## 2. Data Model & Data Integrity
- [ ] Define canonical entities and their relationships; create `DB_SCHEMA_SPEC.md`.
- [ ] Define data contracts for API and front-end; create `API_CONTRACTS.md`.
- [ ] Add referential integrity constraints (foreign keys, unique constraints, check constraints).
- [ ] Create migration scripts to backfill existing data and apply constraints; implement daily data quality checks.

## 3. RBAC, Permissions, and Security Model
- [ ] Unify the permissions system with a single source of truth; implement DB-driven RBAC.
- [ ] Define roles: Admin, Sales, Design, Ops, Manufacturing, Finance, Customer.
- [ ] Create `RBAC_MATRIX.md` listing resources and permitted actions per role.
- [ ] Harden authentication (choose single method, fix Replit/local auth, token security).
- [ ] Implement consistent authorization middleware in the backend.

## 4. CRUD Reliability & Error Handling
- [ ] Implement global error handling and standardized error responses on the backend.
- [ ] Implement frontend error handling: standardized API client wrapper, user-friendly error messages.
- [ ] Fix stale data and cache invalidation using standardized query keys.
- [ ] Implement concurrency/conflict handling and idempotent bulk operations.

## 5. Notifications & Communications
- [ ] Build event-driven notification system with email, SMS, and in-app channels.
- [ ] Define notification templates and triggers per workflow stage in `NOTIFICATIONS_SPEC.md`.
- [ ] Implement unified communication thread per order.

## 6. File/Image Handling & Storage
- [ ] Define storage model (buckets, ACL) and implement secure upload handling (server-side file type validation, size limits, virus scanning).
- [ ] Implement quarantine → approved pipeline and asset versioning.

## 7. UI/UX Simplification by Role
- [ ] Create role-specific dashboards and navigation.
- [ ] Consolidate duplicate pages (orders list, detail, etc.).
- [ ] Standardize UI components (badges, forms, modals).
- [ ] Ensure accessibility and mobile-friendly responsive design.

## 8. Performance, Scale, and Cost Efficiency
- [ ] Define scale requirements and database scaling plan.
- [ ] Optimize queries, implement pagination, and background jobs.
- [ ] Reduce bundle size via code splitting and virtualization.

## 9. Testing, QA, and Release Discipline
- [ ] Develop a test strategy with unit, integration, and E2E tests; create `TEST_PLAN.md`.
- [ ] Set up staging environment and automated CI pipeline.
- [ ] Implement error monitoring and metrics dashboards.
- [ ] Define release process and rollback procedure.

## 10. Cleanup, Debt, and Deletion
- [ ] Identify and remove dead pages and unused code.
- [ ] Refactor monolithic components and repeated logic.
- [ ] Consolidate documentation.

---

**Execution guidelines**: Each task should be done in order. Use Plan Mode to scope changes first, then Build Mode to implement. Cross-reference the relevant spec docs. Commit each change with a clear message.
