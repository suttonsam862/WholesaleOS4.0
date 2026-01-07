# Notifications Specification - WholesaleOS

This document defines the notification system architecture, triggers, and templates for WholesaleOS.

## Notification Channels

### 1. In-App Notifications
- Stored in `notifications` table
- Real-time display in notification bell
- Persisted until marked as read

### 2. Email Notifications
- Sent via SendGrid
- Triggered for critical events
- Template-based formatting

### 3. Future: SMS Notifications
- Planned for delivery updates
- Customer-facing only

---

## Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `info` | ℹ️ | Blue | General updates |
| `success` | ✓ | Green | Completed actions |
| `warning` | ⚠️ | Yellow | Attention needed |
| `error` | ✕ | Red | Failed operations |
| `action` | → | Purple | Requires user action |

---

## Order Workflow Triggers

### Order Placed (new)
**In-App:**
- To: Assigned Salesperson
- Title: "New Order Created"
- Message: "Order {orderCode} for {orgName} has been created."
- Type: info

**Email:**
- To: Organization primary contact (if exists)
- Subject: "Your Order Confirmation - {orderCode}"
- Template: order_confirmation

### Awaiting Sizes (waiting_sizes)
**In-App:**
- To: Assigned Salesperson
- Title: "Sizes Required"
- Message: "Order {orderCode} is waiting for size information."
- Type: action

**Email:**
- To: Customer contact
- Subject: "Size Information Needed - {orderCode}"
- Template: size_request

### Design Created (design_created)
**In-App:**
- To: Assigned Salesperson
- Title: "Design Ready for Review"
- Message: "Design for order {orderCode} is ready for approval."
- Type: action

**Email:**
- To: Customer contact
- Subject: "Design Ready for Your Approval - {orderCode}"
- Template: design_approval_request

### Sizes Confirmed (sizes_validated)
**In-App:**
- To: Ops team, Finance team
- Title: "Order Ready for Invoice"
- Message: "Order {orderCode} sizes confirmed. Ready for invoicing."
- Type: info

### Invoiced (invoiced)
**In-App:**
- To: Assigned Salesperson
- Title: "Invoice Sent"
- Message: "Invoice for order {orderCode} has been sent."
- Type: success

**Email:**
- To: Customer billing contact
- Subject: "Invoice #{invoiceNumber} - {orgName}"
- Template: invoice_sent
- Attachments: Invoice PDF

### In Production (production)
**In-App:**
- To: Assigned Salesperson, Manufacturing team
- Title: "Production Started"
- Message: "Order {orderCode} is now in production."
- Type: info

**Email:**
- To: Customer contact
- Subject: "Your Order is in Production - {orderCode}"
- Template: production_started

### Shipped (shipped)
**In-App:**
- To: Assigned Salesperson
- Title: "Order Shipped"
- Message: "Order {orderCode} has been shipped."
- Type: success

**Email:**
- To: Customer contact
- Subject: "Your Order Has Shipped - {orderCode}"
- Template: order_shipped
- Content: Tracking information

### Completed (completed)
**In-App:**
- To: Assigned Salesperson, Finance team
- Title: "Order Completed"
- Message: "Order {orderCode} has been marked as completed."
- Type: success

---

## Design Job Triggers

### Design Job Created
**In-App:**
- To: Assigned Designer
- Title: "New Design Assignment"
- Message: "You have been assigned design job {jobCode}."
- Type: action

### Design Job Status Change
**In-App:**
- To: Assigned Salesperson
- Title: "Design Status Update"
- Message: "Design job {jobCode} status changed to {status}."
- Type: info

### Design Approved
**In-App:**
- To: Assigned Designer
- Title: "Design Approved"
- Message: "Your design for {orderCode} has been approved!"
- Type: success

### Design Revision Requested
**In-App:**
- To: Assigned Designer
- Title: "Revision Requested"
- Message: "Revisions requested for design job {jobCode}."
- Type: warning

---

## Manufacturing Triggers

### Manufacturing Job Created
**In-App:**
- To: Assigned Manufacturer
- Title: "New Manufacturing Job"
- Message: "Order {orderCode} is ready for manufacturing."
- Type: action

### Manufacturing Status Update
**In-App:**
- To: Ops team, Assigned Salesperson
- Title: "Manufacturing Update"
- Message: "Manufacturing for {orderCode}: {status}."
- Type: info

### Quality Check Failed
**In-App:**
- To: Ops team, Admin
- Title: "QC Issue"
- Message: "Quality check failed for order {orderCode}."
- Type: error

---

## Finance Triggers

### Payment Received
**In-App:**
- To: Finance team, Assigned Salesperson
- Title: "Payment Received"
- Message: "Payment of ${amount} received for invoice #{invoiceNumber}."
- Type: success

**Email:**
- To: Customer billing contact
- Subject: "Payment Confirmation - Invoice #{invoiceNumber}"
- Template: payment_confirmation

### Invoice Overdue
**In-App:**
- To: Finance team, Assigned Salesperson
- Title: "Invoice Overdue"
- Message: "Invoice #{invoiceNumber} is {days} days overdue."
- Type: warning

**Email:**
- To: Customer billing contact
- Subject: "Payment Reminder - Invoice #{invoiceNumber}"
- Template: payment_reminder

### Commission Ready
**In-App:**
- To: Salesperson
- Title: "Commission Ready"
- Message: "Commission of ${amount} is ready for payout."
- Type: success

---

## User/System Triggers

### User Invitation Sent
**Email:**
- To: Invitee
- Subject: "You're Invited to Join WholesaleOS"
- Template: user_invitation
- Content: Setup link

### User Account Created
**In-App:**
- To: Admin
- Title: "New User Registered"
- Message: "{userName} has joined as {role}."
- Type: info

### Password Reset Request
**Email:**
- To: User
- Subject: "Password Reset Request"
- Template: password_reset
- Content: Reset link

---

## Email Templates

### order_confirmation
```
Subject: Your Order Confirmation - {orderCode}

Hello {contactName},

Thank you for your order! Here are the details:

Order Number: {orderCode}
Order Name: {orderName}
Delivery Date: {deliveryDate}

We'll notify you when your order moves to the next stage.

Best regards,
Rich Habits Team
```

### invoice_sent
```
Subject: Invoice #{invoiceNumber} - {orgName}

Hello {contactName},

Please find attached your invoice #{invoiceNumber} for ${amount}.

Due Date: {dueDate}

Payment Options:
- Bank Transfer
- Credit Card via {paymentLink}

Questions? Reply to this email.

Best regards,
Rich Habits Finance Team
```

### order_shipped
```
Subject: Your Order Has Shipped - {orderCode}

Hello {contactName},

Great news! Your order has shipped.

Order Number: {orderCode}
Tracking Number: {trackingNumber}
Carrier: {carrier}
Estimated Delivery: {estimatedDelivery}

Track your package: {trackingLink}

Best regards,
Rich Habits Team
```

---

## Implementation Notes

### Database Schema
```sql
notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
)
```

### API Endpoints
- `GET /api/notifications` - List user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read

### Event-Driven Architecture
Future enhancement: Implement event bus pattern where:
1. Business logic emits events (e.g., `order.status_changed`)
2. Notification service subscribes to events
3. Routes to appropriate channels based on user preferences

### User Preferences (Future)
- Email digest frequency (immediate, daily, weekly)
- Notification types to receive
- Preferred contact method per notification type
