export type AttentionCategory = 'security' | 'delivery' | 'contract' | 'financial' | 'governance';

export interface AttentionSignal {
  id: string;
  tenantId: string;
  category: AttentionCategory;
  title: string;
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  ageHours: number;
  financialExposureCents?: number;
  overdue?: boolean;
  evidenceRefs: string[];
  recommendedAction: string;
}

export interface AttentionItem extends AttentionSignal {
  priority: number;
}

export function attentionPriority(signal: AttentionSignal): number {
  const severity = signal.severity * 18;
  const age = Math.min(20, signal.ageHours / 12);
  const overdue = signal.overdue ? 15 : 0;
  const money = Math.min(20, (signal.financialExposureCents ?? 0) / 5_000_000);
  const evidenceConfidence = Math.max(0, Math.min(10, signal.confidence / 10));
  return Math.round(severity + age + overdue + money + evidenceConfidence);
}

export function buildExecutiveAttentionQueue(signals: AttentionSignal[], limit = 10): AttentionItem[] {
  return signals
    .map(signal => ({ ...signal, priority: attentionPriority(signal) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
