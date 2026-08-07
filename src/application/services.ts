import { buildExecutiveAttentionQueue } from '../domain/attention';
import { assessInvoice, type InvoiceAssurance } from '../domain/contracts';
import { remediationPriority, type RemediationItem } from '../domain/remediation';
import type { AuditSink } from '../domain/audit';
import type { AttentionRepository, Clock, ContractRepository, RemediationRepository } from './ports';

export class ExecutiveAttentionService {
  constructor(private readonly repository: AttentionRepository) {}

  async build(tenantId: string, limit = 10) {
    const signals = await this.repository.listSignals(tenantId);
    const queue = buildExecutiveAttentionQueue(signals, limit);
    await this.repository.saveQueueSnapshot(tenantId, queue);
    return queue;
  }
}

export class InvoiceAssuranceApplicationService {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly audit: AuditSink
  ) {}

  async assess(tenantId: string, invoiceId: string, actorUserId?: string): Promise<InvoiceAssurance> {
    const invoice = await this.contracts.getInvoice(tenantId, invoiceId);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    const milestones = await this.contracts.listInvoiceMilestones(tenantId, invoiceId);
    const result = assessInvoice(invoice, milestones);

    await this.audit.append({
      id: crypto.randomUUID(),
      tenantId,
      ...(actorUserId ? { actorUserId } : {}),
      action: 'invoice.assurance.assessed',
      resourceType: 'invoice',
      resourceId: invoiceId,
      occurredAt: new Date().toISOString(),
      after: result,
      metadata: { recommendation: result.recommendation, confidence: result.confidence }
    });

    return result;
  }
}

export class RemediationQueueService {
  constructor(
    private readonly remediation: RemediationRepository,
    private readonly clock: Clock
  ) {}

  async listPrioritized(tenantId: string, businessUnitId: string): Promise<Array<RemediationItem & { priority: number }>> {
    const items = await this.remediation.listByBusinessUnit(tenantId, businessUnitId);
    const now = this.clock.now();
    return items
      .map(item => ({ ...item, priority: remediationPriority(item, now) }))
      .sort((a, b) => b.priority - a.priority);
  }
}
