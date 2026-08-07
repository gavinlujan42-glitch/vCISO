export type RiskColor = "blue" | "green" | "yellow" | "orange" | "red" | "violet";

export interface RiskInputs {
  criticalFindings: number;
  highFindings: number;
  overdueFindings: number;
  patchCompliancePct: number;
  controlCoveragePct: number;
  evidenceCompletenessPct: number;
  trendDelta: number;
}

export interface RiskAssessment {
  score: number;
  color: RiskColor;
  rationale: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function assessBusinessUnitRisk(input: RiskInputs): RiskAssessment {
  const rationale: string[] = [];

  if (input.evidenceCompletenessPct < 70) {
    return {
      score: clamp(input.evidenceCompletenessPct),
      color: "violet",
      rationale: ["Insufficient governance evidence to support a reliable risk determination."],
    };
  }

  let score = 100;
  score -= input.criticalFindings * 18;
  score -= input.highFindings * 5;
  score -= input.overdueFindings * 4;
  score -= Math.max(0, 95 - input.patchCompliancePct) * 0.8;
  score -= Math.max(0, 90 - input.controlCoveragePct) * 0.5;
  score += Math.max(-5, Math.min(5, input.trendDelta));
  score = Math.round(clamp(score));

  if (input.criticalFindings > 0) rationale.push(`${input.criticalFindings} critical finding(s) require executive visibility.`);
  if (input.overdueFindings > 0) rationale.push(`${input.overdueFindings} remediation item(s) are beyond SLA.`);
  if (input.patchCompliancePct < 95) rationale.push(`Patch compliance is ${input.patchCompliancePct}%, below the 95% target.`);
  if (input.controlCoveragePct < 90) rationale.push(`Control coverage is ${input.controlCoveragePct}%, below the 90% target.`);
  if (input.trendDelta > 0) rationale.push("Risk posture is improving.");
  if (input.trendDelta < 0) rationale.push("Risk posture is deteriorating.");

  let color: RiskColor;
  if (score >= 95 && input.criticalFindings === 0 && input.overdueFindings === 0) color = "blue";
  else if (score >= 85) color = "green";
  else if (score >= 70) color = "yellow";
  else if (score >= 55) color = "orange";
  else color = "red";

  if (rationale.length === 0) rationale.push("Controls, patching, remediation, and evidence are within target thresholds.");

  return { score, color, rationale };
}
