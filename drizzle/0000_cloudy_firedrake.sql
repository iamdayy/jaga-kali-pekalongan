CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"action" text NOT NULL,
	"admin_user" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"user_identifier" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"report_type" text DEFAULT 'general' NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"address" text,
	"image_urls" text[] DEFAULT '{}',
	"user_name" text,
	"user_email" text,
	"user_phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmations_count" integer DEFAULT 0,
	"is_anonymous" boolean DEFAULT true,
	"is_valuable" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"proof_image_urls" text[] DEFAULT '{}',
	"completed_at" timestamp with time zone,
	"admin_notes" text,
	"assigned_to" text,
	"last_updated_by" text
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;