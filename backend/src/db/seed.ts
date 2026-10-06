import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "../auth.js";
import { db } from "./client.js";
import { supervisors, user } from "./schema.js";

// Department supervisor bootstrap. Run with: bun run db:seed
// Credentials come from the environment so no real password lives in git:
//   SEED_SUPERVISOR_EMAIL, SEED_SUPERVISOR_PASSWORD,
//   SEED_SUPERVISOR_NAME, SEED_SUPERVISOR_DISPLAY_NAME
const EMAIL = process.env.SEED_SUPERVISOR_EMAIL ?? "supervisor@internflow.test";
const PASSWORD = process.env.SEED_SUPERVISOR_PASSWORD ?? "Supervisor123";
const NAME = process.env.SEED_SUPERVISOR_NAME ?? "Department Supervisor";
const DISPLAY_NAME = process.env.SEED_SUPERVISOR_DISPLAY_NAME ?? NAME;

export async function seed() {
  // 1. Find or create the auth user through better-auth so password
  //    hashing (scrypt) is handled by the library, never by hand.
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, EMAIL))
    .limit(1);
  let userId: string;
  if (existing[0]) {
    userId = existing[0].id;
    console.log(`seed: auth user ${EMAIL} already exists, reusing it`);
  } else {
    try {
      const res = await auth.api.signUpEmail({
        body: { name: NAME, email: EMAIL, password: PASSWORD },
      });
      userId = res.user.id;
      console.log(`seed: created auth user ${EMAIL}`);
    } catch {
      // Lost a race with another seed run: re-read the row.
      const retry = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, EMAIL))
        .limit(1);
      if (!retry[0]) throw new Error(`seed: could not create or find ${EMAIL}`);
      userId = retry[0].id;
    }
  }

  // 2. Flip the role server-side. Role is never accepted from the client.
  await db.update(user).set({ role: "SUPERVISOR" }).where(eq(user.id, userId));

  // 3. Ensure the supervisors profile row the auth guard and
  //    supervisor routes depend on (middleware/auth.ts, routes/supervisor.ts).
  const prof = await db
    .select({ id: supervisors.id })
    .from(supervisors)
    .where(eq(supervisors.userId, userId))
    .limit(1);
  if (!prof[0]) {
    await db.insert(supervisors).values({
      userId,
      departmentEmail: EMAIL,
      displayName: DISPLAY_NAME,
    });
    console.log(`seed: created supervisors profile for ${EMAIL}`);
  } else {
    console.log(`seed: supervisors profile already exists`);
  }

  console.log(`seed: done. Supervisor login -> ${EMAIL}`);
}

if (import.meta.main) {
  await seed();
  process.exit(0);
}
