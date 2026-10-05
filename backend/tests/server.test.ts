import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("BE-5 server wiring: express + routers + health", () => {
  test("index mounts all routers with CORS credentials + JSON", () => {
    const s = fs.readFileSync(path.join(import.meta.dir, "../src/index.ts"), "utf8");
    expect(s).toContain("express()");
    expect(s).toContain("cors(");
    expect(s).toContain("credentials: true");
    expect(s).toContain("express.json()");
    expect(s).toContain("authRouter");
    expect(s).toContain("studentRouter");
    expect(s).toContain("supervisorRouter");
    expect(s).toContain("toNodeHandler(auth)");
    expect(s).toContain("/api/auth/*");
    expect(s).toContain("'/health'");
  });

  test("seed placeholder exists (supervisor bootstrap TODO)", async () => {
    const s = fs.readFileSync(path.join(import.meta.dir, "../src/db/seed.ts"), "utf8");
    expect(s).toContain("SUPERVISOR");
    expect(s).toContain("seed");
  });

  test("backend README documents contract + Bun commands", () => {
    const r = fs.readFileSync(path.join(import.meta.dir, "../README.md"), "utf8");
    expect(r).toContain("/api/auth/sign-up/email");
    expect(r).toContain("/api/me");
    expect(r.toLowerCase()).toContain("supervisor");
  });

  test("all route modules import without DB connection (lazy pool)", async () => {
    const mods = await Promise.all([
      import("../src/routes/auth.ts"),
      import("../src/routes/student.ts"),
      import("../src/routes/supervisor.ts"),
    ]);
    expect(mods[0].authRouter).toBeDefined();
    expect(mods[1].studentRouter).toBeDefined();
    expect(mods[2].supervisorRouter).toBeDefined();
  });
});
