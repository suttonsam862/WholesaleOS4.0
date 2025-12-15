import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  varchar,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  decimal,
  date,
  jsonb,
  index
} from "drizzle-orm/pg-core";

// PostgreSQL Enum Types for order status and priority
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "waiting_sizes",
  "invoiced",
  "production",
  "shipped",
  "completed",
  "cancelled",
]);

export const orderPriorityEnum = pgEnum("order_priority", [
  "low",
  "normal",
  "high",
]);
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().$type<"admin" | "sales" | "designer" | "ops" | "manufacturer" | "finance">(),
  passwordHash: varchar("password_hash"),
  isActive: boolean("is_active").default(true),
  phone: varchar("phone"),
  active: boolean("active").default(true), // Legacy field - use isActive instead
  avatarUrl: varchar("avatar_url"),
  // Invitation system fields
  isInvited: boolean("is_invited").default(false),
  hasCompletedSetup: boolean("has_completed_setup").default(false),
  invitedAt: timestamp("invited_at"),
  invitedBy: varchar("invited_by").references((): any => users.id),
  // Feature flags
  salesMapEnabled: boolean("sales_map_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invitations table for tracking invitation tokens
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  email: varchar("email").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().$type<"admin" | "sales" | "designer" | "ops" | "manufacturer" | "finance">(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").$type<"pending" | "accepted" | "expired" | "cancelled">().default("pending").notNull(),
  userId: varchar("user_id").references(() => users.id),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  emailSentSuccessfully: boolean("email_sent_successfully").default(false),
  emailError: text("email_error"),
  retryCount: integer("retry_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table for in-app notifications
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().$type<"info" | "success" | "warning" | "error" | "action">().default("info"),
  isRead: boolean("is_read").default(false),
  link: varchar("link"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("idx_notifications_user_id").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
]);

// Permission Management Tables

// Roles table - stores all available roles in the system
export const roles = pgTable("roles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").unique().notNull(), // e.g., 'admin', 'sales', 'designer'
  displayName: varchar("display_name").notNull(), // e.g., 'Administrator', 'Sales Person'
  description: text("description"),
  isSystem: boolean("is_system").default(true), // Prevent deletion of system roles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resources table - stores all pages/features that can be controlled
export const resources = pgTable("resources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").unique().notNull(), // e.g., 'dashboard', 'leads', 'orders'
  displayName: varchar("display_name").notNull(), // e.g., 'Dashboard', 'Leads Management'
  description: text("description"),
  resourceType: varchar("resource_type").notNull().$type<"page" | "modal" | "button" | "feature">().default("page"),
  parentResourceId: integer("parent_resource_id").references((): any => resources.id), // For hierarchical resources
  path: varchar("path"), // URL path for pages, e.g., '/leads'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Permissions table - maps roles to resources with specific permissions
export const rolePermissions = pgTable("role_permissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  pageVisible: boolean("page_visible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salespersons extension of users
export const salespersons = pgTable("salespersons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  territory: text("territory"),
  quotaMonthly: decimal("quota_monthly", { precision: 10, scale: 2 }).default("0"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).default("0.1000"),
  active: boolean("active").default(true),
  notes: text("notes"),
  defaultOrgScope: text("default_org_scope"),
  maxLeadsPerWeek: integer("max_leads_per_week").default(50),
  autoAssignLeads: boolean("auto_assign_leads").default(true),
  workloadScore: decimal("workload_score", { precision: 5, scale: 2 }).default("0"),
  lastAssignedAt: timestamp("last_assigned_at"),
  preferredClientTypes: text("preferred_client_types").array(),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations
export const organizations = pgTable("organizations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  sports: text("sports"),
  city: varchar("city"),
  state: varchar("state"),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  territory: text("territory"),
  clientType: varchar("client_type").$type<"retail" | "wholesale" | "enterprise" | "government" | "high_school" | "college" | "tour" | "in_house">(),
  annualVolume: decimal("annual_volume", { precision: 12, scale: 2 }),
  preferredSalespersonId: varchar("preferred_salesperson_id").references(() => users.id),
  // Branding fields
  brandPrimaryColor: varchar("brand_primary_color"),
  brandSecondaryColor: varchar("brand_secondary_color"),
  brandPantoneCode: varchar("brand_pantone_code"),
  brandGuidelinesUrl: text("brand_guidelines_url"),
  // Geospatial fields for Sales Map
  geoLat: decimal("geo_lat", { precision: 10, scale: 7 }),
  geoLng: decimal("geo_lng", { precision: 10, scale: 7 }),
  geoPrecision: varchar("geo_precision").$type<"rooftop" | "city" | "state" | "manual">(),
  geoSource: varchar("geo_source"),
  geoUpdatedAt: timestamp("geo_updated_at"),
  // Archive flag
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts within organizations
export const contacts = pgTable("contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orgId: integer("org_id").references(() => organizations.id),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  roleTitle: text("role_title"), // Free-form role title (legacy compatibility)
  role: varchar("role").$type<"customer" | "admin" | "billing" | "technical" | "executive" | "other">().default("other"), // Structured role for system use
  isPrimary: boolean("is_primary").default(false), // Mark primary contact for organization
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads
export const leads = pgTable("leads", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  leadCode: varchar("lead_code").unique().notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  contactId: integer("contact_id").references(() => contacts.id),
  ownerUserId: varchar("owner_user_id").references(() => users.id),
  stage: varchar("stage").notNull().$type<"future_lead" | "lead" | "hot_lead" | "mock_up" | "mock_up_sent" | "team_store_or_direct_order" | "current_clients" | "no_answer_delete">().default("future_lead"),
  source: text("source"),
  notes: text("notes"),
  claimedAt: timestamp("claimed_at"),
  score: integer("score").default(0),
  // Geospatial fields for Sales Map
  geoLat: decimal("geo_lat", { precision: 10, scale: 7 }),
  geoLng: decimal("geo_lng", { precision: 10, scale: 7 }),
  geoPrecision: varchar("geo_precision").$type<"rooftop" | "city" | "state" | "manual">(),
  geoSource: varchar("geo_source"),
  geoUpdatedAt: timestamp("geo_updated_at"),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories for products
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sku: varchar("sku").unique().notNull(),
  name: varchar("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  style: varchar("style"),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  minOrderQty: integer("min_order_qty").default(1),
  sizes: text("sizes").array(),
  primaryImageUrl: varchar("primary_image_url", { length: 255 }),
  additionalImages: text("additional_images").array(),
  status: varchar("status").notNull().$type<"active" | "inactive">().default("active"),
  active: boolean("active").default(true),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product variants
export const productVariants = pgTable("product_variants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantCode: varchar("variant_code").unique().notNull(),
  color: text("color"),
  size: text("size"),
  material: text("material"),
  msrp: decimal("msrp", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  defaultManufacturerId: integer("default_manufacturer_id").references(() => manufacturers.id),
  backupManufacturerId: integer("backup_manufacturer_id").references(() => manufacturers.id),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Design jobs
export const designJobs = pgTable("design_jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobCode: varchar("job_code").unique().notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  leadId: integer("lead_id").references(() => leads.id),
  orderId: integer("order_id").references(() => orders.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  brief: text("brief"),
  requirements: text("requirements"),
  urgency: varchar("urgency").notNull().$type<"low" | "normal" | "high" | "rush">().default("normal"),
  status: varchar("status").notNull().$type<"pending" | "assigned" | "in_progress" | "review" | "approved" | "rejected" | "completed">().default("pending"),
  assignedDesignerId: varchar("assigned_designer_id").references(() => users.id),
  renditionCount: integer("rendition_count").default(0),
  renditionUrls: text("rendition_urls").array(),
  renditionMockupUrl: text("rendition_mockup_url"),
  renditionProductionUrl: text("rendition_production_url"),
  finalLink: text("final_link"),
  referenceFiles: text("reference_files").array(),
  deadline: date("deadline"),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high">().default("normal"),
  internalNotes: text("internal_notes"),
  clientFeedback: text("client_feedback"),
  // Attachment fields for design job files
  logoUrls: text("logo_urls").array(),
  designReferenceUrls: text("design_reference_urls").array(),
  additionalFileUrls: text("additional_file_urls").array(),
  designStyleUrl: text("design_style_url"),
  finalDesignUrls: text("final_design_urls").array(),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  statusChangedAt: timestamp("status_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Design job comments
export const designJobComments = pgTable("design_job_comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").references(() => designJobs.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturers
export const manufacturers = pgTable("manufacturers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").unique().notNull(),
  contactName: varchar("contact_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  leadTimeDays: integer("lead_time_days").default(14),
  minOrderQty: integer("min_order_qty").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Manufacturer associations (for role-based access control)
export const userManufacturerAssociations = pgTable("user_manufacturer_associations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_manufacturer_user_id").on(table.userId),
  index("idx_user_manufacturer_manufacturer_id").on(table.manufacturerId),
]);

// Orders
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderCode: varchar("order_code").unique().notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  leadId: integer("lead_id").references(() => leads.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  orderName: varchar("order_name").notNull(),
  status: orderStatusEnum("status").notNull().default("new"),
  designApproved: boolean("design_approved").default(false),
  sizesValidated: boolean("sizes_validated").default(false),
  depositReceived: boolean("deposit_received").default(false),
  invoiceUrl: text("invoice_url"),
  orderFolder: text("order_folder"),
  sizeFormLink: text("size_form_link"),
  estDelivery: date("est_delivery"),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id), // Legacy field - use orderLineItemManufacturers junction table instead
  trackingNumber: text("tracking_number"),
  priority: orderPriorityEnum("priority").notNull().default("normal"),
  // Shipping and billing addresses
  shippingAddress: text("shipping_address"),
  billToAddress: text("bill_to_address"),
  // Contact info
  contactName: varchar("contact_name"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order line items with size grid
export const orderLineItems = pgTable("order_line_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull(),
  itemName: varchar("item_name"),
  colorNotes: text("color_notes"),
  imageUrl: text("image_url"),
  yxs: integer("yxs").default(0),
  ys: integer("ys").default(0),
  ym: integer("ym").default(0),
  yl: integer("yl").default(0),
  xs: integer("xs").default(0),
  s: integer("s").default(0),
  m: integer("m").default(0),
  l: integer("l").default(0),
  xl: integer("xl").default(0),
  xxl: integer("xxl").default(0),
  xxxl: integer("xxxl").default(0),
  xxxxl: integer("xxxxl").default(0),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  qtyTotal: integer("qty_total").generatedAlwaysAs(sql`yxs + ys + ym + yl + xs + s + m + l + xl + xxl + xxxl + xxxxl`),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).generatedAlwaysAs(sql`unit_price * (yxs + ys + ym + yl + xs + s + m + l + xl + xxl + xxxl + xxxxl)`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table: maps order line items to manufacturers
export const orderLineItemManufacturers = pgTable("order_line_item_manufacturers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }).notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  estimatedCompletion: timestamp("estimated_completion"),
  status: varchar("status").$type<"pending" | "in_progress" | "completed">().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Tracking Numbers
export const orderTrackingNumbers = pgTable("order_tracking_numbers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  trackingNumber: varchar("tracking_number").notNull(),
  carrierCompany: varchar("carrier_company").notNull(),
  trackingNotes: text("tracking_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_order_tracking_order_id").on(table.orderId),
]);

// Customer Comments - messages between customers and staff on orders
export const customerComments = pgTable("customer_comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  message: text("message").notNull(),
  isFromCustomer: boolean("is_from_customer").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_comments_order_id").on(table.orderId),
]);

// Size Adjustment Requests - customer requests for size changes after form submission
export const sizeAdjustmentRequests = pgTable("size_adjustment_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  requestMessage: text("request_message").notNull(),
  status: varchar("status").$type<"pending" | "approved" | "rejected" | "completed">().default("pending").notNull(),
  adminResponse: text("admin_response"),
  respondedBy: varchar("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_size_adjustment_requests_order_id").on(table.orderId),
]);

// Order Form Submissions - captures customer-submitted information
export const orderFormSubmissions = pgTable("order_form_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  
  // Contact Information
  contactName: varchar("contact_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  contactPhone: varchar("contact_phone"),
  
  // Shipping Address
  shippingName: varchar("shipping_name"),
  shippingAddress: text("shipping_address"),
  shippingCity: varchar("shipping_city"),
  shippingState: varchar("shipping_state"),
  shippingZip: varchar("shipping_zip"),
  shippingCountry: varchar("shipping_country").default("USA"),
  
  // Billing Address
  billingName: varchar("billing_name"),
  billingAddress: text("billing_address"),
  billingCity: varchar("billing_city"),
  billingState: varchar("billing_state"),
  billingZip: varchar("billing_zip"),
  billingCountry: varchar("billing_country").default("USA"),
  sameAsShipping: boolean("same_as_shipping").default(true),
  
  // Additional Information
  organizationName: varchar("organization_name"),
  purchaseOrderNumber: varchar("purchase_order_number"),
  specialInstructions: text("special_instructions"),
  
  // Uploaded files (logo files, artwork, etc.)
  uploadedFiles: jsonb("uploaded_files").$type<Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>>(),
  
  // Submission status
  status: varchar("status").$type<"draft" | "submitted" | "reviewed" | "approved">().default("submitted"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_order_form_submissions_order_id").on(table.orderId),
]);

// Order Form Line Item Sizes - captures size selections per line item from customer
export const orderFormLineItemSizes = pgTable("order_form_line_item_sizes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  submissionId: integer("submission_id").references(() => orderFormSubmissions.id, { onDelete: 'cascade' }).notNull(),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }).notNull(),
  
  // Size selections (customer-submitted quantities)
  yxs: integer("yxs").default(0),
  ys: integer("ys").default(0),
  ym: integer("ym").default(0),
  yl: integer("yl").default(0),
  xs: integer("xs").default(0),
  s: integer("s").default(0),
  m: integer("m").default(0),
  l: integer("l").default(0),
  xl: integer("xl").default(0),
  xxl: integer("xxl").default(0),
  xxxl: integer("xxxl").default(0),
  xxxxl: integer("xxxxl").default(0),
  
  // Optional notes per item
  itemNotes: text("item_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_order_form_line_item_sizes_submission_id").on(table.submissionId),
  index("idx_order_form_line_item_sizes_line_item_id").on(table.lineItemId),
]);

// Manufacturing records (main table)
export const manufacturing = pgTable("manufacturing", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull().unique(),
  status: varchar("status").notNull().default("awaiting_admin_confirmation"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  startDate: date("start_date"),
  estCompletion: date("est_completion"),
  actualCompletion: date("actual_completion"),
  qcNotes: text("qc_notes"),
  trackingNumber: text("tracking_number"),
  batchNumber: varchar("batch_number"),
  batchSize: integer("batch_size").default(1),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  specialInstructions: text("special_instructions"),
  productionNotes: text("production_notes"),
  qualityNotes: text("quality_notes"),
  attachmentUrls: text("attachment_urls").array(),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 6, scale: 2 }),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  completedProductImages: text("completed_product_images").array(),
  firstPieceImageUrls: text("first_piece_image_urls").array(),
  firstPieceStatus: varchar("first_piece_status").$type<"pending" | "awaiting_approval" | "approved" | "rejected">().default("pending"),
  firstPieceUploadedBy: varchar("first_piece_uploaded_by").references(() => users.id),
  firstPieceUploadedAt: timestamp("first_piece_uploaded_at"),
  firstPieceApprovedBy: varchar("first_piece_approved_by").references(() => users.id),
  firstPieceApprovedAt: timestamp("first_piece_approved_at"),
  firstPieceRejectionNotes: text("first_piece_rejection_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturing status updates/history
export const manufacturingUpdates = pgTable("manufacturing_updates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  status: varchar("status").notNull(),
  notes: text("notes"),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  productionNotes: text("production_notes"),
  qualityNotes: text("quality_notes"),
  trackingNumber: text("tracking_number"),
  estimatedCompletion: timestamp("estimated_completion"),
  actualCompletionDate: timestamp("actual_completion_date"),
  specialInstructions: text("special_instructions"),
  attachmentUrls: text("attachment_urls").array(),
  progressPercentage: integer("progress_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table: maps manufacturing updates to specific line items with workflow tracking
export const manufacturingUpdateLineItems = pgTable("manufacturing_update_line_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingUpdateId: integer("manufacturing_update_id").references(() => manufacturingUpdates.id, { onDelete: 'cascade' }).notNull(),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }).notNull(),
  // Snapshot fields - captured at manufacturing update creation time
  productName: varchar("product_name"),
  variantCode: varchar("variant_code"),
  variantColor: varchar("variant_color"),
  imageUrl: text("image_url"),
  yxs: integer("yxs").default(0),
  ys: integer("ys").default(0),
  ym: integer("ym").default(0),
  yl: integer("yl").default(0),
  xs: integer("xs").default(0),
  s: integer("s").default(0),
  m: integer("m").default(0),
  l: integer("l").default(0),
  xl: integer("xl").default(0),
  xxl: integer("xxl").default(0),
  xxxl: integer("xxxl").default(0),
  xxxxl: integer("xxxxl").default(0),
  // Manufacturing workflow fields
  mockupImageUrl: text("mockup_image_url"),
  mockupUploadedAt: timestamp("mockup_uploaded_at"),
  mockupUploadedBy: varchar("mockup_uploaded_by").references(() => users.id),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  sizesConfirmed: boolean("sizes_confirmed").default(false),
  sizesConfirmedAt: timestamp("sizes_confirmed_at"),
  sizesConfirmedBy: varchar("sizes_confirmed_by").references(() => users.id),
  manufacturerCompleted: boolean("manufacturer_completed").default(false),
  manufacturerCompletedAt: timestamp("manufacturer_completed_at"),
  manufacturerCompletedBy: varchar("manufacturer_completed_by").references(() => users.id),
  notes: text("notes"),
  descriptors: text("descriptors").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturing Batches - for batch tracking and scheduling
export const manufacturingBatches = pgTable("manufacturing_batches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  batchNumber: varchar("batch_number").unique().notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
  batchName: varchar("batch_name").notNull(),
  status: varchar("status").notNull().$type<"planned" | "in_progress" | "quality_check" | "completed" | "shipped">().default("planned"),
  batchSize: integer("batch_size").default(1),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 6, scale: 2 }),
  qcNotes: text("qc_notes"),
  specialInstructions: text("special_instructions"),
  assignedTeam: text("assigned_team").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturing Batch Items - link orders to batches
export const manufacturingBatchItems = pgTable("manufacturing_batch_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  batchId: integer("batch_id").references(() => manufacturingBatches.id).notNull(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  quantity: integer("quantity").default(1),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_batch_items_batch_id").on(table.batchId),
  index("idx_batch_items_manufacturing_id").on(table.manufacturingId),
]);

// Manufacturing Quality Control Checkpoints
export const manufacturingQualityCheckpoints = pgTable("manufacturing_quality_checkpoints", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id).notNull(),
  checkpointName: varchar("checkpoint_name").notNull(),
  checkpointStage: varchar("checkpoint_stage").notNull().$type<"pending" | "in_progress" | "complete">(),
  status: varchar("status").notNull().$type<"pending" | "passed" | "failed" | "skipped">().default("pending"),
  checkedBy: varchar("checked_by").references(() => users.id),
  checkDate: timestamp("check_date"),
  notes: text("notes"),
  attachmentUrls: text("attachment_urls").array(),
  requirements: text("requirements"),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_quality_checkpoints_manufacturing_id").on(table.manufacturingId),
]);

// Manufacturing Notifications
export const manufacturingNotifications = pgTable("manufacturing_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id),
  batchId: integer("batch_id").references(() => manufacturingBatches.id),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  notificationType: varchar("notification_type").notNull().$type<"status_change" | "deadline_approaching" | "quality_issue" | "batch_complete" | "delay_alert" | "assignment">(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notifications_recipient_id").on(table.recipientId),
  index("idx_notifications_manufacturing_id").on(table.manufacturingId),
]);

// Manufacturing File Attachments
export const manufacturingAttachments = pgTable("manufacturing_attachments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id),
  batchId: integer("batch_id").references(() => manufacturingBatches.id),
  qualityCheckpointId: integer("quality_checkpoint_id").references(() => manufacturingQualityCheckpoints.id),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  description: text("description"),
  category: varchar("category").$type<"logos" | "psds" | "mockups" | "production_files" | "other">().default("other"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_attachments_manufacturing_id").on(table.manufacturingId),
  index("idx_attachments_batch_id").on(table.batchId),
]);

// Production Schedules - for advanced scheduling
export const productionSchedules = pgTable("production_schedules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
  scheduleName: varchar("schedule_name").notNull(),
  scheduleType: varchar("schedule_type").notNull().$type<"daily" | "weekly" | "monthly" | "custom">().default("weekly"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  capacity: integer("capacity").default(100),
  currentLoad: integer("current_load").default(0),
  status: varchar("status").notNull().$type<"active" | "inactive" | "full">().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_production_schedules_manufacturer_id").on(table.manufacturerId),
]);

// ==================== MANUFACTURER PORTAL TABLES ====================
// These tables support the manufacturer-specific workflow with fine-grained statuses

// Manufacturer Jobs - parallel tracking for manufacturer's internal workflow
export const manufacturerJobs = pgTable("manufacturer_jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id).notNull().unique(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  manufacturerStatus: varchar("manufacturer_status").notNull().$type<
    "intake_pending" | "specs_lock_review" | "specs_locked" | "materials_reserved" |
    "samples_in_progress" | "samples_awaiting_approval" | "samples_approved" | "samples_revise" |
    "bulk_cutting" | "bulk_print_emb_sublim" | "bulk_stitching" | "bulk_qc" |
    "packing_complete" | "handed_to_carrier" | "delivered_confirmed"
  >().default("intake_pending"),
  publicStatus: varchar("public_status").notNull().default("awaiting_admin_confirmation"),
  requiredDeliveryDate: date("required_delivery_date"),
  promisedShipDate: date("promised_ship_date"),
  eventDate: date("event_date"),
  latestArrivalDate: date("latest_arrival_date"),
  manufacturingStartDeadline: date("manufacturing_start_deadline"),
  sampleRequired: boolean("sample_required").default(false),
  specsLocked: boolean("specs_locked").default(false),
  specsLockedAt: timestamp("specs_locked_at"),
  specsLockedBy: varchar("specs_locked_by").references(() => users.id),
  artworkUrls: text("artwork_urls").array(),
  pantoneCodesJson: text("pantone_codes_json"),
  fabricType: varchar("fabric_type"),
  printMethod: varchar("print_method").$type<"screen" | "plastisol" | "water_based" | "sublimation" | "embroidery" | "dtg" | "other">(),
  specialInstructions: text("special_instructions"),
  internalNotes: text("internal_notes"),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_manufacturer_jobs_manufacturing_id").on(table.manufacturingId),
  index("idx_manufacturer_jobs_order_id").on(table.orderId),
  index("idx_manufacturer_jobs_manufacturer_id").on(table.manufacturerId),
  index("idx_manufacturer_jobs_status").on(table.manufacturerStatus),
  index("idx_manufacturer_jobs_public_status").on(table.publicStatus),
]);

// Manufacturer Events - structured event log replacing chat-based updates
export const manufacturerEvents = pgTable("manufacturer_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturerJobId: integer("manufacturer_job_id").references(() => manufacturerJobs.id).notNull(),
  eventType: varchar("event_type").notNull().$type<
    "status_change" | "spec_update" | "pantone_update" | "sample_approved" | "sample_rejected" |
    "deadline_changed" | "note_added" | "attachment_added" | "shipment_created" | "shipment_split" |
    "issue_flagged" | "issue_resolved"
  >(),
  title: varchar("title").notNull(),
  description: text("description"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  metadata: jsonb("metadata"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_manufacturer_events_job_id").on(table.manufacturerJobId),
  index("idx_manufacturer_events_type").on(table.eventType),
  index("idx_manufacturer_events_created_at").on(table.createdAt),
]);

// Team Stores - for managing team gear stores
export const teamStores = pgTable("team_stores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeCode: varchar("store_code").unique().notNull(),
  customerName: varchar("customer_name").notNull(),
  storeName: varchar("store_name").notNull(),
  orderId: integer("order_id").references(() => orders.id),
  orgId: integer("org_id").references(() => organizations.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  stage: varchar("stage").notNull().default("Team Store Pending"),
  status: varchar("status").notNull().$type<"pending" | "in_process" | "completed">().default("pending"),
  storeOpenDate: date("store_open_date"),
  storeCloseDate: date("store_close_date"),
  notes: text("notes"),
  specialInstructions: text("special_instructions"),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_team_stores_order_id").on(table.orderId),
  index("idx_team_stores_salesperson_id").on(table.salespersonId),
  index("idx_team_stores_status").on(table.status),
  index("idx_team_stores_stage").on(table.stage),
]);

// Team Store Line Items - snapshot of order line items for team stores
export const teamStoreLineItems = pgTable("team_store_line_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamStoreId: integer("team_store_id").references(() => teamStores.id, { onDelete: 'cascade' }).notNull(),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }).notNull(),
  productName: varchar("product_name"),
  variantCode: varchar("variant_code"),
  variantColor: varchar("variant_color"),
  imageUrl: text("image_url"),
  yxs: integer("yxs").default(0),
  ys: integer("ys").default(0),
  ym: integer("ym").default(0),
  yl: integer("yl").default(0),
  xs: integer("xs").default(0),
  s: integer("s").default(0),
  m: integer("m").default(0),
  l: integer("l").default(0),
  xl: integer("xl").default(0),
  xxl: integer("xxl").default(0),
  xxxl: integer("xxxl").default(0),
  xxxxl: integer("xxxxl").default(0),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_team_store_line_items_team_store_id").on(table.teamStoreId),
  index("idx_team_store_line_items_line_item_id").on(table.lineItemId),
]);

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteCode: varchar("quote_code").unique().notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  contactId: integer("contact_id").references(() => contacts.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  quoteName: varchar("quote_name").notNull(),
  status: varchar("status").notNull().$type<"draft" | "sent" | "accepted" | "rejected" | "expired">().default("draft"),
  validUntil: date("valid_until"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  customerAddress: text("customer_address"),
  customerShippingAddress: text("customer_shipping_address"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote line items
export const quoteLineItems = pgTable("quote_line_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  quoteId: integer("quote_id").references(() => quotes.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull(),
  itemName: varchar("item_name"),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).generatedAlwaysAs(sql`unit_price * quantity`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Transactions (payments, expenses, refunds)
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  transactionNumber: varchar("transaction_number").unique().notNull(),
  type: varchar("type").notNull().$type<"payment" | "expense" | "refund" | "commission" | "deposit" | "fee">(),
  status: varchar("status").notNull().$type<"pending" | "completed" | "failed" | "cancelled">().default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  description: text("description"),
  category: varchar("category"),
  orderId: integer("order_id").references(() => orders.id),
  quoteId: integer("quote_id").references(() => quotes.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  paymentMethod: varchar("payment_method"),
  externalTransactionId: varchar("external_transaction_id"),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  dueDate: date("due_date"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_transactions_type").on(table.type),
  index("idx_financial_transactions_status").on(table.status),
  index("idx_financial_transactions_order_id").on(table.orderId),
  index("idx_financial_transactions_salesperson_id").on(table.salespersonId),
]);

// Commission Tracking
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  salespersonId: varchar("salesperson_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  quoteId: integer("quote_id").references(() => quotes.id),
  commissionType: varchar("commission_type").notNull().$type<"order" | "quote" | "bonus" | "override">().default("order"),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 5, scale: 4 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().$type<"pending" | "approved" | "paid" | "disputed">().default("pending"),
  period: varchar("period"), // e.g., "2025-01" for January 2025
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_commissions_salesperson_id").on(table.salespersonId),
  index("idx_commissions_status").on(table.status),
  index("idx_commissions_period").on(table.period),
]);

// Budget and Financial Planning
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  name: varchar("name").notNull(),
  type: varchar("type").notNull().$type<"revenue" | "expense" | "commission" | "departmental">(),
  period: varchar("period").notNull(), // e.g., "2025-Q1", "2025-01"
  periodType: varchar("period_type").notNull().$type<"monthly" | "quarterly" | "yearly">(),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`total_budget - spent_amount`),
  categoryBreakdown: jsonb("category_breakdown"), // JSON object with category allocations
  status: varchar("status").notNull().$type<"draft" | "active" | "completed" | "exceeded">().default("draft"),
  ownerId: varchar("owner_id").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_budgets_type").on(table.type),
  index("idx_budgets_period").on(table.period),
  index("idx_budgets_status").on(table.status),
]);

// Financial Reports
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  reportName: varchar("report_name").notNull(),
  reportType: varchar("report_type").notNull().$type<"profit_loss" | "commission_summary" | "expense_report" | "revenue_analysis" | "budget_variance" | "cash_flow">(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  status: varchar("status").notNull().$type<"generating" | "completed" | "failed">().default("generating"),
  reportData: jsonb("report_data"), // Stores the calculated report data
  fileUrl: text("file_url"), // PDF/Excel file URL if exported
  parameters: jsonb("parameters"), // Report generation parameters
  summary: jsonb("summary"), // Key metrics summary
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_reports_type").on(table.reportType),
  index("idx_financial_reports_generated_by").on(table.generatedBy),
]);

// Financial Alerts and Notifications
export const financialAlerts = pgTable("financial_alerts", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  alertType: varchar("alert_type").notNull().$type<"budget_exceeded" | "payment_overdue" | "commission_ready" | "expense_limit" | "revenue_milestone" | "cash_flow_warning">(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  severity: varchar("severity").notNull().$type<"low" | "medium" | "high" | "critical">().default("medium"),
  threshold: decimal("threshold", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  entityType: varchar("entity_type"), // "budget", "order", "salesperson", etc.
  entityId: integer("entity_id"),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_alerts_recipient_id").on(table.recipientId),
  index("idx_financial_alerts_type").on(table.alertType),
  index("idx_financial_alerts_severity").on(table.severity),
]);

// Enhanced Financial Tracking

// Invoices - for finalized order billing
export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  orderId: integer("order_id").references(() => orders.id),
  orgId: integer("org_id").references(() => organizations.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status").notNull().$type<"draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled">().default("draft"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0"),
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`total_amount - amount_paid`),
  paymentTerms: varchar("payment_terms"), // "Net 30", "Net 60", "Due on receipt"
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_invoices_order_id").on(table.orderId),
  index("idx_invoices_org_id").on(table.orgId),
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_due_date").on(table.dueDate),
]);

// Invoice Payments - tracking individual payments against invoices
export const invoicePayments = pgTable("invoice_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  paymentNumber: varchar("payment_number").unique().notNull(),
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull().$type<"cash" | "check" | "wire" | "ach" | "credit_card" | "other">(),
  referenceNumber: varchar("reference_number"), // check number, transaction ID, etc.
  notes: text("notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_invoice_payments_invoice_id").on(table.invoiceId),
  index("idx_invoice_payments_payment_date").on(table.paymentDate),
]);

// Commission Payments - tracking when commissions are actually paid
export const commissionPayments = pgTable("commission_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  salespersonId: varchar("salesperson_id").references(() => users.id).notNull(),
  paymentNumber: varchar("payment_number").unique().notNull(),
  paymentDate: date("payment_date").notNull(),
  period: varchar("period").notNull(), // "2025-01", "2025-Q1"
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull().$type<"check" | "direct_deposit" | "wire" | "other">(),
  referenceNumber: varchar("reference_number"),
  commissionIds: integer("commission_ids").array(), // Array of commission record IDs included
  notes: text("notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_commission_payments_salesperson_id").on(table.salespersonId),
  index("idx_commission_payments_period").on(table.period),
  index("idx_commission_payments_payment_date").on(table.paymentDate),
]);

// Product COGS - cost of goods sold per product variant
export const productCogs = pgTable("product_cogs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull().unique(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_product_cogs_variant_id").on(table.variantId),
]);

// Custom Financial Matching Entries - for manual inflows/outflows
export const customFinancialEntries = pgTable("custom_financial_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  entryType: varchar("entry_type").notNull().$type<"inflow" | "outflow">(),
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  category: varchar("category"), // e.g., "Custom Payment", "Additional Cost", "Adjustment"
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_custom_financial_entries_order_id").on(table.orderId),
  index("idx_custom_financial_entries_entry_type").on(table.entryType),
]);

// Schema version tracking
export const schemaVersion = pgTable("schema_version", {
  version: integer("version").primaryKey(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  actorUserId: varchar("actor_user_id").references(() => users.id),
  entity: text("entity").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved views for users
export const savedViews = pgTable("saved_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pageKey: varchar("page_key").notNull(),
  name: varchar("name").notNull(),
  queryBlob: jsonb("query_blob").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorites
export const favorites = pgTable("favorites", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Design Resources - templates, brand guidelines, mockups, specifications
export const designResources = pgTable("design_resources", {
  id: serial("id").primaryKey(), // Using serial to match existing database structure
  name: varchar("name").notNull(),
  category: varchar("category").notNull().$type<"Templates" | "Brand Guidelines" | "Mockups" | "Specifications">(),
  fileType: varchar("file_type").notNull(), // AI, PSD, PDF, SKETCH, FIGMA, etc.
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  downloads: integer("downloads").default(0),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_design_resources_category").on(table.category),
  index("idx_design_resources_uploaded_by").on(table.uploadedBy),
]);

// ==================== TASK MANAGEMENT SYSTEM ====================

// Tasks table for user and page-specific task management
export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().$type<"pending" | "in_progress" | "completed" | "cancelled">().default("pending"),
  priority: varchar("priority").notNull().$type<"low" | "medium" | "high">().default("medium"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  createdByUserId: varchar("created_by_user_id").references(() => users.id).notNull(),
  pageKey: varchar("page_key"), // Which page/section this task belongs to
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tasks_assigned_to").on(table.assignedToUserId),
  index("idx_tasks_created_by").on(table.createdByUserId),
  index("idx_tasks_status").on(table.status),
  index("idx_tasks_page_key").on(table.pageKey),
]);

// ==================== ISSUE & CHANGE REQUESTS ====================

// Requests table for issues and change requests from sales to ops
export const requests = pgTable("requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: varchar("type").notNull().$type<"issue" | "change">(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull().$type<"low" | "normal" | "high" | "urgent">().default("normal"),
  subject: varchar("subject").notNull(),
  description: text("description"),
  entityType: varchar("entity_type").notNull().$type<"order" | "lead" | "manufacturing">(),
  entityId: integer("entity_id").notNull(),
  entityCode: varchar("entity_code"),
  status: varchar("status").notNull().$type<"pending" | "in_progress" | "resolved" | "rejected" | "cancelled">().default("pending"),
  submittedBy: varchar("submitted_by").references(() => users.id),
  submittedByName: varchar("submitted_by_name"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_requests_type").on(table.type),
  index("idx_requests_status").on(table.status),
  index("idx_requests_entity").on(table.entityType, table.entityId),
  index("idx_requests_submitted_by").on(table.submittedBy),
  index("idx_requests_assigned_to").on(table.assignedTo),
]);

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

// ==================== EVENT MANAGEMENT SYSTEM ====================

// Events (main table)
export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventCode: varchar("event_code").unique().notNull(),
  name: varchar("name").notNull(),
  eventType: varchar("event_type").notNull().$type<"small-scale" | "large-scale" | "seminar" | "clinic" | "camp">(),
  status: varchar("status").notNull().$type<"draft" | "planning" | "approved" | "live" | "completed" | "archived">().default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  timezone: varchar("timezone").default("America/New_York"),
  location: text("location"),
  venueId: integer("venue_id"),
  thumbnailUrl: text("thumbnail_url"),
  brandingConfig: jsonb("branding_config"), // Theme colors, logos, flyers
  organizationId: integer("organization_id").references(() => organizations.id),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_events_status").on(table.status),
  index("idx_events_type").on(table.eventType),
  index("idx_events_created_by").on(table.createdBy),
]);

// Event Stages (tracks progress through 10-stage wizard)
export const eventStages = pgTable("event_stages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  stageNumber: integer("stage_number").notNull(), // 1-10
  stageName: varchar("stage_name").notNull(), // "Overview", "Branding", etc.
  status: varchar("status").notNull().$type<"incomplete" | "in_progress" | "completed">().default("incomplete"),
  stageData: jsonb("stage_data"), // Stores stage-specific form data
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  validationErrors: jsonb("validation_errors"), // Stores any validation issues
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_stages_event_id").on(table.eventId),
]);

// Event Staff (internal team assignments)
export const eventStaff = pgTable("event_staff", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(), // "Event Director", "Logistics Lead", "Sales Lead", etc.
  responsibilities: text("responsibilities").array(),
  notificationPreferences: jsonb("notification_preferences"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_staff_event_id").on(table.eventId),
  index("idx_event_staff_user_id").on(table.userId),
]);

// Event Contractors (external hires - clinicians, trainers, photographers, etc.)
export const eventContractors = pgTable("event_contractors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(), // "Clinician", "MC", "Photographer", "Referee", etc.
  specialty: varchar("specialty"), // More specific role details
  email: varchar("email"),
  phone: varchar("phone"),
  socialMedia: jsonb("social_media"), // Links to Instagram, Twitter, etc.
  contractType: varchar("contract_type").notNull().$type<"flat_fee" | "per_day" | "commission">(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }),
  paymentStatus: varchar("payment_status").notNull().$type<"unpaid" | "half_paid" | "paid">().default("unpaid"),
  taxFormUrl: text("tax_form_url"), // W-9 upload
  travelInfo: jsonb("travel_info"), // Hotel, arrival/departure dates
  lodgingReimbursement: boolean("lodging_reimbursement").default(false),
  bioText: text("bio_text"), // For event page display
  bioImageUrl: text("bio_image_url"), // Headshot
  mediaConsent: boolean("media_consent").default(false),
  approvalStatus: varchar("approval_status").$type<"pending" | "approved" | "rejected">().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  quickbooksRef: varchar("quickbooks_ref"), // QuickBooks payable ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_contractors_event_id").on(table.eventId),
  index("idx_event_contractors_status").on(table.paymentStatus),
]);

// Contractor Payments (payment tracking)
export const contractorPayments = pgTable("contractor_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contractorId: integer("contractor_id").references(() => eventContractors.id, { onDelete: 'cascade' }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").$type<"check" | "wire" | "ach" | "cash" | "other">(),
  quickbooksRef: varchar("quickbooks_ref"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_contractor_payments_contractor_id").on(table.contractorId),
]);

// Contractor Files (W-9s, contracts, invoices, bios)
export const contractorFiles = pgTable("contractor_files", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contractorId: integer("contractor_id").references(() => eventContractors.id, { onDelete: 'cascade' }).notNull(),
  fileType: varchar("file_type").notNull().$type<"w9" | "contract" | "invoice" | "bio" | "other">(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // bytes
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_contractor_files_contractor_id").on(table.contractorId),
]);

// Event Merchandise (inventory allocation)
export const eventMerchandise = pgTable("event_merchandise", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull(),
  allocatedQty: integer("allocated_qty").notNull().default(0),
  soldQty: integer("sold_qty").default(0),
  returnedQty: integer("returned_qty").default(0),
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Event-specific pricing
  discountConfig: jsonb("discount_config"), // Special event discounts
  salesTarget: decimal("sales_target", { precision: 10, scale: 2 }),
  actualRevenue: decimal("actual_revenue", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_merchandise_event_id").on(table.eventId),
  index("idx_event_merchandise_variant_id").on(table.variantId),
]);

// Event Inventory Movements (tracks transfers warehouse <-> event)
export const eventInventoryMovements = pgTable("event_inventory_movements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  merchandiseId: integer("merchandise_id").references(() => eventMerchandise.id, { onDelete: 'cascade' }).notNull(),
  movementType: varchar("movement_type").notNull().$type<"allocation" | "return" | "sale" | "adjustment">(),
  quantity: integer("quantity").notNull(),
  fromLocation: varchar("from_location"), // "Warehouse", "Event Site", etc.
  toLocation: varchar("to_location"),
  movedBy: varchar("moved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_event_inventory_movements_event_id").on(table.eventId),
  index("idx_event_inventory_movements_merch_id").on(table.merchandiseId),
]);

