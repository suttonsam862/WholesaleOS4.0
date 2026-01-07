# Operational Runbook - WholesaleOS

This document provides procedures for common operational tasks and incident response.

## Table of Contents
1. [Application Startup](#application-startup)
2. [Database Operations](#database-operations)
3. [User Management](#user-management)
4. [Monitoring & Health Checks](#monitoring--health-checks)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Deployment Procedures](#deployment-procedures)
7. [Backup & Recovery](#backup--recovery)
8. [Emergency Procedures](#emergency-procedures)

---

## Application Startup

### Development Environment
```bash
# Start the application
npm run dev

# This starts:
# - Express backend on port 5000
# - Vite dev server with HMR
# - Database connection
```

### Production Environment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables Required
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `SENDGRID_API_KEY` | Email service API key | For emails |
| `GOOGLE_API_KEY` | Gemini AI API key | For AI features |
| `GCS_BUCKET_NAME` | Cloud storage bucket | For file uploads |

---

## Database Operations

### Push Schema Changes
```bash
# Apply schema changes to database
npm run db:push
```

### Generate Migrations
```bash
# Create migration from schema changes
npx drizzle-kit generate:pg
```

### Seed Permissions
Permissions are auto-seeded on application startup if roles or resources are missing.

Manual seeding:
```bash
# Via API (requires admin auth)
POST /api/permissions/seed
```

### Check Database Health
```bash
# API endpoint
GET /api/ready

# Response
{ "status": "ok", "database": "connected" }
```

### Common SQL Operations

#### Check for Data Integrity Issues
```sql
-- Products with negative prices
SELECT id, name, base_price FROM products 
WHERE base_price IS NOT NULL AND base_price <= 0;

-- Orphaned order line items
SELECT oli.id FROM order_line_items oli
LEFT JOIN orders o ON oli.order_id = o.id
WHERE o.id IS NULL;

-- Orders missing salesperson
SELECT id, order_code FROM orders 
WHERE salesperson_id IS NULL;
```

#### User Promotion
```sql
-- Promote user to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## User Management

### Create Admin User
```bash
# Use the promote-user script
npx tsx server/promote-user.ts <email>
```

### Reset User Password
1. User requests password reset via UI
2. Email sent with reset link
3. User sets new password via link

### Disable User Account
```sql
UPDATE users SET is_active = false WHERE id = '<user_id>';
```

### Resend Invitation
```bash
# Via API (requires admin auth)
POST /api/invitations/resend/:id
```

---

## Monitoring & Health Checks

### Health Endpoints
| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Basic health | `{ status: "ok" }` |
| `GET /api/ready` | Database connectivity | `{ status: "ok", database: "connected" }` |
| `GET /health/details` | Detailed system status | System metrics |

### Key Metrics to Monitor
1. **Response Times** - API latency
2. **Error Rates** - 4xx and 5xx responses
3. **Database Connections** - Pool usage
4. **Memory Usage** - Node.js heap
5. **Active Sessions** - Concurrent users

### Log Locations
- Application logs: stdout (captured by Replit)
- Error logs: stderr
- Access logs: Express middleware

### Log Patterns to Watch
```
[LocalAuth] Login attempt    - Track login attempts
[CSRF] Token validation      - CSRF protection
Query Failed                 - Database issues
Rate limit exceeded          - Abuse detection
```

---

## Common Issues & Solutions

### Issue: "Query Failed" Toast
**Symptoms:** Red toast notification on frontend
**Cause:** API request failed

**Solution:**
1. Check browser DevTools Network tab
2. Identify failing endpoint
3. Check server logs for error details
4. Common causes:
   - Session expired → Re-login
   - Database connection → Check `/api/ready`
   - Permission denied → Check user role

### Issue: Delete Operation Fails
**Symptoms:** "Failed to delete" error
**Cause:** Foreign key constraint violation

**Solution:**
1. Check for dependent records
2. Either:
   - Delete dependent records first
   - Archive instead of delete
   - Add cascade delete (requires migration)

### Issue: Stale Data After Create/Edit
**Symptoms:** New items don't appear immediately
**Cause:** React Query cache not invalidated

**Solution:**
1. Verify query key format (array segments, not template strings)
2. Check mutation's `onSuccess` invalidates correct keys
3. Force refresh: `queryClient.invalidateQueries(['key'])`

### Issue: Session Lost on Refresh
**Symptoms:** User logged out unexpectedly
**Cause:** Session not persisting

**Solution:**
1. Check `SESSION_SECRET` is consistent
2. Verify session store (PostgreSQL) is accessible
3. Check session cookie settings for production domain

### Issue: Email Not Sending
**Symptoms:** No invitation/notification emails
**Cause:** SendGrid configuration

**Solution:**
1. Verify `SENDGRID_API_KEY` is set
2. Check SendGrid dashboard for errors
3. Verify sender email is verified in SendGrid
4. Check spam folders

### Issue: File Upload Fails
**Symptoms:** Upload hangs or errors
**Cause:** Storage configuration

**Solution:**
1. Verify `GCS_BUCKET_NAME` is set
2. Check bucket permissions
3. Verify file size limits
4. Check presigned URL generation

---

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Schema changes reviewed
- [ ] Environment variables configured
- [ ] Backup current state

### Deployment Steps (Replit)
1. Push code to main branch
2. Replit auto-deploys
3. Monitor logs for startup errors
4. Verify health check: `GET /api/ready`
5. Test critical flows manually

### Post-Deployment Verification
1. Login as test user
2. Create test order
3. Verify dashboard loads
4. Check email delivery
5. Verify file uploads

### Rollback Procedure
1. Use Replit's checkpoint system
2. Select previous working checkpoint
3. Restore files and database
4. Verify system stability

---

## Backup & Recovery

### Database Backups
- Neon provides automatic point-in-time recovery
- Branch feature for safe testing

### Manual Export
```bash
# Export production data (read-only)
npx tsx server/export-production-data.ts
```

### Import Data
```bash
# Import to development
npx tsx server/import-production-data.ts
```

### Recovery Steps
1. Identify the issue and scope
2. Select recovery point (checkpoint/backup)
3. Restore database to that point
4. Deploy matching code version
5. Verify data integrity
6. Resume operations

---

## Emergency Procedures

### Complete System Outage
1. Check Replit status page
2. Check Neon database status
3. Review recent deployments
4. Use rollback if recent change caused issue
5. Contact Replit support if infrastructure issue

### Database Unreachable
1. Check `DATABASE_URL` is correct
2. Verify Neon project is active
3. Check connection limits
4. Restart application
5. Contact Neon support if persistent

### Security Incident
1. Immediately disable compromised accounts
2. Rotate `SESSION_SECRET`
3. Invalidate all sessions (restart app)
4. Review access logs
5. Assess data exposure
6. Notify affected users if required

### Data Corruption
1. Stop all write operations (set maintenance mode)
2. Identify corruption scope
3. Restore from last known good backup
4. Apply missing transactions if possible
5. Verify data integrity
6. Resume operations

---

## Contact Information

### Replit Support
- Platform issues: Replit Help Center
- Database issues: Neon Support

### Internal Escalation
1. On-call developer
2. Technical lead
3. CTO

---

## Maintenance Windows

### Recommended
- Weekdays: 6 AM - 8 AM (low traffic)
- Weekends: Anytime with notice

### Pre-Maintenance
- Notify users of planned downtime
- Complete pending transactions
- Create checkpoint/backup

### Post-Maintenance
- Verify system health
- Monitor for issues (30 min)
- Confirm with stakeholders
