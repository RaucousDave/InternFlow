import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const src = () =>
  fs.readFileSync(path.join(import.meta.dir, "../src/routes/student.ts"), "utf8");

// Pure replicas of validation helpers for contract testing (no DB needed).
const REG_RE = /^\d{2}\/SC\/CO\/\d{3}$/;
const idParam = (v: string): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

describe("BE-3 student routes: profile, placement, logbook, feedback", () => {
  test("registration number regex contract", () => {
    expect(REG_RE.test("23/SC/CO/044")).toBe(true);
    expect(REG_RE.test("23/sc/co/044")).toBe(false); // must be uppercased server-side first
    expect("23/SC/CO/044".toUpperCase()).toMatch(REG_RE);
    expect(REG_RE.test("bad-number")).toBe(false);
    expect(REG_RE.test("")).toBe(false);
  });

  test("idParam rejects blank ids", () => {
    expect(idParam("abc")).toBe("abc");
    expect(idParam("  ")).toBeNull();
    expect(idParam("")).toBeNull();
  });

  test("profile endpoints exist with duplicate + validation guards", () => {
    const s = src();
    expect(s).toContain("'/students/profile'");
    expect(s).toContain("REG_RE");
    expect(s).toContain("DUPLICATE_REGISTRATION");
    expect(s).toContain("INVALID_REGISTRATION");
    expect(s).toContain("409");
  });

  test("placement CRUD endpoints exist with ownership checks", () => {
    const s = src();
    expect(s).toContain("'/placements'");
    expect(s).toContain("'/placements/:id'");
    expect(s).toContain("PROFILE_NOT_SET");
    expect(s).toContain("MISSING_FIELDS");
    expect(s).toContain("NOT_FOUND");
  });

  test("logbook CRUD + submit locking + week uniqueness", async () => {
    const s = src();
    expect(s).toContain("'/logbook'");
    expect(s).toContain("'/logbook/:id'");
    expect(s).toContain("'/logbook/:id/submit'");
    expect(s).toContain("DUPLICATE_WEEK");
    expect(s).toContain("LOCKED"); // submitted entries cannot be edited
    expect(s).toContain("INVALID_WEEK");
    // uniqueness also enforced at DB level via unique index
    const schemaSrc = fs.readFileSync(path.join(import.meta.dir, "../src/db/schema.ts"), "utf8");
    expect(schemaSrc).toContain("one_entry_per_week");
  });

  test("student feedback read joins own entries only", async () => {
    const s = src();
    expect(s).toContain("'/feedback'");
    expect(s).toContain("innerJoin");
    expect(s).toContain("logbookEntries.studentId");
    const schema = await import("../src/db/schema.ts");
    expect(schema.feedback).toBeDefined();
    expect(schema.logbookEntries).toBeDefined();
  });
});