// Event Budgets (financial planning & tracking)
export const eventBudgets = pgTable("event_budgets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  categoryName: varchar("category_name").notNull(), // "Contractors", "Venue", "Marketing", "Merchandise", etc.
  budgetedAmount: decimal("budgeted_amount", { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 10, scale: 2 }).default("0"),
  approvalStatus: varchar("approval_status").$type<"pending" | "approved" | "rejected">().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_budgets_event_id").on(table.eventId),
]);

// Event Campaigns (marketing & registration)
export const eventCampaigns = pgTable("event_campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  campaignName: varchar("campaign_name").notNull(),
  campaignType: varchar("campaign_type").notNull().$type<"email" | "sms" | "social" | "flyer" | "other">(),
  channel: varchar("channel"), // "Instagram", "Email", "Text", etc.
  content: text("content"),
  mediaUrls: text("media_urls").array(), // Flyers, images, videos
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  metrics: jsonb("metrics"), // Opens, clicks, conversions
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_campaigns_event_id").on(table.eventId),
]);

// Event Registrations (attendee tracking)
export const eventRegistrations = pgTable("event_registrations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  attendeeName: varchar("attendee_name").notNull(),
  attendeeEmail: varchar("attendee_email"),
  attendeePhone: varchar("attendee_phone"),
  attendeeInfo: jsonb("attendee_info"), // Age, organization, etc.
  ticketType: varchar("ticket_type"), // "General", "VIP", "Early Bird", etc.
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }),
  paymentStatus: varchar("payment_status").$type<"pending" | "paid" | "refunded">().default("pending"),
  referralSource: varchar("referral_source"), // How they heard about it
  checkInStatus: boolean("check_in_status").default(false),
  checkInTime: timestamp("check_in_time"),
  registeredAt: timestamp("registered_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_registrations_event_id").on(table.eventId),
  index("idx_event_registrations_email").on(table.attendeeEmail),
]);

