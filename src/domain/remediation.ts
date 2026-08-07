export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type RemediationStatus = 'open' | 'in_progress' | 'risk_accepted' | 'resolved' | 'verified';

export interface RemediationItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  ownerUserId: string;
  title: string;
  severity: Severity;
  status: RemediationStatus;
  discoveredAt: string;
  dueAt: string;
  verifiedAt?: string;
  source: 'scanner' | 'audit' | 'incident' | 'manual' | 'code';
  evidenceRefs: string[];
}

export const defaultSlaDays: Record<Severity, number> = {
  critical: 7,
  high: 14,
  medium: 30,
  low: 90
};

export function isOverdue(item: RemediationItem, now: Date): boolean {
  if (item.status === 'resolved' || item.status === 'verified' || item.status === 'risk_accepted') return false;
  return new Date(item.dueAt).getTime() < now.getTime();
}

export function remediationPriority(item: RemediationItem, now: Date): number {
  const severityWeight: Record<Severity, number> = { critical: 100, high: 70, medium: 40, low: 15 };
  const overdueBoost = isOverdue(item, now) ? 35 : 0;
  const evidencePenalty = item.evidenceRefs.length === 0 ? 10 : 0;
  return Math.min(150, severityWeight[item.severity] + overdueBoost + evidencePenalty);
}

export function slaDueDate(discoveredAt: Date, severity: Severity, policy = defaultSlaDays): Date {
  const due = new Date(discoveredAt);
  due.setUTCDate(due.getUTCDate() + policy[severity]);
  return due;
}
