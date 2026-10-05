import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("BE-1 foundation: DB schema + auth + config", () => {
  test("schema defines all required tables", async () => {
    const schema = await import("../src/db/schema.ts");
    for (const t of ["user", "session", "account", "verification", "students", "supervisors", "placements", "logbookEntries", "feedback"]) {
      expect(schema[t], `missing table export: ${t}`).toBeDefined();
    }
    // spot-check critical columns
    expect(schema.user.role).toBeDefined();
    expect(schema.students.registrationNumber).toBeDefined();
    expect(schema.logbookEntries.status).toBeDefined();
  });

  test("db client exports a drizzle db", async () => {
    // must not throw without DATABASE_URL (lazy connection)
    const client = await import("../src/db/client.ts");
    expect(client.db).toBeDefined();
  });

  test("auth uses email+password, min 8, 7-day session", async () => {
    const { auth } = await import("../src/auth.ts");
    expect(auth).toBeDefined();
    // better-auth exposes options; verify via source text to avoid internal API drift
    const src = fs.readFileSync(path.join(import.meta.dir, "../src/auth.ts"), "utf8");
    expect(src).toContain("emailAndPassword");
    expect(src).toContain("minPasswordLength: 8");
    expect(src).toContain("60 * 60 * 24 * 7");
    expect(src).toContain('provider: "pg"');
  });

  test("bun-first config files exist", () => {
    const root = path.join(import.meta.dir, "..");
    for (const f of ["package.json", "tsconfig.json", "drizzle.config.ts", "Dockerfile", ".env.example", ".gitignore"]) {
      expect(fs.existsSync(path.join(root, f)), `missing ${f}`).toBe(true);
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.scripts.dev).toContain("bun");
    expect(pkg.scripts.test).toBe("bun test");
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies["drizzle-orm"]).toBeDefined();
    const docker = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
    expect(docker).toContain("oven/bun");
  });
});
