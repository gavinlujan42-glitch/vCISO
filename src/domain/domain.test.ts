import { describe, expect, it } from 'vitest';
import { assertTenantBoundary, canManageBusinessUnit, hasPermission, type Principal } from './access.js';
import { isOverdue, remediationPriority, slaDueDate, type RemediationItem } from './remediation.js';
import { deliveryConfidence } from './engineering.js';
import { assessInvoice, type Invoice, type Milestone } from './contracts.js';
import { buildExecutiveAttentionQueue } from './attention.js';

describe('enterprise access boundaries', () => {
  const officer: Principal = { userId: 'u1', tenantId: 't1', roles: ['business_unit_security_officer'], businessUnitIds: ['bu1'] };

  it('allows assigned business-unit security remediation', () => {
    expect(hasPermission(officer, 'security:remediate')).toBe(true);
    expect(canManageBusinessUnit(officer, 'bu1')).toBe(true);
    expect(canManageBusinessUnit(officer, 'bu2')).toBe(false);
  });

  it('rejects cross-tenant access', () => {
    expect(() => assertTenantBoundary(officer, 't2')).toThrow('TENANT_BOUNDARY_VIOLATION');
  });
});

describe('remediation SLA', () => {
  const item: RemediationItem = {
    id: 'r1', tenantId: 't1', businessUnitId: 'bu1', ownerUserId: 'u1', title: 'Critical exposure', severity: 'critical',
    status: 'open', discoveredAt: '2026-08-01T00:00:00Z', dueAt: '2026-08-05T00:00:00Z', source: 'scanner', evidenceRefs: []
  };

  it('flags overdue critical remediation and boosts priority', () => {
    expect(isOverdue(item, new Date('2026-08-07T00:00:00Z'))).toBe(true);
    expect(remediationPriority(item, new Date('2026-08-07T00:00:00Z'))).toBe(145);
  });

  it('computes policy SLA due date', () => {
    expect(slaDueDate(new Date('2026-08-01T00:00:00Z'), 'critical').toISOString()).toBe('2026-08-08T00:00:00.000Z');
  });
});

describe('engineering delivery confidence', () => {
  it('rewards accepted stable delivery while penalizing rework', () => {
    const strong = deliveryConfidence({ acceptedWorkItems: 18, completedWorkItems: 20, firstPassAccepted: 17, reworkWorkItems: 2, deployments: 8, failedDeployments: 0 });
    const weak = deliveryConfidence({ acceptedWorkItems: 12, completedWorkItems: 20, firstPassAccepted: 8, reworkWorkItems: 8, deployments: 8, failedDeployments: 3 });
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThanOrEqual(85);
  });
});

describe('invoice assurance', () => {
  const invoice: Invoice = { id: 'i1', contractId: 'c1', vendorId: 'v1', amountCents: 100_000_00, state: 'submitted', milestoneIds: ['m1','m2'], submittedAt: '2026-08-07T00:00:00Z' };

  it('holds invoices when billed milestones are not accepted', () => {
    const milestones: Milestone[] = [
      { id: 'm1', sowId: 's1', name: 'API', amountCents: 50_000_00, acceptanceState: 'accepted', workItemRefs: ['A-1'], evidenceRefs: ['pr:1','deploy:7'] },
      { id: 'm2', sowId: 's1', name: 'UI', amountCents: 50_000_00, acceptanceState: 'submitted', workItemRefs: ['A-2'], evidenceRefs: ['pr:2'] }
    ];
    expect(assessInvoice(invoice, milestones).recommendation).toBe('hold');
  });

  it('approves only fully accepted evidence-backed milestones', () => {
    const milestones: Milestone[] = [
      { id: 'm1', sowId: 's1', name: 'API', amountCents: 50_000_00, acceptanceState: 'accepted', workItemRefs: ['A-1'], evidenceRefs: ['pr:1'] },
      { id: 'm2', sowId: 's1', name: 'UI', amountCents: 50_000_00, acceptanceState: 'accepted', workItemRefs: ['A-2'], evidenceRefs: ['pr:2'] }
    ];
    const result = assessInvoice(invoice, milestones);
    expect(result.recommendation).toBe('approve');
    expect(result.confidence).toBe(100);
  });
});

describe('executive attention queue', () => {
  it('puts critical overdue exposure ahead of lower-risk noise', () => {
    const queue = buildExecutiveAttentionQueue([
      { id: 'a', tenantId: 't1', category: 'delivery', title: 'Minor sprint slip', severity: 2, confidence: 90, ageHours: 8, evidenceRefs: ['story:1'], recommendedAction: 'Review sprint plan' },
      { id: 'b', tenantId: 't1', category: 'security', title: 'Critical vuln overdue', severity: 5, confidence: 98, ageHours: 72, overdue: true, financialExposureCents: 2_000_000_00, evidenceRefs: ['cve:1'], recommendedAction: 'Escalate remediation' }
    ]);
    expect(queue[0].id).toBe('b');
    expect(queue[0].priority).toBeGreaterThan(queue[1].priority);
  });
});
