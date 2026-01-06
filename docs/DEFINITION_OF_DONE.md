# Definition of Done (DoD) - WholesaleOS

This document defines the criteria that must be met for a feature or task to be considered "Done" in the WholesaleOS ERP system.

## 1. Functional Requirements
- [ ] Feature meets all requirements outlined in the user story or task description.
- [ ] All edge cases (empty states, error states, large data sets) are handled.
- [ ] Role-based access control (RBAC) is enforced for the feature.
- [ ] Feature works correctly on both mobile and desktop views.

## 2. Technical Quality
- [ ] Code follows project conventions and style guidelines.
- [ ] Data models are updated in `shared/schema.ts` and synced with the database.
- [ ] API endpoints are validated using Zod schemas.
- [ ] Frontend state management uses TanStack Query with standardized query keys.
- [ ] No new TypeScript or LSP errors introduced.

## 3. UI/UX & Accessibility
- [ ] UI components use standard Shadcn/ui patterns.
- [ ] Accessibility warnings (e.g., missing dialog descriptions) are resolved.
- [ ] Interactive elements have appropriate `data-testid` attributes.
- [ ] Touch targets are at least 44x44px for mobile users.

## 4. Documentation & Maintenance
- [ ] Architecture changes are documented in `replit.md`.
- [ ] New environment variables or secrets are requested and documented.
- [ ] Unused code or legacy endpoints are removed.

## 5. Verification
- [ ] Manual end-to-end testing confirms the feature works as expected.
- [ ] Build process completes without errors.
- [ ] Database schema is synced using `npm run db:push`.
