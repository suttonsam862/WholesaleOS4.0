# Orders Workflow-First Redesign Spec (Primary Unit of Work)

## 1) Scope
### In scope (Orders-first)
- Redesign Orders as a workflow system that minimizes cognitive load for non-professional users.
- Replace the default "everything-on-one-screen" experience with:
  1) **Orders Hub** (task-first entry)
  2) **Queue Views** (filtered lists by workflow stage)
  3) **Order Detail** (progressive disclosure, stage-aware)

### In scope (follow-on, other pages)
- Apply the same navigation + IA pattern to other "everything-on-one-screen" areas using a reusable **TaskHub** pattern and consistent routing.

### Out of scope (initial implementation)
- Backend contract changes (optional later phase; keep a separate prompt if pursued).
- Data model changes.
- Rewriting core business logic inside existing modals/components unless necessary for routing and disclosure.

---

## 2) Current-State Facts (from provided audit)
- Primary Orders route: `/orders`
- Primary file: `client/src/pages/orders.tsx`
- Route registration: `client/src/lib/routesConfig.ts`
- Master-detail layout: `client/src/components/layout/split-view.tsx`
- Full detail modal: `client/src/components/OrderCapsule.tsx` (and related detail modal files)
- Data sources: React Query for:
  - `GET /api/orders`
  - `GET /api/organizations`
  - `GET /api/salespeople` (admin-only usage noted)
- Roles observed: `admin | sales | designer | ops | manufacturer | finance`
- Order statuses observed: `new | waiting_sizes | invoiced | production | shipped | completed`
- Current limitation: No URL-based selection or deep linking to an order; selection is in local component state.

---

## 3) Objectives
### Usability objectives (non-professional employees)
- **Task-first navigation**: users choose "what they need to do" before seeing dense data.
- **Single primary action** per stage (secondary actions hidden behind "More").
- **Progressive disclosure**: show only what's required to act; move everything else behind toggles/drawers/tabs.
- **Predictable routing**: URLs reflect stage and selection; back/forward works.

### Reliability objectives
- Reduce UI "glitchiness" by avoiding over-rendering and by minimizing state confusion (selection/filters in URL).

### Accessibility objectives
- Keyboard navigable routes and dialogs.
- Focus management on route changes/modals.
- Icon-only buttons have accessible names; status is conveyed via text (not only color).

---

## 4) Orders Information Architecture
### 4.1 New Orders Entry Model
Orders becomes the "main unit of work" via a hub → queue → detail system:

1) **Orders Hub** (`/orders`)
   - Large action tiles ("bubbles/cards") that match real workflow stages.
   - Each tile links to a queue view with pre-applied stage filters.
   - Shows counts per stage (computed from existing `/api/orders` results).

2) **Orders Queue** (`/orders/list?...`)
   - List view optimized for action:
     - simple card rows
     - minimal fields
     - stage-specific primary action
   - Filters are URL-driven, persistent, and shareable.
   - Selecting an order navigates to detail route (not local-only state).

3) **Order Detail** (`/orders/:id` or `/orders/:orderCode`)
   - Uses existing `OrderCapsule` where possible.
   - Default view is simplified (role + stage aware).
   - Advanced data/actions gated behind:
     - "More" menu
     - "Advanced" drawer
     - secondary sections collapsed by default

---

## 5) Workflow Stage Model (Orders)
### 5.1 Stage definitions
Stages are not new DB states; they are **views** computed from existing fields:
- `orders.status`
- `orders.sizesValidated`
- `orders.invoiceUrl`
- `orders.priority`
- `orders.estDelivery` (for overdue / risk)

Recommended stage list (IDs used in URLs/config):
1. `drafts`  
   Filter: `status === "new"`
2. `awaiting-sizes`  
   Filter: `status === "waiting_sizes" && sizesValidated === false`
3. `ready-to-invoice`  
   Filter: `status === "waiting_sizes" && sizesValidated === true && !invoiceUrl`
4. `ready-for-production`  
   Filter: `status === "invoiced"`
5. `in-production`  
   Filter: `status === "production"`
6. `shipped`  
   Filter: `status === "shipped"`
7. `completed`  
   Filter: `status === "completed"`
8. `issues`  
   Filter: "at risk" logic (e.g., high priority OR overdue delivery OR stuck state).  
   NOTE: exact "overdue" rules require confirmed business definitions; insufficient data to verify.

### 5.2 Stage → Primary action (examples)
Primary actions are stage-aware and role-aware:
- `drafts`: "Request Sizes" / "Send Portal Link" (sales/ops/admin)
- `awaiting-sizes`: "Validate Sizes" (ops/admin) OR "Resend Link" (sales)
- `ready-to-invoice`: "Create Invoice" (finance/admin)
- `ready-for-production`: "Start Production" (ops/admin)
- `in-production`: "Open Manufacturing" (ops/manufacturer/admin)
- `shipped`: "Add Tracking" / "Notify Customer" (ops/sales/admin)
- `completed`: "View Summary" (all roles)
- `issues`: "Triage" (ops/admin)

