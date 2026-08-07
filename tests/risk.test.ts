import { describe, expect, it } from "vitest";
import { assessBusinessUnitRisk } from "../src/domain/risk";

describe("assessBusinessUnitRisk", () => {
  it("marks incomplete governance evidence as violet", () => {
    const result = assessBusinessUnitRisk({
      criticalFindings: 0,
      highFindings: 0,
      overdueFindings: 0,
      patchCompliancePct: 99,
      controlCoveragePct: 99,
      evidenceCompletenessPct: 60,
      trendDelta: 3,
    });
    expect(result.color).toBe("violet");
  });

  it("marks exceptional posture as blue", () => {
    const result = assessBusinessUnitRisk({
      criticalFindings: 0,
      highFindings: 0,
      overdueFindings: 0,
      patchCompliancePct: 100,
      controlCoveragePct: 100,
      evidenceCompletenessPct: 100,
      trendDelta: 2,
    });
    expect(result.color).toBe("blue");
    expect(result.score).toBeGreaterThanOrEqual(95);
  });

  it("penalizes critical and overdue findings", () => {
    const result = assessBusinessUnitRisk({
      criticalFindings: 2,
      highFindings: 4,
      overdueFindings: 5,
      patchCompliancePct: 82,
      controlCoveragePct: 78,
      evidenceCompletenessPct: 96,
      trendDelta: -3,
    });
    expect(["orange", "red"]).toContain(result.color);
    expect(result.rationale.length).toBeGreaterThan(1);
  });
});