// Communication logs for leads tracking
export const communicationLogs = pgTable("communication_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull().$type<"email" | "sms" | "call" | "note">(),
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status").$type<"sent" | "failed" | "pending">().default("sent"),
  metadata: jsonb("metadata"), // For storing extra data like phone numbers, email addresses, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// User-specific permissions (overrides role permissions)
export const userPermissions = pgTable("user_permissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  pageVisible: boolean("page_visible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_permissions_user_id").on(table.userId),
  index("idx_user_permissions_resource_id").on(table.resourceId),
]);

// Design portfolios for completed designs
export const designPortfolios = pgTable("design_portfolios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  designJobId: integer("design_job_id").references(() => designJobs.id).notNull(),
  designerId: varchar("designer_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  client: varchar("client"),
  category: varchar("category"),
  completedDate: date("completed_date"),
  imageUrls: text("image_urls").array(),
  rating: integer("rating").default(0),
  feedbackCount: integer("feedback_count").default(0),
  revisions: integer("revisions").default(0),
  isFeatured: boolean("is_featured").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Catalog variant specifications
export const variantSpecifications = pgTable("variant_specifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull(),
  specifications: jsonb("specifications"), // Flexible JSON for any specs
  dimensions: varchar("dimensions"), // e.g., "28x20x1 inches"
  materials: text("materials"),
  printArea: varchar("print_area"), // e.g., "12x12 inches"
  weight: varchar("weight"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_variant_specifications_variant_id").on(table.variantId),
]);

// Sales resources for team collaboration
export const salesResources = pgTable("sales_resources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type"), // pdf, doc, ppt, image, etc.
  fileSize: integer("file_size"), // in bytes
  category: varchar("category"), // presentations, templates, guides, etc.
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== FABRIC MANAGEMENT SYSTEM ====================

// Fabrics table - Master fabric library
export const fabrics = pgTable("fabrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  gsm: integer("gsm"), // Grams per square meter
  blend: varchar("blend"), // e.g., "60% Cotton, 40% Polyester"
  vendorName: varchar("vendor_name"),
  vendorLocation: varchar("vendor_location"),
  vendorCountry: varchar("vendor_country"),
  fabricType: varchar("fabric_type"), // e.g., "Jersey", "Fleece", "Mesh"
  weight: varchar("weight"), // Light, Medium, Heavy
  stretchType: varchar("stretch_type"), // 2-way, 4-way, None
  colorOptions: text("color_options").array(),
  notes: text("notes"),
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_fabrics_name").on(table.name),
  index("idx_fabrics_is_approved").on(table.isApproved),
  index("idx_fabrics_fabric_type").on(table.fabricType),
]);

// Product variant fabrics - Links variants to fabrics
export const productVariantFabrics = pgTable("product_variant_fabrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  variantId: integer("variant_id").references(() => productVariants.id).notNull(),
  fabricId: integer("fabric_id").references(() => fabrics.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
}, (table) => [
  index("idx_product_variant_fabrics_variant_id").on(table.variantId),
  index("idx_product_variant_fabrics_fabric_id").on(table.fabricId),
]);

// Fabric submissions - Manufacturer submissions pending approval
export const fabricSubmissions = pgTable("fabric_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id, { onDelete: 'cascade' }),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }),
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  // Fabric details submitted
  fabricName: varchar("fabric_name").notNull(),
  gsm: integer("gsm"),
  blend: varchar("blend"),
  vendorName: varchar("vendor_name"),
  vendorLocation: varchar("vendor_location"),
  vendorCountry: varchar("vendor_country"),
  fabricType: varchar("fabric_type"),
  weight: varchar("weight"),
  stretchType: varchar("stretch_type"),
  notes: text("notes"),
  // Approval workflow
  status: varchar("status").$type<"pending" | "approved" | "rejected">().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  // If approved, link to created fabric
  createdFabricId: integer("created_fabric_id").references(() => fabrics.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_fabric_submissions_manufacturing_id").on(table.manufacturingId),
  index("idx_fabric_submissions_line_item_id").on(table.lineItemId),
  index("idx_fabric_submissions_status").on(table.status),
  index("idx_fabric_submissions_submitted_by").on(table.submittedBy),
]);

// ==================== PANTONE ASSIGNMENT SYSTEM ====================

// Pantone assignments - Links pantone colors to line items with usage tags
export const pantoneAssignments = pgTable("pantone_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  lineItemId: integer("line_item_id").references(() => orderLineItems.id, { onDelete: 'cascade' }),
  manufacturingUpdateId: integer("manufacturing_update_id").references(() => manufacturingUpdates.id, { onDelete: 'cascade' }),
  pantoneCode: varchar("pantone_code").notNull(), // e.g., "2685 C"
  pantoneName: varchar("pantone_name"), // e.g., "Deep Purple"
  pantoneType: varchar("pantone_type").$type<"C" | "TCX" | "TPX" | "U">(), // Coated, Textile, etc.
  hexValue: varchar("hex_value"), // e.g., "#4A2F82"
  rgbR: integer("rgb_r"),
  rgbG: integer("rgb_g"),
  rgbB: integer("rgb_b"),
  usageLocation: varchar("usage_location").$type<"main_body" | "side_panel" | "trim" | "numbers" | "text" | "logo" | "other">(),
  usageNotes: text("usage_notes"),
  matchQuality: varchar("match_quality").$type<"excellent" | "very_close" | "good" | "approximate" | "not_recommended">(),
  matchDistance: integer("match_distance"), // Color distance value
  sampledFromImageUrl: text("sampled_from_image_url"),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pantone_assignments_line_item_id").on(table.lineItemId),
  index("idx_pantone_assignments_manufacturing_update_id").on(table.manufacturingUpdateId),
  index("idx_pantone_assignments_pantone_code").on(table.pantoneCode),
]);

