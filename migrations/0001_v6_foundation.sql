-- V6 Foundation Migration
-- =============================================================================
-- Phase 1: File Storage, Notifications, Validation, Activity Logs
-- =============================================================================

-- =============================================================================
-- 1. FILE STORAGE SYSTEM
-- =============================================================================

-- Files table - Central registry of all files
CREATE TABLE IF NOT EXISTS "files" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer REFERENCES "organizations"("id") ON DELETE SET NULL,
  "original_filename" varchar(255) NOT NULL,
  "storage_path" varchar(500) NOT NULL,
  "file_size_bytes" integer NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "file_extension" varchar(20) NOT NULL,
  "checksum_sha256" varchar(64) NOT NULL,
  "thumbnail_path_sm" varchar(500),
  "thumbnail_path_md" varchar(500),
  "thumbnail_path_lg" varchar(500),
  "folder" varchar(50) NOT NULL DEFAULT 'misc',
  "description" text,
  "tags" text[],
  "is_archived" boolean NOT NULL DEFAULT false,
  "archived_at" timestamp,
  "archived_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "uploaded_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_files_organization_id" ON "files"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_files_folder" ON "files"("folder");
CREATE INDEX IF NOT EXISTS "idx_files_checksum" ON "files"("checksum_sha256");
CREATE INDEX IF NOT EXISTS "idx_files_extension" ON "files"("file_extension");
CREATE INDEX IF NOT EXISTS "idx_files_created_at" ON "files"("created_at");
CREATE INDEX IF NOT EXISTS "idx_files_uploaded_by" ON "files"("uploaded_by_user_id");

-- File Links table - Associates files with entities
CREATE TABLE IF NOT EXISTS "file_links" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_id" varchar NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
  "entity_type" varchar(50) NOT NULL,
  "entity_id" varchar NOT NULL,
  "link_type" varchar(50) NOT NULL DEFAULT 'attachment',
  "folder" varchar(50),
  "is_primary" boolean NOT NULL DEFAULT false,
  "is_customer_visible" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "version_number" integer,
  "is_current_version" boolean NOT NULL DEFAULT true,
  "replaced_by_link_id" varchar REFERENCES "file_links"("id") ON DELETE SET NULL,
  "approval_status" varchar(20),
  "approved_by" varchar(255),
  "approved_at" timestamp,
  "linked_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_file_links_file_id" ON "file_links"("file_id");
CREATE INDEX IF NOT EXISTS "idx_file_links_entity" ON "file_links"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_file_links_entity_folder" ON "file_links"("entity_type", "entity_id", "folder");

