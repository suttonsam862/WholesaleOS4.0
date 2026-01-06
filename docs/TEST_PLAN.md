# Test Plan - WholesaleOS

## 1. Strategy
- **Unit Tests**: Logic in `shared/schema.ts` and utility functions.
- **Integration Tests**: API endpoints in `server/routes/`.
- **E2E Tests**: Critical user journeys (Order Creation, Design Approval, Production Update).

## 2. Priority Scenarios
1. **Auth & RBAC**: Ensure 'sales' cannot see 'finance' data; 'manufacturer' can only update assigned jobs.
2. **Order Lifecycle**: Verify status transitions follow the defined workflow.
3. **Data Integrity**: Ensure required fields trigger validation errors and invalid foreign keys fail.
4. **Mobile Responsiveness**: Verify touch targets and layout on mobile viewports.

## 3. Tooling
- **Frontend**: Vitest + React Testing Library.
- **Backend**: Supertest.
- **E2E**: Playwright (where available).
