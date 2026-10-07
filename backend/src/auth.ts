import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.ts";

// Single auth instance for the whole backend. Email+password only for the MVP
// (no OAuth providers). The `role` column lives on the user table but is NOT
// a signup field — only seed/server code may set SUPERVISOR.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  trustedOrigins: [
    process.env.FRONTEND_URL ?? "https://intern-flow-lime.vercel.app",
    "http://localhost:5173",
  ],
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
  // Cross-site cookies (Vercel frontend -> Render backend are different sites).
  // Default SameSite=Lax is rejected by the browser on cross-site fetch, so
  // the session cookie is never stored/sent -> every /api/me returns 401.
  // SameSite=None + Secure + useSecureCookies fixes it (requires HTTPS).
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true, // CHIPS: keeps third-party cookie working in Chrome
    },
  },
});
