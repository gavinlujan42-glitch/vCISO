export type EngineeringEventType =
  | 'commit'
  | 'pull_request_opened'
  | 'pull_request_merged'
  | 'review_submitted'
  | 'build_completed'
  | 'test_completed'
  | 'deployment_completed'
  | 'issue_completed';

export interface EngineeringEvidenceEvent {
  id: string;
  tenantId: string;
  repository: string;
  actor: string;
  occurredAt: string;
  type: EngineeringEventType;
  workItemRefs: string[];
  sourceUrl?: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface PullRequestSnapshot {
  repository: string;
  number: number;
  author: string;
  openedAt: string;
  mergedAt?: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviewCount: number;
  approved: boolean;
  linkedWorkItems: string[];
}

export interface DeliverySignal {
  acceptedWorkItems: number;
  completedWorkItems: number;
  firstPassAccepted: number;
  reworkWorkItems: number;
  deployments: number;
  failedDeployments: number;
}

export function deliveryConfidence(signal: DeliverySignal): number {
  if (signal.completedWorkItems === 0) return 0;
  const acceptance = signal.acceptedWorkItems / signal.completedWorkItems;
  const firstPass = signal.firstPassAccepted / signal.completedWorkItems;
  const reworkRate = signal.reworkWorkItems / signal.completedWorkItems;
  const deploymentStability = signal.deployments === 0 ? 0.5 : 1 - Math.min(1, signal.failedDeployments / signal.deployments);
  const score = (acceptance * 0.35 + firstPass * 0.25 + (1 - reworkRate) * 0.2 + deploymentStability * 0.2) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