Actions must reuse existing endpoints/UI flows; do not invent new backend behavior.

---

## 6) URL + Routing Specification
### 6.1 Required routes
- `/orders` → Orders Hub (new)
- `/orders/list` → Orders Queue (new, list-only)
- `/orders/:id` → Order Detail (new)

Optional (if already supported by existing components):
- `/orders/kanban` → wraps existing `OrderColumns`
- `/orders/spreadsheet` → wraps existing `SpreadsheetTable`
- `/orders/new` → create flow (can still open modal)

### 6.2 Query param contract (Queue view)
All queue filters must be encoded in URL query params:
- `stage=<stageId>` (preferred primary filter)
- `status=new,waiting_sizes` (optional low-level)
- `priority=high,normal,low`
- `search=<string>`
- `salesperson=me|<id>` (admin/ops use cases)
- `view=list|kanban|spreadsheet` (optional)

Example:
- `/orders/list?stage=awaiting-sizes`
- `/orders/list?stage=awaiting-sizes&salesperson=me`
- `/orders/list?status=waiting_sizes&priority=high&search=leeds`

### 6.3 Selection + deep links
- Clicking an order in a queue navigates to `/orders/:id` (or `/orders/:orderCode`).
- Browser back returns to the same queue with filters intact.

---

## 7) UI Default Field Set (Queue + Detail)
### 7.1 Queue card default fields (minimize overwhelm)
- MUST: `orderCode`, `orderName`, `org.name`, `status`, `progress chips (design/sizes/deposit)`
- SHOULD: `priority` (only if high), `estDelivery` (only if set / near-term)
- HIDE by default: shipping/billing addresses, invoice links, folder links, totals, pricing detail

### 7.2 Detail default sections (progressive disclosure)
Default visible sections (collapsed rules vary by stage):
- "Next Action" block (stage-aware)
- "Progress" block (design/sizes/deposit)
- "Contact" block
- "Items summary" (count + top items; full size matrix behind expand)
Everything else behind "Details" / "Advanced".

---

## 8) Role-Aware Rendering Rules (minimal)
Do not redesign permissions; use existing permission functions and server enforcement. Only adjust visibility and defaults.

Recommended defaults:
- Sales: emphasize customer link + notes + next action; hide finance/manufacturing controls by default.
- Ops/Admin: show production transitions; show manufacturing access prominently when relevant.
- Finance: show invoice actions and totals; hide design/manufacturing by default.
- Manufacturer: emphasize production queue and manufacturing view; minimal order editing.

---

## 9) Implementation Strategy (Front-end, low risk)
### 9.1 Reuse existing components
Goal: do not rewrite logic; reorganize composition and routing:
- Reuse existing query hooks (`/api/orders`, `/api/organizations`, `/api/salespeople`).
- Reuse `OrderCapsule` for full detail until a simpler detail component is introduced.
- Extract list rendering from `orders.tsx` into a queue view without changing data contracts.

### 9.2 Configuration-driven stage system
Create a single stage configuration object:
- stageId → title/description → filter predicate → primary action definition → role visibility
Use it to:
- render hub tiles
- compute stage counts
- drive queue filtering
This is the primary mechanism that prevents "update mobile end every time" style duplication: changes happen in one config, not in many pages.

---

## 10) Accessibility Requirements
- Hub tiles are real buttons/links with visible focus rings.
- Primary actions are reachable by keyboard.
- Modals (OrderCapsule) trap focus; ESC closes.
- Status and milestones announced with text (not color-only).
- Icon-only controls have `aria-label`.

---

## 11) Performance Requirements (front-end only in initial phase)
- Debounce search input (suggested 250–350ms).
- Avoid O(n^2) joins on every render: pre-index `organizations` and `salespeople` into maps.
- Optionally add list virtualization if order count causes DOM weight issues (only if needed; do not add dependencies unless required).

Optional later phase:
- Pagination and server-side joins; separate prompt.

---

## 12) QA Checklist (Orders)
- Hub loads for each role; tiles visible match role.
- Clicking a tile lands on queue view with correct filter.
- Queue URL is shareable; refresh preserves filters.
- Clicking an order opens detail route; back returns to queue.
- Primary action per stage is present and does not expose unauthorized actions.
- Mobile: no horizontal scroll; tap targets usable; back navigation works.

---

## 13) Rollback Plan
- Routes can be reverted to point `/orders` back to the old page.
- New pages are additive; removing them is non-destructive.
- Avoid destructive refactors until routing is stable.
