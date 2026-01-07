# API Contracts - WholesaleOS

This document defines the API contracts for all endpoints in the WholesaleOS system.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://<app-name>.replit.app`

## Authentication
All API endpoints (except health checks and public routes) require session-based authentication.

### Headers
```
Cookie: connect.sid=<session_id>
X-CSRF-Token: <csrf_token>
```

### Get CSRF Token
```
GET /api/auth/csrf-token
Response: { csrfToken: string }
```

---

## Auth Endpoints

### Get Current User
```
GET /api/auth/user
Response: User object
```

### Local Login
```
POST /api/auth/local/login
Body: { email: string, password: string }
Response: { message: string, user: User }
```

### Logout
```
POST /api/auth/logout
Response: { message: string }
```

---

## Orders API

### List Orders
```
GET /api/orders
Query: ?status=<status>&salespersonId=<id>&includeArchived=boolean
Response: Order[]
```

### Get Order
```
GET /api/orders/:id
Response: Order with lineItems, designJobs, manufacturing
```

### Create Order
```
POST /api/orders
Body: InsertOrder (orderName, orgId, salespersonId, status?, priority?, deliveryDate?)
Response: Order
```

### Update Order
```
PUT /api/orders/:id
Body: Partial<InsertOrder>
Response: Order
```

### Update Order Status
```
PUT /api/orders/:id/status
Body: { status: OrderStatus }
Response: Order
```

### Delete Order
```
DELETE /api/orders/:id
Response: { success: boolean }
```

### Order Line Items
```
GET /api/orders/:id/line-items
POST /api/orders/:id/line-items
Body: InsertOrderLineItem
PUT /api/order-line-items/:id
DELETE /api/order-line-items/:id
```

---

## Organizations API

### List Organizations
```
GET /api/organizations
Query: ?archived=boolean&clientType=<type>
Response: Organization[]
```

### Get Organization
```
GET /api/organizations/:id
Response: Organization with contacts
```

### Create Organization
```
POST /api/organizations
Body: InsertOrganization (name, city?, state?, clientType?, sports?)
Response: Organization
```

### Update Organization
```
PUT /api/organizations/:id
Body: Partial<InsertOrganization>
Response: Organization
```

### Archive/Unarchive Organization
```
PUT /api/organizations/:id/archive
PUT /api/organizations/:id/unarchive
Response: Organization
```

---

## Leads API

### List Leads
```
GET /api/leads
Query: ?stage=<stage>&ownerUserId=<id>
Response: Lead[]
```

### Get Lead
```
GET /api/leads/:id
Response: Lead with organization, contact
```

### Create Lead
```
POST /api/leads
Body: InsertLead (orgId?, contactId?, ownerUserId?, stage?, source?)
Response: Lead
```

### Update Lead
```
PUT /api/leads/:id
Body: Partial<InsertLead>
Response: Lead
```

### Delete Lead
```
DELETE /api/leads/:id
Response: { success: boolean }
```

---

## Contacts API

### List Contacts
```
GET /api/contacts
GET /api/organizations/:id/contacts
Response: Contact[]
```

### Create Contact
```
POST /api/contacts
Body: InsertContact (name, email?, phone?, orgId?, role?)
Response: Contact
```

### Update Contact
```
PUT /api/contacts/:id
Body: Partial<InsertContact>
Response: Contact
```

### Delete Contact
```
DELETE /api/contacts/:id
Response: { success: boolean }
```

---

## Design Jobs API

### List Design Jobs
```
GET /api/design-jobs
Query: ?includeArchived=boolean
Response: DesignJob[]
```

### Get Design Job
```
GET /api/design-jobs/:id
Response: DesignJob with comments
```

### Create Design Job
```
POST /api/design-jobs
Body: InsertDesignJob (orderId, designerId?, status?, designNotes?)
Response: DesignJob
```

### Update Design Job
```
PUT /api/design-jobs/:id
Body: Partial<InsertDesignJob>
Response: DesignJob
```

### Update Design Job Status
```
PUT /api/design-jobs/:id/status
Body: { status: DesignJobStatus }
Response: DesignJob
```

### Archive/Unarchive Design Job
```
PUT /api/design-jobs/:id/archive
PUT /api/design-jobs/:id/unarchive
Response: DesignJob
```

---

## Manufacturing API

### List Manufacturing Records
```
GET /api/manufacturing
GET /api/manufacturing/archived
Response: Manufacturing[]
```

