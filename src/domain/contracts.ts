export type AcceptanceState = 'not_started' | 'in_progress' | 'submitted' | 'accepted' | 'rejected';
export type InvoiceState = 'draft' | 'submitted' | 'held' | 'approved' | 'paid';

export interface Contract {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  ceilingCents: number;
  startDate: string;
  endDate: string;
}

export interface StatementOfWork {
  id: string;
  contractId: string;
  title: string;
  milestoneIds: string[];
}

export interface Milestone {
  id: string;
  sowId: string;
  name: string;
  amountCents: number;
  acceptanceState: AcceptanceState;
  workItemRefs: string[];
  evidenceRefs: string[];
}

export interface Invoice {
  id: string;
  contractId: string;
  vendorId: string;
  amountCents: number;
  state: InvoiceState;
  milestoneIds: string[];
  submittedAt: string;
}

export interface InvoiceAssurance {
  confidence: number;
  recommendation: 'approve' | 'review' | 'hold';
  rationale: string[];
}

export function assessInvoice(invoice: Invoice, milestones: Milestone[]): InvoiceAssurance {
  const linked = milestones.filter(m => invoice.milestoneIds.includes(m.id));
  if (linked.length === 0) return { confidence: 0, recommendation: 'hold', rationale: ['Invoice has no linked milestones.'] };

  const accepted = linked.filter(m => m.acceptanceState === 'accepted');
  const withEvidence = linked.filter(m => m.evidenceRefs.length > 0);
  const acceptanceRatio = accepted.length / linked.length;
  const evidenceRatio = withEvidence.length / linked.length;
  const confidence = Math.round((acceptanceRatio * 0.65 + evidenceRatio * 0.35) * 100);
  const rationale = [
    `${accepted.length}/${linked.length} linked milestones accepted.`,
    `${withEvidence.length}/${linked.length} linked milestones contain delivery evidence.`
  ];

  if (acceptanceRatio < 1) return { confidence, recommendation: 'hold', rationale: [...rationale, 'One or more billed milestones are not accepted.'] };
  if (evidenceRatio < 1) return { confidence, recommendation: 'review', rationale: [...rationale, 'Acceptance exists but evidence is incomplete.'] };
  return { confidence, recommendation: 'approve', rationale };
}
