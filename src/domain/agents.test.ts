import { describe, expect, it } from 'vitest';
import type { AgentArtifact, AgentDefinition, AgentWorkItem } from './agents';
import { approvalsSatisfied, assertHumanAccountability } from './agents';
import { finalizeWork, recordHumanDecision, startAgentWork, submitForHumanReview } from './orchestration';

const agent: AgentDefinition = {
  id: 'agent-backend-1',
  tenantId: 't1',
  name: 'Backend Engineer Agent 1',
  department: 'engineering',
  role: 'backend_engineer',
  capabilities: ['code:generate', 'test:generate'],
  humanAccountableUserId: 'human-lead-1',
  enabled: true,
  modelPolicyRef: 'model-policy/default-safe',
  maxAutonomy: 'execute_non_prod',
};

const work: AgentWorkItem = {
  id: 'work-1',
  tenantId: 't1',
  projectId: 'p1',
  assignedAgentId: agent.id,
  accountableHumanUserId: 'human-lead-1',
  title: 'Build invoice assurance API',
  objective: 'Implement the approved API contract',
  state: 'queued',
  inputEvidenceRefs: ['story:AEGIS-101'],
  outputArtifactRefs: [],
  requiredApprovalGates: ['code_review', 'security_approval', 'merge_approval'],
  createdAt: '2026-08-07T00:00:00Z',
  updatedAt: '2026-08-07T00:00:00Z',
};

describe('agent accountability', () => {
  it('rejects an agent/work item with different accountable humans', () => {
    expect(() => assertHumanAccountability(agent, { ...work, accountableHumanUserId: 'someone-else' }))
      .toThrow('HUMAN_ACCOUNTABILITY_MISMATCH');
  });

  it('allows bounded agent execution only for assigned capability', () => {
    expect(startAgentWork(work, agent, 'code:generate').workItem.state).toBe('in_progress');
    expect(() => startAgentWork(work, agent, 'deploy:execute')).toThrow('AGENT_CAPABILITY_DENIED');
  });
});

describe('human approval gates', () => {
  it('requires human identity and rationale for approval', () => {
    expect(() => recordHumanDecision(work, 'code_review', '', 'approved', 'Looks good', ['pr:1']))
      .toThrow('HUMAN_APPROVER_REQUIRED');
    expect(() => recordHumanDecision(work, 'code_review', 'human-lead-1', 'approved', '', ['pr:1']))
      .toThrow('APPROVAL_RATIONALE_REQUIRED');
  });

  it('does not complete work until every required human gate is approved', () => {
    const inProgress = startAgentWork(work, agent, 'code:generate').workItem;
    const awaiting = submitForHumanReview(inProgress, ['artifact:code-1']).workItem;
    const codeApproval = recordHumanDecision(awaiting, 'code_review', 'human-lead-1', 'approved', 'Reviewed implementation', ['pr:1']);
    expect(approvalsSatisfied(awaiting, [codeApproval])).toBe(false);

    const artifact: AgentArtifact = {
      id: 'artifact:code-1', tenantId: 't1', workItemId: awaiting.id, producedByAgentId: agent.id,
      accountableHumanUserId: 'human-lead-1', kind: 'code', uri: 'git://repo/commit/abc', createdAt: '2026-08-07T01:00:00Z'
    };

    const pending = finalizeWork(awaiting, { agents: [agent], approvals: [codeApproval], artifacts: [artifact] });
    expect(pending.workItem.state).toBe('awaiting_review');

    const security = recordHumanDecision(awaiting, 'security_approval', 'security-human-1', 'approved', 'No blocking findings', ['scan:44']);
    const merge = recordHumanDecision(awaiting, 'merge_approval', 'human-lead-1', 'approved', 'Ready for integration', ['pr:1']);
    const complete = finalizeWork(awaiting, { agents: [agent], approvals: [codeApproval, security, merge], artifacts: [artifact] });
    expect(complete.workItem.state).toBe('completed');
  });
});
