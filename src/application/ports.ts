import type { AttentionItem, AttentionSignal } from '../domain/attention';
import type { Invoice, InvoiceAssurance, Milestone } from '../domain/contracts';
import type { EngineeringEvidenceEvent } from '../domain/engineering';
import type { RemediationItem } from '../domain/remediation';

export interface RemediationRepository {
  listByBusinessUnit(tenantId: string, businessUnitId: string): Promise<RemediationItem[]>;
  save(item: RemediationItem): Promise<void>;
}

export interface EngineeringEvidenceRepository {
  append(event: EngineeringEvidenceEvent): Promise<void>;
  listByRepository(tenantId: string, repository: string, since?: string): Promise<EngineeringEvidenceEvent[]>;
}

export interface ContractRepository {
  getInvoice(tenantId: string, invoiceId: string): Promise<Invoice | null>;
  listInvoiceMilestones(tenantId: string, invoiceId: string): Promise<Milestone[]>;
}

export interface AttentionRepository {
  listSignals(tenantId: string): Promise<AttentionSignal[]>;
  saveQueueSnapshot(tenantId: string, items: AttentionItem[]): Promise<void>;
}

export interface ContractAssuranceService {
  assess(tenantId: string, invoiceId: string): Promise<InvoiceAssurance>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
