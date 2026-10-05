import { randomUUID } from "node:crypto";
import {
  boolean,
  integer,
  pgTable,
  text,
  index,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const uuid = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

// ---- better-auth core tables (managed by the library, do not write to by hand) ----
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("STUDENT"), // set ONLY by seed/server code, never from the client
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---- InternFlow domain tables (every id is a UUID string) ----
export const students = pgTable("students", {
  id: uuid(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  registrationNumber: text("registration_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  department: text("department"),
  faculty: text("faculty"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const supervisors = pgTable("supervisors", {
  id: uuid(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  departmentEmail: text("department_email").notNull(),
  displayName: text("display_name").notNull(),
});

export const placements = pgTable("placements", {
  id: uuid(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  orgName: text("org_name").notNull(),
  orgAddress: text("org_address").notNull(),
  position: text("position").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  industrySupervisorName: text("industry_supervisor_name").notNull(),
  industrySupervisorContact: text("industry_supervisor_contact").notNull(),
});

export const logbookEntries = pgTable(
  "logbook_entries",
  {
    id: uuid(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    weekNumber: integer("week_number").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    activities: text("activities").notNull(),
    challenges: text("challenges").notNull(),
    lessons: text("lessons").notNull(),
    status: text("status").notNull().default("DRAFT"), // DRAFT|SUBMITTED|REVIEWED
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("one_entry_per_week").on(t.studentId, t.weekNumber)],
);

export const feedback = pgTable("feedback", {
  id: uuid(),
  logbookEntryId: text("logbook_entry_id")
    .notNull()
    .references(() => logbookEntries.id),
  supervisorId: text("supervisor_id")
    .notNull()
    .references(() => supervisors.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
