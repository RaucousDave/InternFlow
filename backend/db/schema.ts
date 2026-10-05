import { date, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const entryStatusEnum = pgEnum("entryStatus", ["draft", "submitted"]);
export const supervisors = pgTable("supervisors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  password: text("password").notNull(),
  createdAt: date("created_at").defaultNow(),
  deptId: text("dept_id")
    .notNull()
    .references(() => departments.id),
});

export const departments = pgTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
});

export const students = pgTable("students", {
  supervisorId: text("supervisor_id")
    .notNull()
    .references(() => supervisors.id),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
    .notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  regNo: text("reg_number").notNull(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  deptId: text("dept_id")
    .notNull()
    .references(() => departments.id),
});

export const logbook = pgTable("logbook", {
  entryStatus: entryStatusEnum("entry_status").default("draft").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  studentId: text("student_id").references(() => students.id, {
    onDelete: "cascade",
  }),
  entryDate: date("entry_date").defaultNow().notNull(),
});
