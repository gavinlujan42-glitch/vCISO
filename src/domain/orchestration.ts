import type {
  AgentDefinition,
  AgentWorkItem,
  ApprovalDecision,
  ApprovalGateType,
  AgentArtifact,
} from './agents';
import { approvalsSatisfied, assertHumanAccountability, canAgentPerform } from './agents';

export interface OrchestrationContext {
  agents: AgentDefinition[];
  approvals: ApprovalDecision[];
  artifacts: AgentArtifact[];
}

export interface TransitionResult {
  workItem: AgentWorkItem;
  reasons: string[];
}

const consequentialGates: ApprovalGateType[] = [
  'architecture_approval',
  'security_approval',
  'product_acceptance',
  'merge_approval',
  'production_deployment',
  'contract_acceptance',
];

export function startAgentWork(
  workItem: AgentWorkItem,
  agent: AgentDefinition,
  requiredCapability: AgentDefinition['capabilities'][number]
): TransitionResult {
  assertHumanAccountability(agent, workItem);
  if (!canAgentPerform(agent, requiredCapability)) throw new Error('AGENT_CAPABILITY_DENIED');
  if (workItem.state !== 'queued' && workItem.state !== 'blocked') throw new Error('INVALID_WORK_STATE');

  return {
    workItem: { ...workItem, state: 'in_progress', updatedAt: new Date().toISOString() },
    reasons: [`${agent.name} authorized for ${requiredCapability}`],
  };
}

export function submitForHumanReview(
  workItem: AgentWorkItem,
  outputArtifactRefs: string[]
): TransitionResult {
  if (workItem.state !== 'in_progress') throw new Error('INVALID_WORK_STATE');
  if (outputArtifactRefs.length === 0) throw new Error('OUTPUT_EVIDENCE_REQUIRED');

  return {
    workItem: {
      ...workItem,
      state: 'awaiting_review',
      outputArtifactRefs: [...new Set([...workItem.outputArtifactRefs, ...outputArtifactRefs])],
      updatedAt: new Date().toISOString(),
    },
    reasons: ['Agent work submitted with traceable output artifacts'],
  };
}

export function recordHumanDecision(
  workItem: AgentWorkItem,
  gate: ApprovalGateType,
  humanUserId: string,
  decision: 'approved' | 'rejected',
  rationale: string,
  evidenceRefs: string[]
): ApprovalDecision {
  if (!humanUserId.trim()) throw new Error('HUMAN_APPROVER_REQUIRED');
  if (!rationale.trim()) throw new Error('APPROVAL_RATIONALE_REQUIRED');
  if (!workItem.requiredApprovalGates.includes(gate)) throw new Error('GATE_NOT_REQUIRED');

  return {
    id: crypto.randomUUID(),
    tenantId: workItem.tenantId,
    workItemId: workItem.id,
    gate,
    humanUserId,
    decision,
    rationale,
    evidenceRefs,
    decidedAt: new Date().toISOString(),
  };
}

export function finalizeWork(
  workItem: AgentWorkItem,
  context: OrchestrationContext
): TransitionResult {
  if (workItem.state !== 'awaiting_review') throw new Error('INVALID_WORK_STATE');
  const relevantApprovals = context.approvals.filter(a => a.workItemId === workItem.id);
  const rejected = relevantApprovals.find(a => a.decision === 'rejected');

  if (rejected) {
    return {
      workItem: { ...workItem, state: 'rejected', updatedAt: new Date().toISOString() },
      reasons: [`Rejected at ${rejected.gate}: ${rejected.rationale}`],
    };
  }

  if (!approvalsSatisfied(workItem, relevantApprovals)) {
    return {
      workItem,
      reasons: ['Required human approval gates remain outstanding'],
    };
  }

  const hasOutputs = context.artifacts.some(a => a.workItemId === workItem.id);
  if (!hasOutputs) throw new Error('ARTIFACT_EVIDENCE_REQUIRED');

  return {
    workItem: { ...workItem, state: 'completed', updatedAt: new Date().toISOString() },
    reasons: ['All human approval gates satisfied and output evidence recorded'],
  };
}

export function highRiskGates(workItem: AgentWorkItem): ApprovalGateType[] {
  return workItem.requiredApprovalGates.filter(g => consequentialGates.includes(g));
}
