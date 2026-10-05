import { describe, test, expect, mock } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("BE-2 auth session: middleware + GET /api/me", () => {
  test("middleware exports requireAuth with 401 UNAUTHENTICATED shape", async () => {
    const src = fs.readFileSync(path.join(import.meta.dir, "../src/middleware/auth.ts"), "utf8");
    expect(src).toContain("requireAuth");
    expect(src).toContain("UNAUTHENTICATED");
    expect(src).toContain("auth.api.getSession");
    expect(src).toContain("STUDENT");
    expect(src).toContain("SUPERVISOR");
    // role resolution must default unknown roles to STUDENT (never trust client)
    expect(src).toContain("'SUPERVISOR' ? 'SUPERVISOR' : 'STUDENT'");
  });

  test("auth router serves GET /me with role+email only", async () => {
    const src = fs.readFileSync(path.join(import.meta.dir, "../src/routes/auth.ts"), "utf8");
    expect(src).toContain("authRouter.get('/me'");
    expect(src).toContain("requireAuth");
    expect(src).toContain("role");
    expect(src).toContain("email");
    // handler must return only { role, email } — never a password hash / token
    expect(src).toContain("res.json({ role:");
    expect(src).toContain("email:");
  });

  test("requireAuth rejects unauthenticated requests with 401 (mocked session)", async () => {
    // Import the real middleware but stub auth.api.getSession to return null
    const authMod = await import("../src/auth.ts");
    const orig = authMod.auth.api.getSession;
    (authMod.auth.api as any).getSession = async () => null;
    try {
      const { requireAuth } = await import("../src/middleware/auth.ts");
      let statusCode = 0;
      let body: any = null;
      const req: any = { headers: {} };
      const res: any = {
        status: (c: number) => {
          statusCode = c;
          return { json: (b: any) => (body = b) };
        },
      };
      let nextCalled = false;
      await requireAuth(req, res, () => (nextCalled = true));
      expect(statusCode).toBe(401);
      expect(body.code).toBe("UNAUTHENTICATED");
      expect(nextCalled).toBe(false);
    } finally {
      (authMod.auth.api as any).getSession = orig;
    }
  });
});