// ==================== QUICK ACTION LOGS ====================

// Quick action logs - Tracks all quick action executions for analytics and debugging
export const quickActionLogs = pgTable("quick_action_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  actionId: varchar("action_id").notNull(), // e.g., "quick-quote-generator"
  actionTitle: varchar("action_title").notNull(),
  hubId: varchar("hub_id").notNull(), // e.g., "quotes", "orders", "manufacturing"
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").notNull().$type<"started" | "step_completed" | "completed" | "cancelled" | "failed">().default("started"),
  currentStep: varchar("current_step"), // Which step in the wizard
  stepData: jsonb("step_data"), // Data collected at each step
  resultData: jsonb("result_data"), // Final result/output data
  errorMessage: text("error_message"),
  entityType: varchar("entity_type"), // e.g., "order", "quote", "team_store"
  entityId: integer("entity_id"), // ID of the primary entity involved
  duration: integer("duration"), // Time taken in milliseconds
  metadata: jsonb("metadata"), // Additional context
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_quick_action_logs_action_id").on(table.actionId),
  index("idx_quick_action_logs_user_id").on(table.userId),
  index("idx_quick_action_logs_hub_id").on(table.hubId),
  index("idx_quick_action_logs_status").on(table.status),
  index("idx_quick_action_logs_started_at").on(table.startedAt),
]);

