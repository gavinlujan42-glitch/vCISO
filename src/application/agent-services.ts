import type {
  AgentArtifact,
  AgentDefinition,
  AgentWorkItem,
  ApprovalDecision,
  ApprovalGateType,
  HumanAccountabilityAssignment,
} from '../domain/agents';
import { approvalsSatisfied, assertHumanAccountability } from '../domain/agents';

export interface AgentRepository {
  listAgents(tenantId: string): Promise<AgentDefinition[]>;
  getAgent(tenantId: string, agentId: string): Promise<AgentDefinition | null>;
  saveAgent(agent: AgentDefinition): Promise<void>;
  listAccountabilityAssignments(tenantId: string): Promise<HumanAccountabilityAssignment[]>;
}

export interface AgentWorkRepository {
  listWorkItems(tenantId: string): Promise<AgentWorkItem[]>;
  getWorkItem(tenantId: string, workItemId: string): Promise<AgentWorkItem | null>;
  saveWorkItem(item: AgentWorkItem): Promise<void>;
  listArtifacts(tenantId: string, workItemId: string): Promise<AgentArtifact[]>;
  listApprovals(tenantId: string, workItemId: string): Promise<ApprovalDecision[]>;
  saveApproval(decision: ApprovalDecision): Promise<void>;
}

export interface ApprovalInboxItem {
  workItemId: string;
  title: string;
  accountableHumanUserId: string;
  pendingGates: ApprovalGateType[];
  artifactCount: number;
  agentId: string;
  state: AgentWorkItem['state'];
}

export interface WorkforceSummary {
  activeAgents: number;
  humanSupervisors: number;
  totalWorkItems: number;
  awaitingApproval: number;
  blocked: number;
  completed: number;
  completionRatePct: number;
}

export class AgentRegistryService {
  constructor(private readonly agents: AgentRepository) {}

  async list(tenantId: string): Promise<AgentDefinition[]> {
    return (await this.agents.listAgents(tenantId)).sort((a, b) =>
      a.department.localeCompare(b.department) || a.name.localeCompare(b.name)
    );
  }

  async register(agent: AgentDefinition): Promise<void> {
    if (!agent.humanAccountableUserId) throw new Error('HUMAN_ACCOUNTABILITY_REQUIRED');
    if (!agent.modelPolicyRef) throw new Error('MODEL_POLICY_REQUIRED');
    if (agent.capabilities.length === 0) throw new Error('AGENT_CAPABILITIES_REQUIRED');
    await this.agents.saveAgent(agent);
  }
}

export class HumanApprovalInboxService {
  constructor(private readonly work: AgentWorkRepository) {}

  async listForHuman(tenantId: string, humanUserId: string): Promise<ApprovalInboxItem[]> {
    const items = await this.work.listWorkItems(tenantId);
    const relevant = items.filter(
      item => item.accountableHumanUserId === humanUserId && ['awaiting_review', 'blocked'].includes(item.state)
    );

    const result: ApprovalInboxItem[] = [];
    for (const item of relevant) {
      const [approvals, artifacts] = await Promise.all([
        this.work.listApprovals(tenantId, item.id),
        this.work.listArtifacts(tenantId, item.id),
      ]);
      const approved = new Set(
        approvals.filter(a => a.decision === 'approved').map(a => a.gate)
      );
      const pendingGates = item.requiredApprovalGates.filter(gate => !approved.has(gate));
      result.push({
        workItemId: item.id,
        title: item.title,
        accountableHumanUserId: item.accountableHumanUserId,
        pendingGates,
        artifactCount: artifacts.length,
        agentId: item.assignedAgentId,
        state: item.state,
      });
    }
    return result.sort((a, b) => b.pendingGates.length - a.pendingGates.length);
  }

  async decide(input: ApprovalDecision): Promise<void> {
    const item = await this.work.getWorkItem(input.tenantId, input.workItemId);
    if (!item) throw new Error('WORK_ITEM_NOT_FOUND');
    if (input.humanUserId !== item.accountableHumanUserId) {
      throw new Error('APPROVER_NOT_ACCOUNTABLE_HUMAN');
    }
    if (!item.requiredApprovalGates.includes(input.gate)) {
      throw new Error('APPROVAL_GATE_NOT_REQUIRED');
    }
    if (!input.rationale.trim()) throw new Error('APPROVAL_RATIONALE_REQUIRED');
    await this.work.saveApproval(input);

    const approvals = [...(await this.work.listApprovals(input.tenantId, input.workItemId)), input];
    const nextState: AgentWorkItem['state'] =
      input.decision === 'rejected' ? 'rejected' : approvalsSatisfied(item, approvals) ? 'approved' : 'awaiting_review';
    await this.work.saveWorkItem({ ...item, state: nextState, updatedAt: input.decidedAt });
  }
}

export class WorkforceMissionControlService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly work: AgentWorkRepository,
  ) {}

  async summarize(tenantId: string): Promise<WorkforceSummary> {
    const [agents, workItems, assignments] = await Promise.all([
      this.agents.listAgents(tenantId),
      this.work.listWorkItems(tenantId),
      this.agents.listAccountabilityAssignments(tenantId),
    ]);
    const completed = workItems.filter(x => x.state === 'completed').length;
    return {
      activeAgents: agents.filter(a => a.enabled).length,
      humanSupervisors: new Set(assignments.map(a => a.humanUserId)).size,
      totalWorkItems: workItems.length,
      awaitingApproval: workItems.filter(x => x.state === 'awaiting_review').length,
      blocked: workItems.filter(x => x.state === 'blocked').length,
      completed,
      completionRatePct: workItems.length === 0 ? 0 : Math.round((completed / workItems.length) * 100),
    };
  }

  async assertAssignment(tenantId: string, workItemId: string): Promise<void> {
    const item = await this.work.getWorkItem(tenantId, workItemId);
    if (!item) throw new Error('WORK_ITEM_NOT_FOUND');
    const agent = await this.agents.getAgent(tenantId, item.assignedAgentId);
    if (!agent) throw new Error('AGENT_NOT_FOUND');
    assertHumanAccountability(agent, item);
  }
}
