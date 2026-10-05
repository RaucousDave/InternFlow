import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8000',
    trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});