// ==================== AI DESIGN SESSIONS ====================

// AI design sessions - Tracks AI-generated design concepts for the AI Design Starter action
export const aiDesignSessions = pgTable("ai_design_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionCode: varchar("session_code").unique().notNull(),
  designJobId: integer("design_job_id").references(() => designJobs.id),
  orderId: integer("order_id").references(() => orders.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prompt: text("prompt"), // The AI prompt used
  contextVariantIds: integer("context_variant_ids").array(), // Previous designs used for context (variant-based, not org-based)
  generatedConcepts: jsonb("generated_concepts"), // Array of { conceptName, description, previewUrl, vectorUrl }
  selectedConceptIndex: integer("selected_concept_index"),
  status: varchar("status").notNull().$type<"generating" | "ready" | "selected" | "applied" | "failed">().default("generating"),
  aiProvider: varchar("ai_provider").default("gemini"), // Which AI provider was used
  modelVersion: varchar("model_version"), // e.g., "gemini-2.0-flash"
  tokensUsed: integer("tokens_used"),
  generationDuration: integer("generation_duration"), // milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_design_sessions_design_job_id").on(table.designJobId),
  index("idx_ai_design_sessions_variant_id").on(table.variantId),
  index("idx_ai_design_sessions_user_id").on(table.userId),
  index("idx_ai_design_sessions_status").on(table.status),
]);

// ==================== TOUR MERCH BUNDLES ====================

// Tour merch bundles - Pre-configured merchandise bundles for tour events
export const tourMerchBundles = pgTable("tour_merch_bundles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bundleCode: varchar("bundle_code").unique().notNull(),
  eventId: integer("event_id").references(() => events.id),
  teamStoreId: integer("team_store_id").references(() => teamStores.id),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status").notNull().$type<"draft" | "ready" | "live" | "completed" | "archived">().default("draft"),
  bundleConfig: jsonb("bundle_config"), // Configuration for bundle items
  designVariantIds: integer("design_variant_ids").array(), // Generated designs
  qrCodeUrl: text("qr_code_url"),
  marketingAssetUrls: text("marketing_asset_urls").array(),
  storeCloseDate: date("store_close_date"),
  totalAllocated: integer("total_allocated").default(0),
  totalSold: integer("total_sold").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tour_merch_bundles_event_id").on(table.eventId),
  index("idx_tour_merch_bundles_team_store_id").on(table.teamStoreId),
  index("idx_tour_merch_bundles_status").on(table.status),
]);

// ==================== PRINTFUL SYNC TRACKING ====================

// Printful sync records - Tracks orders pushed to Printful
export const printfulSyncRecords = pgTable("printful_sync_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  manufacturingId: integer("manufacturing_id").references(() => manufacturing.id),
  printfulOrderId: varchar("printful_order_id"), // Printful's order ID
  printfulExternalId: varchar("printful_external_id"), // Our external reference
  status: varchar("status").notNull().$type<"pending" | "synced" | "processing" | "shipped" | "delivered" | "failed" | "cancelled">().default("pending"),
  syncedLineItems: jsonb("synced_line_items"), // Which line items were synced
  trackingInfo: jsonb("tracking_info"), // Tracking numbers from Printful
  errorMessage: text("error_message"),
  lastSyncAttempt: timestamp("last_sync_attempt"),
  syncAttempts: integer("sync_attempts").default(0),
  printfulResponse: jsonb("printful_response"), // Raw API response
  syncedBy: varchar("synced_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_printful_sync_order_id").on(table.orderId),
  index("idx_printful_sync_printful_order_id").on(table.printfulOrderId),
  index("idx_printful_sync_status").on(table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  salesperson: one(salespersons, { fields: [users.id], references: [salespersons.userId] }),
  ownedLeads: many(leads),
  designJobs: many(designJobs),
  orders: many(orders),
  auditLogs: many(auditLogs),
  savedViews: many(savedViews),
  favorites: many(favorites),
  manufacturerAssociations: many(userManufacturerAssociations),
}));

export const salespersonsRelations = relations(salespersons, ({ one }) => ({
  user: one(users, { fields: [salespersons.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  contacts: many(contacts),
  leads: many(leads),
  designJobs: many(designJobs),
  orders: many(orders),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, { fields: [contacts.orgId], references: [organizations.id] }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, { fields: [leads.orgId], references: [organizations.id] }),
  contact: one(contacts, { fields: [leads.contactId], references: [contacts.id] }),
  owner: one(users, { fields: [leads.ownerUserId], references: [users.id] }),
  designJobs: many(designJobs),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  orderLineItems: many(orderLineItems),
}));

export const designJobsRelations = relations(designJobs, ({ one, many }) => ({
  organization: one(organizations, { fields: [designJobs.orgId], references: [organizations.id] }),
  lead: one(leads, { fields: [designJobs.leadId], references: [leads.id] }),
  order: one(orders, { fields: [designJobs.orderId], references: [orders.id] }),
  assignedDesigner: one(users, { fields: [designJobs.assignedDesignerId], references: [users.id] }),
  comments: many(designJobComments),
}));

export const designJobCommentsRelations = relations(designJobComments, ({ one }) => ({
  job: one(designJobs, { fields: [designJobComments.jobId], references: [designJobs.id] }),
  user: one(users, { fields: [designJobComments.userId], references: [users.id] }),
}));

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  orders: many(orders),
  manufacturing: many(manufacturing),
  manufacturingUpdates: many(manufacturingUpdates),
  userAssociations: many(userManufacturerAssociations),
}));

