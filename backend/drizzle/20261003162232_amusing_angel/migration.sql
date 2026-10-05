CREATE TYPE "entry_status" AS ENUM ('draft', 'submitted');
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logbook" (
	"entryStatus" "entry_status" DEFAULT 'draft'::"entry_status" NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"student_id" text,
	"entry_date" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"supervisor_id" text NOT NULL,
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"reg_number" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"dept_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervisors" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" date DEFAULT now(),
	"dept_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logbook" ADD CONSTRAINT "logbook_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_supervisor_id_supervisors_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("id");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_dept_id_departments_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_dept_id_departments_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id");