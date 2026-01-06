# DB Schema Specification - WholesaleOS

## Core Entities

### Users
- `id` (serial): Primary Key
- `username` (text): Unique
- `password` (text): Hashed
- `role` (text): Enum (admin, sales, designer, ops, manufacturer, finance)
- `email` (text): Unique

### Orders
- `id` (serial): Primary Key
- `orderCode` (text): Unique internal reference
- `orderName` (text)
- `status` (text): Default 'new'
- `salespersonId` (integer): FK to Users
- `organizationId` (integer): FK to Organizations
- `priority` (text): Default 'normal'

### Order Line Items
- `id` (serial): Primary Key
- `orderId` (integer): FK to Orders
- `variantId` (integer): FK to Product Variants
- `yxs` to `xxxxl` (integer): Size quantities
- `unitPrice` (decimal)

### Design Jobs
- `id` (serial): Primary Key
- `orderId` (integer): FK to Orders
- `designerId` (integer): FK to Users
- `status` (text): Enum (pending, in_progress, review, approved)

### Manufacturing Records
- `id` (serial): Primary Key
- `orderId` (integer): FK to Orders (Unique)
- `manufacturerId` (integer): FK to Users
- `status` (text)

## Integrity Constraints
- Every `orderId` must exist in the `orders` table.
- Each `order` can have at most one `manufacturing` record.
- Deleting an `order` cascades to `line_items`, `design_jobs`, and `manufacturing`.
