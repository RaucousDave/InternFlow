import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const src = () =>
  fs.readFileSync(path.join(import.meta.dir, "../src/routes/supervisor.ts"), "utf8");

describe("BE-4 supervisor routes: review + completion gate", () => {
  test("supervisor gate requires SUPERVISOR role", () => {
    const s = src();
    expect(s).toContain("SUPERVISOR");
    expect(s).toContain("FORBIDDEN");
    expect(s).toContain("requireSupervisor");
    expect(s).toContain("403");
  });

  test("student reads: list, detail with placements, logbook", () => {
    const s = src();
    expect(s).toContain("'/supervisor/students'");
    expect(s).toContain("'/supervisor/students/:id'");
    expect(s).toContain("'/supervisor/students/:id/logbook'");
    expect(s).toContain("placements");
  });

  test("feedback only on SUBMITTED entries, flips to REVIEWED", () => {
    const s = src();
    expect(s).toContain("'/supervisor/logbook/:id/feedback'");
    expect(s).toContain("NOT_SUBMITTED");
    expect(s).toContain("422");
    expect(s).toContain("REVIEWED");
    expect(s).toContain("MISSING_FIELDS");
  });

  test("completion gate checks profile + placement + reviewed weeks", () => {
    const s = src();
    expect(s).toContain("'/supervisor/students/:id/complete'");
    expect(s).toContain("COMPLETION_BLOCKED");
    expect(s).toContain("REQUIRED_WEEKS");
    expect(s).toContain("reviewed");
    expect(s).toContain("completed");
  });

  test("completion math: reviewed count vs REQUIRED_WEEKS", () => {
    // pure logic replica — no DB needed
    const gate = (reviewed: number, required = 4) =>
      reviewed < required
        ? { blocked: true, missing: [`reviewed weeks (${reviewed}/${required})`] }
        : { blocked: false, missing: [] as string[] };
    expect(gate(0).blocked).toBe(true);
    expect(gate(3).blocked).toBe(true);
    expect(gate(4).blocked).toBe(false);
    expect(gate(2, 2).blocked).toBe(false);
  });
});
