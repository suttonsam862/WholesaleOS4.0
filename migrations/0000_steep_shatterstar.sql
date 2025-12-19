CREATE TYPE "public"."order_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'waiting_sizes', 'invoiced', 'production', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "ai_design_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_design_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_code" varchar NOT NULL,
	"design_job_id" integer,
	"order_id" integer,
	"variant_id" integer,
	"user_id" varchar NOT NULL,
	"prompt" text,
	"context_variant_ids" integer[],
	"generated_concepts" jsonb,
	"selected_concept_index" integer,
	"status" varchar DEFAULT 'generating' NOT NULL,
	"ai_provider" varchar DEFAULT 'gemini',
	"model_version" varchar,
	"tokens_used" integer,
	"generation_duration" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_design_sessions_session_code_unique" UNIQUE("session_code")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actor_user_id" varchar,
	"entity" text NOT NULL,
	"entity_id" integer NOT NULL,
	"action" text NOT NULL,
	"before_json" text,
	"after_json" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"period" varchar NOT NULL,
	"period_type" varchar NOT NULL,
	"total_budget" numeric(12, 2) NOT NULL,
	"spent_amount" numeric(12, 2) DEFAULT '0',
	"remaining_amount" numeric(12, 2) GENERATED ALWAYS AS (total_budget - spent_amount) STORED,
	"category_breakdown" jsonb,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"owner_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" text,
	"image_url" text,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "commission_payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "commission_payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"salesperson_id" varchar NOT NULL,
	"payment_number" varchar NOT NULL,
	"payment_date" date NOT NULL,
	"period" varchar NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"reference_number" varchar,
	"commission_ids" integer[],
	"notes" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "commission_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"salesperson_id" varchar NOT NULL,
	"order_id" integer,
	"quote_id" integer,
	"commission_type" varchar DEFAULT 'order' NOT NULL,
	"base_amount" numeric(10, 2) NOT NULL,
	"rate" numeric(5, 4) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"period" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "communication_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"subject" varchar,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'sent',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"org_id" integer,
	"name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"role_title" text,
	"role" varchar DEFAULT 'other',
	"is_primary" boolean DEFAULT false,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contractor_files" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contractor_files_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"contractor_id" integer NOT NULL,
	"file_type" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contractor_payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contractor_payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"contractor_id" integer NOT NULL,
	"payment_date" timestamp NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar,
	"quickbooks_ref" varchar,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_financial_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "custom_financial_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"entry_type" varchar NOT NULL,
	"description" varchar NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"category" varchar,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"message" text NOT NULL,
	"is_from_customer" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_job_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "design_job_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "design_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_code" varchar NOT NULL,
	"org_id" integer,
	"lead_id" integer,
	"order_id" integer,
	"salesperson_id" varchar,
	"brief" text,
	"requirements" text,
	"urgency" varchar DEFAULT 'normal' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"assigned_designer_id" varchar,
	"rendition_count" integer DEFAULT 0,
	"rendition_urls" text[],
	"rendition_mockup_url" text,
	"rendition_production_url" text,
	"final_link" text,
	"reference_files" text[],
	"deadline" date,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"internal_notes" text,
	"client_feedback" text,
	"logo_urls" text[],
	"design_reference_urls" text[],
	"additional_file_urls" text[],
	"design_style_url" text,
	"final_design_urls" text[],
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"status_changed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "design_jobs_job_code_unique" UNIQUE("job_code")
);
--> statement-breakpoint
CREATE TABLE "design_portfolios" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "design_portfolios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"design_job_id" integer NOT NULL,
	"designer_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"client" varchar,
	"category" varchar,
	"completed_date" date,
	"image_urls" text[],
	"rating" integer DEFAULT 0,
	"feedback_count" integer DEFAULT 0,
	"revisions" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_size" integer,
	"downloads" integer DEFAULT 0,
	"uploaded_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_budgets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_budgets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"category_name" varchar NOT NULL,
	"budgeted_amount" numeric(10, 2) NOT NULL,
	"actual_amount" numeric(10, 2) DEFAULT '0',
	"approval_status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_campaigns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"campaign_name" varchar NOT NULL,
	"campaign_type" varchar NOT NULL,
	"channel" varchar,
	"content" text,
	"media_urls" text[],
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"metrics" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_contractors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_contractors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"specialty" varchar,
	"email" varchar,
	"phone" varchar,
	"social_media" jsonb,
	"contract_type" varchar NOT NULL,
	"payment_amount" numeric(10, 2),
	"commission_percentage" numeric(5, 2),
	"payment_status" varchar DEFAULT 'unpaid' NOT NULL,
	"tax_form_url" text,
	"travel_info" jsonb,
	"lodging_reimbursement" boolean DEFAULT false,
	"bio_text" text,
	"bio_image_url" text,
	"media_consent" boolean DEFAULT false,
	"approval_status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"quickbooks_ref" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_inventory_movements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_inventory_movements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"merchandise_id" integer NOT NULL,
	"movement_type" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"from_location" varchar,
	"to_location" varchar,
	"moved_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_merchandise" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_merchandise_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"allocated_qty" integer DEFAULT 0 NOT NULL,
	"sold_qty" integer DEFAULT 0,
	"returned_qty" integer DEFAULT 0,
	"price_override" numeric(10, 2),
	"discount_config" jsonb,
	"sales_target" numeric(10, 2),
	"actual_revenue" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_registrations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"attendee_name" varchar NOT NULL,
	"attendee_email" varchar,
	"attendee_phone" varchar,
	"attendee_info" jsonb,
	"ticket_type" varchar,
	"ticket_price" numeric(10, 2),
	"payment_status" varchar DEFAULT 'pending',
	"referral_source" varchar,
	"check_in_status" boolean DEFAULT false,
	"check_in_time" timestamp,
	"registered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_staff" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_staff_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"responsibilities" text[],
	"notification_preferences" jsonb,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_stages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_stages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"stage_number" integer NOT NULL,
	"stage_name" varchar NOT NULL,
	"status" varchar DEFAULT 'incomplete' NOT NULL,
	"stage_data" jsonb,
	"completed_at" timestamp,
	"completed_by" varchar,
	"validation_errors" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"timezone" varchar DEFAULT 'America/New_York',
	"location" text,
	"venue_id" integer,
	"thumbnail_url" text,
	"branding_config" jsonb,
	"organization_id" integer,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "events_event_code_unique" UNIQUE("event_code")
);
--> statement-breakpoint
CREATE TABLE "fabric_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer,
	"line_item_id" integer,
	"submitted_by" varchar NOT NULL,
	"fabric_name" varchar NOT NULL,
	"gsm" integer,
	"blend" varchar,
	"vendor_name" varchar,
	"vendor_location" varchar,
	"vendor_country" varchar,
	"fabric_type" varchar,
	"weight" varchar,
	"stretch_type" varchar,
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_fabric_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabrics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"gsm" integer,
	"blend" varchar,
	"vendor_name" varchar,
	"vendor_location" varchar,
	"vendor_country" varchar,
	"fabric_type" varchar,
	"weight" varchar,
	"stretch_type" varchar,
	"color_options" text[],
	"notes" text,
	"is_approved" boolean DEFAULT false,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "favorites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"severity" varchar DEFAULT 'medium' NOT NULL,
	"threshold" numeric(10, 2),
	"current_value" numeric(10, 2),
	"entity_type" varchar,
	"entity_id" integer,
	"recipient_id" varchar NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_name" varchar NOT NULL,
	"report_type" varchar NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"generated_by" varchar NOT NULL,
	"status" varchar DEFAULT 'generating' NOT NULL,
	"report_data" jsonb,
	"file_url" text,
	"parameters" jsonb,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_number" varchar NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"description" text,
	"category" varchar,
	"order_id" integer,
	"quote_id" integer,
	"salesperson_id" varchar,
	"payment_method" varchar,
	"external_transaction_id" varchar,
	"fees" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"processed_by" varchar,
	"processed_at" timestamp,
	"due_date" date,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "financial_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"user_id" varchar,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"email_sent_successfully" boolean DEFAULT false,
	"email_error" text,
	"retry_count" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoice_payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoice_id" integer NOT NULL,
	"payment_number" varchar NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"reference_number" varchar,
	"notes" text,
	"processed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoice_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoice_number" varchar NOT NULL,
	"order_id" integer,
	"org_id" integer,
	"salesperson_id" varchar,
	"revenue_source" varchar DEFAULT 'order',
	"team_store_id" integer,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0',
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0',
	"amount_due" numeric(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
	"payment_terms" varchar,
	"notes" text,
	"internal_notes" text,
	"sent_at" timestamp,
	"paid_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_code" varchar NOT NULL,
	"org_id" integer,
	"contact_id" integer,
	"owner_user_id" varchar,
	"stage" varchar DEFAULT 'future_lead' NOT NULL,
	"source" text,
	"notes" text,
	"claimed_at" timestamp,
	"score" integer DEFAULT 0,
	"geo_lat" numeric(10, 7),
	"geo_lng" numeric(10, 7),
	"geo_precision" varchar,
	"geo_source" varchar,
	"geo_updated_at" timestamp,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "leads_lead_code_unique" UNIQUE("lead_code")
);
--> statement-breakpoint
CREATE TABLE "license_acceptances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"license_version" varchar DEFAULT '1.0' NOT NULL,
	"accepted_at" timestamp DEFAULT now(),
	"ip_address" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturer_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturer_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturer_job_id" integer NOT NULL,
	"event_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"previous_value" text,
	"new_value" text,
	"metadata" jsonb,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturer_jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturer_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"manufacturer_id" integer,
	"manufacturer_status" varchar DEFAULT 'intake_pending' NOT NULL,
	"public_status" varchar DEFAULT 'awaiting_admin_confirmation' NOT NULL,
	"required_delivery_date" date,
	"promised_ship_date" date,
	"event_date" date,
	"latest_arrival_date" date,
	"manufacturing_start_deadline" date,
	"sample_required" boolean DEFAULT false,
	"specs_locked" boolean DEFAULT false,
	"specs_locked_at" timestamp,
	"specs_locked_by" varchar,
	"artwork_urls" text[],
	"pantone_codes_json" text,
	"fabric_type" varchar,
	"print_method" varchar,
	"special_instructions" text,
	"internal_notes" text,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturer_jobs_manufacturing_id_unique" UNIQUE("manufacturing_id")
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"contact_name" varchar,
	"email" varchar,
	"phone" varchar,
	"notes" text,
	"logo_url" text,
	"lead_time_days" integer DEFAULT 14,
	"min_order_qty" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "manufacturing" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"status" varchar DEFAULT 'awaiting_admin_confirmation' NOT NULL,
	"assigned_to" varchar,
	"manufacturer_id" integer,
	"start_date" date,
	"est_completion" date,
	"actual_completion" date,
	"qc_notes" text,
	"tracking_number" text,
	"batch_number" varchar,
	"batch_size" integer DEFAULT 1,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"special_instructions" text,
	"production_notes" text,
	"quality_notes" text,
	"attachment_urls" text[],
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2),
	"scheduled_start_date" timestamp,
	"scheduled_end_date" timestamp,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"completed_product_images" text[],
	"first_piece_image_urls" text[],
	"first_piece_status" varchar DEFAULT 'pending',
	"first_piece_uploaded_by" varchar,
	"first_piece_uploaded_at" timestamp,
	"first_piece_approved_by" varchar,
	"first_piece_approved_at" timestamp,
	"first_piece_rejection_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturing_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "manufacturing_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer,
	"batch_id" integer,
	"quality_checkpoint_id" integer,
	"file_name" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"file_url" text NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"description" text,
	"category" varchar DEFAULT 'other',
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_batch_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_batch_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer NOT NULL,
	"manufacturing_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"quantity" integer DEFAULT 1,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_batches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_batches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_number" varchar NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"batch_name" varchar NOT NULL,
	"status" varchar DEFAULT 'planned' NOT NULL,
	"batch_size" integer DEFAULT 1,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"scheduled_start_date" timestamp,
	"scheduled_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2),
	"qc_notes" text,
	"special_instructions" text,
	"assigned_team" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "manufacturing_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "manufacturing_notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer,
	"batch_id" integer,
	"recipient_id" varchar NOT NULL,
	"notification_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_quality_checkpoints" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_quality_checkpoints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer NOT NULL,
	"checkpoint_name" varchar NOT NULL,
	"checkpoint_stage" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"checked_by" varchar,
	"check_date" timestamp,
	"notes" text,
	"attachment_urls" text[],
	"requirements" text,
	"result" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_update_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_update_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_update_id" integer NOT NULL,
	"line_item_id" integer NOT NULL,
	"product_name" varchar,
	"variant_code" varchar,
	"variant_color" varchar,
	"image_url" text,
	"yxs" integer DEFAULT 0,
	"ys" integer DEFAULT 0,
	"ym" integer DEFAULT 0,
	"yl" integer DEFAULT 0,
	"xs" integer DEFAULT 0,
	"s" integer DEFAULT 0,
	"m" integer DEFAULT 0,
	"l" integer DEFAULT 0,
	"xl" integer DEFAULT 0,
	"xxl" integer DEFAULT 0,
	"xxxl" integer DEFAULT 0,
	"xxxxl" integer DEFAULT 0,
	"mockup_image_url" text,
	"mockup_uploaded_at" timestamp,
	"mockup_uploaded_by" varchar,
	"actual_cost" numeric(10, 2),
	"sizes_confirmed" boolean DEFAULT false,
	"sizes_confirmed_at" timestamp,
	"sizes_confirmed_by" varchar,
	"manufacturer_completed" boolean DEFAULT false,
	"manufacturer_completed_at" timestamp,
	"manufacturer_completed_by" varchar,
	"notes" text,
	"descriptors" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_updates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturing_updates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturing_id" integer NOT NULL,
	"order_id" integer,
	"status" varchar NOT NULL,
	"notes" text,
	"updated_by" varchar NOT NULL,
	"manufacturer_id" integer,
	"production_notes" text,
	"quality_notes" text,
	"tracking_number" text,
	"estimated_completion" timestamp,
	"actual_completion_date" timestamp,
	"special_instructions" text,
	"attachment_urls" text[],
	"progress_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false,
	"link" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_form_line_item_sizes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_form_line_item_sizes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submission_id" integer NOT NULL,
	"line_item_id" integer NOT NULL,
	"yxs" integer DEFAULT 0,
	"ys" integer DEFAULT 0,
	"ym" integer DEFAULT 0,
	"yl" integer DEFAULT 0,
	"xs" integer DEFAULT 0,
	"s" integer DEFAULT 0,
	"m" integer DEFAULT 0,
	"l" integer DEFAULT 0,
	"xl" integer DEFAULT 0,
	"xxl" integer DEFAULT 0,
	"xxxl" integer DEFAULT 0,
	"xxxxl" integer DEFAULT 0,
	"item_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_form_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_form_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"contact_name" varchar NOT NULL,
	"contact_email" varchar NOT NULL,
	"contact_phone" varchar,
	"shipping_name" varchar,
	"shipping_address" text,
	"shipping_city" varchar,
	"shipping_state" varchar,
	"shipping_zip" varchar,
	"shipping_country" varchar DEFAULT 'USA',
	"billing_name" varchar,
	"billing_address" text,
	"billing_city" varchar,
	"billing_state" varchar,
	"billing_zip" varchar,
	"billing_country" varchar DEFAULT 'USA',
	"same_as_shipping" boolean DEFAULT true,
	"organization_name" varchar,
	"purchase_order_number" varchar,
	"special_instructions" text,
	"uploaded_files" jsonb,
	"status" varchar DEFAULT 'submitted',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_line_item_manufacturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_line_item_manufacturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"line_item_id" integer NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"estimated_completion" timestamp,
	"status" varchar DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"item_name" varchar,
	"color_notes" text,
	"image_url" text,
	"yxs" integer DEFAULT 0,
	"ys" integer DEFAULT 0,
	"ym" integer DEFAULT 0,
	"yl" integer DEFAULT 0,
	"xs" integer DEFAULT 0,
	"s" integer DEFAULT 0,
	"m" integer DEFAULT 0,
	"l" integer DEFAULT 0,
	"xl" integer DEFAULT 0,
	"xxl" integer DEFAULT 0,
	"xxxl" integer DEFAULT 0,
	"xxxxl" integer DEFAULT 0,
	"unit_price" numeric(10, 2) NOT NULL,
	"qty_total" integer GENERATED ALWAYS AS (yxs + ys + ym + yl + xs + s + m + l + xl + xxl + xxxl + xxxxl) STORED,
	"line_total" numeric(10, 2) GENERATED ALWAYS AS (unit_price * (yxs + ys + ym + yl + xs + s + m + l + xl + xxl + xxxl + xxxxl)) STORED,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_tracking_numbers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_tracking_numbers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"tracking_number" varchar NOT NULL,
	"carrier_company" varchar NOT NULL,
	"tracking_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_code" varchar NOT NULL,
	"org_id" integer,
	"lead_id" integer,
	"salesperson_id" varchar,
	"order_name" varchar NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"design_approved" boolean DEFAULT false,
	"sizes_validated" boolean DEFAULT false,
	"deposit_received" boolean DEFAULT false,
	"invoice_url" text,
	"order_folder" text,
	"size_form_link" text,
	"est_delivery" date,
	"manufacturer_id" integer,
	"tracking_number" text,
	"priority" "order_priority" DEFAULT 'normal' NOT NULL,
	"shipping_address" text,
	"bill_to_address" text,
	"contact_name" varchar,
	"contact_email" varchar,
	"contact_phone" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organizations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"sports" text,
	"city" varchar,
	"state" varchar,
	"shipping_address" text,
	"notes" text,
	"logo_url" text,
	"territory" text,
	"client_type" varchar,
	"annual_volume" numeric(12, 2),
	"preferred_salesperson_id" varchar,
	"brand_primary_color" varchar,
	"brand_secondary_color" varchar,
	"brand_pantone_code" varchar,
	"brand_guidelines_url" text,
	"geo_lat" numeric(10, 7),
	"geo_lng" numeric(10, 7),
	"geo_precision" varchar,
	"geo_source" varchar,
	"geo_updated_at" timestamp,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pantone_assignments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pantone_assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"line_item_id" integer,
	"manufacturing_update_id" integer,
	"pantone_code" varchar NOT NULL,
	"pantone_name" varchar,
	"pantone_type" varchar,
	"hex_value" varchar,
	"rgb_r" integer,
	"rgb_g" integer,
	"rgb_b" integer,
	"usage_location" varchar,
	"usage_notes" text,
	"match_quality" varchar,
	"match_distance" integer,
	"sampled_from_image_url" text,
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "printful_sync_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "printful_sync_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"manufacturing_id" integer,
	"printful_order_id" varchar,
	"printful_external_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"synced_line_items" jsonb,
	"tracking_info" jsonb,
	"error_message" text,
	"last_sync_attempt" timestamp,
	"sync_attempts" integer DEFAULT 0,
	"printful_response" jsonb,
	"synced_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_cogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_cogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"variant_id" integer NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"updated_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_cogs_variant_id_unique" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "product_variant_fabrics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_variant_fabrics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"variant_id" integer NOT NULL,
	"fabric_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" varchar
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_variants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"variant_code" varchar NOT NULL,
	"color" text,
	"size" text,
	"material" text,
	"msrp" numeric(10, 2),
	"cost" numeric(10, 2),
	"image_url" text,
	"default_manufacturer_id" integer,
	"backup_manufacturer_id" integer,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_variant_code_unique" UNIQUE("variant_code")
);
--> statement-breakpoint
CREATE TABLE "production_schedules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "production_schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manufacturer_id" integer NOT NULL,
	"schedule_name" varchar NOT NULL,
	"schedule_type" varchar DEFAULT 'weekly' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"capacity" integer DEFAULT 100,
	"current_load" integer DEFAULT 0,
	"status" varchar DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sku" varchar NOT NULL,
	"name" varchar NOT NULL,
	"category_id" integer NOT NULL,
	"style" varchar,
	"description" text,
	"base_price" numeric(10, 2) NOT NULL,
	"min_order_qty" integer DEFAULT 1,
	"sizes" text[],
	"primary_image_url" varchar(255),
	"additional_images" text[],
	"status" varchar DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "quick_action_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quick_action_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action_id" varchar NOT NULL,
	"action_title" varchar NOT NULL,
	"hub_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'started' NOT NULL,
	"current_step" varchar,
	"step_data" jsonb,
	"result_data" jsonb,
	"error_message" text,
	"entity_type" varchar,
	"entity_id" integer,
	"duration" integer,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quote_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quote_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"item_name" varchar,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_code" varchar NOT NULL,
	"org_id" integer,
	"contact_id" integer,
	"salesperson_id" varchar,
	"quote_name" varchar NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"valid_until" date,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"discount" numeric(10, 2) DEFAULT '0',
	"customer_address" text,
	"customer_shipping_address" text,
	"notes" text,
	"internal_notes" text,
	"terms_and_conditions" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotes_quote_code_unique" UNIQUE("quote_code")
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"subject" varchar NOT NULL,
	"description" text,
	"entity_type" varchar NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_code" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"submitted_by" varchar,
	"submitted_by_name" varchar,
	"assigned_to" varchar,
	"resolution" text,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"resource_type" varchar DEFAULT 'page' NOT NULL,
	"parent_resource_id" integer,
	"path" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "resources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"role_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"can_view" boolean DEFAULT false,
	"can_create" boolean DEFAULT false,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"page_visible" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sales_resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sales_resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_type" varchar,
	"file_size" integer,
	"category" varchar,
	"uploaded_by" varchar NOT NULL,
	"downloads" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salespersons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "salespersons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"territory" text,
	"quota_monthly" numeric(10, 2) DEFAULT '0',
	"commission_rate" numeric(5, 4) DEFAULT '0.1000',
	"active" boolean DEFAULT true,
	"notes" text,
	"default_org_scope" text,
	"max_leads_per_week" integer DEFAULT 50,
	"auto_assign_leads" boolean DEFAULT true,
	"workload_score" numeric(5, 2) DEFAULT '0',
	"last_assigned_at" timestamp,
	"preferred_client_types" text[],
	"skills" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "salespersons_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_views_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"page_key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"query_blob" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schema_version" (
	"version" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size_adjustment_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "size_adjustment_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"request_message" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"admin_response" text,
	"responded_by" varchar,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"assigned_to_user_id" varchar,
	"created_by_user_id" varchar NOT NULL,
	"page_key" varchar,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_store_line_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "team_store_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"team_store_id" integer NOT NULL,
	"line_item_id" integer NOT NULL,
	"product_name" varchar,
	"variant_code" varchar,
	"variant_color" varchar,
	"image_url" text,
	"yxs" integer DEFAULT 0,
	"ys" integer DEFAULT 0,
	"ym" integer DEFAULT 0,
	"yl" integer DEFAULT 0,
	"xs" integer DEFAULT 0,
	"s" integer DEFAULT 0,
	"m" integer DEFAULT 0,
	"l" integer DEFAULT 0,
	"xl" integer DEFAULT 0,
	"xxl" integer DEFAULT 0,
	"xxxl" integer DEFAULT 0,
	"xxxxl" integer DEFAULT 0,
	"unit_price" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_stores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "team_stores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"store_code" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"store_name" varchar NOT NULL,
	"order_id" integer,
	"org_id" integer,
	"salesperson_id" varchar,
	"stage" varchar DEFAULT 'Team Store Pending' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"store_open_date" date,
	"store_close_date" date,
	"notes" text,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"special_instructions" text,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"archived_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "team_stores_store_code_unique" UNIQUE("store_code")
);
--> statement-breakpoint
CREATE TABLE "tour_merch_bundles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tour_merch_bundles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bundle_code" varchar NOT NULL,
	"event_id" integer,
	"team_store_id" integer,
	"name" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"bundle_config" jsonb,
	"design_variant_ids" integer[],
	"qr_code_url" text,
	"marketing_asset_urls" text[],
	"store_close_date" date,
	"total_allocated" integer DEFAULT 0,
	"total_sold" integer DEFAULT 0,
	"revenue" numeric(12, 2) DEFAULT '0',
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tour_merch_bundles_bundle_code_unique" UNIQUE("bundle_code")
);
--> statement-breakpoint
CREATE TABLE "user_manufacturer_associations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_manufacturer_associations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"resource_id" integer NOT NULL,
	"can_view" boolean DEFAULT false,
	"can_create" boolean DEFAULT false,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"page_visible" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"password_hash" varchar,
	"is_active" boolean DEFAULT true,
	"phone" varchar,
	"active" boolean DEFAULT true,
	"avatar_url" varchar,
	"is_invited" boolean DEFAULT false,
	"has_completed_setup" boolean DEFAULT false,
	"invited_at" timestamp,
	"invited_by" varchar,
	"sales_map_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "variant_specifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "variant_specifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"variant_id" integer NOT NULL,
	"specifications" jsonb,
	"dimensions" varchar,
	"materials" text,
	"print_area" varchar,
	"weight" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_design_sessions" ADD CONSTRAINT "ai_design_sessions_design_job_id_design_jobs_id_fk" FOREIGN KEY ("design_job_id") REFERENCES "public"."design_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_design_sessions" ADD CONSTRAINT "ai_design_sessions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_design_sessions" ADD CONSTRAINT "ai_design_sessions_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_design_sessions" ADD CONSTRAINT "ai_design_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_files" ADD CONSTRAINT "contractor_files_contractor_id_event_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."event_contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_files" ADD CONSTRAINT "contractor_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_payments" ADD CONSTRAINT "contractor_payments_contractor_id_event_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."event_contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_payments" ADD CONSTRAINT "contractor_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_financial_entries" ADD CONSTRAINT "custom_financial_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_financial_entries" ADD CONSTRAINT "custom_financial_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_comments" ADD CONSTRAINT "customer_comments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_job_comments" ADD CONSTRAINT "design_job_comments_job_id_design_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."design_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_job_comments" ADD CONSTRAINT "design_job_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_assigned_designer_id_users_id_fk" FOREIGN KEY ("assigned_designer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_portfolios" ADD CONSTRAINT "design_portfolios_design_job_id_design_jobs_id_fk" FOREIGN KEY ("design_job_id") REFERENCES "public"."design_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_portfolios" ADD CONSTRAINT "design_portfolios_designer_id_users_id_fk" FOREIGN KEY ("designer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_resources" ADD CONSTRAINT "design_resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budgets" ADD CONSTRAINT "event_budgets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_budgets" ADD CONSTRAINT "event_budgets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_campaigns" ADD CONSTRAINT "event_campaigns_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_campaigns" ADD CONSTRAINT "event_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_contractors" ADD CONSTRAINT "event_contractors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_contractors" ADD CONSTRAINT "event_contractors_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory_movements" ADD CONSTRAINT "event_inventory_movements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory_movements" ADD CONSTRAINT "event_inventory_movements_merchandise_id_event_merchandise_id_fk" FOREIGN KEY ("merchandise_id") REFERENCES "public"."event_merchandise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_inventory_movements" ADD CONSTRAINT "event_inventory_movements_moved_by_users_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_merchandise" ADD CONSTRAINT "event_merchandise_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_merchandise" ADD CONSTRAINT "event_merchandise_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_stages" ADD CONSTRAINT "event_stages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_stages" ADD CONSTRAINT "event_stages_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_submissions" ADD CONSTRAINT "fabric_submissions_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_submissions" ADD CONSTRAINT "fabric_submissions_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_submissions" ADD CONSTRAINT "fabric_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_submissions" ADD CONSTRAINT "fabric_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_submissions" ADD CONSTRAINT "fabric_submissions_created_fabric_id_fabrics_id_fk" FOREIGN KEY ("created_fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_alerts" ADD CONSTRAINT "financial_alerts_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_store_id_team_stores_id_fk" FOREIGN KEY ("team_store_id") REFERENCES "public"."team_stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_acceptances" ADD CONSTRAINT "license_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_events" ADD CONSTRAINT "manufacturer_events_manufacturer_job_id_manufacturer_jobs_id_fk" FOREIGN KEY ("manufacturer_job_id") REFERENCES "public"."manufacturer_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_events" ADD CONSTRAINT "manufacturer_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_jobs" ADD CONSTRAINT "manufacturer_jobs_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_jobs" ADD CONSTRAINT "manufacturer_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_jobs" ADD CONSTRAINT "manufacturer_jobs_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer_jobs" ADD CONSTRAINT "manufacturer_jobs_specs_locked_by_users_id_fk" FOREIGN KEY ("specs_locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_first_piece_uploaded_by_users_id_fk" FOREIGN KEY ("first_piece_uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing" ADD CONSTRAINT "manufacturing_first_piece_approved_by_users_id_fk" FOREIGN KEY ("first_piece_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_attachments" ADD CONSTRAINT "manufacturing_attachments_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_attachments" ADD CONSTRAINT "manufacturing_attachments_batch_id_manufacturing_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."manufacturing_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_attachments" ADD CONSTRAINT "manufacturing_attachments_quality_checkpoint_id_manufacturing_quality_checkpoints_id_fk" FOREIGN KEY ("quality_checkpoint_id") REFERENCES "public"."manufacturing_quality_checkpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_attachments" ADD CONSTRAINT "manufacturing_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_batch_items" ADD CONSTRAINT "manufacturing_batch_items_batch_id_manufacturing_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."manufacturing_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_batch_items" ADD CONSTRAINT "manufacturing_batch_items_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_batch_items" ADD CONSTRAINT "manufacturing_batch_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_batches" ADD CONSTRAINT "manufacturing_batches_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_notifications" ADD CONSTRAINT "manufacturing_notifications_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_notifications" ADD CONSTRAINT "manufacturing_notifications_batch_id_manufacturing_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."manufacturing_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_notifications" ADD CONSTRAINT "manufacturing_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_quality_checkpoints" ADD CONSTRAINT "manufacturing_quality_checkpoints_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_quality_checkpoints" ADD CONSTRAINT "manufacturing_quality_checkpoints_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_update_line_items" ADD CONSTRAINT "manufacturing_update_line_items_manufacturing_update_id_manufacturing_updates_id_fk" FOREIGN KEY ("manufacturing_update_id") REFERENCES "public"."manufacturing_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_update_line_items" ADD CONSTRAINT "manufacturing_update_line_items_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_update_line_items" ADD CONSTRAINT "manufacturing_update_line_items_mockup_uploaded_by_users_id_fk" FOREIGN KEY ("mockup_uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_update_line_items" ADD CONSTRAINT "manufacturing_update_line_items_sizes_confirmed_by_users_id_fk" FOREIGN KEY ("sizes_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_update_line_items" ADD CONSTRAINT "manufacturing_update_line_items_manufacturer_completed_by_users_id_fk" FOREIGN KEY ("manufacturer_completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_updates" ADD CONSTRAINT "manufacturing_updates_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_updates" ADD CONSTRAINT "manufacturing_updates_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_updates" ADD CONSTRAINT "manufacturing_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_updates" ADD CONSTRAINT "manufacturing_updates_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_form_line_item_sizes" ADD CONSTRAINT "order_form_line_item_sizes_submission_id_order_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."order_form_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_form_line_item_sizes" ADD CONSTRAINT "order_form_line_item_sizes_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_form_submissions" ADD CONSTRAINT "order_form_submissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_form_submissions" ADD CONSTRAINT "order_form_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_item_manufacturers" ADD CONSTRAINT "order_line_item_manufacturers_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_item_manufacturers" ADD CONSTRAINT "order_line_item_manufacturers_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tracking_numbers" ADD CONSTRAINT "order_tracking_numbers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_preferred_salesperson_id_users_id_fk" FOREIGN KEY ("preferred_salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantone_assignments" ADD CONSTRAINT "pantone_assignments_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantone_assignments" ADD CONSTRAINT "pantone_assignments_manufacturing_update_id_manufacturing_updates_id_fk" FOREIGN KEY ("manufacturing_update_id") REFERENCES "public"."manufacturing_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantone_assignments" ADD CONSTRAINT "pantone_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printful_sync_records" ADD CONSTRAINT "printful_sync_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printful_sync_records" ADD CONSTRAINT "printful_sync_records_manufacturing_id_manufacturing_id_fk" FOREIGN KEY ("manufacturing_id") REFERENCES "public"."manufacturing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printful_sync_records" ADD CONSTRAINT "printful_sync_records_synced_by_users_id_fk" FOREIGN KEY ("synced_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_cogs" ADD CONSTRAINT "product_cogs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_cogs" ADD CONSTRAINT "product_cogs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_fabrics" ADD CONSTRAINT "product_variant_fabrics_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_fabrics" ADD CONSTRAINT "product_variant_fabrics_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_fabrics" ADD CONSTRAINT "product_variant_fabrics_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_default_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("default_manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_backup_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("backup_manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_action_logs" ADD CONSTRAINT "quick_action_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_parent_resource_id_resources_id_fk" FOREIGN KEY ("parent_resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_resources" ADD CONSTRAINT "sales_resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salespersons" ADD CONSTRAINT "salespersons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_adjustment_requests" ADD CONSTRAINT "size_adjustment_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_adjustment_requests" ADD CONSTRAINT "size_adjustment_requests_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_store_line_items" ADD CONSTRAINT "team_store_line_items_team_store_id_team_stores_id_fk" FOREIGN KEY ("team_store_id") REFERENCES "public"."team_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_store_line_items" ADD CONSTRAINT "team_store_line_items_line_item_id_order_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."order_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_stores" ADD CONSTRAINT "team_stores_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_stores" ADD CONSTRAINT "team_stores_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_stores" ADD CONSTRAINT "team_stores_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_stores" ADD CONSTRAINT "team_stores_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_merch_bundles" ADD CONSTRAINT "tour_merch_bundles_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_merch_bundles" ADD CONSTRAINT "tour_merch_bundles_team_store_id_team_stores_id_fk" FOREIGN KEY ("team_store_id") REFERENCES "public"."team_stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_merch_bundles" ADD CONSTRAINT "tour_merch_bundles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_manufacturer_associations" ADD CONSTRAINT "user_manufacturer_associations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_manufacturer_associations" ADD CONSTRAINT "user_manufacturer_associations_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_specifications" ADD CONSTRAINT "variant_specifications_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_design_sessions_design_job_id" ON "ai_design_sessions" USING btree ("design_job_id");--> statement-breakpoint
CREATE INDEX "idx_ai_design_sessions_variant_id" ON "ai_design_sessions" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_ai_design_sessions_user_id" ON "ai_design_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_design_sessions_status" ON "ai_design_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_budgets_type" ON "budgets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_budgets_period" ON "budgets" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_budgets_status" ON "budgets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_payments_salesperson_id" ON "commission_payments" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "idx_commission_payments_period" ON "commission_payments" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_commission_payments_payment_date" ON "commission_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_commissions_salesperson_id" ON "commissions" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_status" ON "commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commissions_period" ON "commissions" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_contractor_files_contractor_id" ON "contractor_files" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_contractor_payments_contractor_id" ON "contractor_payments" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "idx_custom_financial_entries_order_id" ON "custom_financial_entries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_custom_financial_entries_entry_type" ON "custom_financial_entries" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "idx_customer_comments_order_id" ON "customer_comments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_design_resources_category" ON "design_resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_design_resources_uploaded_by" ON "design_resources" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_event_budgets_event_id" ON "event_budgets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_campaigns_event_id" ON "event_campaigns" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_contractors_event_id" ON "event_contractors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_contractors_status" ON "event_contractors" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_event_inventory_movements_event_id" ON "event_inventory_movements" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_inventory_movements_merch_id" ON "event_inventory_movements" USING btree ("merchandise_id");--> statement-breakpoint
CREATE INDEX "idx_event_merchandise_event_id" ON "event_merchandise" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_merchandise_variant_id" ON "event_merchandise" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_event_registrations_event_id" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_registrations_email" ON "event_registrations" USING btree ("attendee_email");--> statement-breakpoint
CREATE INDEX "idx_event_staff_event_id" ON "event_staff" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_staff_user_id" ON "event_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_stages_event_id" ON "event_stages" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_created_by" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_fabric_submissions_manufacturing_id" ON "fabric_submissions" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_fabric_submissions_line_item_id" ON "fabric_submissions" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "idx_fabric_submissions_status" ON "fabric_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fabric_submissions_submitted_by" ON "fabric_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_fabrics_name" ON "fabrics" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_fabrics_is_approved" ON "fabrics" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "idx_fabrics_fabric_type" ON "fabrics" USING btree ("fabric_type");--> statement-breakpoint
CREATE INDEX "idx_financial_alerts_recipient_id" ON "financial_alerts" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_financial_alerts_type" ON "financial_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "idx_financial_alerts_severity" ON "financial_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_financial_reports_type" ON "financial_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_financial_reports_generated_by" ON "financial_reports" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "idx_financial_transactions_type" ON "financial_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_financial_transactions_status" ON "financial_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_financial_transactions_order_id" ON "financial_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_financial_transactions_salesperson_id" ON "financial_transactions" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_payments_invoice_id" ON "invoice_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_payments_payment_date" ON "invoice_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_order_id" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_org_id" ON "invoices" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_license_acceptances_user_id" ON "license_acceptances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_license_acceptances_version" ON "license_acceptances" USING btree ("license_version");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_events_job_id" ON "manufacturer_events" USING btree ("manufacturer_job_id");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_events_type" ON "manufacturer_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_events_created_at" ON "manufacturer_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_jobs_manufacturing_id" ON "manufacturer_jobs" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_jobs_order_id" ON "manufacturer_jobs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_jobs_manufacturer_id" ON "manufacturer_jobs" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_jobs_status" ON "manufacturer_jobs" USING btree ("manufacturer_status");--> statement-breakpoint
CREATE INDEX "idx_manufacturer_jobs_public_status" ON "manufacturer_jobs" USING btree ("public_status");--> statement-breakpoint
CREATE INDEX "idx_attachments_manufacturing_id" ON "manufacturing_attachments" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_batch_id" ON "manufacturing_attachments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_batch_items_batch_id" ON "manufacturing_batch_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_batch_items_manufacturing_id" ON "manufacturing_batch_items" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_id" ON "manufacturing_notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_manufacturing_id" ON "manufacturing_notifications" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_quality_checkpoints_manufacturing_id" ON "manufacturing_quality_checkpoints" USING btree ("manufacturing_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_order_form_line_item_sizes_submission_id" ON "order_form_line_item_sizes" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_order_form_line_item_sizes_line_item_id" ON "order_form_line_item_sizes" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_form_submissions_order_id" ON "order_form_submissions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_tracking_order_id" ON "order_tracking_numbers" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_pantone_assignments_line_item_id" ON "pantone_assignments" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "idx_pantone_assignments_manufacturing_update_id" ON "pantone_assignments" USING btree ("manufacturing_update_id");--> statement-breakpoint
CREATE INDEX "idx_pantone_assignments_pantone_code" ON "pantone_assignments" USING btree ("pantone_code");--> statement-breakpoint
CREATE INDEX "idx_printful_sync_order_id" ON "printful_sync_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_printful_sync_printful_order_id" ON "printful_sync_records" USING btree ("printful_order_id");--> statement-breakpoint
CREATE INDEX "idx_printful_sync_status" ON "printful_sync_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_product_cogs_variant_id" ON "product_cogs" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_product_variant_fabrics_variant_id" ON "product_variant_fabrics" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_product_variant_fabrics_fabric_id" ON "product_variant_fabrics" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "idx_production_schedules_manufacturer_id" ON "production_schedules" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "idx_quick_action_logs_action_id" ON "quick_action_logs" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "idx_quick_action_logs_user_id" ON "quick_action_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quick_action_logs_hub_id" ON "quick_action_logs" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "idx_quick_action_logs_status" ON "quick_action_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_quick_action_logs_started_at" ON "quick_action_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_requests_type" ON "requests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_requests_status" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_requests_entity" ON "requests" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_requests_submitted_by" ON "requests" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_requests_assigned_to" ON "requests" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_size_adjustment_requests_order_id" ON "size_adjustment_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_by" ON "tasks" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_page_key" ON "tasks" USING btree ("page_key");--> statement-breakpoint
CREATE INDEX "idx_team_store_line_items_team_store_id" ON "team_store_line_items" USING btree ("team_store_id");--> statement-breakpoint
CREATE INDEX "idx_team_store_line_items_line_item_id" ON "team_store_line_items" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "idx_team_stores_order_id" ON "team_stores" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_team_stores_salesperson_id" ON "team_stores" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "idx_team_stores_status" ON "team_stores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_team_stores_stage" ON "team_stores" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_tour_merch_bundles_event_id" ON "tour_merch_bundles" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_tour_merch_bundles_team_store_id" ON "tour_merch_bundles" USING btree ("team_store_id");--> statement-breakpoint
CREATE INDEX "idx_tour_merch_bundles_status" ON "tour_merch_bundles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_manufacturer_user_id" ON "user_manufacturer_associations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_manufacturer_manufacturer_id" ON "user_manufacturer_associations" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_user_id" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_resource_id" ON "user_permissions" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_variant_specifications_variant_id" ON "variant_specifications" USING btree ("variant_id");