### Get Manufacturing Record
```
GET /api/manufacturing/:id
Response: Manufacturing with updates
```

### Create Manufacturing Record
```
POST /api/manufacturing
Body: InsertManufacturing (orderId, status?, notes?)
Response: Manufacturing
```

### Update Manufacturing Record
```
PUT /api/manufacturing/:id
Body: Partial<InsertManufacturing>
Response: Manufacturing
```

### Archive/Unarchive Manufacturing
```
POST /api/manufacturing/:id/archive
PUT /api/manufacturing/:id/unarchive
Response: Manufacturing
```

---

## Finance API

### Invoices
```
GET /api/invoices
GET /api/invoices/:id
GET /api/invoices/organization/:orgId
POST /api/invoices
Body: InsertInvoice (orgId?, orderId?, amount, status?)
PATCH /api/invoices/:id
DELETE /api/invoices/:id
```

### Invoice Payments
```
GET /api/invoice-payments
GET /api/invoice-payments/:id
POST /api/invoice-payments
Body: InsertInvoicePayment (invoiceId, amount, paymentDate?)
PATCH /api/invoice-payments/:id
DELETE /api/invoice-payments/:id
```

### Commission Payments
```
GET /api/commission-payments
GET /api/commission-payments/:id
POST /api/commission-payments
Body: InsertCommissionPayment (salespersonId, amount, commissionIds?)
PATCH /api/commission-payments/:id
DELETE /api/commission-payments/:id
```

### Financial Overview
```
GET /api/financial/overview
Response: { totalRevenue, pendingInvoices, paidInvoices, totalCommissions }
```

---

## Catalog API

### Categories
```
GET /api/categories
GET /api/categories/:id
POST /api/categories
Body: InsertCategory (name, description?)
PUT /api/categories/:id
DELETE /api/categories/:id
```

### Products
```
GET /api/products
GET /api/products/:id
POST /api/products
Body: InsertProduct (name, categoryId?, basePrice?, description?)
PUT /api/products/:id
DELETE /api/products/:id
```

### Product Variants
```
GET /api/variants
GET /api/products/:productId/variants
POST /api/variants
Body: InsertProductVariant (productId, name, sku?)
PUT /api/variants/:id
DELETE /api/variants/:id
```

---

## Users API

### List Users
```
GET /api/users
Response: User[] (admin only)
```

### Get User
```
GET /api/users/:id
Response: User
```

### Create User
```
POST /api/users
Body: InsertUser (name, email, role, password?)
Response: User
```

### Update User
```
PUT /api/users/:id
Body: Partial<InsertUser>
Response: User
```

### Delete User
```
DELETE /api/users/:id
Response: { success: boolean }
```

---

## Notifications API

### Get Notifications
```
GET /api/notifications
Response: Notification[]
```

### Get Unread Count
```
GET /api/notifications/unread-count
Response: { count: number }
```

### Mark as Read
```
PATCH /api/notifications/:id/read
Response: Notification
```

### Mark All as Read
```
POST /api/notifications/mark-all-read
Response: { success: boolean }
```

---

## Permissions API

### Get User Permissions
```
GET /api/permissions/user-permissions
Response: { roles, resources, permissions }
```

### List Roles
```
GET /api/permissions/roles
Response: Role[] (admin only)
```

### List Resources
```
GET /api/permissions/resources
Response: Resource[] (admin only)
```

### Bulk Update Permissions
```
POST /api/permissions/bulk-update
Body: { updates: Array<{ roleId, resourceId, permissions }> }
Response: { success: boolean }
```

---

## Upload API

### Get Presigned URL for Image
```
POST /api/upload/image
Body: { filename: string, contentType: string }
Response: { uploadUrl: string, publicUrl: string }
```

### Get Presigned URL for File
```
POST /api/upload/file
Body: { filename: string, contentType: string }
Response: { uploadUrl: string, publicUrl: string }
```

---

## Health & System API

### Health Check
```
GET /api/health
Response: { status: "ok", timestamp: string }
```

### Readiness Check
```
GET /api/ready
Response: { status: "ok", database: "connected" }
```

### Dashboard Stats
```
GET /api/dashboard/stats
Response: Role-specific dashboard statistics
```

### Global Search
```
GET /api/search?q=<query>
Response: { orders: [], leads: [], organizations: [], contacts: [] }
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Human-readable error message",
  "errors": [/* Optional validation errors */]
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limits

- General API: 100 requests per minute per IP
- Auth endpoints: 5 attempts per 15 minutes per IP
