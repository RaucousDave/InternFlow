import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.ts";

// Single auth instance for the whole backend. Email+password only for the MVP
// (no OAuth providers). The `role` column lives on the user table but is NOT
// a signup field — only seed/server code may set SUPERVISOR.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  trustedOrigins: ["https://intern-flow-lime.vercel.app"],
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
});
