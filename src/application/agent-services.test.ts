import { describe, expect, it } from 'vitest';
import type { AgentDefinition, AgentWorkItem, ApprovalDecision, HumanAccountabilityAssignment } from '../domain/agents';
import { AgentRegistryService, HumanApprovalInboxService, WorkforceMissionControlService, type AgentRepository, type AgentWorkRepository } from './agent-services';

class MemoryAgentRepo implements AgentRepository {
  constructor(public agents: AgentDefinition[], public assignments: HumanAccountabilityAssignment[]) {}
  async listAgents(tenantId: string) { return this.agents.filter(a => a.tenantId === tenantId); }
  async getAgent(tenantId: string, agentId: string) { return this.agents.find(a => a.tenantId === tenantId && a.id === agentId) ?? null; }
  async saveAgent(agent: AgentDefinition) { this.agents = this.agents.filter(a => a.id !== agent.id); this.agents.push(agent); }
  async listAccountabilityAssignments(tenantId: string) { return this.assignments.filter(a => a.tenantId === tenantId); }
}

class MemoryWorkRepo implements AgentWorkRepository {
  approvals: ApprovalDecision[] = [];
  constructor(public items: AgentWorkItem[]) {}
  async listWorkItems(tenantId: string) { return this.items.filter(i => i.tenantId === tenantId); }
  async getWorkItem(tenantId: string, workItemId: string) { return this.items.find(i => i.tenantId === tenantId && i.id === workItemId) ?? null; }
  async saveWorkItem(item: AgentWorkItem) { this.items = this.items.filter(i => i.id !== item.id); this.items.push(item); }
  async listArtifacts() { return [{ id: 'a1', tenantId: 't1', workItemId: 'w1', producedByAgentId: 'agent1', accountableHumanUserId: 'human1', kind: 'code' as const, uri: 'git://pr/1', createdAt: '2026-08-07T00:00:00Z' }]; }
  async listApprovals(tenantId: string, workItemId: string) { return this.approvals.filter(a => a.tenantId === tenantId && a.workItemId === workItemId); }
  async saveApproval(decision: ApprovalDecision) { this.approvals.push(decision); }
}

const agent: AgentDefinition = {
  id: 'agent1', tenantId: 't1', name: 'Backend Alpha', department: 'engineering', role: 'backend_engineer',
  capabilities: ['code:generate', 'code:review'], humanAccountableUserId: 'human1', enabled: true,
  modelPolicyRef: 'policy://eng/default', maxAutonomy: 'execute_with_approval'
};

const workItem: AgentWorkItem = {
  id: 'w1', tenantId: 't1', projectId: 'p1', assignedAgentId: 'agent1', accountableHumanUserId: 'human1',
  title: 'Implement API', objective: 'Deliver endpoint', state: 'awaiting_review', inputEvidenceRefs: ['story:1'],
  outputArtifactRefs: ['git://pr/1'], requiredApprovalGates: ['code_review', 'merge_approval'],
  createdAt: '2026-08-07T00:00:00Z', updatedAt: '2026-08-07T00:00:00Z'
};

describe('agent registry', () => {
  it('rejects enabled agents without accountable humans', async () => {
    const repo = new MemoryAgentRepo([], []);
    const service = new AgentRegistryService(repo);
    await expect(service.register({ ...agent, humanAccountableUserId: '' })).rejects.toThrow('HUMAN_ACCOUNTABILITY_REQUIRED');
  });
});

describe('human approval inbox', () => {
  it('shows pending gates and blocks non-accountable approvers', async () => {
    const work = new MemoryWorkRepo([workItem]);
    const service = new HumanApprovalInboxService(work);
    const inbox = await service.listForHuman('t1', 'human1');
    expect(inbox[0]?.pendingGates).toEqual(['code_review', 'merge_approval']);

    await expect(service.decide({
      id: 'd1', tenantId: 't1', workItemId: 'w1', gate: 'code_review', humanUserId: 'intruder',
      decision: 'approved', rationale: 'looks fine', evidenceRefs: ['review:1'], decidedAt: '2026-08-07T01:00:00Z'
    })).rejects.toThrow('APPROVER_NOT_ACCOUNTABLE_HUMAN');
  });

  it('advances to approved only after every required gate is approved', async () => {
    const work = new MemoryWorkRepo([workItem]);
    const service = new HumanApprovalInboxService(work);
    for (const [id, gate] of [['d1','code_review'], ['d2','merge_approval']] as const) {
      await service.decide({ id, tenantId: 't1', workItemId: 'w1', gate, humanUserId: 'human1', decision: 'approved', rationale: 'approved with evidence', evidenceRefs: ['artifact:1'], decidedAt: '2026-08-07T01:00:00Z' });
    }
    expect((await work.getWorkItem('t1','w1'))?.state).toBe('approved');
  });
});

describe('workforce mission control', () => {
  it('summarizes agents, supervisors and work state', async () => {
    const agents = new MemoryAgentRepo([agent], [{ tenantId: 't1', humanUserId: 'human1', role: 'lead_engineer', accountableForAgentIds: ['agent1'], canApprove: ['code_review','merge_approval'] }]);
    const work = new MemoryWorkRepo([workItem, { ...workItem, id: 'w2', state: 'completed' }]);
    const summary = await new WorkforceMissionControlService(agents, work).summarize('t1');
    expect(summary.activeAgents).toBe(1);
    expect(summary.humanSupervisors).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.completionRatePct).toBe(50);
  });
});