export const userManufacturerAssociationsRelations = relations(userManufacturerAssociations, ({ one }) => ({
  user: one(users, { fields: [userManufacturerAssociations.userId], references: [users.id] }),
  manufacturer: one(manufacturers, { fields: [userManufacturerAssociations.manufacturerId], references: [manufacturers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, { fields: [orders.orgId], references: [organizations.id] }),
  lead: one(leads, { fields: [orders.leadId], references: [leads.id] }),
  salesperson: one(users, { fields: [orders.salespersonId], references: [users.id] }),
  lineItems: many(orderLineItems),
  manufacturing: one(manufacturing, { fields: [orders.id], references: [manufacturing.orderId] }),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one }) => ({
  order: one(orders, { fields: [orderLineItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderLineItems.variantId], references: [productVariants.id] }),
}));

export const manufacturingRelations = relations(manufacturing, ({ one, many }) => ({
  order: one(orders, { fields: [manufacturing.orderId], references: [orders.id] }),
  manufacturer: one(manufacturers, { fields: [manufacturing.manufacturerId], references: [manufacturers.id] }),
  assignedUser: one(users, { fields: [manufacturing.assignedTo], references: [users.id] }),
  updates: many(manufacturingUpdates),
}));

export const manufacturingUpdatesRelations = relations(manufacturingUpdates, ({ one, many }) => ({
  manufacturing: one(manufacturing, { fields: [manufacturingUpdates.manufacturingId], references: [manufacturing.id] }),
  updatedByUser: one(users, { fields: [manufacturingUpdates.updatedBy], references: [users.id] }),
  manufacturer: one(manufacturers, { fields: [manufacturingUpdates.manufacturerId], references: [manufacturers.id] }),
  lineItems: many(manufacturingUpdateLineItems),
}));

export const manufacturingUpdateLineItemsRelations = relations(manufacturingUpdateLineItems, ({ one }) => ({
  manufacturingUpdate: one(manufacturingUpdates, { fields: [manufacturingUpdateLineItems.manufacturingUpdateId], references: [manufacturingUpdates.id] }),
  lineItem: one(orderLineItems, { fields: [manufacturingUpdateLineItems.lineItemId], references: [orderLineItems.id] }),
  mockupUploadedByUser: one(users, { fields: [manufacturingUpdateLineItems.mockupUploadedBy], references: [users.id] }),
  sizesConfirmedByUser: one(users, { fields: [manufacturingUpdateLineItems.sizesConfirmedBy], references: [users.id] }),
  manufacturerCompletedByUser: one(users, { fields: [manufacturingUpdateLineItems.manufacturerCompletedBy], references: [users.id] }),
}));

// Manufacturer Portal Relations
export const manufacturerJobsRelations = relations(manufacturerJobs, ({ one, many }) => ({
  manufacturing: one(manufacturing, { fields: [manufacturerJobs.manufacturingId], references: [manufacturing.id] }),
  order: one(orders, { fields: [manufacturerJobs.orderId], references: [orders.id] }),
  manufacturer: one(manufacturers, { fields: [manufacturerJobs.manufacturerId], references: [manufacturers.id] }),
  specsLockedByUser: one(users, { fields: [manufacturerJobs.specsLockedBy], references: [users.id] }),
  events: many(manufacturerEvents),
}));

export const manufacturerEventsRelations = relations(manufacturerEvents, ({ one }) => ({
  manufacturerJob: one(manufacturerJobs, { fields: [manufacturerEvents.manufacturerJobId], references: [manufacturerJobs.id] }),
  createdByUser: one(users, { fields: [manufacturerEvents.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
}));

export const savedViewsRelations = relations(savedViews, ({ one }) => ({
  user: one(users, { fields: [savedViews.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  organization: one(organizations, { fields: [quotes.orgId], references: [organizations.id] }),
  contact: one(contacts, { fields: [quotes.contactId], references: [contacts.id] }),
  salesperson: one(users, { fields: [quotes.salespersonId], references: [users.id] }),
  lineItems: many(quoteLineItems),
}));

export const quoteLineItemsRelations = relations(quoteLineItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteLineItems.quoteId], references: [quotes.id] }),
  variant: one(productVariants, { fields: [quoteLineItems.variantId], references: [productVariants.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1, "Name is required"),
});

export const insertLeadSchema = createInsertSchema(leads, {
  stage: z.enum(["future_lead", "lead", "hot_lead", "mock_up", "mock_up_sent", "team_store_or_direct_order", "current_clients", "no_answer_delete"]),
}).omit({
  leadCode: true, // Auto-generated on server
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required").optional(),
  style: z.string().optional(),
  basePrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price format (e.g., 19.99)")
    .refine((val) => parseFloat(val) > 0, "Base price must be greater than 0"),
  minOrderQty: z.number().int().positive().default(1).optional(),
  sizes: z.array(z.string()).optional(),
  primaryImageUrl: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  orderCode: true, // Auto-generated on server
  createdAt: true,
  updatedAt: true,
}).extend({
  orderName: z.string().min(1, "Order name is required"),
  status: z.enum(["new", "waiting_sizes", "invoiced", "production", "shipped", "completed", "cancelled"]),
  priority: z.enum(["low", "normal", "high"]).optional(),
  estDelivery: z.string().nullable().optional().or(z.null()),
}).passthrough();

export const insertOrderTrackingNumberSchema = createInsertSchema(orderTrackingNumbers, {
  trackingNumber: z.string().min(1, "Tracking number is required"),
  carrierCompany: z.string().min(1, "Carrier company is required"),
}).omit({
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  role: z.enum(["customer", "admin", "billing", "technical", "executive", "other"]).optional(),
  isPrimary: z.boolean().optional(),
  imageUrl: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(2, "Category name must be at least 2 characters").max(100, "Category name must be less than 100 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const insertProductVariantSchema = createInsertSchema(productVariants, {
  variantCode: z.string().min(1, "Variant code is required"),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  msrp: z.string()
    .optional()
    .refine((val) => !val || (val && /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0), "MSRP must be a positive number greater than 0"),
  cost: z.string()
    .optional()
    .refine((val) => !val || (val && /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0), "Cost must be a positive number greater than 0"),
});

export const insertDesignJobSchema = createInsertSchema(designJobs, {
  urgency: z.enum(["low", "normal", "high", "rush"]).optional(),
  status: z.enum(["pending", "assigned", "in_progress", "review", "approved", "rejected", "completed"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  deadline: z.string().optional(),
});

export const insertDesignJobCommentSchema = createInsertSchema(designJobComments, {
  comment: z.string().min(1, "Comment is required"),
  isInternal: z.boolean().optional(),
});

export const insertManufacturerSchema = createInsertSchema(manufacturers, {
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().optional(),
});

export const insertManufacturingSchema = createInsertSchema(manufacturing, {
  status: z.string().min(1, "Status is required").optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  startDate: z.string().optional(),
  estCompletion: z.string().optional(),
  actualCompletion: z.string().nullable().optional(),
});

export const insertManufacturingUpdateSchema = createInsertSchema(manufacturingUpdates, {
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  manufacturerId: z.number().int().optional(),
});

export const insertManufacturingUpdateLineItemSchema = createInsertSchema(manufacturingUpdateLineItems, {
  mockupImageUrl: z.string().url().optional(),
  sizesConfirmed: z.boolean().optional(),
  manufacturerCompleted: z.boolean().optional(),
  notes: z.string().optional(),
  descriptors: z.array(z.string()).optional(),
});

export const insertOrderLineItemManufacturerSchema = createInsertSchema(orderLineItemManufacturers, {
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  notes: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["info", "success", "warning", "error", "action"]).optional(),
}).omit({
  createdAt: true,
});

// Advanced Manufacturing Schemas
export const insertManufacturingBatchSchema = createInsertSchema(manufacturingBatches, {
  batchName: z.string().min(1, "Batch name is required"),
  status: z.enum(["planned", "in_progress", "quality_check", "completed", "shipped"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  batchSize: z.number().int().positive().optional(),
});

export const insertManufacturingBatchItemSchema = createInsertSchema(manufacturingBatchItems, {
  quantity: z.number().int().positive().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const insertManufacturingQualityCheckpointSchema = createInsertSchema(manufacturingQualityCheckpoints, {
  checkpointName: z.string().min(1, "Checkpoint name is required"),
  checkpointStage: z.enum(["pending", "in_progress", "complete"]),
  status: z.enum(["pending", "passed", "failed", "skipped"]).optional(),
});

export const insertManufacturingNotificationSchema = createInsertSchema(manufacturingNotifications, {
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  notificationType: z.enum(["status_change", "deadline_approaching", "quality_issue", "batch_complete", "delay_alert", "assignment"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const insertManufacturingAttachmentSchema = createInsertSchema(manufacturingAttachments, {
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  category: z.enum(["logos", "psds", "mockups", "production_files", "other"]).optional(),
});

export const insertProductionScheduleSchema = createInsertSchema(productionSchedules, {
  scheduleName: z.string().min(1, "Schedule name is required"),
  scheduleType: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["active", "inactive", "full"]).optional(),
});

// Manufacturer Portal Schemas
export const insertManufacturerJobSchema = createInsertSchema(manufacturerJobs, {
  manufacturerStatus: z.enum([
    "intake_pending", "specs_lock_review", "specs_locked", "materials_reserved",
    "samples_in_progress", "samples_awaiting_approval", "samples_approved", "samples_revise",
    "bulk_cutting", "bulk_print_emb_sublim", "bulk_stitching", "bulk_qc",
    "packing_complete", "handed_to_carrier", "delivered_confirmed"
  ]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  printMethod: z.enum(["screen", "plastisol", "water_based", "sublimation", "embroidery", "dtg", "other"]).optional(),
  sampleRequired: z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManufacturerEventSchema = createInsertSchema(manufacturerEvents, {
  eventType: z.enum([
    "status_change", "spec_update", "pantone_update", "sample_approved", "sample_rejected",
    "deadline_changed", "note_added", "attachment_added", "shipment_created", "shipment_split",
    "issue_flagged", "issue_resolved"
  ]),
  title: z.string().min(1, "Title is required"),
}).omit({
  id: true,
  createdAt: true,
});

// Team Store Schemas
export const insertTeamStoreSchema = createInsertSchema(teamStores, {
  storeCode: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  storeName: z.string().min(1, "Store name is required"),
  orderId: z.number().int().positive().optional(),
  stage: z.string().optional(),
  status: z.enum(["pending", "in_process", "completed"]).optional(),
  storeOpenDate: z.string().optional(),
  storeCloseDate: z.string().optional(),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTeamStoreLineItemSchema = createInsertSchema(teamStoreLineItems, {
  notes: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOrderLineItemSchema = createInsertSchema(orderLineItems, {
  unitPrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price format (e.g., 19.99)")
    .refine((val) => parseFloat(val) >= 0, "Unit price must be 0 or greater"),
  notes: z.string().nullish(),
  colorNotes: z.string().nullish(),
  itemName: z.string().nullish(),
  // Allow all size quantities to be 0 or greater (including 0 for all sizes)
  yxs: z.number().int().min(0).default(0),
  ys: z.number().int().min(0).default(0),
  ym: z.number().int().min(0).default(0),
  yl: z.number().int().min(0).default(0),
  xs: z.number().int().min(0).default(0),
  s: z.number().int().min(0).default(0),
  m: z.number().int().min(0).default(0),
  l: z.number().int().min(0).default(0),
  xl: z.number().int().min(0).default(0),
  xxl: z.number().int().min(0).default(0),
  xxxl: z.number().int().min(0).default(0),
  xxxxl: z.number().int().min(0).default(0),
}).omit({ orderId: true }); // Exclude orderId since it's assigned when creating the order

export const insertSalespersonSchema = createInsertSchema(salespersons, {
  userId: z.string().min(1, "User ID is required"),
  quotaMonthly: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  commissionRate: z.string().regex(/^0(\.\d{1,4})?$|^1(\.0{0,4})?$/, "Must be a decimal between 0 and 1").optional(),
});

export const insertQuoteSchema = createInsertSchema(quotes, {
  quoteName: z.string().min(1, "Quote name is required"),
  quoteCode: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  validUntil: z.string().optional().transform(val => val === "" ? null : val),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid tax rate").optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  discount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
});

export const insertQuoteLineItemSchema = createInsertSchema(quoteLineItems, {
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price"),
}).omit({ quoteId: true }); // Exclude quoteId since it's assigned when creating the quote

export const insertUserManufacturerAssociationSchema = createInsertSchema(userManufacturerAssociations, {
  userId: z.string().min(1, "User ID is required"),
  manufacturerId: z.number().int().positive("Manufacturer ID is required"),
  isActive: z.boolean().optional(),
});

// Enhanced Financial Tracking Schemas
export const insertInvoiceSchema = createInsertSchema(invoices, {
  invoiceNumber: z.string().optional(), // Auto-generated if not provided
  orderId: z.number().int().positive().optional().nullable(),
  orgId: z.number().int().positive().optional().nullable(),
  status: z.enum(["draft", "sent", "partial", "paid", "overdue", "cancelled"]).optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  discount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid tax rate").optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentTerms: z.string().optional(),
  createdBy: z.string().optional(), // Optional, will be set server-side if not provided
});

export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments, {
  paymentNumber: z.string().optional(), // Auto-generated if not provided
  paymentDate: z.string().min(1, "Payment date is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentMethod: z.enum(["cash", "check", "wire", "ach", "credit_card", "other"]),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionPaymentSchema = createInsertSchema(commissionPayments, {
  paymentNumber: z.string().optional(), // Auto-generated if not provided
  paymentDate: z.string().min(1, "Payment date is required"),
  period: z.string().min(1, "Period is required"),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentMethod: z.enum(["check", "direct_deposit", "wire", "other"]),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProductCogsSchema = createInsertSchema(productCogs, {
  unitCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid cost"),
}).omit({
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFinancialEntrySchema = createInsertSchema(customFinancialEntries, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  description: z.string().min(1, "Description is required"),
}).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type DesignJob = typeof designJobs.$inferSelect;
export type InsertDesignJob = z.infer<typeof insertDesignJobSchema>;
export type DesignJobComment = typeof designJobComments.$inferSelect;
export type InsertDesignJobComment = z.infer<typeof insertDesignJobCommentSchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type Manufacturing = typeof manufacturing.$inferSelect;
export type InsertManufacturing = z.infer<typeof insertManufacturingSchema>;
export type ManufacturingBatch = typeof manufacturingBatches.$inferSelect;
export type InsertManufacturingBatch = z.infer<typeof insertManufacturingBatchSchema>;
export type ManufacturingBatchItem = typeof manufacturingBatchItems.$inferSelect;
export type InsertManufacturingBatchItem = z.infer<typeof insertManufacturingBatchItemSchema>;
export type ManufacturingQualityCheckpoint = typeof manufacturingQualityCheckpoints.$inferSelect;
export type InsertManufacturingQualityCheckpoint = z.infer<typeof insertManufacturingQualityCheckpointSchema>;
export type ManufacturingNotification = typeof manufacturingNotifications.$inferSelect;
export type InsertManufacturingNotification = z.infer<typeof insertManufacturingNotificationSchema>;
export type ManufacturingAttachment = typeof manufacturingAttachments.$inferSelect;
export type InsertManufacturingAttachment = z.infer<typeof insertManufacturingAttachmentSchema>;
export type ProductionSchedule = typeof productionSchedules.$inferSelect;
export type InsertProductionSchedule = z.infer<typeof insertProductionScheduleSchema>;
export type ManufacturerJob = typeof manufacturerJobs.$inferSelect;
export type InsertManufacturerJob = z.infer<typeof insertManufacturerJobSchema>;
export type ManufacturerEvent = typeof manufacturerEvents.$inferSelect;
export type InsertManufacturerEvent = z.infer<typeof insertManufacturerEventSchema>;
export type TeamStore = typeof teamStores.$inferSelect;
export type InsertTeamStore = z.infer<typeof insertTeamStoreSchema>;
export type TeamStoreLineItem = typeof teamStoreLineItems.$inferSelect;
export type InsertTeamStoreLineItem = z.infer<typeof insertTeamStoreLineItemSchema>;
export type ManufacturingUpdate = typeof manufacturingUpdates.$inferSelect;
export type InsertManufacturingUpdate = z.infer<typeof insertManufacturingUpdateSchema>;
export type ManufacturingUpdateLineItem = typeof manufacturingUpdateLineItems.$inferSelect;
export type InsertManufacturingUpdateLineItem = z.infer<typeof insertManufacturingUpdateLineItemSchema>;
export type OrderLineItemManufacturer = typeof orderLineItemManufacturers.$inferSelect;
export type InsertOrderLineItemManufacturer = z.infer<typeof insertOrderLineItemManufacturerSchema>;
export type OrderLineItem = typeof orderLineItems.$inferSelect;
export type InsertOrderLineItem = z.infer<typeof insertOrderLineItemSchema>;
export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type QuoteLineItem = typeof quoteLineItems.$inferSelect;
export type InsertQuoteLineItem = z.infer<typeof insertQuoteLineItemSchema>;
export type UserManufacturerAssociation = typeof userManufacturerAssociations.$inferSelect;
export type InsertUserManufacturerAssociation = z.infer<typeof insertUserManufacturerAssociationSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SavedView = typeof savedViews.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;

// Financial Schemas
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions, {
  transactionNumber: z.string().optional(),
  type: z.enum(["payment", "expense", "refund", "commission", "deposit", "fee"]),
  status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  currency: z.string().default("USD").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  paymentMethod: z.string().optional(),
  fees: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  dueDate: z.string().optional().transform(val => val === "" ? null : val),
  notes: z.string().optional(),
});

export const insertCommissionSchema = createInsertSchema(commissions, {
  commissionType: z.enum(["order", "quote", "bonus", "override"]).optional(),
  baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  rate: z.string().regex(/^0(\.\d{1,4})?$|^1(\.0{0,4})?$/, "Must be a decimal between 0 and 1"),
  commissionAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  status: z.enum(["pending", "approved", "paid", "disputed"]).optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
});

export const insertBudgetSchema = createInsertSchema(budgets, {
  name: z.string().min(1, "Budget name is required"),
  type: z.enum(["revenue", "expense", "commission", "departmental"]),
  period: z.string().min(1, "Period is required"),
  periodType: z.enum(["monthly", "quarterly", "yearly"]),
  totalBudget: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  spentAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  status: z.enum(["draft", "active", "completed", "exceeded"]).optional(),
  notes: z.string().optional(),
});

export const insertFinancialReportSchema = createInsertSchema(financialReports, {
  reportName: z.string().min(1, "Report name is required"),
  reportType: z.enum(["profit_loss", "commission_summary", "expense_report", "revenue_analysis", "budget_variance", "cash_flow"]),
  periodStart: z.string().min(1, "Start date is required"),
  periodEnd: z.string().min(1, "End date is required"),
  status: z.enum(["generating", "completed", "failed"]).optional(),
});

export const insertFinancialAlertSchema = createInsertSchema(financialAlerts, {
  alertType: z.enum(["budget_exceeded", "payment_overdue", "commission_ready", "expense_limit", "revenue_milestone", "cash_flow_warning"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  threshold: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  currentValue: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  entityType: z.string().optional(),
  entityId: z.number().int().optional(),
});

// Financial Types
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type FinancialAlert = typeof financialAlerts.$inferSelect;
export type InsertFinancialAlert = z.infer<typeof insertFinancialAlertSchema>;

// Enhanced Financial Tracking Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;
export type CommissionPayment = typeof commissionPayments.$inferSelect;
export type InsertCommissionPayment = z.infer<typeof insertCommissionPaymentSchema>;
export type ProductCogs = typeof productCogs.$inferSelect;
export type InsertProductCogs = z.infer<typeof insertProductCogsSchema>;

export type CustomFinancialEntry = typeof customFinancialEntries.$inferSelect;
export type InsertCustomFinancialEntry = z.infer<typeof insertCustomFinancialEntrySchema>;

// Permission Management Schemas
export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(1, "Role name is required"),
  displayName: z.string().min(1, "Display name is required"),
});

export const insertResourceSchema = createInsertSchema(resources, {
  name: z.string().min(1, "Resource name is required"),
  displayName: z.string().min(1, "Display name is required"),
  resourceType: z.enum(["page", "modal", "button", "feature"]).optional(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions, {
  roleId: z.number().int().positive("Role ID is required"),
  resourceId: z.number().int().positive("Resource ID is required"),
});

// Permission Management Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// Design Resources Schema
export const insertDesignResourceSchema = createInsertSchema(designResources, {
  name: z.string().min(1, "Resource name is required"),
  category: z.enum(["Templates", "Brand Guidelines", "Mockups", "Specifications"]),
  fileType: z.string().min(1, "File type is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Must be a valid URL"),
  fileSize: z.number().int().positive().optional(),
});

export type DesignResource = typeof designResources.$inferSelect;
export type InsertDesignResource = z.infer<typeof insertDesignResourceSchema>;

// Task Management Schemas and Types
export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedToUserId: z.string().optional(),
  pageKey: z.string().optional(),
  dueDate: z.string().optional(),
}).omit({ createdAt: true, updatedAt: true, completedAt: true, createdByUserId: true });

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Communication Logs Schemas
export const insertCommunicationLogSchema = createInsertSchema(communicationLogs, {
  leadId: z.number().int().positive("Lead ID is required"),
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(["email", "sms", "call", "note"]),
  message: z.string().min(1, "Message is required"),
  status: z.enum(["sent", "failed", "pending"]).optional(),
}).omit({ createdAt: true });

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;

// User Permissions Schemas
export const insertUserPermissionSchema = createInsertSchema(userPermissions, {
  userId: z.string().min(1, "User ID is required"),
  resourceId: z.number().int().positive("Resource ID is required"),
}).omit({ createdAt: true, updatedAt: true });

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

// Design Portfolio Schemas
export const insertDesignPortfolioSchema = createInsertSchema(designPortfolios, {
  designJobId: z.number().int().positive("Design job ID is required"),
  designerId: z.string().min(1, "Designer ID is required"),
  title: z.string().min(1, "Title is required"),
}).omit({ createdAt: true, updatedAt: true });

export type DesignPortfolio = typeof designPortfolios.$inferSelect;
export type InsertDesignPortfolio = z.infer<typeof insertDesignPortfolioSchema>;

// Variant Specifications Schemas
export const insertVariantSpecificationSchema = createInsertSchema(variantSpecifications, {
  variantId: z.number().int().positive("Variant ID is required"),
}).omit({ createdAt: true, updatedAt: true });

export type VariantSpecification = typeof variantSpecifications.$inferSelect;
export type InsertVariantSpecification = z.infer<typeof insertVariantSpecificationSchema>;

// Sales Resources Schemas
export const insertSalesResourceSchema = createInsertSchema(salesResources, {
  name: z.string().min(1, "Resource name is required"),
  fileUrl: z.string().url("Valid file URL is required"),
  uploadedBy: z.string().min(1, "Uploader ID is required"),
}).omit({ createdAt: true, updatedAt: true, downloads: true });

export type SalesResource = typeof salesResources.$inferSelect;
export type InsertSalesResource = z.infer<typeof insertSalesResourceSchema>;

// Event Management Schemas
export const insertEventSchema = createInsertSchema(events, {
  name: z.string().min(1, "Event name is required"),
  eventType: z.enum(["small-scale", "large-scale", "seminar", "clinic", "camp"]),
  status: z.enum(["draft", "planning", "approved", "live", "completed", "archived"]).optional(),
  eventCode: z.string().optional(), // Auto-generated if not provided
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timezone: z.string().optional(),
  location: z.string().optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventStageSchema = createInsertSchema(eventStages, {
  stageNumber: z.number().int().min(1).max(10),
  stageName: z.string().min(1, "Stage name is required"),
  status: z.enum(["incomplete", "in_progress", "completed"]).optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventStaffSchema = createInsertSchema(eventStaff, {
  userId: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventContractorSchema = createInsertSchema(eventContractors, {
  name: z.string().min(1, "Contractor name is required"),
  role: z.string().min(1, "Role is required"),
  contractType: z.enum(["flat_fee", "per_day", "commission"]),
  paymentStatus: z.enum(["unpaid", "half_paid", "paid"]).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  email: z.string().email().optional().or(z.literal("")),
  paymentAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  commissionPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid percentage").optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertContractorPaymentSchema = createInsertSchema(contractorPayments, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["check", "wire", "ach", "cash", "other"]).optional(),
}).omit({ createdAt: true });

export const insertContractorFileSchema = createInsertSchema(contractorFiles, {
  fileType: z.enum(["w9", "contract", "invoice", "bio", "other"]),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Must be a valid URL"),
}).omit({ createdAt: true });

export const insertEventMerchandiseSchema = createInsertSchema(eventMerchandise, {
  allocatedQty: z.number().int().min(0, "Allocated quantity must be 0 or greater"),
  soldQty: z.number().int().min(0).optional(),
  returnedQty: z.number().int().min(0).optional(),
  priceOverride: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price").optional(),
  salesTarget: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  actualRevenue: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventInventoryMovementSchema = createInsertSchema(eventInventoryMovements, {
  movementType: z.enum(["allocation", "return", "sale", "adjustment"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
}).omit({ createdAt: true });

export const insertEventBudgetSchema = createInsertSchema(eventBudgets, {
  categoryName: z.string().min(1, "Category name is required"),
  budgetedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  actualAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventCampaignSchema = createInsertSchema(eventCampaigns, {
  campaignName: z.string().min(1, "Campaign name is required"),
  campaignType: z.enum(["email", "sms", "social", "flyer", "other"]),
  scheduledAt: z.string().optional(),
  sentAt: z.string().optional(),
}).omit({ createdAt: true, updatedAt: true });

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations, {
  attendeeName: z.string().min(1, "Attendee name is required"),
  attendeeEmail: z.string().email().optional().or(z.literal("")),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
  ticketPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
}).omit({ createdAt: true, updatedAt: true, registeredAt: true });

// Event Management Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventStage = typeof eventStages.$inferSelect;
export type InsertEventStage = z.infer<typeof insertEventStageSchema>;
export type EventStaff = typeof eventStaff.$inferSelect;
export type InsertEventStaff = z.infer<typeof insertEventStaffSchema>;
export type EventContractor = typeof eventContractors.$inferSelect;
export type InsertEventContractor = z.infer<typeof insertEventContractorSchema>;
export type ContractorPayment = typeof contractorPayments.$inferSelect;
export type InsertContractorPayment = z.infer<typeof insertContractorPaymentSchema>;
export type ContractorFile = typeof contractorFiles.$inferSelect;
export type InsertContractorFile = z.infer<typeof insertContractorFileSchema>;
export type EventMerchandise = typeof eventMerchandise.$inferSelect;
export type InsertEventMerchandise = z.infer<typeof insertEventMerchandiseSchema>;
export type EventInventoryMovement = typeof eventInventoryMovements.$inferSelect;
export type InsertEventInventoryMovement = z.infer<typeof insertEventInventoryMovementSchema>;
export type EventBudget = typeof eventBudgets.$inferSelect;
export type InsertEventBudget = z.infer<typeof insertEventBudgetSchema>;
export type EventCampaign = typeof eventCampaigns.$inferSelect;
export type InsertEventCampaign = z.infer<typeof insertEventCampaignSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

// Order Form Submission Schemas
export const insertOrderFormSubmissionSchema = createInsertSchema(orderFormSubmissions, {
  orderId: z.number().int().positive("Order ID is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  shippingName: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  billingName: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  sameAsShipping: z.boolean().optional(),
  organizationName: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  specialInstructions: z.string().optional(),
  uploadedFiles: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileType: z.string(),
    uploadedAt: z.string(),
  })).optional(),
  status: z.enum(["draft", "submitted", "reviewed", "approved"]).optional(),
}).omit({ createdAt: true, updatedAt: true, submittedAt: true, reviewedAt: true, reviewedBy: true });

export type OrderFormSubmission = typeof orderFormSubmissions.$inferSelect;
export type InsertOrderFormSubmission = z.infer<typeof insertOrderFormSubmissionSchema>;

// Order Form Line Item Sizes Schemas
export const insertOrderFormLineItemSizesSchema = createInsertSchema(orderFormLineItemSizes, {
  submissionId: z.number().int().positive("Submission ID is required"),
  lineItemId: z.number().int().positive("Line item ID is required"),
  yxs: z.number().int().min(0).optional(),
  ys: z.number().int().min(0).optional(),
  ym: z.number().int().min(0).optional(),
  yl: z.number().int().min(0).optional(),
  xs: z.number().int().min(0).optional(),
  s: z.number().int().min(0).optional(),
  m: z.number().int().min(0).optional(),
  l: z.number().int().min(0).optional(),
  xl: z.number().int().min(0).optional(),
  xxl: z.number().int().min(0).optional(),
  xxxl: z.number().int().min(0).optional(),
  xxxxl: z.number().int().min(0).optional(),
  itemNotes: z.string().optional(),
}).omit({ createdAt: true });

export type OrderFormLineItemSizes = typeof orderFormLineItemSizes.$inferSelect;
export type InsertOrderFormLineItemSizes = z.infer<typeof insertOrderFormLineItemSizesSchema>;

// Customer Comments Schemas
export const insertCustomerCommentSchema = createInsertSchema(customerComments, {
  orderId: z.number().int().positive("Order ID is required"),
  message: z.string().min(1, "Message is required"),
  isFromCustomer: z.boolean().optional(),
}).omit({ createdAt: true });

export type CustomerComment = typeof customerComments.$inferSelect;
export type InsertCustomerComment = z.infer<typeof insertCustomerCommentSchema>;

// Size Adjustment Request Schemas
export const insertSizeAdjustmentRequestSchema = createInsertSchema(sizeAdjustmentRequests, {
  orderId: z.number().int().positive("Order ID is required"),
  requestMessage: z.string().min(1, "Request message is required"),
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, respondedAt: true });

export type SizeAdjustmentRequest = typeof sizeAdjustmentRequests.$inferSelect;
export type InsertSizeAdjustmentRequest = z.infer<typeof insertSizeAdjustmentRequestSchema>;

// ==================== FABRIC MANAGEMENT SCHEMAS ====================

export const insertFabricSchema = createInsertSchema(fabrics, {
  name: z.string().min(1, "Fabric name is required"),
  gsm: z.number().int().positive().optional(),
  blend: z.string().optional(),
  vendorName: z.string().optional(),
  vendorLocation: z.string().optional(),
  vendorCountry: z.string().optional(),
  fabricType: z.string().optional(),
  weight: z.string().optional(),
  stretchType: z.string().optional(),
  colorOptions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isApproved: z.boolean().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });

export type Fabric = typeof fabrics.$inferSelect;
export type InsertFabric = z.infer<typeof insertFabricSchema>;

export const insertProductVariantFabricSchema = createInsertSchema(productVariantFabrics, {
  variantId: z.number().int().positive("Variant ID is required"),
  fabricId: z.number().int().positive("Fabric ID is required"),
}).omit({ id: true, assignedAt: true });

export type ProductVariantFabric = typeof productVariantFabrics.$inferSelect;
export type InsertProductVariantFabric = z.infer<typeof insertProductVariantFabricSchema>;

export const insertFabricSubmissionSchema = createInsertSchema(fabricSubmissions, {
  fabricName: z.string().min(1, "Fabric name is required"),
  gsm: z.number().int().positive().optional(),
  blend: z.string().optional(),
  vendorName: z.string().optional(),
  vendorLocation: z.string().optional(),
  vendorCountry: z.string().optional(),
  fabricType: z.string().optional(),
  weight: z.string().optional(),
  stretchType: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  reviewNotes: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, reviewedAt: true });

export type FabricSubmission = typeof fabricSubmissions.$inferSelect;
export type InsertFabricSubmission = z.infer<typeof insertFabricSubmissionSchema>;

// ==================== PANTONE ASSIGNMENT SCHEMAS ====================

export const insertPantoneAssignmentSchema = createInsertSchema(pantoneAssignments, {
  pantoneCode: z.string().min(1, "Pantone code is required"),
  pantoneName: z.string().optional(),
  pantoneType: z.enum(["C", "TCX", "TPX", "U"]).optional(),
  hexValue: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  rgbR: z.number().int().min(0).max(255).optional(),
  rgbG: z.number().int().min(0).max(255).optional(),
  rgbB: z.number().int().min(0).max(255).optional(),
  usageLocation: z.enum(["main_body", "side_panel", "trim", "numbers", "text", "logo", "other"]).optional(),
  usageNotes: z.string().optional(),
  matchQuality: z.enum(["excellent", "very_close", "good", "approximate", "not_recommended"]).optional(),
  matchDistance: z.number().int().optional(),
  sampledFromImageUrl: z.string().url().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type PantoneAssignment = typeof pantoneAssignments.$inferSelect;
export type InsertPantoneAssignment = z.infer<typeof insertPantoneAssignmentSchema>;

// Quick Action Logs Schemas
export const insertQuickActionLogSchema = createInsertSchema(quickActionLogs, {
  actionId: z.string().min(1, "Action ID is required"),
  actionTitle: z.string().min(1, "Action title is required"),
  hubId: z.string().min(1, "Hub ID is required"),
  status: z.enum(["started", "step_completed", "completed", "cancelled", "failed"]).optional(),
  currentStep: z.string().optional(),
  stepData: z.any().optional(),
  resultData: z.any().optional(),
  errorMessage: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.number().int().optional(),
  duration: z.number().int().optional(),
  metadata: z.any().optional(),
}).omit({ id: true, createdAt: true, startedAt: true, completedAt: true });

export type QuickActionLog = typeof quickActionLogs.$inferSelect;
export type InsertQuickActionLog = z.infer<typeof insertQuickActionLogSchema>;

// AI Design Sessions Schemas
export const insertAiDesignSessionSchema = createInsertSchema(aiDesignSessions, {
  sessionCode: z.string().min(1, "Session code is required"),
  designJobId: z.number().int().optional(),
  orderId: z.number().int().optional(),
  variantId: z.number().int().optional(),
  prompt: z.string().optional(),
  contextVariantIds: z.array(z.number().int()).optional(),
  generatedConcepts: z.any().optional(),
  selectedConceptIndex: z.number().int().optional(),
  status: z.enum(["generating", "ready", "selected", "applied", "failed"]).optional(),
  aiProvider: z.string().optional(),
  modelVersion: z.string().optional(),
  tokensUsed: z.number().int().optional(),
  generationDuration: z.number().int().optional(),
  errorMessage: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type AiDesignSession = typeof aiDesignSessions.$inferSelect;
export type InsertAiDesignSession = z.infer<typeof insertAiDesignSessionSchema>;

// Tour Merch Bundles Schemas
export const insertTourMerchBundleSchema = createInsertSchema(tourMerchBundles, {
  bundleCode: z.string().min(1, "Bundle code is required"),
  eventId: z.number().int().optional(),
  teamStoreId: z.number().int().optional(),
  name: z.string().min(1, "Bundle name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "ready", "live", "completed", "archived"]).optional(),
  bundleConfig: z.any().optional(),
  designVariantIds: z.array(z.number().int()).optional(),
  qrCodeUrl: z.string().url().optional(),
  marketingAssetUrls: z.array(z.string().url()).optional(),
  storeCloseDate: z.string().optional(),
  totalAllocated: z.number().int().optional(),
  totalSold: z.number().int().optional(),
  revenue: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type TourMerchBundle = typeof tourMerchBundles.$inferSelect;
export type InsertTourMerchBundle = z.infer<typeof insertTourMerchBundleSchema>;

// Printful Sync Records Schemas
export const insertPrintfulSyncRecordSchema = createInsertSchema(printfulSyncRecords, {
  orderId: z.number().int().positive("Order ID is required"),
  manufacturingId: z.number().int().optional(),
  printfulOrderId: z.string().optional(),
  printfulExternalId: z.string().optional(),
  status: z.enum(["pending", "synced", "processing", "shipped", "delivered", "failed", "cancelled"]).optional(),
  syncedLineItems: z.any().optional(),
  trackingInfo: z.any().optional(),
  errorMessage: z.string().optional(),
  syncAttempts: z.number().int().optional(),
  printfulResponse: z.any().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, lastSyncAttempt: true });

export type PrintfulSyncRecord = typeof printfulSyncRecords.$inferSelect;
export type InsertPrintfulSyncRecord = z.infer<typeof insertPrintfulSyncRecordSchema>;
