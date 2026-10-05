import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/_relations";

const entryStatusEnum = pgEnum("entryStatus", ["draft", "submitted"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").notNull().default("STUDENT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

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

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const students = pgTable("students", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id),
  registrationNumber: text("registration_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  department: text("department"),
  faculty: text("faculty"),
});

export const supervisors = pgTable("supervisors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id),
  departmentEmail: text("department_email").notNull(),
  displayName: text("display_name").notNull(),
});

export const placements = pgTable("placements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").references(() => students.id),
  orgName: text("org_name").notNull(),
  orgAddress: text("org_address").notNull(),
  positions: text("position").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  industrySupervisorName: text("industry_supervisor_name").notNull(),
  industrySupervisorContact: text("industry_supervisor_contact").notNull(),
});

export const logBookEntries = pgTable("logbook_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").references(() => students.id),
  weekNumber: integer("week_number").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  activities: text("activities").notNull(),
  challenges: text("challenges").notNull(),
  lessons: text("lessons").notNull(),
  status: text("status"),
});

export const feedback = pgTable("feedback", {
  id: text("id").$defaultFn(() => crypto.randomUUID()),
  logBookEntryId: text("student_id").references(() => logBookEntries.id),
  supervisorId: text("supervisor_id").references(() => supervisors.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
