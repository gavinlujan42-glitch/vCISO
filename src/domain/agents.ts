export type AgentDepartment =
  | 'executive'
  | 'product'
  | 'architecture'
  | 'engineering'
  | 'quality'
  | 'security'
  | 'operations'
  | 'knowledge';

export type AgentRole =
  | 'executive_advisor'
  | 'chief_of_staff'
  | 'product_manager'
  | 'business_analyst'
  | 'solution_architect'
  | 'backend_engineer'
  | 'frontend_engineer'
  | 'data_engineer'
  | 'qa_engineer'
  | 'security_reviewer'
  | 'release_manager'
  | 'technical_writer';

export type HumanCounterpartRole =
  | 'executive_sponsor'
  | 'program_manager'
  | 'product_owner'
  | 'enterprise_architect'
  | 'engineering_manager'
  | 'lead_engineer'
  | 'qa_lead'
  | 'security_officer'
  | 'release_authority'
  | 'knowledge_manager';

export type AgentCapability =
  | 'requirements:analyze'
  | 'architecture:propose'
  | 'code:generate'
  | 'code:review'
  | 'test:generate'
  | 'test:execute'
  | 'security:analyze'
  | 'docs:generate'
  | 'release:recommend'
  | 'deploy:execute';

export interface HumanAccountabilityAssignment {
  tenantId: string;
  humanUserId: string;
  role: HumanCounterpartRole;
  accountableForAgentIds: string[];
  canApprove: ApprovalGateType[];
}

export interface AgentDefinition {
  id: string;
  tenantId: string;
  name: string;
  department: AgentDepartment;
  role: AgentRole;
  capabilities: AgentCapability[];
  humanAccountableUserId: string;
  supervisorAgentId?: string;
  enabled: boolean;
  modelPolicyRef: string;
  maxAutonomy: 'advisory' | 'execute_non_prod' | 'execute_with_approval';
}

export type WorkItemState =
  | 'queued'
  | 'in_progress'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'blocked';

export interface AgentWorkItem {
  id: string;
  tenantId: string;
  projectId: string;
  assignedAgentId: string;
  accountableHumanUserId: string;
  title: string;
  objective: string;
  state: WorkItemState;
  parentWorkItemId?: string;
  inputEvidenceRefs: string[];
  outputArtifactRefs: string[];
  requiredApprovalGates: ApprovalGateType[];
  createdAt: string;
  updatedAt: string;
}

export type ApprovalGateType =
  | 'requirements_acceptance'
  | 'architecture_approval'
  | 'code_review'
  | 'security_approval'
  | 'test_acceptance'
  | 'product_acceptance'
  | 'merge_approval'
  | 'production_deployment'
  | 'contract_acceptance';

export interface ApprovalDecision {
  id: string;
  tenantId: string;
  workItemId: string;
  gate: ApprovalGateType;
  humanUserId: string;
  decision: 'approved' | 'rejected';
  rationale: string;
  evidenceRefs: string[];
  decidedAt: string;
}

export interface AgentArtifact {
  id: string;
  tenantId: string;
  workItemId: string;
  producedByAgentId: string;
  accountableHumanUserId: string;
  kind: 'requirements' | 'architecture' | 'code' | 'test' | 'security_report' | 'documentation' | 'release_note';
  uri: string;
  checksum?: string;
  createdAt: string;
}

export function canAgentPerform(agent: AgentDefinition, capability: AgentCapability): boolean {
  return agent.enabled && agent.capabilities.includes(capability);
}

export function requiresHumanApproval(gate: ApprovalGateType): true {
  return true;
}

export function approvalsSatisfied(workItem: AgentWorkItem, decisions: ApprovalDecision[]): boolean {
  return workItem.requiredApprovalGates.every(gate =>
    decisions.some(d => d.workItemId === workItem.id && d.gate === gate && d.decision === 'approved')
  );
}

export function assertHumanAccountability(agent: AgentDefinition, workItem: AgentWorkItem): void {
  if (agent.tenantId !== workItem.tenantId) throw new Error('TENANT_BOUNDARY_VIOLATION');
  if (agent.id !== workItem.assignedAgentId) throw new Error('AGENT_ASSIGNMENT_MISMATCH');
  if (agent.humanAccountableUserId !== workItem.accountableHumanUserId) {
    throw new Error('HUMAN_ACCOUNTABILITY_MISMATCH');
  }
}