-- Bulk Upload Sessions
CREATE TABLE IF NOT EXISTS "bulk_upload_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "context_type" varchar(50) NOT NULL,
  "context_id" varchar NOT NULL,
  "target_folder" varchar(50) NOT NULL,
  "total_files" integer NOT NULL,
  "completed_files" integer NOT NULL DEFAULT 0,
  "failed_files" integer NOT NULL DEFAULT 0,
  "total_bytes" integer NOT NULL,
  "received_bytes" integer NOT NULL DEFAULT 0,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "uploaded_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
  "started_at" timestamp,
  "completed_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_bulk_upload_sessions_user" ON "bulk_upload_sessions"("uploaded_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_bulk_upload_sessions_status" ON "bulk_upload_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_bulk_upload_sessions_context" ON "bulk_upload_sessions"("context_type", "context_id");

-- File Uploads
CREATE TABLE IF NOT EXISTS "file_uploads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_id" varchar REFERENCES "files"("id") ON DELETE SET NULL,
  "bulk_session_id" varchar REFERENCES "bulk_upload_sessions"("id") ON DELETE SET NULL,
  "context_type" varchar(50) NOT NULL,
  "context_id" varchar NOT NULL,
  "target_folder" varchar(50) NOT NULL,
  "original_filename" varchar(255) NOT NULL,
  "expected_size_bytes" integer NOT NULL,
  "received_bytes" integer NOT NULL DEFAULT 0,
  "expected_checksum" varchar(64),
  "temp_path" varchar(500),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "failure_reason" text,
  "retry_count" integer NOT NULL DEFAULT 0,
  "last_activity_at" timestamp DEFAULT now() NOT NULL,
  "uploaded_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_file_uploads_status" ON "file_uploads"("status");
CREATE INDEX IF NOT EXISTS "idx_file_uploads_user" ON "file_uploads"("uploaded_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_file_uploads_bulk_session" ON "file_uploads"("bulk_session_id");
CREATE INDEX IF NOT EXISTS "idx_file_uploads_context" ON "file_uploads"("context_type", "context_id");

-- ZIP Jobs
CREATE TABLE IF NOT EXISTS "zip_jobs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "requested_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
  "context_type" varchar(50) NOT NULL,
  "context_id" varchar NOT NULL,
  "folder" varchar(50),
  "file_ids" text[],
  "zip_filename" varchar(255) NOT NULL,
  "zip_path" varchar(500),
  "zip_size_bytes" integer,
  "files_included" integer,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "progress_percent" integer NOT NULL DEFAULT 0,
  "failure_reason" text,
  "download_count" integer NOT NULL DEFAULT 0,
  "last_downloaded_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_zip_jobs_user" ON "zip_jobs"("requested_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_zip_jobs_status" ON "zip_jobs"("status");
CREATE INDEX IF NOT EXISTS "idx_zip_jobs_context" ON "zip_jobs"("context_type", "context_id");

-- Organization Storage
CREATE TABLE IF NOT EXISTS "organization_storage" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL UNIQUE REFERENCES "organizations"("id") ON DELETE CASCADE,
  "quota_bytes" integer NOT NULL DEFAULT 10737418240,
  "used_bytes" integer NOT NULL DEFAULT 0,
  "file_count" integer NOT NULL DEFAULT 0,
  "last_calculated_at" timestamp DEFAULT now() NOT NULL,
  "warning_sent_at" timestamp,
  "limit_reached_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_organization_storage_org" ON "organization_storage"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_organization_storage_usage" ON "organization_storage"("used_bytes");

-- =============================================================================
-- 2. ENHANCED NOTIFICATION SYSTEM
-- =============================================================================

-- Notifications V6
CREATE TABLE IF NOT EXISTS "notifications_v6" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "category" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text,
  "priority" varchar(20) NOT NULL DEFAULT 'normal',
  "entity_type" varchar(50),
  "entity_id" varchar,
  "action_url" varchar(255),
  "metadata" jsonb,
  "read_at" timestamp,
  "acknowledged_at" timestamp,
  "archived_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_notifications_v6_user_created" ON "notifications_v6"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_notifications_v6_entity" ON "notifications_v6"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_v6_type" ON "notifications_v6"("type");

-- Notification Preferences
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "notification_type" varchar(50) NOT NULL,
  "in_app_enabled" boolean NOT NULL DEFAULT true,
  "email_preference" varchar(20) NOT NULL DEFAULT 'off',
  "push_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_notification_preferences_user" ON "notification_preferences"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notification_preferences_user_type" ON "notification_preferences"("user_id", "notification_type");

-- User Push Tokens
CREATE TABLE IF NOT EXISTS "user_push_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "platform" varchar(20) NOT NULL,
  "device_name" varchar(255),
  "app_version" varchar(50),
  "last_used_at" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "failed_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_push_tokens_user" ON "user_push_tokens"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_user_push_tokens_platform" ON "user_push_tokens"("platform");

-- Email Delivery Logs
CREATE TABLE IF NOT EXISTS "email_delivery_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "notification_id" varchar REFERENCES "notifications_v6"("id") ON DELETE SET NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email_address" varchar(255) NOT NULL,
  "template_id" varchar(100) NOT NULL,
  "subject" varchar(500) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'queued',
  "service_message_id" varchar(255),
  "bounce_type" varchar(50),
  "bounce_reason" text,
  "opened_at" timestamp,
  "clicked_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "sent_at" timestamp,
  "delivered_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_email_delivery_logs_user" ON "email_delivery_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_delivery_logs_notification" ON "email_delivery_logs"("notification_id");
CREATE INDEX IF NOT EXISTS "idx_email_delivery_logs_status" ON "email_delivery_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_email_delivery_logs_created" ON "email_delivery_logs"("created_at");

-- =============================================================================
-- 3. DATA VALIDATION LAYER
-- =============================================================================

-- Validation Results
CREATE TABLE IF NOT EXISTS "validation_results" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" varchar(50) NOT NULL,
  "entity_id" varchar NOT NULL,
  "check_type" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL,
  "severity" varchar(20) NOT NULL DEFAULT 'warning',
  "message" text NOT NULL,
  "details" jsonb,
  "suggested_action" text,
  "related_entity_type" varchar(50),
  "related_entity_id" varchar,
  "acknowledged_at" timestamp,
  "acknowledged_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "acknowledgment_note" text,
  "expires_at" timestamp NOT NULL,
  "created_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_validation_results_entity" ON "validation_results"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_validation_results_entity_check" ON "validation_results"("entity_type", "entity_id", "check_type");
CREATE INDEX IF NOT EXISTS "idx_validation_results_status" ON "validation_results"("status");
CREATE INDEX IF NOT EXISTS "idx_validation_results_expires" ON "validation_results"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_validation_results_created" ON "validation_results"("created_at");

-- Validation Summaries
CREATE TABLE IF NOT EXISTS "validation_summaries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" varchar(50) NOT NULL,
  "entity_id" varchar NOT NULL,
  "total_checks" integer NOT NULL DEFAULT 0,
  "passed" integer NOT NULL DEFAULT 0,
  "warnings" integer NOT NULL DEFAULT 0,
  "errors" integer NOT NULL DEFAULT 0,
  "skipped" integer NOT NULL DEFAULT 0,
  "overall_status" varchar(20) NOT NULL DEFAULT 'pass',
  "validated_at" timestamp DEFAULT now() NOT NULL,
  "valid_until" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_validation_summaries_entity" ON "validation_summaries"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_validation_summaries_status" ON "validation_summaries"("overall_status");
CREATE INDEX IF NOT EXISTS "idx_validation_summaries_valid_until" ON "validation_summaries"("valid_until");

-- =============================================================================
-- 4. ACTIVITY LOGS
-- =============================================================================

-- Activity Logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_type" varchar(50) NOT NULL,
  "entity_id" varchar NOT NULL,
  "activity_type" varchar(50) NOT NULL,
  "user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "user_name" varchar(255),
  "content" text,
  "content_html" text,
  "metadata" jsonb,
  "parent_id" varchar REFERENCES "activity_logs"("id") ON DELETE SET NULL,
  "is_internal" boolean NOT NULL DEFAULT false,
  "is_system" boolean NOT NULL DEFAULT false,
  "mentions" text[],
  "edited_at" timestamp,
  "deleted_at" timestamp,
  "deleted_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity" ON "activity_logs"("entity_type", "entity_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_user" ON "activity_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_type" ON "activity_logs"("activity_type");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_parent" ON "activity_logs"("parent_id");

-- =============================================================================
-- 5. SAVED FILTERS
-- =============================================================================

-- Saved Filters
CREATE TABLE IF NOT EXISTS "saved_filters" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "description" text,
  "entity_type" varchar(50) NOT NULL,
  "filter_config" jsonb NOT NULL,
  "sort_config" jsonb,
  "column_config" jsonb,
  "is_default" boolean NOT NULL DEFAULT false,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "is_shared" boolean NOT NULL DEFAULT false,
  "shared_with_roles" text[],
  "use_count" integer NOT NULL DEFAULT 0,
  "last_used_at" timestamp,
  "color" varchar(20),
  "icon" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_saved_filters_user" ON "saved_filters"("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_filters_user_entity" ON "saved_filters"("user_id", "entity_type");

-- =============================================================================
-- 6. COLUMN MODIFICATIONS TO EXISTING TABLES
-- =============================================================================

-- Users table modifications
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_digest_time" varchar(5) DEFAULT '09:00';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_timezone" varchar(50) DEFAULT 'America/New_York';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_quiet_hours_start" varchar(5);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_quiet_hours_end" varchar(5);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_notification_read_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unread_notification_count" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_bounced" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_bounce_reason" text;

CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users"("is_active");

-- Organizations table modifications
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "asset_library_enabled" boolean DEFAULT true;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "storage_quota_bytes" integer DEFAULT 10737418240;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "file_count" integer DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "total_storage_bytes" integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_organizations_name" ON "organizations"("name");
CREATE INDEX IF NOT EXISTS "idx_organizations_archived" ON "organizations"("archived");
CREATE INDEX IF NOT EXISTS "idx_organizations_tier" ON "organizations"("tier");

-- Orders table modifications
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "file_count" integer DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validation_status" varchar(20) DEFAULT 'not_run';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validation_last_run_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "has_unresolved_warnings" boolean DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "owner_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "secondary_owner_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_portal_token" varchar(64);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_portal_enabled" boolean DEFAULT true;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "size_sheet_uploaded" boolean DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "size_sheet_validated" boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_orders_owner" ON "orders"("owner_user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_validation_status" ON "orders"("validation_status");
CREATE INDEX IF NOT EXISTS "idx_orders_customer_portal_token" ON "orders"("customer_portal_token");

-- Design Jobs table modifications
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "asset_library_linked" boolean DEFAULT false;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "linked_asset_ids" text[];
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "file_count" integer DEFAULT 0;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "current_version_number" integer DEFAULT 1;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "total_revisions" integer DEFAULT 0;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "last_customer_feedback_at" timestamp;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "feedback_addressed" boolean DEFAULT true;
ALTER TABLE "design_jobs" ADD COLUMN IF NOT EXISTS "validation_status" varchar(20) DEFAULT 'not_run';

CREATE INDEX IF NOT EXISTS "idx_design_jobs_validation_status" ON "design_jobs"("validation_status");
CREATE INDEX IF NOT EXISTS "idx_design_jobs_assigned_designer" ON "design_jobs"("assigned_designer_id");
CREATE INDEX IF NOT EXISTS "idx_design_jobs_status" ON "design_jobs"("status");

-- Leads table modifications
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "file_count" integer DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "activity_count" integer DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "stale_warning_sent_at" timestamp;

CREATE INDEX IF NOT EXISTS "idx_leads_owner" ON "leads"("owner_user_id");
CREATE INDEX IF NOT EXISTS "idx_leads_stage" ON "leads"("stage");
CREATE INDEX IF NOT EXISTS "idx_leads_archived" ON "leads"("archived");
CREATE INDEX IF NOT EXISTS "idx_leads_last_activity" ON "leads"("last_activity_at");
