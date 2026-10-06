CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"logbook_entry_id" text NOT NULL,
	"supervisor_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logbook_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"week_number" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"activities" text NOT NULL,
	"challenges" text NOT NULL,
	"lessons" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"org_name" text NOT NULL,
	"org_address" text NOT NULL,
	"position" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"industry_supervisor_name" text NOT NULL,
	"industry_supervisor_contact" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"department" text,
	"faculty" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "students_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "supervisors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"department_email" text NOT NULL,
	"display_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'STUDENT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_logbook_entry_id_logbook_entries_id_fk" FOREIGN KEY ("logbook_entry_id") REFERENCES "public"."logbook_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_supervisor_id_supervisors_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_entry_per_week" ON "logbook_entries" USING btree ("student_id","week_number");